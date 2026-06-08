"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerOutboundQueueIpc = registerOutboundQueueIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const outbound_queue_service_1 = require("../services/outbound-queue.service");
const service = new outbound_queue_service_1.OutboundQueueService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerOutboundQueueIpc() {
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_LIST, (_event, limit) => service.list(limit ?? 100));
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_PENDING, (_event, limit) => service.listPending(limit ?? 100));
    safeHandle(channels_1.IPC_CHANNELS.DELIVERY_HISTORY_LIST, (_event, limit) => service.listDelivered(limit ?? 100));
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_RETRY, (_event, queueId) => service.retry(queueId));
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_REQUEUE, (_event, queueId) => service.requeue(queueId));
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_SEND_NOW, (_event, queueId) => service.sendNow(queueId));
    safeHandle(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_REBUILD_PAYLOAD, (_event, queueId) => service.rebuildPayload(queueId));
}
