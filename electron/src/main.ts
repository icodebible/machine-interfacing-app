import { app, BrowserWindow } from 'electron';
import { hardenSecurity } from './security/harden';
import { registerIpcHandlers } from './ipc/app.ipc';
import { logger } from './logging/logger';
import { createMainWindow } from './windows/main.window';
import { registerMachineIpc } from './ipc/machine.ipc';
import { setupAutoUpdater } from './main/updater/autoUpdater';
import { buildAppMenu } from './main/menu/app.menu';
import { runMigrations } from './main/db/migrations';
import { registerAuthIpc } from './main/ipc/auth.ipc';

// ✅ Catch crashes early (top-level)
process.on('uncaughtException', (err) => logger.error('uncaughtException', err));
process.on('unhandledRejection', (err) => logger.error('unhandledRejection', err as any));

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

// ✅ Permanent Linux stability
if (process.platform === 'linux') {
  app.commandLine.appendSwitch('ozone-platform', 'x11');
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
}
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');

app.whenReady().then(async () => {
  logger.info('App starting...');

  await hardenSecurity();

  // ✅ DB first
  await runMigrations();

  // ✅ IPC next
  registerIpcHandlers();
  registerAuthIpc();

  // ✅ Window
  const win = createMainWindow();

  // ✅ Machine IPC (needs window)
  const cleanupMachineIpc = registerMachineIpc(win);

  // ✅ Menu (File / Help / About)
  buildAppMenu();

  // ✅ Diagnostics
  win.webContents.on('render-process-gone', (_e, details) => {
    logger.error('Renderer gone', details);
  });
  win.on('unresponsive', () => logger.warn('Window unresponsive'));

  app.on('before-quit', () => {
    cleanupMachineIpc?.();
  });

  // ✅ macOS behavior
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });

  // ✅ Auto-update (packaged only)
  if (app.isPackaged) {
    setupAutoUpdater(win);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
