export const IPC_CHANNELS = {
    APP_GET_VERSION: 'app:getVersion',
    APP_PING: 'app:ping',
    LOG_RENDERER: 'log:renderer',

    // existing...
    MACHINE_TCP_CONNECT: 'machine:tcp:connect',
    MACHINE_TCP_SEND: 'machine:tcp:send',
    MACHINE_TCP_DISCONNECT: 'machine:tcp:disconnect',

    MACHINE_SERIAL_LIST: 'machine:serial:list',
    MACHINE_SERIAL_CONNECT: 'machine:serial:connect',
    MACHINE_SERIAL_SEND: 'machine:serial:send',
    MACHINE_SERIAL_DISCONNECT: 'machine:serial:disconnect',

    MACHINE_MESSAGE: 'machine:message',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
