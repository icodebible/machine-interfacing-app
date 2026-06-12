"use strict";
// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineTrafficLogService = void 0;
// const nowIso = () => new Date().toISOString();
// export type MachineTrafficLogDto = {
//     machine_id: string;
//     direction: 'inbound' | 'outbound' | 'system';
//     transport: 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     event_type:
//     | 'connected'
//     | 'disconnected'
//     | 'payload'
//     | 'parse_success'
//     | 'parse_error'
//     | 'test'
//     | 'error';
//     payload?: string | null;
//     payload_preview?: string | null;
// };
// export type MachineTrafficLogQuery = {
//     machineId: string;
//     limit?: number;
// };
// export class MachineTrafficLogService {
//     create(dto: MachineTrafficLogDto) {
//         const db = getDb();
//         db.prepare(
//             `
//                 INSERT INTO machine_traffic_logs (
//                     id,
//                     machine_id,
//                     direction,
//                     transport,
//                     protocol,
//                     event_type,
//                     payload,
//                     payload_preview,
//                     created_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             randomUUID(),
//             dto.machine_id,
//             dto.direction,
//             dto.transport,
//             dto.protocol,
//             dto.event_type,
//             dto.payload ?? null,
//             dto.payload_preview ?? null,
//             nowIso(),
//         );
//         return true;
//     }
//     listByMachine(machineId: string, limit = 50) {
//         const db = getDb();
//         return db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM machine_traffic_logs
//                     WHERE machine_id = ?
//                     ORDER BY created_at DESC
//                     LIMIT ?
//                 `,
//             )
//             .all(machineId, limit);
//     }
//     clearMachineLogs(machineId: string) {
//         const db = getDb();
//         db.prepare(`DELETE FROM machine_traffic_logs WHERE machine_id = ?`).run(machineId);
//         return true;
//     }
// }
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const actor_context_service_1 = require("../services/actor-context.service");
const parser_registry_1 = require("../protocols/parser-registry");
const parsed_message_service_1 = require("../protocols/parsed-message.service");
const normalizer_registry_1 = require("../normalizers/normalizer-registry");
const normalized_result_service_1 = require("../normalizers/normalized-result.service");
const session_recorder_service_1 = require("./session-recorder.service");
const nowIso = () => new Date().toISOString();
function ensureColumn(db, table, column, definitionSql) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
    }
}
function safeJson(value) {
    if (typeof value === 'string')
        return value;
    try {
        return JSON.stringify(value ?? null);
    }
    catch {
        return 'null';
    }
}
class MachineTrafficLogService {
    parsers = new parser_registry_1.ParserRegistry();
    parsedMessages = new parsed_message_service_1.ParsedMessageService();
    normalizers = new normalizer_registry_1.NormalizerRegistry();
    normalizedResults = new normalized_result_service_1.NormalizedResultService();
    sessions = new session_recorder_service_1.SessionRecorderService();
    ensureTable() {
        const db = (0, db_1.getDb)();
        db.exec(`
            CREATE TABLE IF NOT EXISTS machine_traffic_logs (
                id TEXT PRIMARY KEY,
                machine_id TEXT NOT NULL,
                session_id TEXT,
                direction TEXT NOT NULL,
                transport TEXT NOT NULL,
                protocol TEXT NOT NULL,
                event_type TEXT NOT NULL,
                payload TEXT,
                payload_preview TEXT,
                parsed_message_id TEXT,
                normalized_result_id TEXT,
                processing_status TEXT,
                processing_message TEXT,
                meta_json TEXT,
                replay_of_log_id TEXT,
                replay_mode TEXT,
                created_at TEXT NOT NULL,
                created_by_user_id TEXT,
                created_by_username TEXT,
                FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
                FOREIGN KEY (session_id) REFERENCES machine_runtime_sessions(id) ON DELETE SET NULL,
                FOREIGN KEY (replay_of_log_id) REFERENCES machine_traffic_logs(id) ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS idx_machine_traffic_logs_machine_id
                ON machine_traffic_logs(machine_id);

            CREATE INDEX IF NOT EXISTS idx_machine_traffic_logs_created_at
                ON machine_traffic_logs(created_at);

            CREATE INDEX IF NOT EXISTS idx_machine_traffic_logs_session
                ON machine_traffic_logs(session_id, created_at);
        `);
        ensureColumn(db, 'machine_traffic_logs', 'session_id', 'TEXT');
        ensureColumn(db, 'machine_traffic_logs', 'parsed_message_id', 'TEXT');
        ensureColumn(db, 'machine_traffic_logs', 'normalized_result_id', 'TEXT');
        ensureColumn(db, 'machine_traffic_logs', 'processing_status', 'TEXT');
        ensureColumn(db, 'machine_traffic_logs', 'processing_message', 'TEXT');
        ensureColumn(db, 'machine_traffic_logs', 'meta_json', 'TEXT');
        ensureColumn(db, 'machine_traffic_logs', 'replay_of_log_id', 'TEXT');
        ensureColumn(db, 'machine_traffic_logs', 'replay_mode', 'TEXT');
        ensureColumn(db, 'machine_traffic_logs', 'created_by_user_id', 'TEXT');
        ensureColumn(db, 'machine_traffic_logs', 'created_by_username', 'TEXT');
    }
    create(input) {
        this.ensureTable();
        const db = (0, db_1.getDb)();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const id = (0, crypto_1.randomUUID)();
        const payloadPreview = input.payload_preview ?? (input.payload ? String(input.payload).slice(0, 300) : null);
        db.prepare(`
                INSERT INTO machine_traffic_logs (
                    id, machine_id, session_id, direction, transport, protocol, event_type,
                    payload, payload_preview, parsed_message_id, normalized_result_id,
                    processing_status, processing_message, meta_json, replay_of_log_id, replay_mode,
                    created_at, created_by_user_id, created_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, input.machine_id, input.session_id ?? null, input.direction, input.transport, input.protocol, input.event_type, input.payload ?? null, payloadPreview, input.parsed_message_id ?? null, input.normalized_result_id ?? null, input.processing_status ?? null, input.processing_message ?? null, input.meta_json ?? null, input.replay_of_log_id ?? null, input.replay_mode ?? null, nowIso(), actor.userId, actor.username);
        if (input.session_id) {
            this.sessions.touchSession(input.session_id, input.processing_message ?? payloadPreview ?? input.event_type);
        }
        return { id };
    }
    updateProcessing(logId, patch) {
        this.ensureTable();
        (0, db_1.getDb)()
            .prepare(`
                    UPDATE machine_traffic_logs
                    SET parsed_message_id = COALESCE(?, parsed_message_id),
                        normalized_result_id = COALESCE(?, normalized_result_id),
                        processing_status = COALESCE(?, processing_status),
                        processing_message = COALESCE(?, processing_message),
                        meta_json = COALESCE(?, meta_json)
                    WHERE id = ?
                `)
            .run(patch.parsed_message_id ?? null, patch.normalized_result_id ?? null, patch.processing_status ?? null, patch.processing_message ?? null, patch.meta_json ?? null, logId);
        return true;
    }
    get(id) {
        this.ensureTable();
        return (0, db_1.getDb)().prepare(`SELECT * FROM machine_traffic_logs WHERE id = ?`).get(id) ?? null;
    }
    listByMachine(machineId, limit = 50) {
        this.ensureTable();
        return (0, db_1.getDb)()
            .prepare(`
                    SELECT l.*, s.mode AS session_mode, s.status AS session_status, s.started_at AS session_started_at
                    FROM machine_traffic_logs l
                    LEFT JOIN machine_runtime_sessions s ON s.id = l.session_id
                    WHERE l.machine_id = ?
                    ORDER BY l.created_at DESC
                    LIMIT ?
                `)
            .all(machineId, Math.max(1, Number(limit) || 50));
    }
    clearMachineLogs(machineId) {
        this.ensureTable();
        (0, db_1.getDb)().prepare(`DELETE FROM machine_traffic_logs WHERE machine_id = ?`).run(machineId);
        return true;
    }
    replay(logId, mode = 'FULL_WORKFLOW') {
        this.ensureTable();
        this.parsedMessages.ensureTable();
        this.normalizedResults.ensureTable();
        const original = this.get(logId);
        if (!original)
            throw new Error(`Traffic log not found: ${logId}`);
        const raw = String(original.payload ?? original.payload_preview ?? '');
        if (!raw.trim())
            throw new Error('Selected traffic entry has no replayable payload.');
        const session = this.sessions.startSession({
            machineId: original.machine_id,
            machineName: null,
            mode: 'REPLAY',
            transport: original.transport,
            protocol: original.protocol,
            message: `Replay ${mode} from traffic log ${logId}`,
            meta: { replayOfLogId: logId, mode },
            closeExisting: false,
        });
        const replayLog = this.create({
            machine_id: original.machine_id,
            session_id: session.id,
            direction: 'system',
            transport: original.transport,
            protocol: original.protocol,
            event_type: 'replay',
            payload: raw,
            payload_preview: raw.slice(0, 300),
            processing_status: 'REPLAY_STARTED',
            processing_message: `Replay started: ${mode}`,
            replay_of_log_id: logId,
            replay_mode: mode,
            meta_json: safeJson({ replayOfLogId: logId, mode }),
        });
        const logs = [];
        const addLog = (level, message) => logs.push({ level, message, at: nowIso() });
        try {
            addLog('info', 'Replay payload loaded');
            const parsed = this.parsers.get(original.protocol).parse({
                machineId: original.machine_id,
                protocol: original.protocol,
                raw,
                timestamp: nowIso(),
            });
            if (!parsed) {
                addLog('warn', 'Replay parser returned no parsed message');
                this.updateProcessing(replayLog.id, {
                    processing_status: 'PARSE_EMPTY',
                    processing_message: 'Parser returned no parsed message',
                });
                this.sessions.endSession(session.id, 'STOPPED', 'Replay completed without parsed output');
                return { ok: false, status: 'PARSE_EMPTY', logId: replayLog.id, sessionId: session.id, logs };
            }
            const parsedRow = this.parsedMessages.create(parsed);
            const parsedId = typeof parsedRow === 'object' ? parsedRow.id ?? null : null;
            addLog('info', `Parsed as ${parsed.messageType}`);
            if (mode === 'PARSE_ONLY') {
                this.updateProcessing(replayLog.id, {
                    parsed_message_id: parsedId,
                    processing_status: 'PARSED',
                    processing_message: parsed.summary ?? 'Replay parsed successfully',
                });
                this.sessions.endSession(session.id, 'STOPPED', 'Replay parse-only completed');
                return { ok: true, status: 'PARSED', logId: replayLog.id, sessionId: session.id, parsedMessageId: parsedId, logs };
            }
            const normalized = this.normalizers.get(parsed.protocol).normalize(parsed);
            if (!normalized) {
                addLog('warn', 'Normalizer returned no result');
                this.updateProcessing(replayLog.id, {
                    parsed_message_id: parsedId,
                    processing_status: 'NORMALIZE_EMPTY',
                    processing_message: 'Normalizer returned no result',
                });
                this.sessions.endSession(session.id, 'STOPPED', 'Replay completed without normalized result');
                return { ok: false, status: 'NORMALIZE_EMPTY', logId: replayLog.id, sessionId: session.id, parsedMessageId: parsedId, logs };
            }
            const normalizedRow = this.normalizedResults.create(normalized);
            const normalizedId = normalizedRow?.id ?? null;
            addLog('info', 'Normalized result created');
            this.updateProcessing(replayLog.id, {
                parsed_message_id: parsedId,
                normalized_result_id: normalizedId,
                processing_status: 'NORMALIZED',
                processing_message: normalized.summary ?? parsed.summary ?? 'Replay normalized successfully',
            });
            this.sessions.endSession(session.id, 'STOPPED', mode === 'FULL_WORKFLOW' ? 'Replay workflow completed' : 'Replay normalization completed');
            return {
                ok: true,
                status: 'NORMALIZED',
                logId: replayLog.id,
                sessionId: session.id,
                parsedMessageId: parsedId,
                normalizedResultId: normalizedId,
                logs,
            };
        }
        catch (error) {
            addLog('error', error?.message ?? 'Replay failed');
            this.updateProcessing(replayLog.id, {
                processing_status: 'ERROR',
                processing_message: error?.message ?? 'Replay failed',
            });
            this.sessions.endSession(session.id, 'ERROR', 'Replay failed', error?.message ?? 'Replay failed');
            throw error;
        }
    }
}
exports.MachineTrafficLogService = MachineTrafficLogService;
