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
  LABS_DELETE: "labs:delete",
  // Machines
  MACHINES_LIST: "machines:list",
  MACHINES_CREATE: "machines:create",
  MACHINES_UPDATE: "machines:update",
  MACHINE_MESSAGE: "machine:message",
  MACHINES_DELETE: "machines:delete",
  MACHINES_CONNECT: "machines:connect",
  MACHINES_DISCONNECT: "machines:disconnect",
  MACHINES_TEST: "machines:test",
  // Targets (DHIS2/OpenMRS)
  TARGETS_LIST: "targets:list",
  TARGETS_CREATE: "targets:create",
  TARGETS_UPDATE: "targets:update",
  TARGETS_TEST: "targets:test",
  TARGETS_DELETE: "targets:delete",
  // Logs + monitor
  LOGS_QUERY: "logs:query",
  // Outbox
  OUTBOX_LIST: "outbox:list",
  OUTBOX_RETRY: "outbox:retry",
  OUTBOX_DELETE: "outbox:delete",
  // Clipboard (native Electron)
  CLIPBOARD_COPY: "clipboard:copy"
};

// electron/src/preload/api/index.ts
var api = {
  // Base
  getAppVersion: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
  ping: (msg) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.APP_PING, msg),
  log: (level, message) => import_electron.ipcRenderer.send(IPC_CHANNELS.LOG_RENDERER, { level, message }),
  // Machine TCP
  tcpConnect: (host, port) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
  tcpSend: (payload) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_SEND, payload),
  tcpDisconnect: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_DISCONNECT),
  // Machine Serial
  serialList: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_LIST),
  serialConnect: (path, baudRate) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_CONNECT, { path, baudRate }),
  serialSend: (payload) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_SEND, payload),
  serialDisconnect: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT),
  onMachineMessage: (cb) => {
    const handler = (_, msg) => cb(msg);
    import_electron.ipcRenderer.on(IPC_CHANNELS.MACHINE_MESSAGE, handler);
    return () => import_electron.ipcRenderer.removeListener(IPC_CHANNELS.MACHINE_MESSAGE, handler);
  },
  // Auth
  authLogin: (username, password) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, username, password),
  authChangePassword: (userId, newPassword) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, userId, newPassword),
  authLogout: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT),
  // ✅ Labs
  labsList: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.LABS_LIST),
  labsCreate: (dto) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.LABS_CREATE, dto),
  labsUpdate: (id, dto) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.LABS_UPDATE, id, dto),
  labsDelete: (id) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.LABS_DELETE, id),
  // ✅ Machines
  // machinesList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LIST),
  // machinesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CREATE, dto),
  // machinesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_UPDATE, id, dto),
  // machinesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DELETE, id),
  // machinesConnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CONNECT, id),
  // machinesDisconnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DISCONNECT, id),
  // ✅ Machines
  machinesList: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LIST),
  machinesCreate: (dto) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CREATE, dto),
  machinesUpdate: (id, dto) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINES_UPDATE, id, dto),
  machinesDelete: (id) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DELETE, id),
  machinesConnect: (id) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CONNECT, id),
  machinesDisconnect: (id) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DISCONNECT, id),
  machinesTest: (machine) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.MACHINES_TEST, machine),
  // ✅ Targets
  targetsList: () => import_electron.ipcRenderer.invoke(IPC_CHANNELS.TARGETS_LIST),
  targetsCreate: (dto) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.TARGETS_CREATE, dto),
  targetsUpdate: (id, dto) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.TARGETS_UPDATE, id, dto),
  targetsDelete: (id) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.TARGETS_DELETE, id),
  targetsTest: (id) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.TARGETS_TEST, id),
  // ✅ Logs
  logsQuery: (q) => import_electron.ipcRenderer.invoke(IPC_CHANNELS.LOGS_QUERY, q)
};

// electron/src/preload/preload.ts
import_electron2.contextBridge.exposeInMainWorld("appAPI", api);
import_electron2.contextBridge.exposeInMainWorld("platform", {
  copyToClipboard: (text) => import_electron2.ipcRenderer.invoke("clipboard:copy", text)
});
//# sourceMappingURL=preload.js.map
