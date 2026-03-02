"use strict";
// import { contextBridge, ipcRenderer } from "electron";
Object.defineProperty(exports, "__esModule", { value: true });
// type AppAPI = {
//   getAppVersion: () => Promise<string>;
//   ping: (msg: string) => Promise<string>;
// };
// const api: AppAPI = {
//   getAppVersion: () => ipcRenderer.invoke("app:getVersion"),
//   ping: (msg) => ipcRenderer.invoke("app:ping", msg),
// };
// contextBridge.exposeInMainWorld("appAPI", api);
const electron_1 = require("electron");
const api_1 = require("./api");
electron_1.contextBridge.exposeInMainWorld('appAPI', api_1.api);
