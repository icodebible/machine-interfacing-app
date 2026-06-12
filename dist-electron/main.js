"use strict";
// import { app, BrowserWindow } from 'electron';
// import { hardenSecurity } from './security/harden';
// import { registerIpcHandlers } from './ipc/app.ipc';
// import { logger } from './logging/logger';
// import { createMainWindow } from './windows/main.window';
// import { registerMachineIpc } from './ipc/machine.ipc';
// import { setupAutoUpdater } from './main/updater/autoUpdater';
// import { buildAppMenu } from './main/menu/app.menu';
// import { runMigrations } from './main/db/migrations';
// import { registerAuthIpc } from './main/ipc/auth.ipc';
// import { registerPlatformIpc } from './main/ipc/platform.ipc';
// import { registerMachinesCrudIpc } from './main/ipc/machines.crud.ipc';
// import { registerMachinesRuntimeIpc } from './main/ipc/machines.runtime.ipc';
// import { registerMachinesLogsIpc } from './main/ipc/machines.logs.ipc';
// import { registerMachinesSimulationIpc } from './main/ipc/machines.sim.ipc';
// import { registerMachinesParsedIpc } from './main/ipc/machines.parsed.ipc';
// import { registerMachinesNormalizedIpc } from './main/ipc/machines.normalized.ipc';
// import { registerApprovalPoliciesIpc } from './main/ipc/approval-policies.ipc';
// import { registerResultApprovalsIpc } from './main/ipc/result-approvals.ipc';
// import { registerOutboundQueueIpc } from './main/ipc/outbound-queue.ipc';
// import { registerTargetTransformPreviewIpc } from './main/ipc/target-transform-preview.ipc';
// import { RetryWorkerService } from './main/services/retry-worker.service';
// import { registerTargetSecretsIpc } from './main/ipc/target-secrets.ipc';
// import { registerMappingsIpc } from './main/ipc/mappings.ipc';
// import { registerDeliveryAuditIpc } from './main/ipc/delivery-audit.ipc';
// import { registerMappingValueTranslationsIpc } from './main/ipc/mapping-value-translations.ipc';
// import { registerUsersIpc } from './main/ipc/users.ipc';
// import { registerRolesIpc } from './main/ipc/roles.ipc';
// import { registerRoutingRulesIpc } from './main/ipc/routing-rules.ipc';
// import { registerLisTestOrderProfilesIpc } from './main/ipc/lis-test-order-profiles.ipc';
// import { registerAuditReadinessIpc } from './main/ipc/audit-readiness.ipc';
// import { registerAppDiagnosticsIpc } from './main/ipc/app-diagnostics.ipc';
Object.defineProperty(exports, "__esModule", { value: true });
// // ✅ Catch crashes early (top-level)
// process.on('uncaughtException', (err) => logger.error('uncaughtException', err));
// process.on('unhandledRejection', (err) => logger.error('unhandledRejection', err as any));
// // ✅ Single instance lock (enterprise)
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
// // ✅ Permanent Linux stability
// if (process.platform === 'linux') {
//   app.commandLine.appendSwitch('ozone-platform', 'x11');
//   app.disableHardwareAcceleration();
//   app.commandLine.appendSwitch('disable-gpu');
//   app.commandLine.appendSwitch('disable-gpu-compositing');
// }
// app.commandLine.appendSwitch('disable-gpu-sandbox');
// app.commandLine.appendSwitch('disable-software-rasterizer');
// app.whenReady().then(async () => {
//   logger.info('App starting...');
//   await hardenSecurity();
//   // ✅ DB first
//   await runMigrations();
//   const retryWorker = new RetryWorkerService();
//   retryWorker.start(30_000);
//   // ✅ IPC next
//   registerIpcHandlers();
//   registerAuthIpc();
//   registerPlatformIpc();
//   registerUsersIpc();
//   registerRolesIpc();
//   registerMachinesCrudIpc();
//   registerMachinesLogsIpc();
//   const runtime = registerMachinesRuntimeIpc();
//   registerMachinesSimulationIpc(runtime);
//   registerMachinesParsedIpc();
//   registerMachinesNormalizedIpc();
//   registerApprovalPoliciesIpc();
//   registerResultApprovalsIpc();
//   registerOutboundQueueIpc();
//   registerDeliveryAuditIpc();
//   registerTargetTransformPreviewIpc();
//   registerTargetSecretsIpc();
//   registerMappingsIpc();
//   registerMappingValueTranslationsIpc();
//   registerMachinesCrudIpc();
//   registerMachinesLogsIpc();
//   registerRoutingRulesIpc();
//   registerLisTestOrderProfilesIpc();
//   registerAuditReadinessIpc();
//   registerAppDiagnosticsIpc();
//   // ✅ Window
//   const win = createMainWindow();
//   // auto-start active machines marked auto_connect
//   runtime.startAutoConnectMachines().catch(() => {});
//   // ✅ Machine IPC (needs window)
//   const cleanupMachineIpc = registerMachineIpc(win);
//   // ✅ Menu (File / Help / About)
//   buildAppMenu();
//   // ✅ Diagnostics
//   win.webContents.on('render-process-gone', (_e, details) => {
//     logger.error('Renderer gone', details);
//   });
//   win.on('unresponsive', () => logger.warn('Window unresponsive'));
//   app.on('before-quit', () => {
//     cleanupMachineIpc?.();
//     retryWorker.stop();
//   });
//   // ✅ macOS behavior
//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//       createMainWindow();
//     }
//   });
//   // ✅ Auto-update (packaged only)
//   if (app.isPackaged) {
//     setupAutoUpdater(win);
//   }
// });
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });
// import { app, BrowserWindow } from 'electron';
// import { hardenSecurity } from './security/harden';
// import { registerIpcHandlers } from './ipc/app.ipc';
// import { logger } from './logging/logger';
// import { createMainWindow } from './windows/main.window';
// import { registerMachineIpc } from './ipc/machine.ipc';
// import { setupAutoUpdater } from './main/updater/autoUpdater';
// import { buildAppMenu } from './main/menu/app.menu';
// import { runMigrations } from './main/db/migrations';
// import { registerAuthIpc } from './main/ipc/auth.ipc';
// import { registerPlatformIpc } from './main/ipc/platform.ipc';
// import { registerMachinesCrudIpc } from './main/ipc/machines.crud.ipc';
// import { registerMachinesRuntimeIpc } from './main/ipc/machines.runtime.ipc';
// import { registerMachinesLogsIpc } from './main/ipc/machines.logs.ipc';
// import { registerMachinesSimulationIpc } from './main/ipc/machines.sim.ipc';
// import { registerMachinesParsedIpc } from './main/ipc/machines.parsed.ipc';
// import { registerMachinesNormalizedIpc } from './main/ipc/machines.normalized.ipc';
// import { registerApprovalPoliciesIpc } from './main/ipc/approval-policies.ipc';
// import { registerResultApprovalsIpc } from './main/ipc/result-approvals.ipc';
// import { registerOutboundQueueIpc } from './main/ipc/outbound-queue.ipc';
// import { registerTargetTransformPreviewIpc } from './main/ipc/target-transform-preview.ipc';
// import { RetryWorkerService } from './main/services/retry-worker.service';
// import { registerTargetSecretsIpc } from './main/ipc/target-secrets.ipc';
// import { registerMappingsIpc } from './main/ipc/mappings.ipc';
// import { registerDeliveryAuditIpc } from './main/ipc/delivery-audit.ipc';
// import { registerMappingValueTranslationsIpc } from './main/ipc/mapping-value-translations.ipc';
// import { registerUsersIpc } from './main/ipc/users.ipc';
// import { registerRolesIpc } from './main/ipc/roles.ipc';
// import { registerRoutingRulesIpc } from './main/ipc/routing-rules.ipc';
// import { registerLisTestOrderProfilesIpc } from './main/ipc/lis-test-order-profiles.ipc';
// import { registerAuditReadinessIpc } from './main/ipc/audit-readiness.ipc';
// // Linux packaged-runtime stability.
// // These switches must be registered before requestSingleInstanceLock() and before app.whenReady().
// if (process.platform === 'linux') {
//   app.commandLine.appendSwitch('ozone-platform', 'x11');
//   app.commandLine.appendSwitch('disable-gpu');
//   app.commandLine.appendSwitch('disable-gpu-compositing');
//   app.commandLine.appendSwitch('disable-gpu-rasterization');
//   app.commandLine.appendSwitch('disable-accelerated-2d-canvas');
//   app.commandLine.appendSwitch('disable-gpu-sandbox');
//   // Required on some packaged Linux deployments where Chromium sandbox crashes before renderer startup.
//   if (app.isPackaged) {
//     app.commandLine.appendSwitch('no-sandbox');
//   }
//   app.disableHardwareAcceleration();
// }
// // ✅ Catch crashes early (top-level)
// process.on('uncaughtException', (err) => logger.error('uncaughtException', err));
// process.on('unhandledRejection', (err) => logger.error('unhandledRejection', err as any));
// // ✅ Single instance lock (enterprise)
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
// app.whenReady().then(async () => {
//   logger.info('App starting...');
//   await hardenSecurity();
//   // ✅ DB first
//   await runMigrations();
//   const retryWorker = new RetryWorkerService();
//   retryWorker.start(30_000);
//   // ✅ IPC next
//   registerIpcHandlers();
//   registerAuthIpc();
//   registerPlatformIpc();
//   registerUsersIpc();
//   registerRolesIpc();
//   registerMachinesCrudIpc();
//   registerMachinesLogsIpc();
//   const runtime = registerMachinesRuntimeIpc();
//   registerMachinesSimulationIpc(runtime);
//   registerMachinesParsedIpc();
//   registerMachinesNormalizedIpc();
//   registerApprovalPoliciesIpc();
//   registerResultApprovalsIpc();
//   registerOutboundQueueIpc();
//   registerDeliveryAuditIpc();
//   registerTargetTransformPreviewIpc();
//   registerTargetSecretsIpc();
//   registerMappingsIpc();
//   registerMappingValueTranslationsIpc();
//   registerMachinesCrudIpc();
//   registerMachinesLogsIpc();
//   registerRoutingRulesIpc();
//   registerLisTestOrderProfilesIpc();
//   registerAuditReadinessIpc();
//   // ✅ Window
//   const win = createMainWindow();
//   // auto-start active machines marked auto_connect
//   runtime.startAutoConnectMachines().catch(() => {});
//   // ✅ Machine IPC (needs window)
//   const cleanupMachineIpc = registerMachineIpc(win);
//   // ✅ Menu (File / Help / About)
//   buildAppMenu();
//   // ✅ Diagnostics
//   win.webContents.on('render-process-gone', (_e, details) => {
//     logger.error('Renderer gone', details);
//   });
//   win.on('unresponsive', () => logger.warn('Window unresponsive'));
//   app.on('before-quit', () => {
//     cleanupMachineIpc?.();
//     retryWorker.stop();
//   });
//   // ✅ macOS behavior
//   app.on('activate', () => {
//     if (BrowserWindow.getAllWindows().length === 0) {
//       createMainWindow();
//     }
//   });
//   // ✅ Auto-update is disabled by default for controlled/offline deployments.
//   // Enable only after package.json publish.owner/repo points to a real release repository.
//   const autoUpdateEnabled =
//     app.isPackaged &&
//     process.env.MI_ENABLE_AUTO_UPDATE === '1' &&
//     process.env.MI_DISABLE_AUTO_UPDATE !== '1';
//   if (autoUpdateEnabled) {
//     setupAutoUpdater(win);
//   } else {
//     logger.info('Auto-update disabled for this build/session.');
//   }
// });
// app.on('window-all-closed', () => {
//   if (process.platform !== 'darwin') app.quit();
// });
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
const routing_rules_ipc_1 = require("./main/ipc/routing-rules.ipc");
const lis_test_order_profiles_ipc_1 = require("./main/ipc/lis-test-order-profiles.ipc");
const audit_readiness_ipc_1 = require("./main/ipc/audit-readiness.ipc");
// ✅ Catch crashes early (top-level)
process.on('uncaughtException', (err) => logger_1.logger.error('uncaughtException', err));
process.on('unhandledRejection', (err) => logger_1.logger.error('unhandledRejection', err));
// ✅ Linux packaged-runtime stability
// These switches must be registered before requestSingleInstanceLock(),
// before app.whenReady(), and before any BrowserWindow is created.
// Do not disable the software rasterizer; it is the safe fallback when GPU
// acceleration is disabled on some Linux desktop environments.
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
    electron_1.app.disableHardwareAcceleration();
}
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
electron_1.app.whenReady().then(async () => {
    logger_1.logger.info('App starting...');
    logger_1.logger.info('Applying security hardening...');
    await (0, harden_1.hardenSecurity)();
    logger_1.logger.info('Security hardening completed');
    // ✅ DB first
    logger_1.logger.info('Running database migrations...');
    await (0, migrations_1.runMigrations)();
    logger_1.logger.info('Database migrations completed');
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
    (0, routing_rules_ipc_1.registerRoutingRulesIpc)();
    (0, lis_test_order_profiles_ipc_1.registerLisTestOrderProfilesIpc)();
    (0, audit_readiness_ipc_1.registerAuditReadinessIpc)();
    // ✅ Window
    logger_1.logger.info('Creating main window...');
    const win = (0, main_window_1.createMainWindow)();
    logger_1.logger.info('Main window created');
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
    // ✅ Auto-update
    // Production packaged builds check updates by default.
    // Use MI_DISABLE_AUTO_UPDATE=1 only for local/offline package testing before release metadata exists.
    if (electron_1.app.isPackaged && process.env['MI_DISABLE_AUTO_UPDATE'] !== '1') {
        (0, autoUpdater_1.setupAutoUpdater)(win);
    }
    else if (electron_1.app.isPackaged) {
        logger_1.logger.info('Auto-update skipped because MI_DISABLE_AUTO_UPDATE=1');
    }
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
