// import { app, BrowserWindow, ipcMain } from "electron";
// import path from "path";
// import log from "electron-log";

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

import { app, BrowserWindow } from 'electron';
import { hardenSecurity } from './security/harden';
import { registerIpcHandlers } from './ipc/app.ipc';
import { logger } from './logging/logger';
import { autoUpdater } from 'electron-updater';
import { createMainWindow } from './windows/main.window';
import { setupAutoUpdater } from './main/updater/autoUpdater';

// import { buildAppMenu } from './menu/app.menu';

// app.whenReady().then(async () => {
//   // ...
//   buildAppMenu();
//   // ...
// });

// ✅ Ensure only one instance runs
const gotLock = app.requestSingleInstanceLock();

if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
}

// ✅ Most common Linux segfault fix
app.disableHardwareAcceleration();

// Optional: helps on some systems
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

const isLinux = process.platform === 'linux';
const isWayland = !!process.env.WAYLAND_DISPLAY;

if (isLinux && isWayland) {
  app.commandLine.appendSwitch('ozone-platform', 'x11');
}

if (isLinux) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

app.whenReady().then(async () => {
  logger.info('App starting...');
  await hardenSecurity();
  registerIpcHandlers();

  const win = createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  if (app.isPackaged) {
    setupAutoUpdater(win);
    // check shortly after launch
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify();
    }, 4000);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

if (app.isPackaged) {
  autoUpdater.checkForUpdatesAndNotify();
}
