"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetsService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const auditLog_1 = require("../logging/auditLog");
const nowIso = () => new Date().toISOString();
class TargetsService {
    list() {
        const db = (0, db_1.getDb)();
        return db.prepare(`SELECT * FROM targets ORDER BY type ASC, name ASC`).all();
    }
    create(dto) {
        const db = (0, db_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        db.prepare(`
                INSERT INTO targets (id, type, name, base_url, token, enabled, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, dto.type, dto.name, dto.base_url, dto.token ?? null, dto.enabled ?? 1, ts, ts);
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
        const res = db
            .prepare(`
                UPDATE targets SET
                    type = COALESCE(?, type),
                    name = COALESCE(?, name),
                    base_url = COALESCE(?, base_url),
                    token = COALESCE(?, token),
                    enabled = COALESCE(?, enabled),
                    updated_at = ?
                WHERE id = ?
                `)
            .run(dto.type ?? null, dto.name ?? null, dto.base_url ?? null, dto.token ?? null, dto.enabled ?? null, ts, id);
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
        // Foundation: real HTTP test comes next (Milestone 4)
        (0, auditLog_1.logEvent)({
            level: 'info',
            source: 'TARGET',
            entityType: 'target',
            entityId: id,
            message: 'Target test requested',
        });
        return { ok: true, message: 'Test queued (implement HTTP ping next milestone).' };
    }
}
exports.TargetsService = TargetsService;
