import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../shared/channels';
import { TcpMachineService } from '../main/machines/tcp.service';
import { SerialMachineService } from '../main/machines/serial.service';
import { MachineMessage, SerialConfig, TcpConfig } from '../main/machines/types';

// export function registerMachineIpc(mainWindow: BrowserWindow) {
//     const tcp = new TcpMachineService();
//     const serial = new SerialMachineService();

//     const emit = (msg: MachineMessage) => {
//         mainWindow.webContents.send(IPC_CHANNELS.MACHINE_MESSAGE, msg);
//     };

//     ipcMain.handle(IPC_CHANNELS.MACHINE_TCP_CONNECT, async (_e, cfg: TcpConfig) => {
//         tcp.connect(cfg, emit);
//         return true;
//     });

//     ipcMain.handle(IPC_CHANNELS.MACHINE_TCP_SEND, async (_e, payload: string) => {
//         tcp.send(payload);
//         return true;
//     });

//     ipcMain.handle(IPC_CHANNELS.MACHINE_TCP_DISCONNECT, async () => {
//         tcp.disconnect();
//         return true;
//     });

//     ipcMain.handle(IPC_CHANNELS.MACHINE_SERIAL_LIST, async () => {
//         const ports = await serial.listPorts();
//         return ports;
//     });

//     ipcMain.handle(IPC_CHANNELS.MACHINE_SERIAL_CONNECT, async (_e, cfg: SerialConfig) => {
//         serial.connect(cfg, emit);
//         return true;
//     });

//     ipcMain.handle(IPC_CHANNELS.MACHINE_SERIAL_SEND, async (_e, payload: string) => {
//         serial.send(payload);
//         return true;
//     });

//     ipcMain.handle(IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT, async () => {
//         serial.disconnect();
//         return true;
//     });
// }

export function registerMachineIpc(mainWindow: BrowserWindow) {
    const tcp = new TcpMachineService();
    const serial = new SerialMachineService();

    const emit = (msg: MachineMessage) => {
        mainWindow.webContents.send(IPC_CHANNELS.MACHINE_MESSAGE, msg);
    };

    // ipcMain.handle(IPC_CHANNELS.MACHINE_TCP_CONNECT, async (_e, cfg: TcpConfig) => {
    //     tcp.connect(cfg, emit);
    //     return true;
    // });

    ipcMain.handle(IPC_CHANNELS.MACHINE_TCP_CONNECT, async (_e, cfg: TcpConfig) => {
        try {
            tcp.connect(cfg, emit);
            return { ok: true };
        } catch (e: any) {
            return { ok: false, message: e?.message ?? 'TCP connect failed' };
        }
    });

    ipcMain.handle(IPC_CHANNELS.MACHINE_TCP_SEND, async (_e, payload: string) => {
        tcp.send(payload);
        return true;
    });

    ipcMain.handle(IPC_CHANNELS.MACHINE_TCP_DISCONNECT, async () => {
        tcp.disconnect();
        return true;
    });

    ipcMain.handle(IPC_CHANNELS.MACHINE_SERIAL_LIST, async () => {
        return serial.listPorts();
    });

    ipcMain.handle(IPC_CHANNELS.MACHINE_SERIAL_CONNECT, async (_e, cfg: SerialConfig) => {
        serial.connect(cfg, emit);
        return true;
    });

    ipcMain.handle(IPC_CHANNELS.MACHINE_SERIAL_SEND, async (_e, payload: string) => {
        serial.send(payload);
        return true;
    });

    ipcMain.handle(IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT, async () => {
        serial.disconnect();
        return true;
    });

    // ✅ Enterprise cleanup
    return () => {
        try {
            tcp.disconnect();
        } catch { }
        try {
            serial.disconnect();
        } catch { }

        ipcMain.removeHandler(IPC_CHANNELS.MACHINE_TCP_CONNECT);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINE_TCP_SEND);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINE_TCP_DISCONNECT);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINE_SERIAL_LIST);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINE_SERIAL_CONNECT);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINE_SERIAL_SEND);
        ipcMain.removeHandler(IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT);
    };
}
