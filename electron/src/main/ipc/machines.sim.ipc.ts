import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { MachineRuntimeManager } from '../runtime/machine-runtime.manager';

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerMachinesSimulationIpc(runtime: MachineRuntimeManager) {
    safeHandle(
        IPC_CHANNELS.MACHINES_SIM_START,
        (
            _e: any,
            machineId: string,
            scenario: 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING' = 'ASTM_BASIC',
            intervalMs = 5000,
        ) => runtime.startSimulation(machineId, scenario, intervalMs),
    );

    safeHandle(IPC_CHANNELS.MACHINES_SIM_STOP, (_e: any, machineId: string) =>
        runtime.stopSimulation(machineId),
    );

    safeHandle(
        IPC_CHANNELS.MACHINES_SIM_RESTART,
        (
            _e: any,
            machineId: string,
            scenario: 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING' = 'ASTM_BASIC',
            intervalMs = 5000,
        ) => runtime.restartSimulation(machineId, scenario, intervalMs),
    );

    safeHandle(IPC_CHANNELS.MACHINES_SIM_STATE, (_e: any, machineId: string) =>
        runtime.getSimulationState(machineId),
    );

    safeHandle(IPC_CHANNELS.MACHINES_SIM_STATES, () => runtime.getSimulationStates());
}
