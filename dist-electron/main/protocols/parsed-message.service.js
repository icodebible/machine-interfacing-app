"use strict";
// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
// import { getCurrentActorSnapshot } from '../services/resource-actor.util';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParsedMessageService = void 0;
// const nowIso = () => new Date().toISOString();
// function ensureColumn(
//     db: ReturnType<typeof getDb>,
//     table: string,
//     column: string,
//     definitionSql: string,
// ) {
//     const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
//     if (!cols.some((c) => c.name === column)) {
//         db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
//     }
// }
// export class ParsedMessageService {
//     ensureTable() {
//         const db = getDb();
//         db.exec(`
//             CREATE TABLE IF NOT EXISTS parsed_messages (
//                 id TEXT PRIMARY KEY,
//                 machine_id TEXT NOT NULL,
//                 protocol TEXT NOT NULL,
//                 message_type TEXT NOT NULL,
//                 summary TEXT,
//                 data_json TEXT NOT NULL,
//                 raw TEXT,
//                 created_at TEXT NOT NULL,
//                 created_by_user_id TEXT,
//                 created_by_username TEXT
//             );
//             CREATE INDEX IF NOT EXISTS idx_parsed_messages_machine_id
//                 ON parsed_messages(machine_id);
//             CREATE INDEX IF NOT EXISTS idx_parsed_messages_created_at
//                 ON parsed_messages(created_at);
//         `);
//         ensureColumn(db, 'parsed_messages', 'created_by_user_id', 'TEXT');
//         ensureColumn(db, 'parsed_messages', 'created_by_username', 'TEXT');
//     }
//     create(message: {
//         machineId: string;
//         protocol: string;
//         messageType: string;
//         summary: string;
//         data: Record<string, any>;
//         raw: string;
//     }) {
//         const db = getDb();
//         const actor = getCurrentActorSnapshot();
//         this.ensureTable();
//         const id = randomUUID();
//         db.prepare(
//             `
//                 INSERT INTO parsed_messages (
//                     id,
//                     machine_id,
//                     protocol,
//                     message_type,
//                     summary,
//                     data_json,
//                     raw,
//                     created_at,
//                     created_by_user_id,
//                     created_by_username
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             message.machineId,
//             message.protocol,
//             message.messageType,
//             message.summary,
//             JSON.stringify(message.data ?? {}),
//             message.raw ?? null,
//             nowIso(),
//             actor?.id ?? null,
//             actor?.username ?? null,
//         );
//         return { id };
//     }
//     listByMachine(machineId: string, limit = 50) {
//         const db = getDb();
//         return db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM parsed_messages
//                     WHERE machine_id = ?
//                     ORDER BY created_at DESC
//                     LIMIT ?
//                 `,
//             )
//             .all(machineId, limit);
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
class ParsedMessageService {
    ensureTable() {
        const db = (0, db_1.getDb)();
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
    create(message) {
        const db = (0, db_1.getDb)();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        db.prepare(`
                INSERT INTO parsed_messages (
                id,
                machine_id,
                protocol,
                message_type,
                summary,
                data_json,
                raw,
                created_at,
                created_by_user_id,
                created_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run((0, crypto_1.randomUUID)(), message.machineId, message.protocol, message.messageType, message.summary, JSON.stringify(message.data ?? {}), message.raw ?? null, nowIso(), actor.userId, actor.username);
        return true;
    }
    listByMachine(machineId, limit = 50) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                SELECT *
                FROM parsed_messages
                WHERE machine_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                `)
            .all(machineId, limit);
    }
}
exports.ParsedMessageService = ParsedMessageService;
