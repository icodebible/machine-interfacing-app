"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLisTestOrderProfilesIpc = registerLisTestOrderProfilesIpc;
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
