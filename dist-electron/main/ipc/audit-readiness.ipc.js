"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAuditReadinessIpc = registerAuditReadinessIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const audit_service_1 = require("../services/audit.service");
const deployment_readiness_service_1 = require("../services/deployment-readiness.service");
const audit = new audit_service_1.AuditService();
const readiness = new deployment_readiness_service_1.DeploymentReadinessService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerAuditReadinessIpc() {
    safeHandle(channels_1.IPC_CHANNELS.AUDIT_EVENTS_QUERY, (_event, query) => audit.query(query ?? {}));
    safeHandle(channels_1.IPC_CHANNELS.AUDIT_EVENTS_SUMMARY, (_event, days) => audit.summary(days ?? 7));
    safeHandle(channels_1.IPC_CHANNELS.DEPLOYMENT_READINESS_CHECK, () => readiness.run());
}
