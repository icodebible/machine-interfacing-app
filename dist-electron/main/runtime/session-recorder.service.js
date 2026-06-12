"use strict";
// import { app } from 'electron';
// import fs from 'fs';
// import path from 'path';
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionRecorderService = void 0;
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
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const actor_context_service_1 = require("../services/actor-context.service");
const nowIso = () => new Date().toISOString();
function ensureColumn(db, table, column, definitionSql) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
    }
}
function safeJson(value) {
    try {
        return JSON.stringify(value ?? null);
    }
    catch {
        return 'null';
    }
}
class SessionRecorderService {
    ensureTable() {
        const db = (0, db_1.getDb)();
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
    startSession(input) {
        this.ensureTable();
        const db = (0, db_1.getDb)();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const ts = nowIso();
        if (input.closeExisting !== false) {
            db.prepare(`
                    UPDATE machine_runtime_sessions
                    SET status = 'STOPPED', stopped_at = COALESCE(stopped_at, ?),
                        last_activity_at = ?, message = COALESCE(message, 'Replaced by a new runtime session'),
                        updated_by_user_id = ?, updated_by_username = ?
                    WHERE machine_id = ? AND status = 'STARTED'
                `).run(ts, ts, actor.userId, actor.username, input.machineId);
        }
        const id = (0, crypto_1.randomUUID)();
        db.prepare(`
                INSERT INTO machine_runtime_sessions (
                    id, machine_id, machine_name, mode, transport, protocol, status,
                    started_at, last_activity_at, message, meta_json,
                    created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, 'STARTED', ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, input.machineId, input.machineName ?? null, input.mode, input.transport ?? null, input.protocol ?? null, ts, ts, input.message ?? null, safeJson(input.meta ?? null), actor.userId, actor.username, actor.userId, actor.username);
        return this.get(id);
    }
    currentSession(machineId, mode) {
        this.ensureTable();
        const whereMode = mode ? 'AND mode = ?' : '';
        const args = mode ? [machineId, mode] : [machineId];
        return (0, db_1.getDb)()
            .prepare(`
                        SELECT *
                        FROM machine_runtime_sessions
                        WHERE machine_id = ? AND status = 'STARTED' ${whereMode}
                        ORDER BY started_at DESC
                        LIMIT 1
                    `)
            .get(...args) ?? null;
    }
    currentSessionId(machineId, mode) {
        return this.currentSession(machineId, mode)?.id ?? null;
    }
    touchSession(sessionId, message) {
        if (!sessionId)
            return;
        this.ensureTable();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const ts = nowIso();
        (0, db_1.getDb)()
            .prepare(`
                    UPDATE machine_runtime_sessions
                    SET last_activity_at = ?, message = COALESCE(?, message),
                        updated_by_user_id = ?, updated_by_username = ?
                    WHERE id = ?
                `)
            .run(ts, message ?? null, actor.userId, actor.username, sessionId);
    }
    endCurrent(machineId, mode, status = 'STOPPED', message, error) {
        this.ensureTable();
        const current = this.currentSession(machineId, mode);
        if (!current)
            return false;
        return this.endSession(current.id, status, message, error);
    }
    endSession(sessionId, status = 'STOPPED', message, error) {
        this.ensureTable();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const ts = nowIso();
        (0, db_1.getDb)()
            .prepare(`
                    UPDATE machine_runtime_sessions
                    SET status = ?, stopped_at = COALESCE(stopped_at, ?), last_activity_at = ?,
                        message = COALESCE(?, message), error_message = COALESCE(?, error_message),
                        updated_by_user_id = ?, updated_by_username = ?
                    WHERE id = ?
                `)
            .run(status, ts, ts, message ?? null, error ?? null, actor.userId, actor.username, sessionId);
        return true;
    }
    get(id) {
        this.ensureTable();
        return (0, db_1.getDb)()
            .prepare(`SELECT * FROM machine_runtime_sessions WHERE id = ?`)
            .get(id) ?? null;
    }
    listByMachine(machineId, limit = 25) {
        this.ensureTable();
        return (0, db_1.getDb)()
            .prepare(`
                    SELECT *
                    FROM machine_runtime_sessions
                    WHERE machine_id = ?
                    ORDER BY started_at DESC
                    LIMIT ?
                `)
            .all(machineId, Math.max(1, Number(limit) || 25));
    }
    // Backward-compatible recorder hook used by older runtime code paths.
    record(input) {
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
exports.SessionRecorderService = SessionRecorderService;
