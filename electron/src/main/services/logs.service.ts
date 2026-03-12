import { getDb } from '../db/db';

export type LogsQuery = {
    level?: string;
    source?: string;
    entityType?: string;
    entityId?: string;
    limit?: number;
};

export class LogsService {
    query(q: LogsQuery) {
        const db = getDb();
        const limit = Math.min(Math.max(q.limit ?? 200, 1), 2000);

        const where: string[] = [];
        const params: any[] = [];

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
