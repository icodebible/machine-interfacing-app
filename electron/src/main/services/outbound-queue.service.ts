import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { DeliveryAdapterRegistry } from '../delivery/delivery-adapter.registry';
import { TargetSecretsService } from './target-secrets.service';
import { buildAuthHeaders } from '../security/delivery-auth.util';
import { TargetTransformPreviewService } from '../transformers/target-transform-preview.service';
import { getCurrentActorStamp } from './actor-context.service';
import { auditService } from './audit.service';

const nowIso = () => new Date().toISOString();

type QueueRow = {
    id: string;
    normalized_result_id: string;
    target_id: string;
    payload_json: string;
    preview_name?: string | null;
    source_snapshot_json?: string | null;
    transform_warnings_json?: string | null;
    transform_errors_json?: string | null;
    transform_summary_json?: string | null;
    delivery_status: 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED' | 'BLOCKED';
    retry_count: number;
    next_retry_at?: string | null;
    last_error?: string | null;
    created_at: string;
    updated_at: string;
};

type DeliveryValidationStatus = 'READY' | 'WARNING' | 'BLOCKED';

type DeliveryValidationResult = {
    status: DeliveryValidationStatus;
    severity: 'success' | 'warn' | 'bad';
    payloadRowCount: number;
    errors: string[];
    warnings: string[];
    messages: string[];
    missingRequiredCodes: string[];
    unexpectedAnalyzerCodes: string[];
};

type QueuePreviewLike = {
    payload?: any;
    previewName?: string | null;
    sourceDocument?: any;
    warnings?: string[];
    errors?: string[];
    summary?: any;
};

export class OutboundQueueService {
    private readonly preview = new TargetTransformPreviewService();
    private readonly secrets = new TargetSecretsService();
    private readonly adapters = new DeliveryAdapterRegistry();

    listDueRetries(limit = 20) {
        const db = getDb();
        return db
            .prepare(
                `
                    SELECT *
                    FROM outbound_queue
                    WHERE delivery_status = 'FAILED'
                    AND next_retry_at IS NOT NULL
                    AND next_retry_at <= ?
                    ORDER BY next_retry_at ASC
                    LIMIT ?
                `,
            )
            .all(new Date().toISOString(), limit);
    }

    list(limit = 100) {
        const db = getDb();
        return db
            .prepare(
                `
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
                `,
            )
            .all(limit);
    }

    listPending(limit = 100) {
        const db = getDb();
        return db
            .prepare(
                `
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
                WHERE q.delivery_status IN ('PENDING', 'FAILED', 'SENDING', 'BLOCKED')
                ORDER BY q.created_at DESC
                LIMIT ?
                `,
            )
            .all(limit);
    }

    listDelivered(limit = 100) {
        const db = getDb();
        return db
            .prepare(
                `
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
                `,
            )
            .all(limit);
    }

    enqueueNormalizedResult(
        normalizedResultId: string,
        targetId: string,
        options: { allowInvalidPreview?: boolean } = {},
    ) {
        const db = getDb();
        const actor = getCurrentActorStamp();

        const existing = db
            .prepare(
                `SELECT id FROM outbound_queue WHERE normalized_result_id = ? AND target_id = ? LIMIT 1`,
            )
            .get(normalizedResultId, targetId) as { id?: string } | undefined;
        if (existing?.id) return false;

        const preview = this.preview.preview(targetId, normalizedResultId);
        const validation = this.validatePreviewForDelivery(preview);
        const previewWithValidation = this.withDeliveryValidation(preview, validation);
        if (validation.status === 'BLOCKED' && !options.allowInvalidPreview) {
            throw new Error(this.deliveryValidationMessage(validation));
        }

        const id = randomUUID();
        const ts = nowIso();
        const deliveryStatus = validation.status === 'BLOCKED' ? 'BLOCKED' : 'PENDING';

        db.prepare(
            `
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
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            id,
            normalizedResultId,
            targetId,
            JSON.stringify(previewWithValidation.payload ?? {}),
            previewWithValidation.previewName ?? null,
            previewWithValidation.sourceDocument ? JSON.stringify(previewWithValidation.sourceDocument) : null,
            JSON.stringify(previewWithValidation.warnings ?? []),
            JSON.stringify(previewWithValidation.errors ?? []),
            JSON.stringify(previewWithValidation.summary ?? null),
            deliveryStatus,
            validation.status === 'BLOCKED' ? this.deliveryValidationMessage(validation) : null,
            ts,
            ts,
            actor.userId,
            actor.username,
            actor.userId,
            actor.username,
        );

        auditService.record({
            source: 'OUTBOUND',
            category: 'DELIVERY',
            action: 'OUTBOUND_QUEUE_CREATED',
            status: deliveryStatus === 'BLOCKED' ? 'BLOCKED' : 'SUCCESS',
            severity: deliveryStatus === 'BLOCKED' ? 'WARNING' : 'INFO',
            entityType: 'outbound_queue',
            entityId: id,
            summary: `Outbound queue item created with status ${deliveryStatus}`,
            details: { normalizedResultId, targetId, validation },
            actor,
        });

        return true;
    }

    requeue(queueId: string) {
        const db = getDb();
        const actor = getCurrentActorStamp();
        const queueRow = db
            .prepare(`SELECT * FROM outbound_queue WHERE id = ? LIMIT 1`)
            .get(queueId) as QueueRow | undefined;

        if (!queueRow) throw new Error('Queue item not found');
        if (queueRow.delivery_status === 'SENDING') {
            throw new Error('Queue item cannot be requeued while delivery is in progress.');
        }

        const preview = this.preview.preview(queueRow.target_id, queueRow.normalized_result_id);
        const validation = this.validatePreviewForDelivery(preview);
        const previewWithValidation = this.withDeliveryValidation(preview, validation);
        this.persistPreview(queueRow.id, previewWithValidation, validation, validation.status === 'BLOCKED' ? 'BLOCKED' : 'PENDING', actor);

        auditService.record({
            source: 'OUTBOUND',
            category: 'DELIVERY',
            action: 'OUTBOUND_QUEUE_REQUEUED',
            status: validation.status === 'BLOCKED' ? 'BLOCKED' : 'SUCCESS',
            severity: validation.status === 'BLOCKED' ? 'WARNING' : 'INFO',
            entityType: 'outbound_queue',
            entityId: queueId,
            summary: `Outbound queue item requeued with validation status ${validation.status}`,
            details: { targetId: queueRow.target_id, normalizedResultId: queueRow.normalized_result_id, validation },
            actor,
        });

        if (validation.status === 'BLOCKED') {
            throw new Error(this.deliveryValidationMessage(validation));
        }

        return true;
    }

    rebuildPayload(queueId: string) {
        const db = getDb();
        const actor = getCurrentActorStamp();
        const queueRow = db
            .prepare(`SELECT * FROM outbound_queue WHERE id = ? LIMIT 1`)
            .get(queueId) as QueueRow | undefined;

        if (!queueRow) throw new Error('Queue item not found');
        if (queueRow.delivery_status === 'SENDING') {
            throw new Error('Payload cannot be rebuilt while delivery is in progress.');
        }

        const preview = this.preview.preview(queueRow.target_id, queueRow.normalized_result_id);
        const validation = this.validatePreviewForDelivery(preview);
        const previewWithValidation = this.withDeliveryValidation(preview, validation);
        this.persistPreview(queueRow.id, previewWithValidation, validation, validation.status === 'BLOCKED' ? 'BLOCKED' : 'PENDING', actor);
        auditService.record({
            source: 'OUTBOUND',
            category: 'DELIVERY',
            action: 'OUTBOUND_QUEUE_PAYLOAD_REBUILT',
            status: validation.status === 'BLOCKED' ? 'BLOCKED' : 'SUCCESS',
            severity: validation.status === 'BLOCKED' ? 'WARNING' : 'INFO',
            entityType: 'outbound_queue',
            entityId: queueId,
            summary: `Outbound payload rebuilt with validation status ${validation.status}`,
            details: { targetId: queueRow.target_id, normalizedResultId: queueRow.normalized_result_id, validation },
            actor,
        });
        return previewWithValidation;
    }

    retry(queueId: string) {
        return this.sendNow(queueId, 'RETRY_WORKER');
    }

    async sendNow(queueId: string, operation: 'SEND_NOW' | 'RETRY_WORKER' = 'SEND_NOW') {
        const db = getDb();
        const actor = getCurrentActorStamp();
        const queueRow = db
            .prepare(`SELECT * FROM outbound_queue WHERE id = ? LIMIT 1`)
            .get(queueId) as QueueRow | undefined;

        if (!queueRow) throw new Error('Queue item not found');

        const target = db
            .prepare(`SELECT * FROM targets WHERE id = ? LIMIT 1`)
            .get(queueRow.target_id) as any;
        if (!target) throw new Error('Target not found');
        if (target.enabled !== 1) throw new Error('Target is disabled');

        const storedPreview = this.preview.previewFromQueue(queueRow.id);
        const storedValidation = this.validatePreviewForDelivery(storedPreview);
        if (queueRow.delivery_status === 'BLOCKED' || storedValidation.status === 'BLOCKED') {
            this.persistPreview(queueRow.id, this.withDeliveryValidation(storedPreview, storedValidation), storedValidation, 'BLOCKED', actor);
            throw new Error(this.deliveryValidationMessage(storedValidation));
        }

        const payload = this.tryParseJson(queueRow.payload_json);
        if (!payload || typeof payload !== 'object') throw new Error('Queued payload is invalid');

        const secret = this.secrets.get(queueRow.target_id);
        const adapter = this.adapters.get(target);
        const headers = {
            ...buildAuthHeaders(secret),
            'X-Correlation-Id': randomUUID(),
        };

        const startAt = Date.now();
        const startedAuditId = this.insertAudit({
            queue_id: queueRow.id,
            target_id: queueRow.target_id,
            operation,
            status: 'STARTED',
            attempt_no: Number(queueRow.retry_count ?? 0) + 1,
            http_status: null,
            correlation_id: headers['X-Correlation-Id'] as string,
            duration_ms: null,
            error_message: null,
            actor,
        });

        db.prepare(
            `
                UPDATE outbound_queue
                SET delivery_status = 'SENDING',
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE id = ?
            `,
        ).run(nowIso(), actor.userId, actor.username, queueRow.id);

        try {
            const sendableQueueItem = {
                ...queueRow,
                delivery_status: 'SENDING' as const,
                payload_json: JSON.stringify(payload),
                updated_at: nowIso(),
            };

            const result = await adapter.send({
                target,
                queueItem: sendableQueueItem,
                headers,
                allowInsecureTls: !!secret?.allowInsecureTls,
            });

            db.prepare(
                `
                UPDATE outbound_queue
                SET delivery_status = 'DELIVERED',
                    next_retry_at = NULL,
                    last_error = NULL,
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE id = ?
                `,
            ).run(nowIso(), actor.userId, actor.username, queueRow.id);

            this.finishAudit(startedAuditId, {
                status: 'DELIVERED',
                http_status: Number(result?.status ?? 200),
                duration_ms: Date.now() - startAt,
                error_message: null,
            });
            auditService.record({
                source: 'OUTBOUND',
                category: 'DELIVERY',
                action: operation,
                status: 'SUCCESS',
                entityType: 'outbound_queue',
                entityId: queueRow.id,
                summary: `Outbound delivery ${operation} succeeded`,
                details: { targetId: queueRow.target_id, httpStatus: Number(result?.status ?? 200), durationMs: Date.now() - startAt },
                actor,
            });

            return true;
        } catch (error: any) {
            const nextRetryCount = Number(queueRow.retry_count ?? 0) + 1;
            const nextRetryAt = this.computeNextRetryAt(target, nextRetryCount);

            db.prepare(
                `
                UPDATE outbound_queue
                SET delivery_status = 'FAILED',
                    retry_count = ?,
                    next_retry_at = ?,
                    last_error = ?,
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE id = ?
                `,
            ).run(
                nextRetryCount,
                nextRetryAt,
                error?.message ?? 'Delivery failed',
                nowIso(),
                actor.userId,
                actor.username,
                queueRow.id,
            );

            this.finishAudit(startedAuditId, {
                status: 'FAILED',
                http_status: null,
                duration_ms: Date.now() - startAt,
                error_message: error?.message ?? 'Delivery failed',
            });
            auditService.record({
                source: 'OUTBOUND',
                category: 'DELIVERY',
                action: operation,
                status: 'FAILED',
                severity: 'ERROR',
                entityType: 'outbound_queue',
                entityId: queueRow.id,
                summary: `Outbound delivery ${operation} failed`,
                details: { targetId: queueRow.target_id, error: error?.message ?? 'Delivery failed', durationMs: Date.now() - startAt },
                actor,
            });

            throw error;
        }
    }

    private validatePreviewForDelivery(preview: QueuePreviewLike): DeliveryValidationResult {
        const payload = preview?.payload;
        const payloadRowCount = this.countPayloadRows(payload);
        const testOrderProfile = this.extractTestOrderProfile(preview);
        const resultHandling = this.extractResultHandling(preview);
        const missingRequiredCodes = this.stringArray(
            testOrderProfile?.missingRequiredAnalyzerCodes ?? testOrderProfile?.missingRequiredCodes ?? [],
        );
        const unexpectedAnalyzerCodes = this.stringArray(testOrderProfile?.unexpectedAnalyzerCodes ?? []);
        const errors = this.uniqueStrings([
            ...(preview.errors ?? []),
            ...this.stringArray(resultHandling?.errors ?? []),
        ]);
        const warnings = this.uniqueStrings([
            ...(preview.warnings ?? []),
            ...this.stringArray(resultHandling?.warnings ?? []),
        ]);

        if (!payload || (typeof payload === 'object' && !Array.isArray(payload) && Object.keys(payload).length === 0)) {
            errors.push('Delivery payload is empty. Rebuild payload after fixing mappings/profile configuration.');
        }
        if (payloadRowCount === 0) {
            errors.push('Delivery payload has no result rows to send.');
        }
        if (missingRequiredCodes.length) {
            errors.push(`Required LIS profile analyzer code(s) missing from payload: ${missingRequiredCodes.join(', ')}.`);
        }
        const blockedExistingCount = Number(resultHandling?.blockedExistingCount ?? 0);
        if (blockedExistingCount > 0) {
            errors.push(`Delivery has ${blockedExistingCount} LIS row(s) blocked because existing LIS results were found without repeat/correction intent.`);
        }
        if (unexpectedAnalyzerCodes.length) {
            warnings.push(`Unexpected analyzer code(s) are present for the matched LIS profile: ${unexpectedAnalyzerCodes.join(', ')}.`);
        }

        const cleanErrors = this.uniqueStrings(errors);
        const cleanWarnings = this.uniqueStrings(warnings);
        const status: DeliveryValidationStatus = cleanErrors.length ? 'BLOCKED' : cleanWarnings.length ? 'WARNING' : 'READY';
        const messages = this.uniqueStrings([
            ...(status === 'READY' ? ['Payload passed delivery validation and can be sent.'] : []),
            ...cleanErrors,
            ...cleanWarnings,
        ]);

        return {
            status,
            severity: status === 'BLOCKED' ? 'bad' : status === 'WARNING' ? 'warn' : 'success',
            payloadRowCount,
            errors: cleanErrors,
            warnings: cleanWarnings,
            messages,
            missingRequiredCodes,
            unexpectedAnalyzerCodes,
        };
    }

    private withDeliveryValidation<T extends QueuePreviewLike>(preview: T, validation: DeliveryValidationResult): T {
        const summary = preview?.summary && typeof preview.summary === 'object' ? { ...preview.summary } : {};
        summary.deliveryValidation = validation;
        return {
            ...preview,
            summary,
            errors: validation.errors,
            warnings: validation.warnings,
        };
    }

    private persistPreview(
        queueId: string,
        preview: QueuePreviewLike,
        validation: DeliveryValidationResult,
        deliveryStatus: 'PENDING' | 'BLOCKED',
        actor: { userId: string | null; username: string | null },
    ): void {
        const db = getDb();
        db.prepare(
            `
                UPDATE outbound_queue
                SET payload_json = ?,
                    preview_name = ?,
                    source_snapshot_json = ?,
                    transform_warnings_json = ?,
                    transform_errors_json = ?,
                    transform_summary_json = ?,
                    delivery_status = ?,
                    next_retry_at = NULL,
                    last_error = ?,
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE id = ?
            `,
        ).run(
            JSON.stringify(preview.payload ?? {}),
            preview.previewName ?? null,
            preview.sourceDocument ? JSON.stringify(preview.sourceDocument) : null,
            JSON.stringify(preview.warnings ?? []),
            JSON.stringify(preview.errors ?? []),
            JSON.stringify(preview.summary ?? null),
            deliveryStatus,
            validation.status === 'BLOCKED' ? this.deliveryValidationMessage(validation) : null,
            nowIso(),
            actor.userId,
            actor.username,
            queueId,
        );
    }

    private deliveryValidationMessage(validation: DeliveryValidationResult): string {
        const primary = validation.errors[0] ?? validation.warnings[0] ?? validation.messages[0];
        if (!primary) return 'Payload is blocked by delivery validation.';
        return validation.status === 'BLOCKED' ? `Payload blocked by delivery validation: ${primary}` : primary;
    }

    private countPayloadRows(payload: any): number {
        if (Array.isArray(payload)) return payload.length;
        if (Array.isArray(payload?.body)) return payload.body.length;
        if (Array.isArray(payload?.payload?.body)) return payload.payload.body.length;
        if (Array.isArray(payload?.results)) return payload.results.length;
        return 0;
    }

    private extractTestOrderProfile(preview: QueuePreviewLike): any {
        return preview?.payload?.context?.testOrderProfile
            ?? preview?.summary?.lisTestOrderProfile
            ?? preview?.sourceDocument?.lis?.testOrderProfile
            ?? null;
    }

    private extractResultHandling(preview: QueuePreviewLike): any {
        return preview?.payload?.context?.resultHandling
            ?? preview?.summary?.lisResultHandling
            ?? preview?.sourceDocument?.lis?.resultHandling
            ?? null;
    }

    private stringArray(value: any): string[] {
        if (!Array.isArray(value)) return [];
        return value.map((item) => String(item ?? '').trim()).filter(Boolean);
    }

    private uniqueStrings(values: unknown[]): string[] {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const value of values) {
            const text = String(value ?? '').trim();
            if (!text || seen.has(text)) continue;
            seen.add(text);
            out.push(text);
        }
        return out;
    }

    private insertAudit(args: {
        queue_id: string;
        target_id: string;
        operation: 'SEND_NOW' | 'RETRY_WORKER';
        status: 'STARTED' | 'DELIVERED' | 'FAILED';
        attempt_no: number;
        http_status: number | null;
        correlation_id: string | null;
        duration_ms: number | null;
        error_message: string | null;
        actor: { userId: string | null; username: string | null };
    }) {
        const db = getDb();
        const id = randomUUID();
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
            args.queue_id,
            args.target_id,
            args.operation,
            args.status,
            args.attempt_no,
            args.http_status,
            args.correlation_id,
            args.duration_ms,
            args.error_message,
            nowIso(),
            args.actor.userId,
            args.actor.username,
            args.actor.userId,
            args.actor.username,
        );
        return id;
    }

    private finishAudit(
        id: string,
        patch: {
            status: 'DELIVERED' | 'FAILED';
            http_status: number | null;
            duration_ms: number | null;
            error_message: string | null;
        },
    ) {
        const db = getDb();
        db.prepare(
            `
                UPDATE delivery_audit_logs
                SET status = ?,
                    http_status = ?,
                    duration_ms = ?,
                    error_message = ?
                WHERE id = ?
            `,
        ).run(patch.status, patch.http_status, patch.duration_ms, patch.error_message, id);
    }

    private computeNextRetryAt(target: any, nextRetryCount: number) {
        if (Number(target?.auto_retry_enabled ?? 1) !== 1) return null;
        const maxAttempts = Math.max(0, Number(target?.max_retry_attempts ?? 4));
        if (nextRetryCount > maxAttempts) return null;

        const initial = Math.max(1000, Number(target?.initial_retry_delay_ms ?? 60000));
        const max = Math.max(initial, Number(target?.max_retry_delay_ms ?? 3600000));
        const strategy = String(target?.retry_backoff_strategy ?? 'EXPONENTIAL');

        let delay = initial;
        if (strategy === 'LINEAR') delay = initial * nextRetryCount;
        if (strategy === 'EXPONENTIAL') delay = initial * Math.max(1, 2 ** (nextRetryCount - 1));
        delay = Math.min(delay, max);

        return new Date(Date.now() + delay).toISOString();
    }

    private tryParseJson(value: string | null | undefined) {
        if (!value || !String(value).trim()) return null;
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    markSending(id: string) {
        const db = getDb();
        db.prepare(
            `
                UPDATE outbound_queue
                SET delivery_status = 'SENDING',
                    updated_at = ?
                WHERE id = ?
            `,
        ).run(nowIso(), id);
        return true;
    }

    markDelivered(id: string) {
        const db = getDb();
        db.prepare(
            `
                UPDATE outbound_queue
                SET delivery_status = 'DELIVERED',
                    updated_at = ?
                WHERE id = ?
            `,
        ).run(nowIso(), id);
        return true;
    }

    getById(queueId: string) {
        const db = getDb();
        return db
            .prepare(
                `
                    SELECT *
                    FROM outbound_queue
                    WHERE id = ?
                    LIMIT 1
                `,
            )
            .get(queueId) as any;
    }

    updatePayload(queueId: string, payloadJson: string, meta?: {
        previewName?: string | null;
        sourceSnapshotJson?: string | null;
        transformWarningsJson?: string | null;
        transformErrorsJson?: string | null;
        transformSummaryJson?: string | null;
    }) {
        const db = getDb();
        db.prepare(
            `
                UPDATE outbound_queue
                SET payload_json = ?,
                    preview_name = COALESCE(?, preview_name),
                    source_snapshot_json = COALESCE(?, source_snapshot_json),
                    transform_warnings_json = COALESCE(?, transform_warnings_json),
                    transform_errors_json = COALESCE(?, transform_errors_json),
                    transform_summary_json = COALESCE(?, transform_summary_json),
                    updated_at = ?
                WHERE id = ?
            `,
        ).run(
            payloadJson,
            meta?.previewName ?? null,
            meta?.sourceSnapshotJson ?? null,
            meta?.transformWarningsJson ?? null,
            meta?.transformErrorsJson ?? null,
            meta?.transformSummaryJson ?? null,
            nowIso(),
            queueId,
        );
        return true;
    }

    markFailed(id: string, error?: string | null, nextRetryAt?: string | null) {
        const db = getDb();
        db.prepare(
            `
                UPDATE outbound_queue
                SET delivery_status = 'FAILED',
                    retry_count = retry_count + 1,
                    next_retry_at = ?,
                    last_error = ?,
                    updated_at = ?
                WHERE id = ?
            `,
        ).run(nextRetryAt ?? null, error ?? null, nowIso(), id);
        return true;
    }
}
