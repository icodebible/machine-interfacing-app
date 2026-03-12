"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logEvent = logEvent;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const nowIso = () => new Date().toISOString();
function logEvent(params) {
    const db = (0, db_1.getDb)();
    db.prepare(`
        INSERT INTO logs (id, level, source, entity_type, entity_id, message, payload_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run((0, crypto_1.randomUUID)(), params.level, params.source, params.entityType ?? null, params.entityId ?? null, params.message, params.payload ? JSON.stringify(params.payload) : null, nowIso());
}
