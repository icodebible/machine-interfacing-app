"use strict";
// const nowIso = () => new Date().toISOString();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MachineSimulationManager = void 0;
// export type MachineSimulationScenario =
//     | 'ASTM_BASIC'
//     | 'HL7_ORU'
//     | 'RAW_PING';
// export type MachineSimulationState = {
//     machineId: string;
//     running: boolean;
//     scenario?: MachineSimulationScenario | null;
//     intervalMs?: number | null;
//     updatedAt: string;
// };
// export class MachineSimulationManager {
//     private timers = new Map<string, NodeJS.Timeout>();
//     private states = new Map<string, MachineSimulationState>();
//     constructor(
//         private onEmit: (args: {
//             machineId: string;
//             machineName?: string | null;
//             raw: string;
//             protocol: 'ASTM' | 'HL7' | 'RAW';
//             transport: 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FILE_WATCHER';
//         }) => void,
//     ) { }
//     getState(machineId: string): MachineSimulationState {
//         return (
//             this.states.get(machineId) ?? {
//                 machineId,
//                 running: false,
//                 scenario: null,
//                 intervalMs: null,
//                 updatedAt: nowIso(),
//             }
//         );
//     }
//     getStates(): MachineSimulationState[] {
//         return Array.from(this.states.values());
//     }
//     private setState(machineId: string, patch: Partial<MachineSimulationState>) {
//         const next: MachineSimulationState = {
//             ...this.getState(machineId),
//             ...patch,
//             machineId,
//             updatedAt: nowIso(),
//         };
//         this.states.set(machineId, next);
//         return next;
//     }
//     start(machine: any, scenario: MachineSimulationScenario = 'ASTM_BASIC', intervalMs = 5000) {
//         this.stop(machine.id);
//         const tick = () => {
//             const payload = this.buildPayload(machine, scenario);
//             this.onEmit({
//                 machineId: machine.id,
//                 machineName: machine.name,
//                 raw: payload.raw,
//                 protocol: payload.protocol,
//                 transport: payload.transport,
//             });
//         };
//         const timer = setInterval(tick, intervalMs);
//         this.timers.set(machine.id, timer);
//         // emit immediately once
//         tick();
//         return this.setState(machine.id, {
//             running: true,
//             scenario,
//             intervalMs,
//         });
//     }
//     stop(machineId: string) {
//         const timer = this.timers.get(machineId);
//         if (timer) {
//             clearInterval(timer);
//             this.timers.delete(machineId);
//         }
//         return this.setState(machineId, {
//             running: false,
//         });
//     }
//     restart(machine: any, scenario: MachineSimulationScenario = 'ASTM_BASIC', intervalMs = 5000) {
//         this.stop(machine.id);
//         return this.start(machine, scenario, intervalMs);
//     }
//     private buildPayload(machine: any, scenario: MachineSimulationScenario) {
//         switch (scenario) {
//             case 'HL7_ORU':
//                 return {
//                     protocol: 'HL7' as const,
//                     transport:
//                         machine.connection_type === 'HL7_MLLP'
//                             ? ('HL7_MLLP' as const)
//                             : ('TCP' as const),
//                     raw:
//                         'MSH|^~\\&|SIM|LAB|LIS|HOSP|202603141200||ORU^R01|123|P|2.3\r' +
//                         'PID|1||12345||DOE^JOHN\r' +
//                         'OBR|1||12345|GLU\r' +
//                         'OBX|1|NM|GLU||5.8|mmol/L\r',
//                 };
//             case 'RAW_PING':
//                 return {
//                     protocol: 'RAW' as const,
//                     transport: 'TCP' as const,
//                     raw: `PING ${new Date().toISOString()}`,
//                 };
//             case 'ASTM_BASIC':
//             default:
//                 return {
//                     protocol: 'ASTM' as const,
//                     transport:
//                         machine.connection_type === 'SERIAL'
//                             ? ('SERIAL' as const)
//                             : ('TCP' as const),
//                     raw:
//                         'H|\\^&|||SIMULATOR|||||||P|1\r' +
//                         'P|1\r' +
//                         'O|1|SAMPLE123||^^^GLU\r' +
//                         'R|1|^^^GLU|5.8|mmol/L\r' +
//                         'L|1|N\r',
//                 };
//         }
//     }
// }
// const nowIso = () => new Date().toISOString();
// export type MachineSimulationScenario =
//     | 'ASTM_BASIC'
//     | 'HL7_ORU'
//     | 'HL7_COBAS_HPV_FINAL_RESULT'
//     | 'RAW_PING';
// export type MachineSimulationState = {
//     machineId: string;
//     running: boolean;
//     scenario?: MachineSimulationScenario | null;
//     intervalMs?: number | null;
//     updatedAt: string;
// };
// export class MachineSimulationManager {
//     private timers = new Map<string, NodeJS.Timeout>();
//     private states = new Map<string, MachineSimulationState>();
//     constructor(
//         private onEmit: (args: {
//             machineId: string;
//             machineName?: string | null;
//             raw: string;
//             protocol: 'ASTM' | 'HL7' | 'RAW';
//             transport: 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FILE_WATCHER';
//         }) => void,
//     ) { }
//     getState(machineId: string): MachineSimulationState {
//         return (
//             this.states.get(machineId) ?? {
//                 machineId,
//                 running: false,
//                 scenario: null,
//                 intervalMs: null,
//                 updatedAt: nowIso(),
//             }
//         );
//     }
//     getStates(): MachineSimulationState[] {
//         return Array.from(this.states.values());
//     }
//     private setState(machineId: string, patch: Partial<MachineSimulationState>) {
//         const next: MachineSimulationState = {
//             ...this.getState(machineId),
//             ...patch,
//             machineId,
//             updatedAt: nowIso(),
//         };
//         this.states.set(machineId, next);
//         return next;
//     }
//     start(machine: any, scenario?: MachineSimulationScenario, intervalMs = 5000) {
//         this.stop(machine.id);
//         const selectedScenario = scenario ?? this.defaultScenarioForMachine(machine);
//         const tick = () => {
//             const payload = this.buildPayload(machine, selectedScenario);
//             this.onEmit({
//                 machineId: machine.id,
//                 machineName: machine.name,
//                 raw: payload.raw,
//                 protocol: payload.protocol,
//                 transport: payload.transport,
//             });
//         };
//         const timer = setInterval(tick, intervalMs);
//         this.timers.set(machine.id, timer);
//         // Emit immediately once so users can see the parsed/normalized result without waiting.
//         tick();
//         return this.setState(machine.id, {
//             running: true,
//             scenario: selectedScenario,
//             intervalMs,
//         });
//     }
//     stop(machineId: string) {
//         const timer = this.timers.get(machineId);
//         if (timer) {
//             clearInterval(timer);
//             this.timers.delete(machineId);
//         }
//         return this.setState(machineId, {
//             running: false,
//         });
//     }
//     restart(machine: any, scenario?: MachineSimulationScenario, intervalMs = 5000) {
//         this.stop(machine.id);
//         return this.start(machine, scenario, intervalMs);
//     }
//     private defaultScenarioForMachine(machine: any): MachineSimulationScenario {
//         const protocol = String(machine?.protocol ?? '').toUpperCase();
//         const connectionType = String(machine?.connection_type ?? '').toUpperCase();
//         if (protocol === 'HL7' || connectionType === 'HL7_MLLP') return 'HL7_COBAS_HPV_FINAL_RESULT';
//         if (protocol === 'RAW') return 'RAW_PING';
//         return 'ASTM_BASIC';
//     }
//     private hl7TransportForMachine(machine: any) {
//         return machine?.connection_type === 'HL7_MLLP' ? ('HL7_MLLP' as const) : ('TCP' as const);
//     }
//     private buildPayload(machine: any, scenario: MachineSimulationScenario) {
//         switch (scenario) {
//             case 'HL7_COBAS_HPV_FINAL_RESULT':
//                 return {
//                     protocol: 'HL7' as const,
//                     transport: this.hl7TransportForMachine(machine),
//                     raw: this.buildCobasHpvFinalResultPayload(),
//                 };
//             case 'HL7_ORU':
//                 return {
//                     protocol: 'HL7' as const,
//                     transport: this.hl7TransportForMachine(machine),
//                     raw:
//                         'MSH|^~\\&|SIM|LAB|LIS|HOSP|202603141200||ORU^R01|123|P|2.3\r' +
//                         'PID|1||12345||DOE^JOHN\r' +
//                         'OBR|1||12345|GLU^Glucose\r' +
//                         'OBX|1|NM|GLU^Glucose||5.8|mmol/L|||N|||F\r',
//                 };
//             case 'RAW_PING':
//                 return {
//                     protocol: 'RAW' as const,
//                     transport: 'TCP' as const,
//                     raw: `PING ${new Date().toISOString()}`,
//                 };
//             case 'ASTM_BASIC':
//                 return {
//                     protocol: 'ASTM' as const,
//                     transport: machine.connection_type === 'SERIAL' ? ('SERIAL' as const) : ('TCP' as const),
//                     raw:
//                         'H|\\^&|||SIMULATOR|||||||P|1\r' +
//                         'P|1\r' +
//                         'O|1|SAMPLE123||^^^GLU\r' +
//                         'R|1|^^^GLU|5.8|mmol/L\r' +
//                         'L|1|N\r',
//                 };
//             default: {
//                 const exhaustive: never = scenario;
//                 throw new Error(`Unsupported simulation scenario: ${exhaustive}`);
//             }
//         }
//     }
//     private buildCobasHpvFinalResultPayload() {
//         const resultTime = '20260520143000';
//         const sampleLabel = 'NPHL/22/0000027';
//         const patientId = 'NPHL123';
//         const orderNumber = 'ORD-124921';
//         return [
//             `MSH|^~\\&|COBAS6800/8800|NPHL|LIS|OpenMRS|${resultTime}||OUL^R22^OUL_R22|SIM-COBAS-HPV-0001|P|2.5`,
//             `PID|1||${patientId}^^^LIS^PI||KISILI^SEIF^^^^^L||19800101|M`,
//             `SPM|1|${sampleLabel}||RCCM^RocheCellCollectionMedia^99ROC|||||||P||||||||||||||20260520110542`,
//             `ORC|RE|${orderNumber}^LIS|${orderNumber}^COBAS|||||||||||||||||||||F`,
//             `OBR|1|${orderNumber}^LIS|${orderNumber}^COBAS|71432-9^HPV-GT^LN|||||||||||||||||||||F`,
//             'OBX|1|CWE|HPV16^HPV16^99ROC||POS^Positive^99ROC||||||F|||||AUTO||C6800/8800^Roche COBAS 6800/8800^^~ID_000000000012076380^IM300-001794^^|20260520143000',
//             'OBX|2|CWE|HPV18^HPV18^99ROC||NEG^Negative^99ROC||||||F|||||AUTO||C6800/8800^Roche COBAS 6800/8800^^~ID_000000000012076380^IM300-001794^^|20260520143000',
//             'OBX|3|CWE|Hr-HPV^Other High Risk HPV^99ROC||POS^Positive^99ROC||||||F|||||AUTO||C6800/8800^Roche COBAS 6800/8800^^~ID_000000000012076380^IM300-001794^^|20260520143000',
//             'OBX|4|CWE|PROCESS_STEP^^99ROC||RESULT_RELEASED^^99ROC||||||F|||||AUTO||C6800/8800^Roche COBAS 6800/8800^^~ID_000000000012076380^IM300-001794^^|20260520143000',
//         ].join('\r');
//     }
// }
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
            case 'HL7_COBAS_HPV_FINAL_RESULT':
                return {
                    protocol: 'HL7',
                    transport: machine.connection_type === 'HL7_MLLP'
                        ? 'HL7_MLLP'
                        : 'TCP',
                    raw: buildCobasHpvFinalHl7Message(),
                };
            case 'ASTM_COBAS_HPV_FINAL_RESULT':
                return {
                    protocol: 'ASTM',
                    transport: machine.connection_type === 'SERIAL'
                        ? 'SERIAL'
                        : 'TCP',
                    raw: buildCobasHpvFinalAstmMessage(),
                };
            case 'HL7_ORU':
                return {
                    protocol: 'HL7',
                    transport: machine.connection_type === 'HL7_MLLP'
                        ? 'HL7_MLLP'
                        : 'TCP',
                    raw: 'MSH|^~\\&|SIM|LAB|LIS|HOSP|20260314120000||ORU^R01|123|P|2.3\r' +
                        'PID|1||12345||DOE^JOHN\r' +
                        'SPM|1|SAMPLE123||SER^Serum\r' +
                        'OBR|1||SAMPLE123|GLU^Glucose\r' +
                        'OBX|1|NM|GLU^Glucose||5.8|mmol/L||N|||F|||||||SIMULATOR|20260314120500\r',
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
                    raw: 'H|\\^&|||SIMULATOR|||||||P|1|20260314120000\r' +
                        'P|1||12345||DOE^JOHN\r' +
                        'O|1|SAMPLE123||^^^GLU^Glucose\r' +
                        'R|1|^^^GLU^Glucose|5.8|mmol/L||N||F||||20260314120500\r' +
                        'L|1|N\r',
                };
        }
    }
}
exports.MachineSimulationManager = MachineSimulationManager;
function buildCobasHpvFinalHl7Message() {
    return ('\x0b' +
        'MSH|^~\\&|COBAS6800/8800||LIS||20260520123045||OUL^R22^OUL_R22|HPV-SIM-0001|P|2.5||||||ASCII|||ROC-06^ROCHE\r' +
        'PID|1||NPHL123^^^NPHL||KISILI^SEIF||19850101|M\r' +
        'SPM|1|NPHL/22/0000027||RCCM^RocheCellCollectionMedia^99ROC|||||||P||||||||||||||||\r' +
        'OBR|1|NPHL/22/0000027||71432-9^HPV-GT^LN|||||||A||||||||||||||F\r' +
        'OBX|1|CE|HPV16^HPV16^99LIS||POS^Positive^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|20260520122500\r' +
        'OBX|2|CE|HPV18^HPV18^99LIS||NEG^Negative^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|20260520122500\r' +
        'OBX|3|CE|HRHPV^Hr-HPV^99LIS||INVALID^Invalid.^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|20260520122500\r' +
        '\x1c\r');
}
function buildCobasHpvFinalAstmMessage() {
    return ('H|\\^&|||COBAS6800/8800|||||||P|1|20260520123045\r' +
        'P|1||NPHL123||KISILI^SEIF||19850101|M\r' +
        'O|1|NPHL/22/0000027||^^^71432-9^HPV-GT\r' +
        'R|1|^^^HPV16^HPV16|POS|||||F||||20260520122500\r' +
        'R|2|^^^HPV18^HPV18|NEG|||||F||||20260520122500\r' +
        'R|3|^^^HRHPV^Hr-HPV|INVALID|||||F||||20260520122500\r' +
        'L|1|N\r');
}
