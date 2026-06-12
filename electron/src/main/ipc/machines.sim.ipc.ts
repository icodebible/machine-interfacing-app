import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { MachineRuntimeManager } from '../runtime/machine-runtime.manager';
import { MachineSimulationScenario } from '../runtime/machine-simulation.manager';
import { MachineSimulationUseCaseService } from '../services/machine-simulation-use-case.service';

const useCases = new MachineSimulationUseCaseService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerMachinesSimulationIpc(runtime: MachineRuntimeManager) {
    useCases.ensureTable();

    safeHandle(
        IPC_CHANNELS.MACHINES_SIM_START,
        (
            _e: any,
            machineId: string,
            scenario: MachineSimulationScenario = 'ASTM_BASIC',
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
            scenario: MachineSimulationScenario = 'ASTM_BASIC',
            intervalMs = 5000,
        ) => runtime.restartSimulation(machineId, scenario, intervalMs),
    );

    safeHandle(IPC_CHANNELS.MACHINES_SIM_STATE, (_e: any, machineId: string) =>
        runtime.getSimulationState(machineId),
    );

    safeHandle(IPC_CHANNELS.MACHINES_SIM_STATES, () => runtime.getSimulationStates());

    safeHandle(IPC_CHANNELS.MACHINES_SIM_USE_CASES_LIST, (_e: any, machineId?: string | null) =>
        useCases.list(machineId ?? null),
    );

    safeHandle(IPC_CHANNELS.MACHINES_SIM_USE_CASE_SAVE, (_e: any, dto: any) =>
        useCases.save(dto),
    );

    safeHandle(IPC_CHANNELS.MACHINES_SIM_USE_CASE_DELETE, (_e: any, id: string) =>
        useCases.delete(id),
    );

    safeHandle(IPC_CHANNELS.MACHINES_SIM_USE_CASE_RUN, (_e: any, machineId: string, useCaseId: string, variables?: Record<string, any>) =>
        runtime.runSimulationUseCase(machineId, useCaseId, variables ?? {}),
    );

    safeHandle(IPC_CHANNELS.MACHINES_SIM_RUN_HISTORY, (_e: any, machineId: string, limit?: number) =>
        useCases.listRuns(machineId, limit ?? 25),
    );
}
