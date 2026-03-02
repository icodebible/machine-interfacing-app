import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import type { AppAPI } from './types';

export const api: AppAPI = {
    getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
    ping: (msg) => ipcRenderer.invoke(IPC_CHANNELS.APP_PING, msg),
    log: (level, message) => ipcRenderer.send(IPC_CHANNELS.LOG_RENDERER, { level, message }),

    tcpConnect: (host, port) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
    tcpSend: (payload) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_SEND, payload),
    tcpDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_DISCONNECT),

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
};
