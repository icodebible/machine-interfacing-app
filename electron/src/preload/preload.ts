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

import { contextBridge } from 'electron';
import { api } from './api';

contextBridge.exposeInMainWorld('appAPI', api);
