import { randomUUID } from 'crypto';
import { getDb } from '../db/db';

type LogEventArgs = {
    level: 'info' | 'warn' | 'error';
    source: 'APP' | 'AUTH' | 'TARGET' | 'MACHINE';
    entityType?: string | null;
    entityId?: string | null;
    action?: string | null;
    resourceName?: string | null;
    message: string;
    payload?: unknown;
};

function nowIso() {
    return new Date().toISOString();
}

function actorSnapshot() {
    const db = getDb();
    const row = db
        .prepare(`SELECT value FROM meta WHERE key = ? LIMIT 1`)
        .get('current_session_user') as any;
    if (!row?.value) return null;
    try {
        const parsed = JSON.parse(String(row.value));
        return {
            id: parsed?.id ?? null,
            username: parsed?.username ?? null,
            roles: parsed?.roles ?? [],
            authorities: parsed?.authorities ?? [],
        };
    } catch {
        return null;
    }
}

export function logEvent(args: LogEventArgs) {
    const db = getDb();
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

    db.prepare(
        `INSERT INTO logs (id, level, source, entity_type, entity_id, message, payload_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
        randomUUID(),
        args.level,
        args.source,
        args.entityType ?? null,
        args.entityId ?? null,
        args.message,
        JSON.stringify(payloadEnvelope),
        nowIso(),
    );

    return true;
}
