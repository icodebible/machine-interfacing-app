// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { DeliveryAuditService } from '../services/delivery-audit.service';

// const svc = new DeliveryAuditService();

// const safeHandle = (channel: string, handler: any) => {
//     ipcMain.removeHandler(channel);
//     ipcMain.handle(channel, handler);
// };

// export function registerDeliveryAuditIpc() {
//     safeHandle(IPC_CHANNELS.DELIVERY_AUDIT_LIST, (_e: any, query?: any) => svc.list(query ?? {}));
//     safeHandle(IPC_CHANNELS.DELIVERY_AUDIT_QUERY, (_e: any, query?: any) => svc.list(query ?? {}));
// }


import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { DeliveryAuditService } from '../services/delivery-audit.service';

const svc = new DeliveryAuditService();

const safeHandle = (channel: string, handler: any) => {
  try {
    ipcMain.removeHandler(channel);
  } catch {}
  ipcMain.handle(channel, handler);
};

export function registerDeliveryAuditIpc() {
  safeHandle(IPC_CHANNELS.DELIVERY_AUDIT_LIST, (_e: any, query?: any) =>
    query ? svc.query(query) : svc.list(100),
  );
  safeHandle(IPC_CHANNELS.DELIVERY_AUDIT_QUERY, (_e: any, query?: any) => svc.query(query ?? {}));
}
