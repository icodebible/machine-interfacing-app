// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { LisTestOrderProfileService } from '../services/lis-test-order-profile.service';

// const service = new LisTestOrderProfileService();

// const safeHandle = (channel: string, handler: any) => {
//   ipcMain.removeHandler(channel);
//   ipcMain.handle(channel, handler);
// };

// export function registerLisTestOrderProfilesIpc() {
//   safeHandle(IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_LIST, (_event: any, targetId?: string | null) =>
//     service.list(targetId ?? null),
//   );
//   safeHandle(IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_GET, (_event: any, id: string) => service.get(id));
//   safeHandle(IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_SAVE, (_event: any, payload: any) =>
//     service.save(payload),
//   );
//   safeHandle(IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_SET_ENABLED, (_event: any, id: string, enabled: number) =>
//     service.setEnabled(id, enabled),
//   );
//   safeHandle(IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_DELETE, (_event: any, id: string) =>
//     service.delete(id),
//   );
// }
import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { LisTestOrderProfileService } from '../services/lis-test-order-profile.service';

const service = new LisTestOrderProfileService();

const safeHandle = (channel: string, handler: any) => {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
};

export function registerLisTestOrderProfilesIpc() {
  safeHandle(IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_LIST, (_event: any, targetId?: string | null) =>
    service.list(targetId ?? null),
  );
  safeHandle(IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_GET, (_event: any, id: string) => service.get(id));
  safeHandle(IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_SAVE, (_event: any, payload: any) =>
    service.save(payload),
  );
  safeHandle(IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_SET_ENABLED, (_event: any, id: string, enabled: number) =>
    service.setEnabled(id, enabled),
  );
  safeHandle(IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_DELETE, (_event: any, id: string) =>
    service.delete(id),
  );
}
