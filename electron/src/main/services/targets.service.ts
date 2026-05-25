// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
// import { logEvent } from '../logging/auditLog';
// import { DeliveryAdapterRegistry } from '../delivery/delivery-adapter.registry';
// import { TargetSecretsService } from './target-secrets.service';
// import { buildAuthHeaders } from '../security/delivery-auth.util';
// import { SecureHttpClient } from '../security/secure-http.client';
// import { getCurrentActorStamp } from './actor-context.service';

// const nowIso = () => new Date().toISOString();

// export type TargetDto = {
//     type: 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
//     name: string;
//     base_url: string;
//     enabled?: number;
//     auto_retry_enabled?: number;
//     max_retry_attempts?: number | null;
//     retry_backoff_strategy?: 'FIXED' | 'EXPONENTIAL' | null;
//     initial_retry_delay_ms?: number | null;
//     max_retry_delay_ms?: number | null;
//     request_timeout_ms?: number | null;
// };

// const normalizeBaseUrl = (value: string) => (value ?? '').trim().replace(/\/+$/, '');
// const intOr = (value: unknown, fallback: number) => {
//     const n = Number(value);
//     return Number.isFinite(n) ? Math.trunc(n) : fallback;
// };

// export class TargetsService {
//     private readonly secrets = new TargetSecretsService();
//     private readonly http = new SecureHttpClient();
//     private readonly adapters = new DeliveryAdapterRegistry();

//     // list() {
//     //     const db = getDb();
//     //     return db.prepare(`SELECT * FROM targets ORDER BY type ASC, name ASC`).all();
//     // }

//     // create(dto: TargetDto) {
//     //     const db = getDb();
//     //     const id = randomUUID();
//     //     const ts = nowIso();

//     //     db.prepare(
//     //         `
//     //         INSERT INTO targets (id, type, name, base_url, enabled, created_at, updated_at)
//     //         VALUES (?, ?, ?, ?, ?, ?, ?)
//     //     `,
//     //     ).run(id, dto.type, dto.name, dto.base_url, dto.enabled ?? 1, ts, ts);

//     //     logEvent({
//     //         level: 'info',
//     //         source: 'APP',
//     //         entityType: 'target',
//     //         entityId: id,
//     //         message: 'Target created',
//     //     });
//     //     return { id };
//     // }

//     // update(id: string, dto: Partial<TargetDto>) {
//     //     const db = getDb();
//     //     const ts = nowIso();

//     //     const res = db
//     //         .prepare(
//     //             `
//     //         UPDATE targets
//     //         SET type = COALESCE(?, type),
//     //             name = COALESCE(?, name),
//     //             base_url = COALESCE(?, base_url),
//     //             enabled = COALESCE(?, enabled),
//     //             updated_at = ?
//     //         WHERE id = ?
//     //     `,
//     //         )
//     //         .run(dto.type ?? null, dto.name ?? null, dto.base_url ?? null, dto.enabled ?? null, ts, id);

//     //     if (res.changes !== 1) throw new Error(`Target update failed (id=${id})`);
//     //     logEvent({
//     //         level: 'info',
//     //         source: 'APP',
//     //         entityType: 'target',
//     //         entityId: id,
//     //         message: 'Target updated',
//     //     });
//     //     return true;
//     // }

//     // delete(id: string) {
//     //     const db = getDb();
//     //     db.prepare(`DELETE FROM targets WHERE id = ?`).run(id);
//     //     logEvent({
//     //         level: 'warn',
//     //         source: 'APP',
//     //         entityType: 'target',
//     //         entityId: id,
//     //         message: 'Target deleted',
//     //     });
//     //     return true;
//     // }

//     // async test(id: string) {
//     //     const db = getDb();
//     //     const target = db.prepare(`SELECT * FROM targets WHERE id = ? LIMIT 1`).get(id) as any;
//     //     if (!target) throw new Error('Target not found');

//     //     const secret = this.secrets.get(id);
//     //     const headers = buildAuthHeaders(secret);
//     //     const probeUrl = this.buildProbeUrl(target);
//     //     const checkedAt = nowIso();
//     //     const notes: string[] = [];

//     //     if (Object.keys(headers).length === 0) {
//     //         notes.push('No connector auth headers are currently configured.');
//     //     }

//     //     try {
//     //         const res = await this.http.probe(probeUrl, headers, !!secret?.allowInsecureTls);
//     //         if (!res.ok) {
//     //             notes.push('The connector responded but did not return a success status.');
//     //         }

//     //         logEvent({
//     //             level: res.ok ? 'info' : 'warn',
//     //             source: 'TARGET',
//     //             entityType: 'target',
//     //             entityId: id,
//     //             message: `Target diagnostics completed (${res.status})`,
//     //         });

//     //         return {
//     //             ok: res.ok,
//     //             message: res.ok
//     //                 ? 'Connector diagnostics succeeded.'
//     //                 : `Connector diagnostics returned HTTP ${res.status}.`,
//     //             details: {
//     //                 targetId: target.id,
//     //                 targetName: target.name,
//     //                 targetType: target.type,
//     //                 baseUrl: target.base_url,
//     //                 probeUrl,
//     //                 authType: secret?.authType ?? 'none',
//     //                 authConfigured: Object.keys(headers).length > 0,
//     //                 tlsMode: secret?.allowInsecureTls ? 'insecure-dev' : 'strict',
//     //                 httpStatus: res.status,
//     //                 checkedAt,
//     //                 notes,
//     //                 responseSnippet: res.body ? res.body.slice(0, 500) : null,
//     //             },
//     //         };
//     //     } catch (error: any) {
//     //         notes.push(error?.message ?? 'Connector diagnostics failed.');
//     //         logEvent({
//     //             level: 'error',
//     //             source: 'TARGET',
//     //             entityType: 'target',
//     //             entityId: id,
//     //             message: `Target diagnostics failed: ${error?.message ?? 'Unknown error'}`,
//     //         });
//     //         return {
//     //             ok: false,
//     //             message: error?.message ?? 'Connector diagnostics failed.',
//     //             details: {
//     //                 targetId: target.id,
//     //                 targetName: target.name,
//     //                 targetType: target.type,
//     //                 baseUrl: target.base_url,
//     //                 probeUrl,
//     //                 authType: secret?.authType ?? 'none',
//     //                 authConfigured: Object.keys(headers).length > 0,
//     //                 tlsMode: secret?.allowInsecureTls ? 'insecure-dev' : 'strict',
//     //                 httpStatus: null,
//     //                 checkedAt,
//     //                 notes,
//     //                 responseSnippet: null,
//     //             },
//     //         };
//     //     }
//     // }

//     async harnessSend(targetId: string, payload: any, label?: string | null) {
//         const db = getDb();
//         const target = db.prepare(`SELECT * FROM targets WHERE id = ? LIMIT 1`).get(targetId) as any;
//         if (!target) throw new Error('Target not found');
//         if (target.enabled !== 1) throw new Error('Target is disabled');

//         const secret = this.secrets.get(targetId);
//         const correlationId = randomUUID();
//         const headers = {
//             ...buildAuthHeaders(secret),
//             'X-Test-Harness': '1',
//             'X-Correlation-Id': correlationId,
//         };
//         const checkedAt = nowIso();
//         const notes: string[] = [];
//         const endpoint = this.buildDeliveryEndpoint(target);

//         if (Object.keys(headers).length <= 2) {
//             notes.push('No connector auth headers are currently configured.');
//         }

//         try {
//             const adapter = this.adapters.get(target);
//             const queueItem = {
//                 id: `HARNESS-${randomUUID()}`,
//                 target_id: target.id,
//                 payload_json: JSON.stringify(payload ?? {}),
//                 delivery_status: 'PENDING' as const,
//                 retry_count: 0,
//                 next_retry_at: null,
//                 last_error: null,
//             };

//             const result = await adapter.send({
//                 target,
//                 queueItem,
//                 headers,
//                 allowInsecureTls: !!secret?.allowInsecureTls,
//             });

//             logEvent({
//                 level: 'info',
//                 source: 'TARGET',
//                 entityType: 'target',
//                 entityId: targetId,
//                 message: `Connector harness send succeeded (${result.status})`,
//             });

//             return {
//                 ok: true,
//                 message: 'Harness delivery succeeded.',
//                 correlationId,
//                 details: {
//                     targetId: target.id,
//                     targetName: target.name,
//                     targetType: target.type,
//                     endpoint,
//                     label: label ?? null,
//                     authType: secret?.authType ?? 'none',
//                     authConfigured: Object.keys(headers).length > 2,
//                     tlsMode: secret?.allowInsecureTls ? 'insecure-dev' : 'strict',
//                     httpStatus: result.status,
//                     checkedAt,
//                     notes,
//                     responseSnippet: result.body ? String(result.body).slice(0, 500) : null,
//                 },
//             };
//         } catch (error: any) {
//             notes.push(error?.message ?? 'Harness delivery failed.');
//             logEvent({
//                 level: 'error',
//                 source: 'TARGET',
//                 entityType: 'target',
//                 entityId: targetId,
//                 message: `Connector harness send failed: ${error?.message ?? 'Unknown error'}`,
//             });
//             return {
//                 ok: false,
//                 message: error?.message ?? 'Harness delivery failed.',
//                 correlationId,
//                 details: {
//                     targetId: target.id,
//                     targetName: target.name,
//                     targetType: target.type,
//                     endpoint,
//                     label: label ?? null,
//                     authType: secret?.authType ?? 'none',
//                     authConfigured: Object.keys(headers).length > 2,
//                     tlsMode: secret?.allowInsecureTls ? 'insecure-dev' : 'strict',
//                     httpStatus: null,
//                     checkedAt,
//                     notes,
//                     responseSnippet: null,
//                 },
//             };
//         }
//     }

//     private buildProbeUrl(target: { type: string; base_url: string }) {
//         const base = target.base_url.replace(/\/+$/, '');
//         switch (target.type) {
//             case 'DHIS2':
//                 return `${base}/system/ping`;
//             case 'OPENMRS':
//                 return `${base}/session`;
//             case 'LIS':
//                 return `${base}/health`;
//             case 'CUSTOM_HTTP':
//             default:
//                 return base;
//         }
//     }

//     private buildDeliveryEndpoint(target: { type: string; base_url: string }) {
//         const base = target.base_url.replace(/\/+$/, '');
//         switch (target.type) {
//             case 'DHIS2':
//                 return `${base}/events`;
//             case 'OPENMRS':
//                 return `${base}/lab-results`;
//             case 'LIS':
//                 return `${base}/results`;
//             case 'CUSTOM_HTTP':
//             default:
//                 return base;
//         }
//     }

//     // ---------------------------

//     list() {
//         const db = getDb();
//         return db.prepare(`SELECT * FROM targets ORDER BY type ASC, name ASC`).all();
//     }

//     create(dto: TargetDto) {
//         const db = getDb();
//         const id = randomUUID();
//         const ts = nowIso();
//         const actor = getCurrentActorStamp();

//         db.prepare(
//             `
//                 INSERT INTO targets (
//                     id,
//                     type,
//                     name,
//                     base_url,
//                     enabled,
//                     auto_retry_enabled,
//                     max_retry_attempts,
//                     retry_backoff_strategy,
//                     initial_retry_delay_ms,
//                     max_retry_delay_ms,
//                     request_timeout_ms,
//                     created_at,
//                     updated_at,
//                     created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
//                 )
//                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.type,
//             dto.name,
//             normalizeBaseUrl(dto.base_url),
//             intOr(dto.enabled, 1),
//             intOr(dto.auto_retry_enabled, 1),
//             Math.max(0, intOr(dto.max_retry_attempts, 4)),
//             dto.retry_backoff_strategy ?? 'EXPONENTIAL',
//             Math.max(1_000, intOr(dto.initial_retry_delay_ms, 60_000)),
//             Math.max(1_000, intOr(dto.max_retry_delay_ms, 3_600_000)),
//             Math.max(1_000, intOr(dto.request_timeout_ms, 15_000)),
//             ts,
//             ts,
//             actor.userId,
//             actor.username,
//             actor.userId,
//             actor.username,
//         );

//         logEvent({
//             level: 'info',
//             source: 'APP',
//             entityType: 'target',
//             entityId: id,
//             message: 'Target created',
//         });
//         return { id };
//     }

//     update(id: string, dto: Partial<TargetDto>) {
//         const db = getDb();
//         const ts = nowIso();
//         const actor = getCurrentActorStamp();

//         const res = db
//             .prepare(
//                 `
//                 UPDATE targets SET
//                     type = COALESCE(?, type),
//                     name = COALESCE(?, name),
//                     base_url = COALESCE(?, base_url),
//                     enabled = COALESCE(?, enabled),
//                     auto_retry_enabled = COALESCE(?, auto_retry_enabled),
//                     max_retry_attempts = COALESCE(?, max_retry_attempts),
//                     retry_backoff_strategy = COALESCE(?, retry_backoff_strategy),
//                     initial_retry_delay_ms = COALESCE(?, initial_retry_delay_ms),
//                     max_retry_delay_ms = COALESCE(?, max_retry_delay_ms),
//                     request_timeout_ms = COALESCE(?, request_timeout_ms),
//                     updated_at = ?,
//                     updated_by_user_id = ?,
//                     updated_by_username = ?
//                 WHERE id = ?
//                 `,
//             )
//             .run(
//                 dto.type ?? null,
//                 dto.name ?? null,
//                 dto.base_url ? normalizeBaseUrl(dto.base_url) : null,
//                 dto.enabled ?? null,
//                 dto.auto_retry_enabled ?? null,
//                 dto.max_retry_attempts ?? null,
//                 dto.retry_backoff_strategy ?? null,
//                 dto.initial_retry_delay_ms ?? null,
//                 dto.max_retry_delay_ms ?? null,
//                 dto.request_timeout_ms ?? null,
//                 ts,
//                 actor.userId,
//                 actor.username,
//                 id,
//             );

//         if (res.changes !== 1) throw new Error(`Target update failed (id=${id})`);
//         logEvent({
//             level: 'info',
//             source: 'APP',
//             entityType: 'target',
//             entityId: id,
//             message: 'Target updated',
//         });
//         return true;
//     }

//     delete(id: string) {
//         const db = getDb();
//         db.prepare(`DELETE FROM targets WHERE id = ?`).run(id);
//         logEvent({
//             level: 'warn',
//             source: 'APP',
//             entityType: 'target',
//             entityId: id,
//             message: 'Target deleted',
//         });
//         return true;
//     }

//     test(id: string) {
//         const db = getDb();
//         const row = db.prepare(`SELECT * FROM targets WHERE id = ? LIMIT 1`).get(id) as any;
//         if (!row) throw new Error('Target not found');

//         logEvent({
//             level: 'info',
//             source: 'TARGET',
//             entityType: 'target',
//             entityId: id,
//             message: 'Target test requested',
//         });

//         return {
//             ok: true,
//             message: 'Connector diagnostics completed.',
//             details: {
//                 targetId: row.id,
//                 targetName: row.name,
//                 targetType: row.type,
//                 baseUrl: row.base_url,
//                 checkedAt: nowIso(),
//                 notes: [
//                     `Request timeout: ${row.request_timeout_ms ?? 15000} ms`,
//                     `Auto retry: ${(row.auto_retry_enabled ?? 1) === 1 ? 'enabled' : 'disabled'}`,
//                     `Max retry attempts: ${row.max_retry_attempts ?? 4}`,
//                     `Backoff strategy: ${row.retry_backoff_strategy ?? 'EXPONENTIAL'}`,
//                 ],
//             },
//         };
//     }
// }

import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { logEvent } from '../logging/auditLog';
import { DeliveryAdapterRegistry } from '../delivery/delivery-adapter.registry';
import { TargetSecretsService } from './target-secrets.service';
import { buildAuthHeaders } from '../security/delivery-auth.util';
import { SecureHttpClient } from '../security/secure-http.client';
import { getCurrentActorStamp } from './actor-context.service';

const nowIso = () => new Date().toISOString();

export type TargetDto = {
    type: 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
    name: string;
    base_url: string;
    enabled?: number;
    auto_retry_enabled?: number;
    max_retry_attempts?: number | null;
    retry_backoff_strategy?: 'FIXED' | 'EXPONENTIAL' | null;
    initial_retry_delay_ms?: number | null;
    max_retry_delay_ms?: number | null;
    request_timeout_ms?: number | null;
};

const normalizeBaseUrl = (value: string) => (value ?? '').trim().replace(/\/+$/, '');
const intOr = (value: unknown, fallback: number) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

export class TargetsService {
    private readonly secrets = new TargetSecretsService();
    private readonly http = new SecureHttpClient();
    private readonly adapters = new DeliveryAdapterRegistry();

    // list() {
    //     const db = getDb();
    //     return db.prepare(`SELECT * FROM targets ORDER BY type ASC, name ASC`).all();
    // }

    // create(dto: TargetDto) {
    //     const db = getDb();
    //     const id = randomUUID();
    //     const ts = nowIso();

    //     db.prepare(
    //         `
    //         INSERT INTO targets (id, type, name, base_url, enabled, created_at, updated_at)
    //         VALUES (?, ?, ?, ?, ?, ?, ?)
    //     `,
    //     ).run(id, dto.type, dto.name, dto.base_url, dto.enabled ?? 1, ts, ts);

    //     logEvent({
    //         level: 'info',
    //         source: 'APP',
    //         entityType: 'target',
    //         entityId: id,
    //         message: 'Target created',
    //     });
    //     return { id };
    // }

    // update(id: string, dto: Partial<TargetDto>) {
    //     const db = getDb();
    //     const ts = nowIso();

    //     const res = db
    //         .prepare(
    //             `
    //         UPDATE targets
    //         SET type = COALESCE(?, type),
    //             name = COALESCE(?, name),
    //             base_url = COALESCE(?, base_url),
    //             enabled = COALESCE(?, enabled),
    //             updated_at = ?
    //         WHERE id = ?
    //     `,
    //         )
    //         .run(dto.type ?? null, dto.name ?? null, dto.base_url ?? null, dto.enabled ?? null, ts, id);

    //     if (res.changes !== 1) throw new Error(`Target update failed (id=${id})`);
    //     logEvent({
    //         level: 'info',
    //         source: 'APP',
    //         entityType: 'target',
    //         entityId: id,
    //         message: 'Target updated',
    //     });
    //     return true;
    // }

    // delete(id: string) {
    //     const db = getDb();
    //     db.prepare(`DELETE FROM targets WHERE id = ?`).run(id);
    //     logEvent({
    //         level: 'warn',
    //         source: 'APP',
    //         entityType: 'target',
    //         entityId: id,
    //         message: 'Target deleted',
    //     });
    //     return true;
    // }

    // async test(id: string) {
    //     const db = getDb();
    //     const target = db.prepare(`SELECT * FROM targets WHERE id = ? LIMIT 1`).get(id) as any;
    //     if (!target) throw new Error('Target not found');

    //     const secret = this.secrets.get(id);
    //     const headers = buildAuthHeaders(secret);
    //     const probeUrl = this.buildProbeUrl(target);
    //     const checkedAt = nowIso();
    //     const notes: string[] = [];

    //     if (Object.keys(headers).length === 0) {
    //         notes.push('No connector auth headers are currently configured.');
    //     }

    //     try {
    //         const res = await this.http.probe(probeUrl, headers, !!secret?.allowInsecureTls);
    //         if (!res.ok) {
    //             notes.push('The connector responded but did not return a success status.');
    //         }

    //         logEvent({
    //             level: res.ok ? 'info' : 'warn',
    //             source: 'TARGET',
    //             entityType: 'target',
    //             entityId: id,
    //             message: `Target diagnostics completed (${res.status})`,
    //         });

    //         return {
    //             ok: res.ok,
    //             message: res.ok
    //                 ? 'Connector diagnostics succeeded.'
    //                 : `Connector diagnostics returned HTTP ${res.status}.`,
    //             details: {
    //                 targetId: target.id,
    //                 targetName: target.name,
    //                 targetType: target.type,
    //                 baseUrl: target.base_url,
    //                 probeUrl,
    //                 authType: secret?.authType ?? 'none',
    //                 authConfigured: Object.keys(headers).length > 0,
    //                 tlsMode: secret?.allowInsecureTls ? 'insecure-dev' : 'strict',
    //                 httpStatus: res.status,
    //                 checkedAt,
    //                 notes,
    //                 responseSnippet: res.body ? res.body.slice(0, 500) : null,
    //             },
    //         };
    //     } catch (error: any) {
    //         notes.push(error?.message ?? 'Connector diagnostics failed.');
    //         logEvent({
    //             level: 'error',
    //             source: 'TARGET',
    //             entityType: 'target',
    //             entityId: id,
    //             message: `Target diagnostics failed: ${error?.message ?? 'Unknown error'}`,
    //         });
    //         return {
    //             ok: false,
    //             message: error?.message ?? 'Connector diagnostics failed.',
    //             details: {
    //                 targetId: target.id,
    //                 targetName: target.name,
    //                 targetType: target.type,
    //                 baseUrl: target.base_url,
    //                 probeUrl,
    //                 authType: secret?.authType ?? 'none',
    //                 authConfigured: Object.keys(headers).length > 0,
    //                 tlsMode: secret?.allowInsecureTls ? 'insecure-dev' : 'strict',
    //                 httpStatus: null,
    //                 checkedAt,
    //                 notes,
    //                 responseSnippet: null,
    //             },
    //         };
    //     }
    // }

    async harnessSend(targetId: string, payload: any, label?: string | null) {
        const db = getDb();
        const target = db.prepare(`SELECT * FROM targets WHERE id = ? LIMIT 1`).get(targetId) as any;
        if (!target) throw new Error('Target not found');
        if (target.enabled !== 1) throw new Error('Target is disabled');

        const secret = this.secrets.get(targetId);
        const correlationId = randomUUID();
        const headers = {
            ...buildAuthHeaders(secret),
            'X-Test-Harness': '1',
            'X-Correlation-Id': correlationId,
        };
        const checkedAt = nowIso();
        const notes: string[] = [];
        const endpoint = this.buildDeliveryEndpoint(target);

        if (Object.keys(headers).length <= 2) {
            notes.push('No connector auth headers are currently configured.');
        }

        try {
            const adapter = this.adapters.get(target);
            const queueItem = {
                id: `HARNESS-${randomUUID()}`,
                target_id: target.id,
                payload_json: JSON.stringify(payload ?? {}),
                delivery_status: 'PENDING' as const,
                retry_count: 0,
                next_retry_at: null,
                last_error: null,
            };

            const result = await adapter.send({
                target,
                queueItem,
                headers,
                allowInsecureTls: !!secret?.allowInsecureTls,
            });

            logEvent({
                level: 'info',
                source: 'TARGET',
                entityType: 'target',
                entityId: targetId,
                message: `Connector harness send succeeded (${result.status})`,
            });

            return {
                ok: true,
                message: 'Harness delivery succeeded.',
                correlationId,
                details: {
                    targetId: target.id,
                    targetName: target.name,
                    targetType: target.type,
                    endpoint,
                    label: label ?? null,
                    authType: secret?.authType ?? 'none',
                    authConfigured: Object.keys(headers).length > 2,
                    tlsMode: secret?.allowInsecureTls ? 'insecure-dev' : 'strict',
                    httpStatus: result.status,
                    checkedAt,
                    notes,
                    responseSnippet: result.body ? String(result.body).slice(0, 500) : null,
                },
            };
        } catch (error: any) {
            notes.push(error?.message ?? 'Harness delivery failed.');
            logEvent({
                level: 'error',
                source: 'TARGET',
                entityType: 'target',
                entityId: targetId,
                message: `Connector harness send failed: ${error?.message ?? 'Unknown error'}`,
            });
            return {
                ok: false,
                message: error?.message ?? 'Harness delivery failed.',
                correlationId,
                details: {
                    targetId: target.id,
                    targetName: target.name,
                    targetType: target.type,
                    endpoint,
                    label: label ?? null,
                    authType: secret?.authType ?? 'none',
                    authConfigured: Object.keys(headers).length > 2,
                    tlsMode: secret?.allowInsecureTls ? 'insecure-dev' : 'strict',
                    httpStatus: null,
                    checkedAt,
                    notes,
                    responseSnippet: null,
                },
            };
        }
    }

    private buildProbeUrl(target: { type: string; base_url: string }) {
        const base = target.base_url.replace(/\/+$/, '');
        switch (target.type) {
            case 'DHIS2':
                return `${base}/system/ping`;
            case 'OPENMRS':
                return `${base}/session`;
            case 'LIS':
                return `${base}/health`;
            case 'CUSTOM_HTTP':
            default:
                return base;
        }
    }

    private buildDeliveryEndpoint(target: { type: string; base_url: string }) {
        const base = target.base_url.replace(/\/+$/, '');
        switch (target.type) {
            case 'DHIS2':
                return `${base}/events`;
            case 'OPENMRS':
                return `${base}/lab-results`;
            case 'LIS':
                if (base.endsWith('/ws/rest/v1')) return `${base}/lab/multipleresults`;
                if (base.endsWith('/openmrs')) return `${base}/ws/rest/v1/lab/multipleresults`;
                return `${base}/openmrs/ws/rest/v1/lab/multipleresults`;
            case 'CUSTOM_HTTP':
            default:
                return base;
        }
    }

    // ---------------------------

    list() {
        const db = getDb();
        return db.prepare(`SELECT * FROM targets ORDER BY type ASC, name ASC`).all();
    }

    create(dto: TargetDto) {
        const db = getDb();
        const id = randomUUID();
        const ts = nowIso();
        const actor = getCurrentActorStamp();

        db.prepare(
            `
                INSERT INTO targets (
                    id,
                    type,
                    name,
                    base_url,
                    enabled,
                    auto_retry_enabled,
                    max_retry_attempts,
                    retry_backoff_strategy,
                    initial_retry_delay_ms,
                    max_retry_delay_ms,
                    request_timeout_ms,
                    created_at,
                    updated_at,
                    created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            id,
            dto.type,
            dto.name,
            normalizeBaseUrl(dto.base_url),
            intOr(dto.enabled, 1),
            intOr(dto.auto_retry_enabled, 1),
            Math.max(0, intOr(dto.max_retry_attempts, 4)),
            dto.retry_backoff_strategy ?? 'EXPONENTIAL',
            Math.max(1_000, intOr(dto.initial_retry_delay_ms, 60_000)),
            Math.max(1_000, intOr(dto.max_retry_delay_ms, 3_600_000)),
            Math.max(1_000, intOr(dto.request_timeout_ms, 15_000)),
            ts,
            ts,
            actor.userId,
            actor.username,
            actor.userId,
            actor.username,
        );

        logEvent({
            level: 'info',
            source: 'APP',
            entityType: 'target',
            entityId: id,
            message: 'Target created',
        });
        return { id };
    }

    update(id: string, dto: Partial<TargetDto>) {
        const db = getDb();
        const ts = nowIso();
        const actor = getCurrentActorStamp();

        const res = db
            .prepare(
                `
                UPDATE targets SET
                    type = COALESCE(?, type),
                    name = COALESCE(?, name),
                    base_url = COALESCE(?, base_url),
                    enabled = COALESCE(?, enabled),
                    auto_retry_enabled = COALESCE(?, auto_retry_enabled),
                    max_retry_attempts = COALESCE(?, max_retry_attempts),
                    retry_backoff_strategy = COALESCE(?, retry_backoff_strategy),
                    initial_retry_delay_ms = COALESCE(?, initial_retry_delay_ms),
                    max_retry_delay_ms = COALESCE(?, max_retry_delay_ms),
                    request_timeout_ms = COALESCE(?, request_timeout_ms),
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE id = ?
                `,
            )
            .run(
                dto.type ?? null,
                dto.name ?? null,
                dto.base_url ? normalizeBaseUrl(dto.base_url) : null,
                dto.enabled ?? null,
                dto.auto_retry_enabled ?? null,
                dto.max_retry_attempts ?? null,
                dto.retry_backoff_strategy ?? null,
                dto.initial_retry_delay_ms ?? null,
                dto.max_retry_delay_ms ?? null,
                dto.request_timeout_ms ?? null,
                ts,
                actor.userId,
                actor.username,
                id,
            );

        if (res.changes !== 1) throw new Error(`Target update failed (id=${id})`);
        logEvent({
            level: 'info',
            source: 'APP',
            entityType: 'target',
            entityId: id,
            message: 'Target updated',
        });
        return true;
    }

    delete(id: string) {
        const db = getDb();
        db.prepare(`DELETE FROM targets WHERE id = ?`).run(id);
        logEvent({
            level: 'warn',
            source: 'APP',
            entityType: 'target',
            entityId: id,
            message: 'Target deleted',
        });
        return true;
    }

    test(id: string) {
        const db = getDb();
        const row = db.prepare(`SELECT * FROM targets WHERE id = ? LIMIT 1`).get(id) as any;
        if (!row) throw new Error('Target not found');

        logEvent({
            level: 'info',
            source: 'TARGET',
            entityType: 'target',
            entityId: id,
            message: 'Target test requested',
        });

        return {
            ok: true,
            message: 'Connector diagnostics completed.',
            details: {
                targetId: row.id,
                targetName: row.name,
                targetType: row.type,
                baseUrl: row.base_url,
                checkedAt: nowIso(),
                notes: [
                    `Request timeout: ${row.request_timeout_ms ?? 15000} ms`,
                    `Auto retry: ${(row.auto_retry_enabled ?? 1) === 1 ? 'enabled' : 'disabled'}`,
                    `Max retry attempts: ${row.max_retry_attempts ?? 4}`,
                    `Backoff strategy: ${row.retry_backoff_strategy ?? 'EXPONENTIAL'}`,
                ],
            },
        };
    }
}
