"use strict";
// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { MappingsService } from '../services/mappings.service';
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMappingsIpc = registerMappingsIpc;
// const svc = new MappingsService();
// const safeHandle = (channel: string, handler: any) => {
//     ipcMain.removeHandler(channel);
//     ipcMain.handle(channel, handler);
// };
// export function registerMappingsIpc() {
//     safeHandle(IPC_CHANNELS.MAPPINGS_LIST, () => svc.list());
//     safeHandle(IPC_CHANNELS.MAPPINGS_CREATE, (_e: any, dto: any) => svc.create(dto));
//     safeHandle(IPC_CHANNELS.MAPPINGS_UPDATE, (_e: any, id: string, dto: any) => svc.update(id, dto));
//     safeHandle(IPC_CHANNELS.MAPPINGS_DELETE, (_e: any, id: string) => svc.delete(id));
//     safeHandle(IPC_CHANNELS.MAPPINGS_VALIDATE, (_e: any, targetType: string) =>
//         svc.validate(targetType),
//     );
// }
// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { MappingsService } from '../services/mappings.service';
// const svc = new MappingsService();
// const safeHandle = (channel: string, handler: any) => {
//     ipcMain.removeHandler(channel);
//     ipcMain.handle(channel, handler);
// };
// export function registerMappingsIpc() {
//     safeHandle(IPC_CHANNELS.MAPPINGS_LIST, () => svc.list());
//     safeHandle(IPC_CHANNELS.MAPPINGS_CREATE, (_e: any, dto: any) => svc.create(dto));
//     safeHandle(IPC_CHANNELS.MAPPINGS_UPDATE, (_e: any, id: string, dto: any) => svc.update(id, dto));
//     safeHandle(IPC_CHANNELS.MAPPINGS_DELETE, (_e: any, id: string) => svc.delete(id));
//     safeHandle(IPC_CHANNELS.MAPPINGS_VALIDATE, (_e: any, targetType: string) =>
//         svc.validate(targetType),
//     );
//     safeHandle(IPC_CHANNELS.MAPPINGS_OPENMRS_LIS_DISCOVER, (_e: any, dto: any) =>
//         svc.discoverOpenMrsLisMetadata(dto),
//     );
//     safeHandle(IPC_CHANNELS.MAPPINGS_OPENMRS_LIS_SEED, (_e: any, dto: any) =>
//         svc.seedOpenMrsLisMappings(dto),
//     );
// }
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const mappings_service_1 = require("../services/mappings.service");
const svc = new mappings_service_1.MappingsService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerMappingsIpc() {
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_LIST, () => svc.list());
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_CREATE, (_e, dto) => svc.create(dto));
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_UPDATE, (_e, id, dto) => svc.update(id, dto));
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_DELETE, (_e, id) => svc.delete(id));
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_VALIDATE, (_e, targetType) => svc.validate(targetType));
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_OPENMRS_LIS_DISCOVER, (_e, dto) => svc.discoverOpenMrsLisMetadata(dto));
    safeHandle(channels_1.IPC_CHANNELS.MAPPINGS_OPENMRS_LIS_SEED, (_e, dto) => svc.seedOpenMrsLisMappings(dto));
}
