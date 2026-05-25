// import { getDb } from '../db/db';
// import { ApprovalPolicyService } from './approval-policy.service';
// import { OutboundQueueService } from './outbound-queue.service';
// import { getCurrentActorStamp } from './actor-context.service';

// const nowIso = () => new Date().toISOString();

// export class ResultFlowService {
//   private readonly approvals = new ApprovalPolicyService();
//   private readonly queue = new OutboundQueueService();

//   advanceAfterNormalization(normalizedResultId: string) {
//     const db = getDb();
//     const actor = getCurrentActorStamp();

//     const row = db
//       .prepare(
//         `
//           SELECT nr.id, nr.machine_id, m.lab_id
//           FROM normalized_lab_results nr
//           LEFT JOIN machines m ON m.id = nr.machine_id
//           WHERE nr.id = ?
//           LIMIT 1
//         `,
//       )
//       .get(normalizedResultId) as
//       | { id: string; machine_id: string; lab_id?: string | null }
//       | undefined;

//     if (!row) {
//       throw new Error('Normalized result not found for workflow advancement.');
//     }

//     const resolution = this.approvals.resolvePolicyContextForResult({
//       labId: row.lab_id ?? null,
//       machineId: row.machine_id,
//     });

//     if (resolution.matchStatus === 'NO_MATCH' || !resolution.policy) {
//       this.upsertWorkflow(normalizedResultId, {
//         status: 'PENDING_POLICY',
//         approval_policy_id: null,
//         approval_required: 0,
//         approval_count_required: 0,
//         approval_count_received: 0,
//         queued_at: null,
//         routed_at: null,
//         failed_at: null,
//         last_error:
//           'No matching approval policy was found for this result. Configure and enable a policy, then re-check the policy from Pending Approvals.',
//         updated_at: nowIso(),
//         created_by_user_id: actor.userId,
//         created_by_username: actor.username,
//         updated_by_user_id: actor.userId,
//         updated_by_username: actor.username,
//       });
//       return { status: 'PENDING_POLICY', queuedCount: 0 };
//     }

//     const policy = resolution.policy;
//     const routeTargetIds = resolution.routeTargetIds;

//     if (resolution.matchStatus === 'DISABLED_MATCH') {
//       this.upsertWorkflow(normalizedResultId, {
//         status: 'POLICY_DISABLED',
//         approval_policy_id: policy.id,
//         approval_required: Number(policy.requires_approval ?? 0) === 1 ? 1 : 0,
//         approval_count_required:
//           Number(policy.requires_approval ?? 0) === 1
//             ? Math.max(1, Number(policy.min_approvals ?? 1))
//             : 0,
//         approval_count_received: 0,
//         queued_at: null,
//         routed_at: null,
//         failed_at: null,
//         last_error:
//           'A matching approval policy exists but is disabled. Enable the policy, then re-check the policy from Pending Approvals.',
//         updated_at: nowIso(),
//         created_by_user_id: actor.userId,
//         created_by_username: actor.username,
//         updated_by_user_id: actor.userId,
//         updated_by_username: actor.username,
//       });
//       return { status: 'POLICY_DISABLED', queuedCount: 0 };
//     }

//     if (Number(policy.requires_approval ?? 0) === 1) {
//       this.upsertWorkflow(normalizedResultId, {
//         status: 'PENDING_APPROVAL',
//         approval_policy_id: policy.id,
//         approval_required: 1,
//         approval_count_required: Math.max(1, Number(policy.min_approvals ?? 1)),
//         approval_count_received: 0,
//         queued_at: null,
//         routed_at: null,
//         failed_at: null,
//         last_error: routeTargetIds.length
//           ? null
//           : 'Approval is required. Configure the policy target before final routing can proceed.',
//         updated_at: nowIso(),
//         created_by_user_id: actor.userId,
//         created_by_username: actor.username,
//         updated_by_user_id: actor.userId,
//         updated_by_username: actor.username,
//       });
//       return { status: 'PENDING_APPROVAL', queuedCount: 0 };
//     }

//     if (!routeTargetIds.length) {
//       this.upsertWorkflow(normalizedResultId, {
//         status: 'PENDING_POLICY',
//         approval_policy_id: policy.id,
//         approval_required: 0,
//         approval_count_required: 0,
//         approval_count_received: 0,
//         queued_at: null,
//         routed_at: null,
//         failed_at: null,
//         last_error:
//           'Auto-route is allowed, but no target is configured on the matched policy. Update the policy, then re-check it from Pending Approvals.',
//         updated_at: nowIso(),
//         created_by_user_id: actor.userId,
//         created_by_username: actor.username,
//         updated_by_user_id: actor.userId,
//         updated_by_username: actor.username,
//       });
//       return { status: 'PENDING_POLICY', queuedCount: 0 };
//     }

//     const queuedCount = this.queueTargets(normalizedResultId, routeTargetIds);

//     if (queuedCount > 0) {
//       this.upsertWorkflow(normalizedResultId, {
//         status: 'QUEUED',
//         approval_policy_id: policy.id,
//         approval_required: 0,
//         approval_count_required: 0,
//         approval_count_received: 0,
//         queued_at: nowIso(),
//         routed_at: null,
//         failed_at: null,
//         last_error: null,
//         updated_at: nowIso(),
//         created_by_user_id: actor.userId,
//         created_by_username: actor.username,
//         updated_by_user_id: actor.userId,
//         updated_by_username: actor.username,
//       });
//       return { status: 'QUEUED', queuedCount };
//     }

//     this.upsertWorkflow(normalizedResultId, {
//       status: 'PENDING_POLICY',
//       approval_policy_id: policy.id,
//       approval_required: 0,
//       approval_count_required: 0,
//       approval_count_received: 0,
//       queued_at: null,
//       routed_at: null,
//       failed_at: null,
//       last_error: 'The configured policy target is not currently enabled for queueing.',
//       updated_at: nowIso(),
//       created_by_user_id: actor.userId,
//       created_by_username: actor.username,
//       updated_by_user_id: actor.userId,
//       updated_by_username: actor.username,
//     });
//     return { status: 'PENDING_POLICY', queuedCount: 0 };
//   }

//   reevaluateHeldResult(normalizedResultId: string) {
//     const db = getDb();
//     const workflow = db
//       .prepare(`SELECT status FROM result_workflow_status WHERE normalized_result_id = ? LIMIT 1`)
//       .get(normalizedResultId) as { status?: string } | undefined;
//     if (!workflow) throw new Error('Workflow record not found');
//     if (
//       !['PENDING_POLICY', 'POLICY_DISABLED', 'PENDING_APPROVAL'].includes(
//         String(workflow.status ?? ''),
//       )
//     ) {
//       throw new Error('This result is not waiting for policy re-evaluation.');
//     }
//     return this.advanceAfterNormalization(normalizedResultId);
//   }

//   queueApprovedResult(normalizedResultId: string, policyId: string) {
//     const actor = getCurrentActorStamp();
//     const workflow = getDb()
//       .prepare(
//         `
//           SELECT approval_count_required, approval_count_received
//           FROM result_workflow_status
//           WHERE normalized_result_id = ?
//           LIMIT 1
//         `,
//       )
//       .get(normalizedResultId) as
//       | { approval_count_required?: number | null; approval_count_received?: number | null }
//       | undefined;

//     const targetIds = this.approvals.listPolicyTargetIds(policyId);
//     const queuedCount = this.queueTargets(normalizedResultId, targetIds);

//     this.upsertWorkflow(normalizedResultId, {
//       status: queuedCount > 0 ? 'QUEUED' : 'APPROVED',
//       approval_policy_id: policyId,
//       approval_required: 1,
//       approval_count_required: Number(workflow?.approval_count_required ?? 1),
//       approval_count_received: Number(workflow?.approval_count_received ?? 1),
//       queued_at: queuedCount > 0 ? nowIso() : null,
//       routed_at: null,
//       failed_at: null,
//       last_error:
//         queuedCount > 0
//           ? null
//           : 'Approval completed, but the policy has no enabled routing targets configured. Update the policy targets and re-check when needed.',
//       updated_at: nowIso(),
//       updated_by_user_id: actor.userId,
//       updated_by_username: actor.username,
//     });
//     return queuedCount;
//   }

//   private queueTargets(normalizedResultId: string, targetIds: string[]) {
//     const db = getDb();
//     const uniqueIds = Array.from(new Set((targetIds ?? []).filter(Boolean)));
//     if (!uniqueIds.length) return 0;

//     const placeholders = uniqueIds.map(() => '?').join(', ');
//     const targets = db
//       .prepare(
//         `SELECT id FROM targets WHERE enabled = 1 AND id IN (${placeholders}) ORDER BY type ASC, name ASC`,
//       )
//       .all(...uniqueIds) as Array<{ id: string }>;

//     let queuedCount = 0;
//     for (const target of targets) {
//       const queued = this.queue.enqueueNormalizedResult(normalizedResultId, target.id);
//       if (queued) queuedCount += 1;
//     }
//     return queuedCount;
//   }

//   private upsertWorkflow(normalizedResultId: string, patch: Record<string, unknown>) {
//     const db = getDb();
//     const existing = db
//       .prepare(`SELECT id FROM result_workflow_status WHERE normalized_result_id = ? LIMIT 1`)
//       .get(normalizedResultId) as { id?: string } | undefined;

//     if (existing?.id) {
//       db.prepare(
//         `
//           UPDATE result_workflow_status SET
//             status = COALESCE(@status, status),
//             approval_policy_id = @approval_policy_id,
//             approval_required = COALESCE(@approval_required, approval_required),
//             approval_count_required = COALESCE(@approval_count_required, approval_count_required),
//             approval_count_received = COALESCE(@approval_count_received, approval_count_received),
//             queued_at = @queued_at,
//             routed_at = @routed_at,
//             failed_at = @failed_at,
//             last_error = @last_error,
//             updated_at = COALESCE(@updated_at, updated_at),
//             updated_by_user_id = COALESCE(@updated_by_user_id, updated_by_user_id),
//             updated_by_username = COALESCE(@updated_by_username, updated_by_username)
//           WHERE normalized_result_id = @normalized_result_id
//         `,
//       ).run({ normalized_result_id: normalizedResultId, ...patch });
//       return;
//     }

//     const id = `${normalizedResultId}-workflow`;
//     db.prepare(
//       `
//         INSERT INTO result_workflow_status (
//           id,
//           normalized_result_id,
//           status,
//           approval_policy_id,
//           approval_required,
//           approval_count_required,
//           approval_count_received,
//           queued_at,
//           routed_at,
//           failed_at,
//           last_error,
//           created_at,
//           updated_at,
//           created_by_user_id,
//           created_by_username,
//           updated_by_user_id,
//           updated_by_username
//         ) VALUES (
//           @id,
//           @normalized_result_id,
//           @status,
//           @approval_policy_id,
//           COALESCE(@approval_required, 0),
//           COALESCE(@approval_count_required, 0),
//           COALESCE(@approval_count_received, 0),
//           @queued_at,
//           @routed_at,
//           @failed_at,
//           @last_error,
//           COALESCE(@created_at, @updated_at, '${nowIso()}'),
//           COALESCE(@updated_at, '${nowIso()}'),
//           @created_by_user_id,
//           @created_by_username,
//           @updated_by_user_id,
//           @updated_by_username
//         )
//       `,
//     ).run({
//       id,
//       normalized_result_id: normalizedResultId,
//       created_at: (patch as any).created_at ?? (patch as any).updated_at ?? nowIso(),
//       ...patch,
//     });
//   }
// }

import { getDb } from '../db/db';
import { ApprovalPolicyService } from './approval-policy.service';
import { OutboundQueueService } from './outbound-queue.service';
import { getCurrentActorStamp } from './actor-context.service';

const nowIso = () => new Date().toISOString();

export class ResultFlowService {
  private readonly approvals = new ApprovalPolicyService();
  private readonly queue = new OutboundQueueService();

  advanceAfterNormalization(normalizedResultId: string) {
    const db = getDb();
    const actor = getCurrentActorStamp();

    const row = db
      .prepare(
        `
          SELECT nr.id, nr.machine_id, m.lab_id
          FROM normalized_lab_results nr
          LEFT JOIN machines m ON m.id = nr.machine_id
          WHERE nr.id = ?
          LIMIT 1
        `,
      )
      .get(normalizedResultId) as
      | { id: string; machine_id: string; lab_id?: string | null }
      | undefined;

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
        last_error:
          'No matching approval policy was found for this result. Configure and enable a policy, then re-check the policy from Pending Approvals.',
        updated_at: nowIso(),
        created_by_user_id: actor.userId,
        created_by_username: actor.username,
        updated_by_user_id: actor.userId,
        updated_by_username: actor.username,
      });
      return { status: 'PENDING_POLICY', queuedCount: 0 };
    }

    const policy = resolution.policy;
    const routeResolution = this.resolveRoutableTargetIds(policy.id, resolution.routeTargetIds);
    const routeTargetIds = routeResolution.targetIds;

    if (resolution.matchStatus === 'DISABLED_MATCH') {
      this.upsertWorkflow(normalizedResultId, {
        status: 'POLICY_DISABLED',
        approval_policy_id: policy.id,
        approval_required: Number(policy.requires_approval ?? 0) === 1 ? 1 : 0,
        approval_count_required:
          Number(policy.requires_approval ?? 0) === 1
            ? Math.max(1, Number(policy.min_approvals ?? 1))
            : 0,
        approval_count_received: 0,
        queued_at: null,
        routed_at: null,
        failed_at: null,
        last_error:
          'A matching approval policy exists but is disabled. Enable the policy, then re-check the policy from Pending Approvals.',
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
          ? routeResolution.warnings.join(' | ') || null
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
        last_error: [
          'Auto-route is allowed, but no target is configured on the matched policy. Update the policy, then re-check it from Pending Approvals.',
          ...routeResolution.warnings,
        ]
          .filter(Boolean)
          .join(' | '),
        updated_at: nowIso(),
        created_by_user_id: actor.userId,
        created_by_username: actor.username,
        updated_by_user_id: actor.userId,
        updated_by_username: actor.username,
      });
      return { status: 'PENDING_POLICY', queuedCount: 0 };
    }

    const queueResult = this.queueTargets(normalizedResultId, routeTargetIds);
    queueResult.warnings.push(...routeResolution.warnings);

    if (queueResult.queuedCount > 0) {
      this.upsertWorkflow(normalizedResultId, {
        status: 'QUEUED',
        approval_policy_id: policy.id,
        approval_required: 0,
        approval_count_required: 0,
        approval_count_received: 0,
        queued_at: nowIso(),
        routed_at: null,
        failed_at: queueResult.errors.length ? nowIso() : null,
        last_error: this.buildPostApprovalMessage(queueResult, routeTargetIds),
        updated_at: nowIso(),
        created_by_user_id: actor.userId,
        created_by_username: actor.username,
        updated_by_user_id: actor.userId,
        updated_by_username: actor.username,
      });
      return { status: 'QUEUED', queuedCount: queueResult.queuedCount, errors: queueResult.errors };
    }

    this.upsertWorkflow(normalizedResultId, {
      status: 'PENDING_POLICY',
      approval_policy_id: policy.id,
      approval_required: 0,
      approval_count_required: 0,
      approval_count_received: 0,
      queued_at: null,
      routed_at: null,
      failed_at: queueResult.errors.length ? nowIso() : null,
      last_error: this.buildPostApprovalMessage(queueResult, routeTargetIds),
      updated_at: nowIso(),
      created_by_user_id: actor.userId,
      created_by_username: actor.username,
      updated_by_user_id: actor.userId,
      updated_by_username: actor.username,
    });
    return { status: 'PENDING_POLICY', queuedCount: 0, errors: queueResult.errors };
  }

  reevaluateHeldResult(normalizedResultId: string) {
    const db = getDb();
    const workflow = db
      .prepare(`SELECT status FROM result_workflow_status WHERE normalized_result_id = ? LIMIT 1`)
      .get(normalizedResultId) as { status?: string } | undefined;
    if (!workflow) throw new Error('Workflow record not found');
    if (
      !['PENDING_POLICY', 'POLICY_DISABLED', 'PENDING_APPROVAL'].includes(
        String(workflow.status ?? ''),
      )
    ) {
      throw new Error('This result is not waiting for policy re-evaluation.');
    }
    return this.advanceAfterNormalization(normalizedResultId);
  }

  queueApprovedResult(normalizedResultId: string, policyId: string) {
    const actor = getCurrentActorStamp();
    const db = getDb();
    const workflow = db
      .prepare(
        `
          SELECT approval_count_required, approval_count_received
          FROM result_workflow_status
          WHERE normalized_result_id = ?
          LIMIT 1
        `,
      )
      .get(normalizedResultId) as
      | { approval_count_required?: number | null; approval_count_received?: number | null }
      | undefined;

    const routeResolution = this.resolveRoutableTargetIds(policyId, this.approvals.listPolicyTargetIds(policyId));
    const targetIds = routeResolution.targetIds;
    const queueResult = this.queueTargets(normalizedResultId, targetIds);
    queueResult.warnings.push(...routeResolution.warnings);
    const finalStatus = queueResult.queuedCount > 0 ? 'QUEUED' : 'APPROVED';
    const lastError = this.buildPostApprovalMessage(queueResult, targetIds);

    this.upsertWorkflow(normalizedResultId, {
      status: finalStatus,
      approval_policy_id: policyId,
      approval_required: 1,
      approval_count_required: Number(workflow?.approval_count_required ?? 1),
      approval_count_received: Number(workflow?.approval_count_received ?? 1),
      queued_at: queueResult.queuedCount > 0 ? nowIso() : null,
      routed_at: null,
      failed_at: queueResult.errors.length ? nowIso() : null,
      last_error: lastError,
      updated_at: nowIso(),
      updated_by_user_id: actor.userId,
      updated_by_username: actor.username,
    });

    return {
      status: finalStatus,
      queuedCount: queueResult.queuedCount,
      existingQueuedCount: queueResult.existingQueuedCount,
      createdQueuedCount: queueResult.createdQueuedCount,
      errors: queueResult.errors,
      warnings: queueResult.warnings,
      routeTargetIds: targetIds,
    };
  }

  private queueTargets(normalizedResultId: string, targetIds: string[]) {
    const db = getDb();
    const uniqueIds = Array.from(new Set((targetIds ?? []).filter(Boolean)));
    const result = {
      queuedCount: 0,
      existingQueuedCount: 0,
      createdQueuedCount: 0,
      errors: [] as string[],
      warnings: [] as string[],
    };

    if (!uniqueIds.length) return result;

    const placeholders = uniqueIds.map(() => '?').join(', ');
    const targets = db
      .prepare(
        `SELECT id, name FROM targets WHERE enabled = 1 AND id IN (${placeholders}) ORDER BY type ASC, name ASC`,
      )
      .all(...uniqueIds) as Array<{ id: string; name?: string | null }>;

    const enabledTargetIds = new Set(targets.map((target) => target.id));
    const disabledOrMissing = uniqueIds.filter((id) => !enabledTargetIds.has(id));
    for (const targetId of disabledOrMissing) {
      result.errors.push(`Target ${targetId} is not enabled or could not be found.`);
    }

    for (const target of targets) {
      try {
        const existing = db
          .prepare(
            `SELECT id FROM outbound_queue WHERE normalized_result_id = ? AND target_id = ? LIMIT 1`,
          )
          .get(normalizedResultId, target.id) as { id?: string } | undefined;

        if (existing?.id) {
          result.queuedCount += 1;
          result.existingQueuedCount += 1;
          continue;
        }

        const queued = this.queue.enqueueNormalizedResult(normalizedResultId, target.id, {
          allowInvalidPreview: true,
        });
        if (queued) {
          result.queuedCount += 1;
          result.createdQueuedCount += 1;
        }
      } catch (error: any) {
        result.errors.push(
          `${target.name || target.id}: ${error?.message ?? 'Unable to create outbound queue item.'}`,
        );
      }
    }

    return result;
  }

  private resolveRoutableTargetIds(policyId: string, configuredTargetIds: string[]) {
    const ids = Array.from(new Set((configuredTargetIds ?? []).filter(Boolean)));
    if (ids.length) return { targetIds: ids, warnings: [] as string[] };

    const db = getDb();
    const lisTargets = db
      .prepare(`SELECT id, name FROM targets WHERE enabled = 1 AND type = 'LIS' ORDER BY name ASC, id ASC`)
      .all() as Array<{ id: string; name?: string | null }>;

    if (lisTargets.length === 1) {
      return {
        targetIds: [lisTargets[0].id],
        warnings: [
          `Approval policy ${policyId} has no routing target configured. The only enabled LIS target (${lisTargets[0].name || lisTargets[0].id}) was used as a safe fallback.`,
        ],
      };
    }

    const enabledTargets = db
      .prepare(`SELECT id, name FROM targets WHERE enabled = 1 ORDER BY type ASC, name ASC, id ASC`)
      .all() as Array<{ id: string; name?: string | null }>;

    if (enabledTargets.length === 1) {
      return {
        targetIds: [enabledTargets[0].id],
        warnings: [
          `Approval policy ${policyId} has no routing target configured. The only enabled target (${enabledTargets[0].name || enabledTargets[0].id}) was used as a safe fallback.`,
        ],
      };
    }

    return {
      targetIds: [] as string[],
      warnings: enabledTargets.length
        ? [
            `Approval policy ${policyId} has no routing target configured and multiple enabled targets exist. Configure the policy target explicitly before queueing.`,
          ]
        : [`Approval policy ${policyId} has no routing target configured and no enabled target is available.`],
    };
  }

  private buildPostApprovalMessage(
    queueResult: { queuedCount: number; errors: string[]; warnings?: string[] },
    targetIds: string[],
  ) {
    const warnings = queueResult.warnings ?? [];
    if (queueResult.queuedCount > 0 && queueResult.errors.length === 0) {
      return warnings.length ? warnings.join(' | ') : null;
    }

    if (!targetIds.length) {
      return [
        'Approval completed, but the policy has no routing target configured. Add a target to the approval policy before delivery can proceed.',
        ...warnings,
      ]
        .filter(Boolean)
        .join(' | ');
    }

    if (queueResult.queuedCount > 0 && queueResult.errors.length > 0) {
      return `Approval completed and ${queueResult.queuedCount} queue item${queueResult.queuedCount === 1 ? ' was' : 's were'} prepared. Some targets could not be queued: ${queueResult.errors.join(' | ')}${warnings.length ? ` | ${warnings.join(' | ')}` : ''}`;
    }

    if (queueResult.errors.length > 0) {
      return `Approval completed, but the result could not be queued. ${queueResult.errors.join(' | ')}${warnings.length ? ` | ${warnings.join(' | ')}` : ''}`;
    }

    return [
      'Approval completed, but no enabled routing target was available for queueing.',
      ...warnings,
    ]
      .filter(Boolean)
      .join(' | ');
  }

  private upsertWorkflow(normalizedResultId: string, patch: Record<string, unknown>) {
    const db = getDb();
    const existing = db
      .prepare(`SELECT id FROM result_workflow_status WHERE normalized_result_id = ? LIMIT 1`)
      .get(normalizedResultId) as { id?: string } | undefined;

    if (existing?.id) {
      db.prepare(
        `
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
        `,
      ).run({ normalized_result_id: normalizedResultId, ...patch });
      return;
    }

    const id = `${normalizedResultId}-workflow`;
    db.prepare(
      `
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
      `,
    ).run({
      id,
      normalized_result_id: normalizedResultId,
      created_at: (patch as any).created_at ?? (patch as any).updated_at ?? nowIso(),
      ...patch,
    });
  }
}

