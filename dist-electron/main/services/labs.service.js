"use strict";
// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
// import { logEvent } from '../logging/auditLog';
// import { getCurrentActorSnapshot } from './resource-actor.util';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabsService = void 0;
// const nowIso = () => new Date().toISOString();
// export type LabDto = {
//     code?: string;
//     name: string;
//     location?: string;
//     description?: string;
//     is_active?: number;
// };
// export class LabsService {
//     list() {
//         const db = getDb();
//         return db.prepare(`SELECT * FROM labs ORDER BY name ASC`).all();
//     }
//     create(dto: LabDto) {
//         const db = getDb();
//         const id = randomUUID();
//         const ts = nowIso();
//         const actor = getCurrentActorSnapshot();
//         db.prepare(
//             `
//             INSERT INTO labs (
//                 id, code, name, location, description, is_active,
//                 created_at, updated_at,
//                 created_by_user_id, created_by_username,
//                 updated_by_user_id, updated_by_username
//             )
//             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.code ?? null,
//             dto.name,
//             dto.location ?? null,
//             dto.description ?? null,
//             dto.is_active ?? 1,
//             ts,
//             ts,
//             actor?.id ?? null,
//             actor?.username ?? null,
//             actor?.id ?? null,
//             actor?.username ?? null,
//         );
//         logEvent({
//             level: 'info',
//             source: 'APP',
//             entityType: 'lab',
//             entityId: id,
//             message: actor ? `Lab created by ${actor.username}` : 'Lab created',
//         });
//         return { id };
//     }
//     update(id: string, dto: Partial<LabDto>) {
//         const db = getDb();
//         const ts = nowIso();
//         const actor = getCurrentActorSnapshot();
//         const res = db
//             .prepare(
//                 `
//                 UPDATE labs SET
//                     code = COALESCE(?, code),
//                     name = COALESCE(?, name),
//                     location = COALESCE(?, location),
//                     description = COALESCE(?, description),
//                     is_active = COALESCE(?, is_active),
//                     updated_at = ?,
//                     updated_by_user_id = ?,
//                     updated_by_username = ?
//                 WHERE id = ?
//                 `,
//             )
//             .run(
//                 dto.code ?? null,
//                 dto.name ?? null,
//                 dto.location ?? null,
//                 dto.description ?? null,
//                 dto.is_active ?? null,
//                 ts,
//                 actor?.id ?? null,
//                 actor?.username ?? null,
//                 id,
//             );
//         if (res.changes !== 1) throw new Error(`Lab update failed (id=${id})`);
//         logEvent({
//             level: 'info',
//             source: 'APP',
//             entityType: 'lab',
//             entityId: id,
//             message: actor ? `Lab updated by ${actor.username}` : 'Lab updated',
//         });
//         return true;
//     }
//     delete(id: string) {
//         const db = getDb();
//         const actor = getCurrentActorSnapshot();
//         db.prepare(`DELETE FROM labs WHERE id = ?`).run(id);
//         logEvent({
//             level: 'warn',
//             source: 'APP',
//             entityType: 'lab',
//             entityId: id,
//             message: actor ? `Lab deleted by ${actor.username}` : 'Lab deleted',
//         });
//         return true;
//     }
// }
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const auditLog_1 = require("../logging/auditLog");
const actor_context_service_1 = require("./actor-context.service");
const nowIso = () => new Date().toISOString();
class LabsService {
    list() {
        const db = (0, db_1.getDb)();
        return db.prepare(`SELECT * FROM labs ORDER BY name ASC`).all();
    }
    create(dto) {
        const db = (0, db_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        db.prepare(`
            INSERT INTO labs (
                id, code, name, location, description, is_active,
                created_at, updated_at,
                created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(id, dto.code ?? null, dto.name, dto.location ?? null, dto.description ?? null, dto.is_active ?? 1, ts, ts, actor.userId, actor.username, actor.userId, actor.username);
        (0, auditLog_1.logEvent)({
            level: 'info',
            source: 'APP',
            entityType: 'lab',
            entityId: id,
            message: 'Lab created',
        });
        return { id };
    }
    update(id, dto) {
        const db = (0, db_1.getDb)();
        const ts = nowIso();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const res = db
            .prepare(`
                UPDATE labs SET
                    code = COALESCE(?, code),
                    name = COALESCE(?, name),
                    location = COALESCE(?, location),
                    description = COALESCE(?, description),
                    is_active = COALESCE(?, is_active),
                    updated_at = ?,
                    updated_by_user_id = ?,
                    updated_by_username = ?
                WHERE id = ?
                `)
            .run(dto.code ?? null, dto.name ?? null, dto.location ?? null, dto.description ?? null, dto.is_active ?? null, ts, actor.userId, actor.username, id);
        if (res.changes !== 1)
            throw new Error(`Lab update failed (id=${id})`);
        (0, auditLog_1.logEvent)({
            level: 'info',
            source: 'APP',
            entityType: 'lab',
            entityId: id,
            message: 'Lab updated',
        });
        return true;
    }
    delete(id) {
        const db = (0, db_1.getDb)();
        db.prepare(`DELETE FROM labs WHERE id = ?`).run(id);
        (0, auditLog_1.logEvent)({
            level: 'warn',
            source: 'APP',
            entityType: 'lab',
            entityId: id,
            message: 'Lab deleted',
        });
        return true;
    }
}
exports.LabsService = LabsService;
