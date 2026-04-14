import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { ApprovalPolicyService } from './approval-policy.service';
import { TargetTransformPreviewService } from '../transformers/target-transform-preview.service';
import { getCurrentActorSnapshot } from './resource-actor.util';

const nowIso = () => new Date().toISOString();

type MachineFlowContext = {
  id: string;
  lab_id?: string | null;
  name?: string | null;
};

export class SimulationFlowService {
  private readonly approvals = new ApprovalPolicyService();
  private readonly preview = new TargetTransformPreviewService();

  processNormalizedResult(args: { normalizedResultId: string; machine: MachineFlowContext }) {
    const db = getDb();
    const ts = nowIso();
    const actor = getCurrentActorSnapshot();

    const existing = db
      .prepare(
        `
          SELECT id, status
          FROM result_workflow_status
          WHERE normalized_result_id = ?
          LIMIT 1
        `,
      )
      .get(args.normalizedResultId) as any;

    if (existing) {
      return {
        workflowId: existing.id,
        status: existing.status,
        queuedCount: 0,
        skippedTargets: 0,
      };
    }

    const targets = db
      .prepare(
        `
          SELECT id, type, name, enabled
          FROM targets
          WHERE enabled = 1
          ORDER BY type ASC, name ASC
        `,
      )
      .all() as any[];

    const policy = this.approvals.resolveForResult({
      labId: args.machine.lab_id ?? null,
      machineId: args.machine.id,
      targetId: null,
    });

    const requiresApproval = (policy?.requires_approval ?? 0) === 1;
    const workflowId = randomUUID();
    const initialStatus = requiresApproval
      ? 'PENDING_APPROVAL'
      : targets.length > 0
        ? 'QUEUED'
        : 'NORMALIZED';

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
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    ).run(
      workflowId,
      args.normalizedResultId,
      initialStatus,
      policy?.id ?? null,
      requiresApproval ? 1 : 0,
      Math.max(0, policy?.min_approvals ?? 0),
      0,
      !requiresApproval && targets.length > 0 ? ts : null,
      null,
      null,
      targets.length === 0 ? 'No enabled targets available for routing.' : null,
      ts,
      ts,
      actor?.id ?? null,
      actor?.username ?? null,
      actor?.id ?? null,
      actor?.username ?? null,
    );

    if (requiresApproval || targets.length === 0) {
      return {
        workflowId,
        status: initialStatus,
        queuedCount: 0,
        skippedTargets: targets.length === 0 ? 1 : 0,
      };
    }

    const insertQueue = db.prepare(
      `
        INSERT INTO outbound_queue (
          id,
          normalized_result_id,
          target_id,
          payload_json,
          delivery_status,
          retry_count,
          next_retry_at,
          last_error,
          created_at,
          updated_at,
          created_by_user_id,
          created_by_username,
          updated_by_user_id,
          updated_by_username
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    );

    let queuedCount = 0;
    const failures: string[] = [];

    const tx = db.transaction(() => {
      for (const target of targets) {
        try {
          const preview = this.preview.preview(target.id, args.normalizedResultId);
          insertQueue.run(
            randomUUID(),
            args.normalizedResultId,
            target.id,
            JSON.stringify(preview.payload ?? {}),
            'PENDING',
            0,
            null,
            null,
            ts,
            ts,
            actor?.id ?? null,
            actor?.username ?? null,
            actor?.id ?? null,
            actor?.username ?? null,
          );
          queuedCount += 1;
        } catch (error: any) {
          failures.push(
            `${target.name ?? target.id}: ${error?.message ?? 'Preview generation failed'}`,
          );
        }
      }
    });

    tx();

    if (failures.length > 0) {
      const failureMessage = failures.slice(0, 3).join(' | ');
      db.prepare(
        `
          UPDATE result_workflow_status
          SET status = ?,
              queued_at = ?,
              failed_at = ?,
              last_error = ?,
              updated_at = ?,
              updated_by_user_id = ?,
              updated_by_username = ?
          WHERE id = ?
        `,
      ).run(
        queuedCount > 0 ? 'QUEUED' : 'FAILED_DELIVERY',
        queuedCount > 0 ? ts : null,
        queuedCount > 0 ? null : ts,
        failureMessage,
        ts,
        actor?.id ?? null,
        actor?.username ?? null,
        workflowId,
      );
    }

    return {
      workflowId,
      status: queuedCount > 0 ? 'QUEUED' : 'FAILED_DELIVERY',
      queuedCount,
      skippedTargets: failures.length,
    };
  }
}
