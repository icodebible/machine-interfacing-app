import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { OutboundQueueService } from '../services/outbound-queue.service';

const service = new OutboundQueueService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerOutboundQueueIpc() {
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_LIST, (_event: any, limit?: number) => service.list(limit ?? 100));
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_PENDING, (_event: any, limit?: number) => service.listPending(limit ?? 100));
    safeHandle(IPC_CHANNELS.DELIVERY_HISTORY_LIST, (_event: any, limit?: number) => service.listDelivered(limit ?? 100));
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_RETRY, (_event: any, queueId: string) => service.retry(queueId));
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_REQUEUE, (_event: any, queueId: string) => service.requeue(queueId));
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_SEND_NOW, (_event: any, queueId: string) => service.sendNow(queueId));
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_REBUILD_PAYLOAD, (_event: any, queueId: string) => service.rebuildPayload(queueId));
}
