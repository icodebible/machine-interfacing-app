"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPlatformIpc = registerPlatformIpc;
const electron_1 = require("electron");
const labs_service_1 = require("../services/labs.service");
const channels_1 = require("../../shared/channels");
const machines_service_1 = require("../services/machines.service");
const targets_service_1 = require("../services/targets.service");
const logs_service_1 = require("../services/logs.service");
function registerPlatformIpc() {
    const labs = new labs_service_1.LabsService();
    const machines = new machines_service_1.MachinesService();
    const targets = new targets_service_1.TargetsService();
    const logs = new logs_service_1.LogsService();
    // Labs
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.LABS_LIST, () => labs.list());
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.LABS_CREATE, (_e, dto) => labs.create(dto));
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.LABS_UPDATE, (_e, id, dto) => labs.update(id, dto));
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.LABS_DELETE, (_e, id) => labs.delete(id));
    // Machines
    // ipcMain.handle(IPC_CHANNELS.MACHINES_LIST, () => machines.list());
    // ipcMain.handle(IPC_CHANNELS.MACHINES_CREATE, (_e, dto) => machines.create(dto));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_UPDATE, (_e, id, dto) => machines.update(id, dto));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_DELETE, (_e, id) => machines.delete(id));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_CONNECT, (_e, id) => machines.connect(id));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_DISCONNECT, (_e, id) => machines.disconnect(id));
    // Targets
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.TARGETS_LIST, () => targets.list());
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.TARGETS_CREATE, (_e, dto) => targets.create(dto));
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.TARGETS_UPDATE, (_e, id, dto) => targets.update(id, dto));
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.TARGETS_DELETE, (_e, id) => targets.delete(id));
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.TARGETS_TEST, (_e, id) => targets.test(id));
    // Logs
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.LOGS_QUERY, (_e, q) => logs.query(q));
    electron_1.ipcMain.handle('clipboard:copy', async (_e, text) => {
        electron_1.clipboard.writeText(text);
        return true;
    });
}
