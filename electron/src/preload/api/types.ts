export type AppAPI = {
    getAppVersion: () => Promise<string>;
    ping: (msg: string) => Promise<string>;
    log: (level: 'info' | 'warn' | 'error', message: string) => void;

    tcpConnect: (host: string, port: number) => Promise<boolean>;
    tcpSend: (payload: string) => Promise<boolean>;
    tcpDisconnect: () => Promise<boolean>;

    serialList: () => Promise<any[]>;
    serialConnect: (path: string, baudRate: number) => Promise<boolean>;
    serialSend: (payload: string) => Promise<boolean>;
    serialDisconnect: () => Promise<boolean>;

    onMachineMessage: (cb: (msg: any) => void) => () => void;
};
