// import { contextBridge, ipcRenderer } from "electron";

// type AppAPI = {
//   getAppVersion: () => Promise<string>;
//   ping: (msg: string) => Promise<string>;
// };

// const api: AppAPI = {
//   getAppVersion: () => ipcRenderer.invoke("app:getVersion"),
//   ping: (msg) => ipcRenderer.invoke("app:ping", msg),
// };

// contextBridge.exposeInMainWorld("appAPI", api);

// import { contextBridge } from 'electron';
// import { appAPI } from './api';


// contextBridge.exposeInMainWorld('appAPI', appAPI);

import { contextBridge } from 'electron';
import { api } from './api/index';

contextBridge.exposeInMainWorld('appAPI', api);

// import { contextBridge, ipcRenderer } from 'electron';
// import { IPC_CHANNELS } from '../shared/channels'; // adjust path if needed

// const appAPI = {
//   getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
//   ping: (msg: string) => ipcRenderer.invoke(IPC_CHANNELS.APP_PING, msg),
//   log: (level: 'info' | 'warn' | 'error', message: string) =>
//     ipcRenderer.send(IPC_CHANNELS.LOG_RENDERER, { level, message }),

//   tcpConnect: (host: string, port: number) =>
//     ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
//   tcpSend: (payload: string) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_SEND, payload),
//   tcpDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_DISCONNECT),

//   serialList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_LIST),
//   serialConnect: (path: string, baudRate: number) =>
//     ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_CONNECT, { path, baudRate }),
//   serialSend: (payload: string) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_SEND, payload),
//   serialDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT),

//   onMachineMessage: (cb: (msg: any) => void) => {
//     const handler = (_: any, msg: any) => cb(msg);
//     ipcRenderer.on(IPC_CHANNELS.MACHINE_MESSAGE, handler);
//     return () => ipcRenderer.removeListener(IPC_CHANNELS.MACHINE_MESSAGE, handler);
//   },

//   authLogin: (username: string, password: string) =>
//     ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, username, password),

//   authChangePassword: (userId: string, newPassword: string) =>
//     ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, userId, newPassword),
// } as const;

// contextBridge.exposeInMainWorld('appAPI', appAPI);
