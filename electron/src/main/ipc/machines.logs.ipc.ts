import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { MachineTrafficLogService } from '../runtime/machine-traffic-log.service';
import { SessionRecorderService } from '../runtime/session-recorder.service';

const logs = new MachineTrafficLogService();
const sessions = new SessionRecorderService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerMachinesLogsIpc() {
    safeHandle(IPC_CHANNELS.MACHINES_LOGS_LIST, (_e: any, machineId: string, limit?: number) =>
        logs.listByMachine(machineId, limit ?? 50),
    );

    safeHandle(IPC_CHANNELS.MACHINES_LOGS_CLEAR, (_e: any, machineId: string) =>
        logs.clearMachineLogs(machineId),
    );

    safeHandle(IPC_CHANNELS.MACHINES_LOGS_REPLAY, (_e: any, logId: string, mode?: 'PARSE_ONLY' | 'PARSE_AND_NORMALIZE' | 'FULL_WORKFLOW') =>
        logs.replay(logId, mode ?? 'FULL_WORKFLOW'),
    );

    safeHandle(IPC_CHANNELS.MACHINES_SESSIONS_LIST, (_e: any, machineId: string, limit?: number) =>
        sessions.listByMachine(machineId, limit ?? 25),
    );
}
