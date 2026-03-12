"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMachinesCrudIpc = registerMachinesCrudIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const machines_service_1 = require("../services/machines.service");
const svc = new machines_service_1.MachinesService();
function registerMachinesCrudIpc() {
    // ipcMain.handle(IPC_CHANNELS.MACHINES_LIST, () => svc.list());
    // ipcMain.handle(IPC_CHANNELS.MACHINES_CREATE, (_e, dto) => svc.create(dto));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_UPDATE, (_e, id: string, dto) => svc.update(id, dto));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_DELETE, (_e, id: string) => svc.delete(id));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_CONNECT, (_e, id: string) => svc.connect(id));
    // ipcMain.handle(IPC_CHANNELS.MACHINES_DISCONNECT, (_e, id: string) => svc.disconnect(id));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_LIST, () => svc.list());
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_CREATE, (_e, dto) => svc.create(dto));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_UPDATE, (_e, id, dto) => svc.update(id, dto));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_DELETE, (_e, id) => svc.delete(id));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_CONNECT, (_e, id) => svc.connect(id));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_DISCONNECT, (_e, id) => svc.disconnect(id));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_TEST, (_e, machine) => svc.test(machine));
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
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINES_LIST);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINES_CREATE);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINES_UPDATE);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINES_DELETE);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINES_CONNECT);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINES_DISCONNECT);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINES_TEST);
    };
}
const safeHandle = (channel, handler) => {
    try {
        electron_1.ipcMain.removeHandler(channel);
    }
    catch { }
    electron_1.ipcMain.handle(channel, handler);
};
