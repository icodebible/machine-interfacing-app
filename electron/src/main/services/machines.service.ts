import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { logEvent } from '../logging/auditLog';

const nowIso = () => new Date().toISOString();

// export type MachineDto = {
//     lab_id?: string | null;
//     name: string;
//     brand?: string;
//     model?: string;
//     version?: string;
//     connection_type: 'TCP' | 'SERIAL' | 'FTP' | 'SFTP';
//     protocol: 'HL7' | 'ASTM';
//     tcp_host?: string;
//     tcp_port?: number;
//     serial_path?: string;
//     serial_baud_rate?: number;
//     enabled?: number;
//     auto_connect?: number;
// };

// export type MachineDto = {
//     lab_id?: string | null;
//     name: string;
//     brand?: string;
//     model?: string;
//     version?: string;

//     connection_type: 'TCP' | 'SERIAL' | 'HL7_MLLP' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
//     protocol: 'HL7' | 'ASTM' | 'RAW';

//     tcp_host?: string;
//     tcp_port?: number;

//     serial_path?: string;
//     serial_baud_rate?: number;

//     watch_dir?: string;
//     watch_pattern?: string;

//     enabled?: number;
//     auto_connect?: number;
// };

// export type MachineDto = {
//     lab_id: string;
//     name: string;
//     code?: string | null;
//     model?: string | null;
//     brand?: string | null;
//     version?: string | null;
//     manufacturer?: string | null;

//     connection_type: 'TCP' | 'SERIAL' | 'HL7_MLLP' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
//     protocol: 'ASTM' | 'HL7' | 'RAW';

//     // TCP / HL7
//     host?: string | null;
//     port?: number | null;

//     // SERIAL
//     serial_port?: string | null;
//     baud_rate?: number | null;
//     data_bits?: number | null;
//     stop_bits?: number | null;
//     parity?: 'none' | 'even' | 'odd' | 'mark' | 'space' | null;

//     // FTP/SFTP
//     ftp_host?: string | null;
//     ftp_port?: number | null;
//     ftp_user?: string | null;
//     ftp_password?: string | null;
//     ftp_remote_dir?: string | null;

//     // FILE_WATCHER
//     watch_dir?: string | null;
//     watch_pattern?: string | null;

//     is_active?: number | null;
//     auto_connect?: number | null; // (we will add this to schema below)
// };

// export class MachinesService {
//     list() {
//         const db = getDb();
//         return db
//             .prepare(
//                 `
//             SELECT m.*, l.name AS lab_name
//             FROM machines m
//             LEFT JOIN labs l ON l.id = m.lab_id
//             ORDER BY m.name ASC
//         `,
//             )
//             .all();
//     }

//     create(dto: MachineDto) {
//         const db = getDb();
//         const id = randomUUID();
//         const ts = nowIso();

//         // db.prepare(
//         //     `INSERT INTO machines (
//         //         id,
//         //         lab_id,
//         //         name,
//         //         brand,
//         //         model,
//         //         version,

//         //         connection_type, -- TCP | SERIAL | HL7_MLLP | FTP | SFTP | FILE_WATCHER
//         //         protocol, -- ASTM | HL7 | RAW

//         //         tcp_host,
//         //         tcp_port,
//         //         serial_path,
//         //         serial_baud_rate,
//         //         watch_dir,
//         //         watch_pattern,
//         //         enabled,
//         //         auto_connect,
//         //         created_at,
//         //         updated_at
//         //     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//         // ).run(
//         //     id,
//         //     dto.lab_id ?? null,
//         //     dto.name,
//         //     dto.brand ?? null,
//         //     dto.model ?? null,
//         //     dto.version ?? null,
//         //     dto.connection_type,
//         //     dto.protocol,
//         //     dto.tcp_host ?? null,
//         //     dto.tcp_port ?? null,
//         //     dto.serial_path ?? null,
//         //     dto.serial_baud_rate ?? null,
//         //     dto.enabled ?? 1,
//         //     dto.auto_connect ?? 0,
//         //     dto.watch_dir ?? null,
//         //     dto.watch_pattern ?? null,
//         //     ts,
//         //     ts,
//         // );

//         db.prepare(
//             `
//   INSERT INTO machines (
//     id, lab_id,
//     name, code, model, brand, version, manufacturer,
//     connection_type,
//     host, port,
//     serial_port, baud_rate, data_bits, stop_bits, parity,
//     ftp_host, ftp_port, ftp_user, ftp_password, ftp_remote_dir,
//     watch_dir, watch_pattern,
//     protocol,
//     is_active, auto_connect,
//     created_at, updated_at
//   ) VALUES (
//     ?, ?,
//     ?, ?, ?, ?, ?, ?,
//     ?,
//     ?, ?,
//     ?, ?, ?, ?, ?,
//     ?, ?, ?, ?, ?,
//     ?, ?,
//     ?,
//     ?, ?,
//     ?, ?
//   )
// `,
//         ).run(
//             id,
//             dto.lab_id,
//             dto.name,
//             dto.code ?? null,
//             dto.model ?? null,
//             dto.brand ?? null,
//             dto.version ?? null,
//             dto.manufacturer ?? null,

//             dto.connection_type,

//             dto.host ?? null,
//             dto.port ?? null,

//             dto.serial_port ?? null,
//             dto.baud_rate ?? null,
//             dto.data_bits ?? null,
//             dto.stop_bits ?? null,
//             dto.parity ?? null,

//             dto.ftp_host ?? null,
//             dto.ftp_port ?? null,
//             dto.ftp_user ?? null,
//             dto.ftp_password ?? null,
//             dto.ftp_remote_dir ?? null,

//             dto.watch_dir ?? null,
//             dto.watch_pattern ?? null,

//             dto.protocol,

//             dto.is_active ?? 1,
//             dto.auto_connect ?? 0,

//             ts,
//             ts,
//         );

//         logEvent({
//             level: 'info',
//             source: 'APP',
//             entityType: 'machine',
//             entityId: id,
//             message: 'Machine created',
//         });
//         return { id };
//     }

//     // update(id: string, dto: Partial<MachineDto>) {
//     //     const db = getDb();
//     //     const ts = nowIso();

//     //     const res = db
//     //         .prepare(
//     //             `
//     //         UPDATE machines SET
//     //             lab_id = COALESCE(?, lab_id),
//     //             name = COALESCE(?, name),
//     //             brand = COALESCE(?, brand),
//     //             model = COALESCE(?, model),
//     //             version = COALESCE(?, version),
//     //             connection_type = COALESCE(?, connection_type),
//     //             protocol = COALESCE(?, protocol),
//     //             tcp_host = COALESCE(?, tcp_host),
//     //             tcp_port = COALESCE(?, tcp_port),
//     //             serial_path = COALESCE(?, serial_path),
//     //             serial_baud_rate = COALESCE(?, serial_baud_rate),
//     //             enabled = COALESCE(?, enabled),
//     //             auto_connect = COALESCE(?, auto_connect),
//     //             watch_dir = COALESCE(?, watch_dir),
//     //             watch_pattern = COALESCE(?, watch_pattern),
//     //             updated_at = ?
//     //         WHERE id = ?
//     //     `,
//     //         )
//     //         .run(
//     //             dto.lab_id ?? null,
//     //             dto.name ?? null,
//     //             dto.brand ?? null,
//     //             dto.model ?? null,
//     //             dto.version ?? null,
//     //             dto.connection_type ?? null,
//     //             dto.protocol ?? null,
//     //             dto.tcp_host ?? null,
//     //             dto.tcp_port ?? null,
//     //             dto.serial_path ?? null,
//     //             dto.serial_baud_rate ?? null,
//     //             dto.enabled ?? null,
//     //             dto.auto_connect ?? null,
//     //             dto.watch_dir ?? null,
//     //             dto.watch_pattern ?? null,
//     //             ts,
//     //             id,
//     //         );

//     //     if (res.changes !== 1) throw new Error(`Machine update failed (id=${id})`);
//     //     logEvent({
//     //         level: 'info',
//     //         source: 'APP',
//     //         entityType: 'machine',
//     //         entityId: id,
//     //         message: 'Machine updated',
//     //     });
//     //     return true;
//     // }

//     update(id: string, dto: Partial<MachineDto>) {
//         const db = getDb();
//         const ts = nowIso();

//         const res = db
//             .prepare(
//                 `UPDATE machines SET
//                     lab_id = COALESCE(?, lab_id),
//                     name = COALESCE(?, name),
//                     code = COALESCE(?, code),
//                     brand = COALESCE(?, brand),
//                     model = COALESCE(?, model),
//                     version = COALESCE(?, version),
//                     manufacturer = COALESCE(?, manufacturer),

//                     connection_type = COALESCE(?, connection_type),
//                     protocol = COALESCE(?, protocol),

//                     host = COALESCE(?, host),
//                     port = COALESCE(?, port),

//                     serial_port = COALESCE(?, serial_port),
//                     baud_rate = COALESCE(?, baud_rate),
//                     data_bits = COALESCE(?, data_bits),
//                     stop_bits = COALESCE(?, stop_bits),
//                     parity = COALESCE(?, parity),

//                     ftp_host = COALESCE(?, ftp_host),
//                     ftp_port = COALESCE(?, ftp_port),
//                     ftp_user = COALESCE(?, ftp_user),
//                     ftp_password = COALESCE(?, ftp_password),
//                     ftp_remote_dir = COALESCE(?, ftp_remote_dir),

//                     watch_dir = COALESCE(?, watch_dir),
//                     watch_pattern = COALESCE(?, watch_pattern),

//                     is_active = COALESCE(?, is_active),
//                     auto_connect = COALESCE(?, auto_connect),

//                     updated_at = ?
//                     WHERE id = ?
//                 `,
//             )
//             .run(
//                 dto.lab_id ?? null,
//                 dto.name ?? null,
//                 dto.code ?? null,
//                 dto.brand ?? null,
//                 dto.model ?? null,
//                 dto.version ?? null,
//                 dto.manufacturer ?? null,

//                 dto.connection_type ?? null,
//                 dto.protocol ?? null,

//                 dto.host ?? null,
//                 dto.port ?? null,

//                 dto.serial_port ?? null,
//                 dto.baud_rate ?? null,
//                 dto.data_bits ?? null,
//                 dto.stop_bits ?? null,
//                 dto.parity ?? null,

//                 dto.ftp_host ?? null,
//                 dto.ftp_port ?? null,
//                 dto.ftp_user ?? null,
//                 dto.ftp_password ?? null,
//                 dto.ftp_remote_dir ?? null,

//                 dto.watch_dir ?? null,
//                 dto.watch_pattern ?? null,

//                 dto.is_active ?? null,
//                 dto.auto_connect ?? null,

//                 ts,
//                 id,
//             );

//         if (res.changes !== 1) throw new Error('Machine not found');
//         return true;
//     }

//     delete(id: string) {
//         const db = getDb();
//         db.prepare(`DELETE FROM machines WHERE id = ?`).run(id);
//         logEvent({
//             level: 'warn',
//             source: 'APP',
//             entityType: 'machine',
//             entityId: id,
//             message: 'Machine deleted',
//         });
//         return true;
//     }

//     // ✅ Foundation connect/disconnect (state will be added in Milestone 4/5)
//     connect(id: string) {
//         logEvent({
//             level: 'info',
//             source: 'MACHINE',
//             entityType: 'machine',
//             entityId: id,
//             message: 'Connect requested',
//         });
//         return true;
//     }

//     disconnect(id: string) {
//         logEvent({
//             level: 'warn',
//             source: 'MACHINE',
//             entityType: 'machine',
//             entityId: id,
//             message: 'Disconnect requested',
//         });
//         return true;
//     }

//     test(machine: any) {
//         if (!machine?.connection_type) {
//             return { ok: false, message: 'Missing connection_type' };
//         }

//         switch (machine.connection_type) {
//             case 'TCP':
//             case 'HL7_MLLP':
//                 if (!machine.tcp_host || !machine.tcp_port) {
//                     return { ok: false, message: 'Host or port missing' };
//                 }

//                 return {
//                     ok: true,
//                     message: `TCP configuration looks valid (${machine.tcp_host}:${machine.tcp_port})`,
//                 };

//             case 'SERIAL':
//                 if (!machine.serial_path) {
//                     return { ok: false, message: 'Serial path missing' };
//                 }

//                 return {
//                     ok: true,
//                     message: `Serial configuration looks valid (${machine.serial_path})`,
//                 };

//             case 'FILE_WATCHER':
//                 if (!machine.watch_dir) {
//                     return { ok: false, message: 'Watch directory missing' };
//                 }

//                 return {
//                     ok: true,
//                     message: `Watching directory ${machine.watch_dir}`,
//                 };

//             case 'FTP':
//             case 'SFTP':
//                 if (!machine.ftp_host) {
//                     return { ok: false, message: 'FTP host missing' };
//                 }

//                 return {
//                     ok: true,
//                     message: `FTP configuration looks valid (${machine.ftp_host})`,
//                 };

//             default:
//                 return {
//                     ok: false,
//                     message: `Unsupported connection type: ${machine.connection_type}`,
//                 };
//         }
//     }
// }

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

    // TCP / HL7
    host?: string | null;
    port?: number | null;

    // SERIAL
    serial_port?: string | null;
    baud_rate?: number | null;
    data_bits?: number | null;
    stop_bits?: number | null;
    parity?: 'none' | 'even' | 'odd' | 'mark' | 'space' | null;

    // FTP/SFTP
    ftp_host?: string | null;
    ftp_port?: number | null;
    ftp_user?: string | null;
    ftp_password?: string | null;
    ftp_remote_dir?: string | null;

    // FILE_WATCHER
    watch_dir?: string | null;
    watch_pattern?: string | null;

    is_active?: number | null;
    auto_connect?: number | null; // (we will add this to schema below)
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

        db.prepare(
            `INSERT INTO machines (
            id, lab_id,
            name, code, model, brand, version, manufacturer,
            connection_type,
            host, port,
            serial_port, baud_rate, data_bits, stop_bits, parity,
            ftp_host, ftp_port, ftp_user, ftp_password, ftp_remote_dir,
            watch_dir, watch_pattern,
            protocol,
            is_active, auto_connect,
            created_at, updated_at
        ) VALUES (
            ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?,
            ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?,
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
        );

        logEvent({
            level: 'info',
            source: 'APP',
            entityType: 'machine',
            entityId: id,
            message: 'Machine created',
        });
        return { id };
    }

    //
    update(id: string, dto: Partial<MachineDto>) {
        const db = getDb();
        const ts = nowIso();

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
            updated_at = ?
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
                id,
            );

        if (res.changes !== 1) throw new Error(`Machine update failed (id=${id})`);
        logEvent({
            level: 'info',
            source: 'APP',
            entityType: 'machine',
            entityId: id,
            message: 'Machine updated',
        });
        return true;
    }

    delete(id: string) {
        const db = getDb();
        db.prepare(`DELETE FROM machines WHERE id = ?`).run(id);
        logEvent({
            level: 'warn',
            source: 'APP',
            entityType: 'machine',
            entityId: id,
            message: 'Machine deleted',
        });
        return true;
    }

    // ✅ Foundation connect/disconnect (state will be added in Milestone 4/5)
    connect(id: string) {
        logEvent({
            level: 'info',
            source: 'MACHINE',
            entityType: 'machine',
            entityId: id,
            message: 'Connect requested',
        });
        return true;
    }

    disconnect(id: string) {
        logEvent({
            level: 'warn',
            source: 'MACHINE',
            entityType: 'machine',
            entityId: id,
            message: 'Disconnect requested',
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
                    message: `TCP configuration looks valid (${machine.host}:${machine.port})`,
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
