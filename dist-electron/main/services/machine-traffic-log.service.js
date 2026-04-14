"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineTrafficLogService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const actor_context_service_1 = require("./actor-context.service");
const nowIso = () => new Date().toISOString();
class MachineTrafficLogService {
    create(dto) {
        const db = (0, db_1.getDb)();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        db.prepare(`
                INSERT INTO machine_traffic_logs (
                    id,
                    machine_id,
                    direction,
                    transport,
                    protocol,
                    event_type,
                    payload,
                    payload_preview,
                    created_at,
                    created_by_user_id,
                    created_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run((0, crypto_1.randomUUID)(), dto.machine_id, dto.direction, dto.transport, dto.protocol, dto.event_type, dto.payload ?? null, dto.payload_preview ?? null, nowIso(), actor.userId, actor.username);
        return true;
    }
    listByMachine(machineId, limit = 50) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                    SELECT *
                    FROM machine_traffic_logs
                    WHERE machine_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                `)
            .all(machineId, limit);
    }
    clearMachineLogs(machineId) {
        const db = (0, db_1.getDb)();
        db.prepare(`DELETE FROM machine_traffic_logs WHERE machine_id = ?`).run(machineId);
        return true;
    }
}
exports.MachineTrafficLogService = MachineTrafficLogService;
