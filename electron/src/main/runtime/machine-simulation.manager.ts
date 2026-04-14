const nowIso = () => new Date().toISOString();

export type MachineSimulationScenario =
    | 'ASTM_BASIC'
    | 'HL7_ORU'
    | 'RAW_PING';

export type MachineSimulationState = {
    machineId: string;
    running: boolean;
    scenario?: MachineSimulationScenario | null;
    intervalMs?: number | null;
    updatedAt: string;
};

export class MachineSimulationManager {
    private timers = new Map<string, NodeJS.Timeout>();
    private states = new Map<string, MachineSimulationState>();

    constructor(
        private onEmit: (args: {
            machineId: string;
            machineName?: string | null;
            raw: string;
            protocol: 'ASTM' | 'HL7' | 'RAW';
            transport: 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FILE_WATCHER';
        }) => void,
    ) { }

    getState(machineId: string): MachineSimulationState {
        return (
            this.states.get(machineId) ?? {
                machineId,
                running: false,
                scenario: null,
                intervalMs: null,
                updatedAt: nowIso(),
            }
        );
    }

    getStates(): MachineSimulationState[] {
        return Array.from(this.states.values());
    }

    private setState(machineId: string, patch: Partial<MachineSimulationState>) {
        const next: MachineSimulationState = {
            ...this.getState(machineId),
            ...patch,
            machineId,
            updatedAt: nowIso(),
        };
        this.states.set(machineId, next);
        return next;
    }

    start(machine: any, scenario: MachineSimulationScenario = 'ASTM_BASIC', intervalMs = 5000) {
        this.stop(machine.id);

        const tick = () => {
            const payload = this.buildPayload(machine, scenario);

            this.onEmit({
                machineId: machine.id,
                machineName: machine.name,
                raw: payload.raw,
                protocol: payload.protocol,
                transport: payload.transport,
            });
        };

        const timer = setInterval(tick, intervalMs);
        this.timers.set(machine.id, timer);

        // emit immediately once
        tick();

        return this.setState(machine.id, {
            running: true,
            scenario,
            intervalMs,
        });
    }

    stop(machineId: string) {
        const timer = this.timers.get(machineId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(machineId);
        }

        return this.setState(machineId, {
            running: false,
        });
    }

    restart(machine: any, scenario: MachineSimulationScenario = 'ASTM_BASIC', intervalMs = 5000) {
        this.stop(machine.id);
        return this.start(machine, scenario, intervalMs);
    }

    private buildPayload(machine: any, scenario: MachineSimulationScenario) {
        switch (scenario) {
            case 'HL7_ORU':
                return {
                    protocol: 'HL7' as const,
                    transport:
                        machine.connection_type === 'HL7_MLLP'
                            ? ('HL7_MLLP' as const)
                            : ('TCP' as const),
                    raw:
                        'MSH|^~\\&|SIM|LAB|LIS|HOSP|202603141200||ORU^R01|123|P|2.3\r' +
                        'PID|1||12345||DOE^JOHN\r' +
                        'OBR|1||12345|GLU\r' +
                        'OBX|1|NM|GLU||5.8|mmol/L\r',
                };

            case 'RAW_PING':
                return {
                    protocol: 'RAW' as const,
                    transport: 'TCP' as const,
                    raw: `PING ${new Date().toISOString()}`,
                };

            case 'ASTM_BASIC':
            default:
                return {
                    protocol: 'ASTM' as const,
                    transport:
                        machine.connection_type === 'SERIAL'
                            ? ('SERIAL' as const)
                            : ('TCP' as const),
                    raw:
                        'H|\\^&|||SIMULATOR|||||||P|1\r' +
                        'P|1\r' +
                        'O|1|SAMPLE123||^^^GLU\r' +
                        'R|1|^^^GLU|5.8|mmol/L\r' +
                        'L|1|N\r',
                };
        }
    }
}