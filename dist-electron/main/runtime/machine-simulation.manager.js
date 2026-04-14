"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineSimulationManager = void 0;
const nowIso = () => new Date().toISOString();
class MachineSimulationManager {
    onEmit;
    timers = new Map();
    states = new Map();
    constructor(onEmit) {
        this.onEmit = onEmit;
    }
    getState(machineId) {
        return (this.states.get(machineId) ?? {
            machineId,
            running: false,
            scenario: null,
            intervalMs: null,
            updatedAt: nowIso(),
        });
    }
    getStates() {
        return Array.from(this.states.values());
    }
    setState(machineId, patch) {
        const next = {
            ...this.getState(machineId),
            ...patch,
            machineId,
            updatedAt: nowIso(),
        };
        this.states.set(machineId, next);
        return next;
    }
    start(machine, scenario = 'ASTM_BASIC', intervalMs = 5000) {
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
    stop(machineId) {
        const timer = this.timers.get(machineId);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(machineId);
        }
        return this.setState(machineId, {
            running: false,
        });
    }
    restart(machine, scenario = 'ASTM_BASIC', intervalMs = 5000) {
        this.stop(machine.id);
        return this.start(machine, scenario, intervalMs);
    }
    buildPayload(machine, scenario) {
        switch (scenario) {
            case 'HL7_ORU':
                return {
                    protocol: 'HL7',
                    transport: machine.connection_type === 'HL7_MLLP'
                        ? 'HL7_MLLP'
                        : 'TCP',
                    raw: 'MSH|^~\\&|SIM|LAB|LIS|HOSP|202603141200||ORU^R01|123|P|2.3\r' +
                        'PID|1||12345||DOE^JOHN\r' +
                        'OBR|1||12345|GLU\r' +
                        'OBX|1|NM|GLU||5.8|mmol/L\r',
                };
            case 'RAW_PING':
                return {
                    protocol: 'RAW',
                    transport: 'TCP',
                    raw: `PING ${new Date().toISOString()}`,
                };
            case 'ASTM_BASIC':
            default:
                return {
                    protocol: 'ASTM',
                    transport: machine.connection_type === 'SERIAL'
                        ? 'SERIAL'
                        : 'TCP',
                    raw: 'H|\\^&|||SIMULATOR|||||||P|1\r' +
                        'P|1\r' +
                        'O|1|SAMPLE123||^^^GLU\r' +
                        'R|1|^^^GLU|5.8|mmol/L\r' +
                        'L|1|N\r',
                };
        }
    }
}
exports.MachineSimulationManager = MachineSimulationManager;
