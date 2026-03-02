"use strict";
// import { app, BrowserWindow } from 'electron';
// import { hardenSecurity } from './security/harden';
// import { registerIpcHandlers } from './ipc/app.ipc';
// import { logger } from './logging/logger';
// import { autoUpdater } from 'electron-updater';
// import { createMainWindow } from './windows/main.window';
// import { setupAutoUpdater } from './main/updater/autoUpdater';
// import { registerMachineIpc } from './ipc/machine.ipc';
Object.defineProperty(exports, "__esModule", { value: true });
// // import { buildAppMenu } from './menu/app.menu';
// // app.whenReady().then(async () => {
// //   // ...
// //   buildAppMenu();
// //   // ...
// // });
// // ✅ Ensure only one instance runs
// const gotLock = app.requestSingleInstanceLock();
// if (!gotLock) {
//   app.quit();
// } else {
//   app.on('second-instance', () => {
//     const win = BrowserWindow.getAllWindows()[0];
//     if (win) {
//       if (win.isMinimized()) win.restore();
//       win.focus();
//     }
//   });
// }
// // ✅ Most common Linux segfault fix
// app.disableHardwareAcceleration();
// // Optional: helps on some systems
// app.commandLine.appendSwitch('disable-gpu');
// app.commandLine.appendSwitch('disable-gpu-compositing');
// const isLinux = process.platform === 'linux';
// const isWayland = !!process.env.WAYLAND_DISPLAY;
// if (isLinux && isWayland) {
//   app.commandLine.appendSwitch('ozone-platform', 'x11');
// }
// if (isLinux) {
//   app.disableHardwareAcceleration();
//   app.commandLine.appendSwitch('disable-gpu');
//   app.commandLine.appendSwitch('disable-gpu-compositing');
// }
// app.whenReady().then(async () => {
//   logger.info('App starting...');
//   await hardenSecurity();
//   registerIpcHandlers();
//   const win = createMainWindow();
//   registerMachineIpc(win);
//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
//   });
//   if (app.isPackaged) {
//     setupAutoUpdater(win);
//     // check shortly after launch
//     setTimeout(() => {
//       autoUpdater.checkForUpdatesAndNotify();
//     }, 4000);
//   }
// });
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });
// if (app.isPackaged) {
//   autoUpdater.checkForUpdatesAndNotify();
// }
const electron_1 = require("electron");
const harden_1 = require("./security/harden");
const app_ipc_1 = require("./ipc/app.ipc");
const logger_1 = require("./logging/logger");
const main_window_1 = require("./windows/main.window");
const machine_ipc_1 = require("./ipc/machine.ipc");
const autoUpdater_1 = require("./main/updater/autoUpdater");
const app_menu_1 = require("./main/menu/app.menu");
// import { buildAppMenu } from './menu/app.menu';
// ✅ Single instance lock (enterprise)
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
}
else {
    electron_1.app.on('second-instance', () => {
        const win = electron_1.BrowserWindow.getAllWindows()[0];
        if (win) {
            if (win.isMinimized())
                win.restore();
            win.focus();
        }
    });
}
// ✅ Permanent Linux stability (your environment needs this)
if (process.platform === 'linux') {
    // Force X11 (prevents Wayland/ozone crashes)
    electron_1.app.commandLine.appendSwitch('ozone-platform', 'x11');
    // Prevent GPU driver crashes
    electron_1.app.disableHardwareAcceleration();
    electron_1.app.commandLine.appendSwitch('disable-gpu');
    electron_1.app.commandLine.appendSwitch('disable-gpu-compositing');
}
electron_1.app.whenReady().then(async () => {
    logger_1.logger.info('App starting...');
    await (0, harden_1.hardenSecurity)();
    // IPC
    (0, app_ipc_1.registerIpcHandlers)();
    // Window
    const win = (0, main_window_1.createMainWindow)();
    // Menu (File / Help / About)
    (0, app_menu_1.buildAppMenu)();
    // Machine module IPC
    // registerMachineIpc(win);
    const cleanupMachineIpc = (0, machine_ipc_1.registerMachineIpc)(win);
    // macOS behavior
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            (0, main_window_1.createMainWindow)();
    });
    electron_1.app.on('before-quit', () => {
        cleanupMachineIpc?.();
    });
    // Auto-update (packaged only)
    if (electron_1.app.isPackaged) {
        (0, autoUpdater_1.setupAutoUpdater)(win);
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
