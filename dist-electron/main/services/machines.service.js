"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachinesService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const auditLog_1 = require("../logging/auditLog");
const resource_actor_util_1 = require("./resource-actor.util");
const nowIso = () => new Date().toISOString();
class MachinesService {
    list() {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
            SELECT m.*, l.name AS lab_name
            FROM machines m
            LEFT JOIN labs l ON l.id = m.lab_id
            ORDER BY m.name ASC
        `)
            .all();
    }
    create(dto) {
        const db = (0, db_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        const actor = (0, resource_actor_util_1.getCurrentActorSnapshot)();
        db.prepare(`INSERT INTO machines (
            id, lab_id,
            name, code, model, brand, version, manufacturer,
            connection_type,
            host, port, tcp_mode,
            serial_port, baud_rate, data_bits, stop_bits, parity,
            ftp_host, ftp_port, ftp_user, ftp_password, ftp_remote_dir,
            watch_dir, watch_pattern,
            protocol,
            is_active, auto_connect,
            created_at, updated_at,
            created_by_user_id, created_by_username,
            updated_by_user_id, updated_by_username
        ) VALUES (
            ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?,
            ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?,
            ?, ?,
            ?, ?,
            ?, ?,
            ?, ?
        )
        `).run(id, dto.lab_id, dto.name, dto.code ?? null, dto.model ?? null, dto.brand ?? null, dto.version ?? null, dto.manufacturer ?? null, dto.connection_type, dto.host ?? null, dto.port ?? null, dto.tcp_mode ?? 'SERVER', dto.serial_port ?? null, dto.baud_rate ?? null, dto.data_bits ?? null, dto.stop_bits ?? null, dto.parity ?? null, dto.ftp_host ?? null, dto.ftp_port ?? null, dto.ftp_user ?? null, dto.ftp_password ?? null, dto.ftp_remote_dir ?? null, dto.watch_dir ?? null, dto.watch_pattern ?? null, dto.protocol, dto.is_active ?? 1, dto.auto_connect ?? 0, ts, ts, actor?.id ?? null, actor?.username ?? null, actor?.id ?? null, actor?.username ?? null);
        (0, auditLog_1.logEvent)({
            level: 'info',
            source: 'APP',
            entityType: 'machine',
            entityId: id,
            message: actor ? `Machine created by ${actor.username}` : 'Machine created',
        });
        return { id };
    }
    update(id, dto) {
        const db = (0, db_1.getDb)();
        const ts = nowIso();
        const actor = (0, resource_actor_util_1.getCurrentActorSnapshot)();
        const res = db
            .prepare(`
        UPDATE machines SET
            lab_id = COALESCE(?, lab_id),
            name = COALESCE(?, name),
            code = COALESCE(?, code),
            brand = COALESCE(?, brand),
            model = COALESCE(?, model),
            version = COALESCE(?, version),
            manufacturer = COALESCE(?, manufacturer),
            connection_type = COALESCE(?, connection_type),
            protocol = COALESCE(?, protocol),
            host = COALESCE(?, host),
            port = COALESCE(?, port),
            tcp_mode = COALESCE(?, tcp_mode),
            serial_port = COALESCE(?, serial_port),
            baud_rate = COALESCE(?, baud_rate),
            data_bits = COALESCE(?, data_bits),
            stop_bits = COALESCE(?, stop_bits),
            parity = COALESCE(?, parity),
            ftp_host = COALESCE(?, ftp_host),
            ftp_port = COALESCE(?, ftp_port),
            ftp_user = COALESCE(?, ftp_user),
            ftp_password = COALESCE(?, ftp_password),
            ftp_remote_dir = COALESCE(?, ftp_remote_dir),
            auto_connect = COALESCE(?, auto_connect),
            watch_dir = COALESCE(?, watch_dir),
            watch_pattern = COALESCE(?, watch_pattern),
            is_active = COALESCE(?, is_active),
            updated_at = ?,
            updated_by_user_id = ?,
            updated_by_username = ?
        WHERE id = ?
    `)
            .run(dto.lab_id ?? null, dto.name ?? null, dto.code ?? null, dto.brand ?? null, dto.model ?? null, dto.version ?? null, dto.manufacturer ?? null, dto.connection_type ?? null, dto.protocol ?? null, dto.host ?? null, dto.port ?? null, dto.tcp_mode ?? null, dto.serial_port ?? null, dto.baud_rate ?? null, dto.data_bits ?? null, dto.stop_bits ?? null, dto.parity ?? null, dto.ftp_host ?? null, dto.ftp_port ?? null, dto.ftp_user ?? null, dto.ftp_password ?? null, dto.ftp_remote_dir ?? null, dto.auto_connect ?? null, dto.watch_dir ?? null, dto.watch_pattern ?? null, dto.is_active ?? null, ts, actor?.id ?? null, actor?.username ?? null, id);
        if (res.changes !== 1)
            throw new Error(`Machine update failed (id=${id})`);
        (0, auditLog_1.logEvent)({
            level: 'info',
            source: 'APP',
            entityType: 'machine',
            entityId: id,
            message: actor ? `Machine updated by ${actor.username}` : 'Machine updated',
        });
        return true;
    }
    delete(id) {
        const db = (0, db_1.getDb)();
        const actor = (0, resource_actor_util_1.getCurrentActorSnapshot)();
        db.prepare(`DELETE FROM machines WHERE id = ?`).run(id);
        (0, auditLog_1.logEvent)({
            level: 'warn',
            source: 'APP',
            entityType: 'machine',
            entityId: id,
            message: actor ? `Machine deleted by ${actor.username}` : 'Machine deleted',
        });
        return true;
    }
    connect(id) {
        const actor = (0, resource_actor_util_1.getCurrentActorSnapshot)();
        (0, auditLog_1.logEvent)({
            level: 'info',
            source: 'MACHINE',
            entityType: 'machine',
            entityId: id,
            message: actor ? `Connect requested by ${actor.username}` : 'Connect requested',
        });
        return true;
    }
    disconnect(id) {
        const actor = (0, resource_actor_util_1.getCurrentActorSnapshot)();
        (0, auditLog_1.logEvent)({
            level: 'warn',
            source: 'MACHINE',
            entityType: 'machine',
            entityId: id,
            message: actor ? `Disconnect requested by ${actor.username}` : 'Disconnect requested',
        });
        return true;
    }
    test(machine) {
        if (!machine?.connection_type) {
            return { ok: false, message: 'Missing connection_type' };
        }
        switch (machine.connection_type) {
            case 'TCP':
            case 'HL7_MLLP':
                if (!machine.host || !machine.port) {
                    return { ok: false, message: 'Host or port missing' };
                }
                return {
                    ok: true,
                    message: `${machine.tcp_mode === 'CLIENT' ? 'TCP client will connect to' : 'TCP server will listen on'} ${machine.host}:${machine.port}`,
                };
            case 'SERIAL':
                if (!machine.serial_port) {
                    return { ok: false, message: 'Serial port missing' };
                }
                return {
                    ok: true,
                    message: `Serial configuration looks valid (${machine.serial_port})`,
                };
            case 'FILE_WATCHER':
                if (!machine.watch_dir) {
                    return { ok: false, message: 'Watch directory missing' };
                }
                return {
                    ok: true,
                    message: `Watching directory ${machine.watch_dir}`,
                };
            case 'FTP':
            case 'SFTP':
                if (!machine.ftp_host) {
                    return { ok: false, message: 'FTP host missing' };
                }
                return {
                    ok: true,
                    message: `FTP configuration looks valid (${machine.ftp_host})`,
                };
            default:
                return {
                    ok: false,
                    message: `Unsupported connection type: ${machine.connection_type}`,
                };
        }
    }
}
exports.MachinesService = MachinesService;
