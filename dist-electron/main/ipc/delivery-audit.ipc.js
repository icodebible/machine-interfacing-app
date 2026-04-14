"use strict";
// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { DeliveryAuditService } from '../services/delivery-audit.service';
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDeliveryAuditIpc = registerDeliveryAuditIpc;
// const svc = new DeliveryAuditService();
// const safeHandle = (channel: string, handler: any) => {
//     ipcMain.removeHandler(channel);
//     ipcMain.handle(channel, handler);
// };
// export function registerDeliveryAuditIpc() {
//     safeHandle(IPC_CHANNELS.DELIVERY_AUDIT_LIST, (_e: any, query?: any) => svc.list(query ?? {}));
//     safeHandle(IPC_CHANNELS.DELIVERY_AUDIT_QUERY, (_e: any, query?: any) => svc.list(query ?? {}));
// }
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const delivery_audit_service_1 = require("../services/delivery-audit.service");
const svc = new delivery_audit_service_1.DeliveryAuditService();
const safeHandle = (channel, handler) => {
    try {
        electron_1.ipcMain.removeHandler(channel);
    }
    catch { }
    electron_1.ipcMain.handle(channel, handler);
};
function registerDeliveryAuditIpc() {
    safeHandle(channels_1.IPC_CHANNELS.DELIVERY_AUDIT_LIST, (_e, query) => query ? svc.query(query) : svc.list(100));
    safeHandle(channels_1.IPC_CHANNELS.DELIVERY_AUDIT_QUERY, (_e, query) => svc.query(query ?? {}));
}
