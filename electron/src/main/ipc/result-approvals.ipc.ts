// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { ResultWorkflowService } from '../services/result-workflow.service';
// import { ResultApprovalService } from '../services/result-approval.service';

// const workflow = new ResultWorkflowService();
// const approvals = new ResultApprovalService();

// const safeHandle = (channel: string, handler: any) => {
//     ipcMain.removeHandler(channel);
//     ipcMain.handle(channel, handler);
// };

// export function registerResultApprovalsIpc() {
//     safeHandle(IPC_CHANNELS.RESULTS_PENDING_APPROVALS, (_e: any, limit = 100) =>
//         workflow.listPendingApprovals(limit),
//     );

//     safeHandle(IPC_CHANNELS.RESULT_APPROVE, (_e: any, dto: any) => approvals.approve(dto));

//     safeHandle(IPC_CHANNELS.RESULT_REJECT, (_e: any, dto: any) => approvals.reject(dto));

//     safeHandle(IPC_CHANNELS.RESULT_APPROVALS_LIST, (_e: any, normalizedResultId: string) =>
//         approvals.listByResult(normalizedResultId),
//     );

//     safeHandle(IPC_CHANNELS.RESULT_APPROVALS_ALL, (_e: any, limit = 100) =>
//         approvals.listAll(limit),
//     );
// }

// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { ResultApprovalService } from '../services/result-approval.service';

// const svc = new ResultApprovalService();

// const safeHandle = (channel: string, handler: any) => {
//     try {
//         ipcMain.removeHandler(channel);
//     } catch { }
//     ipcMain.handle(channel, handler);
// };

// export function registerResultApprovalsIpc() {
//     safeHandle(IPC_CHANNELS.RESULTS_PENDING_APPROVALS, (_e: any, limit?: number) =>
//         svc.listPending(limit ?? 100),
//     );
//     safeHandle(IPC_CHANNELS.RESULT_APPROVE, (_e: any, dto: any) => svc.approve(dto));
//     safeHandle(IPC_CHANNELS.RESULT_REJECT, (_e: any, dto: any) => svc.reject(dto));
//     safeHandle(IPC_CHANNELS.RESULT_APPROVALS_LIST, (_e: any, normalizedResultId: string) =>
//         svc.listByResult(normalizedResultId),
//     );
//     safeHandle(IPC_CHANNELS.RESULT_APPROVALS_ALL, (_e: any, limit?: number) =>
//         svc.listAll(limit ?? 100),
//     );


//     safeHandle(IPC_CHANNELS.RESULT_REEVALUATE_POLICY, (_e: any, normalizedResultId: string) =>
//         svc.reevaluatePolicy(normalizedResultId),
//     );
// }



import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { ResultApprovalService } from '../services/result-approval.service';

const svc = new ResultApprovalService();

const safeHandle = (channel: string, handler: any) => {
    try {
        ipcMain.removeHandler(channel);
    } catch { }
    ipcMain.handle(channel, handler);
};

export function registerResultApprovalsIpc() {
    safeHandle(IPC_CHANNELS.RESULTS_PENDING_APPROVALS, (_e: any, limit?: number) =>
        svc.listPending(limit ?? 100),
    );
    safeHandle(IPC_CHANNELS.RESULT_APPROVE, (_e: any, dto: any) => svc.approve(dto));
    safeHandle(IPC_CHANNELS.RESULT_REJECT, (_e: any, dto: any) => svc.reject(dto));
    safeHandle(IPC_CHANNELS.RESULT_APPROVALS_LIST, (_e: any, normalizedResultId: string) =>
        svc.listByResult(normalizedResultId),
    );
    safeHandle(IPC_CHANNELS.RESULT_APPROVALS_ALL, (_e: any, limit?: number) =>
        svc.listAll(limit ?? 100),
    );
    safeHandle(IPC_CHANNELS.RESULT_REEVALUATE_POLICY, (_e: any, normalizedResultId: string) =>
        svc.reevaluatePolicy(normalizedResultId),
    );
}

