"use strict";
// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { AuthService } from '../auth/auth.service';
// import { logger } from '../../logging/logger';
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthIpc = registerAuthIpc;
// const auth = new AuthService();
// let authQueue: Promise<any> = Promise.resolve();
// function enqueue<T>(fn: () => Promise<T>) {
//   authQueue = authQueue.then(fn, fn);
//   return authQueue;
// }
// export function registerAuthIpc() {
//   ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, (_e, username: string, password: string) =>
//     enqueue(async () => {
//       try {
//         await auth.ensureBootstrapAdmin();
//         return await auth.login(username, password);
//       } catch (e) {
//         logger.error('[AUTH_LOGIN] failed', e);
//         throw e;
//       }
//     }),
//   );
//   ipcMain.handle(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, (_e, userId: string, newPassword: string) =>
//     enqueue(async () => {
//       try {
//         return await auth.changePassword(userId, newPassword);
//       } catch (e) {
//         logger.error('[AUTH_CHANGE_PASSWORD] failed', e);
//         throw e;
//       }
//     }),
//   );
// }
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const auth_service_1 = require("../auth/auth.service");
const logger_1 = require("../../logging/logger");
const auth = new auth_service_1.AuthService();
let authQueue = Promise.resolve();
function enqueue(fn) {
    authQueue = authQueue.then(fn, fn);
    return authQueue;
}
function registerAuthIpc() {
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.AUTH_LOGIN, (_e, username, password) => enqueue(async () => {
        try {
            await auth.ensureBootstrapAdmin();
            return await auth.login(username, password);
        }
        catch (e) {
            logger_1.logger.error('[AUTH_LOGIN] failed', e);
            throw e;
        }
    }));
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.AUTH_CHANGE_PASSWORD, (_e, userId, newPassword) => enqueue(async () => {
        try {
            return await auth.changePassword(userId, newPassword);
        }
        catch (e) {
            logger_1.logger.error('[AUTH_CHANGE_PASSWORD] failed', e);
            throw e;
        }
    }));
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.AUTH_LOGOUT, () => enqueue(async () => {
        try {
            // If your AuthService has a logout() method, call it.
            // If it doesn’t, just return true (renderer clears session).
            const anyAuth = auth;
            if (typeof anyAuth.logout === 'function')
                await anyAuth.logout();
            return true;
        }
        catch (e) {
            logger_1.logger.error('[AUTH_LOGOUT] failed', e);
            throw e;
        }
    }));
}
