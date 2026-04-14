"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultWorkflowService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const nowIso = () => new Date().toISOString();
class ResultWorkflowService {
    createForNormalizedResult(args) {
        const db = (0, db_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        db.prepare(`
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
            `).run(id, args.normalizedResultId, args.status, args.approvalPolicyId ?? null, args.approvalRequired ? 1 : 0, args.approvalCountRequired ?? 0, 0, ts, ts);
        return { id };
    }
    getByNormalizedResultId(normalizedResultId) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                    SELECT *
                    FROM result_workflow_status
                    WHERE normalized_result_id = ?
                    LIMIT 1
                `)
            .get(normalizedResultId);
    }
    listPendingApprovals(limit = 100) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                    SELECT *
                    FROM result_workflow_status
                    WHERE status IN ('PENDING_APPROVAL', 'PENDING_POLICY', 'POLICY_DISABLED')
                    ORDER BY updated_at DESC, created_at DESC
                    LIMIT ?
                `)
            .all(limit);
    }
    listQueueable(limit = 100) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                    SELECT *
                    FROM result_workflow_status
                    WHERE status = 'APPROVED'
                    ORDER BY updated_at ASC
                    LIMIT ?
                `)
            .all(limit);
    }
    markApproved(normalizedResultId) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE result_workflow_status
                SET status = 'APPROVED',
                    updated_at = ?
                WHERE normalized_result_id = ?
            `).run(nowIso(), normalizedResultId);
        return true;
    }
    markRejected(normalizedResultId, error) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE result_workflow_status
                SET status = 'REJECTED',
                    last_error = ?,
                    updated_at = ?
                WHERE normalized_result_id = ?
            `).run(error ?? null, nowIso(), normalizedResultId);
        return true;
    }
    markQueued(normalizedResultId) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE result_workflow_status
                SET status = 'QUEUED',
                    queued_at = ?,
                    updated_at = ?
                WHERE normalized_result_id = ?
            `).run(nowIso(), nowIso(), normalizedResultId);
        return true;
    }
    markRouted(normalizedResultId) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE result_workflow_status
                SET status = 'ROUTED',
                    routed_at = ?,
                    updated_at = ?
                WHERE normalized_result_id = ?
            `).run(nowIso(), nowIso(), normalizedResultId);
        return true;
    }
    markFailedDelivery(normalizedResultId, error) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE result_workflow_status
                SET status = 'FAILED_DELIVERY',
                    failed_at = ?,
                    last_error = ?,
                    updated_at = ?
                WHERE normalized_result_id = ?
            `).run(nowIso(), error ?? null, nowIso(), normalizedResultId);
        return true;
    }
    incrementApprovalCount(normalizedResultId) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE result_workflow_status
                SET approval_count_received = approval_count_received + 1,
                    updated_at = ?
                WHERE normalized_result_id = ?
            `).run(nowIso(), normalizedResultId);
        return this.getByNormalizedResultId(normalizedResultId);
    }
}
exports.ResultWorkflowService = ResultWorkflowService;
