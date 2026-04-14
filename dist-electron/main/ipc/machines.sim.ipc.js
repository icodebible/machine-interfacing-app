"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMachinesSimulationIpc = registerMachinesSimulationIpc;
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
