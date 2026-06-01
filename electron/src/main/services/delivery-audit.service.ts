// import { randomUUID } from 'crypto';

// const nowIso = () => new Date().toISOString();

// import { getDb } from '../db/db';

// export class DeliveryAuditService {
//   log(args: {
//     queueId: string;
//     targetId: string;
//     operation: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
//     status: 'STARTED' | 'DELIVERED' | 'FAILED';
//     attemptNo: number;
//     httpStatus?: number | null;
//     correlationId?: string | null;
//     durationMs?: number | null;
//     errorMessage?: string | null;
//   }) {
//     const db = getDb();

//     db.prepare(
//       `
//                 INSERT INTO delivery_audit_logs (
//                     id,
//                     queue_id,
//                     target_id,
//                     operation,
//                     status,
//                     attempt_no,
//                     http_status,
//                     correlation_id,
//                     duration_ms,
//                     error_message,
//                     created_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//     ).run(
//       randomUUID(),
//       args.queueId,
//       args.targetId,
//       args.operation,
//       args.status,
//       args.attemptNo,
//       args.httpStatus ?? null,
//       args.correlationId ?? null,
//       args.durationMs ?? null,
//       args.errorMessage ?? null,
//       nowIso(),
//     );

//     return true;
//   }

//   list(limit = 100) {
//     const db = getDb();
//     return db
//       .prepare(
//         `
//                 SELECT dal.*, t.name AS target_name, t.type AS target_type,
//                         q.delivery_status AS queue_delivery_status,
//                         q.retry_count AS queue_retry_count,
//                         q.last_error AS queue_last_error,
//                         q.updated_at AS queue_updated_at
//                 FROM delivery_audit_logs dal
//                 LEFT JOIN targets t ON t.id = dal.target_id
//                 LEFT JOIN outbound_queue q ON q.id = dal.queue_id
//                 ORDER BY dal.created_at DESC
//                 LIMIT ?
//                 `,
//       )
//       .all(limit);
//   }

//   query(
//     args: {
//       queueId?: string;
//       targetId?: string;
//       operation?: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
//       status?: 'STARTED' | 'DELIVERED' | 'FAILED';
//       correlationId?: string;
//       limit?: number;
//     } = {},
//   ) {
//     const db = getDb();
//     const limit = Math.max(1, Number(args.limit ?? 100));
//     return db
//       .prepare(
//         `
//                 SELECT dal.*, t.name AS target_name, t.type AS target_type,
//                         q.delivery_status AS queue_delivery_status,
//                         q.retry_count AS queue_retry_count,
//                         q.last_error AS queue_last_error,
//                         q.updated_at AS queue_updated_at
//                 FROM delivery_audit_logs dal
//                 LEFT JOIN targets t ON t.id = dal.target_id
//                 LEFT JOIN outbound_queue q ON q.id = dal.queue_id
//                 WHERE (? IS NULL OR dal.queue_id = ?)
//                     AND (? IS NULL OR dal.target_id = ?)
//                     AND (? IS NULL OR dal.operation = ?)
//                     AND (? IS NULL OR dal.status = ?)
//                     AND (? IS NULL OR dal.correlation_id = ?)
//                 ORDER BY dal.created_at DESC
//                 LIMIT ?
//                 `,
//       )
//       .all(
//         args.queueId ?? null,
//         args.queueId ?? null,
//         args.targetId ?? null,
//         args.targetId ?? null,
//         args.operation ?? null,
//         args.operation ?? null,
//         args.status ?? null,
//         args.status ?? null,
//         args.correlationId ?? null,
//         args.correlationId ?? null,
//         limit,
//       );
//   }
// }


import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { getCurrentActorStamp } from './actor-context.service';

const nowIso = () => new Date().toISOString();

type DeliveryAuditOperation = 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
type DeliveryAuditStatus = 'STARTED' | 'DELIVERED' | 'FAILED';

export type DeliveryAuditQuery = {
    queueId?: string;
    targetId?: string;
    operation?: DeliveryAuditOperation | string;
    status?: DeliveryAuditStatus | string;
    correlationId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
};

export class DeliveryAuditService {
    log(args: {
        queueId: string;
        targetId: string;
        operation: DeliveryAuditOperation;
        status: DeliveryAuditStatus;
        attemptNo: number;
        httpStatus?: number | null;
        correlationId?: string | null;
        durationMs?: number | null;
        errorMessage?: string | null;
    }) {
        const db = getDb();
        const actor = getCurrentActorStamp();
        const id = randomUUID();
        const ts = nowIso();

        db.prepare(
            `
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
                    created_at,
                    created_by_user_id,
                    created_by_username,
                    updated_by_user_id,
                    updated_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            id,
            args.queueId,
            args.targetId,
            args.operation,
            args.status,
            args.attemptNo,
            args.httpStatus ?? null,
            args.correlationId ?? null,
            args.durationMs ?? null,
            args.errorMessage ?? null,
            ts,
            actor.userId,
            actor.username,
            actor.userId,
            actor.username,
        );

        return true;
    }

    list(limit = 100) {
        return this.query({ limit });
    }

    query(args: DeliveryAuditQuery = {}) {
        const db = getDb();
        const limit = this.clampLimit(args.limit ?? 100);
        const where: string[] = [];
        const params: any[] = [];

        const queueId = this.clean(args.queueId);
        if (queueId) {
            where.push(`LOWER(COALESCE(dal.queue_id, '')) LIKE ?`);
            params.push(this.like(queueId));
        }

        const targetReference = this.clean(args.targetId);
        if (targetReference) {
            where.push(`(
                LOWER(COALESCE(dal.target_id, '')) LIKE ?
                OR LOWER(COALESCE(t.name, '')) LIKE ?
                OR LOWER(COALESCE(t.type, '')) LIKE ?
            )`);
            const value = this.like(targetReference);
            params.push(value, value, value);
        }

        const operation = this.clean(args.operation)?.toUpperCase();
        if (operation) {
            where.push(`dal.operation = ?`);
            params.push(operation);
        }

        const status = this.clean(args.status)?.toUpperCase();
        if (status) {
            where.push(`dal.status = ?`);
            params.push(status);
        }

        const correlationId = this.clean(args.correlationId);
        if (correlationId) {
            where.push(`LOWER(COALESCE(dal.correlation_id, '')) LIKE ?`);
            params.push(this.like(correlationId));
        }

        const dateFrom = this.toIsoDate(args.dateFrom);
        if (dateFrom) {
            where.push(`dal.created_at >= ?`);
            params.push(dateFrom);
        }

        const dateTo = this.toIsoDate(args.dateTo);
        if (dateTo) {
            where.push(`dal.created_at <= ?`);
            params.push(dateTo);
        }

        const sql = `
            SELECT
                dal.*,
                t.name AS target_name,
                t.type AS target_type,
                q.normalized_result_id,
                q.delivery_status AS queue_delivery_status,
                q.retry_count AS queue_retry_count,
                q.last_error AS queue_last_error,
                q.next_retry_at AS queue_next_retry_at,
                q.preview_name AS queue_preview_name,
                q.payload_json AS queue_payload_json,
                q.source_snapshot_json AS queue_source_snapshot_json,
                q.transform_warnings_json AS queue_transform_warnings_json,
                q.transform_errors_json AS queue_transform_errors_json,
                q.transform_summary_json AS queue_transform_summary_json,
                q.created_at AS queue_created_at,
                q.updated_at AS queue_updated_at,
                n.sample_id,
                n.patient_id,
                n.patient_name,
                n.order_id,
                n.test_code,
                n.test_name,
                n.value AS result_value,
                n.observed_at AS result_observed_at
            FROM delivery_audit_logs dal
            LEFT JOIN targets t ON t.id = dal.target_id
            LEFT JOIN outbound_queue q ON q.id = dal.queue_id
            LEFT JOIN normalized_lab_results n ON n.id = q.normalized_result_id
            ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
            ORDER BY dal.created_at DESC
            LIMIT ?
        `;

        return db.prepare(sql).all(...params, limit);
    }

    private clampLimit(value: number) {
        return Math.min(Math.max(Number(value || 100), 1), 2000);
    }

    private clean(value: unknown) {
        const normalized = String(value ?? '').trim();
        return normalized ? normalized : null;
    }

    private like(value: string) {
        return `%${value.toLowerCase()}%`;
    }

    private toIsoDate(value: unknown) {
        const raw = this.clean(value);
        if (!raw) return null;
        const date = new Date(raw);
        return Number.isNaN(date.getTime()) ? raw : date.toISOString();
    }
}
