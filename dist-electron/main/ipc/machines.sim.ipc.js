"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMachinesSimulationIpc = registerMachinesSimulationIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const machine_simulation_use_case_service_1 = require("../services/machine-simulation-use-case.service");
const useCases = new machine_simulation_use_case_service_1.MachineSimulationUseCaseService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerMachinesSimulationIpc(runtime) {
    useCases.ensureTable();
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_START, (_e, machineId, scenario = 'ASTM_BASIC', intervalMs = 5000) => runtime.startSimulation(machineId, scenario, intervalMs));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_STOP, (_e, machineId) => runtime.stopSimulation(machineId));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_RESTART, (_e, machineId, scenario = 'ASTM_BASIC', intervalMs = 5000) => runtime.restartSimulation(machineId, scenario, intervalMs));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_STATE, (_e, machineId) => runtime.getSimulationState(machineId));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_STATES, () => runtime.getSimulationStates());
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_USE_CASES_LIST, (_e, machineId) => useCases.list(machineId ?? null));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_USE_CASE_SAVE, (_e, dto) => useCases.save(dto));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_USE_CASE_DELETE, (_e, id) => useCases.delete(id));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_USE_CASE_RUN, (_e, machineId, useCaseId, variables) => runtime.runSimulationUseCase(machineId, useCaseId, variables ?? {}));
    safeHandle(channels_1.IPC_CHANNELS.MACHINES_SIM_RUN_HISTORY, (_e, machineId, limit) => useCases.listRuns(machineId, limit ?? 25));
}
