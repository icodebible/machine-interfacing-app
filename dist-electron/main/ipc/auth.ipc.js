"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuthIpc = registerAuthIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const auth_service_1 = require("../auth/auth.service");
const logger_1 = require("../../logging/logger");
const auth = new auth_service_1.AuthService();
function registerAuthIpc() {
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.AUTH_LOGIN, async (_e, username, password) => {
        // await auth.ensureBootstrapAdmin();
        try {
            await auth.ensureBootstrapAdmin();
        }
        catch (e) {
            logger_1.logger.error('[BOOTSTRAP]: App Bootstrap Failed', e);
            throw e;
        }
        return auth.login(username, password);
    });
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.AUTH_CHANGE_PASSWORD, async (_e, userId, newPassword) => {
        return auth.changePassword(userId, newPassword);
    });
}
