// import { app } from 'electron';
// import fs from 'fs';
// import path from 'path';

// type SessionRecordParams = {
//     machineId: string;
//     machineName?: string | null;
//     direction: 'inbound' | 'outbound' | 'system';
//     payload: string;
//     meta?: Record<string, any>;
// };

// const nowIso = () => new Date().toISOString();

// function safeName(value: string) {
//     return value.replace(/[^a-zA-Z0-9._-]/g, '_');
// }

// export class SessionRecorderService {
//     private baseDir: string;

//     constructor() {
//         this.baseDir = path.join(app.getPath('userData'), 'sessions');
//         fs.mkdirSync(this.baseDir, { recursive: true });
//     }

//     private getMachineDir(machineId: string, machineName?: string | null) {
//         const name = safeName(machineName || machineId);
//         const dir = path.join(this.baseDir, `${name}_${machineId}`);
//         fs.mkdirSync(dir, { recursive: true });
//         return dir;
//     }

//     private getSessionFile(machineId: string, machineName?: string | null) {
//         const dir = this.getMachineDir(machineId, machineName);
//         const day = nowIso().slice(0, 10);
//         return path.join(dir, `${day}.log`);
//     }

//     record(params: SessionRecordParams) {
//         const file = this.getSessionFile(params.machineId, params.machineName);

//         const block = [
//             `--- ${nowIso()} ---`,
//             `direction: ${params.direction}`,
//             ...(params.meta ? [`meta: ${JSON.stringify(params.meta)}`] : []),
//             `payload:`,
//             params.payload,
//             '',
//         ].join('\n');

//         fs.appendFileSync(file, block, 'utf8');
//         return file;
//     }
// }


import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { getCurrentActorStamp } from '../services/actor-context.service';

const nowIso = () => new Date().toISOString();

export type MachineRuntimeSessionMode = 'LIVE' | 'SIMULATION' | 'REPLAY';
export type MachineRuntimeSessionStatus = 'STARTED' | 'STOPPED' | 'ERROR';

export type MachineRuntimeSessionRow = {
    id: string;
    machine_id: string;
    machine_name?: string | null;
    mode: MachineRuntimeSessionMode;
    transport?: string | null;
    protocol?: string | null;
    status: MachineRuntimeSessionStatus;
    started_at: string;
    stopped_at?: string | null;
    last_activity_at?: string | null;
    message?: string | null;
    error_message?: string | null;
    meta_json?: string | null;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
    updated_by_user_id?: string | null;
    updated_by_username?: string | null;
};

function ensureColumn(db: ReturnType<typeof getDb>, table: string, column: string, definitionSql: string) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
    }
}

function safeJson(value: unknown) {
    try {
        return JSON.stringify(value ?? null);
    } catch {
        return 'null';
    }
}

export class SessionRecorderService {
    ensureTable() {
        const db = getDb();
        db.exec(`
            CREATE TABLE IF NOT EXISTS machine_runtime_sessions (
                id TEXT PRIMARY KEY,
                machine_id TEXT NOT NULL,
                machine_name TEXT,
                mode TEXT NOT NULL,
                transport TEXT,
                protocol TEXT,
                status TEXT NOT NULL,
                started_at TEXT NOT NULL,
                stopped_at TEXT,
                last_activity_at TEXT,
                message TEXT,
                error_message TEXT,
                meta_json TEXT,
                created_by_user_id TEXT,
                created_by_username TEXT,
                updated_by_user_id TEXT,
                updated_by_username TEXT,
                FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_machine_runtime_sessions_machine
                ON machine_runtime_sessions(machine_id, started_at);

            CREATE INDEX IF NOT EXISTS idx_machine_runtime_sessions_status
                ON machine_runtime_sessions(machine_id, status, mode);
        `);

        ensureColumn(db, 'machine_runtime_sessions', 'machine_name', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'mode', "TEXT NOT NULL DEFAULT 'LIVE'");
        ensureColumn(db, 'machine_runtime_sessions', 'transport', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'protocol', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'status', "TEXT NOT NULL DEFAULT 'STARTED'");
        ensureColumn(db, 'machine_runtime_sessions', 'started_at', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'stopped_at', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'last_activity_at', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'message', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'error_message', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'meta_json', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'created_by_user_id', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'created_by_username', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'updated_by_user_id', 'TEXT');
        ensureColumn(db, 'machine_runtime_sessions', 'updated_by_username', 'TEXT');
    }

    startSession(input: {
        machineId: string;
        machineName?: string | null;
        mode: MachineRuntimeSessionMode;
        transport?: string | null;
        protocol?: string | null;
        message?: string | null;
        meta?: Record<string, any> | null;
        closeExisting?: boolean;
    }): MachineRuntimeSessionRow {
        this.ensureTable();
        const db = getDb();
        const actor = getCurrentActorStamp();
        const ts = nowIso();

        if (input.closeExisting !== false) {
            db.prepare(
                `
                    UPDATE machine_runtime_sessions
                    SET status = 'STOPPED', stopped_at = COALESCE(stopped_at, ?),
                        last_activity_at = ?, message = COALESCE(message, 'Replaced by a new runtime session'),
                        updated_by_user_id = ?, updated_by_username = ?
                    WHERE machine_id = ? AND status = 'STARTED'
                `,
            ).run(ts, ts, actor.userId, actor.username, input.machineId);
        }

        const id = randomUUID();
        db.prepare(
            `
                INSERT INTO machine_runtime_sessions (
                    id, machine_id, machine_name, mode, transport, protocol, status,
                    started_at, last_activity_at, message, meta_json,
                    created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, 'STARTED', ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            id,
            input.machineId,
            input.machineName ?? null,
            input.mode,
            input.transport ?? null,
            input.protocol ?? null,
            ts,
            ts,
            input.message ?? null,
            safeJson(input.meta ?? null),
            actor.userId,
            actor.username,
            actor.userId,
            actor.username,
        );

        return this.get(id)!;
    }

    currentSession(machineId: string, mode?: MachineRuntimeSessionMode | null): MachineRuntimeSessionRow | null {
        this.ensureTable();
        const whereMode = mode ? 'AND mode = ?' : '';
        const args = mode ? [machineId, mode] : [machineId];
        return (
            getDb()
                .prepare(
                    `
                        SELECT *
                        FROM machine_runtime_sessions
                        WHERE machine_id = ? AND status = 'STARTED' ${whereMode}
                        ORDER BY started_at DESC
                        LIMIT 1
                    `,
                )
                .get(...args) as MachineRuntimeSessionRow | undefined
        ) ?? null;
    }

    currentSessionId(machineId: string, mode?: MachineRuntimeSessionMode | null): string | null {
        return this.currentSession(machineId, mode)?.id ?? null;
    }

    touchSession(sessionId: string | null | undefined, message?: string | null) {
        if (!sessionId) return;
        this.ensureTable();
        const actor = getCurrentActorStamp();
        const ts = nowIso();
        getDb()
            .prepare(
                `
                    UPDATE machine_runtime_sessions
                    SET last_activity_at = ?, message = COALESCE(?, message),
                        updated_by_user_id = ?, updated_by_username = ?
                    WHERE id = ?
                `,
            )
            .run(ts, message ?? null, actor.userId, actor.username, sessionId);
    }

    endCurrent(machineId: string, mode?: MachineRuntimeSessionMode | null, status: MachineRuntimeSessionStatus = 'STOPPED', message?: string | null, error?: string | null) {
        this.ensureTable();
        const current = this.currentSession(machineId, mode);
        if (!current) return false;
        return this.endSession(current.id, status, message, error);
    }

    endSession(sessionId: string, status: MachineRuntimeSessionStatus = 'STOPPED', message?: string | null, error?: string | null) {
        this.ensureTable();
        const actor = getCurrentActorStamp();
        const ts = nowIso();
        getDb()
            .prepare(
                `
                    UPDATE machine_runtime_sessions
                    SET status = ?, stopped_at = COALESCE(stopped_at, ?), last_activity_at = ?,
                        message = COALESCE(?, message), error_message = COALESCE(?, error_message),
                        updated_by_user_id = ?, updated_by_username = ?
                    WHERE id = ?
                `,
            )
            .run(status, ts, ts, message ?? null, error ?? null, actor.userId, actor.username, sessionId);
        return true;
    }

    get(id: string): MachineRuntimeSessionRow | null {
        this.ensureTable();
        return (
            getDb()
                .prepare(`SELECT * FROM machine_runtime_sessions WHERE id = ?`)
                .get(id) as MachineRuntimeSessionRow | undefined
        ) ?? null;
    }

    listByMachine(machineId: string, limit = 25): MachineRuntimeSessionRow[] {
        this.ensureTable();
        return getDb()
            .prepare(
                `
                    SELECT *
                    FROM machine_runtime_sessions
                    WHERE machine_id = ?
                    ORDER BY started_at DESC
                    LIMIT ?
                `,
            )
            .all(machineId, Math.max(1, Number(limit) || 25)) as MachineRuntimeSessionRow[];
    }

    // Backward-compatible recorder hook used by older runtime code paths.
    record(input: {
        machineId: string;
        machineName?: string | null;
        direction?: string | null;
        payload?: string | null;
        meta?: Record<string, any> | null;
    }): { sessionId: string | null } {
        const mode = input.meta?.simulated ? 'SIMULATION' : 'LIVE';
        let session = this.currentSession(input.machineId, mode);
        if (!session) {
            session = this.startSession({
                machineId: input.machineId,
                machineName: input.machineName ?? null,
                mode,
                transport: input.meta?.transport ?? null,
                protocol: input.meta?.protocol ?? null,
                message: 'Session auto-created from runtime traffic',
                meta: input.meta ?? null,
                closeExisting: false,
            });
        }
        this.touchSession(session.id, input.payload ? `Received ${input.payload.length} chars` : null);
        return { sessionId: session.id };
    }
}
