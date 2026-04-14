"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTargetSecretsIpc = registerTargetSecretsIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const target_secrets_service_1 = require("../services/target-secrets.service");
const svc = new target_secrets_service_1.TargetSecretsService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerTargetSecretsIpc() {
    safeHandle(channels_1.IPC_CHANNELS.TARGET_SECRETS_GET, (_e, targetId) => svc.get(targetId));
    safeHandle(channels_1.IPC_CHANNELS.TARGET_SECRETS_SAVE, (_e, targetId, dto) => svc.save(targetId, dto));
}
