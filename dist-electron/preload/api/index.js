"use strict";
// import { ipcRenderer } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import type { AppAPI } from './types';
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
// export const api: AppAPI = {
//     getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
//     ping: (msg) => ipcRenderer.invoke(IPC_CHANNELS.APP_PING, msg),
//     log: (level, message) => ipcRenderer.send(IPC_CHANNELS.LOG_RENDERER, { level, message }),
//     tcpConnect: (host, port) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
//     tcpSend: (payload) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_SEND, payload),
//     tcpDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_DISCONNECT),
//     serialList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_LIST),
//     serialConnect: (path, baudRate) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_CONNECT, { path, baudRate }),
//     serialSend: (payload) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_SEND, payload),
//     serialDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT),
//     onMachineMessage: (cb) => {
//         const handler = (_: any, msg: any) => cb(msg);
//         ipcRenderer.on(IPC_CHANNELS.MACHINE_MESSAGE, handler);
//         return () => ipcRenderer.removeListener(IPC_CHANNELS.MACHINE_MESSAGE, handler);
//     },
//     authLogin: (username: string, password: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, username, password),
//     authChangePassword: (userId: string, newPassword: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, userId, newPassword),
// };
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
exports.api = {
    // Base
    getAppVersion: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APP_GET_VERSION),
    ping: (msg) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APP_PING, msg),
    log: (level, message) => electron_1.ipcRenderer.send(channels_1.IPC_CHANNELS.LOG_RENDERER, { level, message }),
    // Machine TCP
    tcpConnect: (host, port) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
    tcpSend: (payload) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_TCP_SEND, payload),
    tcpDisconnect: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_TCP_DISCONNECT),
    // Machine Serial
    serialList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_LIST),
    serialConnect: (path, baudRate) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_CONNECT, { path, baudRate }),
    serialSend: (payload) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_SEND, payload),
    serialDisconnect: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT),
    onMachineMessage: (cb) => {
        const handler = (_, msg) => cb(msg);
        electron_1.ipcRenderer.on(channels_1.IPC_CHANNELS.MACHINE_MESSAGE, handler);
        return () => electron_1.ipcRenderer.removeListener(channels_1.IPC_CHANNELS.MACHINE_MESSAGE, handler);
    },
    // Auth
    authLogin: (username, password) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.AUTH_LOGIN, username, password),
    authChangePassword: (userId, newPassword) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.AUTH_CHANGE_PASSWORD, userId, newPassword),
    authLogout: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.AUTH_LOGOUT),
    // ✅ Labs
    labsList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LABS_LIST),
    labsCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LABS_CREATE, dto),
    labsUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LABS_UPDATE, id, dto),
    labsDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LABS_DELETE, id),
    // ✅ Machines
    // machinesList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LIST),
    // machinesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CREATE, dto),
    // machinesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_UPDATE, id, dto),
    // machinesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DELETE, id),
    // machinesConnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CONNECT, id),
    // machinesDisconnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DISCONNECT, id),
    // ✅ Machines
    machinesList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_LIST),
    machinesCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_CREATE, dto),
    machinesUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_UPDATE, id, dto),
    machinesDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_DELETE, id),
    machinesConnect: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_CONNECT, id),
    machinesDisconnect: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_DISCONNECT, id),
    machinesTest: (machine) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_TEST, machine),
    // ✅ Targets
    targetsList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_LIST),
    targetsCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_CREATE, dto),
    targetsUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_UPDATE, id, dto),
    targetsDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_DELETE, id),
    targetsTest: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_TEST, id),
    // ✅ Logs
    logsQuery: (q) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LOGS_QUERY, q),
};
