// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { OutboundQueueService } from '../services/outbound-queue.service';
// import { DeliveryOperationsService } from '../services/delivery-operations.service';

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

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { OutboundQueueService } from '../services/outbound-queue.service';

const svc = new OutboundQueueService();

const safeHandle = (channel: string, handler: any) => {
    try {
        ipcMain.removeHandler(channel);
    } catch { }
    ipcMain.handle(channel, handler);
};

export function registerOutboundQueueIpc() {
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_LIST, (_e: any, limit?: number) => svc.list(limit ?? 100));
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_PENDING, (_e: any, limit?: number) =>
        svc.listPending(limit ?? 100),
    );
    safeHandle(IPC_CHANNELS.DELIVERY_HISTORY_LIST, (_e: any, limit?: number) =>
        svc.listDelivered(limit ?? 100),
    );
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_RETRY, (_e: any, queueId: string) => svc.retry(queueId));
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_REQUEUE, (_e: any, queueId: string) =>
        svc.requeue(queueId),
    );
    safeHandle(IPC_CHANNELS.OUTBOUND_QUEUE_SEND_NOW, (_e: any, queueId: string) =>
        svc.sendNow(queueId, 'SEND_NOW'),
    );
}
