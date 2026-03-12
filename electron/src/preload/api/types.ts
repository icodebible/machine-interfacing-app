// export type AppAPI = {
//     getAppVersion: () => Promise<string>;
//     ping: (msg: string) => Promise<string>;
//     log: (level: 'info' | 'warn' | 'error', message: string) => void;

//     tcpConnect: (host: string, port: number) => Promise<boolean>;
//     tcpSend: (payload: string) => Promise<boolean>;
//     tcpDisconnect: () => Promise<boolean>;

//     serialList: () => Promise<any[]>;
//     serialConnect: (path: string, baudRate: number) => Promise<boolean>;
//     serialSend: (payload: string) => Promise<boolean>;
//     serialDisconnect: () => Promise<boolean>;

//     onMachineMessage: (cb: (msg: any) => void) => () => void;

//     // authLogin: (username: string, password: string) => Promise<{ user: any }>;
//     authLogout?: () => Promise<void>;

//     // labsList: () => Promise<any[]>;
//     // labsCreate: (dto: any) => Promise<any>;
//     // labsUpdate: (id: string, dto: any) => Promise<any>;

//     // machinesList: () => Promise<any[]>;
//     // machinesCreate: (dto: any) => Promise<any>;
//     // machinesUpdate: (id: string, dto: any) => Promise<any>;

//     // targetsList: () => Promise<any[]>;
//     // targetsCreate: (dto: any) => Promise<any>;
//     // targetsUpdate: (id: string, dto: any) => Promise<any>;
//     // targetsTest: (id: string) => Promise<{ ok: boolean; message?: string }>;

//     // outboxList: () => Promise<any[]>;
//     // outboxRetry: (id: string) => Promise<boolean>;
//     // outboxDelete: (id: string) => Promise<boolean>;

//     // logsQuery: (q: any) => Promise<any[]>;

//     authLogin: (
//         username: string,
//         password: string,
//     ) => Promise<{
//         user: { id: string; username: string; authorities: string[]; mustChangePassword: boolean };
//     }>;
//     authChangePassword: (userId: string, newPassword: string) => Promise<boolean>;
// };


export type Lab = {
    id: string;
    code?: string | null;
    name: string;
    location?: string | null;
    description?: string | null;
    is_active: number;
    created_at: string;
    updated_at: string;
};

export type Machine = {
    id: string;
    lab_id?: string | null;
    lab_name?: string | null;

    name: string;
    brand?: string | null;
    model?: string | null;
    version?: string | null;

    connection_type: 'TCP' | 'SERIAL' | 'FTP' | 'SFTP';
    protocol: 'HL7' | 'ASTM';

    tcp_host?: string | null;
    tcp_port?: number | null;

    serial_path?: string | null;
    serial_baud_rate?: number | null;

    enabled: number;
    auto_connect: number;

    created_at: string;
    updated_at: string;
};

export type Target = {
    id: string;
    type: 'DHIS2' | 'OPENMRS';
    name: string;
    base_url: string;
    token?: string | null;
    enabled: number;
    created_at: string;
    updated_at: string;
};

export type LogRow = {
    id: string;
    level: 'info' | 'warn' | 'error';
    source: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
    entity_type?: string | null;
    entity_id?: string | null;
    message: string;
    payload_json?: string | null;
    created_at: string;
};

export type LogsQuery = {
    level?: 'info' | 'warn' | 'error';
    source?: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
    entityType?: string;
    entityId?: string;
    limit?: number;
};

export type AppAPI = {
    // Base
    getAppVersion: () => Promise<string>;
    ping: (msg: string) => Promise<string>;
    log: (level: 'info' | 'warn' | 'error', message: string) => void;

    // Machine TCP/Serial
    tcpConnect: (host: string, port: number) => Promise<boolean>;
    tcpSend: (payload: string) => Promise<boolean>;
    tcpDisconnect: () => Promise<boolean>;

    serialList: () => Promise<any[]>;
    serialConnect: (path: string, baudRate: number) => Promise<boolean>;
    serialSend: (payload: string) => Promise<boolean>;
    serialDisconnect: () => Promise<boolean>;

    onMachineMessage: (cb: (msg: any) => void) => () => void;

    // Auth
    authLogin: (
        username: string,
        password: string,
    ) => Promise<{
        user: { id: string; username: string; authorities: string[]; mustChangePassword: boolean };
    }>;

    authChangePassword: (userId: string, newPassword: string) => Promise<boolean>;
    authLogout?: () => Promise<boolean>;

    // ✅ Labs
    labsList: () => Promise<Lab[]>;
    labsCreate: (dto: Partial<Lab>) => Promise<{ id: string }>;
    labsUpdate: (id: string, dto: Partial<Lab>) => Promise<boolean>;
    labsDelete: (id: string) => Promise<boolean>;

    // ✅ Machines
    machinesList: () => Promise<Machine[]>;
    machinesCreate: (dto: Partial<Machine>) => Promise<{ id: string }>;
    machinesUpdate: (id: string, dto: Partial<Machine>) => Promise<boolean>;
    machinesDelete: (id: string) => Promise<boolean>;
    machinesConnect: (id: string) => Promise<boolean>;
    machinesDisconnect: (id: string) => Promise<boolean>;
    machinesTest: (machine: Partial<Machine>) => Promise<{ ok: boolean; message?: string }>;
    
    // ✅ Targets
    targetsList: () => Promise<Target[]>;
    targetsCreate: (dto: Partial<Target>) => Promise<{ id: string }>;
    targetsUpdate: (id: string, dto: Partial<Target>) => Promise<boolean>;
    targetsDelete: (id: string) => Promise<boolean>;
    targetsTest: (id: string) => Promise<{ ok: boolean; message?: string }>;

    // ✅ Logs
    logsQuery: (q: LogsQuery) => Promise<LogRow[]>;
};