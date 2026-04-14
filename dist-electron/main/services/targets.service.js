"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetsService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const auditLog_1 = require("../logging/auditLog");
const delivery_adapter_registry_1 = require("../delivery/delivery-adapter.registry");
const target_secrets_service_1 = require("./target-secrets.service");
const delivery_auth_util_1 = require("../security/delivery-auth.util");
const secure_http_client_1 = require("../security/secure-http.client");
const actor_context_service_1 = require("./actor-context.service");
const nowIso = () => new Date().toISOString();
const normalizeBaseUrl = (value) => (value ?? '').trim().replace(/\/+$/, '');
const intOr = (value, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
};
class TargetsService {
    secrets = new target_secrets_service_1.TargetSecretsService();
    http = new secure_http_client_1.SecureHttpClient();
    adapters = new delivery_adapter_registry_1.DeliveryAdapterRegistry();
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
    async harnessSend(targetId, payload, label) {
        const db = (0, db_1.getDb)();
        const target = db.prepare(`SELECT * FROM targets WHERE id = ? LIMIT 1`).get(targetId);
        if (!target)
            throw new Error('Target not found');
        if (target.enabled !== 1)
            throw new Error('Target is disabled');
        const secret = this.secrets.get(targetId);
        const correlationId = (0, crypto_1.randomUUID)();
        const headers = {
            ...(0, delivery_auth_util_1.buildAuthHeaders)(secret),
            'X-Test-Harness': '1',
            'X-Correlation-Id': correlationId,
        };
        const checkedAt = nowIso();
        const notes = [];
        const endpoint = this.buildDeliveryEndpoint(target);
        if (Object.keys(headers).length <= 2) {
            notes.push('No connector auth headers are currently configured.');
        }
        try {
            const adapter = this.adapters.get(target);
            const queueItem = {
                id: `HARNESS-${(0, crypto_1.randomUUID)()}`,
                target_id: target.id,
                payload_json: JSON.stringify(payload ?? {}),
                delivery_status: 'PENDING',
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
            (0, auditLog_1.logEvent)({
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
        }
        catch (error) {
            notes.push(error?.message ?? 'Harness delivery failed.');
            (0, auditLog_1.logEvent)({
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
    buildProbeUrl(target) {
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
    buildDeliveryEndpoint(target) {
        const base = target.base_url.replace(/\/+$/, '');
        switch (target.type) {
            case 'DHIS2':
                return `${base}/events`;
            case 'OPENMRS':
                return `${base}/lab-results`;
            case 'LIS':
                return `${base}/results`;
            case 'CUSTOM_HTTP':
            default:
                return base;
        }
    }
    // ---------------------------
    list() {
        const db = (0, db_1.getDb)();
        return db.prepare(`SELECT * FROM targets ORDER BY type ASC, name ASC`).all();
    }
    create(dto) {
        const db = (0, db_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        db.prepare(`
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
            `).run(id, dto.type, dto.name, normalizeBaseUrl(dto.base_url), intOr(dto.enabled, 1), intOr(dto.auto_retry_enabled, 1), Math.max(0, intOr(dto.max_retry_attempts, 4)), dto.retry_backoff_strategy ?? 'EXPONENTIAL', Math.max(1_000, intOr(dto.initial_retry_delay_ms, 60_000)), Math.max(1_000, intOr(dto.max_retry_delay_ms, 3_600_000)), Math.max(1_000, intOr(dto.request_timeout_ms, 15_000)), ts, ts, actor.userId, actor.username, actor.userId, actor.username);
        (0, auditLog_1.logEvent)({
            level: 'info',
            source: 'APP',
            entityType: 'target',
            entityId: id,
            message: 'Target created',
        });
        return { id };
    }
    update(id, dto) {
        const db = (0, db_1.getDb)();
        const ts = nowIso();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const res = db
            .prepare(`
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
                `)
            .run(dto.type ?? null, dto.name ?? null, dto.base_url ? normalizeBaseUrl(dto.base_url) : null, dto.enabled ?? null, dto.auto_retry_enabled ?? null, dto.max_retry_attempts ?? null, dto.retry_backoff_strategy ?? null, dto.initial_retry_delay_ms ?? null, dto.max_retry_delay_ms ?? null, dto.request_timeout_ms ?? null, ts, actor.userId, actor.username, id);
        if (res.changes !== 1)
            throw new Error(`Target update failed (id=${id})`);
        (0, auditLog_1.logEvent)({
            level: 'info',
            source: 'APP',
            entityType: 'target',
            entityId: id,
            message: 'Target updated',
        });
        return true;
    }
    delete(id) {
        const db = (0, db_1.getDb)();
        db.prepare(`DELETE FROM targets WHERE id = ?`).run(id);
        (0, auditLog_1.logEvent)({
            level: 'warn',
            source: 'APP',
            entityType: 'target',
            entityId: id,
            message: 'Target deleted',
        });
        return true;
    }
    test(id) {
        const db = (0, db_1.getDb)();
        const row = db.prepare(`SELECT * FROM targets WHERE id = ? LIMIT 1`).get(id);
        if (!row)
            throw new Error('Target not found');
        (0, auditLog_1.logEvent)({
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
exports.TargetsService = TargetsService;
