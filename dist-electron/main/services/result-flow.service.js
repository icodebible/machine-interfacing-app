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
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const row = this.getResultRoutingContext(normalizedResultId);
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
                last_error: 'No matching approval policy was found for this result. Configure and enable a policy, then re-check policy from Pending Approvals.',
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
        const requiredApprovals = Number(policy.requires_approval ?? 0) === 1
            ? Math.max(1, Number(policy.min_approvals ?? 1))
            : 0;
        if (resolution.matchStatus === 'DISABLED_MATCH') {
            this.upsertWorkflow(normalizedResultId, {
                status: 'POLICY_DISABLED',
                approval_policy_id: policy.id,
                approval_required: requiredApprovals > 0 ? 1 : 0,
                approval_count_required: requiredApprovals,
                approval_count_received: 0,
                queued_at: null,
                routed_at: null,
                failed_at: null,
                last_error: 'A matching approval policy exists but is disabled. Enable the policy, then re-check policy from Pending Approvals.',
                updated_at: nowIso(),
                created_by_user_id: actor.userId,
                created_by_username: actor.username,
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { status: 'POLICY_DISABLED', queuedCount: 0 };
        }
        if (requiredApprovals > 0) {
            this.upsertWorkflow(normalizedResultId, {
                status: 'PENDING_APPROVAL',
                approval_policy_id: policy.id,
                approval_required: 1,
                approval_count_required: requiredApprovals,
                approval_count_received: 0,
                queued_at: null,
                routed_at: null,
                failed_at: null,
                last_error: routeTargetIds.length
                    ? null
                    : 'Approval is required, but this policy does not yet define any routing targets. Configure routing targets before final release.',
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
                last_error: 'Auto-route is allowed, but no routing targets are configured on the matched policy. Update the policy, then re-check it from Pending Approvals.',
                updated_at: nowIso(),
                created_by_user_id: actor.userId,
                created_by_username: actor.username,
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { status: 'PENDING_POLICY', queuedCount: 0 };
        }
        const queueResult = this.queueTargets(normalizedResultId, routeTargetIds);
        if (queueResult.queuedCount > 0) {
            this.upsertWorkflow(normalizedResultId, {
                status: 'QUEUED',
                approval_policy_id: policy.id,
                approval_required: 0,
                approval_count_required: 0,
                approval_count_received: 0,
                queued_at: nowIso(),
                routed_at: null,
                failed_at: null,
                last_error: queueResult.errors.length
                    ? `Queued to ${queueResult.queuedCount} target(s), but ${queueResult.errors.length} target(s) failed pre-queue validation: ${queueResult.errors.join(' | ')}`
                    : null,
                updated_at: nowIso(),
                created_by_user_id: actor.userId,
                created_by_username: actor.username,
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { status: 'QUEUED', queuedCount: queueResult.queuedCount };
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
            last_error: queueResult.errors.length
                ? `The matched policy could not queue to any configured targets: ${queueResult.errors.join(' | ')}`
                : 'The matched policy did not have any enabled routing targets available for queueing.',
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
        const workflow = this.getWorkflow(normalizedResultId);
        if (!workflow)
            throw new Error('Workflow record not found');
        const policy = this.approvals.getById(policyId);
        if (!policy) {
            this.upsertWorkflow(normalizedResultId, {
                status: 'PENDING_POLICY',
                approval_policy_id: null,
                approval_required: 1,
                approval_count_required: Number(workflow.approval_count_required ?? 0),
                approval_count_received: Number(workflow.approval_count_received ?? 0),
                queued_at: null,
                routed_at: null,
                failed_at: null,
                last_error: 'The linked approval policy could not be found. Routing is paused until policy configuration is restored.',
                updated_at: nowIso(),
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { queuedCount: 0, enabledTargetCount: 0, errors: ['policy not found'] };
        }
        const required = Math.max(1, Number(workflow.approval_count_required ?? policy.min_approvals ?? 1));
        const received = Math.max(Number(workflow.approval_count_received ?? 0), required);
        if (policy.enabled !== 1) {
            this.upsertWorkflow(normalizedResultId, {
                status: 'POLICY_DISABLED',
                approval_policy_id: policy.id,
                approval_required: 1,
                approval_count_required: required,
                approval_count_received: received,
                queued_at: null,
                routed_at: null,
                failed_at: null,
                last_error: 'The approval policy was disabled before routing could continue. Re-enable it to resume processing.',
                updated_at: nowIso(),
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { queuedCount: 0, enabledTargetCount: 0, errors: ['policy disabled'] };
        }
        const routeTargetIds = this.getPolicyRouteTargetIds(policy.id, policy);
        if (!routeTargetIds.length) {
            this.upsertWorkflow(normalizedResultId, {
                status: 'PENDING_POLICY',
                approval_policy_id: policy.id,
                approval_required: 1,
                approval_count_required: required,
                approval_count_received: received,
                queued_at: null,
                routed_at: null,
                failed_at: null,
                last_error: 'Approval completed, but no routing targets are configured for this policy. Add targets and re-check policy from Pending Approvals.',
                updated_at: nowIso(),
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return { queuedCount: 0, enabledTargetCount: 0, errors: ['no routing targets configured'] };
        }
        const queueResult = this.queueTargets(normalizedResultId, routeTargetIds);
        if (queueResult.queuedCount > 0) {
            this.upsertWorkflow(normalizedResultId, {
                status: 'QUEUED',
                approval_policy_id: policy.id,
                approval_required: 1,
                approval_count_required: required,
                approval_count_received: received,
                queued_at: nowIso(),
                routed_at: null,
                failed_at: null,
                last_error: queueResult.errors.length > 0
                    ? `Queued to ${queueResult.queuedCount} target(s), but ${queueResult.errors.length} target(s) failed pre-queue validation: ${queueResult.errors.join(' | ')}`
                    : null,
                updated_at: nowIso(),
                updated_by_user_id: actor.userId,
                updated_by_username: actor.username,
            });
            return queueResult;
        }
        this.upsertWorkflow(normalizedResultId, {
            status: 'PENDING_POLICY',
            approval_policy_id: policy.id,
            approval_required: 1,
            approval_count_required: required,
            approval_count_received: received,
            queued_at: null,
            routed_at: null,
            failed_at: null,
            last_error: queueResult.errors.length > 0
                ? `Approval completed, but queueing failed for all configured targets: ${queueResult.errors.join(' | ')}`
                : 'Approval completed, but none of the policy routing targets are currently enabled for queueing.',
            updated_at: nowIso(),
            updated_by_user_id: actor.userId,
            updated_by_username: actor.username,
        });
        return queueResult;
    }
    getPolicyRouteTargetIds(policyId, policy) {
        const db = (0, db_1.getDb)();
        const linkedRows = db
            .prepare(`
          SELECT target_id
          FROM approval_policy_targets
          WHERE policy_id = ?
          ORDER BY target_id ASC
        `)
            .all(policyId);
        if (linkedRows.length > 0) {
            return Array.from(new Set(linkedRows
                .map((row) => String(row.target_id ?? '').trim())
                .filter(Boolean)));
        }
        const fallbackTargetId = String(policy?.applies_to_target_id ?? '').trim();
        return fallbackTargetId ? [fallbackTargetId] : [];
    }
    queueTargets(normalizedResultId, targetIds) {
        const db = (0, db_1.getDb)();
        const uniqueIds = Array.from(new Set((targetIds ?? []).filter(Boolean)));
        if (!uniqueIds.length) {
            return { queuedCount: 0, enabledTargetCount: 0, errors: [] };
        }
        const placeholders = uniqueIds.map(() => '?').join(', ');
        const targets = db
            .prepare(`SELECT id, name FROM targets WHERE enabled = 1 AND id IN (${placeholders}) ORDER BY type ASC, name ASC`)
            .all(...uniqueIds);
        const enabledTargetCount = targets.length;
        const errors = [];
        let queuedCount = 0;
        for (const target of targets) {
            try {
                const queued = this.queue.enqueueNormalizedResult(normalizedResultId, target.id);
                if (queued)
                    queuedCount += 1;
            }
            catch (error) {
                errors.push(`${target.name || target.id}: ${error?.message ?? 'Queueing failed'}`);
            }
        }
        const missingTargetIds = uniqueIds.filter((targetId) => !targets.some((target) => target.id === targetId));
        for (const targetId of missingTargetIds) {
            errors.push(`${targetId}: target is disabled or not found`);
        }
        return { queuedCount, enabledTargetCount, errors };
    }
    getWorkflow(normalizedResultId) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`SELECT * FROM result_workflow_status WHERE normalized_result_id = ? LIMIT 1`)
            .get(normalizedResultId);
    }
    getResultRoutingContext(normalizedResultId) {
        const db = (0, db_1.getDb)();
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
        return row;
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
