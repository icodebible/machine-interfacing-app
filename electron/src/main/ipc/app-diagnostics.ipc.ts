import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { AppDiagnosticsService } from '../services/app-diagnostics.service';
import { AuditService } from '../services/audit.service';

const diagnostics = new AppDiagnosticsService();
const audit = new AuditService();

export function registerAppDiagnosticsIpc() {
    ipcMain.handle(IPC_CHANNELS.APP_DIAGNOSTICS_GET, async () => diagnostics.getDiagnostics());

    ipcMain.handle(IPC_CHANNELS.APP_DATABASE_BACKUP_CREATE, async () => {
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
