"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabsService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const auditLog_1 = require("../logging/auditLog");
const nowIso = () => new Date().toISOString();
class LabsService {
    list() {
        const db = (0, db_1.getDb)();
        return db.prepare(`SELECT * FROM labs ORDER BY name ASC`).all();
    }
    create(dto) {
        const db = (0, db_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        db.prepare(`
      INSERT INTO labs (id, code, name, location, description, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, dto.code ?? null, dto.name, dto.location ?? null, dto.description ?? null, dto.is_active ?? 1, ts, ts);
        (0, auditLog_1.logEvent)({ level: 'info', source: 'APP', entityType: 'lab', entityId: id, message: 'Lab created' });
        return { id };
    }
    update(id, dto) {
        const db = (0, db_1.getDb)();
        const ts = nowIso();
        const res = db.prepare(`
      UPDATE labs SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        location = COALESCE(?, location),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active),
        updated_at = ?
      WHERE id = ?
    `).run(dto.code ?? null, dto.name ?? null, dto.location ?? null, dto.description ?? null, dto.is_active ?? null, ts, id);
        if (res.changes !== 1)
            throw new Error(`Lab update failed (id=${id})`);
        (0, auditLog_1.logEvent)({ level: 'info', source: 'APP', entityType: 'lab', entityId: id, message: 'Lab updated' });
        return true;
    }
    delete(id) {
        const db = (0, db_1.getDb)();
        db.prepare(`DELETE FROM labs WHERE id = ?`).run(id);
        (0, auditLog_1.logEvent)({ level: 'warn', source: 'APP', entityType: 'lab', entityId: id, message: 'Lab deleted' });
        return true;
    }
}
exports.LabsService = LabsService;
