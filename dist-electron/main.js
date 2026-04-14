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
// ✅ Catch crashes early (top-level)
process.on('uncaughtException', (err) => logger_1.logger.error('uncaughtException', err));
process.on('unhandledRejection', (err) => logger_1.logger.error('unhandledRejection', err));
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
// ✅ Permanent Linux stability
if (process.platform === 'linux') {
    electron_1.app.commandLine.appendSwitch('ozone-platform', 'x11');
    electron_1.app.disableHardwareAcceleration();
    electron_1.app.commandLine.appendSwitch('disable-gpu');
    electron_1.app.commandLine.appendSwitch('disable-gpu-compositing');
}
electron_1.app.commandLine.appendSwitch('disable-gpu-sandbox');
electron_1.app.commandLine.appendSwitch('disable-software-rasterizer');
electron_1.app.whenReady().then(async () => {
    logger_1.logger.info('App starting...');
    await (0, harden_1.hardenSecurity)();
    // ✅ DB first
    await (0, migrations_1.runMigrations)();
    const retryWorker = new retry_worker_service_1.RetryWorkerService();
    retryWorker.start(30_000);
    // ✅ IPC next
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
    (0, machines_crud_ipc_1.registerMachinesCrudIpc)();
    (0, machines_logs_ipc_1.registerMachinesLogsIpc)();
    // ✅ Window
    const win = (0, main_window_1.createMainWindow)();
    // auto-start active machines marked auto_connect
    runtime.startAutoConnectMachines().catch(() => { });
    // ✅ Machine IPC (needs window)
    const cleanupMachineIpc = (0, machine_ipc_1.registerMachineIpc)(win);
    // ✅ Menu (File / Help / About)
    (0, app_menu_1.buildAppMenu)();
    // ✅ Diagnostics
    win.webContents.on('render-process-gone', (_e, details) => {
        logger_1.logger.error('Renderer gone', details);
    });
    win.on('unresponsive', () => logger_1.logger.warn('Window unresponsive'));
    electron_1.app.on('before-quit', () => {
        cleanupMachineIpc?.();
        retryWorker.stop();
    });
    // ✅ macOS behavior
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            (0, main_window_1.createMainWindow)();
        }
    });
    // ✅ Auto-update (packaged only)
    if (electron_1.app.isPackaged) {
        (0, autoUpdater_1.setupAutoUpdater)(win);
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
