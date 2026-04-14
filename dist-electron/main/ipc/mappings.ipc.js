"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMappingsIpc = registerMappingsIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const mappings_service_1 = require("../services/mappings.service");
const svc = new mappings_service_1.MappingsService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerMappingsIpc() {
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_LIST, () => svc.list());
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_CREATE, (_e, dto) => svc.create(dto));
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_UPDATE, (_e, id, dto) => svc.update(id, dto));
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_DELETE, (_e, id) => svc.delete(id));
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_VALIDATE, (_e, targetType) => svc.validate(targetType));
}
