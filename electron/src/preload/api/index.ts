import { ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import type { AppAPI } from './types';

export const api: AppAPI = {
    getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
    ping: (msg) => ipcRenderer.invoke(IPC_CHANNELS.APP_PING, msg),
    log: (level, message) => ipcRenderer.send(IPC_CHANNELS.LOG_RENDERER, { level, message }),
};