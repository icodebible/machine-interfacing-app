"use strict";
// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { LisTestOrderProfileService } from '../services/lis-test-order-profile.service';
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLisTestOrderProfilesIpc = registerLisTestOrderProfilesIpc;
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
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const lis_test_order_profile_service_1 = require("../services/lis-test-order-profile.service");
const service = new lis_test_order_profile_service_1.LisTestOrderProfileService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerLisTestOrderProfilesIpc() {
    safeHandle(channels_1.IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_LIST, (_event, targetId) => service.list(targetId ?? null));
    safeHandle(channels_1.IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_GET, (_event, id) => service.get(id));
    safeHandle(channels_1.IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_SAVE, (_event, payload) => service.save(payload));
    safeHandle(channels_1.IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_SET_ENABLED, (_event, id, enabled) => service.setEnabled(id, enabled));
    safeHandle(channels_1.IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_DELETE, (_event, id) => service.delete(id));
}
