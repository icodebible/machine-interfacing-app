// import { ipcRenderer } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import type { AppAPI } from './types';

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

import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import type { AppAPI } from './types';

export const api: AppAPI = {
    // Base
    getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
    ping: (msg) => ipcRenderer.invoke(IPC_CHANNELS.APP_PING, msg),
    log: (level, message) => ipcRenderer.send(IPC_CHANNELS.LOG_RENDERER, { level, message }),

    // Machine TCP
    tcpConnect: (host, port) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
    tcpSend: (payload) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_SEND, payload),
    tcpDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_DISCONNECT),

    // Machine Serial
    serialList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_LIST),
    serialConnect: (path, baudRate) =>
        ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_CONNECT, { path, baudRate }),
    serialSend: (payload) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_SEND, payload),
    serialDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT),

    onMachineMessage: (cb) => {
        const handler = (_: any, msg: any) => cb(msg);
        ipcRenderer.on(IPC_CHANNELS.MACHINE_MESSAGE, handler);
        return () => ipcRenderer.removeListener(IPC_CHANNELS.MACHINE_MESSAGE, handler);
    },

    // Auth
    authLogin: (username: string, password: string) =>
        ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, username, password),

    authChangePassword: (userId: string, newPassword: string) =>
        ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, userId, newPassword),

    authLogout: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT),

    // ✅ Labs
    labsList: () => ipcRenderer.invoke(IPC_CHANNELS.LABS_LIST),
    labsCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.LABS_CREATE, dto),
    labsUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.LABS_UPDATE, id, dto),
    labsDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.LABS_DELETE, id),

    // ✅ Machines
    // machinesList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LIST),
    // machinesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CREATE, dto),
    // machinesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_UPDATE, id, dto),
    // machinesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DELETE, id),
    // machinesConnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CONNECT, id),
    // machinesDisconnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DISCONNECT, id),

    // ✅ Machines
    machinesList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LIST),
    machinesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CREATE, dto),
    machinesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_UPDATE, id, dto),
    machinesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DELETE, id),
    machinesConnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CONNECT, id),
    machinesDisconnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DISCONNECT, id),
    machinesTest: (machine) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_TEST, machine),

    // ✅ Targets
    targetsList: () => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_LIST),
    targetsCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_CREATE, dto),
    targetsUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_UPDATE, id, dto),
    targetsDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_DELETE, id),
    targetsTest: (id) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_TEST, id),

    // ✅ Logs
    logsQuery: (q) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_QUERY, q),
};
