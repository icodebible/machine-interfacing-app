import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { RolesService } from '../services/roles.service';

const svc = new RolesService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerRolesIpc() {
    safeHandle(IPC_CHANNELS.ROLES_LIST, () => svc.list());
    safeHandle(IPC_CHANNELS.ROLES_CREATE, (_e: any, dto: any) => svc.create(dto));
    safeHandle(IPC_CHANNELS.ROLES_UPDATE, (_e: any, id: any, dto: any) => svc.update(id, dto));
    safeHandle(IPC_CHANNELS.ROLES_DELETE, (_e: any, id: any) => svc.delete(id));
    safeHandle(IPC_CHANNELS.ROLES_AUTHORITIES_CATALOG, () => svc.authoritiesCatalog());
}
