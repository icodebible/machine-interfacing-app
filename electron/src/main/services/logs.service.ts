// import { getDb } from '../db/db';

// export type LogsQuery = {
//     level?: string;
//     source?: string;
//     entityType?: string;
//     entityId?: string;
//     limit?: number;
// };

// export class LogsService {
//     query(q: LogsQuery) {
//         const db = getDb();
//         const limit = Math.min(Math.max(q.limit ?? 200, 1), 2000);

//         const where: string[] = [];
//         const params: any[] = [];

//         if (q.level) {
//             where.push(`level = ?`);
//             params.push(q.level);
//         }
//         if (q.source) {
//             where.push(`source = ?`);
//             params.push(q.source);
//         }
//         if (q.entityType) {
//             where.push(`entity_type = ?`);
//             params.push(q.entityType);
//         }
//         if (q.entityId) {
//             where.push(`entity_id = ?`);
//             params.push(q.entityId);
//         }

//         const sql = `
//             SELECT *
//             FROM logs
//             ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
//             ORDER BY created_at DESC
//             LIMIT ?
//         `;

//         return db.prepare(sql).all(...params, limit);
//     }
// }


import { getDb } from '../db/db';

export type LogsQuery = {
    level?: string;
    source?: string;
    entityType?: string;
    entityId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    limit?: number;
};

export class LogsService {
    query(q: LogsQuery = {}) {
        const db = getDb();
        const limit = Math.min(Math.max(Number(q.limit ?? 200), 1), 2000);

        const where: string[] = [];
        const params: any[] = [];

        if (q.level) {
            where.push(`LOWER(level) = ?`);
            params.push(String(q.level).toLowerCase());
        }
        if (q.source) {
            where.push(`LOWER(source) = ?`);
            params.push(String(q.source).toLowerCase());
        }
        if (q.entityType) {
            where.push(`LOWER(COALESCE(entity_type, '')) LIKE ?`);
            params.push(`%${String(q.entityType).toLowerCase()}%`);
        }
        if (q.entityId) {
            where.push(`LOWER(COALESCE(entity_id, '')) LIKE ?`);
            params.push(`%${String(q.entityId).toLowerCase()}%`);
        }
        const dateFrom = this.toIsoDate(q.dateFrom);
        if (dateFrom) {
            where.push(`created_at >= ?`);
            params.push(dateFrom);
        }
        const dateTo = this.toIsoDate(q.dateTo);
        if (dateTo) {
            where.push(`created_at <= ?`);
            params.push(dateTo);
        }
        if (q.search) {
            where.push(`(
                LOWER(COALESCE(message, '')) LIKE ?
                OR LOWER(COALESCE(payload_json, '')) LIKE ?
                OR LOWER(COALESCE(entity_type, '')) LIKE ?
                OR LOWER(COALESCE(entity_id, '')) LIKE ?
            )`);
            const value = `%${String(q.search).toLowerCase()}%`;
            params.push(value, value, value, value);
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

    private toIsoDate(value: unknown) {
        const raw = String(value ?? '').trim();
        if (!raw) return null;
        const date = new Date(raw);
        return Number.isNaN(date.getTime()) ? raw : date.toISOString();
    }
}
