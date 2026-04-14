import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { ParsedMessageService } from '../protocols/parsed-message.service';

const svc = new ParsedMessageService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerMachinesParsedIpc() {
    svc.ensureTable();

    safeHandle(IPC_CHANNELS.MACHINES_PARSED_LIST, (_e: any, machineId: string, limit = 50) =>
        svc.listByMachine(machineId, limit),
    );
}
