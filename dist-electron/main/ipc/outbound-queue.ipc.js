"use strict";
// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { OutboundQueueService } from '../services/outbound-queue.service';
// import { DeliveryOperationsService } from '../services/delivery-operations.service';
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOutboundQueueIpc = registerOutboundQueueIpc;
// const svc = new OutboundQueueService();
// const safeHandle = (channel: string, handler: any) => {
//     ipcMain.removeHandler(channel);
//     ipcMain.handle(channel, handler);
// };
// export function registerOutboundQueueIpc() {
//     const delivery = new DeliveryOperationsService();
//     safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_LIST, (_e: any, limit = 100) => svc.list(limit));
//     safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_PENDING, (_e: any, limit = 100) => svc.listPending(limit));
//     safeHandle(IPC_CHANNELS.DELIVERY_HISTORY_LIST, (_e: any, limit = 100) =>
//         svc.listDelivered(limit),
//     );
//     safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_RETRY, (_e: any, queueId: string) => svc.retry(queueId));
//     safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_REQUEUE, (_e: any, queueId: string) =>
//         svc.requeue(queueId),
//     );
//     safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_SEND_NOW, (_e: any, queueId: string) =>
//         delivery.sendNow(queueId),
//     );
// }
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const outbound_queue_service_1 = require("../services/outbound-queue.service");
const svc = new outbound_queue_service_1.OutboundQueueService();
const safeHandle = (channel, handler) => {
    try {
        electron_1.ipcMain.removeHandler(channel);
    }
    catch { }
    electron_1.ipcMain.handle(channel, handler);
};
function registerOutboundQueueIpc() {
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_LIST, (_e, limit) => svc.list(limit ?? 100));
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_PENDING, (_e, limit) => svc.listPending(limit ?? 100));
    safeHandle(channels_1.IPC_CHANNELS.DELIVERY_HISTORY_LIST, (_e, limit) => svc.listDelivered(limit ?? 100));
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_RETRY, (_e, queueId) => svc.retry(queueId));
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_REQUEUE, (_e, queueId) => svc.requeue(queueId));
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_SEND_NOW, (_e, queueId) => svc.sendNow(queueId, 'SEND_NOW'));
}
