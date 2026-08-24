// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { AuditService } from '../services/audit.service';
// import { AppDiagnosticsService } from '../services/app-diagnostics.service';
// import { DeploymentReadinessService } from '../services/deployment-readiness.service';

// const audit = new AuditService();
// const readiness = new DeploymentReadinessService();
// const diagnostics = new AppDiagnosticsService();

// type IpcHandler = (event: Electron.IpcMainInvokeEvent, ...args: any[]) => unknown | Promise<unknown>;

// const safeHandle = (channel: string, handler: IpcHandler) => {
//     try {
//         ipcMain.removeHandler(channel);
//     } catch {
//         // No existing handler. Safe to ignore.
//     }

//     ipcMain.handle(channel, handler);
// };

// export function registerAuditReadinessIpc() {
//     safeHandle(IPC_CHANNELS.AUDIT_EVENTS_QUERY, (_event, query?: any) => audit.query(query ?? {}));
//     safeHandle(IPC_CHANNELS.AUDIT_EVENTS_SUMMARY, (_event, days?: number) => audit.summary(days ?? 7));
//     safeHandle(IPC_CHANNELS.DEPLOYMENT_READINESS_CHECK, () => readiness.run());

//     safeHandle(IPC_CHANNELS.APP_DIAGNOSTICS_GET, () => diagnostics.getDiagnostics());
//     safeHandle(IPC_CHANNELS.APP_DATABASE_BACKUP_CREATE, () => diagnostics.createDatabaseBackup());
// }


import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { AuditService } from '../services/audit.service';
import { DeploymentReadinessService } from '../services/deployment-readiness.service';

const audit = new AuditService();
const readiness = new DeploymentReadinessService();

export function registerAuditReadinessIpc() {
    /*
     * Production ownership rule:
     * - audit-readiness.ipc owns only audit and deployment readiness channels.
     * - app-diagnostics.ipc owns APP_DIAGNOSTICS_GET and APP_DATABASE_BACKUP_CREATE.
     */
    ipcMain.handle(IPC_CHANNELS.AUDIT_EVENTS_QUERY, (_event, query?: any) => audit.query(query ?? {}));
    ipcMain.handle(IPC_CHANNELS.AUDIT_EVENTS_SUMMARY, (_event, days?: number) => audit.summary(days ?? 7));
    ipcMain.handle(IPC_CHANNELS.DEPLOYMENT_READINESS_CHECK, () => readiness.run());
}

