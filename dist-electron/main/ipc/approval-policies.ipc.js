"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerApprovalPoliciesIpc = registerApprovalPoliciesIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const approval_policy_service_1 = require("../services/approval-policy.service");
const svc = new approval_policy_service_1.ApprovalPolicyService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerApprovalPoliciesIpc() {
    safeHandle(channels_1.IPC_CHANNELS.APPROVAL_POLICIES_LIST, () => svc.list());
    safeHandle(channels_1.IPC_CHANNELS.APPROVAL_POLICIES_CREATE, (_e, dto) => svc.create(dto));
    safeHandle(channels_1.IPC_CHANNELS.APPROVAL_POLICIES_UPDATE, (_e, id, dto) => svc.update(id, dto));
    safeHandle(channels_1.IPC_CHANNELS.APPROVAL_POLICIES_DELETE, (_e, id) => svc.delete(id));
}
