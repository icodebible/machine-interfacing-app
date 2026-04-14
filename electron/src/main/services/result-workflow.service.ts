import { randomUUID } from 'crypto';
import { getDb } from '../db/db';

const nowIso = () => new Date().toISOString();

export type WorkflowStatus =
    | 'RECEIVED'
    | 'PARSED'
    | 'NORMALIZED'
    | 'PENDING_APPROVAL'
    | 'PENDING_POLICY'
    | 'POLICY_DISABLED'
    | 'APPROVED'
    | 'REJECTED'
    | 'QUEUED'
    | 'ROUTED'
    | 'FAILED_DELIVERY';

export class ResultWorkflowService {
    createForNormalizedResult(args: {
        normalizedResultId: string;
        approvalPolicyId?: string | null;
        approvalRequired: boolean;
        approvalCountRequired: number;
        status: WorkflowStatus;
    }) {
        const db = getDb();
        const id = randomUUID();
        const ts = nowIso();

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
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            id,
            args.normalizedResultId,
            args.status,
            args.approvalPolicyId ?? null,
            args.approvalRequired ? 1 : 0,
            args.approvalCountRequired ?? 0,
            0,
            ts,
            ts,
        );

        return { id };
    }

    getByNormalizedResultId(normalizedResultId: string) {
        const db = getDb();
        return db
            .prepare(
                `
                    SELECT *
                    FROM result_workflow_status
                    WHERE normalized_result_id = ?
                    LIMIT 1
                `,
            )
            .get(normalizedResultId) as any;
    }

    listPendingApprovals(limit = 100) {
        const db = getDb();
        return db
            .prepare(
                `
                    SELECT *
                    FROM result_workflow_status
                    WHERE status IN ('PENDING_APPROVAL', 'PENDING_POLICY', 'POLICY_DISABLED')
                    ORDER BY updated_at DESC, created_at DESC
                    LIMIT ?
                `,
            )
            .all(limit);
    }

    listQueueable(limit = 100) {
        const db = getDb();
        return db
            .prepare(
                `
                    SELECT *
                    FROM result_workflow_status
                    WHERE status = 'APPROVED'
                    ORDER BY updated_at ASC
                    LIMIT ?
                `,
            )
            .all(limit);
    }

    markApproved(normalizedResultId: string) {
        const db = getDb();
        db.prepare(
            `
                UPDATE result_workflow_status
                SET status = 'APPROVED',
                    updated_at = ?
                WHERE normalized_result_id = ?
            `,
        ).run(nowIso(), normalizedResultId);
        return true;
    }

    markRejected(normalizedResultId: string, error?: string | null) {
        const db = getDb();
        db.prepare(
            `
                UPDATE result_workflow_status
                SET status = 'REJECTED',
                    last_error = ?,
                    updated_at = ?
                WHERE normalized_result_id = ?
            `,
        ).run(error ?? null, nowIso(), normalizedResultId);
        return true;
    }

    markQueued(normalizedResultId: string) {
        const db = getDb();
        db.prepare(
            `
                UPDATE result_workflow_status
                SET status = 'QUEUED',
                    queued_at = ?,
                    updated_at = ?
                WHERE normalized_result_id = ?
            `,
        ).run(nowIso(), nowIso(), normalizedResultId);
        return true;
    }

    markRouted(normalizedResultId: string) {
        const db = getDb();
        db.prepare(
            `
                UPDATE result_workflow_status
                SET status = 'ROUTED',
                    routed_at = ?,
                    updated_at = ?
                WHERE normalized_result_id = ?
            `,
        ).run(nowIso(), nowIso(), normalizedResultId);
        return true;
    }

    markFailedDelivery(normalizedResultId: string, error?: string | null) {
        const db = getDb();
        db.prepare(
            `
                UPDATE result_workflow_status
                SET status = 'FAILED_DELIVERY',
                    failed_at = ?,
                    last_error = ?,
                    updated_at = ?
                WHERE normalized_result_id = ?
            `,
        ).run(nowIso(), error ?? null, nowIso(), normalizedResultId);
        return true;
    }

    incrementApprovalCount(normalizedResultId: string) {
        const db = getDb();
        db.prepare(
            `
                UPDATE result_workflow_status
                SET approval_count_received = approval_count_received + 1,
                    updated_at = ?
                WHERE normalized_result_id = ?
            `,
        ).run(nowIso(), normalizedResultId);

        return this.getByNormalizedResultId(normalizedResultId);
    }
}
