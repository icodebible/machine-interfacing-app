import { app, shell } from 'electron';
import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../../logging/logger';

const nowIso = () => new Date().toISOString();

export type MachineHostLogInfo = {
    rootDirectory: string;
    machineDirectory: string;
    activeFile: string | null;
    recentFiles: string[];
    rawRootDirectory: string;
    rawMachineDirectory: string;
    rawActiveFile: string | null;
    rawRecentFiles: string[];
};

type ActiveSessionFile = {
    machineId: string;
    machineName?: string | null;
    sessionId: string;
    mode: string;
    filePath: string;
};

type HostEventInput = {
    machineId: string;
    machineName?: string | null;
    sessionId?: string | null;
    category: string;
    event: string;
    level?: 'INFO' | 'WARN' | 'ERROR';
    message?: string | null;
    payload?: string | null;
    meta?: Record<string, unknown> | null;
    timestamp?: string | null;
};

type RawMachineMessageInput = {
    machineId: string;
    machineName?: string | null;
    sessionId?: string | null;
    transport?: string | null;
    protocol?: string | null;
    eventType?: string | null;
    payload: string;
    timestamp?: string | null;
};

function safeSegment(value: string | null | undefined, fallback: string) {
    const normalized = String(value ?? '')
        .trim()
        .replace(/[^a-zA-Z0-9._-]+/g, '_')
        .replace(/^_+|_+$/g, '');
    return normalized || fallback;
}

function compactTimestamp(value: string) {
    return value.replace(/[:.]/g, '-').replace('T', '_').replace('Z', 'Z');
}

function safeJson(value: unknown) {
    try {
        return JSON.stringify(value ?? null, null, 2);
    } catch {
        return 'null';
    }
}

export class MachineHostLogService {
    private readonly activeBySession = new Map<string, ActiveSessionFile>();
    private readonly activeByMachine = new Map<string, ActiveSessionFile>();
    private readonly rawActiveBySession = new Map<string, ActiveSessionFile>();
    private readonly rawActiveByMachine = new Map<string, ActiveSessionFile>();
    private readonly writeChains = new Map<string, Promise<void>>();
    private readonly pendingWrites = new Set<Promise<void>>();

    /**
     * General operational diagnostics. These logs intentionally correlate the full application journey:
     * traffic, parsing, normalization, workflow, queue, and delivery.
     */
    getRootDirectory() {
        return path.join(app.getPath('userData'), 'machine-logs');
    }

    getMachineDirectory(machineId: string) {
        return path.join(this.getRootDirectory(), `machine-${safeSegment(machineId, 'unknown')}`);
    }

    /**
     * Raw machine traffic is deliberately isolated from transformed/application payloads.
     * Only unmodified machine-originated messages are appended here.
     */
    getRawRootDirectory() {
        return path.join(app.getPath('userData'), 'machine-raw-logs');
    }

    getRawMachineDirectory(machineId: string) {
        return path.join(this.getRawRootDirectory(), `machine-${safeSegment(machineId, 'unknown')}`);
    }

    startSession(input: {
        machineId: string;
        machineName?: string | null;
        sessionId: string;
        mode: string;
        transport?: string | null;
        protocol?: string | null;
        startedAt?: string | null;
        message?: string | null;
        meta?: Record<string, unknown> | null;
    }) {
        const startedAt = input.startedAt || nowIso();
        const filePath = this.sessionFilePath({
            machineId: input.machineId,
            machineName: input.machineName ?? null,
            sessionId: input.sessionId,
            mode: input.mode,
            startedAt,
        });
        const active: ActiveSessionFile = {
            machineId: input.machineId,
            machineName: input.machineName ?? null,
            sessionId: input.sessionId,
            mode: input.mode,
            filePath,
        };

        this.activeBySession.set(input.sessionId, active);
        if (String(input.mode).toUpperCase() === 'LIVE') {
            this.activeByMachine.set(input.machineId, active);
        }

        this.enqueue(filePath, [
            '================================================================================',
            'MACHINE INTERFACING RUNTIME SESSION',
            'GENERAL OPERATIONAL DIAGNOSTIC LOG',
            '================================================================================',
            `started_at_utc: ${startedAt}`,
            `machine_id: ${input.machineId}`,
            `machine_name: ${input.machineName ?? '—'}`,
            `session_id: ${input.sessionId}`,
            `mode: ${input.mode}`,
            `transport: ${input.transport ?? '—'}`,
            `protocol: ${input.protocol ?? '—'}`,
            `message: ${input.message ?? '—'}`,
            `metadata: ${safeJson(input.meta ?? null)}`,
            '================================================================================',
            '',
        ].join('\n'));

        // A raw machine file is created only for a real LIVE runtime session. Simulation and replay
        // must never be confused with evidence received from the physical analyzer.
        if (String(input.mode).toUpperCase() === 'LIVE') {
            const rawFilePath = this.rawSessionFilePath({
                machineId: input.machineId,
                machineName: input.machineName ?? null,
                sessionId: input.sessionId,
                startedAt,
            });
            const rawActive: ActiveSessionFile = {
                machineId: input.machineId,
                machineName: input.machineName ?? null,
                sessionId: input.sessionId,
                mode: input.mode,
                filePath: rawFilePath,
            };
            this.rawActiveBySession.set(input.sessionId, rawActive);
            this.rawActiveByMachine.set(input.machineId, rawActive);

            this.enqueue(rawFilePath, [
                '================================================================================',
                'MACHINE RAW TRAFFIC LOG',
                'UNMODIFIED MACHINE-ORIGINATED MESSAGES ONLY',
                '================================================================================',
                `started_at_utc: ${startedAt}`,
                `machine_id: ${input.machineId}`,
                `machine_name: ${input.machineName ?? '—'}`,
                `session_id: ${input.sessionId}`,
                `transport: ${input.transport ?? '—'}`,
                `protocol: ${input.protocol ?? '—'}`,
                'note: No parsed, normalized, transformed, workflow, queue, or LIS delivery payloads are written to this file.',
                '================================================================================',
                '',
            ].join('\n'));
        }

        return filePath;
    }

    endSession(input: {
        machineId: string;
        machineName?: string | null;
        sessionId: string;
        mode?: string | null;
        startedAt?: string | null;
        status: string;
        stoppedAt?: string | null;
        message?: string | null;
        error?: string | null;
    }) {
        const target = this.activeBySession.get(input.sessionId);
        const filePath = target?.filePath ?? (
            input.startedAt && input.mode
                ? this.sessionFilePath({
                    machineId: input.machineId,
                    machineName: input.machineName ?? null,
                    sessionId: input.sessionId,
                    mode: input.mode,
                    startedAt: input.startedAt,
                })
                : this.fallbackFile(input.machineId)
        );
        const stoppedAt = input.stoppedAt || nowIso();

        this.enqueue(filePath, [
            '',
            '================================================================================',
            'SESSION CLOSED',
            '================================================================================',
            `stopped_at_utc: ${stoppedAt}`,
            `status: ${input.status}`,
            `message: ${input.message ?? '—'}`,
            `error: ${input.error ?? '—'}`,
            '================================================================================',
            '',
        ].join('\n'));

        const rawTarget = this.rawActiveBySession.get(input.sessionId);
        if (rawTarget) {
            this.enqueue(rawTarget.filePath, [
                '',
                '================================================================================',
                'RAW TRAFFIC SESSION CLOSED',
                '================================================================================',
                `stopped_at_utc: ${stoppedAt}`,
                `status: ${input.status}`,
                '================================================================================',
                '',
            ].join('\n'));
        }

        this.activeBySession.delete(input.sessionId);
        if (this.activeByMachine.get(input.machineId)?.sessionId === input.sessionId) {
            this.activeByMachine.delete(input.machineId);
        }
        this.rawActiveBySession.delete(input.sessionId);
        if (this.rawActiveByMachine.get(input.machineId)?.sessionId === input.sessionId) {
            this.rawActiveByMachine.delete(input.machineId);
        }
    }

    appendEvent(input: HostEventInput) {
        const timestamp = input.timestamp || nowIso();
        const active = input.sessionId
            ? this.activeBySession.get(input.sessionId)
            : this.activeByMachine.get(input.machineId);
        const filePath = active?.filePath ?? this.fallbackFile(input.machineId, timestamp);

        const lines = [
            `[${timestamp}] [${input.level ?? 'INFO'}] [${input.category}] ${input.event}`,
            `machine_id: ${input.machineId}`,
            ...(input.machineName ? [`machine_name: ${input.machineName}`] : []),
            ...(input.sessionId ? [`session_id: ${input.sessionId}`] : active?.sessionId ? [`session_id: ${active.sessionId}`] : []),
            ...(input.message ? [`message: ${input.message}`] : []),
            ...(input.meta ? [`metadata: ${safeJson(input.meta)}`] : []),
        ];

        if (input.payload !== undefined && input.payload !== null) {
            lines.push('payload_begin');
            lines.push(input.payload);
            lines.push('payload_end');
        }

        lines.push('--------------------------------------------------------------------------------', '');
        this.enqueue(filePath, lines.join('\n'));
        return filePath;
    }

    /**
     * Append the exact machine-originated message to the dedicated raw evidence file.
     * This method intentionally accepts no transformed/result/workflow metadata.
     */
    appendRawMachineMessage(input: RawMachineMessageInput) {
        if (input.payload === undefined || input.payload === null) return null;
        const active = input.sessionId
            ? this.rawActiveBySession.get(input.sessionId)
            : this.rawActiveByMachine.get(input.machineId);

        // Raw evidence is restricted to LIVE physical-machine sessions. Do not create fallback raw
        // files for simulations/replays because they could later be mistaken for analyzer evidence.
        if (!active || String(active.mode).toUpperCase() !== 'LIVE') return null;

        const timestamp = input.timestamp || nowIso();
        const lines = [
            `[${timestamp}] MACHINE_MESSAGE`,
            `machine_id: ${input.machineId}`,
            ...(input.machineName ? [`machine_name: ${input.machineName}`] : []),
            `session_id: ${active.sessionId}`,
            `direction: inbound`,
            `transport: ${input.transport ?? '—'}`,
            `protocol: ${input.protocol ?? '—'}`,
            `event_type: ${input.eventType ?? 'payload'}`,
            'raw_message_begin',
            input.payload,
            'raw_message_end',
            '--------------------------------------------------------------------------------',
            '',
        ];

        this.enqueue(active.filePath, lines.join('\n'));
        return active.filePath;
    }

    async getInfo(machineId: string): Promise<MachineHostLogInfo> {
        const rootDirectory = this.getRootDirectory();
        const machineDirectory = this.getMachineDirectory(machineId);
        const rawRootDirectory = this.getRawRootDirectory();
        const rawMachineDirectory = this.getRawMachineDirectory(machineId);
        await Promise.all([
            fs.mkdir(machineDirectory, { recursive: true, mode: 0o700 }),
            fs.mkdir(rawMachineDirectory, { recursive: true, mode: 0o700 }),
        ]);

        const [recentFiles, rawRecentFiles] = await Promise.all([
            this.listRecentTextFiles(machineDirectory, 'general diagnostic'),
            this.listRecentTextFiles(rawMachineDirectory, 'raw machine'),
        ]);

        return {
            rootDirectory,
            machineDirectory,
            activeFile: this.activeByMachine.get(machineId)?.filePath ?? null,
            recentFiles,
            rawRootDirectory,
            rawMachineDirectory,
            rawActiveFile: this.rawActiveByMachine.get(machineId)?.filePath ?? null,
            rawRecentFiles,
        };
    }

    async openMachineDirectory(machineId: string) {
        const info = await this.getInfo(machineId);
        const error = await shell.openPath(info.machineDirectory);
        if (error) throw new Error(error);
        return true;
    }

    async openRawMachineDirectory(machineId: string) {
        const info = await this.getInfo(machineId);
        const error = await shell.openPath(info.rawMachineDirectory);
        if (error) throw new Error(error);
        return true;
    }

    async flush() {
        if (!this.pendingWrites.size) return;
        await Promise.allSettled(Array.from(this.pendingWrites));
    }

    private sessionFilePath(input: {
        machineId: string;
        machineName?: string | null;
        sessionId: string;
        mode: string;
        startedAt: string;
    }) {
        const machineName = safeSegment(input.machineName, 'machine');
        const mode = safeSegment(input.mode, 'SESSION').toUpperCase();
        const fileName = `${compactTimestamp(input.startedAt)}--${mode}--${machineName}--${safeSegment(input.sessionId, 'session')}.txt`;
        return path.join(this.getMachineDirectory(input.machineId), fileName);
    }

    private rawSessionFilePath(input: {
        machineId: string;
        machineName?: string | null;
        sessionId: string;
        startedAt: string;
    }) {
        const machineName = safeSegment(input.machineName, 'machine');
        const fileName = `${compactTimestamp(input.startedAt)}--LIVE--${machineName}--${safeSegment(input.sessionId, 'session')}--RAW.txt`;
        return path.join(this.getRawMachineDirectory(input.machineId), fileName);
    }

    private fallbackFile(machineId: string, timestamp = nowIso()) {
        const day = timestamp.slice(0, 10);
        return path.join(this.getMachineDirectory(machineId), `${day}--machine-events.txt`);
    }

    private async listRecentTextFiles(directory: string, label: string) {
        try {
            return (await fs.readdir(directory, { withFileTypes: true }))
                .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'))
                .map((entry) => path.join(directory, entry.name))
                .sort((a, b) => b.localeCompare(a))
                .slice(0, 10);
        } catch (error) {
            logger.warn(`Unable to enumerate ${label} log files`, error as any);
            return [];
        }
    }

    private enqueue(filePath: string, content: string) {
        const previous = this.writeChains.get(filePath) ?? Promise.resolve();
        const current = previous
            .catch(() => undefined)
            .then(async () => {
                await fs.mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
                await fs.appendFile(filePath, content, { encoding: 'utf8', mode: 0o600 });
            })
            .catch((error) => {
                logger.error(`Failed to append machine host log: ${filePath}`, error as any);
            });

        this.writeChains.set(filePath, current);
        this.pendingWrites.add(current);
        void current.finally(() => {
            this.pendingWrites.delete(current);
            if (this.writeChains.get(filePath) === current) {
                this.writeChains.delete(filePath);
            }
        });
    }
}

export const machineHostLogService = new MachineHostLogService();
