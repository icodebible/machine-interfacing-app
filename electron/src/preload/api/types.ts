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

    // authLogin: (username: string, password: string) => Promise<{ user: any }>;
    authLogout?: () => Promise<void>;

    // labsList: () => Promise<any[]>;
    // labsCreate: (dto: any) => Promise<any>;
    // labsUpdate: (id: string, dto: any) => Promise<any>;

    // machinesList: () => Promise<any[]>;
    // machinesCreate: (dto: any) => Promise<any>;
    // machinesUpdate: (id: string, dto: any) => Promise<any>;

    // targetsList: () => Promise<any[]>;
    // targetsCreate: (dto: any) => Promise<any>;
    // targetsUpdate: (id: string, dto: any) => Promise<any>;
    // targetsTest: (id: string) => Promise<{ ok: boolean; message?: string }>;

    // outboxList: () => Promise<any[]>;
    // outboxRetry: (id: string) => Promise<boolean>;
    // outboxDelete: (id: string) => Promise<boolean>;

    // logsQuery: (q: any) => Promise<any[]>;

    authLogin: (
        username: string,
        password: string,
    ) => Promise<{
        user: { id: string; username: string; authorities: string[]; mustChangePassword: boolean };
    }>;
    authChangePassword: (userId: string, newPassword: string) => Promise<boolean>;
};
