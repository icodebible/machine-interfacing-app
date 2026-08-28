"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const harden_1 = require("./security/harden");
const app_ipc_1 = require("./ipc/app.ipc");
const logger_1 = require("./logging/logger");
const main_window_1 = require("./windows/main.window");
const machine_ipc_1 = require("./ipc/machine.ipc");
const autoUpdater_1 = require("./main/updater/autoUpdater");
const app_menu_1 = require("./main/menu/app.menu");
const migrations_1 = require("./main/db/migrations");
const db_1 = require("./main/db/db");
const auth_service_1 = require("./main/auth/auth.service");
const auth_ipc_1 = require("./main/ipc/auth.ipc");
const platform_ipc_1 = require("./main/ipc/platform.ipc");
const machines_crud_ipc_1 = require("./main/ipc/machines.crud.ipc");
const machines_runtime_ipc_1 = require("./main/ipc/machines.runtime.ipc");
const machines_logs_ipc_1 = require("./main/ipc/machines.logs.ipc");
const machines_sim_ipc_1 = require("./main/ipc/machines.sim.ipc");
const machines_parsed_ipc_1 = require("./main/ipc/machines.parsed.ipc");
const machines_normalized_ipc_1 = require("./main/ipc/machines.normalized.ipc");
const approval_policies_ipc_1 = require("./main/ipc/approval-policies.ipc");
const result_approvals_ipc_1 = require("./main/ipc/result-approvals.ipc");
const outbound_queue_ipc_1 = require("./main/ipc/outbound-queue.ipc");
const target_transform_preview_ipc_1 = require("./main/ipc/target-transform-preview.ipc");
const retry_worker_service_1 = require("./main/services/retry-worker.service");
const target_secrets_ipc_1 = require("./main/ipc/target-secrets.ipc");
const mappings_ipc_1 = require("./main/ipc/mappings.ipc");
const delivery_audit_ipc_1 = require("./main/ipc/delivery-audit.ipc");
const mapping_value_translations_ipc_1 = require("./main/ipc/mapping-value-translations.ipc");
const users_ipc_1 = require("./main/ipc/users.ipc");
const roles_ipc_1 = require("./main/ipc/roles.ipc");
const routing_rules_ipc_1 = require("./main/ipc/routing-rules.ipc");
const lis_test_order_profiles_ipc_1 = require("./main/ipc/lis-test-order-profiles.ipc");
const audit_readiness_ipc_1 = require("./main/ipc/audit-readiness.ipc");
const app_diagnostics_ipc_1 = require("./main/ipc/app-diagnostics.ipc");
const machine_host_log_service_1 = require("./main/runtime/machine-host-log.service");
const session_recorder_service_1 = require("./main/runtime/session-recorder.service");
process.on('uncaughtException', (err) => logger_1.logger.error('uncaughtException', err));
process.on('unhandledRejection', (err) => logger_1.logger.error('unhandledRejection', err));
// Linux packaged-runtime stability. These switches must be registered before
// requestSingleInstanceLock(), before app.whenReady(), and before any BrowserWindow is created.
if (process.platform === 'linux') {
    process.env['ELECTRON_DISABLE_SANDBOX'] = '1';
    electron_1.app.commandLine.appendSwitch('no-sandbox');
    electron_1.app.commandLine.appendSwitch('ozone-platform', 'x11');
    electron_1.app.commandLine.appendSwitch('disable-gpu');
    electron_1.app.commandLine.appendSwitch('disable-gpu-compositing');
    electron_1.app.commandLine.appendSwitch('disable-gpu-rasterization');
    electron_1.app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
    electron_1.app.commandLine.appendSwitch('disable-gpu-sandbox');
    electron_1.app.commandLine.appendSwitch('disable-dev-shm-usage');
    // Do not disable the software rasterizer; it is the safe fallback when GPU
    // acceleration is disabled on some Linux desktop environments.
    electron_1.app.disableHardwareAcceleration();
}
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
    electron_1.app.whenReady().then(bootstrapApplication);
}
async function bootstrapApplication() {
    let retryWorker = null;
    let cleanupMachineIpc;
    try {
        logger_1.logger.info('App starting...');
        logger_1.logger.info('Applying security hardening...');
        await (0, harden_1.hardenSecurity)();
        logger_1.logger.info('Security hardening completed');
        await initializeDatabaseOrFail();
        retryWorker = new retry_worker_service_1.RetryWorkerService();
        retryWorker.start(30_000);
        const runtime = registerMainProcessIpc();
        logger_1.logger.info('Creating main window...');
        const win = (0, main_window_1.createMainWindow)();
        logger_1.logger.info('Main window created');
        runtime.startAutoConnectMachines().catch((error) => {
            logger_1.logger.warn('Auto-connect machines startup failed', error);
        });
        cleanupMachineIpc = (0, machine_ipc_1.registerMachineIpc)(win);
        (0, app_menu_1.buildAppMenu)();
        registerWindowDiagnostics(win);
        registerLifecycleHandlers(cleanupMachineIpc, retryWorker);
        maybeEnableAutoUpdater(win);
    }
    catch (error) {
        retryWorker?.stop();
        cleanupMachineIpc?.();
        await handleFatalStartupError(error);
    }
}
async function initializeDatabaseOrFail() {
    logger_1.logger.info('Running database migrations...');
    await (0, migrations_1.runMigrations)();
    const tableCount = (0, migrations_1.getSchemaTables)().length;
    logger_1.logger.info('Database migrations completed', {
        databasePath: (0, db_1.getDbPath)(),
        dataPath: (0, db_1.getAppDataDir)(),
        tableCount,
    });
    logger_1.logger.info('Ensuring bootstrap administrator exists...');
    await new auth_service_1.AuthService().ensureBootstrapAdmin();
    logger_1.logger.info('Bootstrap administrator verified');
}
function registerMainProcessIpc() {
    /*
     * Production IPC ownership rule:
     * register each IPC module exactly once. Do not mask duplicate ownership with
     * removeHandler/re-register flows, because duplicated channels should be fixed
     * at the module boundary.
     */
    (0, app_ipc_1.registerIpcHandlers)();
    (0, auth_ipc_1.registerAuthIpc)();
    (0, platform_ipc_1.registerPlatformIpc)();
    (0, users_ipc_1.registerUsersIpc)();
    (0, roles_ipc_1.registerRolesIpc)();
    (0, machines_crud_ipc_1.registerMachinesCrudIpc)();
    (0, machines_logs_ipc_1.registerMachinesLogsIpc)();
    const runtime = (0, machines_runtime_ipc_1.registerMachinesRuntimeIpc)();
    (0, machines_sim_ipc_1.registerMachinesSimulationIpc)(runtime);
    (0, machines_parsed_ipc_1.registerMachinesParsedIpc)();
    (0, machines_normalized_ipc_1.registerMachinesNormalizedIpc)();
    (0, approval_policies_ipc_1.registerApprovalPoliciesIpc)();
    (0, result_approvals_ipc_1.registerResultApprovalsIpc)();
    (0, outbound_queue_ipc_1.registerOutboundQueueIpc)();
    (0, delivery_audit_ipc_1.registerDeliveryAuditIpc)();
    (0, target_transform_preview_ipc_1.registerTargetTransformPreviewIpc)();
    (0, target_secrets_ipc_1.registerTargetSecretsIpc)();
    (0, mappings_ipc_1.registerMappingsIpc)();
    (0, mapping_value_translations_ipc_1.registerMappingValueTranslationsIpc)();
    (0, routing_rules_ipc_1.registerRoutingRulesIpc)();
    (0, lis_test_order_profiles_ipc_1.registerLisTestOrderProfilesIpc)();
    (0, audit_readiness_ipc_1.registerAuditReadinessIpc)();
    (0, app_diagnostics_ipc_1.registerAppDiagnosticsIpc)();
    return runtime;
}
function registerWindowDiagnostics(win) {
    win.webContents.on('render-process-gone', (_event, details) => {
        logger_1.logger.error('Renderer gone', details);
    });
    win.on('unresponsive', () => logger_1.logger.warn('Window unresponsive'));
}
function registerLifecycleHandlers(cleanupMachineIpc, retryWorker) {
    let hostLogsFlushed = false;
    electron_1.app.on('before-quit', (event) => {
        cleanupMachineIpc?.();
        retryWorker.stop();
        if (!hostLogsFlushed) {
            hostLogsFlushed = true;
            event.preventDefault();
            try {
                new session_recorder_service_1.SessionRecorderService().endAllStarted('Application shutting down');
            }
            catch (error) {
                logger_1.logger.warn('Failed to close runtime sessions before shutdown', error);
            }
            void machine_host_log_service_1.machineHostLogService.flush().finally(() => electron_1.app.quit());
        }
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            (0, main_window_1.createMainWindow)();
        }
    });
}
function maybeEnableAutoUpdater(win) {
    // Production packaged builds check updates by default.
    // Use MI_DISABLE_AUTO_UPDATE=1 only for local/offline package testing before release metadata exists.
    if (electron_1.app.isPackaged && process.env['MI_DISABLE_AUTO_UPDATE'] !== '1') {
        (0, autoUpdater_1.setupAutoUpdater)(win);
    }
    else if (electron_1.app.isPackaged) {
        logger_1.logger.info('Auto-update skipped because MI_DISABLE_AUTO_UPDATE=1');
    }
}
async function handleFatalStartupError(error) {
    const databasePath = safeStartupPath(db_1.getDbPath);
    const dataPath = safeStartupPath(db_1.getAppDataDir);
    const message = error?.message || String(error);
    logger_1.logger.error('[STARTUP] Fatal startup failure', {
        message,
        databasePath,
        dataPath,
        error,
    });
    await electron_1.dialog.showMessageBox({
        type: 'error',
        title: 'Machine Interfacing App startup failed',
        message: 'The application could not complete startup initialization.',
        detail: `Reason: ${message}\n\nDatabase: ${databasePath}\nData folder: ${dataPath}\n\nPlease share this message and the application log for troubleshooting.`,
    });
    electron_1.app.quit();
}
function safeStartupPath(resolve) {
    try {
        return resolve();
    }
    catch (error) {
        return error?.message || 'Unavailable';
    }
}
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
