import { randomUUID } from 'crypto';
import { getDb } from '../db/db';

const nowIso = () => new Date().toISOString();

export type MachineTrafficLogDto = {
    machine_id: string;
    direction: 'inbound' | 'outbound' | 'system';
    transport: 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
    protocol: 'ASTM' | 'HL7' | 'RAW';
    event_type:
    | 'connected'
    | 'disconnected'
    | 'payload'
    | 'parse_success'
    | 'parse_error'
    | 'test'
    | 'error';
    payload?: string | null;
    payload_preview?: string | null;
};

export type MachineTrafficLogQuery = {
    machineId: string;
    limit?: number;
};

export class MachineTrafficLogService {
    create(dto: MachineTrafficLogDto) {
        const db = getDb();

        db.prepare(
            `
                INSERT INTO machine_traffic_logs (
                    id,
                    machine_id,
                    direction,
                    transport,
                    protocol,
                    event_type,
                    payload,
                    payload_preview,
                    created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            randomUUID(),
            dto.machine_id,
            dto.direction,
            dto.transport,
            dto.protocol,
            dto.event_type,
            dto.payload ?? null,
            dto.payload_preview ?? null,
            nowIso(),
        );

        return true;
    }

    listByMachine(machineId: string, limit = 50) {
        const db = getDb();

        return db
            .prepare(
                `
                    SELECT *
                    FROM machine_traffic_logs
                    WHERE machine_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                `,
            )
            .all(machineId, limit);
    }

    clearMachineLogs(machineId: string) {
        const db = getDb();
        db.prepare(`DELETE FROM machine_traffic_logs WHERE machine_id = ?`).run(machineId);
        return true;
    }
}
