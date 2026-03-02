"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAutoUpdater = setupAutoUpdater;
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
const logger_1 = require("../../logging/logger");
function setupAutoUpdater(mainWindow) {
    electron_updater_1.autoUpdater.logger = logger_1.logger;
    electron_updater_1.autoUpdater.autoDownload = true;
    electron_updater_1.autoUpdater.on('checking-for-update', () => logger_1.logger.info('Checking for updates...'));
    electron_updater_1.autoUpdater.on('update-available', (info) => logger_1.logger.info('Update available', info));
    electron_updater_1.autoUpdater.on('update-not-available', (info) => logger_1.logger.info('No update', info));
    electron_updater_1.autoUpdater.on('error', (err) => logger_1.logger.error('Updater error', err));
    electron_updater_1.autoUpdater.on('download-progress', (p) => logger_1.logger.info('Download progress', p));
    electron_updater_1.autoUpdater.on('update-downloaded', async () => {
        const res = await electron_1.dialog.showMessageBox(mainWindow ?? undefined, {
            type: 'info',
            title: 'Update ready',
            message: 'An update has been downloaded.',
            detail: 'Restart the app to apply the update.',
            buttons: ['Restart now', 'Later'],
            defaultId: 0,
            cancelId: 1,
        });
        if (res.response === 0) {
            electron_updater_1.autoUpdater.quitAndInstall();
        }
    });
}
