"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMachineIpc = registerMachineIpc;
const electron_1 = require("electron");
const channels_1 = require("../shared/channels");
const tcp_service_1 = require("../main/machines/tcp.service");
const serial_service_1 = require("../main/machines/serial.service");
function registerMachineIpc(mainWindow) {
    const tcp = new tcp_service_1.TcpMachineService();
    const serial = new serial_service_1.SerialMachineService();
    const emit = (msg) => {
        mainWindow.webContents.send(channels_1.IPC_CHANNELS.MACHINE_MESSAGE, msg);
    };
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.MACHINE_TCP_CONNECT, async (_e, cfg) => {
        try {
            tcp.connect(cfg, emit);
            return { ok: true };
        }
        catch (e) {
            return { ok: false, message: e?.message ?? 'TCP connect failed' };
        }
    });
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.MACHINE_TCP_SEND, async (_e, payload) => {
        tcp.send(payload);
        return true;
    });
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.MACHINE_TCP_DISCONNECT, async () => {
        tcp.disconnect();
        return true;
    });
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.MACHINE_SERIAL_LIST, async () => {
        return serial.listPorts();
    });
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.MACHINE_SERIAL_CONNECT, async (_e, cfg) => {
        serial.connect(cfg, emit);
        return true;
    });
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.MACHINE_SERIAL_SEND, async (_e, payload) => {
        serial.send(payload);
        return true;
    });
    electron_1.ipcMain.handle(channels_1.IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT, async () => {
        serial.disconnect();
        return true;
    });
    // ✅ Enterprise cleanup
    return () => {
        try {
            tcp.disconnect();
        }
        catch { }
        try {
            serial.disconnect();
        }
        catch { }
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINE_TCP_CONNECT);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINE_TCP_SEND);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINE_TCP_DISCONNECT);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINE_SERIAL_LIST);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINE_SERIAL_CONNECT);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINE_SERIAL_SEND);
        electron_1.ipcMain.removeHandler(channels_1.IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT);
    };
}
