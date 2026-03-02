"use strict";
// import { autoUpdater } from 'electron-updater';
// import { BrowserWindow, dialog } from 'electron';
// import { logger } from '../../logging/logger';
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAutoUpdater = setupAutoUpdater;
// export function setupAutoUpdater(mainWindow?: BrowserWindow) {
//     autoUpdater.logger = logger as any;
//     autoUpdater.autoDownload = true;
//     autoUpdater.on('checking-for-update', () => logger.info('Checking for updates...'));
//     autoUpdater.on('update-available', (info) => logger.info('Update available', info));
//     autoUpdater.on('update-not-available', (info) => logger.info('No update', info));
//     autoUpdater.on('error', (err) => logger.error('Updater error', err));
//     autoUpdater.on('download-progress', (p) => logger.info('Download progress', p));
//     autoUpdater.on('update-downloaded', async () => {
//         const res = await dialog.showMessageBox((mainWindow as any) ?? undefined, {
//             type: 'info',
//             title: 'Update ready',
//             message: 'An update has been downloaded.',
//             detail: 'Restart the app to apply the update.',
//             buttons: ['Restart now', 'Later'],
//             defaultId: 0,
//             cancelId: 1,
//         });
//         if (res.response === 0) {
//             autoUpdater.quitAndInstall();
//         }
//     });
// }
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
const logger_1 = require("../../logging/logger");
function setupAutoUpdater(mainWindow) {
    electron_updater_1.autoUpdater.logger = logger_1.logger;
    electron_updater_1.autoUpdater.autoDownload = true;
    electron_updater_1.autoUpdater.on('error', (err) => logger_1.logger.error('Updater error', err));
    electron_updater_1.autoUpdater.on('update-available', (info) => logger_1.logger.info('Update available', info));
    electron_updater_1.autoUpdater.on('update-not-available', (info) => logger_1.logger.info('No update', info));
    electron_updater_1.autoUpdater.on('download-progress', (p) => logger_1.logger.info('Download progress', p));
    electron_updater_1.autoUpdater.on('update-downloaded', async () => {
        const res = await electron_1.dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update ready',
            message: 'An update has been downloaded.',
            detail: 'Restart the app to apply the update.',
            buttons: ['Restart now', 'Later'],
            defaultId: 0,
            cancelId: 1,
        });
        if (res.response === 0)
            electron_updater_1.autoUpdater.quitAndInstall();
    });
    // Check after a short delay (avoids slowing startup)
    setTimeout(() => {
        electron_updater_1.autoUpdater.checkForUpdatesAndNotify().catch((e) => logger_1.logger.error(e));
    }, 4000);
}
