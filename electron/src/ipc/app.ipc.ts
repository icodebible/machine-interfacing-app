import { ipcMain, app } from 'electron';
import { logger } from '../logging/logger';
import { IPC_CHANNELS } from '../shared/channels';

export function registerIpcHandlers() {
    ipcMain.handle(IPC_CHANNELS.APP_GET_VERSION, async () => app.getVersion());

    ipcMain.handle(IPC_CHANNELS.APP_PING, async (_evt, msg: string) => `pong: ${msg}`);

    ipcMain.on(IPC_CHANNELS.LOG_RENDERER, (_evt, payload: any) => {
        const { level, message } = payload || {};
        (logger as any)[level]?.(`[renderer] ${message}`);
    });
}