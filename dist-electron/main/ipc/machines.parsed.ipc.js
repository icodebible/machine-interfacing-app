"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMachinesParsedIpc = registerMachinesParsedIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const parsed_message_service_1 = require("../protocols/parsed-message.service");
const svc = new parsed_message_service_1.ParsedMessageService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerMachinesParsedIpc() {
    svc.ensureTable();
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_PARSED_LIST, (_e, machineId, limit = 50) => svc.listByMachine(machineId, limit));
}
