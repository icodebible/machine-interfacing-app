import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { NormalizedResultService } from '../normalizers/normalized-result.service';

const svc = new NormalizedResultService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerMachinesNormalizedIpc() {
    svc.ensureTable();

    safeHandle(IPC_CHANNELS.MACHINES_NORMALIZED_LIST, (_e: any, machineId: string, limit = 50) =>
        svc.listByMachine(machineId, limit),
    );
}
