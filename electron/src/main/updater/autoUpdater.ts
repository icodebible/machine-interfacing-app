// import { autoUpdater } from 'electron-updater';
// import { BrowserWindow, dialog } from 'electron';
// import { logger } from '../../logging/logger';

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

import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';
import { logger } from '../../logging/logger';

export function setupAutoUpdater(mainWindow: BrowserWindow) {
    autoUpdater.logger = logger as any;
    autoUpdater.autoDownload = true;

    autoUpdater.on('error', (err) => logger.error('Updater error', err));
    autoUpdater.on('update-available', (info) => logger.info('Update available', info));
    autoUpdater.on('update-not-available', (info) => logger.info('No update', info));
    autoUpdater.on('download-progress', (p) => logger.info('Download progress', p));

    autoUpdater.on('update-downloaded', async () => {
        const res = await dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'Update ready',
            message: 'An update has been downloaded.',
            detail: 'Restart the app to apply the update.',
            buttons: ['Restart now', 'Later'],
            defaultId: 0,
            cancelId: 1,
        });

        if (res.response === 0) autoUpdater.quitAndInstall();
    });

    // Check after a short delay (avoids slowing startup)
    setTimeout(() => {
        autoUpdater.checkForUpdatesAndNotify().catch((e) => logger.error(e));
    }, 4000);
}
