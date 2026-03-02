// import { app, BrowserWindow } from 'electron';
// import { hardenSecurity } from './security/harden';
// import { registerIpcHandlers } from './ipc/app.ipc';
// import { logger } from './logging/logger';
// import { autoUpdater } from 'electron-updater';
// import { createMainWindow } from './windows/main.window';
// import { setupAutoUpdater } from './main/updater/autoUpdater';
// import { registerMachineIpc } from './ipc/machine.ipc';

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

import { app, BrowserWindow } from 'electron';
import { hardenSecurity } from './security/harden';
import { registerIpcHandlers } from './ipc/app.ipc';
import { logger } from './logging/logger';
import { createMainWindow } from './windows/main.window';
import { registerMachineIpc } from './ipc/machine.ipc';
import { setupAutoUpdater } from './main/updater/autoUpdater';
import { buildAppMenu } from './main/menu/app.menu';
// import { buildAppMenu } from './menu/app.menu';

// ✅ Single instance lock (enterprise)
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

// ✅ Permanent Linux stability (your environment needs this)
if (process.platform === 'linux') {
  // Force X11 (prevents Wayland/ozone crashes)
  app.commandLine.appendSwitch('ozone-platform', 'x11');

  // Prevent GPU driver crashes
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

app.whenReady().then(async () => {
  logger.info('App starting...');

  await hardenSecurity();

  // IPC
  registerIpcHandlers();

  // Window
  const win = createMainWindow();

  // Menu (File / Help / About)
  buildAppMenu();

  // Machine module IPC
  // registerMachineIpc(win);
  const cleanupMachineIpc = registerMachineIpc(win);

  // macOS behavior
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });

  app.on('before-quit', () => {
    cleanupMachineIpc?.();
  });

  // Auto-update (packaged only)
  if (app.isPackaged) {
    setupAutoUpdater(win);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
