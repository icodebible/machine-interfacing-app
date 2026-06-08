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
import { registerPlatformIpc } from './main/ipc/platform.ipc';
import { registerMachinesCrudIpc } from './main/ipc/machines.crud.ipc';
import { registerMachinesRuntimeIpc } from './main/ipc/machines.runtime.ipc';
import { registerMachinesLogsIpc } from './main/ipc/machines.logs.ipc';
import { registerMachinesSimulationIpc } from './main/ipc/machines.sim.ipc';
import { registerMachinesParsedIpc } from './main/ipc/machines.parsed.ipc';
import { registerMachinesNormalizedIpc } from './main/ipc/machines.normalized.ipc';
import { registerApprovalPoliciesIpc } from './main/ipc/approval-policies.ipc';
import { registerResultApprovalsIpc } from './main/ipc/result-approvals.ipc';
import { registerOutboundQueueIpc } from './main/ipc/outbound-queue.ipc';
import { registerTargetTransformPreviewIpc } from './main/ipc/target-transform-preview.ipc';
import { RetryWorkerService } from './main/services/retry-worker.service';
import { registerTargetSecretsIpc } from './main/ipc/target-secrets.ipc';
import { registerMappingsIpc } from './main/ipc/mappings.ipc';
import { registerDeliveryAuditIpc } from './main/ipc/delivery-audit.ipc';
import { registerMappingValueTranslationsIpc } from './main/ipc/mapping-value-translations.ipc';
import { registerUsersIpc } from './main/ipc/users.ipc';
import { registerRolesIpc } from './main/ipc/roles.ipc';
import { registerRoutingRulesIpc } from './main/ipc/routing-rules.ipc';
import { registerLisTestOrderProfilesIpc } from './main/ipc/lis-test-order-profiles.ipc';

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

  const retryWorker = new RetryWorkerService();
  retryWorker.start(30_000);

  // ✅ IPC next
  registerIpcHandlers();
  registerAuthIpc();
  registerPlatformIpc();
  registerUsersIpc();
  registerRolesIpc();

  registerMachinesCrudIpc();
  registerMachinesLogsIpc();

  const runtime = registerMachinesRuntimeIpc();
  registerMachinesSimulationIpc(runtime);

  registerMachinesParsedIpc();
  registerMachinesNormalizedIpc();

  registerApprovalPoliciesIpc();
  registerResultApprovalsIpc();
  registerOutboundQueueIpc();
  registerDeliveryAuditIpc();
  registerTargetTransformPreviewIpc();
  registerTargetSecretsIpc();
  registerMappingsIpc();
  registerMappingValueTranslationsIpc();

  registerMachinesCrudIpc();
  registerMachinesLogsIpc();

  registerRoutingRulesIpc();
  registerLisTestOrderProfilesIpc();
  // ✅ Window
  const win = createMainWindow();

  // auto-start active machines marked auto_connect
  runtime.startAutoConnectMachines().catch(() => {});

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
    retryWorker.stop();
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
