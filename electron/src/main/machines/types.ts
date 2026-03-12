export type MachineConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type TcpConfig = { host: string; port: number };
export type SerialConfig = { path: string; baudRate: number };

export type MachineMessage = {
    timestamp: string;
    direction: 'in' | 'out';
    payload: string;
};

export type ConnectionType = 'TCP' | 'SERIAL' | 'HL7_MLLP' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
export type ProtocolType = 'ASTM' | 'HL7' | 'RAW';

export type MachineRow = {
    id: string;
    lab_id: string | null;

    name: string;
    code?: string | null;
    brand?: string | null;
    model?: string | null;
    version?: string | null;

    connection_type: ConnectionType;
    protocol: ProtocolType;

    // TCP / HL7_MLLP
    tcp_host?: string | null;
    tcp_port?: number | null;

    // SERIAL
    serial_path?: string | null;
    serial_baud_rate?: number | null;

    // FTP / SFTP
    ftp_host?: string | null;
    ftp_port?: number | null;
    ftp_user?: string | null;
    ftp_password?: string | null;
    ftp_remote_dir?: string | null;

    // FILE_WATCHER
    watch_dir?: string | null;
    watch_pattern?: string | null;

    enabled: number;        // 1/0
    auto_connect: number;  // 1/0

    created_at?: string | null;
    updated_at?: string | null;

    // joined field (nice in UI):
    lab_name?: string | null;
};