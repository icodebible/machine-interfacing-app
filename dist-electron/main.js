"use strict";
// import { app, BrowserWindow, ipcMain } from "electron";
// import path from "path";
// import log from "electron-log";
Object.defineProperty(exports, "__esModule", { value: true });
// const isDev = !app.isPackaged;
// function createMainWindow() {
//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     show: true,
//     backgroundColor: "#0b1220",
//     webPreferences: {
//       contextIsolation: true,
//       nodeIntegration: false,
//       sandbox: true,
//       preload: path.join(__dirname, "preload.js"),
//     },
//   });
//   if (isDev) {
//     win.loadURL("http://localhost:4200");
//     win.webContents.openDevTools();
//   } else {
//     // Angular output will be dist/machine-interfacing-app/browser/index.html
//     const indexHtml = path.join(
//       app.getAppPath(),
//       "dist",
//       "machine-interfacing-app",
//       "browser",
//       "index.html"
//     );
//     win.loadFile(indexHtml);
//   }
//   return win;
// }
// // --- IPC (typed style via channel naming conventions) ---
// ipcMain.handle("app:getVersion", async () => app.getVersion());
// ipcMain.handle("app:ping", async (_evt, msg: string) => {
//   return `pong: ${msg}`;
// });
// app.whenReady().then(() => {
//   log.info("App starting...");
//   createMainWindow();
//   app.on("activate", () => {
//     if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
//   });
// });
// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") app.quit();
// });
const electron_1 = require("electron");
const harden_1 = require("./security/harden");
const app_ipc_1 = require("./ipc/app.ipc");
const logger_1 = require("./logging/logger");
const electron_updater_1 = require("electron-updater");
const main_window_1 = require("./windows/main.window");
const autoUpdater_1 = require("./main/updater/autoUpdater");
// import { buildAppMenu } from './menu/app.menu';
// app.whenReady().then(async () => {
//   // ...
//   buildAppMenu();
//   // ...
// });
// ✅ Ensure only one instance runs
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
// ✅ Most common Linux segfault fix
electron_1.app.disableHardwareAcceleration();
// Optional: helps on some systems
electron_1.app.commandLine.appendSwitch('disable-gpu');
electron_1.app.commandLine.appendSwitch('disable-gpu-compositing');
const isLinux = process.platform === 'linux';
const isWayland = !!process.env.WAYLAND_DISPLAY;
if (isLinux && isWayland) {
    electron_1.app.commandLine.appendSwitch('ozone-platform', 'x11');
}
if (isLinux) {
    electron_1.app.disableHardwareAcceleration();
    electron_1.app.commandLine.appendSwitch('disable-gpu');
    electron_1.app.commandLine.appendSwitch('disable-gpu-compositing');
}
electron_1.app.whenReady().then(async () => {
    logger_1.logger.info('App starting...');
    await (0, harden_1.hardenSecurity)();
    (0, app_ipc_1.registerIpcHandlers)();
    const win = (0, main_window_1.createMainWindow)();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            (0, main_window_1.createMainWindow)();
    });
    if (electron_1.app.isPackaged) {
        (0, autoUpdater_1.setupAutoUpdater)(win);
        // check shortly after launch
        setTimeout(() => {
            electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
        }, 4000);
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
if (electron_1.app.isPackaged) {
    electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
}
