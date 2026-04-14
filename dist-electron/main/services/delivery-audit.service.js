"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryAuditService = void 0;
const crypto_1 = require("crypto");
const nowIso = () => new Date().toISOString();
const db_1 = require("../db/db");
class DeliveryAuditService {
    log(args) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                INSERT INTO delivery_audit_logs (
                    id,
                    queue_id,
                    target_id,
                    operation,
                    status,
                    attempt_no,
                    http_status,
                    correlation_id,
                    duration_ms,
                    error_message,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run((0, crypto_1.randomUUID)(), args.queueId, args.targetId, args.operation, args.status, args.attemptNo, args.httpStatus ?? null, args.correlationId ?? null, args.durationMs ?? null, args.errorMessage ?? null, nowIso());
        return true;
    }
    list(limit = 100) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                SELECT dal.*, t.name AS target_name, t.type AS target_type,
                        q.delivery_status AS queue_delivery_status,
                        q.retry_count AS queue_retry_count,
                        q.last_error AS queue_last_error,
                        q.updated_at AS queue_updated_at
                FROM delivery_audit_logs dal
                LEFT JOIN targets t ON t.id = dal.target_id
                LEFT JOIN outbound_queue q ON q.id = dal.queue_id
                ORDER BY dal.created_at DESC
                LIMIT ?
                `)
            .all(limit);
    }
    query(args = {}) {
        const db = (0, db_1.getDb)();
        const limit = Math.max(1, Number(args.limit ?? 100));
        return db
            .prepare(`
                SELECT dal.*, t.name AS target_name, t.type AS target_type,
                        q.delivery_status AS queue_delivery_status,
                        q.retry_count AS queue_retry_count,
                        q.last_error AS queue_last_error,
                        q.updated_at AS queue_updated_at
                FROM delivery_audit_logs dal
                LEFT JOIN targets t ON t.id = dal.target_id
                LEFT JOIN outbound_queue q ON q.id = dal.queue_id
                WHERE (? IS NULL OR dal.queue_id = ?)
                    AND (? IS NULL OR dal.target_id = ?)
                    AND (? IS NULL OR dal.operation = ?)
                    AND (? IS NULL OR dal.status = ?)
                    AND (? IS NULL OR dal.correlation_id = ?)
                ORDER BY dal.created_at DESC
                LIMIT ?
                `)
            .all(args.queueId ?? null, args.queueId ?? null, args.targetId ?? null, args.targetId ?? null, args.operation ?? null, args.operation ?? null, args.status ?? null, args.status ?? null, args.correlationId ?? null, args.correlationId ?? null, limit);
    }
}
exports.DeliveryAuditService = DeliveryAuditService;
