import { SerialMachineService } from '../machines/serial.service';
import { TcpMachineService } from '../machines/tcp.service';
import { MachinesService } from '../services/machines.service';
import { RuntimeEventBus } from './runtime-event-bus';
import type { MachineRuntimeState } from './runtime.types';
import { SessionRecorderService } from './session-recorder.service';
import { MachineTrafficLogService } from './machine-traffic-log.service';
import { ParserRegistry } from '../protocols/parser-registry';
import { MachineSimulationManager, MachineSimulationScenario } from './machine-simulation.manager';
import { ParsedMessageService } from '../protocols/parsed-message.service';
import { NormalizerRegistry } from '../normalizers/normalizer-registry';
import { NormalizedResultService } from '../normalizers/normalized-result.service';
import { MachineSimulationUseCaseService } from '../services/machine-simulation-use-case.service';
import { auditService } from '../services/audit.service';

const nowIso = () => new Date().toISOString();

type RuntimeProtocol = 'ASTM' | 'HL7' | 'RAW';
type RuntimeMode = 'LIVE' | 'SIMULATION' | 'REPLAY';

type ProcessPayloadInput = {
    machineId: string;
    machineName?: string | null;
    raw: string;
    protocol: RuntimeProtocol | string;
    transport: string;
    mode: RuntimeMode;
    sessionId?: string | null;
    simulated?: boolean;
    meta?: Record<string, any> | null;
};

function normalizeProtocol(protocol: string | null | undefined): RuntimeProtocol {
    const p = String(protocol ?? '').trim().toUpperCase();
    if (p === 'HL7' || p === 'HL7_MLLP' || p === 'MLLP') return 'HL7';
    if (p === 'ASTM') return 'ASTM';
    return 'RAW';
}

function safeJson(value: unknown) {
    try {
        return JSON.stringify(value ?? null);
    } catch {
        return 'null';
    }
}

function renderTemplate(template: string, variables: Record<string, any>) {
    const enriched: Record<string, any> = {
        ...variables,
        now: nowIso(),
        messageDateTime: variables.messageDateTime ?? new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
        observedAt: variables.observedAt ?? new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
        messageControlId: variables.messageControlId ?? `SIM-${Date.now()}`,
    };
    return String(template ?? '').replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_match, key) => {
        const value = enriched[key];
        return value === undefined || value === null ? '' : String(value);
    });
}

export class MachineRuntimeManager {
    private machinesService = new MachinesService();
    private serial = new SerialMachineService();
    private states = new Map<string, MachineRuntimeState>();
    private recorder = new SessionRecorderService();
    private events = new RuntimeEventBus();
    private trafficLogs = new MachineTrafficLogService();
    private parsers = new ParserRegistry();
    private parsedMessages = new ParsedMessageService();
    private tcpSessions = new Map<string, any>();
    private serialSessions = new Map<string, any>();
    private normalizers = new NormalizerRegistry();
    private normalizedResults = new NormalizedResultService();
    private useCases = new MachineSimulationUseCaseService();

    constructor() {
        this.recorder.ensureTable();
        this.trafficLogs.ensureTable();
        this.parsedMessages.ensureTable();
        this.normalizedResults.ensureTable();
        this.useCases.ensureTable();
    }

    private simulator = new MachineSimulationManager((payload) => {
        this.processIncomingPayload({
            machineId: payload.machineId,
            machineName: payload.machineName,
            raw: payload.raw,
            protocol: payload.protocol,
            transport: payload.transport,
            mode: 'SIMULATION',
            simulated: true,
            meta: { source: 'interval_simulation' },
        });
    });

    startSimulation(
        machineId: string,
        scenario: MachineSimulationScenario = 'ASTM_BASIC',
        intervalMs = 5000,
    ) {
        const machine: any = this.machinesService.list().find((m: any) => m.id === machineId);
        if (!machine) throw new Error(`Machine not found: ${machineId}`);

        this.recorder.startSession({
            machineId,
            machineName: machine.name,
            mode: 'SIMULATION',
            transport: machine.connection_type ?? 'SIMULATION',
            protocol: machine.protocol ?? null,
            message: `Simulation started: ${scenario}`,
            meta: { scenario, intervalMs },
        });
        auditService.record({
            source: 'SIMULATION',
            category: 'SIMULATION',
            action: 'SIMULATION_STARTED',
            status: 'REQUESTED',
            entityType: 'machine',
            entityId: machineId,
            entityLabel: machine.name,
            summary: `Simulation started: ${scenario}`,
            details: { scenario, intervalMs, protocol: machine.protocol },
        });

        return this.simulator.start(machine, scenario, intervalMs);
    }

    stopSimulation(machineId: string) {
        const state = this.simulator.stop(machineId);
        this.recorder.endCurrent(machineId, 'SIMULATION', 'STOPPED', 'Simulation stopped by user');
        auditService.record({
            source: 'SIMULATION',
            category: 'SIMULATION',
            action: 'SIMULATION_STOPPED',
            entityType: 'machine',
            entityId: machineId,
            summary: 'Simulation stopped by user',
        });
        return state;
    }

    restartSimulation(
        machineId: string,
        scenario: MachineSimulationScenario = 'ASTM_BASIC',
        intervalMs = 5000,
    ) {
        this.stopSimulation(machineId);
        return this.startSimulation(machineId, scenario, intervalMs);
    }

    getSimulationState(machineId: string) {
        return this.simulator.getState(machineId);
    }

    getSimulationStates() {
        return this.simulator.getStates();
    }

    async runSimulationUseCase(machineId: string, useCaseId: string, variables: Record<string, any> = {}) {
        const machine: any = this.machinesService.list().find((m: any) => m.id === machineId);
        if (!machine) throw new Error(`Machine not found: ${machineId}`);

        const useCase = this.useCases.get(useCaseId);
        if (!useCase) throw new Error(`Simulation use case not found: ${useCaseId}`);

        const defaults = this.useCases.variablesFor(useCase);
        const payload = renderTemplate(useCase.sample_message, { ...defaults, ...(variables ?? {}) });
        const logs: Array<{ level: 'info' | 'warn' | 'error'; message: string; at: string }> = [];
        const addLog = (level: 'info' | 'warn' | 'error', message: string) => logs.push({ level, message, at: nowIso() });

        const session = this.recorder.startSession({
            machineId,
            machineName: machine.name,
            mode: 'SIMULATION',
            transport: machine.connection_type ?? 'SIMULATION',
            protocol: useCase.protocol,
            message: `Simulation use case: ${useCase.name}`,
            meta: { useCaseId, useCaseName: useCase.name, messageType: useCase.message_type },
            closeExisting: false,
        });

        try {
            addLog('info', `Running use case: ${useCase.name}`);
            const result = this.processIncomingPayload({
                machineId,
                machineName: machine.name,
                raw: payload,
                protocol: useCase.protocol,
                transport: machine.connection_type ?? 'SIMULATION',
                mode: 'SIMULATION',
                sessionId: session.id,
                simulated: true,
                meta: { source: 'simulation_use_case', useCaseId, useCaseName: useCase.name },
            });

            if (result.parsed) addLog('info', result.parsedSummary || 'Payload parsed successfully');
            else addLog('warn', result.message || 'Payload was accepted but not parsed');
            if (result.normalized) addLog('info', 'Normalized result created and sent into workflow');

            this.useCases.recordRun({
                machine_id: machineId,
                use_case_id: useCase.id,
                use_case_name: useCase.name,
                protocol: useCase.protocol,
                message_type: useCase.message_type,
                payload_preview: payload.slice(0, 300),
                result_status: result.ok ? 'SUCCESS' : 'FAILED',
                result_message: result.message ?? result.parsedSummary ?? null,
                logs_json: safeJson([...logs, ...result.logs]),
            });

            this.recorder.endSession(session.id, result.ok ? 'STOPPED' : 'ERROR', result.message ?? 'Simulation use case completed', result.ok ? null : result.message ?? null);

            return {
                ok: result.ok,
                status: result.ok ? 'SUCCESS' : 'WARNING',
                parsed: result.parsed,
                normalized: result.normalized,
                parsedId: result.parsedMessageId,
                normalizedId: result.normalizedResultId,
                normalizedResultId: result.normalizedResultId,
                payloadPreview: payload.slice(0, 300),
                parsedSummary: result.parsedSummary,
                logs: [...logs, ...result.logs],
            };
        } catch (error: any) {
            addLog('error', error?.message ?? 'Simulation use case failed');
            this.useCases.recordRun({
                machine_id: machineId,
                use_case_id: useCase.id,
                use_case_name: useCase.name,
                protocol: useCase.protocol,
                message_type: useCase.message_type,
                payload_preview: payload.slice(0, 300),
                result_status: 'FAILED',
                result_message: error?.message ?? 'Simulation use case failed',
                logs_json: safeJson(logs),
            });
            this.recorder.endSession(session.id, 'ERROR', 'Simulation use case failed', error?.message ?? null);
            throw error;
        }
    }

    replayTrafficLog(logId: string, mode: 'PARSE_ONLY' | 'PARSE_AND_NORMALIZE' | 'FULL_WORKFLOW' = 'FULL_WORKFLOW') {
        return this.trafficLogs.replay(logId, mode);
    }

    getState(machineId: string): MachineRuntimeState {
        return (
            this.states.get(machineId) ?? {
                machineId,
                status: 'disconnected',
                message: 'Not started',
                startedAt: null,
                updatedAt: nowIso(),
            }
        );
    }

    getStates(): MachineRuntimeState[] {
        return Array.from(this.states.values());
    }

    private setState(machineId: string, patch: Partial<MachineRuntimeState>) {
        const current = this.getState(machineId);
        const next: MachineRuntimeState = { ...current, ...patch, machineId, updatedAt: nowIso() };
        this.states.set(machineId, next);

        this.events.emit({
            type: 'state',
            machineId,
            status: next.status,
            message: next.message ?? null,
            updatedAt: next.updatedAt,
        });

        const machine: any = this.machinesService.list().find((m: any) => m.id === machineId);
        if (machine) {
            const sessionId = this.recorder.currentSessionId(machineId, null);
            this.trafficLogs.create({
                machine_id: machineId,
                session_id: sessionId,
                direction: 'system',
                transport: machine.connection_type ?? 'SYSTEM',
                protocol: machine.protocol ?? 'RAW',
                event_type: next.status === 'connected'
                    ? 'connected'
                    : next.status === 'stopped'
                        ? 'disconnected'
                        : next.status === 'error'
                            ? 'error'
                            : 'test',
                payload: next.message ?? null,
                payload_preview: next.message ?? null,
                processing_status: next.status?.toUpperCase?.() ?? null,
                processing_message: next.message ?? null,
            });
        }

        return next;
    }

    async startMachine(machineId: string) {
        const machine: any = this.machinesService.list().find((m: any) => m.id === machineId);
        if (!machine) throw new Error(`Machine not found: ${machineId}`);

        if (machine.is_active !== 1) {
            this.setState(machineId, { status: 'stopped', message: 'Machine is disabled' });
            return this.getState(machineId);
        }

        const liveSession = this.recorder.startSession({
            machineId,
            machineName: machine.name,
            mode: 'LIVE',
            transport: machine.connection_type,
            protocol: machine.protocol,
            message: `Starting ${machine.connection_type} runtime`,
        });

        this.setState(machineId, { status: 'connecting', message: `Starting ${machine.connection_type}...` });

        try {
            switch (machine.connection_type) {
                case 'TCP':
                case 'HL7_MLLP': {
                    if (!machine.host || !machine.port) throw new Error('Missing host/port');

                    const tcpSession = new TcpMachineService();
                    const tcpMode = machine.tcp_mode === 'CLIENT' ? 'CLIENT' : 'SERVER';
                    const listenHost = tcpMode === 'SERVER' ? (machine.host || '0.0.0.0') : machine.host;

                    tcpSession.start(
                        { host: listenHost, port: Number(machine.port), mode: tcpMode },
                        (msg: any) => {
                            const text = typeof msg.payload === 'string'
                                ? msg.payload
                                : Buffer.isBuffer(msg.payload)
                                    ? msg.payload.toString('utf8')
                                    : String(msg.payload);

                            const result = this.processIncomingPayload({
                                machineId,
                                machineName: machine.name,
                                raw: text,
                                protocol: machine.protocol,
                                transport: machine.connection_type,
                                mode: 'LIVE',
                                sessionId: liveSession.id,
                                meta: { tcpMode, remoteAddress: msg.remoteAddress ?? null, remotePort: msg.remotePort ?? null },
                            });

                            this.setState(machineId, {
                                status: 'connected',
                                message: result.message ?? `Received ${text.length} chars`,
                            });
                        },
                        (evt: any) => {
                            if (evt.status === 'error') {
                                this.recorder.endSession(liveSession.id, 'ERROR', evt.message, evt.message);
                                this.setState(machineId, { status: 'error', message: evt.message });
                                return;
                            }

                            this.setState(machineId, {
                                status: 'connected',
                                message: evt.message,
                                startedAt: this.getState(machineId).startedAt ?? nowIso(),
                            });
                        },
                    );

                    this.tcpSessions.set(machineId, tcpSession);
                    this.setState(machineId, {
                        status: 'connected',
                        message: tcpMode === 'SERVER'
                            ? `${machine.connection_type} server starting on ${listenHost}:${machine.port}`
                            : `${machine.connection_type} client connecting to ${machine.host}:${machine.port}`,
                        startedAt: nowIso(),
                    });
                    break;
                }

                case 'SERIAL': {
                    if (!machine.serial_port) throw new Error('Missing serial_port');

                    this.serial.connect(
                        { path: machine.serial_port, baudRate: Number(machine.baud_rate ?? 9600) },
                        (msg: any) => {
                            const text = typeof msg.payload === 'string'
                                ? msg.payload
                                : Buffer.isBuffer(msg.payload)
                                    ? msg.payload.toString('utf8')
                                    : String(msg.payload);

                            const result = this.processIncomingPayload({
                                machineId,
                                machineName: machine.name,
                                raw: text,
                                protocol: machine.protocol,
                                transport: machine.connection_type,
                                mode: 'LIVE',
                                sessionId: liveSession.id,
                                meta: { serialPort: machine.serial_port },
                            });

                            this.setState(machineId, {
                                status: 'connected',
                                message: result.message ?? `Received ${text.length} chars`,
                            });
                        },
                    );

                    this.serialSessions.set(machineId, true);
                    this.setState(machineId, {
                        status: 'connected',
                        message: `Serial connected: ${machine.serial_port}`,
                        startedAt: nowIso(),
                    });
                    break;
                }

                case 'FTP':
                case 'SFTP':
                    this.setState(machineId, { status: 'idle', message: `${machine.connection_type} runtime not yet started`, startedAt: nowIso() });
                    break;

                case 'FILE_WATCHER':
                    this.setState(machineId, { status: 'idle', message: 'Watching not yet started', startedAt: nowIso() });
                    break;

                default:
                    throw new Error(`Unsupported connection_type: ${machine.connection_type}`);
            }

            auditService.record({
                source: 'RUNTIME',
                category: 'RUNTIME',
                action: 'RUNTIME_STARTED',
                entityType: 'machine',
                entityId: machineId,
                entityLabel: machine.name,
                summary: `${machine.connection_type} runtime started`,
                details: { connection_type: machine.connection_type, protocol: machine.protocol, sessionId: liveSession.id },
            });
            return this.getState(machineId);
        } catch (error: any) {
            this.recorder.endSession(liveSession.id, 'ERROR', 'Start failed', error?.message ?? 'Start failed');
            this.setState(machineId, { status: 'error', message: error?.message ?? 'Start failed' });
            auditService.record({
                source: 'RUNTIME',
                category: 'RUNTIME',
                action: 'RUNTIME_START_FAILED',
                severity: 'ERROR',
                status: 'FAILED',
                entityType: 'machine',
                entityId: machineId,
                entityLabel: machine.name,
                summary: 'Runtime start failed',
                details: { error: error?.message ?? 'Start failed', sessionId: liveSession.id },
            });
            throw error;
        }
    }

    async stopMachine(machineId: string) {
        try {
            if (this.tcpSessions.has(machineId)) {
                const session = this.tcpSessions.get(machineId);
                if (session?.disconnect) await session.disconnect();
                this.tcpSessions.delete(machineId);
            }

            if (this.serialSessions.has(machineId)) {
                const session = this.serialSessions.get(machineId);
                if (session?.disconnect) await session.disconnect();
                else if (this.serial.disconnect) await this.serial.disconnect();
                this.serialSessions.delete(machineId);
            }

            this.setState(machineId, { status: 'stopped', message: 'Stopped by user' });
            this.recorder.endCurrent(machineId, 'LIVE', 'STOPPED', 'Stopped by user');
            auditService.record({
                source: 'RUNTIME',
                category: 'RUNTIME',
                action: 'RUNTIME_STOPPED',
                entityType: 'machine',
                entityId: machineId,
                summary: 'Runtime stopped by user',
            });
            return this.getState(machineId);
        } catch (error: any) {
            this.recorder.endCurrent(machineId, 'LIVE', 'ERROR', 'Stop failed', error?.message ?? 'Stop failed');
            this.setState(machineId, { status: 'error', message: error?.message ?? 'Stop failed' });
            auditService.record({
                source: 'RUNTIME',
                category: 'RUNTIME',
                action: 'RUNTIME_STOP_FAILED',
                severity: 'ERROR',
                status: 'FAILED',
                entityType: 'machine',
                entityId: machineId,
                summary: 'Runtime stop failed',
                details: { error: error?.message ?? 'Stop failed' },
            });
            throw error;
        }
    }

    async restartMachine(machineId: string) {
        auditService.record({
            source: 'RUNTIME',
            category: 'RUNTIME',
            action: 'RUNTIME_RESTART_REQUESTED',
            status: 'REQUESTED',
            entityType: 'machine',
            entityId: machineId,
            summary: 'Runtime restart requested',
        });
        await this.stopMachine(machineId);
        return this.startMachine(machineId);
    }

    async startAutoConnectMachines() {
        const machines: any[] = this.machinesService.list();
        const candidates = machines.filter((m) => m.is_active === 1 && m.auto_connect === 1);
        for (const machine of candidates) {
            try {
                await this.startMachine(machine.id);
            } catch {
                // keep going
            }
        }
    }

    private processIncomingPayload(input: ProcessPayloadInput) {
        const protocol = normalizeProtocol(input.protocol);
        const sessionId = input.sessionId ?? this.recorder.currentSessionId(input.machineId, input.mode) ?? null;
        const logs: Array<{ level: 'info' | 'warn' | 'error'; message: string; at: string }> = [];
        const addLog = (level: 'info' | 'warn' | 'error', message: string) => logs.push({ level, message, at: nowIso() });

        this.recorder.record({
            machineId: input.machineId,
            machineName: input.machineName ?? input.machineId,
            direction: 'inbound',
            payload: input.raw,
            meta: { ...(input.meta ?? {}), transport: input.transport, protocol, simulated: !!input.simulated },
        });

        const traffic = this.trafficLogs.create({
            machine_id: input.machineId,
            session_id: sessionId,
            direction: 'inbound',
            transport: input.transport,
            protocol,
            event_type: 'payload',
            payload: input.raw,
            payload_preview: input.raw.slice(0, 300),
            processing_status: 'RECEIVED',
            processing_message: `Received ${input.raw.length} chars`,
            meta_json: safeJson(input.meta ?? null),
        });

        try {
            const parsed = this.parsers.get(protocol).parse({
                machineId: input.machineId,
                protocol,
                raw: input.raw,
                timestamp: nowIso(),
            });

            if (!parsed) {
                addLog('warn', 'Parser returned no parsed message');
                this.trafficLogs.updateProcessing(traffic.id, {
                    processing_status: 'PARSE_EMPTY',
                    processing_message: 'Parser returned no parsed message',
                });
                this.events.emit({
                    type: 'traffic',
                    machineId: input.machineId,
                    direction: 'inbound',
                    payloadPreview: input.raw.slice(0, 160),
                    updatedAt: nowIso(),
                });
                return { ok: false, parsed: false, normalized: false, logId: traffic.id, message: 'Parser returned no parsed message', logs };
            }

            const parsedRow = this.parsedMessages.create(parsed);
            const parsedId = parsedRow.id;
            addLog('info', parsed.summary || `Parsed ${parsed.messageType}`);

            const normalized = this.normalizers.get(parsed.protocol).normalize(parsed);
            if (!normalized) {
                this.trafficLogs.updateProcessing(traffic.id, {
                    parsed_message_id: parsedId,
                    processing_status: 'PARSED',
                    processing_message: parsed.summary ?? 'Parsed successfully',
                });
                this.events.emit({
                    type: 'traffic',
                    machineId: input.machineId,
                    direction: 'inbound',
                    payloadPreview: parsed.summary || input.raw.slice(0, 160),
                    updatedAt: nowIso(),
                });
                return { ok: true, parsed: true, normalized: false, parsedMessageId: parsedId, parsedSummary: parsed.summary, logId: traffic.id, message: parsed.summary, logs };
            }

            const normalizedRow = this.normalizedResults.create(normalized);
            this.trafficLogs.updateProcessing(traffic.id, {
                parsed_message_id: parsedId,
                normalized_result_id: normalizedRow.id,
                processing_status: 'NORMALIZED',
                processing_message: normalized.summary ?? parsed.summary ?? 'Normalized successfully',
            });
            addLog('info', normalized.summary ?? 'Normalized successfully');

            this.events.emit({
                type: 'traffic',
                machineId: input.machineId,
                direction: 'inbound',
                payloadPreview: normalized.summary || parsed.summary || input.raw.slice(0, 160),
                updatedAt: nowIso(),
            });

            return {
                ok: true,
                parsed: true,
                normalized: true,
                parsedMessageId: parsedId,
                normalizedResultId: normalizedRow.id,
                parsedSummary: parsed.summary,
                logId: traffic.id,
                message: normalized.summary ?? parsed.summary,
                logs,
            };
        } catch (error: any) {
            addLog('error', error?.message ?? 'Processing failed');
            this.trafficLogs.updateProcessing(traffic.id, {
                processing_status: 'ERROR',
                processing_message: error?.message ?? 'Processing failed',
            });
            this.events.emit({
                type: 'traffic',
                machineId: input.machineId,
                direction: 'inbound',
                payloadPreview: error?.message ?? input.raw.slice(0, 160),
                updatedAt: nowIso(),
            });
            return { ok: false, parsed: false, normalized: false, logId: traffic.id, message: error?.message ?? 'Processing failed', logs };
        }
    }
}
