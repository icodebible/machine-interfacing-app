import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { ApprovalPolicyService } from '../services/approval-policy.service';

const svc = new ApprovalPolicyService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerApprovalPoliciesIpc() {
    safeHandle(IPC_CHANNELS.APPROVAL_POLICIES_LIST, () => svc.list());
    safeHandle(IPC_CHANNELS.APPROVAL_POLICIES_CREATE, (_e: any, dto: any) => svc.create(dto));
    safeHandle(IPC_CHANNELS.APPROVAL_POLICIES_UPDATE, (_e: any, id: any, dto: any) =>
        svc.update(id, dto),
    );
    safeHandle(IPC_CHANNELS.APPROVAL_POLICIES_DELETE, (_e: any, id: any) => svc.delete(id));
}
