import { SerialMachineService } from '../machines/serial.service';
import { TcpMachineService } from '../machines/tcp.service';
import { MachinesService } from '../services/machines.service';
import { RuntimeEventBus } from './runtime-event-bus';
import type { MachineRuntimeState } from './runtime.types';
import { SessionRecorderService } from './session-recorder.service';
import { MachineTrafficLogService } from './machine-traffic-log.service';
import { ParserRegistry } from '../protocols/parser-registry';
import { MachineSimulationManager } from './machine-simulation.manager';
import { ParsedMessageService } from '../protocols/parsed-message.service';
import { NormalizerRegistry } from '../normalizers/normalizer-registry';
import { NormalizedResultService } from '../normalizers/normalized-result.service';

const nowIso = () => new Date().toISOString();

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

    constructor() {
        this.parsedMessages.ensureTable();
        this.normalizedResults.ensureTable();
    }

    private simulator = new MachineSimulationManager(
        ({ machineId, machineName, raw, protocol, transport }) => {
            this.recorder.record({
                machineId,
                machineName,
                direction: 'inbound',
                payload: raw,
                meta: {
                    transport,
                    protocol,
                    simulated: true,
                },
            });

            this.trafficLogs.create({
                machine_id: machineId,
                direction: 'inbound',
                transport,
                protocol,
                event_type: 'payload',
                payload: raw,
                payload_preview: raw.slice(0, 300),
            });

            const parsed = this.parsers.get(protocol).parse({
                machineId,
                protocol,
                raw,
                timestamp: new Date().toISOString(),
            });

            if (parsed) {
                this.parsedMessages.create(parsed);

                const normalized = this.normalizers.get(parsed.protocol).normalize(parsed);
                if (normalized) {
                    // NormalizedResultService.create now advances workflow internally.
                    this.normalizedResults.create(normalized);
                }

                this.events.emit({
                    type: 'traffic',
                    machineId,
                    direction: 'inbound',
                    payloadPreview: parsed.summary || raw.slice(0, 160),
                    updatedAt: new Date().toISOString(),
                });
            } else {
                this.events.emit({
                    type: 'traffic',
                    machineId,
                    direction: 'inbound',
                    payloadPreview: raw.slice(0, 160),
                    updatedAt: new Date().toISOString(),
                });
            }
        },
    );

    startSimulation(
        machineId: string,
        scenario: 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING' = 'ASTM_BASIC',
        intervalMs = 5000,
    ) {
        const machine: any = this.machinesService.list().find((m: any) => m.id === machineId);

        if (!machine) {
            throw new Error(`Machine not found: ${machineId}`);
        }

        return this.simulator.start(machine, scenario, intervalMs);
    }

    stopSimulation(machineId: string) {
        return this.simulator.stop(machineId);
    }

    restartSimulation(
        machineId: string,
        scenario: 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING' = 'ASTM_BASIC',
        intervalMs = 5000,
    ) {
        const machine: any = this.machinesService.list().find((m: any) => m.id === machineId);

        if (!machine) {
            throw new Error(`Machine not found: ${machineId}`);
        }

        return this.simulator.restart(machine, scenario, intervalMs);
    }

    getSimulationState(machineId: string) {
        return this.simulator.getState(machineId);
    }

    getSimulationStates() {
        return this.simulator.getStates();
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
        const next: MachineRuntimeState = {
            ...current,
            ...patch,
            machineId,
            updatedAt: nowIso(),
        };
        this.states.set(machineId, next);

        this.events.emit({
            type: 'state',
            machineId,
            status: next.status,
            message: next.message ?? null,
            updatedAt: next.updatedAt,
        });

        const currentMachine: any = this.machinesService.list().find((m: any) => m.id === machineId);

        if (currentMachine) {
            this.trafficLogs.create({
                machine_id: machineId,
                direction: 'system',
                transport: currentMachine.connection_type,
                protocol: currentMachine.protocol,
                event_type:
                    next.status === 'connected'
                        ? 'connected'
                        : next.status === 'stopped'
                            ? 'disconnected'
                            : next.status === 'error'
                                ? 'error'
                                : 'test',
                payload: next.message ?? null,
                payload_preview: next.message ?? null,
            });
        }

        return next;
    }

    async startMachine(machineId: string) {
        const machine: any = this.machinesService.list().find((m: any) => m.id === machineId);

        if (!machine) {
            throw new Error(`Machine not found: ${machineId}`);
        }

        if (machine.is_active !== 1) {
            this.setState(machineId, {
                status: 'stopped',
                message: 'Machine is disabled',
            });
            return this.getState(machineId);
        }

        this.setState(machineId, {
            status: 'connecting',
            message: `Starting ${machine.connection_type}...`,
        });

        try {
            switch (machine.connection_type) {
                case 'TCP':
                case 'HL7_MLLP': {
                    if (!machine.host || !machine.port) {
                        throw new Error('Missing host/port');
                    }

                    const tcpSession = new TcpMachineService();
                    const tcpMode = machine.tcp_mode === 'CLIENT' ? 'CLIENT' : 'SERVER';
                    const listenHost = tcpMode === 'SERVER' ? (machine.host || '0.0.0.0') : machine.host;

                    tcpSession.start(
                        {
                            host: listenHost,
                            port: Number(machine.port),
                            mode: tcpMode,
                        },
                        (msg: any) => {
                            const text =
                                typeof msg.payload === 'string'
                                    ? msg.payload
                                    : Buffer.isBuffer(msg.payload)
                                        ? msg.payload.toString('utf8')
                                        : String(msg.payload);

                            this.recorder.record({
                                machineId,
                                machineName: machine.name,
                                direction: 'inbound',
                                payload: text,
                                meta: {
                                    transport: machine.connection_type,
                                    protocol: machine.protocol,
                                    tcpMode,
                                    remoteAddress: msg.remoteAddress ?? null,
                                    remotePort: msg.remotePort ?? null,
                                },
                            });

                            this.trafficLogs.create({
                                machine_id: machineId,
                                direction: 'inbound',
                                transport: machine.connection_type,
                                protocol: machine.protocol,
                                event_type: 'payload',
                                payload: text,
                                payload_preview: text.slice(0, 300),
                            });

                            const parser = this.parsers.get(machine.protocol);
                            const parsed = parser.parse({
                                machineId,
                                protocol: machine.protocol,
                                raw: text,
                                timestamp: new Date().toISOString(),
                            });

                            if (parsed) {
                                this.parsedMessages.create(parsed);

                                const normalized = this.normalizers.get(parsed.protocol).normalize(parsed);
                                if (normalized) {
                                    this.normalizedResults.create(normalized);
                                }

                                this.events.emit({
                                    type: 'traffic',
                                    machineId,
                                    direction: 'inbound',
                                    payloadPreview: parsed.summary || text.slice(0, 160),
                                    updatedAt: new Date().toISOString(),
                                });
                            } else {
                                this.events.emit({
                                    type: 'traffic',
                                    machineId,
                                    direction: 'inbound',
                                    payloadPreview: text.slice(0, 160),
                                    updatedAt: new Date().toISOString(),
                                });
                            }

                            this.setState(machineId, {
                                status: 'connected',
                                message: `Received ${text.length} chars`,
                            });
                        },
                        (evt: any) => {
                            if (evt.status === 'error') {
                                this.setState(machineId, {
                                    status: 'error',
                                    message: evt.message,
                                });
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
                    if (!machine.serial_port) {
                        throw new Error('Missing serial_port');
                    }

                    this.serial.connect(
                        {
                            path: machine.serial_port,
                            baudRate: Number(machine.baud_rate ?? 9600),
                        },
                        (msg: any) => {
                            const text =
                                typeof msg.payload === 'string'
                                    ? msg.payload
                                    : Buffer.isBuffer(msg.payload)
                                        ? msg.payload.toString('utf8')
                                        : String(msg.payload);

                            this.recorder.record({
                                machineId,
                                machineName: machine.name,
                                direction: 'inbound',
                                payload: text,
                                meta: {
                                    transport: machine.connection_type,
                                    protocol: machine.protocol,
                                },
                            });

                            this.trafficLogs.create({
                                machine_id: machineId,
                                direction: 'inbound',
                                transport: machine.connection_type,
                                protocol: machine.protocol,
                                event_type: 'payload',
                                payload: text,
                                payload_preview: text.slice(0, 300),
                            });

                            const parser = this.parsers.get(machine.protocol);
                            const parsed = parser.parse({
                                machineId,
                                protocol: machine.protocol,
                                raw: text,
                                timestamp: new Date().toISOString(),
                            });

                            if (parsed) {
                                this.parsedMessages.create(parsed);

                                const normalized = this.normalizers.get(parsed.protocol).normalize(parsed);
                                if (normalized) {
                                    this.normalizedResults.create(normalized);
                                }

                                this.events.emit({
                                    type: 'traffic',
                                    machineId,
                                    direction: 'inbound',
                                    payloadPreview: parsed.summary || text.slice(0, 160),
                                    updatedAt: new Date().toISOString(),
                                });
                            }

                            this.setState(machineId, {
                                status: 'connected',
                                message: `Received ${text.length} chars`,
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
                case 'SFTP': {
                    this.setState(machineId, {
                        status: 'idle',
                        message: `${machine.connection_type} runtime not yet started`,
                        startedAt: nowIso(),
                    });
                    break;
                }

                case 'FILE_WATCHER': {
                    this.setState(machineId, {
                        status: 'idle',
                        message: `Watching not yet started`,
                        startedAt: nowIso(),
                    });
                    break;
                }

                default:
                    throw new Error(`Unsupported connection_type: ${machine.connection_type}`);
            }

            return this.getState(machineId);
        } catch (error: any) {
            this.setState(machineId, {
                status: 'error',
                message: error?.message ?? 'Start failed',
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

            this.setState(machineId, {
                status: 'stopped',
                message: 'Stopped by user',
            });

            return this.getState(machineId);
        } catch (error: any) {
            this.setState(machineId, {
                status: 'error',
                message: error?.message ?? 'Stop failed',
            });
            throw error;
        }
    }

    async restartMachine(machineId: string) {
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
}
