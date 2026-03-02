"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
const electron_1 = require("electron");
const logger_1 = require("../logging/logger");
const channels_1 = require("../shared/channels");
function registerIpcHandlers() {
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.APP_GET_VERSION, async () => electron_1.app.getVersion());
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.APP_PING, async (_evt, msg) => `pong: ${msg}`);
    electron_1.ipcMain.on(channels_1.IPC_CHANNELS.LOG_RENDERER, (_evt, payload) => {
        const { level, message } = payload || {};
        logger_1.logger[level]?.(`[renderer] ${message}`);
    });
}
