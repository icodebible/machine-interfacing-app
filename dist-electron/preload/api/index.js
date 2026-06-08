"use strict";
// import { ipcRenderer } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import type { AppAPI } from './types';
// import { RUNTIME_EVENT_CHANNEL } from '../../main/runtime/runtime-event-bus';
Object.defineProperty(exports, "__esModule", { value: true });
exports.api = void 0;
// export const api: AppAPI = {
//     // preload index.ts
//     copyToClipboard: (text: string) => ipcRenderer.invoke(IPC_CHANNELS.COPY_TO_CLIPBOARD, text),
//     // Base
//     getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
//     ping: (msg) => ipcRenderer.invoke(IPC_CHANNELS.APP_PING, msg),
//     log: (level, message) => ipcRenderer.send(IPC_CHANNELS.LOG_RENDERER, { level, message }),
//     // Machine TCP
//     tcpConnect: (host, port) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
//     tcpSend: (payload) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_SEND, payload),
//     tcpDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_DISCONNECT),
//     // Machine Serial
//     serialList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_LIST),
//     serialConnect: (path, baudRate) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_CONNECT, { path, baudRate }),
//     serialSend: (payload) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_SEND, payload),
//     serialDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT),
//     onMachineMessage: (cb) => {
//         const handler = (_: any, msg: any) => cb(msg);
//         ipcRenderer.on(IPC_CHANNELS.MACHINE_MESSAGE, handler);
//         return () => ipcRenderer.removeListener(IPC_CHANNELS.MACHINE_MESSAGE, handler);
//     },
//     // Auth
//     authLogin: (username: string, password: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, username, password),
//     authChangePassword: (userId: string, newPassword: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, userId, newPassword),
//     authCurrentUser: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_CURRENT_USER),
//     authLogout: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT),
//     // ✅ Labs
//     labsList: () => ipcRenderer.invoke(IPC_CHANNELS.LABS_LIST),
//     labsCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.LABS_CREATE, dto),
//     labsUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.LABS_UPDATE, id, dto),
//     labsDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.LABS_DELETE, id),
//     // ✅ Machines
//     // machinesList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LIST),
//     // machinesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CREATE, dto),
//     // machinesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_UPDATE, id, dto),
//     // machinesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DELETE, id),
//     // machinesConnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CONNECT, id),
//     // machinesDisconnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DISCONNECT, id),
//     // ✅ Machines
//     machinesList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LIST),
//     machinesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CREATE, dto),
//     machinesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_UPDATE, id, dto),
//     machinesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DELETE, id),
//     machinesConnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CONNECT, id),
//     machinesDisconnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DISCONNECT, id),
//     machinesTest: (machine) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_TEST, machine),
//     // ✅ Targets
//     targetsList: () => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_LIST),
//     targetsCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_CREATE, dto),
//     targetsUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_UPDATE, id, dto),
//     targetsDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_DELETE, id),
//     targetsTest: (id) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_TEST, id),
//     // ✅ Logs
//     logsQuery: (q) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_QUERY, q),
//     deliveryAuditList: (q) => ipcRenderer.invoke(IPC_CHANNELS.DELIVERY_AUDIT_LIST, q),
//     machinesRuntimeStart: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_RUNTIME_START, id),
//     machinesRuntimeStop: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_RUNTIME_STOP, id),
//     machinesRuntimeRestart: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_RUNTIME_RESTART, id),
//     machinesRuntimeState: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_RUNTIME_STATE, id),
//     machinesRuntimeStates: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_RUNTIME_STATES),
//     onMachinesRuntimeEvent: (cb) => {
//         const handler = (_: any, event: any) => cb(event);
//         ipcRenderer.on(RUNTIME_EVENT_CHANNEL, handler);
//         return () => ipcRenderer.removeListener(RUNTIME_EVENT_CHANNEL, handler);
//     },
//     machinesLogsList: (machineId, limit) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LOGS_LIST, machineId, limit),
//     machinesLogsClear: (machineId) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LOGS_CLEAR, machineId),
//     machinesSimStart: (machineId, scenario, intervalMs) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINES_SIM_START, machineId, scenario, intervalMs),
//     machinesSimStop: (machineId) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_SIM_STOP, machineId),
//     machinesSimRestart: (machineId, scenario, intervalMs) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINES_SIM_RESTART, machineId, scenario, intervalMs),
//     machinesSimState: (machineId) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_SIM_STATE, machineId),
//     machinesSimStates: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_SIM_STATES),
//     machinesParsedList: (machineId, limit) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINES_PARSED_LIST, machineId, limit),
//     machinesNormalizedList: (machineId, limit) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINES_NORMALIZED_LIST, machineId, limit),
//     approvalPoliciesList: () => ipcRenderer.invoke(IPC_CHANNELS.APPROVAL_POLICIES_LIST),
//     approvalPoliciesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.APPROVAL_POLICIES_CREATE, dto),
//     approvalPoliciesUpdate: (id, dto) =>
//         ipcRenderer.invoke(IPC_CHANNELS.APPROVAL_POLICIES_UPDATE, id, dto),
//     approvalPoliciesDelete: (id: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.APPROVAL_POLICIES_DELETE, id),
//     resultsPendingApprovals: (limit: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.RESULTS_PENDING_APPROVALS, limit),
//     resultApprove: (dto: any) => ipcRenderer.invoke(IPC_CHANNELS.RESULT_APPROVE, dto),
//     resultReject: (dto: any) => ipcRenderer.invoke(IPC_CHANNELS.RESULT_REJECT, dto),
//     resultApprovalsList: (normalizedResultId: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.RESULT_APPROVALS_LIST, normalizedResultId),
//     outboundQueueList: (limit: any) => ipcRenderer.invoke(IPC_CHANNELS.OUTBOUND_QUEUE_LIST, limit),
//     outboundQueuePending: (limit: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.OUTBOUND_QUEUE_PENDING, limit),
//     outboundQueueRetry: (queueId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.OUTBOUND_QUEUE_RETRY, queueId),
//     outboundQueueRequeue: (queueId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.OUTBOUND_QUEUE_REQUEUE, queueId),
//     outboundQueueSendNow: (queueId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.OUTBOUND_QUEUE_SEND_NOW, queueId),
//     resultApprovalsAll: (limit?: number) =>
//         ipcRenderer.invoke(IPC_CHANNELS.RESULT_APPROVALS_ALL, limit),
//     deliveryHistoryList: (limit?: number) =>
//         ipcRenderer.invoke(IPC_CHANNELS.DELIVERY_HISTORY_LIST, limit),
//     deliveryAuditQuery: (q: any) => ipcRenderer.invoke(IPC_CHANNELS.DELIVERY_AUDIT_QUERY, q),
//     targetTransformPreview: (targetId: string, normalizedResultId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW, targetId, normalizedResultId),
//     targetSecretsGet: (targetId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGET_SECRETS_GET, targetId),
//     targetSecretsSave: (targetId: string, dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGET_SECRETS_SAVE, targetId, dto),
//     mappingsList: () => ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_LIST),
//     mappingsCreate: (dto: any) => ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_CREATE, dto),
//     mappingsUpdate: (id: string, dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_UPDATE, id, dto),
//     mappingsDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_DELETE, id),
//     mappingsValidate: (targetType: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_VALIDATE, targetType),
//     mappingsOpenMrsLisDiscover: (dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_OPENMRS_LIS_DISCOVER, dto),
//     mappingsOpenMrsLisSeed: (dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_OPENMRS_LIS_SEED, dto),
//     mappingValueTranslationsList: (mappingRuleId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_LIST, mappingRuleId),
//     mappingValueTranslationsCreate: (dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_CREATE, dto),
//     mappingValueTranslationsUpdate: (id: string, dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_UPDATE, id, dto),
//     mappingValueTranslationsDelete: (id: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_DELETE, id),
//     mappingValueTranslationsSaveConfig: (mappingRuleId: string, dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_SAVE_CONFIG, mappingRuleId, dto),
//     targetTransformPreviewFromQueue: (queueId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_QUEUE, queueId),
//     targetTransformPreviewFromDeliveryHistory: (queueId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_DELIVERY_HISTORY, queueId),
//     // preload index.ts
//     targetsHarnessSend: (targetId, payload, previewName) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGETS_HARNESS_SEND, targetId, payload, previewName),
//     routingRulesList: () => ipcRenderer.invoke(IPC_CHANNELS.ROUTING_RULES_LIST),
//     routingRulesCreate: (payload: any) => ipcRenderer.invoke(IPC_CHANNELS.ROUTING_RULES_CREATE, payload),
//     routingRulesUpdate: (id: any, payload: any) => ipcRenderer.invoke(IPC_CHANNELS.ROUTING_RULES_UPDATE, id, payload),
//     routingRulesDelete: (id: any) => ipcRenderer.invoke(IPC_CHANNELS.ROUTING_RULES_DELETE, id),
//     routingRulesPreviewResult: (normalizedResultId: any, fallbackTargetIds: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.ROUTING_RULES_PREVIEW_RESULT, normalizedResultId, fallbackTargetIds ?? []),
//     usersList: () => ipcRenderer.invoke(IPC_CHANNELS.USERS_LIST),
//     usersCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.USERS_CREATE, dto),
//     usersUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.USERS_UPDATE, id, dto),
//     usersResetPassword: (id, newPassword) =>
//         ipcRenderer.invoke(IPC_CHANNELS.USERS_RESET_PASSWORD, id, newPassword),
//     usersDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.USERS_DELETE, id),
//     rolesList: () => ipcRenderer.invoke(IPC_CHANNELS.ROLES_LIST),
//     rolesAuthoritiesCatalog: () => ipcRenderer.invoke(IPC_CHANNELS.ROLES_AUTHORITIES_CATALOG),
//     rolesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.ROLES_CREATE, dto),
//     rolesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.ROLES_UPDATE, id, dto),
//     rolesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.ROLES_DELETE, id),
//     resultReevaluatePolicy: (normalizedResultId: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.RESULT_REEVALUATE_POLICY, normalizedResultId),
// };
// import { ipcRenderer } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import type { AppAPI } from './types';
// import { RUNTIME_EVENT_CHANNEL } from '../../main/runtime/runtime-event-bus';
// export const api: AppAPI = {
//     // preload index.ts
//     copyToClipboard: (text: string) => ipcRenderer.invoke(IPC_CHANNELS.COPY_TO_CLIPBOARD, text),
//     // Base
//     getAppVersion: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_VERSION),
//     ping: (msg) => ipcRenderer.invoke(IPC_CHANNELS.APP_PING, msg),
//     log: (level, message) => ipcRenderer.send(IPC_CHANNELS.LOG_RENDERER, { level, message }),
//     // Machine TCP
//     tcpConnect: (host, port) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_CONNECT, { host, port }),
//     tcpSend: (payload) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_SEND, payload),
//     tcpDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_TCP_DISCONNECT),
//     // Machine Serial
//     serialList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_LIST),
//     serialConnect: (path, baudRate) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_CONNECT, { path, baudRate }),
//     serialSend: (payload) => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_SEND, payload),
//     serialDisconnect: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINE_SERIAL_DISCONNECT),
//     onMachineMessage: (cb) => {
//         const handler = (_: any, msg: any) => cb(msg);
//         ipcRenderer.on(IPC_CHANNELS.MACHINE_MESSAGE, handler);
//         return () => ipcRenderer.removeListener(IPC_CHANNELS.MACHINE_MESSAGE, handler);
//     },
//     // Auth
//     authLogin: (username: string, password: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGIN, username, password),
//     authChangePassword: (userId: string, newPassword: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, userId, newPassword),
//     authCurrentUser: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_CURRENT_USER),
//     authLogout: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LOGOUT),
//     // ✅ Labs
//     labsList: () => ipcRenderer.invoke(IPC_CHANNELS.LABS_LIST),
//     labsCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.LABS_CREATE, dto),
//     labsUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.LABS_UPDATE, id, dto),
//     labsDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.LABS_DELETE, id),
//     // ✅ Machines
//     // machinesList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LIST),
//     // machinesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CREATE, dto),
//     // machinesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_UPDATE, id, dto),
//     // machinesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DELETE, id),
//     // machinesConnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CONNECT, id),
//     // machinesDisconnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DISCONNECT, id),
//     // ✅ Machines
//     machinesList: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LIST),
//     machinesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CREATE, dto),
//     machinesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_UPDATE, id, dto),
//     machinesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DELETE, id),
//     machinesConnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_CONNECT, id),
//     machinesDisconnect: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_DISCONNECT, id),
//     machinesTest: (machine) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_TEST, machine),
//     // ✅ Targets
//     targetsList: () => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_LIST),
//     targetsCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_CREATE, dto),
//     targetsUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_UPDATE, id, dto),
//     targetsDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_DELETE, id),
//     targetsTest: (id) => ipcRenderer.invoke(IPC_CHANNELS.TARGETS_TEST, id),
//     // ✅ Logs
//     logsQuery: (q) => ipcRenderer.invoke(IPC_CHANNELS.LOGS_QUERY, q),
//     deliveryAuditList: (q) => ipcRenderer.invoke(IPC_CHANNELS.DELIVERY_AUDIT_LIST, q),
//     machinesRuntimeStart: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_RUNTIME_START, id),
//     machinesRuntimeStop: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_RUNTIME_STOP, id),
//     machinesRuntimeRestart: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_RUNTIME_RESTART, id),
//     machinesRuntimeState: (id) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_RUNTIME_STATE, id),
//     machinesRuntimeStates: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_RUNTIME_STATES),
//     onMachinesRuntimeEvent: (cb) => {
//         const handler = (_: any, event: any) => cb(event);
//         ipcRenderer.on(RUNTIME_EVENT_CHANNEL, handler);
//         return () => ipcRenderer.removeListener(RUNTIME_EVENT_CHANNEL, handler);
//     },
//     machinesLogsList: (machineId, limit) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LOGS_LIST, machineId, limit),
//     machinesLogsClear: (machineId) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_LOGS_CLEAR, machineId),
//     machinesSimStart: (machineId, scenario, intervalMs) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINES_SIM_START, machineId, scenario, intervalMs),
//     machinesSimStop: (machineId) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_SIM_STOP, machineId),
//     machinesSimRestart: (machineId, scenario, intervalMs) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINES_SIM_RESTART, machineId, scenario, intervalMs),
//     machinesSimState: (machineId) => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_SIM_STATE, machineId),
//     machinesSimStates: () => ipcRenderer.invoke(IPC_CHANNELS.MACHINES_SIM_STATES),
//     machinesParsedList: (machineId, limit) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINES_PARSED_LIST, machineId, limit),
//     machinesNormalizedList: (machineId, limit) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MACHINES_NORMALIZED_LIST, machineId, limit),
//     approvalPoliciesList: () => ipcRenderer.invoke(IPC_CHANNELS.APPROVAL_POLICIES_LIST),
//     approvalPoliciesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.APPROVAL_POLICIES_CREATE, dto),
//     approvalPoliciesUpdate: (id, dto) =>
//         ipcRenderer.invoke(IPC_CHANNELS.APPROVAL_POLICIES_UPDATE, id, dto),
//     approvalPoliciesDelete: (id: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.APPROVAL_POLICIES_DELETE, id),
//     resultsPendingApprovals: (limit: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.RESULTS_PENDING_APPROVALS, limit),
//     resultApprove: (dto: any) => ipcRenderer.invoke(IPC_CHANNELS.RESULT_APPROVE, dto),
//     resultReject: (dto: any) => ipcRenderer.invoke(IPC_CHANNELS.RESULT_REJECT, dto),
//     resultApprovalsList: (normalizedResultId: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.RESULT_APPROVALS_LIST, normalizedResultId),
//     outboundQueueList: (limit: any) => ipcRenderer.invoke(IPC_CHANNELS.OUTBOUND_QUEUE_LIST, limit),
//     outboundQueuePending: (limit: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.OUTBOUND_QUEUE_PENDING, limit),
//     outboundQueueRetry: (queueId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.OUTBOUND_QUEUE_RETRY, queueId),
//     outboundQueueRequeue: (queueId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.OUTBOUND_QUEUE_REQUEUE, queueId),
//     outboundQueueSendNow: (queueId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.OUTBOUND_QUEUE_SEND_NOW, queueId),
//     resultApprovalsAll: (limit?: number) =>
//         ipcRenderer.invoke(IPC_CHANNELS.RESULT_APPROVALS_ALL, limit),
//     deliveryHistoryList: (limit?: number) =>
//         ipcRenderer.invoke(IPC_CHANNELS.DELIVERY_HISTORY_LIST, limit),
//     deliveryAuditQuery: (q: any) => ipcRenderer.invoke(IPC_CHANNELS.DELIVERY_AUDIT_QUERY, q),
//     targetTransformPreview: (targetId: string, normalizedResultId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW, targetId, normalizedResultId),
//     targetSecretsGet: (targetId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGET_SECRETS_GET, targetId),
//     targetSecretsSave: (targetId: string, dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGET_SECRETS_SAVE, targetId, dto),
//     mappingsList: () => ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_LIST),
//     mappingsCreate: (dto: any) => ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_CREATE, dto),
//     mappingsUpdate: (id: string, dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_UPDATE, id, dto),
//     mappingsDelete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_DELETE, id),
//     mappingsValidate: (targetType: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPINGS_VALIDATE, targetType),
//     mappingValueTranslationsList: (mappingRuleId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_LIST, mappingRuleId),
//     mappingValueTranslationsCreate: (dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_CREATE, dto),
//     mappingValueTranslationsUpdate: (id: string, dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_UPDATE, id, dto),
//     mappingValueTranslationsDelete: (id: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_DELETE, id),
//     mappingValueTranslationsSaveConfig: (mappingRuleId: string, dto: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_SAVE_CONFIG, mappingRuleId, dto),
//     targetTransformPreviewFromQueue: (queueId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_QUEUE, queueId),
//     targetTransformPreviewFromDeliveryHistory: (queueId: string) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_DELIVERY_HISTORY, queueId),
//     // preload index.ts
//     targetsHarnessSend: (targetId, payload, previewName) =>
//         ipcRenderer.invoke(IPC_CHANNELS.TARGETS_HARNESS_SEND, targetId, payload, previewName),
//     usersList: () => ipcRenderer.invoke(IPC_CHANNELS.USERS_LIST),
//     usersCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.USERS_CREATE, dto),
//     usersUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.USERS_UPDATE, id, dto),
//     usersResetPassword: (id, newPassword) =>
//         ipcRenderer.invoke(IPC_CHANNELS.USERS_RESET_PASSWORD, id, newPassword),
//     usersDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.USERS_DELETE, id),
//     rolesList: () => ipcRenderer.invoke(IPC_CHANNELS.ROLES_LIST),
//     rolesAuthoritiesCatalog: () => ipcRenderer.invoke(IPC_CHANNELS.ROLES_AUTHORITIES_CATALOG),
//     rolesCreate: (dto) => ipcRenderer.invoke(IPC_CHANNELS.ROLES_CREATE, dto),
//     rolesUpdate: (id, dto) => ipcRenderer.invoke(IPC_CHANNELS.ROLES_UPDATE, id, dto),
//     rolesDelete: (id) => ipcRenderer.invoke(IPC_CHANNELS.ROLES_DELETE, id),
//     resultReevaluatePolicy: (normalizedResultId: any) =>
//         ipcRenderer.invoke(IPC_CHANNELS.RESULT_REEVALUATE_POLICY, normalizedResultId),
// };
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
    outboundQueueRebuildPayload: (queueId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.OUTBOUND_QUEUE_REBUILD_PAYLOAD, queueId),
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
    mappingsOpenMrsLisDiscover: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPINGS_OPENMRS_LIS_DISCOVER, dto),
    mappingsOpenMrsLisSeed: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPINGS_OPENMRS_LIS_SEED, dto),
    lisTestOrderProfilesList: (targetId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_LIST, targetId),
    lisTestOrderProfileGet: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_GET, id),
    lisTestOrderProfileSave: (payload) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_SAVE, payload),
    lisTestOrderProfileSetEnabled: (id, enabled) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_SET_ENABLED, id, enabled),
    lisTestOrderProfileDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.LIS_TEST_ORDER_PROFILES_DELETE, id),
    mappingValueTranslationsList: (mappingRuleId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_LIST, mappingRuleId),
    mappingValueTranslationsCreate: (dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_CREATE, dto),
    mappingValueTranslationsUpdate: (id, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_UPDATE, id, dto),
    mappingValueTranslationsDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_DELETE, id),
    mappingValueTranslationsSaveConfig: (mappingRuleId, dto) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_SAVE_CONFIG, mappingRuleId, dto),
    targetTransformPreviewFromQueue: (queueId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_QUEUE, queueId),
    targetTransformPreviewFromDeliveryHistory: (queueId) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.TARGET_TRANSFORM_PREVIEW_FROM_DELIVERY_HISTORY, queueId),
    routingRulesList: () => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.ROUTING_RULES_LIST),
    routingRulesCreate: (payload) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.ROUTING_RULES_CREATE, payload),
    routingRulesUpdate: (id, patch) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.ROUTING_RULES_UPDATE, id, patch),
    routingRulesDelete: (id) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.ROUTING_RULES_DELETE, id),
    routingRulesPreviewResult: (normalizedResultId, fallbackTargetIds = []) => electron_1.ipcRenderer.invoke(channels_1.IPC_CHANNELS.ROUTING_RULES_PREVIEW_RESULT, normalizedResultId, fallbackTargetIds),
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
