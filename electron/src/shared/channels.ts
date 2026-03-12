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

    // Auth
    AUTH_LOGIN: 'auth:login',
    AUTH_LOGOUT: 'auth:logout',
    AUTH_CHANGE_PASSWORD: 'auth:changePassword',

    // Users/Roles
    USERS_LIST: 'users:list',
    USERS_CREATE: 'users:create',
    USERS_UPDATE: 'users:update',
    USERS_RESET_PASSWORD: 'users:resetPassword',
    ROLES_LIST: 'roles:list',
    ROLES_CREATE: 'roles:create',
    ROLES_UPDATE: 'roles:update',

    // Labs
    LABS_LIST: 'labs:list',
    LABS_CREATE: 'labs:create',
    LABS_UPDATE: 'labs:update',
    LABS_DELETE: 'labs:delete',
    
    // Machines
    MACHINES_LIST: 'machines:list',
    MACHINES_CREATE: 'machines:create',
    MACHINES_UPDATE: 'machines:update',
    MACHINE_MESSAGE: 'machine:message',
    MACHINES_DELETE: 'machines:delete',
    MACHINES_CONNECT: 'machines:connect',
    MACHINES_DISCONNECT: 'machines:disconnect',
    MACHINES_TEST: 'machines:test',

    // Targets (DHIS2/OpenMRS)
    TARGETS_LIST: 'targets:list',
    TARGETS_CREATE: 'targets:create',
    TARGETS_UPDATE: 'targets:update',
    TARGETS_TEST: 'targets:test',
    TARGETS_DELETE: 'targets:delete',

    // Logs + monitor
    LOGS_QUERY: 'logs:query',

    // Outbox
    OUTBOX_LIST: 'outbox:list',
    OUTBOX_RETRY: 'outbox:retry',
    OUTBOX_DELETE: 'outbox:delete',

    // Clipboard (native Electron)
    CLIPBOARD_COPY: 'clipboard:copy',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
