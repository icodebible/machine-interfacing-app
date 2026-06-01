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

import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../shared/channels";
import { MappingsService } from "../services/mappings.service";

const svc = new MappingsService();

const safeHandle = (channel: string, handler: any) => {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
};

export function registerMappingsIpc() {
  safeHandle(IPC_CHANNELS.MAPPINGS_LIST, () => svc.list());
  safeHandle(IPC_CHANNELS.MAPPINGS_CREATE, (_e: any, dto: any) =>
    svc.create(dto),
  );
  safeHandle(IPC_CHANNELS.MAPPINGS_UPDATE, (_e: any, id: string, dto: any) =>
    svc.update(id, dto),
  );
  safeHandle(IPC_CHANNELS.MAPPINGS_DELETE, (_e: any, id: string) =>
    svc.delete(id),
  );
  safeHandle(IPC_CHANNELS.MAPPINGS_VALIDATE, (_e: any, targetType: string) =>
    svc.validate(targetType),
  );

  safeHandle(IPC_CHANNELS.MAPPINGS_OPENMRS_LIS_DISCOVER, (_e: any, dto: any) =>
    svc.discoverOpenMrsLisMetadata(dto),
  );

  safeHandle(IPC_CHANNELS.MAPPINGS_OPENMRS_LIS_SEED, (_e: any, dto: any) =>
    svc.seedOpenMrsLisMappings(dto),
  );
}

