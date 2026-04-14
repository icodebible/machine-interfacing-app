"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMachinesNormalizedIpc = registerMachinesNormalizedIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const normalized_result_service_1 = require("../normalizers/normalized-result.service");
const svc = new normalized_result_service_1.NormalizedResultService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerMachinesNormalizedIpc() {
    svc.ensureTable();
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_NORMALIZED_LIST, (_e, machineId, limit = 50) => svc.listByMachine(machineId, limit));
}
