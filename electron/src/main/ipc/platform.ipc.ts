import { clipboard, ipcMain } from 'electron';

import { LabsService } from '../services/labs.service';
import { IPC_CHANNELS } from '../../shared/channels';

import { MachinesService } from '../services/machines.service';
import { TargetsService } from '../services/targets.service';
import { LogsService } from '../services/logs.service';

export function registerPlatformIpc() {
    const labs = new LabsService();
    const machines = new MachinesService();
    const targets = new TargetsService();
    const logs = new LogsService();

    ipcMain.handle(IPC_CHANNELS.LABS_LIST, () => labs.list());
    ipcMain.handle(IPC_CHANNELS.LABS_CREATE, (_e, dto) => labs.create(dto));
    ipcMain.handle(IPC_CHANNELS.LABS_UPDATE, (_e, id, dto) => labs.update(id, dto));
    ipcMain.handle(IPC_CHANNELS.LABS_DELETE, (_e, id) => labs.delete(id));

    ipcMain.handle(IPC_CHANNELS.TARGETS_LIST, () => targets.list());
    ipcMain.handle(IPC_CHANNELS.TARGETS_CREATE, (_e, dto) => targets.create(dto));
    ipcMain.handle(IPC_CHANNELS.TARGETS_UPDATE, (_e, id, dto) => targets.update(id, dto));
    ipcMain.handle(IPC_CHANNELS.TARGETS_DELETE, (_e, id) => targets.delete(id));
    ipcMain.handle(IPC_CHANNELS.TARGETS_TEST, (_e, id) => targets.test(id));
    ipcMain.handle(IPC_CHANNELS.TARGETS_HARNESS_SEND, (_e, id, payload, label) =>
        targets.harnessSend(id, payload, label),
    );

    ipcMain.handle(IPC_CHANNELS.LOGS_QUERY, (_e, q) => logs.query(q));

    ipcMain.handle('clipboard:copy', async (_e, text: string) => {
        clipboard.writeText(text);
        return true;
    });
}
