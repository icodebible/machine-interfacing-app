import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { getCurrentActorStamp } from '../services/actor-context.service';

const nowIso = () => new Date().toISOString();

function ensureColumn(
    db: ReturnType<typeof getDb>,
    table: string,
    column: string,
    definitionSql: string,
) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
    }
}

export class ParsedMessageService {
    ensureTable() {
        const db = getDb();
        db.exec(`
            CREATE TABLE IF NOT EXISTS parsed_messages (
                id TEXT PRIMARY KEY,
                machine_id TEXT NOT NULL,
                protocol TEXT NOT NULL,
                message_type TEXT NOT NULL,
                summary TEXT,
                data_json TEXT NOT NULL,
                raw TEXT,
                created_at TEXT NOT NULL,
                created_by_user_id TEXT,
                created_by_username TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_parsed_messages_machine_id
                ON parsed_messages(machine_id);

            CREATE INDEX IF NOT EXISTS idx_parsed_messages_created_at
                ON parsed_messages(created_at);
        `);

        ensureColumn(db, 'parsed_messages', 'created_by_user_id', 'TEXT');
        ensureColumn(db, 'parsed_messages', 'created_by_username', 'TEXT');
    }

    create(message: {
        machineId: string;
        protocol: string;
        messageType: string;
        summary: string;
        data: Record<string, any>;
        raw: string;
    }): { id: string } {
        const db = getDb();
        const actor = getCurrentActorStamp();
        const id = randomUUID();
        this.ensureTable();

        db.prepare(
            `
                INSERT INTO parsed_messages (
                    id, machine_id, protocol, message_type, summary, data_json, raw, created_at,
                    created_by_user_id, created_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            id,
            message.machineId,
            message.protocol,
            message.messageType,
            message.summary,
            JSON.stringify(message.data ?? {}),
            message.raw ?? null,
            nowIso(),
            actor.userId,
            actor.username,
        );

        return { id };
    }

    listByMachine(machineId: string, limit = 50) {
        this.ensureTable();
        const db = getDb();
        return db
            .prepare(
                `
                    SELECT *
                    FROM parsed_messages
                    WHERE machine_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                `,
            )
            .all(machineId, Math.max(1, Number(limit) || 50));
    }
}
