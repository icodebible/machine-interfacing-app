"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEvent = logEvent;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
function nowIso() {
    return new Date().toISOString();
}
function actorSnapshot() {
    const db = (0, db_1.getDb)();
    const row = db
        .prepare(`SELECT value FROM meta WHERE key = ? LIMIT 1`)
        .get('current_session_user');
    if (!row?.value)
        return null;
    try {
        const parsed = JSON.parse(String(row.value));
        return {
            id: parsed?.id ?? null,
            username: parsed?.username ?? null,
            roles: parsed?.roles ?? [],
            authorities: parsed?.authorities ?? [],
        };
    }
    catch {
        return null;
    }
}
function logEvent(args) {
    const db = (0, db_1.getDb)();
    const payloadEnvelope = {
        action: args.action ?? null,
        actor: actorSnapshot(),
        resource: {
            type: args.entityType ?? null,
            id: args.entityId ?? null,
            name: args.resourceName ?? null,
        },
        payload: args.payload ?? null,
        createdAt: nowIso(),
    };
    db.prepare(`INSERT INTO logs (id, level, source, entity_type, entity_id, message, payload_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run((0, crypto_1.randomUUID)(), args.level, args.source, args.entityType ?? null, args.entityId ?? null, args.message, JSON.stringify(payloadEnvelope), nowIso());
    return true;
}
