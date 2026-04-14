"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTargetTransformPreviewIpc = registerTargetTransformPreviewIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const target_transform_preview_service_1 = require("../transformers/target-transform-preview.service");
const svc = new target_transform_preview_service_1.TargetTransformPreviewService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerTargetTransformPreviewIpc() {
    safeHandle(channels_1.IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW, (_e, targetId, normalizedResultId) => svc.preview(targetId, normalizedResultId));
    safeHandle(channels_1.IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_QUEUE, (_e, queueId) => svc.previewFromQueue(queueId));
    safeHandle(channels_1.IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_DELIVERY_HISTORY, (_e, deliveryHistoryId) => svc.previewFromDeliveryHistory(deliveryHistoryId));
}
