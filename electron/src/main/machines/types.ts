export type MachineConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type TcpConfig = { host: string; port: number };
export type SerialConfig = { path: string; baudRate: number };

export type MachineMessage = {
    timestamp: string;
    direction: 'in' | 'out';
    payload: string;
};