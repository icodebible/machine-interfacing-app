export type MachineRuntimeStatus =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'idle'
    | 'stopped'
    | 'error';

export type MachineRuntimeState = {
    machineId: string;
    status: MachineRuntimeStatus;
    message?: string | null;
    startedAt?: string | null;
    updatedAt: string;
};