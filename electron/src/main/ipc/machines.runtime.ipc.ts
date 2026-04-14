import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { MachineRuntimeManager } from '../runtime/machine-runtime.manager';

const runtime = new MachineRuntimeManager();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerMachinesRuntimeIpc() {
    safeHandle(IPC_CHANNELS.MACHINES_RUNTIME_START, (_e: any, machineId: string) =>
        runtime.startMachine(machineId),
    );

    safeHandle(IPC_CHANNELS.MACHINES_RUNTIME_STOP, (_e: any, machineId: string) =>
        runtime.stopMachine(machineId),
    );

    safeHandle(IPC_CHANNELS.MACHINES_RUNTIME_RESTART, (_e: any, machineId: string) =>
        runtime.restartMachine(machineId),
    );

    safeHandle(IPC_CHANNELS.MACHINES_RUNTIME_STATE, (_e: any, machineId: string) =>
        runtime.getState(machineId),
    );

    safeHandle(IPC_CHANNELS.MACHINES_RUNTIME_STATES, () => runtime.getStates());

    return runtime;
}
