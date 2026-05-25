// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
// import { ResultFlowService } from './result-flow.service';
// import { getCurrentActorStamp } from './actor-context.service';

// const nowIso = () => new Date().toISOString();

// export class ResultApprovalService {
//     private readonly flow = new ResultFlowService();

//     listPending(limit = 100) {
//         const db = getDb();
//         const rows = db
//             .prepare(
//                 `
//                 SELECT
//                     rws.*,
//                     ap.name AS policy_name,
//                     nr.machine_id,
//                     nr.protocol,
//                     nr.sample_id,
//                     nr.patient_id,
//                     nr.patient_name,
//                     nr.order_id,
//                     nr.test_code,
//                     nr.test_name,
//                     nr.value,
//                     nr.units,
//                     nr.reference_range,
//                     nr.abnormal_flag,
//                     nr.observed_at,
//                     nr.source_message_type,
//                     nr.summary AS result_summary,
//                     nr.data_json,
//                     m.name AS machine_name,
//                     m.code AS machine_code,
//                     l.id AS lab_id,
//                     l.name AS lab_name,
//                     l.code AS lab_code
//                 FROM result_workflow_status rws
//                 LEFT JOIN approval_policies ap ON ap.id = rws.approval_policy_id
//                 LEFT JOIN normalized_lab_results nr ON nr.id = rws.normalized_result_id
//                 LEFT JOIN machines m ON m.id = nr.machine_id
//                 LEFT JOIN labs l ON l.id = m.lab_id
//                 WHERE rws.status IN ('PENDING_APPROVAL', 'PENDING_POLICY', 'POLICY_DISABLED')
//                 ORDER BY rws.updated_at DESC, rws.created_at DESC
//                 LIMIT ?
//                 `,
//             )
//             .all(limit) as any[];

//         return rows.map((row) => ({
//             ...row,
//             parsed_result_data: this.tryParseJson(row.data_json),
//             route_targets: this.listPolicyTargets(row.approval_policy_id),
//         }));
//     }

//     listByResult(normalizedResultId: string) {
//         const db = getDb();
//         const rows = db
//             .prepare(
//                 `
//                 SELECT
//                     ra.*,
//                     ap.name AS policy_name
//                 FROM result_approvals ra
//                 LEFT JOIN approval_policies ap ON ap.id = ra.policy_id
//                 WHERE ra.normalized_result_id = ?
//                 ORDER BY ra.acted_at DESC, ra.step_order ASC
//                 `,
//             )
//             .all(normalizedResultId) as any[];

//         return rows.map((row) => ({
//             ...row,
//             approver_roles: this.tryParseJson(row.approver_roles_json) ?? [],
//             snapshot_result: this.tryParseJson(row.snapshot_result_json),
//             snapshot_policy: this.tryParseJson(row.snapshot_policy_json),
//             snapshot_route_targets: this.tryParseJson(row.snapshot_route_targets_json) ?? [],
//         }));
//     }

//     listAll(limit = 100) {
//         const db = getDb();
//         const rows = db
//             .prepare(
//                 `
//                 SELECT
//                     ra.*,
//                     ap.name AS policy_name
//                 FROM result_approvals ra
//                 LEFT JOIN approval_policies ap ON ap.id = ra.policy_id
//                 ORDER BY ra.acted_at DESC
//                 LIMIT ?
//                 `,
//             )
//             .all(limit) as any[];

//         return rows.map((row) => ({
//             ...row,
//             approver_roles: this.tryParseJson(row.approver_roles_json) ?? [],
//             snapshot_result: this.tryParseJson(row.snapshot_result_json),
//             snapshot_policy: this.tryParseJson(row.snapshot_policy_json),
//             snapshot_route_targets: this.tryParseJson(row.snapshot_route_targets_json) ?? [],
//         }));
//     }

//     approve(dto: {
//         normalizedResultId: string;
//         policyId: string;
//         stepOrder: number;
//         approverUserId: string;
//         comment?: string | null;
//     }) {
//         const db = getDb();
//         const actor = getCurrentActorStamp();
//         const workflow = this.requirePendingApprovalWorkflow(dto.normalizedResultId, dto.policyId);
//         this.ensureApproverHasNotActed(dto.normalizedResultId, dto.policyId, dto.approverUserId);

//         const snapshot = this.buildApprovalSnapshot(
//             dto.normalizedResultId,
//             dto.policyId,
//             dto.approverUserId,
//         );
//         const stepOrder = Number(workflow.approval_count_received ?? 0) + 1;

//         db.prepare(
//             `
//                 INSERT INTO result_approvals (
//                     id,
//                     normalized_result_id,
//                     policy_id,
//                     step_order,
//                     approver_user_id,
//                     approver_display_name,
//                     approver_username,
//                     approver_roles_json,
//                     action,
//                     comment,
//                     acted_at,
//                     snapshot_result_json,
//                     snapshot_policy_json,
//                     snapshot_route_targets_json,
//                     created_by_user_id,
//                     created_by_username,
//                     updated_by_user_id,
//                     updated_by_username
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             randomUUID(),
//             dto.normalizedResultId,
//             dto.policyId,
//             stepOrder,
//             dto.approverUserId,
//             snapshot.approver.displayName,
//             snapshot.approver.username,
//             JSON.stringify(snapshot.approver.roles ?? []),
//             dto.comment ?? null,
//             nowIso(),
//             JSON.stringify(snapshot.result),
//             JSON.stringify(snapshot.policy),
//             JSON.stringify(snapshot.routeTargets),
//             actor.userId,
//             actor.username,
//             actor.userId,
//             actor.username,
//         );

//         const nextCount = Number(workflow.approval_count_received ?? 0) + 1;
//         const required = Math.max(1, Number(workflow.approval_count_required ?? 1));

//         db.prepare(
//             `
//                 UPDATE result_workflow_status
//                 SET approval_count_received = ?,
//                     updated_at = ?,
//                     updated_by_user_id = ?,
//                     updated_by_username = ?
//                 WHERE normalized_result_id = ?
//             `,
//         ).run(nextCount, nowIso(), actor.userId, actor.username, dto.normalizedResultId);

//         if (nextCount >= required) {
//             const queueResult: any = this.flow.queueApprovedResult(dto.normalizedResultId, dto.policyId);
//             return {
//                 ok: true,
//                 finalApprovalReached: true,
//                 queuedCount: Number(queueResult?.queuedCount ?? 0),
//                 queueErrors: Array.isArray(queueResult?.errors) ? queueResult.errors : [],
//             };
//         }

//         return {
//             ok: true,
//             finalApprovalReached: false,
//             queuedCount: 0,
//             queueErrors: [],
//         };
//     }

//     reject(dto: {
//         normalizedResultId: string;
//         policyId: string;
//         stepOrder: number;
//         approverUserId: string;
//         comment?: string | null;
//     }) {
//         const db = getDb();
//         const actor = getCurrentActorStamp();
//         const workflow = this.requirePendingApprovalWorkflow(dto.normalizedResultId, dto.policyId);
//         this.ensureApproverHasNotActed(dto.normalizedResultId, dto.policyId, dto.approverUserId);

//         const snapshot = this.buildApprovalSnapshot(
//             dto.normalizedResultId,
//             dto.policyId,
//             dto.approverUserId,
//         );
//         const stepOrder = Number(workflow.approval_count_received ?? 0) + 1;

//         db.prepare(
//             `
//                 INSERT INTO result_approvals (
//                     id,
//                     normalized_result_id,
//                     policy_id,
//                     step_order,
//                     approver_user_id,
//                     approver_display_name,
//                     approver_username,
//                     approver_roles_json,
//                     action,
//                     comment,
//                     acted_at,
//                     snapshot_result_json,
//                     snapshot_policy_json,
//                     snapshot_route_targets_json,
//                     created_by_user_id,
//                     created_by_username,
//                     updated_by_user_id,
//                     updated_by_username
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REJECTED', ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             randomUUID(),
//             dto.normalizedResultId,
//             dto.policyId,
//             stepOrder,
//             dto.approverUserId,
//             snapshot.approver.displayName,
//             snapshot.approver.username,
//             JSON.stringify(snapshot.approver.roles ?? []),
//             dto.comment ?? null,
//             nowIso(),
//             JSON.stringify(snapshot.result),
//             JSON.stringify(snapshot.policy),
//             JSON.stringify(snapshot.routeTargets),
//             actor.userId,
//             actor.username,
//             actor.userId,
//             actor.username,
//         );

//         db.prepare(
//             `
//                 UPDATE result_workflow_status
//                 SET status = 'REJECTED',
//                     failed_at = ?,
//                     last_error = ?,
//                     updated_at = ?,
//                     updated_by_user_id = ?,
//                     updated_by_username = ?
//                 WHERE normalized_result_id = ?
//             `,
//         ).run(
//             nowIso(),
//             dto.comment?.trim() || 'Rejected by approver',
//             nowIso(),
//             actor.userId,
//             actor.username,
//             dto.normalizedResultId,
//         );

//         return {
//             ok: true,
//             finalApprovalReached: true,
//             queuedCount: 0,
//             queueErrors: [],
//         };
//     }

//     reevaluatePolicy(normalizedResultId: string) {
//         return this.flow.reevaluateHeldResult(normalizedResultId);
//     }

//     private requirePendingApprovalWorkflow(normalizedResultId: string, policyId: string) {
//         const db = getDb();
//         const workflow = db
//             .prepare(`SELECT * FROM result_workflow_status WHERE normalized_result_id = ? LIMIT 1`)
//             .get(normalizedResultId) as any;

//         if (!workflow) throw new Error('Workflow record not found');
//         if (workflow.status !== 'PENDING_APPROVAL') {
//             throw new Error('Result is not awaiting approval');
//         }
//         if (String(workflow.approval_policy_id ?? '') !== String(policyId ?? '')) {
//             throw new Error(
//                 'The approval policy for this result no longer matches the submitted action. Refresh and try again.',
//             );
//         }
//         return workflow;
//     }

//     private ensureApproverHasNotActed(
//         normalizedResultId: string,
//         policyId: string,
//         approverUserId: string,
//     ) {
//         const db = getDb();
//         const existing = db
//             .prepare(
//                 `
//                     SELECT action, acted_at
//                     FROM result_approvals
//                     WHERE normalized_result_id = ?
//                       AND policy_id = ?
//                       AND approver_user_id = ?
//                     ORDER BY acted_at DESC
//                     LIMIT 1
//                 `,
//             )
//             .get(normalizedResultId, policyId, approverUserId) as
//             | { action?: string | null; acted_at?: string | null }
//             | undefined;

//         if (existing) {
//             throw new Error(
//                 `This approver already recorded a ${String(existing.action ?? 'decision').toLowerCase()} action for this result on ${existing.acted_at ?? 'an earlier attempt'}.`,
//             );
//         }
//     }

//     private buildApprovalSnapshot(
//         normalizedResultId: string,
//         policyId: string,
//         approverUserId: string,
//     ) {
//         return {
//             result: this.getResultContext(normalizedResultId),
//             policy: this.getPolicyContext(policyId),
//             routeTargets: this.listPolicyTargets(policyId),
//             approver: this.getApproverContext(approverUserId),
//         };
//     }

//     private getResultContext(normalizedResultId: string) {
//         const db = getDb();
//         const row = db
//             .prepare(
//                 `
//                 SELECT
//                     nr.*,
//                     m.name AS machine_name,
//                     m.code AS machine_code,
//                     l.id AS lab_id,
//                     l.name AS lab_name,
//                     l.code AS lab_code
//                 FROM normalized_lab_results nr
//                 LEFT JOIN machines m ON m.id = nr.machine_id
//                 LEFT JOIN labs l ON l.id = m.lab_id
//                 WHERE nr.id = ?
//                 LIMIT 1
//                 `,
//             )
//             .get(normalizedResultId) as any;

//         if (!row) return null;
//         return {
//             ...row,
//             parsed_data: this.tryParseJson(row.data_json),
//         };
//     }

//     private getPolicyContext(policyId: string) {
//         const db = getDb();
//         const row = db
//             .prepare(`SELECT * FROM approval_policies WHERE id = ? LIMIT 1`)
//             .get(policyId) as any;

//         if (!row) return null;
//         return {
//             ...row,
//             route_targets: this.listPolicyTargets(policyId),
//         };
//     }

//     private listPolicyTargets(policyId?: string | null) {
//         if (!policyId) return [] as any[];
//         const db = getDb();
//         const rows = db
//             .prepare(
//                 `
//                 SELECT
//                     t.id,
//                     t.name,
//                     t.type,
//                     t.base_url,
//                     t.enabled
//                 FROM approval_policy_targets apt
//                 INNER JOIN targets t ON t.id = apt.target_id
//                 WHERE apt.policy_id = ?
//                 ORDER BY t.name ASC
//                 `,
//             )
//             .all(policyId) as any[];

//         if (rows.length) return rows;

//         return db
//             .prepare(
//                 `
//                 SELECT id, name, type, base_url, enabled
//                 FROM targets
//                 WHERE id = (SELECT applies_to_target_id FROM approval_policies WHERE id = ?)
//                 LIMIT 1
//                 `,
//             )
//             .all(policyId) as any[];
//     }

//     private getApproverContext(approverUserId: string) {
//         const db = getDb();
//         const user = db
//             .prepare(
//                 `
//                 SELECT id, username
//                 FROM users
//                 WHERE id = ? OR username = ?
//                 LIMIT 1
//                 `,
//             )
//             .get(approverUserId, approverUserId) as any;

//         if (!user) {
//             return {
//                 id: approverUserId,
//                 username: approverUserId,
//                 displayName: approverUserId,
//                 roles: [] as string[],
//             };
//         }

//         const roles = db
//             .prepare(
//                 `
//                 SELECT r.name
//                 FROM user_roles ur
//                 INNER JOIN roles r ON r.id = ur.role_id
//                 WHERE ur.user_id = ?
//                 ORDER BY r.name ASC
//                 `,
//             )
//             .all(user.id) as Array<{ name: string }>;

//         return {
//             id: user.id,
//             username: user.username,
//             displayName: user.username,
//             roles: roles.map((role) => role.name),
//         };
//     }

//     private tryParseJson(value: string | null | undefined) {
//         if (!value || !String(value).trim()) return null;
//         try {
//             return JSON.parse(value);
//         } catch {
//             return null;
//         }
//     }
// }


import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { ResultFlowService } from './result-flow.service';
import { getCurrentActorStamp } from './actor-context.service';

const nowIso = () => new Date().toISOString();

export class ResultApprovalService {
    private readonly flow = new ResultFlowService();

    listPending(limit = 100) {
        const db = getDb();
        const rows = db
            .prepare(
                `
                SELECT
                    rws.*,
                    ap.name AS policy_name,
                    nr.machine_id,
                    nr.protocol,
                    nr.sample_id,
                    nr.patient_id,
                    nr.patient_name,
                    nr.order_id,
                    nr.test_code,
                    nr.test_name,
                    nr.value,
                    nr.units,
                    nr.reference_range,
                    nr.abnormal_flag,
                    nr.observed_at,
                    nr.source_message_type,
                    nr.summary AS result_summary,
                    nr.data_json,
                    m.name AS machine_name,
                    m.code AS machine_code,
                    l.id AS lab_id,
                    l.name AS lab_name,
                    l.code AS lab_code
                FROM result_workflow_status rws
                LEFT JOIN approval_policies ap ON ap.id = rws.approval_policy_id
                LEFT JOIN normalized_lab_results nr ON nr.id = rws.normalized_result_id
                LEFT JOIN machines m ON m.id = nr.machine_id
                LEFT JOIN labs l ON l.id = m.lab_id
                WHERE rws.status IN ('PENDING_APPROVAL', 'PENDING_POLICY', 'POLICY_DISABLED')
                ORDER BY rws.updated_at DESC, rws.created_at DESC
                LIMIT ?
                `,
            )
            .all(limit) as any[];

        return rows.map((row) => ({
            ...row,
            parsed_result_data: this.tryParseJson(row.data_json),
            route_targets: this.listPolicyTargets(row.approval_policy_id),
            approval_actions: this.listDecisionSummary(row.normalized_result_id, row.approval_policy_id),
        }));
    }

    listByResult(normalizedResultId: string) {
        const db = getDb();
        const rows = db
            .prepare(
                `
                SELECT
                    ra.*,
                    ap.name AS policy_name
                FROM result_approvals ra
                LEFT JOIN approval_policies ap ON ap.id = ra.policy_id
                WHERE ra.normalized_result_id = ?
                ORDER BY ra.acted_at DESC, ra.step_order ASC
                `,
            )
            .all(normalizedResultId) as any[];

        return rows.map((row) => ({
            ...row,
            approver_roles: this.tryParseJson(row.approver_roles_json) ?? [],
            snapshot_result: this.tryParseJson(row.snapshot_result_json),
            snapshot_policy: this.tryParseJson(row.snapshot_policy_json),
            snapshot_route_targets: this.tryParseJson(row.snapshot_route_targets_json) ?? [],
        }));
    }

    listAll(limit = 100) {
        const db = getDb();
        const rows = db
            .prepare(
                `
                SELECT
                    ra.*,
                    ap.name AS policy_name
                FROM result_approvals ra
                LEFT JOIN approval_policies ap ON ap.id = ra.policy_id
                ORDER BY ra.acted_at DESC
                LIMIT ?
                `,
            )
            .all(limit) as any[];

        return rows.map((row) => ({
            ...row,
            approver_roles: this.tryParseJson(row.approver_roles_json) ?? [],
            snapshot_result: this.tryParseJson(row.snapshot_result_json),
            snapshot_policy: this.tryParseJson(row.snapshot_policy_json),
            snapshot_route_targets: this.tryParseJson(row.snapshot_route_targets_json) ?? [],
        }));
    }

    approve(dto: {
        normalizedResultId: string;
        policyId: string;
        stepOrder: number;
        approverUserId: string;
        comment?: string | null;
    }) {
        const db = getDb();
        const actor = getCurrentActorStamp();
        const existingDecision = this.findExistingDecision(
            dto.normalizedResultId,
            dto.policyId,
            dto.approverUserId,
        );
        if (existingDecision) {
            return this.alreadyRecordedResponse(existingDecision, dto.normalizedResultId, dto.policyId);
        }
        const workflow = this.requirePendingApprovalWorkflow(dto.normalizedResultId, dto.policyId);

        const snapshot = this.buildApprovalSnapshot(
            dto.normalizedResultId,
            dto.policyId,
            dto.approverUserId,
        );
        const stepOrder = Number(workflow.approval_count_received ?? 0) + 1;

        db.prepare(
            `
                INSERT INTO result_approvals (
                    id,
                    normalized_result_id,
                    policy_id,
                    step_order,
                    approver_user_id,
                    approver_display_name,
                    approver_username,
                    approver_roles_json,
                    action,
                    comment,
                    acted_at,
                    snapshot_result_json,
                    snapshot_policy_json,
                    snapshot_route_targets_json,
                    created_by_user_id,
                    created_by_username,
                    updated_by_user_id,
                    updated_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            randomUUID(),
            dto.normalizedResultId,
            dto.policyId,
            stepOrder,
            dto.approverUserId,
            snapshot.approver.displayName,
            snapshot.approver.username,
            JSON.stringify(snapshot.approver.roles ?? []),
            dto.comment ?? null,
            nowIso(),
            JSON.stringify(snapshot.result),
            JSON.stringify(snapshot.policy),
            JSON.stringify(snapshot.routeTargets),
            actor.userId,
            actor.username,
            actor.userId,
            actor.username,
        );

        const nextCount = Number(workflow.approval_count_received ?? 0) + 1;
        const required = Math.max(1, Number(workflow.approval_count_required ?? 1));

        db.prepare(
            `
                UPDATE result_workflow_status
                SET approval_count_received = ?,
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE normalized_result_id = ?
            `,
        ).run(nextCount, nowIso(), actor.userId, actor.username, dto.normalizedResultId);

        if (nextCount >= required) {
            const queueResult = this.flow.queueApprovedResult(dto.normalizedResultId, dto.policyId);
            return {
                ok: true,
                duplicate: false,
                action: 'APPROVED',
                workflowStatus: queueResult.status,
                finalApprovalReached: true,
                queuedCount: Number(queueResult.queuedCount ?? 0),
                queueErrors: Array.isArray(queueResult.errors) ? queueResult.errors : [],
                message:
                    Number(queueResult.queuedCount ?? 0) > 0
                        ? 'Result approved and moved to outbound queue.'
                        : 'Result approved. Queueing did not create a new queue item; review workflow notes for routing details.',
            };
        }

        return {
            ok: true,
            duplicate: false,
            action: 'APPROVED',
            workflowStatus: 'PENDING_APPROVAL',
            finalApprovalReached: false,
            queuedCount: 0,
            queueErrors: [],
            message: 'Approval recorded. Waiting for another approver.',
        };
    }

    reject(dto: {
        normalizedResultId: string;
        policyId: string;
        stepOrder: number;
        approverUserId: string;
        comment?: string | null;
    }) {
        const db = getDb();
        const actor = getCurrentActorStamp();
        const existingDecision = this.findExistingDecision(
            dto.normalizedResultId,
            dto.policyId,
            dto.approverUserId,
        );
        if (existingDecision) {
            return this.alreadyRecordedResponse(existingDecision, dto.normalizedResultId, dto.policyId);
        }
        const workflow = this.requirePendingApprovalWorkflow(dto.normalizedResultId, dto.policyId);

        const snapshot = this.buildApprovalSnapshot(
            dto.normalizedResultId,
            dto.policyId,
            dto.approverUserId,
        );
        const stepOrder = Number(workflow.approval_count_received ?? 0) + 1;

        db.prepare(
            `
                INSERT INTO result_approvals (
                    id,
                    normalized_result_id,
                    policy_id,
                    step_order,
                    approver_user_id,
                    approver_display_name,
                    approver_username,
                    approver_roles_json,
                    action,
                    comment,
                    acted_at,
                    snapshot_result_json,
                    snapshot_policy_json,
                    snapshot_route_targets_json,
                    created_by_user_id,
                    created_by_username,
                    updated_by_user_id,
                    updated_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'REJECTED', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            randomUUID(),
            dto.normalizedResultId,
            dto.policyId,
            stepOrder,
            dto.approverUserId,
            snapshot.approver.displayName,
            snapshot.approver.username,
            JSON.stringify(snapshot.approver.roles ?? []),
            dto.comment ?? null,
            nowIso(),
            JSON.stringify(snapshot.result),
            JSON.stringify(snapshot.policy),
            JSON.stringify(snapshot.routeTargets),
            actor.userId,
            actor.username,
            actor.userId,
            actor.username,
        );

        db.prepare(
            `
                UPDATE result_workflow_status
                SET status = 'REJECTED',
                    failed_at = ?,
                    last_error = ?,
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE normalized_result_id = ?
            `,
        ).run(
            nowIso(),
            dto.comment?.trim() || 'Rejected by approver',
            nowIso(),
            actor.userId,
            actor.username,
            dto.normalizedResultId,
        );

        return {
            ok: true,
            duplicate: false,
            action: 'REJECTED',
            workflowStatus: 'REJECTED',
            finalApprovalReached: true,
            queuedCount: 0,
            queueErrors: [],
            message: 'Result rejected and removed from pending approvals.',
        };
    }

    reevaluatePolicy(normalizedResultId: string) {
        return this.flow.reevaluateHeldResult(normalizedResultId);
    }

    private requirePendingApprovalWorkflow(normalizedResultId: string, policyId: string) {
        const db = getDb();
        const workflow = db
            .prepare(`SELECT * FROM result_workflow_status WHERE normalized_result_id = ? LIMIT 1`)
            .get(normalizedResultId) as any;

        if (!workflow) throw new Error('Workflow record not found');
        if (workflow.status !== 'PENDING_APPROVAL') {
            throw new Error('Result is not awaiting approval');
        }
        if (String(workflow.approval_policy_id ?? '') !== String(policyId ?? '')) {
            throw new Error(
                'The approval policy for this result no longer matches the submitted action. Refresh and try again.',
            );
        }
        return workflow;
    }

    private listDecisionSummary(normalizedResultId: string, policyId?: string | null) {
        if (!normalizedResultId || !policyId) return [] as any[];
        const db = getDb();
        return db
            .prepare(
                `
                    SELECT
                        approver_user_id,
                        approver_username,
                        approver_display_name,
                        action,
                        acted_at
                    FROM result_approvals
                    WHERE normalized_result_id = ?
                      AND policy_id = ?
                    ORDER BY acted_at DESC
                `,
            )
            .all(normalizedResultId, policyId) as any[];
    }

    private findExistingDecision(
        normalizedResultId: string,
        policyId: string,
        approverUserId: string,
    ) {
        const db = getDb();
        return db
            .prepare(
                `
                    SELECT action, acted_at
                    FROM result_approvals
                    WHERE normalized_result_id = ?
                      AND policy_id = ?
                      AND approver_user_id = ?
                    ORDER BY acted_at DESC
                    LIMIT 1
                `,
            )
            .get(normalizedResultId, policyId, approverUserId) as
            | { action?: string | null; acted_at?: string | null }
            | undefined;
    }

    private alreadyRecordedResponse(
        existing: { action?: string | null; acted_at?: string | null },
        normalizedResultId: string,
        policyId: string,
    ) {
        const workflow = this.getWorkflowStatus(normalizedResultId);
        const action = String(existing.action ?? 'decision').toUpperCase();
        const displayAction = action === 'APPROVED' ? 'approved' : action === 'REJECTED' ? 'rejected' : 'decided on';
        return {
            ok: true,
            duplicate: true,
            action,
            workflowStatus: workflow?.status ?? null,
            finalApprovalReached: !['PENDING_APPROVAL', 'PENDING_POLICY', 'POLICY_DISABLED'].includes(
                String(workflow?.status ?? ''),
            ),
            queuedCount: workflow?.status === 'QUEUED' ? 1 : 0,
            queueErrors: [],
            message: `You already ${displayAction} this result${existing.acted_at ? ` on ${existing.acted_at}` : ''}.`,
            approval_actions: this.listDecisionSummary(normalizedResultId, policyId),
        };
    }

    private getWorkflowStatus(normalizedResultId: string) {
        return getDb()
            .prepare(
                `
                    SELECT status, approval_count_required, approval_count_received, queued_at, last_error
                    FROM result_workflow_status
                    WHERE normalized_result_id = ?
                    LIMIT 1
                `,
            )
            .get(normalizedResultId) as any;
    }

    private buildApprovalSnapshot(
        normalizedResultId: string,
        policyId: string,
        approverUserId: string,
    ) {
        return {
            result: this.getResultContext(normalizedResultId),
            policy: this.getPolicyContext(policyId),
            routeTargets: this.listPolicyTargets(policyId),
            approver: this.getApproverContext(approverUserId),
        };
    }

    private getResultContext(normalizedResultId: string) {
        const db = getDb();
        const row = db
            .prepare(
                `
                SELECT
                    nr.*,
                    m.name AS machine_name,
                    m.code AS machine_code,
                    l.id AS lab_id,
                    l.name AS lab_name,
                    l.code AS lab_code
                FROM normalized_lab_results nr
                LEFT JOIN machines m ON m.id = nr.machine_id
                LEFT JOIN labs l ON l.id = m.lab_id
                WHERE nr.id = ?
                LIMIT 1
                `,
            )
            .get(normalizedResultId) as any;

        if (!row) return null;
        return {
            ...row,
            parsed_data: this.tryParseJson(row.data_json),
        };
    }

    private getPolicyContext(policyId: string) {
        const db = getDb();
        const row = db
            .prepare(`SELECT * FROM approval_policies WHERE id = ? LIMIT 1`)
            .get(policyId) as any;

        if (!row) return null;
        return {
            ...row,
            route_targets: this.listPolicyTargets(policyId),
        };
    }

    private listPolicyTargets(policyId?: string | null) {
        if (!policyId) return [] as any[];
        const db = getDb();
        const rows = db
            .prepare(
                `
                SELECT
                    t.id,
                    t.name,
                    t.type,
                    t.base_url,
                    t.enabled
                FROM approval_policy_targets apt
                INNER JOIN targets t ON t.id = apt.target_id
                WHERE apt.policy_id = ?
                ORDER BY t.name ASC
                `,
            )
            .all(policyId) as any[];

        if (rows.length) return rows;

        return db
            .prepare(
                `
                SELECT id, name, type, base_url, enabled
                FROM targets
                WHERE id = (SELECT applies_to_target_id FROM approval_policies WHERE id = ?)
                LIMIT 1
                `,
            )
            .all(policyId) as any[];
    }

    private getApproverContext(approverUserId: string) {
        const db = getDb();
        const user = db
            .prepare(
                `
                SELECT id, username
                FROM users
                WHERE id = ? OR username = ?
                LIMIT 1
                `,
            )
            .get(approverUserId, approverUserId) as any;

        if (!user) {
            return {
                id: approverUserId,
                username: approverUserId,
                displayName: approverUserId,
                roles: [] as string[],
            };
        }

        const roles = db
            .prepare(
                `
                SELECT r.name
                FROM user_roles ur
                INNER JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                ORDER BY r.name ASC
                `,
            )
            .all(user.id) as Array<{ name: string }>;

        return {
            id: user.id,
            username: user.username,
            displayName: user.username,
            roles: roles.map((role) => role.name),
        };
    }

    private tryParseJson(value: string | null | undefined) {
        if (!value || !String(value).trim()) return null;
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }
}

