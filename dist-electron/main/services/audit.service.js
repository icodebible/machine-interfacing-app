"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditService = exports.AuditService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const actor_context_service_1 = require("./actor-context.service");
const nowIso = () => new Date().toISOString();
const SECRET_KEY_PATTERN = /(password|passwd|token|secret|api[_-]?key|authorization|auth|credential|private|bearer|sessionid|cookie)/i;
const SENSITIVE_VALUE_PATTERN = /(bearer\s+[a-z0-9._\-]+|basic\s+[a-z0-9+/=]+|password=([^&\s]+)|passwd=([^&\s]+)|token=([^&\s]+)|api[_-]?key=([^&\s]+)|authorization=([^&\s]+))/ig;
function clampLimit(value, fallback = 100, max = 500) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.min(max, Math.max(1, Math.trunc(n)));
}
function redactString(value) {
    return value.replace(SENSITIVE_VALUE_PATTERN, (match) => {
        const idx = match.indexOf('=');
        if (idx >= 0)
            return `${match.slice(0, idx + 1)}[REDACTED]`;
        const firstSpace = match.indexOf(' ');
        return firstSpace >= 0 ? `${match.slice(0, firstSpace + 1)}[REDACTED]` : '[REDACTED]';
    });
}
function redactValue(value) {
    if (value === null || value === undefined)
        return value;
    if (typeof value === 'string')
        return redactString(value);
    if (Array.isArray(value))
        return value.map(redactValue);
    if (typeof value !== 'object')
        return value;
    const out = {};
    for (const [key, child] of Object.entries(value)) {
        out[key] = SECRET_KEY_PATTERN.test(key) ? '[REDACTED]' : redactValue(child);
    }
    return out;
}
function stringify(value) {
    if (value === undefined)
        return null;
    try {
        return JSON.stringify(redactValue(value));
    }
    catch {
        return JSON.stringify({ value: '[Unserializable]' });
    }
}
function parseJson(value) {
    if (!value)
        return null;
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
}
class AuditService {
    ensureTable() {
        const db = (0, db_1.getDb)();
        db.exec(`
            CREATE TABLE IF NOT EXISTS audit_events (
                id TEXT PRIMARY KEY,
                event_time TEXT NOT NULL,
                source TEXT NOT NULL,
                category TEXT NOT NULL,
                action TEXT NOT NULL,
                severity TEXT NOT NULL DEFAULT 'INFO',
                status TEXT NOT NULL DEFAULT 'SUCCESS',
                entity_type TEXT,
                entity_id TEXT,
                entity_label TEXT,
                summary TEXT,
                details_json TEXT,
                before_json TEXT,
                after_json TEXT,
                correlation_id TEXT,
                actor_user_id TEXT,
                actor_username TEXT,
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_audit_events_time
            ON audit_events(event_time DESC);

            CREATE INDEX IF NOT EXISTS idx_audit_events_entity
            ON audit_events(entity_type, entity_id, event_time DESC);

            CREATE INDEX IF NOT EXISTS idx_audit_events_category_action
            ON audit_events(category, action, event_time DESC);

            CREATE INDEX IF NOT EXISTS idx_audit_events_actor
            ON audit_events(actor_username, event_time DESC);
        `);
    }
    record(input) {
        try {
            this.ensureTable();
            const db = (0, db_1.getDb)();
            const currentActor = input.actor ?? (0, actor_context_service_1.getCurrentActorStamp)();
            const id = (0, crypto_1.randomUUID)();
            const ts = nowIso();
            const actorUserId = currentActor?.userId ?? (currentActor && 'id' in currentActor ? currentActor.id ?? null : null);
            const actorUsername = currentActor?.username ?? null;
            db.prepare(`
                INSERT INTO audit_events (
                    id, event_time, source, category, action, severity, status,
                    entity_type, entity_id, entity_label, summary,
                    details_json, before_json, after_json, correlation_id,
                    actor_user_id, actor_username, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `).run(id, ts, String(input.source || 'APP').toUpperCase(), String(input.category || 'DIAGNOSTICS').toUpperCase(), String(input.action || 'UNKNOWN').toUpperCase(), String(input.severity ?? 'INFO').toUpperCase(), String(input.status ?? 'SUCCESS').toUpperCase(), input.entityType ?? null, input.entityId ?? null, input.entityLabel ?? null, input.summary ?? null, stringify(input.details), stringify(input.before), stringify(input.after), input.correlationId ?? null, actorUserId, actorUsername, ts);
            return { id };
        }
        catch (error) {
            // Auditing must never interrupt clinical/runtime workflow.
            console.warn('[audit] failed to record audit event', error);
            return null;
        }
    }
    query(query = {}) {
        this.ensureTable();
        const where = [];
        const args = [];
        const addEq = (column, value) => {
            const text = String(value ?? '').trim();
            if (!text || text.toUpperCase() === 'ALL')
                return;
            where.push(`${column} = ?`);
            args.push(text);
        };
        addEq('source', query.source?.toUpperCase());
        addEq('category', query.category?.toUpperCase());
        addEq('action', query.action?.toUpperCase());
        addEq('severity', query.severity?.toUpperCase());
        addEq('status', query.status?.toUpperCase());
        addEq('entity_type', query.entityType);
        addEq('entity_id', query.entityId);
        if (query.from) {
            where.push('event_time >= ?');
            args.push(query.from);
        }
        if (query.to) {
            where.push('event_time <= ?');
            args.push(query.to);
        }
        if (query.q && String(query.q).trim()) {
            const needle = `%${String(query.q).trim()}%`;
            where.push('(summary LIKE ? OR entity_label LIKE ? OR actor_username LIKE ? OR action LIKE ? OR details_json LIKE ?)');
            args.push(needle, needle, needle, needle, needle);
        }
        const limit = clampLimit(query.limit);
        const rows = (0, db_1.getDb)()
            .prepare(`
                SELECT *
                FROM audit_events
                ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                ORDER BY event_time DESC
                LIMIT ?
                `)
            .all(...args, limit);
        return rows.map((row) => ({
            ...row,
            details: parseJson(row.details_json),
            before: parseJson(row.before_json),
            after: parseJson(row.after_json),
        }));
    }
    summary(days = 7) {
        this.ensureTable();
        const from = new Date(Date.now() - Math.max(1, Number(days) || 7) * 24 * 60 * 60 * 1000).toISOString();
        const db = (0, db_1.getDb)();
        const totals = db
            .prepare(`
                SELECT severity, status, COUNT(*) AS count
                FROM audit_events
                WHERE event_time >= ?
                GROUP BY severity, status
                ORDER BY severity ASC, status ASC
                `)
            .all(from);
        const categories = db
            .prepare(`
                SELECT category, COUNT(*) AS count
                FROM audit_events
                WHERE event_time >= ?
                GROUP BY category
                ORDER BY count DESC, category ASC
                `)
            .all(from);
        const actions = db
            .prepare(`
                SELECT action, COUNT(*) AS count
                FROM audit_events
                WHERE event_time >= ?
                GROUP BY action
                ORDER BY count DESC, action ASC
                LIMIT 20
                `)
            .all(from);
        return { days, from, generatedAt: nowIso(), totals, categories, actions };
    }
}
exports.AuditService = AuditService;
exports.auditService = new AuditService();
