"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMachinesRuntimeIpc = registerMachinesRuntimeIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const machine_runtime_manager_1 = require("../runtime/machine-runtime.manager");
const runtime = new machine_runtime_manager_1.MachineRuntimeManager();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerMachinesRuntimeIpc() {
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_RUNTIME_START, (_e, machineId) => runtime.startMachine(machineId));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_RUNTIME_STOP, (_e, machineId) => runtime.stopMachine(machineId));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_RUNTIME_RESTART, (_e, machineId) => runtime.restartMachine(machineId));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_RUNTIME_STATE, (_e, machineId) => runtime.getState(machineId));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_RUNTIME_STATES, () => runtime.getStates());
    return runtime;
}
