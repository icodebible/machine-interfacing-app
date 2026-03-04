"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
exports.api = {
    getAppVersion: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APP_GET_VERSION),
    ping: (msg) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APP_PING, msg),
    log: (level, message) => electron_1.ipcRenderer.send(channels_1.IPC_CHANNELS.LOG_RENDERER, { level, message }),
    tcpConnect: (host, port) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
    tcpSend: (payload) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_TCP_SEND, payload),
    tcpDisconnect: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_TCP_DISCONNECT),
    serialList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_LIST),
    serialConnect: (path, baudRate) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_CONNECT, { path, baudRate }),
    serialSend: (payload) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_SEND, payload),
    serialDisconnect: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT),
    onMachineMessage: (cb) => {
        const handler = (_, msg) => cb(msg);
        electron_1.ipcRenderer.on(channels_1.IPC_CHANNELS.MACHINE_MESSAGE, handler);
        return () => electron_1.ipcRenderer.removeListener(channels_1.IPC_CHANNELS.MACHINE_MESSAGE, handler);
    },
    authLogin: (username, password) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.AUTH_LOGIN, username, password),
    authChangePassword: (userId, newPassword) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.AUTH_CHANGE_PASSWORD, userId, newPassword),
};
