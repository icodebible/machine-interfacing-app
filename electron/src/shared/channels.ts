export const IPC_CHANNELS = {
    APP_GET_VERSION: 'app:getVersion',
    APP_PING: 'app:ping',
    LOG_RENDERER: 'log:renderer',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
