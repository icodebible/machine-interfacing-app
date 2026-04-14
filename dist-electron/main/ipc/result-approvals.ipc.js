"use strict";
// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { ResultWorkflowService } from '../services/result-workflow.service';
// import { ResultApprovalService } from '../services/result-approval.service';
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerResultApprovalsIpc = registerResultApprovalsIpc;
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
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const result_approval_service_1 = require("../services/result-approval.service");
const svc = new result_approval_service_1.ResultApprovalService();
const safeHandle = (channel, handler) => {
    try {
        electron_1.ipcMain.removeHandler(channel);
    }
    catch { }
    electron_1.ipcMain.handle(channel, handler);
};
function registerResultApprovalsIpc() {
    safeHandle(channels_1.IPC_CHANNELS.RESULTS_PENDING_APPROVALS, (_e, limit) => svc.listPending(limit ?? 100));
    safeHandle(channels_1.IPC_CHANNELS.RESULT_APPROVE, (_e, dto) => svc.approve(dto));
    safeHandle(channels_1.IPC_CHANNELS.RESULT_REJECT, (_e, dto) => svc.reject(dto));
    safeHandle(channels_1.IPC_CHANNELS.RESULT_APPROVALS_LIST, (_e, normalizedResultId) => svc.listByResult(normalizedResultId));
    safeHandle(channels_1.IPC_CHANNELS.RESULT_APPROVALS_ALL, (_e, limit) => svc.listAll(limit ?? 100));
    safeHandle(channels_1.IPC_CHANNELS.RESULT_REEVALUATE_POLICY, (_e, normalizedResultId) => svc.reevaluatePolicy(normalizedResultId));
}
