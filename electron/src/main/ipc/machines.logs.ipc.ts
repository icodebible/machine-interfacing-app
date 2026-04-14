import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { MachineTrafficLogService } from '../runtime/machine-traffic-log.service';

const svc = new MachineTrafficLogService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerMachinesLogsIpc() {
    safeHandle(IPC_CHANNELS.MACHINES_LOGS_LIST, (_e: any, machineId: string, limit?: number) =>
        svc.listByMachine(machineId, limit ?? 50),
    );

    safeHandle(IPC_CHANNELS.MACHINES_LOGS_CLEAR, (_e: any, machineId: string) =>
        svc.clearMachineLogs(machineId),
    );
}
