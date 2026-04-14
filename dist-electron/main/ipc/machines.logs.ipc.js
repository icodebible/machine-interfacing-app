"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMachinesLogsIpc = registerMachinesLogsIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const machine_traffic_log_service_1 = require("../runtime/machine-traffic-log.service");
const svc = new machine_traffic_log_service_1.MachineTrafficLogService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerMachinesLogsIpc() {
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_LOGS_LIST, (_e, machineId, limit) => svc.listByMachine(machineId, limit ?? 50));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_LOGS_CLEAR, (_e, machineId) => svc.clearMachineLogs(machineId));
}
