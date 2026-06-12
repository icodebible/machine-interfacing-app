import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { AuditService } from '../services/audit.service';
import { DeploymentReadinessService } from '../services/deployment-readiness.service';

const audit = new AuditService();
const readiness = new DeploymentReadinessService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerAuditReadinessIpc() {
    safeHandle(IPC_CHANNELS.AUDIT_EVENTS_QUERY, (_event: any, query?: any) => audit.query(query ?? {}));
    safeHandle(IPC_CHANNELS.AUDIT_EVENTS_SUMMARY, (_event: any, days?: number) => audit.summary(days ?? 7));
    safeHandle(IPC_CHANNELS.DEPLOYMENT_READINESS_CHECK, () => readiness.run());
}
