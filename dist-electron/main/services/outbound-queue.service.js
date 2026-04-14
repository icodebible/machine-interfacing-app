"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OutboundQueueService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const delivery_adapter_registry_1 = require("../delivery/delivery-adapter.registry");
const target_secrets_service_1 = require("./target-secrets.service");
const delivery_auth_util_1 = require("../security/delivery-auth.util");
const target_transform_preview_service_1 = require("../transformers/target-transform-preview.service");
const actor_context_service_1 = require("./actor-context.service");
const nowIso = () => new Date().toISOString();
class OutboundQueueService {
    preview = new target_transform_preview_service_1.TargetTransformPreviewService();
    secrets = new target_secrets_service_1.TargetSecretsService();
    adapters = new delivery_adapter_registry_1.DeliveryAdapterRegistry();
    listDueRetries(limit = 20) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                    SELECT *
                    FROM outbound_queue
                    WHERE delivery_status = 'FAILED'
                    AND next_retry_at IS NOT NULL
                    AND next_retry_at <= ?
                    ORDER BY next_retry_at ASC
                    LIMIT ?
                `)
            .all(new Date().toISOString(), limit);
    }
    list(limit = 100) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                SELECT q.*, t.name AS target_name, t.type AS target_type,
                        t.enabled AS target_enabled,
                        t.auto_retry_enabled AS target_auto_retry_enabled,
                        t.max_retry_attempts AS target_max_retry_attempts,
                        t.retry_backoff_strategy AS target_retry_backoff_strategy,
                        t.initial_retry_delay_ms AS target_initial_retry_delay_ms,
                        t.max_retry_delay_ms AS target_max_retry_delay_ms,
                        t.request_timeout_ms AS target_request_timeout_ms
                FROM outbound_queue q
                LEFT JOIN targets t ON t.id = q.target_id
                ORDER BY q.created_at DESC
                LIMIT ?
                `)
            .all(limit);
    }
    listPending(limit = 100) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                SELECT q.*, t.name AS target_name, t.type AS target_type,
                        t.enabled AS target_enabled,
                        t.auto_retry_enabled AS target_auto_retry_enabled,
                        t.max_retry_attempts AS target_max_retry_attempts,
                        t.retry_backoff_strategy AS target_retry_backoff_strategy,
                        t.initial_retry_delay_ms AS target_initial_retry_delay_ms,
                        t.max_retry_delay_ms AS target_max_retry_delay_ms,
                        t.request_timeout_ms AS target_request_timeout_ms
                FROM outbound_queue q
                LEFT JOIN targets t ON t.id = q.target_id
                WHERE q.delivery_status IN ('PENDING', 'FAILED', 'SENDING')
                ORDER BY q.created_at DESC
                LIMIT ?
                `)
            .all(limit);
    }
    listDelivered(limit = 100) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                SELECT q.*, t.name AS target_name, t.type AS target_type,
                        t.enabled AS target_enabled,
                        t.auto_retry_enabled AS target_auto_retry_enabled,
                        t.max_retry_attempts AS target_max_retry_attempts,
                        t.retry_backoff_strategy AS target_retry_backoff_strategy,
                        t.initial_retry_delay_ms AS target_initial_retry_delay_ms,
                        t.max_retry_delay_ms AS target_max_retry_delay_ms,
                        t.request_timeout_ms AS target_request_timeout_ms
                FROM outbound_queue q
                LEFT JOIN targets t ON t.id = q.target_id
                WHERE q.delivery_status = 'DELIVERED'
                ORDER BY q.updated_at DESC, q.created_at DESC
                LIMIT ?
                `)
            .all(limit);
    }
    enqueueNormalizedResult(normalizedResultId, targetId) {
        const db = (0, db_1.getDb)();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const existing = db
            .prepare(`SELECT id FROM outbound_queue WHERE normalized_result_id = ? AND target_id = ? LIMIT 1`)
            .get(normalizedResultId, targetId);
        if (existing?.id)
            return false;
        const preview = this.preview.preview(targetId, normalizedResultId);
        if ((preview.errors ?? []).length > 0) {
            throw new Error(`Cannot enqueue result because the configured transformation has ${preview.errors?.length} blocking error${preview.errors?.length === 1 ? '' : 's'}. Review the transform preview first.`);
        }
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        db.prepare(`
                INSERT INTO outbound_queue (
                    id,
                    normalized_result_id,
                    target_id,
                    payload_json,
                    preview_name,
                    source_snapshot_json,
                    transform_warnings_json,
                    transform_errors_json,
                    transform_summary_json,
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, NULL, NULL, ?, ?, ?, ?, ?, ?)
            `).run(id, normalizedResultId, targetId, JSON.stringify(preview.payload ?? {}), preview.previewName ?? null, preview.sourceDocument ? JSON.stringify(preview.sourceDocument) : null, JSON.stringify(preview.warnings ?? []), JSON.stringify(preview.errors ?? []), JSON.stringify(preview.summary ?? null), ts, ts, actor.userId, actor.username, actor.userId, actor.username);
        return true;
    }
    requeue(queueId) {
        const db = (0, db_1.getDb)();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const res = db
            .prepare(`
                UPDATE outbound_queue
                SET delivery_status = 'PENDING',
                    next_retry_at = NULL,
                    last_error = NULL,
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE id = ?
                `)
            .run(nowIso(), actor.userId, actor.username, queueId);
        if (res.changes !== 1)
            throw new Error('Queue item not found');
        return true;
    }
    retry(queueId) {
        return this.sendNow(queueId, 'RETRY_WORKER');
    }
    async sendNow(queueId, operation = 'SEND_NOW') {
        const db = (0, db_1.getDb)();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const queueRow = db
            .prepare(`SELECT * FROM outbound_queue WHERE id = ? LIMIT 1`)
            .get(queueId);
        if (!queueRow)
            throw new Error('Queue item not found');
        const target = db
            .prepare(`SELECT * FROM targets WHERE id = ? LIMIT 1`)
            .get(queueRow.target_id);
        if (!target)
            throw new Error('Target not found');
        if (target.enabled !== 1)
            throw new Error('Target is disabled');
        const payload = this.tryParseJson(queueRow.payload_json);
        if (!payload || typeof payload !== 'object')
            throw new Error('Queued payload is invalid');
        const secret = this.secrets.get(queueRow.target_id);
        const adapter = this.adapters.get(target);
        const headers = {
            ...(0, delivery_auth_util_1.buildAuthHeaders)(secret),
            'X-Correlation-Id': (0, crypto_1.randomUUID)(),
        };
        const startAt = Date.now();
        const startedAuditId = this.insertAudit({
            queue_id: queueRow.id,
            target_id: queueRow.target_id,
            operation,
            status: 'STARTED',
            attempt_no: Number(queueRow.retry_count ?? 0) + 1,
            http_status: null,
            correlation_id: headers['X-Correlation-Id'],
            duration_ms: null,
            error_message: null,
            actor,
        });
        db.prepare(`
                UPDATE outbound_queue
                SET delivery_status = 'SENDING',
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE id = ?
            `).run(nowIso(), actor.userId, actor.username, queueRow.id);
        try {
            const result = await adapter.send({
                target,
                queueItem: queueRow,
                headers,
                allowInsecureTls: !!secret?.allowInsecureTls,
            });
            db.prepare(`
                UPDATE outbound_queue
                SET delivery_status = 'DELIVERED',
                    next_retry_at = NULL,
                    last_error = NULL,
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE id = ?
                `).run(nowIso(), actor.userId, actor.username, queueRow.id);
            this.finishAudit(startedAuditId, {
                status: 'DELIVERED',
                http_status: Number(result?.status ?? 200),
                duration_ms: Date.now() - startAt,
                error_message: null,
            });
            return true;
        }
        catch (error) {
            const nextRetryCount = Number(queueRow.retry_count ?? 0) + 1;
            const nextRetryAt = this.computeNextRetryAt(target, nextRetryCount);
            db.prepare(`
                UPDATE outbound_queue
                SET delivery_status = 'FAILED',
                    retry_count = ?,
                    next_retry_at = ?,
                    last_error = ?,
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE id = ?
                `).run(nextRetryCount, nextRetryAt, error?.message ?? 'Delivery failed', nowIso(), actor.userId, actor.username, queueRow.id);
            this.finishAudit(startedAuditId, {
                status: 'FAILED',
                http_status: null,
                duration_ms: Date.now() - startAt,
                error_message: error?.message ?? 'Delivery failed',
            });
            throw error;
        }
    }
    insertAudit(args) {
        const db = (0, db_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
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
                created_at,
                created_by_user_id,
                created_by_username,
                updated_by_user_id,
                updated_by_username
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(id, args.queue_id, args.target_id, args.operation, args.status, args.attempt_no, args.http_status, args.correlation_id, args.duration_ms, args.error_message, nowIso(), args.actor.userId, args.actor.username, args.actor.userId, args.actor.username);
        return id;
    }
    finishAudit(id, patch) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE delivery_audit_logs
                SET status = ?,
                    http_status = ?,
                    duration_ms = ?,
                    error_message = ?
                WHERE id = ?
            `).run(patch.status, patch.http_status, patch.duration_ms, patch.error_message, id);
    }
    computeNextRetryAt(target, nextRetryCount) {
        if (Number(target?.auto_retry_enabled ?? 1) !== 1)
            return null;
        const maxAttempts = Math.max(0, Number(target?.max_retry_attempts ?? 4));
        if (nextRetryCount > maxAttempts)
            return null;
        const initial = Math.max(1000, Number(target?.initial_retry_delay_ms ?? 60000));
        const max = Math.max(initial, Number(target?.max_retry_delay_ms ?? 3600000));
        const strategy = String(target?.retry_backoff_strategy ?? 'EXPONENTIAL');
        let delay = initial;
        if (strategy === 'LINEAR')
            delay = initial * nextRetryCount;
        if (strategy === 'EXPONENTIAL')
            delay = initial * Math.max(1, 2 ** (nextRetryCount - 1));
        delay = Math.min(delay, max);
        return new Date(Date.now() + delay).toISOString();
    }
    tryParseJson(value) {
        if (!value || !String(value).trim())
            return null;
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
    markSending(id) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE outbound_queue
                SET delivery_status = 'SENDING',
                    updated_at = ?
                WHERE id = ?
            `).run(nowIso(), id);
        return true;
    }
    markDelivered(id) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE outbound_queue
                SET delivery_status = 'DELIVERED',
                    updated_at = ?
                WHERE id = ?
            `).run(nowIso(), id);
        return true;
    }
    getById(queueId) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                    SELECT *
                    FROM outbound_queue
                    WHERE id = ?
                    LIMIT 1
                `)
            .get(queueId);
    }
    updatePayload(queueId, payloadJson, meta) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE outbound_queue
                SET payload_json = ?,
                    preview_name = COALESCE(?, preview_name),
                    source_snapshot_json = COALESCE(?, source_snapshot_json),
                    transform_warnings_json = COALESCE(?, transform_warnings_json),
                    transform_errors_json = COALESCE(?, transform_errors_json),
                    transform_summary_json = COALESCE(?, transform_summary_json),
                    updated_at = ?
                WHERE id = ?
            `).run(payloadJson, meta?.previewName ?? null, meta?.sourceSnapshotJson ?? null, meta?.transformWarningsJson ?? null, meta?.transformErrorsJson ?? null, meta?.transformSummaryJson ?? null, nowIso(), queueId);
        return true;
    }
    markFailed(id, error, nextRetryAt) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE outbound_queue
                SET delivery_status = 'FAILED',
                    retry_count = retry_count + 1,
                    next_retry_at = ?,
                    last_error = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(nextRetryAt ?? null, error ?? null, nowIso(), id);
        return true;
    }
}
exports.OutboundQueueService = OutboundQueueService;
