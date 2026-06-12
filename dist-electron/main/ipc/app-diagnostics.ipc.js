"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAppDiagnosticsIpc = registerAppDiagnosticsIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const app_diagnostics_service_1 = require("../services/app-diagnostics.service");
const audit_service_1 = require("../services/audit.service");
const diagnostics = new app_diagnostics_service_1.AppDiagnosticsService();
const audit = new audit_service_1.AuditService();
function registerAppDiagnosticsIpc() {
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.APP_DIAGNOSTICS_GET, async () => diagnostics.getDiagnostics());
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.APP_DATABASE_BACKUP_CREATE, async () => {
        const result = await diagnostics.createDatabaseBackup();
        audit.record({
            source: 'SECURITY',
            category: 'PACKAGING',
            action: 'DATABASE_BACKUP_CREATED',
            severity: 'INFO',
            status: 'SUCCESS',
            entityType: 'database',
            entityId: 'machine-interfacing.sqlite',
            entityLabel: 'Local SQLite database',
            summary: 'Local database backup was created from deployment readiness diagnostics.',
            details: { path: result.path, sizeBytes: result.sizeBytes, createdAt: result.createdAt },
        });
        return result;
    });
}
