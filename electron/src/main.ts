import { app, BrowserWindow, dialog } from 'electron';
import { hardenSecurity } from './security/harden';
import { registerIpcHandlers } from './ipc/app.ipc';
import { logger } from './logging/logger';
import { createMainWindow } from './windows/main.window';
import { registerMachineIpc } from './ipc/machine.ipc';
import { setupAutoUpdater } from './main/updater/autoUpdater';
import { buildAppMenu } from './main/menu/app.menu';
import { getSchemaTables, runMigrations } from './main/db/migrations';
import { getAppDataDir, getDbPath } from './main/db/db';
import { AuthService } from './main/auth/auth.service';
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
import { registerAuditReadinessIpc } from './main/ipc/audit-readiness.ipc';
import { registerAppDiagnosticsIpc } from './main/ipc/app-diagnostics.ipc';

process.on('uncaughtException', (err) => logger.error('uncaughtException', err));
process.on('unhandledRejection', (err) => logger.error('unhandledRejection', err as any));

// Linux packaged-runtime stability. These switches must be registered before
// requestSingleInstanceLock(), before app.whenReady(), and before any BrowserWindow is created.
if (process.platform === 'linux') {
  process.env['ELECTRON_DISABLE_SANDBOX'] = '1';

  app.commandLine.appendSwitch('no-sandbox');
  app.commandLine.appendSwitch('ozone-platform', 'x11');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-gpu-compositing');
  app.commandLine.appendSwitch('disable-gpu-rasterization');
  app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
  app.commandLine.appendSwitch('disable-gpu-sandbox');
  app.commandLine.appendSwitch('disable-dev-shm-usage');

  // Do not disable the software rasterizer; it is the safe fallback when GPU
  // acceleration is disabled on some Linux desktop environments.
  app.disableHardwareAcceleration();
}

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

  app.whenReady().then(bootstrapApplication);
}

async function bootstrapApplication() {
  let retryWorker: RetryWorkerService | null = null;
  let cleanupMachineIpc: (() => void) | undefined;

  try {
    logger.info('App starting...');

    logger.info('Applying security hardening...');
    await hardenSecurity();
    logger.info('Security hardening completed');

    await initializeDatabaseOrFail();

    retryWorker = new RetryWorkerService();
    retryWorker.start(30_000);

    const runtime = registerMainProcessIpc();

    logger.info('Creating main window...');
    const win = createMainWindow();
    logger.info('Main window created');

    runtime.startAutoConnectMachines().catch((error) => {
      logger.warn('Auto-connect machines startup failed', error);
    });

    cleanupMachineIpc = registerMachineIpc(win);

    buildAppMenu();
    registerWindowDiagnostics(win);
    registerLifecycleHandlers(cleanupMachineIpc, retryWorker);
    maybeEnableAutoUpdater(win);
  } catch (error: any) {
    retryWorker?.stop();
    cleanupMachineIpc?.();
    await handleFatalStartupError(error);
  }
}

async function initializeDatabaseOrFail() {
  logger.info('Running database migrations...');
  await runMigrations();

  const tableCount = getSchemaTables().length;

  logger.info('Database migrations completed', {
    databasePath: getDbPath(),
    dataPath: getAppDataDir(),
    tableCount,
  });

  logger.info('Ensuring bootstrap administrator exists...');
  await new AuthService().ensureBootstrapAdmin();
  logger.info('Bootstrap administrator verified');
}

function registerMainProcessIpc() {
  /*
   * Production IPC ownership rule:
   * register each IPC module exactly once. Do not mask duplicate ownership with
   * removeHandler/re-register flows, because duplicated channels should be fixed
   * at the module boundary.
   */
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

  registerRoutingRulesIpc();
  registerLisTestOrderProfilesIpc();
  registerAuditReadinessIpc();
  registerAppDiagnosticsIpc();

  return runtime;
}

function registerWindowDiagnostics(win: BrowserWindow) {
  win.webContents.on('render-process-gone', (_event, details) => {
    logger.error('Renderer gone', details);
  });

  win.on('unresponsive', () => logger.warn('Window unresponsive'));
}

function registerLifecycleHandlers(cleanupMachineIpc: (() => void) | undefined, retryWorker: RetryWorkerService) {
  app.on('before-quit', () => {
    cleanupMachineIpc?.();
    retryWorker.stop();
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
}

function maybeEnableAutoUpdater(win: BrowserWindow) {
  // Production packaged builds check updates by default.
  // Use MI_DISABLE_AUTO_UPDATE=1 only for local/offline package testing before release metadata exists.
  if (app.isPackaged && process.env['MI_DISABLE_AUTO_UPDATE'] !== '1') {
    setupAutoUpdater(win);
  } else if (app.isPackaged) {
    logger.info('Auto-update skipped because MI_DISABLE_AUTO_UPDATE=1');
  }
}

async function handleFatalStartupError(error: any) {
  const databasePath = safeStartupPath(getDbPath);
  const dataPath = safeStartupPath(getAppDataDir);
  const message = error?.message || String(error);

  logger.error('[STARTUP] Fatal startup failure', {
    message,
    databasePath,
    dataPath,
    error,
  });

  await dialog.showMessageBox({
    type: 'error',
    title: 'Machine Interfacing App startup failed',
    message: 'The application could not complete startup initialization.',
    detail: `Reason: ${message}\n\nDatabase: ${databasePath}\nData folder: ${dataPath}\n\nPlease share this message and the application log for troubleshooting.`,
  });

  app.quit();
}

function safeStartupPath(resolve: () => string) {
  try {
    return resolve();
  } catch (error: any) {
    return error?.message || 'Unavailable';
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
