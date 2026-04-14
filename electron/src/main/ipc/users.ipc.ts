import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { UsersService } from '../services/users.service';

const svc = new UsersService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerUsersIpc() {
    safeHandle(IPC_CHANNELS.USERS_LIST, () => svc.list());
    safeHandle(IPC_CHANNELS.USERS_CREATE, (_e: any, dto: any) => svc.create(dto));
    safeHandle(IPC_CHANNELS.USERS_UPDATE, (_e: any, id: any, dto: any) => svc.update(id, dto));
    safeHandle(IPC_CHANNELS.USERS_DELETE, (_e: any, id: any) => svc.delete(id));
    safeHandle(IPC_CHANNELS.USERS_RESET_PASSWORD, (_e: any, id: any, newPassword: string) =>
        svc.resetPassword(id, newPassword),
    );
}
