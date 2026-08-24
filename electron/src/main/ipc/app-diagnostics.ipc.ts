// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { AppDiagnosticsService } from '../services/app-diagnostics.service';
// import { AuditService } from '../services/audit.service';

// const diagnostics = new AppDiagnosticsService();
// const audit = new AuditService();

// type IpcHandler = (event: Electron.IpcMainInvokeEvent, ...args: any[]) => unknown | Promise<unknown>;

// const safeHandle = (channel: string, handler: IpcHandler) => {
//     try {
//         ipcMain.removeHandler(channel);
//     } catch {
//         // No existing handler. Safe to ignore.
//     }

//     ipcMain.handle(channel, handler);
// };

// export function registerAppDiagnosticsIpc() {
//     /*
//      * This handler may be registered after registerAuditReadinessIpc(), which also exposes
//      * diagnostics channels for backward compatibility. Use removeHandler + handle instead
//      * of ipcMain.handle directly so startup remains idempotent in development watch mode
//      * and in packaged builds.
//      */
//     safeHandle(IPC_CHANNELS.APP_DIAGNOSTICS_GET, async () => diagnostics.getDiagnostics());

//     safeHandle(IPC_CHANNELS.APP_DATABASE_BACKUP_CREATE, async () => {
//         const result = await diagnostics.createDatabaseBackup();
//         audit.record({
//             source: 'SECURITY',
//             category: 'PACKAGING',
//             action: 'DATABASE_BACKUP_CREATED',
//             severity: 'INFO',
//             status: 'SUCCESS',
//             entityType: 'database',
//             entityId: 'machine-interfacing.sqlite',
//             entityLabel: 'Local SQLite database',
//             summary: 'Local database backup was created from deployment readiness diagnostics.',
//             details: { path: result.path, sizeBytes: result.sizeBytes, createdAt: result.createdAt },
//         });
//         return result;
//     });
// }


import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { AppDiagnosticsService } from '../services/app-diagnostics.service';
import { AuditService } from '../services/audit.service';

const diagnostics = new AppDiagnosticsService();
const audit = new AuditService();

export function registerAppDiagnosticsIpc() {
    /*
     * Production ownership rule:
     * - app-diagnostics.ipc owns app diagnostics and database backup channels.
     * - audit-readiness.ipc owns audit/readiness channels only.
     *
     * Do not remove and re-register existing handlers here. A duplicate handler
     * should fail loudly during development because it means two modules are
     * claiming ownership of the same IPC contract.
     */
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
