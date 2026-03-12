import { randomUUID } from 'crypto';
import { getDb } from '../db/db';

const nowIso = () => new Date().toISOString();

export function logEvent(params: {
    level: 'info' | 'warn' | 'error';
    source: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
    message: string;
    entityType?: string;
    entityId?: string;
    payload?: any;
}) {
    const db = getDb();
    db.prepare(`
        INSERT INTO logs (id, level, source, entity_type, entity_id, message, payload_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
        randomUUID(),
        params.level,
        params.source,
        params.entityType ?? null,
        params.entityId ?? null,
        params.message,
        params.payload ? JSON.stringify(params.payload) : null,
        nowIso(),
    );
}