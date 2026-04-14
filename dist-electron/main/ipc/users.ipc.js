"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUsersIpc = registerUsersIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const users_service_1 = require("../services/users.service");
const svc = new users_service_1.UsersService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerUsersIpc() {
    safeHandle(channels_1.IPC_CHANNELS.USERS_LIST, () => svc.list());
    safeHandle(channels_1.IPC_CHANNELS.USERS_CREATE, (_e, dto) => svc.create(dto));
    safeHandle(channels_1.IPC_CHANNELS.USERS_UPDATE, (_e, id, dto) => svc.update(id, dto));
    safeHandle(channels_1.IPC_CHANNELS.USERS_DELETE, (_e, id) => svc.delete(id));
    safeHandle(channels_1.IPC_CHANNELS.USERS_RESET_PASSWORD, (_e, id, newPassword) => svc.resetPassword(id, newPassword));
}
