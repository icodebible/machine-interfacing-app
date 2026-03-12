import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { MachinesService } from '../services/machines.service';

const svc = new MachinesService();

export function registerMachinesCrudIpc() {
    // ipcMain.handle(IPC_CHANNELS.MACHINES_LIST, () => svc.list());
    // ipcMain.handle(IPC_CHANNELS.MACHINES_CREATE, (_e, dto) => svc.create(dto));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_UPDATE, (_e, id: string, dto) => svc.update(id, dto));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_DELETE, (_e, id: string) => svc.delete(id));

    // ipcMain.handle(IPC_CHANNELS.MACHINES_CONNECT, (_e, id: string) => svc.connect(id));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_DISCONNECT, (_e, id: string) => svc.disconnect(id));

    safeHandle(IPC_CHANNELS.MACHINES_LIST, () => svc.list());
    safeHandle(IPC_CHANNELS.MACHINES_CREATE, (_e: any, dto: any) => svc.create(dto));
    safeHandle(IPC_CHANNELS.MACHINES_UPDATE, (_e: any, id: string, dto: any) => svc.update(id, dto));
    safeHandle(IPC_CHANNELS.MACHINES_DELETE, (_e: any, id: string) => svc.delete(id));
    safeHandle(IPC_CHANNELS.MACHINES_CONNECT, (_e: any, id: string) => svc.connect(id));
    safeHandle(IPC_CHANNELS.MACHINES_DISCONNECT, (_e: any, id: string) => svc.disconnect(id));
    safeHandle(IPC_CHANNELS.MACHINES_TEST, (_e: any, machine: any) => svc.test(machine));

    // // Optional foundation test hook (basic validation for now)
    // ipcMain.handle(IPC_CHANNELS.MACHINES_TEST, (_e, machine: any) => {
    //     if (!machine?.connection_type) return { ok: false, message: 'Missing connection_type' };

    //     if (machine.connection_type === 'TCP' || machine.connection_type === 'HL7_MLLP') {
    //         if (!machine.tcp_host || !machine.tcp_port)
    //             return { ok: false, message: 'Missing host/port' };
    //         return { ok: true, message: 'TCP/MLLP config present (socket test can be added next)' };
    //     }

    //     if (machine.connection_type === 'SERIAL') {
    //         if (!machine.serial_path) return { ok: false, message: 'Missing serial_path' };
    //         return { ok: true, message: 'Serial config present (open test added next)' };
    //     }

    //     if (machine.connection_type === 'FILE_WATCHER') {
    //         if (!machine.watch_dir) return { ok: false, message: 'Missing watch_dir' };
    //         return { ok: true, message: 'Watcher config present' };
    //     }

    //     return { ok: true, message: 'Config present' };
    // });

    return () => {
        ipcMain.removeHandler(IPC_CHANNELS.MACHINES_LIST);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINES_CREATE);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINES_UPDATE);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINES_DELETE);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINES_CONNECT);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINES_DISCONNECT);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINES_TEST);
    };
}

const safeHandle = (channel: string, handler: any) => {
    try {
        ipcMain.removeHandler(channel);
    } catch { }
    ipcMain.handle(channel, handler);
};
