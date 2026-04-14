import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { TargetSecretsService } from '../services/target-secrets.service';

const svc = new TargetSecretsService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerTargetSecretsIpc() {
    safeHandle(IPC_CHANNELS.TARGET_SECRETS_GET, (_e: any, targetId: string) => svc.get(targetId));

    safeHandle(IPC_CHANNELS.TARGET_SECRETS_SAVE, (_e: any, targetId: string, dto: any) =>
        svc.save(targetId, dto),
    );
}
