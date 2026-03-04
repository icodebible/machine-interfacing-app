"use strict";

// electron/src/preload/preload.ts
var import_electron2 = require("electron");

// electron/src/preload/api/index.ts
var import_electron = require("electron");

// electron/src/shared/channels.ts
var IPC_CHANNELS = {
  APP_GET_VERSION: "app:getVersion",
  APP_PING: "app:ping",
  LOG_RENDERER: "log:renderer",
  // existing...
  MACHINE_TCP_CONNECT: "machine:tcp:connect",
  MACHINE_TCP_SEND: "machine:tcp:send",
  MACHINE_TCP_DISCONNECT: "machine:tcp:disconnect",
  MACHINE_SERIAL_LIST: "machine:serial:list",
  MACHINE_SERIAL_CONNECT: "machine:serial:connect",
  MACHINE_SERIAL_SEND: "machine:serial:send",
  MACHINE_SERIAL_DISCONNECT: "machine:serial:disconnect",
  // Auth
  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
  AUTH_CHANGE_PASSWORD: "auth:changePassword",
  // Users/Roles
  USERS_LIST: "users:list",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_RESET_PASSWORD: "users:resetPassword",
  ROLES_LIST: "roles:list",
  ROLES_CREATE: "roles:create",
  ROLES_UPDATE: "roles:update",
  // Labs
  LABS_LIST: "labs:list",
  LABS_CREATE: "labs:create",
  LABS_UPDATE: "labs:update",
  // Machines
  MACHINES_LIST: "machines:list",
  MACHINES_CREATE: "machines:create",
  MACHINES_UPDATE: "machines:update",
  // Targets (DHIS2/OpenMRS)
  TARGETS_LIST: "targets:list",
  TARGETS_CREATE: "targets:create",
  TARGETS_UPDATE: "targets:update",
  TARGETS_TEST: "targets:test",
  // Logs + monitor
  LOGS_QUERY: "logs:query",
  // Outbox
  OUTBOX_LIST: "outbox:list",
  OUTBOX_RETRY: "outbox:retry",
  OUTBOX_DELETE: "outbox:delete",
  // Existing machine ones (keep yours)
  MACHINE_MESSAGE: "machine:message"
};

// electron/src/preload/api/index.ts
var api = {
  getAppVersion: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  ping: (msg) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.APP_PING, msg),
  log: (level, message) => import_electron.ipcRenderer.send(IPC_CHANNELS.LOG_RENDERER, { level, message }),
  tcpConnect: (host, port) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
  tcpSend: (payload) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_SEND, payload),
  tcpDisconnect: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_DISCONNECT),
  serialList: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_LIST),
  serialConnect: (path, baudRate) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_CONNECT, { path, baudRate }),
  serialSend: (payload) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_SEND, payload),
  serialDisconnect: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT),
  onMachineMessage: (cb) => {
    const handler = (_, msg) => cb(msg);
    import_electron.ipcRenderer.on(IPC_CHANNELS.MACHINE_MESSAGE, handler);
    return () => import_electron.ipcRenderer.removeListener(IPC_CHANNELS.MACHINE_MESSAGE, handler);
  },
  authLogin: (username, password) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, username, password),
  authChangePassword: (userId, newPassword) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, userId, newPassword)
};

// electron/src/preload/preload.ts
import_electron2.contextBridge.exposeInMainWorld("appAPI", api);
//# sourceMappingURL=preload.js.map
