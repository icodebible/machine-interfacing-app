"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuditReadinessIpc = registerAuditReadinessIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const audit_service_1 = require("../services/audit.service");
const app_diagnostics_service_1 = require("../services/app-diagnostics.service");
const deployment_readiness_service_1 = require("../services/deployment-readiness.service");
const audit = new audit_service_1.AuditService();
const readiness = new deployment_readiness_service_1.DeploymentReadinessService();
const diagnostics = new app_diagnostics_service_1.AppDiagnosticsService();
const safeHandle = (channel, handler) => {
    try {
        electron_1.ipcMain.removeHandler(channel);
    }
    catch {
        // No existing handler. Safe to ignore.
    }
    electron_1.ipcMain.handle(channel, handler);
};
function registerAuditReadinessIpc() {
    safeHandle(channels_1.IPC_CHANNELS.AUDIT_EVENTS_QUERY, (_event, query) => audit.query(query ?? {}));
    safeHandle(channels_1.IPC_CHANNELS.AUDIT_EVENTS_SUMMARY, (_event, days) => audit.summary(days ?? 7));
    safeHandle(channels_1.IPC_CHANNELS.DEPLOYMENT_READINESS_CHECK, () => readiness.run());
    safeHandle(channels_1.IPC_CHANNELS.APP_DIAGNOSTICS_GET, () => diagnostics.getDiagnostics());
    safeHandle(channels_1.IPC_CHANNELS.APP_DATABASE_BACKUP_CREATE, () => diagnostics.createDatabaseBackup());
}
