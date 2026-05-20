"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultFlowService = void 0;
const db_1 = require("../db/db");
const approval_policy_service_1 = require("./approval-policy.service");
const outbound_queue_service_1 = require("./outbound-queue.service");
const actor_context_service_1 = require("./actor-context.service");
const nowIso = () => new Date().toISOString();
class ResultFlowService {
    approvals = new approval_policy_service_1.ApprovalPolicyService();
    queue = new outbound_queue_service_1.OutboundQueueService();
    advanceAfterNormalization(normalizedResultId) {
        const db = (0, db_1.getDb)();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const row = db
            .prepare(`
          SELECT nr.id, nr.machine_id, m.lab_id
          FROM normalized_lab_results nr
          LEFT JOIN machines m ON m.id = nr.machine_id
          WHERE nr.id = ?
          LIMIT 1
        `)
            .get(normalizedResultId);
        if (!row) {
            throw new Error('Normalized result not found for workflow advancement.');
        }
        const resolution = this.approvals.resolvePolicyContextForResult({
            labId: row.lab_id ?? null,
            machineId: row.machine_id,
        });
        if (resolution.matchStatus === 'NO_MATCH' || !resolution.policy) {
            this.upsertWorkflow(normalizedResultId, {
                status: 'PENDING_POLICY',
                approval_policy_id: null,
                approval_required: 0,
                approval_count_required: 0,
                approval_count_received: 0,
                queued_at: null,
                routed_at: null,
                failed_at: null,
                last_error: 'No matching approval policy was found for this result. Configure and enable a policy, then re-check the policy from Pending Approvals.',
                updated_at: nowIso(),
                created_by_user_id: actor.userId,
                created_by_username: actor.username,
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { status: 'PENDING_POLICY', queuedCount: 0 };
        }
        const policy = resolution.policy;
        const routeTargetIds = resolution.routeTargetIds;
        if (resolution.matchStatus === 'DISABLED_MATCH') {
            this.upsertWorkflow(normalizedResultId, {
                status: 'POLICY_DISABLED',
                approval_policy_id: policy.id,
                approval_required: Number(policy.requires_approval ?? 0) === 1 ? 1 : 0,
                approval_count_required: Number(policy.requires_approval ?? 0) === 1
                    ? Math.max(1, Number(policy.min_approvals ?? 1))
                    : 0,
                approval_count_received: 0,
                queued_at: null,
                routed_at: null,
                failed_at: null,
                last_error: 'A matching approval policy exists but is disabled. Enable the policy, then re-check the policy from Pending Approvals.',
                updated_at: nowIso(),
                created_by_user_id: actor.userId,
                created_by_username: actor.username,
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { status: 'POLICY_DISABLED', queuedCount: 0 };
        }
        if (Number(policy.requires_approval ?? 0) === 1) {
            this.upsertWorkflow(normalizedResultId, {
                status: 'PENDING_APPROVAL',
                approval_policy_id: policy.id,
                approval_required: 1,
                approval_count_required: Math.max(1, Number(policy.min_approvals ?? 1)),
                approval_count_received: 0,
                queued_at: null,
                routed_at: null,
                failed_at: null,
                last_error: routeTargetIds.length
                    ? null
                    : 'Approval is required. Configure the policy target before final routing can proceed.',
                updated_at: nowIso(),
                created_by_user_id: actor.userId,
                created_by_username: actor.username,
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { status: 'PENDING_APPROVAL', queuedCount: 0 };
        }
        if (!routeTargetIds.length) {
            this.upsertWorkflow(normalizedResultId, {
                status: 'PENDING_POLICY',
                approval_policy_id: policy.id,
                approval_required: 0,
                approval_count_required: 0,
                approval_count_received: 0,
                queued_at: null,
                routed_at: null,
                failed_at: null,
                last_error: 'Auto-route is allowed, but no target is configured on the matched policy. Update the policy, then re-check it from Pending Approvals.',
                updated_at: nowIso(),
                created_by_user_id: actor.userId,
                created_by_username: actor.username,
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { status: 'PENDING_POLICY', queuedCount: 0 };
        }
        const queuedCount = this.queueTargets(normalizedResultId, routeTargetIds);
        if (queuedCount > 0) {
            this.upsertWorkflow(normalizedResultId, {
                status: 'QUEUED',
                approval_policy_id: policy.id,
                approval_required: 0,
                approval_count_required: 0,
                approval_count_received: 0,
                queued_at: nowIso(),
                routed_at: null,
                failed_at: null,
                last_error: null,
                updated_at: nowIso(),
                created_by_user_id: actor.userId,
                created_by_username: actor.username,
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { status: 'QUEUED', queuedCount };
        }
        this.upsertWorkflow(normalizedResultId, {
            status: 'PENDING_POLICY',
            approval_policy_id: policy.id,
            approval_required: 0,
            approval_count_required: 0,
            approval_count_received: 0,
            queued_at: null,
            routed_at: null,
            failed_at: null,
            last_error: 'The configured policy target is not currently enabled for queueing.',
            updated_at: nowIso(),
            created_by_user_id: actor.userId,
            created_by_username: actor.username,
            updated_by_user_id: actor.userId,
            updated_by_username: actor.username,
        });
        return { status: 'PENDING_POLICY', queuedCount: 0 };
    }
    reevaluateHeldResult(normalizedResultId) {
        const db = (0, db_1.getDb)();
        const workflow = db
            .prepare(`SELECT status FROM result_workflow_status WHERE normalized_result_id = ? LIMIT 1`)
            .get(normalizedResultId);
        if (!workflow)
            throw new Error('Workflow record not found');
        if (!['PENDING_POLICY', 'POLICY_DISABLED', 'PENDING_APPROVAL'].includes(String(workflow.status ?? ''))) {
            throw new Error('This result is not waiting for policy re-evaluation.');
        }
        return this.advanceAfterNormalization(normalizedResultId);
    }
    queueApprovedResult(normalizedResultId, policyId) {
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const workflow = (0, db_1.getDb)()
            .prepare(`
          SELECT approval_count_required, approval_count_received
          FROM result_workflow_status
          WHERE normalized_result_id = ?
          LIMIT 1
        `)
            .get(normalizedResultId);
        const targetIds = this.approvals.listPolicyTargetIds(policyId);
        const queuedCount = this.queueTargets(normalizedResultId, targetIds);
        this.upsertWorkflow(normalizedResultId, {
            status: queuedCount > 0 ? 'QUEUED' : 'APPROVED',
            approval_policy_id: policyId,
            approval_required: 1,
            approval_count_required: Number(workflow?.approval_count_required ?? 1),
            approval_count_received: Number(workflow?.approval_count_received ?? 1),
            queued_at: queuedCount > 0 ? nowIso() : null,
            routed_at: null,
            failed_at: null,
            last_error: queuedCount > 0
                ? null
                : 'Approval completed, but the policy has no enabled routing targets configured. Update the policy targets and re-check when needed.',
            updated_at: nowIso(),
            updated_by_user_id: actor.userId,
            updated_by_username: actor.username,
        });
        return queuedCount;
    }
    queueTargets(normalizedResultId, targetIds) {
        const db = (0, db_1.getDb)();
        const uniqueIds = Array.from(new Set((targetIds ?? []).filter(Boolean)));
        if (!uniqueIds.length)
            return 0;
        const placeholders = uniqueIds.map(() => '?').join(', ');
        const targets = db
            .prepare(`SELECT id FROM targets WHERE enabled = 1 AND id IN (${placeholders}) ORDER BY type ASC, name ASC`)
            .all(...uniqueIds);
        let queuedCount = 0;
        for (const target of targets) {
            const queued = this.queue.enqueueNormalizedResult(normalizedResultId, target.id);
            if (queued)
                queuedCount += 1;
        }
        return queuedCount;
    }
    upsertWorkflow(normalizedResultId, patch) {
        const db = (0, db_1.getDb)();
        const existing = db
            .prepare(`SELECT id FROM result_workflow_status WHERE normalized_result_id = ? LIMIT 1`)
            .get(normalizedResultId);
        if (existing?.id) {
            db.prepare(`
          UPDATE result_workflow_status SET
            status = COALESCE(@status, status),
            approval_policy_id = @approval_policy_id,
            approval_required = COALESCE(@approval_required, approval_required),
            approval_count_required = COALESCE(@approval_count_required, approval_count_required),
            approval_count_received = COALESCE(@approval_count_received, approval_count_received),
            queued_at = @queued_at,
            routed_at = @routed_at,
            failed_at = @failed_at,
            last_error = @last_error,
            updated_at = COALESCE(@updated_at, updated_at),
            updated_by_user_id = COALESCE(@updated_by_user_id, updated_by_user_id),
            updated_by_username = COALESCE(@updated_by_username, updated_by_username)
          WHERE normalized_result_id = @normalized_result_id
        `).run({ normalized_result_id: normalizedResultId, ...patch });
            return;
        }
        const id = `${normalizedResultId}-workflow`;
        db.prepare(`
        INSERT INTO result_workflow_status (
          id,
          normalized_result_id,
          status,
          approval_policy_id,
          approval_required,
          approval_count_required,
          approval_count_received,
          queued_at,
          routed_at,
          failed_at,
          last_error,
          created_at,
          updated_at,
          created_by_user_id,
          created_by_username,
          updated_by_user_id,
          updated_by_username
        ) VALUES (
          @id,
          @normalized_result_id,
          @status,
          @approval_policy_id,
          COALESCE(@approval_required, 0),
          COALESCE(@approval_count_required, 0),
          COALESCE(@approval_count_received, 0),
          @queued_at,
          @routed_at,
          @failed_at,
          @last_error,
          COALESCE(@created_at, @updated_at, '${nowIso()}'),
          COALESCE(@updated_at, '${nowIso()}'),
          @created_by_user_id,
          @created_by_username,
          @updated_by_user_id,
          @updated_by_username
        )
      `).run({
            id,
            normalized_result_id: normalizedResultId,
            created_at: patch.created_at ?? patch.updated_at ?? nowIso(),
            ...patch,
        });
    }
}
exports.ResultFlowService = ResultFlowService;
