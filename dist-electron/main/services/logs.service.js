"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogsService = void 0;
const db_1 = require("../db/db");
class LogsService {
    query(q) {
        const db = (0, db_1.getDb)();
        const limit = Math.min(Math.max(q.limit ?? 200, 1), 2000);
        const where = [];
        const params = [];
        if (q.level) {
            where.push(`level = ?`);
            params.push(q.level);
        }
        if (q.source) {
            where.push(`source = ?`);
            params.push(q.source);
        }
        if (q.entityType) {
            where.push(`entity_type = ?`);
            params.push(q.entityType);
        }
        if (q.entityId) {
            where.push(`entity_id = ?`);
            params.push(q.entityId);
        }
        const sql = `
            SELECT *
            FROM logs
            ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
            ORDER BY created_at DESC
            LIMIT ?
        `;
        return db.prepare(sql).all(...params, limit);
    }
}
exports.LogsService = LogsService;
