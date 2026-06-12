"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineSimulationManager = void 0;
const nowIso = () => new Date().toISOString();
function protocolForMachine(machine, scenario) {
    if (scenario.startsWith('HL7'))
        return 'HL7';
    if (scenario.startsWith('ASTM'))
        return 'ASTM';
    if (scenario === 'RAW_PING')
        return 'RAW';
    const raw = String(machine.protocol ?? '').toUpperCase();
    return raw === 'HL7' || raw === 'ASTM' || raw === 'RAW' ? raw : 'RAW';
}
function transportForMachine(machine) {
    return String(machine.connection_type ?? 'SIMULATION');
}
function scenarioPayload(machine, scenario) {
    const ts = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const sampleId = 'NPHL/22/0000027';
    switch (scenario) {
        case 'HL7_COBAS_HPV_FINAL_RESULT':
            return `MSH|^~\\&|COBAS6800/8800||LIS||${ts}||OUL^R22^OUL_R22|HPV-SIM-${Date.now()}|P|2.5||||||ASCII|||ROC-06^ROCHE\nPID|1||NPHL123^^^NPHL||KISILI^SEIF||19850101|M\nSPM|1|${sampleId}||RCCM^RocheCellCollectionMedia^99ROC|||||||P||||||||||||||||\nOBR|1|${sampleId}||71432-9^HPV-GT^LN|||||||A||||||||||||||F\nOBX|1|CE|HPV16^HPV16^99LIS||POS^Positive^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|${ts}\nOBX|2|CE|HPV18^HPV18^99LIS||NEG^Negative^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|${ts}\nOBX|3|CE|HRHPV^Hr-HPV^99LIS||INVALID^Invalid.^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|${ts}`;
        case 'HL7_ORU':
            return `MSH|^~\\&|SIMULATOR||LIS||${ts}||ORU^R01|ORU-SIM-${Date.now()}|P|2.5\nPID|1||PAT001^^^SIM||TEST^PATIENT||19850101|M\nOBR|1|SAMPLE-001||GLU^Glucose^99LIS|||||||||||||||||||F\nOBX|1|NM|GLU^Glucose^99LIS||5.6|mmol/L|3.9-6.1|N|||F||||||${ts}`;
        case 'ASTM_COBAS_HPV_FINAL_RESULT':
        case 'ASTM_BASIC':
            return `H|\\^&|||${machine.name ?? 'SIMULATOR'}|||||LIS||P|1|${ts}\nP|1||PAT001||TEST^PATIENT||19850101|M\nO|1|SAMPLE-001||^^^GLU|R||||||A||||1||||||||||F\nR|1|^^^GLU|5.6|mmol/L|3.9-6.1|N|F||||${ts}\nL|1|N`;
        case 'RAW_PING':
        default:
            return `PING|${machine.id}|${nowIso()}`;
    }
}
class MachineSimulationManager {
    emit;
    timers = new Map();
    states = new Map();
    constructor(emit) {
        this.emit = emit;
    }
    start(machine, scenario = 'ASTM_BASIC', intervalMs = 5000) {
        this.stop(machine.id);
        const safeInterval = Math.max(1000, Number(intervalMs || 5000));
        const emitOnce = () => this.emit({
            machineId: machine.id,
            machineName: machine.name ?? machine.id,
            raw: scenarioPayload(machine, scenario),
            protocol: protocolForMachine(machine, scenario),
            transport: transportForMachine(machine),
        });
        emitOnce();
        const timer = setInterval(emitOnce, safeInterval);
        this.timers.set(machine.id, timer);
        const state = { machineId: machine.id, running: true, scenario, intervalMs: safeInterval, updatedAt: nowIso() };
        this.states.set(machine.id, state);
        return state;
    }
    stop(machineId) {
        const timer = this.timers.get(machineId);
        if (timer)
            clearInterval(timer);
        this.timers.delete(machineId);
        const previous = this.states.get(machineId);
        const state = { machineId, running: false, scenario: previous?.scenario ?? null, intervalMs: previous?.intervalMs ?? null, updatedAt: nowIso() };
        this.states.set(machineId, state);
        return state;
    }
    restart(machine, scenario = 'ASTM_BASIC', intervalMs = 5000) {
        this.stop(machine.id);
        return this.start(machine, scenario, intervalMs);
    }
    getState(machineId) {
        return this.states.get(machineId) ?? { machineId, running: false, scenario: null, intervalMs: null, updatedAt: nowIso() };
    }
    getStates() {
        return Array.from(this.states.values());
    }
}
exports.MachineSimulationManager = MachineSimulationManager;
