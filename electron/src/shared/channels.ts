// export const IPC_CHANNELS = {
//     APP_GET_VERSION: 'app:getVersion',
//     APP_PING: 'app:ping',
//     LOG_RENDERER: 'log:renderer',

//     // existing...
//     MACHINE_TCP_CONNECT: 'machine:tcp:connect',
//     MACHINE_TCP_SEND: 'machine:tcp:send',
//     MACHINE_TCP_DISCONNECT: 'machine:tcp:disconnect',

//     MACHINE_SERIAL_LIST: 'machine:serial:list',
//     MACHINE_SERIAL_CONNECT: 'machine:serial:connect',
//     MACHINE_SERIAL_SEND: 'machine:serial:send',
//     MACHINE_SERIAL_DISCONNECT: 'machine:serial:disconnect',

//     // Auth
//     AUTH_LOGIN: 'auth:login',
//     AUTH_LOGOUT: 'auth:logout',
//     AUTH_CHANGE_PASSWORD: 'auth:changePassword',

//     // Users/Roles
//     USERS_LIST: 'users:list',
//     USERS_CREATE: 'users:create',
//     USERS_UPDATE: 'users:update',
//     USERS_RESET_PASSWORD: 'users:resetPassword',
//     ROLES_LIST: 'roles:list',
//     ROLES_CREATE: 'roles:create',
//     ROLES_UPDATE: 'roles:update',

//     // Labs
//     LABS_LIST: 'labs:list',
//     LABS_CREATE: 'labs:create',
//     LABS_UPDATE: 'labs:update',
//     LABS_DELETE: 'labs:delete',

//     // Machines
//     MACHINES_LIST: 'machines:list',
//     MACHINES_CREATE: 'machines:create',
//     MACHINES_UPDATE: 'machines:update',
//     MACHINE_MESSAGE: 'machine:message',
//     MACHINES_DELETE: 'machines:delete',
//     MACHINES_CONNECT: 'machines:connect',
//     MACHINES_DISCONNECT: 'machines:disconnect',
//     MACHINES_TEST: 'machines:test',

//     // Targets (DHIS2/OpenMRS)
//     TARGETS_LIST: 'targets:list',
//     TARGETS_CREATE: 'targets:create',
//     TARGETS_UPDATE: 'targets:update',
//     TARGETS_TEST: 'targets:test',
//     TARGETS_DELETE: 'targets:delete',
//     TARGETS_HARNESS_SEND: 'targets:harness:send',

//     // Logs + monitor
//     LOGS_QUERY: 'logs:query',

//     // Outbox
//     OUTBOX_LIST: 'outbox:list',
//     OUTBOX_RETRY: 'outbox:retry',
//     OUTBOX_DELETE: 'outbox:delete',

//     // Clipboard (native Electron)
//     CLIPBOARD_COPY: 'clipboard:copy',

//     MACHINES_RUNTIME_START: 'machines:runtime:start',
//     MACHINES_RUNTIME_STOP: 'machines:runtime:stop',
//     MACHINES_RUNTIME_RESTART: 'machines:runtime:restart',
//     MACHINES_RUNTIME_STATE: 'machines:runtime:state',
//     MACHINES_RUNTIME_STATES: 'machines:runtime:states',

//     MACHINES_LOGS_LIST: 'machines:logs:list',
//     MACHINES_LOGS_CLEAR: 'machines:logs:clear',

//     MACHINES_SIM_START: 'machines:sim:start',
//     MACHINES_SIM_STOP: 'machines:sim:stop',
//     MACHINES_SIM_RESTART: 'machines:sim:restart',
//     MACHINES_SIM_STATE: 'machines:sim:state',
//     MACHINES_SIM_STATES: 'machines:sim:states',

//     MACHINES_PARSED_LIST: 'machines:parsed:list',
//     MACHINES_NORMALIZED_LIST: 'machines:normalized:list',

//     // APPROVAL_POLICIES_LIST: 'approval-policies:list',
//     // APPROVAL_POLICIES_CREATE: 'approval-policies:create',
//     // APPROVAL_POLICIES_UPDATE: 'approval-policies:update',

//     // RESULTS_PENDING_LIST: 'results:pending:list',
//     // RESULTS_APPROVE: 'results:approve',
//     // RESULTS_REJECT: 'results:reject',

//     // OUTBOUND_QUEUE_LIST: 'outbound-queue:list',
//     // OUTBOUND_QUEUE_RETRY: 'outbound-queue:retry',
//     // OUTBOUND_QUEUE_PENDING: 'outbound-queue:pending',

//     // APPROVAL_POLICIES_DELETE: 'approval-policies:delete',

//     // RESULTS_PENDING_APPROVALS: 'results:pending-approvals',
//     // RESULT_APPROVE: 'result:approve',
//     // RESULT_REJECT: 'result:reject',
//     // RESULT_APPROVALS_LIST: 'result:approvals:list',

//     APPROVAL_POLICIES_LIST: 'approval-policies:list',
//     APPROVAL_POLICIES_CREATE: 'approval-policies:create',
//     APPROVAL_POLICIES_UPDATE: 'approval-policies:update',
//     APPROVAL_POLICIES_DELETE: 'approval-policies:delete',

//     RESULTS_PENDING_APPROVALS: 'results:pending-approvals',
//     RESULT_APPROVE: 'result:approve',
//     RESULT_REJECT: 'result:reject',
//     RESULT_APPROVALS_LIST: 'result:approvals:list',

//     OUTBOUND_QUEUE_LIST: 'outbound-queue:list',
//     OUTBOUND_QUEUE_PENDING: 'outbound-queue:pending',

//     RESULT_APPROVALS_ALL: 'result:approvals:all',
//     DELIVERY_HISTORY_LIST: 'delivery-history:list',
//     DELIVERY_AUDIT_LIST: 'delivery-audit:list',
//     DELIVERY_AUDIT_QUERY: 'delivery-audit:query',

//     TARGET_TRANSFORM_PREVIEW: 'targets:transform:preview',

//     OUTBOUND_QUEUE_RETRY: 'outbound-queue:retry',
//     OUTBOUND_QUEUE_REQUEUE: 'outbound-queue:requeue',
//     OUTBOUND_QUEUE_SEND_NOW: 'outbound-queue:send-now',

//     TARGET_SECRETS_GET: 'target-secrets:get',
//     TARGET_SECRETS_SAVE: 'target-secrets:save',
//     TARGET_TRANSFORM_PREVIEW_FROM_QUEUE: 'targets:transform:preview-from-queue',
//     TARGET_TRANSFORM_PREVIEW_FROM_DELIVERY_HISTORY: 'targets:transform:preview-from-delivery-history',

//     MAPPINGS_LIST: 'mappings:list',
//     MAPPINGS_CREATE: 'mappings:create',
//     MAPPINGS_UPDATE: 'mappings:update',
//     MAPPINGS_DELETE: 'mappings:delete',
//     MAPPINGS_VALIDATE: 'mappings:validate',
// } as const;

// export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];




// export const IPC_CHANNELS = {
//     APP_GET_VERSION: 'app:getVersion',
//     APP_PING: 'app:ping',
//     LOG_RENDERER: 'log:renderer',

//     MACHINE_TCP_CONNECT: 'machine:tcp:connect',
//     MACHINE_TCP_SEND: 'machine:tcp:send',
//     MACHINE_TCP_DISCONNECT: 'machine:tcp:disconnect',

//     MACHINE_SERIAL_LIST: 'machine:serial:list',
//     MACHINE_SERIAL_CONNECT: 'machine:serial:connect',
//     MACHINE_SERIAL_SEND: 'machine:serial:send',
//     MACHINE_SERIAL_DISCONNECT: 'machine:serial:disconnect',

//     AUTH_LOGIN: 'auth:login',
//     AUTH_LOGOUT: 'auth:logout',
//     AUTH_ME: 'auth:me',
//     AUTH_CHANGE_PASSWORD: 'auth:changePassword',
//     AUTH_CURRENT_USER: 'auth:currentUser',

//     USERS_LIST: 'users:list',
//     USERS_CREATE: 'users:create',
//     USERS_UPDATE: 'users:update',
//     USERS_RESET_PASSWORD: 'users:resetPassword',
//     USERS_DELETE: 'users:delete',
//     ROLES_LIST: 'roles:list',
//     ROLES_CREATE: 'roles:create',
//     ROLES_UPDATE: 'roles:update',
//     ROLES_DELETE: 'roles:delete',
//     ROLES_AUTHORITIES_CATALOG: 'roles:authorities:catalog',

//     LABS_LIST: 'labs:list',
//     LABS_CREATE: 'labs:create',
//     LABS_UPDATE: 'labs:update',
//     LABS_DELETE: 'labs:delete',

//     MACHINES_LIST: 'machines:list',
//     MACHINES_CREATE: 'machines:create',
//     MACHINES_UPDATE: 'machines:update',
//     MACHINE_MESSAGE: 'machine:message',
//     MACHINES_DELETE: 'machines:delete',
//     MACHINES_CONNECT: 'machines:connect',
//     MACHINES_DISCONNECT: 'machines:disconnect',
//     MACHINES_TEST: 'machines:test',

//     TARGETS_LIST: 'targets:list',
//     TARGETS_CREATE: 'targets:create',
//     TARGETS_UPDATE: 'targets:update',
//     TARGETS_TEST: 'targets:test',
//     TARGETS_DELETE: 'targets:delete',
//     TARGETS_HARNESS_SEND: 'targets:harness:send',
//     TARGET_MAPPINGS_LIST: 'target-mappings:list',
//     TARGET_MAPPINGS_CREATE: 'target-mappings:create',
//     TARGET_MAPPINGS_UPDATE: 'target-mappings:update',
//     TARGET_MAPPINGS_DELETE: 'target-mappings:delete',
//     TARGET_MAPPINGS_EXPORT: 'target-mappings:export',
//     TARGET_MAPPINGS_IMPORT: 'target-mappings:import',

//     TARGETS_SECRET_GET: 'targets:secret:get',
//     TARGETS_SECRET_SET: 'targets:secret:set',
//     TARGETS_SECRET_DELETE: 'targets:secret:delete',

//     LOGS_QUERY: 'logs:query',

//     OUTBOX_LIST: 'outbox:list',
//     OUTBOX_RETRY: 'outbox:retry',
//     OUTBOX_DELETE: 'outbox:delete',

//     CLIPBOARD_COPY: 'clipboard:copy',

//     MACHINES_RUNTIME_START: 'machines:runtime:start',
//     MACHINES_RUNTIME_STOP: 'machines:runtime:stop',
//     MACHINES_RUNTIME_RESTART: 'machines:runtime:restart',
//     MACHINES_RUNTIME_STATE: 'machines:runtime:state',
//     MACHINES_RUNTIME_STATES: 'machines:runtime:states',

//     MACHINES_LOGS_LIST: 'machines:logs:list',
//     MACHINES_LOGS_CLEAR: 'machines:logs:clear',

//     MACHINES_SIM_START: 'machines:sim:start',
//     MACHINES_SIM_STOP: 'machines:sim:stop',
//     MACHINES_SIM_RESTART: 'machines:sim:restart',
//     MACHINES_SIM_STATE: 'machines:sim:state',
//     MACHINES_SIM_STATES: 'machines:sim:states',

//     MACHINES_PARSED_LIST: 'machines:parsed:list',
//     MACHINES_NORMALIZED_LIST: 'machines:normalized:list',

//     APPROVAL_POLICIES_LIST: 'approval-policies:list',
//     APPROVAL_POLICIES_CREATE: 'approval-policies:create',
//     APPROVAL_POLICIES_UPDATE: 'approval-policies:update',
//     APPROVAL_POLICIES_DELETE: 'approval-policies:delete',

//     RESULTS_PENDING_APPROVALS: 'results:pending-approvals',
//     RESULT_APPROVE: 'result:approve',
//     RESULT_REJECT: 'result:reject',
//     RESULT_APPROVALS_LIST: 'result:approvals:list',
//     RESULT_REEVALUATE_POLICY: 'result:reevaluate-policy',
//     RESULT_APPROVALS_ALL: 'result:approvals:all',

//     OUTBOUND_QUEUE_LIST: 'outbound-queue:list',
//     OUTBOUND_QUEUE_PENDING: 'outbound-queue:pending',

//     DELIVERY_HISTORY_LIST: 'delivery-history:list',
//     DELIVERY_AUDIT_LIST: 'delivery-audit:list',
//     DELIVERY_AUDIT_QUERY: 'delivery-audit:query',

//     TARGET_TRANSFORM_PREVIEW: 'targets:transform:preview',

//     OUTBOUND_QUEUE_RETRY: 'outbound-queue:retry',
//     OUTBOUND_QUEUE_REQUEUE: 'outbound-queue:requeue',
//     OUTBOUND_QUEUE_SEND_NOW: 'outbound-queue:send-now',

//     TARGET_SECRETS_GET: 'target-secrets:get',
//     TARGET_SECRETS_SAVE: 'target-secrets:save',
//     TARGET_TRANSFORM_PREVIEW_FROM_QUEUE: 'targets:transform:preview-from-queue',
//     TARGET_TRANSFORM_PREVIEW_FROM_DELIVERY_HISTORY: 'targets:transform:preview-from-delivery-history',

//     MAPPINGS_LIST: 'mappings:list',
//     MAPPINGS_CREATE: 'mappings:create',
//     MAPPINGS_UPDATE: 'mappings:update',
//     MAPPINGS_DELETE: 'mappings:delete',
//     MAPPINGS_VALIDATE: 'mappings:validate',

//     MAPPING_VALUE_TRANSLATIONS_LIST: 'mapping-value-translations:list',
//     MAPPING_VALUE_TRANSLATIONS_CREATE: 'mapping-value-translations:create',
//     MAPPING_VALUE_TRANSLATIONS_UPDATE: 'mapping-value-translations:update',
//     MAPPING_VALUE_TRANSLATIONS_DELETE: 'mapping-value-translations:delete',
//     MAPPING_VALUE_TRANSLATIONS_SAVE_CONFIG: 'mapping-value-translations:save-config',

//     LOGS_LIST: 'logs:list',
//     PLATFORM_INFO: 'platform:info',
//     COPY_TO_CLIPBOARD: 'platform:copy',

//     MACHINES_RUNTIME_EVENT: 'machines:runtime:event',
// } as const;

// export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];




// export const IPC_CHANNELS = {
//     APP_GET_VERSION: 'app:getVersion',
//     APP_PING: 'app:ping',
//     LOG_RENDERER: 'log:renderer',

//     MACHINE_TCP_CONNECT: 'machine:tcp:connect',
//     MACHINE_TCP_SEND: 'machine:tcp:send',
//     MACHINE_TCP_DISCONNECT: 'machine:tcp:disconnect',

//     MACHINE_SERIAL_LIST: 'machine:serial:list',
//     MACHINE_SERIAL_CONNECT: 'machine:serial:connect',
//     MACHINE_SERIAL_SEND: 'machine:serial:send',
//     MACHINE_SERIAL_DISCONNECT: 'machine:serial:disconnect',

//     AUTH_LOGIN: 'auth:login',
//     AUTH_LOGOUT: 'auth:logout',
//     AUTH_ME: 'auth:me',
//     AUTH_CHANGE_PASSWORD: 'auth:changePassword',
//     AUTH_CURRENT_USER: 'auth:currentUser',

//     USERS_LIST: 'users:list',
//     USERS_CREATE: 'users:create',
//     USERS_UPDATE: 'users:update',
//     USERS_RESET_PASSWORD: 'users:resetPassword',
//     USERS_DELETE: 'users:delete',
//     ROLES_LIST: 'roles:list',
//     ROLES_CREATE: 'roles:create',
//     ROLES_UPDATE: 'roles:update',
//     ROLES_DELETE: 'roles:delete',
//     ROLES_AUTHORITIES_CATALOG: 'roles:authorities:catalog',

//     LABS_LIST: 'labs:list',
//     LABS_CREATE: 'labs:create',
//     LABS_UPDATE: 'labs:update',
//     LABS_DELETE: 'labs:delete',

//     MACHINES_LIST: 'machines:list',
//     MACHINES_CREATE: 'machines:create',
//     MACHINES_UPDATE: 'machines:update',
//     MACHINE_MESSAGE: 'machine:message',
//     MACHINES_DELETE: 'machines:delete',
//     MACHINES_CONNECT: 'machines:connect',
//     MACHINES_DISCONNECT: 'machines:disconnect',
//     MACHINES_TEST: 'machines:test',

//     TARGETS_LIST: 'targets:list',
//     TARGETS_CREATE: 'targets:create',
//     TARGETS_UPDATE: 'targets:update',
//     TARGETS_TEST: 'targets:test',
//     TARGETS_DELETE: 'targets:delete',
//     TARGETS_HARNESS_SEND: 'targets:harness:send',
//     TARGET_MAPPINGS_LIST: 'target-mappings:list',
//     TARGET_MAPPINGS_CREATE: 'target-mappings:create',
//     TARGET_MAPPINGS_UPDATE: 'target-mappings:update',
//     TARGET_MAPPINGS_DELETE: 'target-mappings:delete',
//     TARGET_MAPPINGS_EXPORT: 'target-mappings:export',
//     TARGET_MAPPINGS_IMPORT: 'target-mappings:import',

//     TARGETS_SECRET_GET: 'targets:secret:get',
//     TARGETS_SECRET_SET: 'targets:secret:set',
//     TARGETS_SECRET_DELETE: 'targets:secret:delete',

//     LOGS_QUERY: 'logs:query',

//     OUTBOX_LIST: 'outbox:list',
//     OUTBOX_RETRY: 'outbox:retry',
//     OUTBOX_DELETE: 'outbox:delete',

//     CLIPBOARD_COPY: 'clipboard:copy',

//     MACHINES_RUNTIME_START: 'machines:runtime:start',
//     MACHINES_RUNTIME_STOP: 'machines:runtime:stop',
//     MACHINES_RUNTIME_RESTART: 'machines:runtime:restart',
//     MACHINES_RUNTIME_STATE: 'machines:runtime:state',
//     MACHINES_RUNTIME_STATES: 'machines:runtime:states',

//     MACHINES_LOGS_LIST: 'machines:logs:list',
//     MACHINES_LOGS_CLEAR: 'machines:logs:clear',

//     MACHINES_SIM_START: 'machines:sim:start',
//     MACHINES_SIM_STOP: 'machines:sim:stop',
//     MACHINES_SIM_RESTART: 'machines:sim:restart',
//     MACHINES_SIM_STATE: 'machines:sim:state',
//     MACHINES_SIM_STATES: 'machines:sim:states',

//     MACHINES_PARSED_LIST: 'machines:parsed:list',
//     MACHINES_NORMALIZED_LIST: 'machines:normalized:list',

//     APPROVAL_POLICIES_LIST: 'approval-policies:list',
//     APPROVAL_POLICIES_CREATE: 'approval-policies:create',
//     APPROVAL_POLICIES_UPDATE: 'approval-policies:update',
//     APPROVAL_POLICIES_DELETE: 'approval-policies:delete',

//     RESULTS_PENDING_APPROVALS: 'results:pending-approvals',
//     RESULT_APPROVE: 'result:approve',
//     RESULT_REJECT: 'result:reject',
//     RESULT_APPROVALS_LIST: 'result:approvals:list',
//     RESULT_REEVALUATE_POLICY: 'result:reevaluate-policy',
//     RESULT_APPROVALS_ALL: 'result:approvals:all',

//     OUTBOUND_QUEUE_LIST: 'outbound-queue:list',
//     OUTBOUND_QUEUE_PENDING: 'outbound-queue:pending',

//     DELIVERY_HISTORY_LIST: 'delivery-history:list',
//     DELIVERY_AUDIT_LIST: 'delivery-audit:list',
//     DELIVERY_AUDIT_QUERY: 'delivery-audit:query',

//     TARGET_TRANSFORM_PREVIEW: 'targets:transform:preview',

//     OUTBOUND_QUEUE_RETRY: 'outbound-queue:retry',
//     OUTBOUND_QUEUE_REQUEUE: 'outbound-queue:requeue',
//     OUTBOUND_QUEUE_SEND_NOW: 'outbound-queue:send-now',

//     TARGET_SECRETS_GET: 'target-secrets:get',
//     TARGET_SECRETS_SAVE: 'target-secrets:save',
//     TARGET_TRANSFORM_PREVIEW_FROM_QUEUE: 'targets:transform:preview-from-queue',
//     TARGET_TRANSFORM_PREVIEW_FROM_DELIVERY_HISTORY: 'targets:transform:preview-from-delivery-history',

//     MAPPINGS_LIST: 'mappings:list',
//     MAPPINGS_CREATE: 'mappings:create',
//     MAPPINGS_UPDATE: 'mappings:update',
//     MAPPINGS_DELETE: 'mappings:delete',
//     MAPPINGS_VALIDATE: 'mappings:validate',
//     MAPPINGS_OPENMRS_LIS_DISCOVER: 'mappings:openmrs-lis:discover',
//     MAPPINGS_OPENMRS_LIS_SEED: 'mappings:openmrs-lis:seed',

//     MAPPING_VALUE_TRANSLATIONS_LIST: 'mapping-value-translations:list',
//     MAPPING_VALUE_TRANSLATIONS_CREATE: 'mapping-value-translations:create',
//     MAPPING_VALUE_TRANSLATIONS_UPDATE: 'mapping-value-translations:update',
//     MAPPING_VALUE_TRANSLATIONS_DELETE: 'mapping-value-translations:delete',
//     MAPPING_VALUE_TRANSLATIONS_SAVE_CONFIG: 'mapping-value-translations:save-config',

//     LOGS_LIST: 'logs:list',
//     PLATFORM_INFO: 'platform:info',
//     COPY_TO_CLIPBOARD: 'platform:copy',

//     MACHINES_RUNTIME_EVENT: 'machines:runtime:event',
// } as const;

// export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];



export const IPC_CHANNELS = {
  APP_GET_VERSION: "app:getVersion",
  APP_PING: "app:ping",
  LOG_RENDERER: "log:renderer",

  MACHINE_TCP_CONNECT: "machine:tcp:connect",
  MACHINE_TCP_SEND: "machine:tcp:send",
  MACHINE_TCP_DISCONNECT: "machine:tcp:disconnect",

  MACHINE_SERIAL_LIST: "machine:serial:list",
  MACHINE_SERIAL_CONNECT: "machine:serial:connect",
  MACHINE_SERIAL_SEND: "machine:serial:send",
  MACHINE_SERIAL_DISCONNECT: "machine:serial:disconnect",

  AUTH_LOGIN: "auth:login",
  AUTH_LOGOUT: "auth:logout",
  AUTH_ME: "auth:me",
  AUTH_CHANGE_PASSWORD: "auth:changePassword",
  AUTH_CURRENT_USER: "auth:currentUser",

  USERS_LIST: "users:list",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_RESET_PASSWORD: "users:resetPassword",
  USERS_DELETE: "users:delete",
  ROLES_LIST: "roles:list",
  ROLES_CREATE: "roles:create",
  ROLES_UPDATE: "roles:update",
  ROLES_DELETE: "roles:delete",
  ROLES_AUTHORITIES_CATALOG: "roles:authorities:catalog",

  LABS_LIST: "labs:list",
  LABS_CREATE: "labs:create",
  LABS_UPDATE: "labs:update",
  LABS_DELETE: "labs:delete",

  MACHINES_LIST: "machines:list",
  MACHINES_CREATE: "machines:create",
  MACHINES_UPDATE: "machines:update",
  MACHINE_MESSAGE: "machine:message",
  MACHINES_DELETE: "machines:delete",
  MACHINES_CONNECT: "machines:connect",
  MACHINES_DISCONNECT: "machines:disconnect",
  MACHINES_TEST: "machines:test",

  TARGETS_LIST: "targets:list",
  TARGETS_CREATE: "targets:create",
  TARGETS_UPDATE: "targets:update",
  TARGETS_TEST: "targets:test",
  TARGETS_DELETE: "targets:delete",
  TARGETS_HARNESS_SEND: "targets:harness:send",
  TARGET_MAPPINGS_LIST: "target-mappings:list",
  TARGET_MAPPINGS_CREATE: "target-mappings:create",
  TARGET_MAPPINGS_UPDATE: "target-mappings:update",
  TARGET_MAPPINGS_DELETE: "target-mappings:delete",
  TARGET_MAPPINGS_EXPORT: "target-mappings:export",
  TARGET_MAPPINGS_IMPORT: "target-mappings:import",

  TARGETS_SECRET_GET: "targets:secret:get",
  TARGETS_SECRET_SET: "targets:secret:set",
  TARGETS_SECRET_DELETE: "targets:secret:delete",

  LOGS_QUERY: "logs:query",

  OUTBOX_LIST: "outbox:list",
  OUTBOX_RETRY: "outbox:retry",
  OUTBOX_DELETE: "outbox:delete",

  CLIPBOARD_COPY: "clipboard:copy",

  MACHINES_RUNTIME_START: "machines:runtime:start",
  MACHINES_RUNTIME_STOP: "machines:runtime:stop",
  MACHINES_RUNTIME_RESTART: "machines:runtime:restart",
  MACHINES_RUNTIME_STATE: "machines:runtime:state",
  MACHINES_RUNTIME_STATES: "machines:runtime:states",

  MACHINES_LOGS_LIST: "machines:logs:list",
  MACHINES_LOGS_CLEAR: "machines:logs:clear",

  MACHINES_SIM_START: "machines:sim:start",
  MACHINES_SIM_STOP: "machines:sim:stop",
  MACHINES_SIM_RESTART: "machines:sim:restart",
  MACHINES_SIM_STATE: "machines:sim:state",
  MACHINES_SIM_STATES: "machines:sim:states",

  MACHINES_PARSED_LIST: "machines:parsed:list",
  MACHINES_NORMALIZED_LIST: "machines:normalized:list",

  APPROVAL_POLICIES_LIST: "approval-policies:list",
  APPROVAL_POLICIES_CREATE: "approval-policies:create",
  APPROVAL_POLICIES_UPDATE: "approval-policies:update",
  APPROVAL_POLICIES_DELETE: "approval-policies:delete",

  RESULTS_PENDING_APPROVALS: "results:pending-approvals",
  RESULT_APPROVE: "result:approve",
  RESULT_REJECT: "result:reject",
  RESULT_APPROVALS_LIST: "result:approvals:list",
  RESULT_REEVALUATE_POLICY: "result:reevaluate-policy",
  RESULT_APPROVALS_ALL: "result:approvals:all",

  OUTBOUND_QUEUE_LIST: "outbound-queue:list",
  OUTBOUND_QUEUE_PENDING: "outbound-queue:pending",

  DELIVERY_HISTORY_LIST: "delivery-history:list",
  DELIVERY_AUDIT_LIST: "delivery-audit:list",
  DELIVERY_AUDIT_QUERY: "delivery-audit:query",

  TARGET_TRANSFORM_PREVIEW: "targets:transform:preview",

  OUTBOUND_QUEUE_RETRY: "outbound-queue:retry",
  OUTBOUND_QUEUE_REQUEUE: "outbound-queue:requeue",
  OUTBOUND_QUEUE_SEND_NOW: "outbound-queue:send-now",

  TARGET_SECRETS_GET: "target-secrets:get",
  TARGET_SECRETS_SAVE: "target-secrets:save",
  TARGET_TRANSFORM_PREVIEW_FROM_QUEUE: "targets:transform:preview-from-queue",
  TARGET_TRANSFORM_PREVIEW_FROM_DELIVERY_HISTORY:
    "targets:transform:preview-from-delivery-history",

  MAPPINGS_LIST: "mappings:list",
  MAPPINGS_CREATE: "mappings:create",
  MAPPINGS_UPDATE: "mappings:update",
  MAPPINGS_DELETE: "mappings:delete",
  MAPPINGS_VALIDATE: "mappings:validate",
  MAPPINGS_OPENMRS_LIS_DISCOVER: "mappings:openmrs-lis:discover",
  MAPPINGS_OPENMRS_LIS_SEED: "mappings:openmrs-lis:seed",

  MAPPING_VALUE_TRANSLATIONS_LIST: "mapping-value-translations:list",
  MAPPING_VALUE_TRANSLATIONS_CREATE: "mapping-value-translations:create",
  MAPPING_VALUE_TRANSLATIONS_UPDATE: "mapping-value-translations:update",
  MAPPING_VALUE_TRANSLATIONS_DELETE: "mapping-value-translations:delete",
  MAPPING_VALUE_TRANSLATIONS_SAVE_CONFIG:
    "mapping-value-translations:save-config",

  LOGS_LIST: "logs:list",
  PLATFORM_INFO: "platform:info",
  COPY_TO_CLIPBOARD: "platform:copy",

  MACHINES_RUNTIME_EVENT: "machines:runtime:event",
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
