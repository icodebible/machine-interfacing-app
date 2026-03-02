"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
exports.api = {
    getAppVersion: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APP_GET_VERSION),
    ping: (msg) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APP_PING, msg),
    log: (level, message) => electron_1.ipcRenderer.send(channels_1.IPC_CHANNELS.LOG_RENDERER, { level, message }),
};
