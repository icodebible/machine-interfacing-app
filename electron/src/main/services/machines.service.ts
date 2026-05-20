import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { logEvent } from '../logging/auditLog';
import { getCurrentActorSnapshot } from './resource-actor.util';

const nowIso = () => new Date().toISOString();

export type MachineDto = {
    lab_id: string;
    name: string;
    code?: string | null;
    model?: string | null;
    brand?: string | null;
    version?: string | null;
    manufacturer?: string | null;

    connection_type: 'TCP' | 'SERIAL' | 'HL7_MLLP' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
    protocol: 'ASTM' | 'HL7' | 'RAW';

    host?: string | null;
    port?: number | null;
    tcp_mode?: 'SERVER' | 'CLIENT' | null;

    serial_port?: string | null;
    baud_rate?: number | null;
    data_bits?: number | null;
    stop_bits?: number | null;
    parity?: 'none' | 'even' | 'odd' | 'mark' | 'space' | null;

    ftp_host?: string | null;
    ftp_port?: number | null;
    ftp_user?: string | null;
    ftp_password?: string | null;
    ftp_remote_dir?: string | null;

    watch_dir?: string | null;
    watch_pattern?: string | null;

    is_active?: number | null;
    auto_connect?: number | null;
};

export class MachinesService {
    list() {
        const db = getDb();
        return db
            .prepare(
                `
            SELECT m.*, l.name AS lab_name
            FROM machines m
            LEFT JOIN labs l ON l.id = m.lab_id
            ORDER BY m.name ASC
        `,
            )
            .all();
    }

    create(dto: MachineDto) {
        const db = getDb();
        const id = randomUUID();
        const ts = nowIso();
        const actor = getCurrentActorSnapshot();

        db.prepare(
            `INSERT INTO machines (
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
        `,
        ).run(
            id,
            dto.lab_id,
            dto.name,
            dto.code ?? null,
            dto.model ?? null,
            dto.brand ?? null,
            dto.version ?? null,
            dto.manufacturer ?? null,
            dto.connection_type,
            dto.host ?? null,
            dto.port ?? null,
            dto.tcp_mode ?? 'SERVER',
            dto.serial_port ?? null,
            dto.baud_rate ?? null,
            dto.data_bits ?? null,
            dto.stop_bits ?? null,
            dto.parity ?? null,
            dto.ftp_host ?? null,
            dto.ftp_port ?? null,
            dto.ftp_user ?? null,
            dto.ftp_password ?? null,
            dto.ftp_remote_dir ?? null,
            dto.watch_dir ?? null,
            dto.watch_pattern ?? null,
            dto.protocol,
            dto.is_active ?? 1,
            dto.auto_connect ?? 0,
            ts,
            ts,
            actor?.id ?? null,
            actor?.username ?? null,
            actor?.id ?? null,
            actor?.username ?? null,
        );

        logEvent({
            level: 'info',
            source: 'APP',
            entityType: 'machine',
            entityId: id,
            message: actor ? `Machine created by ${actor.username}` : 'Machine created',
        });
        return { id };
    }

    update(id: string, dto: Partial<MachineDto>) {
        const db = getDb();
        const ts = nowIso();
        const actor = getCurrentActorSnapshot();

        const res = db
            .prepare(
                `
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
    `,
            )
            .run(
                dto.lab_id ?? null,
                dto.name ?? null,
                dto.code ?? null,
                dto.brand ?? null,
                dto.model ?? null,
                dto.version ?? null,
                dto.manufacturer ?? null,
                dto.connection_type ?? null,
                dto.protocol ?? null,
                dto.host ?? null,
                dto.port ?? null,
                dto.tcp_mode ?? null,
                dto.serial_port ?? null,
                dto.baud_rate ?? null,
                dto.data_bits ?? null,
                dto.stop_bits ?? null,
                dto.parity ?? null,
                dto.ftp_host ?? null,
                dto.ftp_port ?? null,
                dto.ftp_user ?? null,
                dto.ftp_password ?? null,
                dto.ftp_remote_dir ?? null,
                dto.auto_connect ?? null,
                dto.watch_dir ?? null,
                dto.watch_pattern ?? null,
                dto.is_active ?? null,
                ts,
                actor?.id ?? null,
                actor?.username ?? null,
                id,
            );

        if (res.changes !== 1) throw new Error(`Machine update failed (id=${id})`);
        logEvent({
            level: 'info',
            source: 'APP',
            entityType: 'machine',
            entityId: id,
            message: actor ? `Machine updated by ${actor.username}` : 'Machine updated',
        });
        return true;
    }

    delete(id: string) {
        const db = getDb();
        const actor = getCurrentActorSnapshot();
        db.prepare(`DELETE FROM machines WHERE id = ?`).run(id);
        logEvent({
            level: 'warn',
            source: 'APP',
            entityType: 'machine',
            entityId: id,
            message: actor ? `Machine deleted by ${actor.username}` : 'Machine deleted',
        });
        return true;
    }

    connect(id: string) {
        const actor = getCurrentActorSnapshot();
        logEvent({
            level: 'info',
            source: 'MACHINE',
            entityType: 'machine',
            entityId: id,
            message: actor ? `Connect requested by ${actor.username}` : 'Connect requested',
        });
        return true;
    }

    disconnect(id: string) {
        const actor = getCurrentActorSnapshot();
        logEvent({
            level: 'warn',
            source: 'MACHINE',
            entityType: 'machine',
            entityId: id,
            message: actor ? `Disconnect requested by ${actor.username}` : 'Disconnect requested',
        });
        return true;
    }

    test(machine: any) {
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
