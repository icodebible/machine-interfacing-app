import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { TargetTransformPreviewService } from '../transformers/target-transform-preview.service';

const svc = new TargetTransformPreviewService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerTargetTransformPreviewIpc() {
    safeHandle(
        IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW,
        (_e: any, targetId: string, normalizedResultId: string) =>
            svc.preview(targetId, normalizedResultId),
    );
    safeHandle(IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_QUEUE, (_e: any, queueId: string) =>
        svc.previewFromQueue(queueId),
    );
    safeHandle(
        IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_DELIVERY_HISTORY,
        (_e: any, deliveryHistoryId: string) => svc.previewFromDeliveryHistory(deliveryHistoryId),
    );
}
