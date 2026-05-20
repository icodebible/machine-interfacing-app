"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const runtime_event_bus_1 = require("../../main/runtime/runtime-event-bus");
exports.api = {
    // preload index.ts
    copyToClipboard: (text) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.COPY_TO_CLIPBOARD, text),
    // Base
    getAppVersion: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APP_GET_VERSION),
    ping: (msg) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APP_PING, msg),
    log: (level, message) => electron_1.ipcRenderer.send(channels_1.IPC_CHANNELS.LOG_RENDERER, { level, message }),
    // Machine TCP
    tcpConnect: (host, port) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
    tcpSend: (payload) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_TCP_SEND, payload),
    tcpDisconnect: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_TCP_DISCONNECT),
    // Machine Serial
    serialList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_LIST),
    serialConnect: (path, baudRate) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_CONNECT, { path, baudRate }),
    serialSend: (payload) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_SEND, payload),
    serialDisconnect: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT),
    onMachineMessage: (cb) => {
        const handler = (_, msg) => cb(msg);
        electron_1.ipcRenderer.on(channels_1.IPC_CHANNELS.MACHINE_MESSAGE, handler);
        return () => electron_1.ipcRenderer.removeListener(channels_1.IPC_CHANNELS.MACHINE_MESSAGE, handler);
    },
    // Auth
    authLogin: (username, password) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.AUTH_LOGIN, username, password),
    authChangePassword: (userId, newPassword) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.AUTH_CHANGE_PASSWORD, userId, newPassword),
    authCurrentUser: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.AUTH_CURRENT_USER),
    authLogout: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.AUTH_LOGOUT),
    // ✅ Labs
    labsList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LABS_LIST),
    labsCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LABS_CREATE, dto),
    labsUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LABS_UPDATE, id, dto),
    labsDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LABS_DELETE, id),
    // ✅ Machines
    // machinesList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LIST),
    // machinesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CREATE, dto),
    // machinesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_UPDATE, id, dto),
    // machinesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DELETE, id),
    // machinesConnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CONNECT, id),
    // machinesDisconnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DISCONNECT, id),
    // ✅ Machines
    machinesList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_LIST),
    machinesCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_CREATE, dto),
    machinesUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_UPDATE, id, dto),
    machinesDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_DELETE, id),
    machinesConnect: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_CONNECT, id),
    machinesDisconnect: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_DISCONNECT, id),
    machinesTest: (machine) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_TEST, machine),
    // ✅ Targets
    targetsList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_LIST),
    targetsCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_CREATE, dto),
    targetsUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_UPDATE, id, dto),
    targetsDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_DELETE, id),
    targetsTest: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_TEST, id),
    // ✅ Logs
    logsQuery: (q) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LOGS_QUERY, q),
    deliveryAuditList: (q) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.DELIVERY_AUDIT_LIST, q),
    machinesRuntimeStart: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_RUNTIME_START, id),
    machinesRuntimeStop: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_RUNTIME_STOP, id),
    machinesRuntimeRestart: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_RUNTIME_RESTART, id),
    machinesRuntimeState: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_RUNTIME_STATE, id),
    machinesRuntimeStates: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_RUNTIME_STATES),
    onMachinesRuntimeEvent: (cb) => {
        const handler = (_, event) => cb(event);
        electron_1.ipcRenderer.on(runtime_event_bus_1.RUNTIME_EVENT_CHANNEL, handler);
        return () => electron_1.ipcRenderer.removeListener(runtime_event_bus_1.RUNTIME_EVENT_CHANNEL, handler);
    },
    machinesLogsList: (machineId, limit) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_LOGS_LIST, machineId, limit),
    machinesLogsClear: (machineId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_LOGS_CLEAR, machineId),
    machinesSimStart: (machineId, scenario, intervalMs) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_SIM_START, machineId, scenario, intervalMs),
    machinesSimStop: (machineId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_SIM_STOP, machineId),
    machinesSimRestart: (machineId, scenario, intervalMs) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_SIM_RESTART, machineId, scenario, intervalMs),
    machinesSimState: (machineId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_SIM_STATE, machineId),
    machinesSimStates: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_SIM_STATES),
    machinesParsedList: (machineId, limit) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_PARSED_LIST, machineId, limit),
    machinesNormalizedList: (machineId, limit) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MACHINES_NORMALIZED_LIST, machineId, limit),
    approvalPoliciesList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APPROVAL_POLICIES_LIST),
    approvalPoliciesCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APPROVAL_POLICIES_CREATE, dto),
    approvalPoliciesUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APPROVAL_POLICIES_UPDATE, id, dto),
    approvalPoliciesDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.APPROVAL_POLICIES_DELETE, id),
    resultsPendingApprovals: (limit) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.RESULTS_PENDING_APPROVALS, limit),
    resultApprove: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.RESULT_APPROVE, dto),
    resultReject: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.RESULT_REJECT, dto),
    resultApprovalsList: (normalizedResultId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.RESULT_APPROVALS_LIST, normalizedResultId),
    outboundQueueList: (limit) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_LIST, limit),
    outboundQueuePending: (limit) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_PENDING, limit),
    outboundQueueRetry: (queueId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_RETRY, queueId),
    outboundQueueRequeue: (queueId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_REQUEUE, queueId),
    outboundQueueSendNow: (queueId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_SEND_NOW, queueId),
    resultApprovalsAll: (limit) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.RESULT_APPROVALS_ALL, limit),
    deliveryHistoryList: (limit) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.DELIVERY_HISTORY_LIST, limit),
    deliveryAuditQuery: (q) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.DELIVERY_AUDIT_QUERY, q),
    targetTransformPreview: (targetId, normalizedResultId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW, targetId, normalizedResultId),
    targetSecretsGet: (targetId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGET_SECRETS_GET, targetId),
    targetSecretsSave: (targetId, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGET_SECRETS_SAVE, targetId, dto),
    mappingsList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPINGS_LIST),
    mappingsCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPINGS_CREATE, dto),
    mappingsUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPINGS_UPDATE, id, dto),
    mappingsDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPINGS_DELETE, id),
    mappingsValidate: (targetType) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPINGS_VALIDATE, targetType),
    mappingValueTranslationsList: (mappingRuleId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_LIST, mappingRuleId),
    mappingValueTranslationsCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_CREATE, dto),
    mappingValueTranslationsUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_UPDATE, id, dto),
    mappingValueTranslationsDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_DELETE, id),
    mappingValueTranslationsSaveConfig: (mappingRuleId, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_SAVE_CONFIG, mappingRuleId, dto),
    targetTransformPreviewFromQueue: (queueId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_QUEUE, queueId),
    targetTransformPreviewFromDeliveryHistory: (queueId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_DELIVERY_HISTORY, queueId),
    // preload index.ts
    targetsHarnessSend: (targetId, payload, previewName) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGETS_HARNESS_SEND, targetId, payload, previewName),
    usersList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.USERS_LIST),
    usersCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.USERS_CREATE, dto),
    usersUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.USERS_UPDATE, id, dto),
    usersResetPassword: (id, newPassword) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.USERS_RESET_PASSWORD, id, newPassword),
    usersDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.USERS_DELETE, id),
    rolesList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.ROLES_LIST),
    rolesAuthoritiesCatalog: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.ROLES_AUTHORITIES_CATALOG),
    rolesCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.ROLES_CREATE, dto),
    rolesUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.ROLES_UPDATE, id, dto),
    rolesDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.ROLES_DELETE, id),
    resultReevaluatePolicy: (normalizedResultId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.RESULT_REEVALUATE_POLICY, normalizedResultId),
};
