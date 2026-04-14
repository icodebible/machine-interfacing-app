"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApprovalPolicyService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const actor_context_service_1 = require("./actor-context.service");
const nowIso = () => new Date().toISOString();
class ApprovalPolicyService {
    list() {
        const db = (0, db_1.getDb)();
        const rows = db
            .prepare(`
                    SELECT *
                    FROM approval_policies
                    ORDER BY name ASC, updated_at DESC
                `)
            .all();
        return rows.map((row) => ({
            ...row,
            route_target_ids: this.listPolicyTargetIds(row.id),
        }));
    }
    create(dto) {
        const db = (0, db_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const prepared = this.prepareWriteValues(dto);
        db.prepare(`
                INSERT INTO approval_policies (
                    id,
                    name,
                    enabled,
                    applies_to_lab_id,
                    applies_to_machine_id,
                    applies_to_target_id,
                    requires_approval,
                    min_approvals,
                    created_at,
                    updated_at,
                    created_by_user_id,
                    created_by_username,
                    updated_by_user_id,
                    updated_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, prepared.name, prepared.enabled, prepared.applies_to_lab_id, prepared.applies_to_machine_id, prepared.primaryTargetId, prepared.requires_approval, prepared.min_approvals, ts, ts, actor.userId, actor.username, actor.userId, actor.username);
        this.syncPolicyTargets(id, prepared.route_target_ids, ts);
        return { id };
    }
    update(id, dto) {
        const db = (0, db_1.getDb)();
        const ts = nowIso();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const current = this.getById(id);
        if (!current)
            throw new Error('Approval policy not found');
        const prepared = this.prepareWriteValues(dto, current);
        const res = db
            .prepare(`
                    UPDATE approval_policies
                    SET name = ?,
                        enabled = ?,
                        applies_to_lab_id = ?,
                        applies_to_machine_id = ?,
                        applies_to_target_id = ?,
                        requires_approval = ?,
                        min_approvals = ?,
                        updated_at = ?,
                        updated_by_user_id = ?,
                        updated_by_username = ?
                    WHERE id = ?
                `)
            .run(prepared.name, prepared.enabled, prepared.applies_to_lab_id, prepared.applies_to_machine_id, prepared.primaryTargetId, prepared.requires_approval, prepared.min_approvals, ts, actor.userId, actor.username, id);
        if (res.changes !== 1)
            throw new Error('Approval policy not found');
        this.syncPolicyTargets(id, prepared.route_target_ids, ts);
        return true;
    }
    delete(id) {
        const db = (0, db_1.getDb)();
        db.prepare(`DELETE FROM approval_policy_targets WHERE policy_id = ?`).run(id);
        db.prepare(`DELETE FROM approval_policies WHERE id = ?`).run(id);
        return true;
    }
    getById(id) {
        const db = (0, db_1.getDb)();
        const row = db
            .prepare(`
                    SELECT *
                    FROM approval_policies
                    WHERE id = ?
                    LIMIT 1
                `)
            .get(id);
        if (!row)
            return null;
        return {
            ...row,
            route_target_ids: this.listPolicyTargetIds(id),
        };
    }
    listPolicyTargetIds(policyId) {
        const db = (0, db_1.getDb)();
        const rows = db
            .prepare(`
                    SELECT target_id
                    FROM approval_policy_targets
                    WHERE policy_id = ?
                    ORDER BY created_at ASC, target_id ASC
                `)
            .all(policyId);
        const ids = rows.map((row) => row.target_id).filter(Boolean);
        if (ids.length)
            return Array.from(new Set(ids));
        const legacy = db
            .prepare(`SELECT applies_to_target_id FROM approval_policies WHERE id = ? LIMIT 1`)
            .get(policyId);
        return legacy?.applies_to_target_id ? [legacy.applies_to_target_id] : [];
    }
    resolveForResult(args) {
        const resolution = this.resolvePolicyContextForResult({
            labId: args.labId ?? null,
            machineId: args.machineId ?? null,
        });
        return resolution.matchStatus === 'ENABLED_MATCH' ? resolution.policy : null;
    }
    resolvePolicyContextForResult(args) {
        const db = (0, db_1.getDb)();
        const matched = db
            .prepare(`
                    SELECT *
                    FROM approval_policies
                    WHERE (applies_to_lab_id = ? OR applies_to_lab_id IS NULL)
                      AND (applies_to_machine_id = ? OR applies_to_machine_id IS NULL)
                    ORDER BY
                        (applies_to_machine_id IS NOT NULL) DESC,
                        (applies_to_lab_id IS NOT NULL) DESC,
                        updated_at DESC,
                        name ASC,
                        id ASC
                    LIMIT 1
                `)
            .get(args.labId ?? null, args.machineId ?? null);
        if (!matched) {
            return {
                policy: null,
                matchStatus: 'NO_MATCH',
                routeTargetIds: [],
            };
        }
        const routeTargetIds = this.listPolicyTargetIds(matched.id);
        return {
            policy: {
                ...matched,
                route_target_ids: routeTargetIds,
            },
            matchStatus: matched.enabled === 1 ? 'ENABLED_MATCH' : 'DISABLED_MATCH',
            routeTargetIds,
        };
    }
    syncPolicyTargets(policyId, targetIds, ts) {
        const db = (0, db_1.getDb)();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const uniqueIds = Array.from(new Set((targetIds ?? []).filter(Boolean)));
        const tx = db.transaction(() => {
            db.prepare(`DELETE FROM approval_policy_targets WHERE policy_id = ?`).run(policyId);
            if (!uniqueIds.length)
                return;
            const stmt = db.prepare(`
                    INSERT INTO approval_policy_targets (
                        policy_id,
                        target_id,
                        created_at,
                        updated_at,
                        created_by_user_id,
                        created_by_username,
                        updated_by_user_id,
                        updated_by_username
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `);
            for (const targetId of uniqueIds) {
                stmt.run(policyId, targetId, ts, ts, actor.userId, actor.username, actor.userId, actor.username);
            }
        });
        tx();
    }
    prepareWriteValues(dto, current) {
        const name = String(dto.name ?? current?.name ?? '').trim();
        if (!name)
            throw new Error('Approval policy name is required.');
        const enabled = Number(dto.enabled ?? current?.enabled ?? 1) === 1 ? 1 : 0;
        const requiresApproval = Number(dto.requires_approval ?? current?.requires_approval ?? 0) === 1 ? 1 : 0;
        const rawMinApprovals = Number(dto.min_approvals ?? current?.min_approvals ?? (requiresApproval === 1 ? 1 : 0));
        const minApprovals = requiresApproval === 1 ? Math.max(1, rawMinApprovals || 1) : 0;
        const routeTargetIds = this.normalizeTargetIds(dto, current?.route_target_ids ?? []);
        return {
            name,
            enabled,
            applies_to_lab_id: Object.prototype.hasOwnProperty.call(dto, 'applies_to_lab_id')
                ? dto.applies_to_lab_id ?? null
                : current?.applies_to_lab_id ?? null,
            applies_to_machine_id: Object.prototype.hasOwnProperty.call(dto, 'applies_to_machine_id')
                ? dto.applies_to_machine_id ?? null
                : current?.applies_to_machine_id ?? null,
            requires_approval: requiresApproval,
            min_approvals: minApprovals,
            route_target_ids: routeTargetIds,
            primaryTargetId: routeTargetIds[0] ?? null,
        };
    }
    normalizeTargetIds(dto, fallback = []) {
        const explicitRouteTargets = Array.isArray(dto.route_target_ids)
            ? dto.route_target_ids
            : undefined;
        if (explicitRouteTargets) {
            return Array.from(new Set(explicitRouteTargets.filter(Boolean)));
        }
        if (Object.prototype.hasOwnProperty.call(dto, 'applies_to_target_id')) {
            return dto.applies_to_target_id ? [dto.applies_to_target_id] : [];
        }
        return Array.from(new Set(fallback.filter(Boolean)));
    }
}
exports.ApprovalPolicyService = ApprovalPolicyService;
