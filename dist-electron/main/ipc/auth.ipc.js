"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthIpc = registerAuthIpc;
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
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.AUTH_CURRENT_USER, () => enqueue(async () => {
        try {
            return auth.currentUser();
        }
        catch (e) {
            logger_1.logger.error('[AUTH_CURRENT_USER] failed', e);
            throw e;
        }
    }));
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.AUTH_LOGOUT, () => enqueue(async () => {
        try {
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
