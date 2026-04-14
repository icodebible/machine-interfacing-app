import { app } from 'electron';
import fs from 'fs';
import path from 'path';

type SessionRecordParams = {
    machineId: string;
    machineName?: string | null;
    direction: 'inbound' | 'outbound' | 'system';
    payload: string;
    meta?: Record<string, any>;
};

const nowIso = () => new Date().toISOString();

function safeName(value: string) {
    return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export class SessionRecorderService {
    private baseDir: string;

    constructor() {
        this.baseDir = path.join(app.getPath('userData'), 'sessions');
        fs.mkdirSync(this.baseDir, { recursive: true });
    }

    private getMachineDir(machineId: string, machineName?: string | null) {
        const name = safeName(machineName || machineId);
        const dir = path.join(this.baseDir, `${name}_${machineId}`);
        fs.mkdirSync(dir, { recursive: true });
        return dir;
    }

    private getSessionFile(machineId: string, machineName?: string | null) {
        const dir = this.getMachineDir(machineId, machineName);
        const day = nowIso().slice(0, 10);
        return path.join(dir, `${day}.log`);
    }

    record(params: SessionRecordParams) {
        const file = this.getSessionFile(params.machineId, params.machineName);

        const block = [
            `--- ${nowIso()} ---`,
            `direction: ${params.direction}`,
            ...(params.meta ? [`meta: ${JSON.stringify(params.meta)}`] : []),
            `payload:`,
            params.payload,
            '',
        ].join('\n');

        fs.appendFileSync(file, block, 'utf8');
        return file;
    }
}