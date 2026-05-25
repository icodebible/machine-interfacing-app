"use strict";
// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { MachineRuntimeManager } from '../runtime/machine-runtime.manager';
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMachinesSimulationIpc = registerMachinesSimulationIpc;
// const safeHandle = (channel: string, handler: any) => {
//     ipcMain.removeHandler(channel);
//     ipcMain.handle(channel, handler);
// };
// export function registerMachinesSimulationIpc(runtime: MachineRuntimeManager) {
//     safeHandle(
//         IPC_CHANNELS.MACHINES_SIM_START,
//         (
//             _e: any,
//             machineId: string,
//             scenario: 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING' = 'ASTM_BASIC',
//             intervalMs = 5000,
//         ) => runtime.startSimulation(machineId, scenario, intervalMs),
//     );
//     safeHandle(IPC_CHANNELS.MACHINES_SIM_STOP, (_e: any, machineId: string) =>
//         runtime.stopSimulation(machineId),
//     );
//     safeHandle(
//         IPC_CHANNELS.MACHINES_SIM_RESTART,
//         (
//             _e: any,
//             machineId: string,
//             scenario: 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING' = 'ASTM_BASIC',
//             intervalMs = 5000,
//         ) => runtime.restartSimulation(machineId, scenario, intervalMs),
//     );
//     safeHandle(IPC_CHANNELS.MACHINES_SIM_STATE, (_e: any, machineId: string) =>
//         runtime.getSimulationState(machineId),
//     );
//     safeHandle(IPC_CHANNELS.MACHINES_SIM_STATES, () => runtime.getSimulationStates());
// }
// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { MachineRuntimeManager } from '../runtime/machine-runtime.manager';
// import { MachineSimulationScenario } from '../runtime/machine-simulation.manager';
// const safeHandle = (channel: string, handler: any) => {
//     ipcMain.removeHandler(channel);
//     ipcMain.handle(channel, handler);
// };
// export function registerMachinesSimulationIpc(runtime: MachineRuntimeManager) {
//     safeHandle(
//         IPC_CHANNELS.MACHINES_SIM_START,
//         (_e: any, machineId: string, scenario?: MachineSimulationScenario, intervalMs = 5000) =>
//             runtime.startSimulation(machineId, scenario, intervalMs),
//     );
//     safeHandle(IPC_CHANNELS.MACHINES_SIM_STOP, (_e: any, machineId: string) =>
//         runtime.stopSimulation(machineId),
//     );
//     safeHandle(
//         IPC_CHANNELS.MACHINES_SIM_RESTART,
//         (_e: any, machineId: string, scenario?: MachineSimulationScenario, intervalMs = 5000) =>
//             runtime.restartSimulation(machineId, scenario, intervalMs),
//     );
//     safeHandle(IPC_CHANNELS.MACHINES_SIM_STATE, (_e: any, machineId: string) =>
//         runtime.getSimulationState(machineId),
//     );
//     safeHandle(IPC_CHANNELS.MACHINES_SIM_STATES, () => runtime.getSimulationStates());
// }
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerMachinesSimulationIpc(runtime) {
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_START, (_e, machineId, scenario = 'ASTM_BASIC', intervalMs = 5000) => runtime.startSimulation(machineId, scenario, intervalMs));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_STOP, (_e, machineId) => runtime.stopSimulation(machineId));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_RESTART, (_e, machineId, scenario = 'ASTM_BASIC', intervalMs = 5000) => runtime.restartSimulation(machineId, scenario, intervalMs));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_STATE, (_e, machineId) => runtime.getSimulationState(machineId));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_STATES, () => runtime.getSimulationStates());
}
