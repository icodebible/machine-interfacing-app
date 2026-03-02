export type AppAPI = {
    getAppVersion: () => Promise<string>;
    ping: (msg: string) => Promise<string>;
    log: (level: 'info' | 'warn' | 'error', message: string) => void;
};