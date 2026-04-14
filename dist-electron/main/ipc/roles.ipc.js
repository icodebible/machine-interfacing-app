"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRolesIpc = registerRolesIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const roles_service_1 = require("../services/roles.service");
const svc = new roles_service_1.RolesService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerRolesIpc() {
    safeHandle(channels_1.IPC_CHANNELS.ROLES_LIST, () => svc.list());
    safeHandle(channels_1.IPC_CHANNELS.ROLES_CREATE, (_e, dto) => svc.create(dto));
    safeHandle(channels_1.IPC_CHANNELS.ROLES_UPDATE, (_e, id, dto) => svc.update(id, dto));
    safeHandle(channels_1.IPC_CHANNELS.ROLES_DELETE, (_e, id) => svc.delete(id));
    safeHandle(channels_1.IPC_CHANNELS.ROLES_AUTHORITIES_CATALOG, () => svc.authoritiesCatalog());
}
