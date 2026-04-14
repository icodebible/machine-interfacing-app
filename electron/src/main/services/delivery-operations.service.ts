// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
// import { DeliveryAdapterRegistry } from '../delivery/delivery-adapter.registry';
// import { buildAuthHeaders } from '../security/delivery-auth.util';
// import { DeliveryAuditService } from './delivery-audit.service';
// import { MappingsService } from './mappings.service';
// import { OutboundQueueService } from './outbound-queue.service';
// import { TargetSecretsService } from './target-secrets.service';
// import { TargetTransformPreviewService } from '../transformers/target-transform-preview.service';

// type DeliveryOperation = 'SEND_NOW' | 'RETRY_WORKER';

// export class DeliveryOperationsService {
//     private adapters = new DeliveryAdapterRegistry();
//     private queue = new OutboundQueueService();
//     private preview = new TargetTransformPreviewService();
//     private mappings = new MappingsService();
//     private secrets = new TargetSecretsService();
//     private audit = new DeliveryAuditService();

//     async sendNow(queueId: string, operation: DeliveryOperation = 'SEND_NOW') {
//         const db = getDb();

//         const queueItem = this.queue.getById(queueId);
//         if (!queueItem) throw new Error('Queue item not found');

//         const target = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM targets
//                     WHERE id = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(queueItem.target_id) as any;

//         if (!target) throw new Error('Target not found');
//         if (Number(target.enabled ?? 1) !== 1) throw new Error('Target is disabled');

//         const validation = this.mappings.validate(target.type);
//         if (!validation.ok) {
//             const issues = validation.warnings?.length
//                 ? validation.warnings.join(' | ')
//                 : validation.message;
//             throw new Error(`Mapping validation failed: ${issues}`);
//         }

//         const preview = this.preview.previewFromQueue(queueId);
//         if (!preview?.payload) {
//             throw new Error('Preview payload could not be generated');
//         }

//         this.queue.updatePayload(queueId, preview.payload);

//         const queueItemForSend = {
//             ...queueItem,
//             payload_json: JSON.stringify(preview.payload),
//         };

//         const secret = this.secrets.get(target.id);
//         const headers = buildAuthHeaders(secret);
//         const correlationId = randomUUID();
//         const attemptNo = Number(queueItem.retry_count ?? 0) + 1;
//         const startedAt = Date.now();

//         this.audit.log({
//             queueId,
//             targetId: target.id,
//             operation,
//             status: 'STARTED',
//             attemptNo,
//             correlationId,
//         });

//         try {
//             this.queue.markSending(queueId);

//             const adapter = this.adapters.get(target);
//             const res = await adapter.send({
//                 target,
//                 queueItem: queueItemForSend,
//                 headers: {
//                     ...headers,
//                     'X-Correlation-Id': correlationId,
//                 },
//                 allowInsecureTls: !!secret?.allowInsecureTls,
//                 requestTimeoutMs: this.resolveRequestTimeoutMs(target),
//             });

//             this.queue.markDelivered(queueId);

//             this.audit.log({
//                 queueId,
//                 targetId: target.id,
//                 operation,
//                 status: 'DELIVERED',
//                 attemptNo,
//                 httpStatus: res.status,
//                 correlationId,
//                 durationMs: Date.now() - startedAt,
//             });

//             return true;
//         } catch (e: any) {
//             const nextRetryAt = this.computeNextRetryAt(target, attemptNo);

//             this.queue.markFailed(queueId, e?.message ?? 'Delivery failed', nextRetryAt);

//             this.audit.log({
//                 queueId,
//                 targetId: target.id,
//                 operation,
//                 status: 'FAILED',
//                 attemptNo,
//                 correlationId,
//                 durationMs: Date.now() - startedAt,
//                 errorMessage: e?.message ?? 'Delivery failed',
//             });

//             throw e;
//         }
//     }

//     private resolveRequestTimeoutMs(target: any) {
//         const value = Number(target?.request_timeout_ms ?? 15_000);
//         if (!Number.isFinite(value)) return 15_000;
//         return Math.min(300_000, Math.max(1_000, Math.trunc(value)));
//     }

//     private computeNextRetryAt(target: any, attemptNo: number) {
//         if (Number(target?.auto_retry_enabled ?? 1) !== 1) return null;

//         const maxAttempts = Math.max(0, Math.trunc(Number(target?.max_retry_attempts ?? 4)));
//         if (attemptNo >= maxAttempts) return null;

//         const initialDelay = Math.min(
//             86_400_000,
//             Math.max(1_000, Math.trunc(Number(target?.initial_retry_delay_ms ?? 60_000))),
//         );
//         const maxDelay = Math.min(
//             86_400_000,
//             Math.max(initialDelay, Math.trunc(Number(target?.max_retry_delay_ms ?? 3_600_000))),
//         );
//         const strategy = target?.retry_backoff_strategy === 'FIXED' ? 'FIXED' : 'EXPONENTIAL';

//         const delayMs =
//             strategy === 'FIXED'
//                 ? initialDelay
//                 : Math.min(initialDelay * Math.pow(2, Math.max(attemptNo - 1, 0)), maxDelay);

//         return new Date(Date.now() + delayMs).toISOString();
//     }
// }

import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { DeliveryAdapterRegistry } from '../delivery/delivery-adapter.registry';
import { buildAuthHeaders } from '../security/delivery-auth.util';
import { DeliveryAuditService } from './delivery-audit.service';
import { MappingsService } from './mappings.service';
import { OutboundQueueService } from './outbound-queue.service';
import { TargetSecretsService } from './target-secrets.service';
import { TargetTransformPreviewService } from '../transformers/target-transform-preview.service';

export class DeliveryOperationsService {
    private adapters = new DeliveryAdapterRegistry();
    private queue = new OutboundQueueService();
    private preview = new TargetTransformPreviewService();
    private mappings = new MappingsService();
    private secrets = new TargetSecretsService();
    private audit = new DeliveryAuditService();

    async sendNow(queueId: string, operation: 'SEND_NOW' | 'RETRY_WORKER' = 'SEND_NOW') {
        const db = getDb();
        const queueItem = this.queue.getById(queueId);
        if (!queueItem) throw new Error('Queue item not found');

        const target = db
            .prepare(
                `
                    SELECT *
                    FROM targets
                    WHERE id = ?
                    LIMIT 1
                `,
            )
            .get(queueItem.target_id) as any;

        if (!target) throw new Error('Target not found');
        if (target.enabled !== 1) throw new Error('Target is disabled');

        const validation = this.mappings.validate(target.type);
        if (!validation.ok) {
            throw new Error(
                `Mapping validation failed: ${(validation.errors ?? validation.warnings ?? []).join(' | ')}`,
            );
        }

        const preview = this.preview.previewFromQueue(queueId);
        if (!preview?.payload) {
            throw new Error('Preview payload could not be generated');
        }

        const payloadJson = JSON.stringify(preview.payload);
        this.queue.updatePayload(queueId, payloadJson);

        const queueItemForSend = {
            ...queueItem,
            payload_json: payloadJson,
        };

        const secret = this.secrets.get(target.id);
        const headers = buildAuthHeaders(secret);
        const attemptNo = Number(queueItem.retry_count ?? 0) + 1;
        const correlationId = randomUUID();
        const startedAt = Date.now();

        this.audit.log({
            queueId,
            targetId: target.id,
            operation,
            status: 'STARTED',
            attemptNo,
            correlationId,
        });

        try {
            this.queue.markSending(queueId);

            const adapter = this.adapters.get(target);
            const response = await adapter.send({
                target,
                queueItem: queueItemForSend,
                headers: {
                    ...headers,
                    'X-Correlation-Id': correlationId,
                },
                allowInsecureTls: !!secret?.allowInsecureTls,
            });

            this.queue.markDelivered(queueId);

            this.audit.log({
                queueId,
                targetId: target.id,
                operation,
                status: 'DELIVERED',
                attemptNo,
                httpStatus: response.status,
                correlationId,
                durationMs: Date.now() - startedAt,
            });

            return true;
        } catch (e: any) {
            const nextRetryAt = new Date(Date.now() + this.computeBackoffMs(attemptNo)).toISOString();
            this.queue.markFailed(queueId, e?.message ?? 'Delivery failed', nextRetryAt);
            this.audit.log({
                queueId,
                targetId: target.id,
                operation,
                status: 'FAILED',
                attemptNo,
                correlationId,
                durationMs: Date.now() - startedAt,
                errorMessage: e?.message ?? 'Delivery failed',
            });
            throw e;
        }
    }

    private computeBackoffMs(attemptNo: number) {
        const steps = [60_000, 300_000, 900_000, 3_600_000];
        return steps[Math.min(Math.max(attemptNo - 1, 0), steps.length - 1)];
    }
}
