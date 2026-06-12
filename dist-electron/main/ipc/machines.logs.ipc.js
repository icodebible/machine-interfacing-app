"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMachinesLogsIpc = registerMachinesLogsIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const machine_traffic_log_service_1 = require("../runtime/machine-traffic-log.service");
const session_recorder_service_1 = require("../runtime/session-recorder.service");
const logs = new machine_traffic_log_service_1.MachineTrafficLogService();
const sessions = new session_recorder_service_1.SessionRecorderService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerMachinesLogsIpc() {
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_LOGS_LIST, (_e, machineId, limit) => logs.listByMachine(machineId, limit ?? 50));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_LOGS_CLEAR, (_e, machineId) => logs.clearMachineLogs(machineId));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_LOGS_REPLAY, (_e, logId, mode) => logs.replay(logId, mode ?? 'FULL_WORKFLOW'));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SESSIONS_LIST, (_e, machineId, limit) => sessions.listByMachine(machineId, limit ?? 25));
}
