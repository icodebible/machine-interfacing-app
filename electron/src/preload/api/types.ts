// // export type AuthorityCode =
// //     | 'USERS_WRITE'
// //     | 'ROLES_WRITE'
// //     | 'LABS_WRITE'
// //     | 'MACHINES_WRITE'
// //     | 'MAPPINGS_WRITE'
// //     | 'ROUTES_WRITE'
// //     | 'VIEW_LOGS'
// //     | 'OUTBOX_MANAGE'
// //     | 'AUDIT_READ'
// //     | 'SUPER_ADMIN'
// //     | 'RESULT_VIEW'
// //     | 'RESULT_APPROVE'
// //     | 'RESULT_REJECT'
// //     | 'RESULT_ROUTE'
// //     | 'RESULT_REQUEUE'
// //     | 'APPROVAL_POLICY_READ'
// //     | 'APPROVAL_POLICY_WRITE'
// //     | 'TARGET_CONFIG_WRITE'
// //     | 'MAPPING_WRITE'
// //     | 'AUDIT_VIEW'
// //     | 'RESULT_VIEW_SENSITIVE';

// // export type CurrentUserSnapshot = {
// //     id: string;
// //     username: string;
// //     roles: string[];
// //     roleIds: string[];
// //     authorities: AuthorityCode[];
// //     mustChangePassword: boolean;
// // };

// // export type RetryBackoffStrategy = 'FIXED' | 'LINEAR' | 'EXPONENTIAL';

// // export type ConnectionType = 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';

// // export type ProtocolType = 'HL7' | 'ASTM' | 'RAW';

// // export type Lab = {
// //     id: string;
// //     code?: string | null;
// //     name: string;
// //     location?: string | null;
// //     description?: string | null;
// //     is_active: number;
// //     created_at: string;
// //     updated_at: string;
// //     created_by_user_id?: string | null;
// //     created_by_username?: string | null;
// //     updated_by_user_id?: string | null;
// //     updated_by_username?: string | null;
// // };

// // export type Machine = {
// //     id: string;
// //     lab_id?: string | null;
// //     lab_name?: string | null;

// //     name: string;
// //     code?: string | null;
// //     brand?: string | null;
// //     model?: string | null;
// //     version?: string | null;
// //     manufacturer?: string | null;

// //     connection_type: ConnectionType;
// //     protocol: ProtocolType;

// //     // TCP / HL7_MLLP
// //     host?: string | null;
// //     port?: number | null;

// //     // SERIAL
// //     serial_port?: string | null;
// //     baud_rate?: number | null;
// //     data_bits?: number | null;
// //     stop_bits?: number | null;
// //     parity?: 'none' | 'even' | 'odd' | 'mark' | 'space' | null;

// //     // FTP / SFTP
// //     ftp_host?: string | null;
// //     ftp_port?: number | null;
// //     ftp_user?: string | null;
// //     ftp_password?: string | null;
// //     ftp_remote_dir?: string | null;

// //     // FILE WATCHER
// //     watch_dir?: string | null;
// //     watch_pattern?: string | null;

// //     is_active: number;
// //     auto_connect: number;

// //     created_at: string;
// //     updated_at: string;
// //     created_by_user_id?: string | null;
// //     created_by_username?: string | null;
// //     updated_by_user_id?: string | null;
// //     updated_by_username?: string | null;
// // };

// // export type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

// // export type Target = {
// //     id: string;
// //     type: TargetType;
// //     name: string;
// //     base_url: string;
// //     enabled: number;
// //     auto_retry_enabled?: number;
// //     max_retry_attempts?: number | null;
// //     retry_backoff_strategy?: RetryBackoffStrategy | null;
// //     initial_retry_delay_ms?: number | null;
// //     max_retry_delay_ms?: number | null;
// //     request_timeout_ms?: number | null;
// //     created_at: string;
// //     updated_at: string;
// //     created_by_user_id?: string | null;
// //     created_by_username?: string | null;
// //     updated_by_user_id?: string | null;
// //     updated_by_username?: string | null;
// // };

// // export type UserRow = {
// //     id: string;
// //     username: string;
// //     is_active: number;
// //     must_change_password: number;
// //     role_ids: string[];
// //     role_names: string[];
// //     authorities: AuthorityCode[];
// //     created_at: string;
// //     updated_at: string;
// // };

// // export type RoleRow = {
// //     id: string;
// //     name: string;
// //     description?: string | null;
// //     authority_codes: AuthorityCode[];
// //     user_count: number;
// //     created_at: string;
// //     updated_at?: string | null;
// // };

// // export type LogRow = {
// //     id: string;
// //     level: 'info' | 'warn' | 'error';
// //     source: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
// //     entity_type?: string | null;
// //     entity_id?: string | null;
// //     message: string;
// //     payload_json?: string | null;
// //     created_at: string;
// // };

// // export type LogsQuery = {
// //     level?: 'info' | 'warn' | 'error';
// //     source?: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
// //     entityType?: string;
// //     entityId?: string;
// //     limit?: number;
// // };

// // export type NormalizedResultRow = {
// //     id: string;
// //     machine_id: string;
// //     protocol: 'ASTM' | 'HL7' | 'RAW';
// //     sample_id?: string | null;
// //     patient_id?: string | null;
// //     patient_name?: string | null;
// //     order_id?: string | null;
// //     test_code?: string | null;
// //     test_name?: string | null;
// //     value?: string | null;
// //     units?: string | null;
// //     reference_range?: string | null;
// //     abnormal_flag?: string | null;
// //     observed_at?: string | null;
// //     source_message_type?: string | null;
// //     summary?: string | null;
// //     data_json: string;
// //     created_at: string;
// //     created_by_user_id?: string | null;
// //     created_by_username?: string | null;
// // };

// // export type MachineRuntimeState = {
// //     machineId: string;
// //     status: 'disconnected' | 'connecting' | 'connected' | 'idle' | 'stopped' | 'error';
// //     message?: string | null;
// //     startedAt?: string | null;
// //     updatedAt: string;
// // };

// // export type ApprovalPolicyRow = {
// //     id: string;
// //     name: string;
// //     enabled: number;
// //     applies_to_lab_id?: string | null;
// //     applies_to_machine_id?: string | null;
// //     applies_to_target_id?: string | null;
// //     requires_approval: number;
// //     min_approvals: number;
// //     created_at: string;
// //     updated_at: string;
// // };

// // export type WorkflowStatusRow = {
// //     id: string;
// //     normalized_result_id: string;
// //     status:
// //     | 'RECEIVED'
// //     | 'PARSED'
// //     | 'NORMALIZED'
// //     | 'PENDING_APPROVAL'
// //     | 'PENDING_POLICY'
// //     | 'POLICY_DISABLED'
// //     | 'APPROVED'
// //     | 'REJECTED'
// //     | 'QUEUED'
// //     | 'ROUTED'
// //     | 'FAILED_DELIVERY';
// //     approval_policy_id?: string | null;
// //     approval_required: number;
// //     approval_count_required: number;
// //     approval_count_received: number;
// //     queued_at?: string | null;
// //     routed_at?: string | null;
// //     failed_at?: string | null;
// //     last_error?: string | null;
// //     created_at: string;
// //     updated_at: string;
// //     created_by_user_id?: string | null;
// //     created_by_username?: string | null;
// //     updated_by_user_id?: string | null;
// //     updated_by_username?: string | null;
// // };

// // export type MachineTrafficLog = {
// //     id: string;
// //     machine_id: string;
// //     direction: 'inbound' | 'outbound' | 'system';
// //     transport: 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
// //     protocol: 'ASTM' | 'HL7' | 'RAW';
// //     event_type:
// //     | 'connected'
// //     | 'disconnected'
// //     | 'payload'
// //     | 'parse_success'
// //     | 'parse_error'
// //     | 'test'
// //     | 'error';
// //     payload?: string | null;
// //     payload_preview?: string | null;
// //     created_at: string;
// //     created_by_user_id?: string | null;
// //     created_by_username?: string | null;
// // };

// // export type ParsedMessageRow = {
// //     id: string;
// //     machine_id: string;
// //     protocol: 'ASTM' | 'HL7' | 'RAW';
// //     message_type: string;
// //     summary?: string | null;
// //     data_json: string;
// //     raw?: string | null;
// //     created_at: string;
// //     created_by_user_id?: string | null;
// //     created_by_username?: string | null;
// // };

// // export type RuntimeEvent =
// //     | {
// //         type: 'state';
// //         machineId: string;
// //         status: string;
// //         message?: string | null;
// //         updatedAt: string;
// //     }
// //     | {
// //         type: 'traffic';
// //         machineId: string;
// //         direction: 'inbound' | 'outbound' | 'system';
// //         payloadPreview: string;
// //         updatedAt: string;
// //     };

// // export type MachineSimulationScenario = 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING';

// // export type MachineSimulationState = {
// //     machineId: string;
// //     running: boolean;
// //     scenario?: MachineSimulationScenario | null;
// //     intervalMs?: number | null;
// //     updatedAt: string;
// // };

// // export type ApprovalPolicy = {
// //     id: string;
// //     name: string;
// //     enabled: number;
// //     applies_to_lab_id?: string | null;
// //     applies_to_machine_id?: string | null;
// //     applies_to_target_id?: string | null;
// //     requires_approval: number;
// //     min_approvals: number;
// //     created_at: string;
// //     updated_at: string;
// //     route_target_ids?: string[];
// // };

// // export type ResultWorkflowRow = {
// //     id: string;
// //     normalized_result_id: string;
// //     status:
// //     | 'RECEIVED'
// //     | 'PARSED'
// //     | 'NORMALIZED'
// //     | 'PENDING_APPROVAL'
// //     | 'PENDING_POLICY'
// //     | 'POLICY_DISABLED'
// //     | 'APPROVED'
// //     | 'REJECTED'
// //     | 'QUEUED'
// //     | 'ROUTED'
// //     | 'FAILED_DELIVERY';
// //     approval_policy_id?: string | null;
// //     approval_required: number;
// //     approval_count_required: number;
// //     approval_count_received: number;
// //     queued_at?: string | null;
// //     routed_at?: string | null;
// //     failed_at?: string | null;
// //     last_error?: string | null;
// //     created_at: string;
// //     updated_at: string;
// //     created_by_user_id?: string | null;
// //     created_by_username?: string | null;
// //     updated_by_user_id?: string | null;
// //     updated_by_username?: string | null;
// // };

// // export type ResultApprovalRow = {
// //     id: string;
// //     normalized_result_id: string;
// //     policy_id: string;
// //     step_order: number;
// //     approver_user_id: string;
// //     action: 'APPROVED' | 'REJECTED' | 'RETURNED';
// //     comment?: string | null;
// //     acted_at: string;
// //     policy_name?: string | null;
// //     approver_display_name?: string | null;
// //     approver_username?: string | null;
// //     approver_roles?: string[];
// //     snapshot_result?: any;
// //     snapshot_policy?: any;
// //     snapshot_route_targets?: any[];
// //     created_by_user_id?: string | null;
// //     created_by_username?: string | null;
// //     updated_by_user_id?: string | null;
// //     updated_by_username?: string | null;
// // };

// // export type OutboundQueueRow = {
// //     id: string;
// //     normalized_result_id: string;
// //     target_id: string;
// //     payload_json: string;
// //     preview_name?: string | null;
// //     source_snapshot_json?: string | null;
// //     transform_warnings_json?: string | null;
// //     transform_errors_json?: string | null;
// //     transform_summary_json?: string | null;
// //     delivery_status: 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED';
// //     retry_count: number;
// //     next_retry_at?: string | null;
// //     last_error?: string | null;
// //     target_name?: string | null;
// //     target_type?: TargetType | null;
// //     target_enabled?: number | null;
// //     target_auto_retry_enabled?: number | null;
// //     target_max_retry_attempts?: number | null;
// //     target_retry_backoff_strategy?: RetryBackoffStrategy | null;
// //     target_initial_retry_delay_ms?: number | null;
// //     target_max_retry_delay_ms?: number | null;
// //     target_request_timeout_ms?: number | null;
// //     created_at: string;
// //     updated_at: string;
// //     created_by_user_id?: string | null;
// //     created_by_username?: string | null;
// //     updated_by_user_id?: string | null;
// //     updated_by_username?: string | null;
// // };

// // export type DeliveryAuditQuery = {
// //     queueId?: string;
// //     targetId?: string;
// //     operation?: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
// //     status?: 'STARTED' | 'DELIVERED' | 'FAILED';
// //     correlationId?: string;
// //     limit?: number;
// // };

// // export type DeliveryAuditRow = {
// //     id: string;
// //     queue_id: string;
// //     target_id: string;
// //     target_name?: string | null;
// //     target_type?: TargetType | string | null;
// //     operation: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
// //     status: 'STARTED' | 'DELIVERED' | 'FAILED';
// //     attempt_no: number;
// //     http_status?: number | null;
// //     correlation_id?: string | null;
// //     duration_ms?: number | null;
// //     error_message?: string | null;
// //     queue_delivery_status?: string | null;
// //     queue_retry_count?: number | null;
// //     queue_last_error?: string | null;
// //     queue_updated_at?: string | null;
// //     created_at: string;
// // };

// // export type TargetTransformPreview = {
// //     targetId: string;
// //     targetType: TargetType;
// //     normalizedResultId: string;
// //     previewName: string;
// //     payload: Record<string, any>;
// //     warnings?: string[];
// // };

// // export type TargetSecretConfig = {
// //     targetId: string;
// //     authType: 'none' | 'bearer' | 'basic' | 'api_key';
// //     username?: string | null;
// //     password?: string | null;
// //     token?: string | null;
// //     apiKeyName?: string | null;
// //     apiKeyValue?: string | null;
// //     allowInsecureTls: boolean;
// // };

// // export type TargetDiagnosticsResult = {
// //     ok: boolean;
// //     message: string;
// //     details?: {
// //         targetId: string;
// //         targetName?: string;
// //         targetType?: string;
// //         baseUrl?: string;
// //         authType?: string;
// //         tlsMode?: 'strict' | 'insecure-dev';
// //         httpStatus?: number | null;
// //         checkedAt: string;
// //         notes?: string[];
// //     };
// // };

// // export type TargetHarnessResult = {
// //     ok: boolean;
// //     message: string;
// //     correlationId?: string | null;
// //     details?: {
// //         targetId: string;
// //         targetName?: string;
// //         targetType?: string;
// //         endpoint?: string;
// //         label?: string | null;
// //         authType?: string;
// //         authConfigured?: boolean;
// //         tlsMode?: 'strict' | 'insecure-dev';
// //         httpStatus?: number | null;
// //         checkedAt: string;
// //         notes?: string[];
// //         responseSnippet?: string | null;
// //     };
// // };

// // export type MappingUnmappedBehavior = 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR';

// // export type MappingValueTranslation = {
// //     id: string;
// //     mapping_rule_id: string;
// //     source_value: string;
// //     destination_value?: string | null;
// //     enabled: number;
// //     note?: string | null;
// //     created_at: string;
// //     updated_at: string;
// // };

// // export type MappingRule = {
// //     id: string;
// //     target_type: TargetType;
// //     source_field: string;
// //     destination_field: string;
// //     transform_kind: 'direct' | 'constant' | 'lookup';
// //     constant_value?: string | null;
// //     enabled: number;
// //     value_mapping_enabled?: number;
// //     unmapped_behavior?: MappingUnmappedBehavior | null;
// //     default_destination_value?: string | null;
// //     created_at: string;
// //     updated_at: string;
// // };

// // export type MappingValidationResult = {
// //     ok: boolean;
// //     message: string;
// //     targetType?: TargetType | 'ALL';
// //     errors?: string[];
// //     warnings?: string[];
// //     recommendations?: string[];
// //     summary?: {
// //         enabledRules: number;
// //         duplicateDestinations: number;
// //         unsupportedKinds: number;
// //     };
// // };

// // export type AppAPI = {
// //     getAppVersion: () => Promise<string>;
// //     ping: (msg: string) => Promise<string>;
// //     log: (level: 'info' | 'warn' | 'error', message: string) => void;

// //     tcpConnect: (host: string, port: number) => Promise<boolean>;
// //     tcpSend: (payload: string) => Promise<boolean>;
// //     tcpDisconnect: () => Promise<boolean>;

// //     serialList: () => Promise<any[]>;
// //     serialConnect: (path: string, baudRate: number) => Promise<boolean>;
// //     serialSend: (payload: string) => Promise<boolean>;
// //     serialDisconnect: () => Promise<boolean>;

// //     onMachineMessage: (cb: (msg: any) => void) => () => void;

// //     authLogin: (
// //         username: string,
// //         password: string,
// //     ) => Promise<{
// //         user: { id: string; username: string; authorities: string[]; mustChangePassword: boolean };
// //     }>;
// //     authChangePassword: (userId: string, newPassword: string) => Promise<boolean>;
// //     authCurrentUser: () => Promise<CurrentUserSnapshot | null>;
// //     authLogout?: () => Promise<boolean>;

// //     usersList: () => Promise<UserRow[]>;
// //     usersCreate: (dto: {
// //         username: string;
// //         password: string;
// //         is_active?: number;
// //         must_change_password?: number;
// //         role_ids?: string[];
// //     }) => Promise<{ id: string }>;
// //     usersUpdate: (
// //         id: string,
// //         dto: {
// //             username?: string;
// //             is_active?: number;
// //             must_change_password?: number;
// //             role_ids?: string[];
// //         },
// //     ) => Promise<boolean>;
// //     usersResetPassword: (id: string, newPassword: string) => Promise<boolean>;
// //     usersDelete: (id: string) => Promise<boolean>;

// //     rolesList: () => Promise<RoleRow[]>;
// //     rolesAuthoritiesCatalog: () => Promise<AuthorityCode[]>;
// //     rolesCreate: (dto: {
// //         name: string;
// //         description?: string | null;
// //         authority_codes?: AuthorityCode[];
// //     }) => Promise<{ id: string }>;
// //     rolesUpdate: (
// //         id: string,
// //         dto: { name?: string; description?: string | null; authority_codes?: AuthorityCode[] },
// //     ) => Promise<boolean>;
// //     rolesDelete: (id: string) => Promise<boolean>;

// //     labsList: () => Promise<Lab[]>;
// //     labsCreate: (dto: Partial<Lab>) => Promise<{ id: string }>;
// //     labsUpdate: (id: string, dto: Partial<Lab>) => Promise<boolean>;
// //     labsDelete: (id: string) => Promise<boolean>;

// //     machinesList: () => Promise<Machine[]>;
// //     machinesCreate: (dto: Partial<Machine>) => Promise<{ id: string }>;
// //     machinesUpdate: (id: string, dto: Partial<Machine>) => Promise<boolean>;
// //     machinesDelete: (id: string) => Promise<boolean>;
// //     machinesConnect: (id: string) => Promise<boolean>;
// //     machinesDisconnect: (id: string) => Promise<boolean>;
// //     machinesTest: (machine: Partial<Machine>) => Promise<{ ok: boolean; message?: string }>;

// //     targetsList: () => Promise<Target[]>;
// //     targetsCreate: (dto: Partial<Target>) => Promise<{ id: string }>;
// //     targetsUpdate: (id: string, dto: Partial<Target>) => Promise<boolean>;
// //     targetsDelete: (id: string) => Promise<boolean>;
// //     targetsTest: (id: string) => Promise<TargetDiagnosticsResult>;
// //     targetsHarnessSend: (
// //         targetId: string,
// //         payload: unknown,
// //         previewName?: string | null,
// //     ) => Promise<TargetHarnessResult>;

// //     logsQuery: (q: LogsQuery) => Promise<LogRow[]>;

// //     machinesRuntimeStart: (id: string) => Promise<MachineRuntimeState>;
// //     machinesRuntimeStop: (id: string) => Promise<MachineRuntimeState>;
// //     machinesRuntimeRestart: (id: string) => Promise<MachineRuntimeState>;
// //     machinesRuntimeState: (id: string) => Promise<MachineRuntimeState>;
// //     machinesRuntimeStates: () => Promise<MachineRuntimeState[]>;
// //     onMachinesRuntimeEvent: (cb: (event: RuntimeEvent) => void) => () => void;
// //     machinesLogsList: (machineId: string, limit?: number) => Promise<MachineTrafficLog[]>;
// //     machinesLogsClear: (machineId: string) => Promise<boolean>;
// //     machinesSimStart: (
// //         machineId: string,
// //         scenario?: MachineSimulationScenario,
// //         intervalMs?: number,
// //     ) => Promise<MachineSimulationState>;
// //     machinesSimStop: (machineId: string) => Promise<MachineSimulationState>;
// //     machinesSimRestart: (
// //         machineId: string,
// //         scenario?: MachineSimulationScenario,
// //         intervalMs?: number,
// //     ) => Promise<MachineSimulationState>;
// //     machinesSimState: (machineId: string) => Promise<MachineSimulationState>;
// //     machinesSimStates: () => Promise<MachineSimulationState[]>;
// //     machinesParsedList: (machineId: string, limit?: number) => Promise<ParsedMessageRow[]>;
// //     machinesNormalizedList: (machineId: string, limit?: number) => Promise<NormalizedResultRow[]>;

// //     approvalPoliciesList: () => Promise<ApprovalPolicy[]>;
// //     approvalPoliciesCreate: (dto: Partial<ApprovalPolicy>) => Promise<{ id: string }>;
// //     approvalPoliciesUpdate: (id: string, dto: Partial<ApprovalPolicy>) => Promise<boolean>;
// //     approvalPoliciesDelete: (id: string) => Promise<boolean>;

// //     resultsPendingApprovals: (limit?: number) => Promise<ResultWorkflowRow[]>;
// //     resultApprove: (dto: {
// //         normalizedResultId: string;
// //         policyId: string;
// //         stepOrder: number;
// //         approverUserId: string;
// //         comment?: string | null;
// //     }) => Promise<boolean>;
// //     resultReject: (dto: {
// //         normalizedResultId: string;
// //         policyId: string;
// //         stepOrder: number;
// //         approverUserId: string;
// //         comment?: string | null;
// //     }) => Promise<boolean>;
// //     resultApprovalsList: (normalizedResultId: string) => Promise<ResultApprovalRow[]>;
// //     resultApprovalsAll: (limit?: number) => Promise<ResultApprovalRow[]>;

// //     outboundQueueList: (limit?: number) => Promise<OutboundQueueRow[]>;
// //     outboundQueuePending: (limit?: number) => Promise<OutboundQueueRow[]>;
// //     deliveryHistoryList: (limit?: number) => Promise<OutboundQueueRow[]>;
// //     deliveryAuditList: (query?: DeliveryAuditQuery) => Promise<DeliveryAuditRow[]>;
// //     deliveryAuditQuery: (query?: DeliveryAuditQuery) => Promise<DeliveryAuditRow[]>;

// //     targetTransformPreview: (
// //         targetId: string,
// //         normalizedResultId: string,
// //     ) => Promise<TargetTransformPreview>;
// //     outboundQueueRetry: (queueId: string) => Promise<boolean>;
// //     outboundQueueRequeue: (queueId: string) => Promise<boolean>;
// //     outboundQueueSendNow: (queueId: string) => Promise<boolean>;
// //     targetSecretsGet: (targetId: string) => Promise<TargetSecretConfig | null>;
// //     targetSecretsSave: (
// //         targetId: string,
// //         dto: Omit<TargetSecretConfig, 'targetId'>,
// //     ) => Promise<boolean>;

// //     mappingsList: () => Promise<MappingRule[]>;
// //     mappingsCreate: (dto: Partial<MappingRule>) => Promise<{ id: string }>;
// //     mappingsUpdate: (id: string, dto: Partial<MappingRule>) => Promise<boolean>;
// //     mappingsDelete: (id: string) => Promise<boolean>;
// //     mappingsValidate: (targetType: string) => Promise<MappingValidationResult>;
// //     mappingValueTranslationsList: (mappingRuleId: string) => Promise<MappingValueTranslation[]>;
// //     mappingValueTranslationsCreate: (
// //         dto: Partial<MappingValueTranslation>,
// //     ) => Promise<{ id: string }>;
// //     mappingValueTranslationsUpdate: (
// //         id: string,
// //         dto: Partial<MappingValueTranslation>,
// //     ) => Promise<boolean>;
// //     mappingValueTranslationsDelete: (id: string) => Promise<boolean>;
// //     mappingValueTranslationsSaveConfig: (
// //         mappingRuleId: string,
// //         dto: {
// //             value_mapping_enabled: number;
// //             unmapped_behavior: MappingUnmappedBehavior;
// //             default_destination_value?: string | null;
// //         },
// //     ) => Promise<boolean>;
// //     targetTransformPreviewFromQueue: (queueId: string) => Promise<TargetTransformPreview>;
// //     targetTransformPreviewFromDeliveryHistory: (queueId: string) => Promise<TargetTransformPreview>;

// //     resultReevaluatePolicy: (normalizedResultId: string) => Promise<boolean>;
// //     copyToClipboard: (text: string) => Promise<void>;
// // };

// export type AuthorityCode =
//     | 'USERS_WRITE'
//     | 'ROLES_WRITE'
//     | 'LABS_WRITE'
//     | 'MACHINES_WRITE'
//     | 'MAPPINGS_WRITE'
//     | 'ROUTES_WRITE'
//     | 'VIEW_LOGS'
//     | 'OUTBOX_MANAGE'
//     | 'AUDIT_READ'
//     | 'SUPER_ADMIN'
//     | 'RESULT_VIEW'
//     | 'RESULT_APPROVE'
//     | 'RESULT_REJECT'
//     | 'RESULT_ROUTE'
//     | 'RESULT_REQUEUE'
//     | 'APPROVAL_POLICY_READ'
//     | 'APPROVAL_POLICY_WRITE'
//     | 'TARGET_CONFIG_WRITE'
//     | 'MAPPING_WRITE'
//     | 'AUDIT_VIEW'
//     | 'RESULT_VIEW_SENSITIVE';

// export type CurrentUserSnapshot = {
//     id: string;
//     username: string;
//     roles: string[];
//     roleIds: string[];
//     authorities: AuthorityCode[];
//     mustChangePassword: boolean;
// };

// export type RetryBackoffStrategy = 'FIXED' | 'LINEAR' | 'EXPONENTIAL';

// export type ConnectionType = 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';

// export type ProtocolType = 'HL7' | 'ASTM' | 'RAW';

// export type Lab = {
//     id: string;
//     code?: string | null;
//     name: string;
//     location?: string | null;
//     description?: string | null;
//     is_active: number;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type Machine = {
//     id: string;
//     lab_id?: string | null;
//     lab_name?: string | null;

//     name: string;
//     code?: string | null;
//     brand?: string | null;
//     model?: string | null;
//     version?: string | null;
//     manufacturer?: string | null;

//     connection_type: ConnectionType;
//     protocol: ProtocolType;

//     // TCP / HL7_MLLP
//     host?: string | null;
//     port?: number | null;
//     tcp_mode?: 'SERVER' | 'CLIENT' | null;

//     // SERIAL
//     serial_port?: string | null;
//     baud_rate?: number | null;
//     data_bits?: number | null;
//     stop_bits?: number | null;
//     parity?: 'none' | 'even' | 'odd' | 'mark' | 'space' | null;

//     // FTP / SFTP
//     ftp_host?: string | null;
//     ftp_port?: number | null;
//     ftp_user?: string | null;
//     ftp_password?: string | null;
//     ftp_remote_dir?: string | null;

//     // FILE WATCHER
//     watch_dir?: string | null;
//     watch_pattern?: string | null;

//     is_active: number;
//     auto_connect: number;

//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

// export type Target = {
//     id: string;
//     type: TargetType;
//     name: string;
//     base_url: string;
//     enabled: number;
//     auto_retry_enabled?: number;
//     max_retry_attempts?: number | null;
//     retry_backoff_strategy?: RetryBackoffStrategy | null;
//     initial_retry_delay_ms?: number | null;
//     max_retry_delay_ms?: number | null;
//     request_timeout_ms?: number | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type UserRow = {
//     id: string;
//     username: string;
//     is_active: number;
//     must_change_password: number;
//     role_ids: string[];
//     role_names: string[];
//     authorities: AuthorityCode[];
//     created_at: string;
//     updated_at: string;
// };

// export type RoleRow = {
//     id: string;
//     name: string;
//     description?: string | null;
//     authority_codes: AuthorityCode[];
//     user_count: number;
//     created_at: string;
//     updated_at?: string | null;
// };

// export type LogRow = {
//     id: string;
//     level: 'info' | 'warn' | 'error';
//     source: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
//     entity_type?: string | null;
//     entity_id?: string | null;
//     message: string;
//     payload_json?: string | null;
//     created_at: string;
// };

// export type LogsQuery = {
//     level?: 'info' | 'warn' | 'error';
//     source?: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
//     entityType?: string;
//     entityId?: string;
//     limit?: number;
// };

// export type NormalizedResultRow = {
//     id: string;
//     machine_id: string;
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     sample_id?: string | null;
//     patient_id?: string | null;
//     patient_name?: string | null;
//     order_id?: string | null;
//     test_code?: string | null;
//     test_name?: string | null;
//     value?: string | null;
//     units?: string | null;
//     reference_range?: string | null;
//     abnormal_flag?: string | null;
//     observed_at?: string | null;
//     source_message_type?: string | null;
//     summary?: string | null;
//     data_json: string;
//     created_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
// };

// export type MachineRuntimeState = {
//     machineId: string;
//     status: 'disconnected' | 'connecting' | 'connected' | 'idle' | 'stopped' | 'error';
//     message?: string | null;
//     startedAt?: string | null;
//     updatedAt: string;
// };

// export type ApprovalPolicyRow = {
//     id: string;
//     name: string;
//     enabled: number;
//     applies_to_lab_id?: string | null;
//     applies_to_machine_id?: string | null;
//     applies_to_target_id?: string | null;
//     requires_approval: number;
//     min_approvals: number;
//     created_at: string;
//     updated_at: string;
// };

// export type WorkflowStatusRow = {
//     id: string;
//     normalized_result_id: string;
//     status:
//     | 'RECEIVED'
//     | 'PARSED'
//     | 'NORMALIZED'
//     | 'PENDING_APPROVAL'
//     | 'PENDING_POLICY'
//     | 'POLICY_DISABLED'
//     | 'APPROVED'
//     | 'REJECTED'
//     | 'QUEUED'
//     | 'ROUTED'
//     | 'FAILED_DELIVERY';
//     approval_policy_id?: string | null;
//     approval_required: number;
//     approval_count_required: number;
//     approval_count_received: number;
//     queued_at?: string | null;
//     routed_at?: string | null;
//     failed_at?: string | null;
//     last_error?: string | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type MachineTrafficLog = {
//     id: string;
//     machine_id: string;
//     direction: 'inbound' | 'outbound' | 'system';
//     transport: 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     event_type:
//     | 'connected'
//     | 'disconnected'
//     | 'payload'
//     | 'parse_success'
//     | 'parse_error'
//     | 'test'
//     | 'error';
//     payload?: string | null;
//     payload_preview?: string | null;
//     created_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
// };

// export type ParsedMessageRow = {
//     id: string;
//     machine_id: string;
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     message_type: string;
//     summary?: string | null;
//     data_json: string;
//     raw?: string | null;
//     created_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
// };

// export type RuntimeEvent =
//     | {
//         type: 'state';
//         machineId: string;
//         status: string;
//         message?: string | null;
//         updatedAt: string;
//     }
//     | {
//         type: 'traffic';
//         machineId: string;
//         direction: 'inbound' | 'outbound' | 'system';
//         payloadPreview: string;
//         updatedAt: string;
//     };

// export type MachineSimulationScenario = 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING';

// export type MachineSimulationState = {
//     machineId: string;
//     running: boolean;
//     scenario?: MachineSimulationScenario | null;
//     intervalMs?: number | null;
//     updatedAt: string;
// };

// export type ApprovalPolicy = {
//     id: string;
//     name: string;
//     enabled: number;
//     applies_to_lab_id?: string | null;
//     applies_to_machine_id?: string | null;
//     applies_to_target_id?: string | null;
//     requires_approval: number;
//     min_approvals: number;
//     created_at: string;
//     updated_at: string;
//     route_target_ids?: string[];
// };

// export type ResultWorkflowRow = {
//     id: string;
//     normalized_result_id: string;
//     status:
//     | 'RECEIVED'
//     | 'PARSED'
//     | 'NORMALIZED'
//     | 'PENDING_APPROVAL'
//     | 'PENDING_POLICY'
//     | 'POLICY_DISABLED'
//     | 'APPROVED'
//     | 'REJECTED'
//     | 'QUEUED'
//     | 'ROUTED'
//     | 'FAILED_DELIVERY';
//     approval_policy_id?: string | null;
//     approval_required: number;
//     approval_count_required: number;
//     approval_count_received: number;
//     queued_at?: string | null;
//     routed_at?: string | null;
//     failed_at?: string | null;
//     last_error?: string | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type ResultApprovalRow = {
//     id: string;
//     normalized_result_id: string;
//     policy_id: string;
//     step_order: number;
//     approver_user_id: string;
//     action: 'APPROVED' | 'REJECTED' | 'RETURNED';
//     comment?: string | null;
//     acted_at: string;
//     policy_name?: string | null;
//     approver_display_name?: string | null;
//     approver_username?: string | null;
//     approver_roles?: string[];
//     snapshot_result?: any;
//     snapshot_policy?: any;
//     snapshot_route_targets?: any[];
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type OutboundQueueRow = {
//     id: string;
//     normalized_result_id: string;
//     target_id: string;
//     payload_json: string;
//     preview_name?: string | null;
//     source_snapshot_json?: string | null;
//     transform_warnings_json?: string | null;
//     transform_errors_json?: string | null;
//     transform_summary_json?: string | null;
//     delivery_status: 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED';
//     retry_count: number;
//     next_retry_at?: string | null;
//     last_error?: string | null;
//     target_name?: string | null;
//     target_type?: TargetType | null;
//     target_enabled?: number | null;
//     target_auto_retry_enabled?: number | null;
//     target_max_retry_attempts?: number | null;
//     target_retry_backoff_strategy?: RetryBackoffStrategy | null;
//     target_initial_retry_delay_ms?: number | null;
//     target_max_retry_delay_ms?: number | null;
//     target_request_timeout_ms?: number | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type DeliveryAuditQuery = {
//     queueId?: string;
//     targetId?: string;
//     operation?: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
//     status?: 'STARTED' | 'DELIVERED' | 'FAILED';
//     correlationId?: string;
//     limit?: number;
// };

// export type DeliveryAuditRow = {
//     id: string;
//     queue_id: string;
//     target_id: string;
//     target_name?: string | null;
//     target_type?: TargetType | string | null;
//     operation: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
//     status: 'STARTED' | 'DELIVERED' | 'FAILED';
//     attempt_no: number;
//     http_status?: number | null;
//     correlation_id?: string | null;
//     duration_ms?: number | null;
//     error_message?: string | null;
//     queue_delivery_status?: string | null;
//     queue_retry_count?: number | null;
//     queue_last_error?: string | null;
//     queue_updated_at?: string | null;
//     created_at: string;
// };

// export type TargetTransformPreview = {
//     targetId: string;
//     targetType: TargetType;
//     normalizedResultId: string;
//     previewName: string;
//     payload: Record<string, any>;
//     warnings?: string[];
// };

// export type TargetSecretConfig = {
//     targetId: string;
//     authType: 'none' | 'bearer' | 'basic' | 'api_key';
//     username?: string | null;
//     password?: string | null;
//     token?: string | null;
//     apiKeyName?: string | null;
//     apiKeyValue?: string | null;
//     allowInsecureTls: boolean;
// };

// export type TargetDiagnosticsResult = {
//     ok: boolean;
//     message: string;
//     details?: {
//         targetId: string;
//         targetName?: string;
//         targetType?: string;
//         baseUrl?: string;
//         authType?: string;
//         tlsMode?: 'strict' | 'insecure-dev';
//         httpStatus?: number | null;
//         checkedAt: string;
//         notes?: string[];
//     };
// };

// export type TargetHarnessResult = {
//     ok: boolean;
//     message: string;
//     correlationId?: string | null;
//     details?: {
//         targetId: string;
//         targetName?: string;
//         targetType?: string;
//         endpoint?: string;
//         label?: string | null;
//         authType?: string;
//         authConfigured?: boolean;
//         tlsMode?: 'strict' | 'insecure-dev';
//         httpStatus?: number | null;
//         checkedAt: string;
//         notes?: string[];
//         responseSnippet?: string | null;
//     };
// };

// export type MappingUnmappedBehavior = 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR';

// export type MappingValueTranslation = {
//     id: string;
//     mapping_rule_id: string;
//     source_value: string;
//     destination_value?: string | null;
//     enabled: number;
//     note?: string | null;
//     created_at: string;
//     updated_at: string;
// };

// export type MappingRule = {
//     id: string;
//     target_type: TargetType;
//     source_field: string;
//     destination_field: string;
//     transform_kind: 'direct' | 'constant' | 'lookup';
//     constant_value?: string | null;
//     enabled: number;
//     value_mapping_enabled?: number;
//     unmapped_behavior?: MappingUnmappedBehavior | null;
//     default_destination_value?: string | null;
//     created_at: string;
//     updated_at: string;
// };

// export type MappingValidationResult = {
//     ok: boolean;
//     message: string;
//     targetType?: TargetType | 'ALL';
//     errors?: string[];
//     warnings?: string[];
//     recommendations?: string[];
//     summary?: {
//         enabledRules: number;
//         duplicateDestinations: number;
//         unsupportedKinds: number;
//     };
// };

// export type AppAPI = {
//     getAppVersion: () => Promise<string>;
//     ping: (msg: string) => Promise<string>;
//     log: (level: 'info' | 'warn' | 'error', message: string) => void;

//     tcpConnect: (host: string, port: number) => Promise<boolean>;
//     tcpSend: (payload: string) => Promise<boolean>;
//     tcpDisconnect: () => Promise<boolean>;

//     serialList: () => Promise<any[]>;
//     serialConnect: (path: string, baudRate: number) => Promise<boolean>;
//     serialSend: (payload: string) => Promise<boolean>;
//     serialDisconnect: () => Promise<boolean>;

//     onMachineMessage: (cb: (msg: any) => void) => () => void;

//     authLogin: (
//         username: string,
//         password: string,
//     ) => Promise<{
//         user: { id: string; username: string; authorities: string[]; mustChangePassword: boolean };
//     }>;
//     authChangePassword: (userId: string, newPassword: string) => Promise<boolean>;
//     authCurrentUser: () => Promise<CurrentUserSnapshot | null>;
//     authLogout?: () => Promise<boolean>;

//     usersList: () => Promise<UserRow[]>;
//     usersCreate: (dto: {
//         username: string;
//         password: string;
//         is_active?: number;
//         must_change_password?: number;
//         role_ids?: string[];
//     }) => Promise<{ id: string }>;
//     usersUpdate: (
//         id: string,
//         dto: {
//             username?: string;
//             is_active?: number;
//             must_change_password?: number;
//             role_ids?: string[];
//         },
//     ) => Promise<boolean>;
//     usersResetPassword: (id: string, newPassword: string) => Promise<boolean>;
//     usersDelete: (id: string) => Promise<boolean>;

//     rolesList: () => Promise<RoleRow[]>;
//     rolesAuthoritiesCatalog: () => Promise<AuthorityCode[]>;
//     rolesCreate: (dto: {
//         name: string;
//         description?: string | null;
//         authority_codes?: AuthorityCode[];
//     }) => Promise<{ id: string }>;
//     rolesUpdate: (
//         id: string,
//         dto: { name?: string; description?: string | null; authority_codes?: AuthorityCode[] },
//     ) => Promise<boolean>;
//     rolesDelete: (id: string) => Promise<boolean>;

//     labsList: () => Promise<Lab[]>;
//     labsCreate: (dto: Partial<Lab>) => Promise<{ id: string }>;
//     labsUpdate: (id: string, dto: Partial<Lab>) => Promise<boolean>;
//     labsDelete: (id: string) => Promise<boolean>;

//     machinesList: () => Promise<Machine[]>;
//     machinesCreate: (dto: Partial<Machine>) => Promise<{ id: string }>;
//     machinesUpdate: (id: string, dto: Partial<Machine>) => Promise<boolean>;
//     machinesDelete: (id: string) => Promise<boolean>;
//     machinesConnect: (id: string) => Promise<boolean>;
//     machinesDisconnect: (id: string) => Promise<boolean>;
//     machinesTest: (machine: Partial<Machine>) => Promise<{ ok: boolean; message?: string }>;

//     targetsList: () => Promise<Target[]>;
//     targetsCreate: (dto: Partial<Target>) => Promise<{ id: string }>;
//     targetsUpdate: (id: string, dto: Partial<Target>) => Promise<boolean>;
//     targetsDelete: (id: string) => Promise<boolean>;
//     targetsTest: (id: string) => Promise<TargetDiagnosticsResult>;
//     targetsHarnessSend: (
//         targetId: string,
//         payload: unknown,
//         previewName?: string | null,
//     ) => Promise<TargetHarnessResult>;

//     logsQuery: (q: LogsQuery) => Promise<LogRow[]>;

//     machinesRuntimeStart: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeStop: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeRestart: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeState: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeStates: () => Promise<MachineRuntimeState[]>;
//     onMachinesRuntimeEvent: (cb: (event: RuntimeEvent) => void) => () => void;
//     machinesLogsList: (machineId: string, limit?: number) => Promise<MachineTrafficLog[]>;
//     machinesLogsClear: (machineId: string) => Promise<boolean>;
//     machinesSimStart: (
//         machineId: string,
//         scenario?: MachineSimulationScenario,
//         intervalMs?: number,
//     ) => Promise<MachineSimulationState>;
//     machinesSimStop: (machineId: string) => Promise<MachineSimulationState>;
//     machinesSimRestart: (
//         machineId: string,
//         scenario?: MachineSimulationScenario,
//         intervalMs?: number,
//     ) => Promise<MachineSimulationState>;
//     machinesSimState: (machineId: string) => Promise<MachineSimulationState>;
//     machinesSimStates: () => Promise<MachineSimulationState[]>;
//     machinesParsedList: (machineId: string, limit?: number) => Promise<ParsedMessageRow[]>;
//     machinesNormalizedList: (machineId: string, limit?: number) => Promise<NormalizedResultRow[]>;

//     approvalPoliciesList: () => Promise<ApprovalPolicy[]>;
//     approvalPoliciesCreate: (dto: Partial<ApprovalPolicy>) => Promise<{ id: string }>;
//     approvalPoliciesUpdate: (id: string, dto: Partial<ApprovalPolicy>) => Promise<boolean>;
//     approvalPoliciesDelete: (id: string) => Promise<boolean>;

//     resultsPendingApprovals: (limit?: number) => Promise<ResultWorkflowRow[]>;
//     resultApprove: (dto: {
//         normalizedResultId: string;
//         policyId: string;
//         stepOrder: number;
//         approverUserId: string;
//         comment?: string | null;
//     }) => Promise<boolean>;
//     resultReject: (dto: {
//         normalizedResultId: string;
//         policyId: string;
//         stepOrder: number;
//         approverUserId: string;
//         comment?: string | null;
//     }) => Promise<boolean>;
//     resultApprovalsList: (normalizedResultId: string) => Promise<ResultApprovalRow[]>;
//     resultApprovalsAll: (limit?: number) => Promise<ResultApprovalRow[]>;

//     outboundQueueList: (limit?: number) => Promise<OutboundQueueRow[]>;
//     outboundQueuePending: (limit?: number) => Promise<OutboundQueueRow[]>;
//     deliveryHistoryList: (limit?: number) => Promise<OutboundQueueRow[]>;
//     deliveryAuditList: (query?: DeliveryAuditQuery) => Promise<DeliveryAuditRow[]>;
//     deliveryAuditQuery: (query?: DeliveryAuditQuery) => Promise<DeliveryAuditRow[]>;

//     targetTransformPreview: (
//         targetId: string,
//         normalizedResultId: string,
//     ) => Promise<TargetTransformPreview>;
//     outboundQueueRetry: (queueId: string) => Promise<boolean>;
//     outboundQueueRequeue: (queueId: string) => Promise<boolean>;
//     outboundQueueSendNow: (queueId: string) => Promise<boolean>;
//     targetSecretsGet: (targetId: string) => Promise<TargetSecretConfig | null>;
//     targetSecretsSave: (
//         targetId: string,
//         dto: Omit<TargetSecretConfig, 'targetId'>,
//     ) => Promise<boolean>;

//     mappingsList: () => Promise<MappingRule[]>;
//     mappingsCreate: (dto: Partial<MappingRule>) => Promise<{ id: string }>;
//     mappingsUpdate: (id: string, dto: Partial<MappingRule>) => Promise<boolean>;
//     mappingsDelete: (id: string) => Promise<boolean>;
//     mappingsValidate: (targetType: string) => Promise<MappingValidationResult>;
//     mappingValueTranslationsList: (mappingRuleId: string) => Promise<MappingValueTranslation[]>;
//     mappingValueTranslationsCreate: (
//         dto: Partial<MappingValueTranslation>,
//     ) => Promise<{ id: string }>;
//     mappingValueTranslationsUpdate: (
//         id: string,
//         dto: Partial<MappingValueTranslation>,
//     ) => Promise<boolean>;
//     mappingValueTranslationsDelete: (id: string) => Promise<boolean>;
//     mappingValueTranslationsSaveConfig: (
//         mappingRuleId: string,
//         dto: {
//             value_mapping_enabled: number;
//             unmapped_behavior: MappingUnmappedBehavior;
//             default_destination_value?: string | null;
//         },
//     ) => Promise<boolean>;
//     targetTransformPreviewFromQueue: (queueId: string) => Promise<TargetTransformPreview>;
//     targetTransformPreviewFromDeliveryHistory: (queueId: string) => Promise<TargetTransformPreview>;

//     resultReevaluatePolicy: (normalizedResultId: string) => Promise<boolean>;
//     copyToClipboard: (text: string) => Promise<void>;
// };

// export type AuthorityCode =
//     | 'USERS_WRITE'
//     | 'ROLES_WRITE'
//     | 'LABS_WRITE'
//     | 'MACHINES_WRITE'
//     | 'MAPPINGS_WRITE'
//     | 'ROUTES_WRITE'
//     | 'VIEW_LOGS'
//     | 'OUTBOX_MANAGE'
//     | 'AUDIT_READ'
//     | 'SUPER_ADMIN'
//     | 'RESULT_VIEW'
//     | 'RESULT_APPROVE'
//     | 'RESULT_REJECT'
//     | 'RESULT_ROUTE'
//     | 'RESULT_REQUEUE'
//     | 'APPROVAL_POLICY_READ'
//     | 'APPROVAL_POLICY_WRITE'
//     | 'TARGET_CONFIG_WRITE'
//     | 'MAPPING_WRITE'
//     | 'AUDIT_VIEW'
//     | 'RESULT_VIEW_SENSITIVE';

// export type CurrentUserSnapshot = {
//     id: string;
//     username: string;
//     roles: string[];
//     roleIds: string[];
//     authorities: AuthorityCode[];
//     mustChangePassword: boolean;
// };

// export type RetryBackoffStrategy = 'FIXED' | 'LINEAR' | 'EXPONENTIAL';

// export type ConnectionType = 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';

// export type ProtocolType = 'HL7' | 'ASTM' | 'RAW';

// export type Lab = {
//     id: string;
//     code?: string | null;
//     name: string;
//     location?: string | null;
//     description?: string | null;
//     is_active: number;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type Machine = {
//     id: string;
//     lab_id?: string | null;
//     lab_name?: string | null;

//     name: string;
//     code?: string | null;
//     brand?: string | null;
//     model?: string | null;
//     version?: string | null;
//     manufacturer?: string | null;

//     connection_type: ConnectionType;
//     protocol: ProtocolType;

//     // TCP / HL7_MLLP
//     host?: string | null;
//     port?: number | null;

//     // SERIAL
//     serial_port?: string | null;
//     baud_rate?: number | null;
//     data_bits?: number | null;
//     stop_bits?: number | null;
//     parity?: 'none' | 'even' | 'odd' | 'mark' | 'space' | null;

//     // FTP / SFTP
//     ftp_host?: string | null;
//     ftp_port?: number | null;
//     ftp_user?: string | null;
//     ftp_password?: string | null;
//     ftp_remote_dir?: string | null;

//     // FILE WATCHER
//     watch_dir?: string | null;
//     watch_pattern?: string | null;

//     is_active: number;
//     auto_connect: number;

//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

// export type Target = {
//     id: string;
//     type: TargetType;
//     name: string;
//     base_url: string;
//     enabled: number;
//     auto_retry_enabled?: number;
//     max_retry_attempts?: number | null;
//     retry_backoff_strategy?: RetryBackoffStrategy | null;
//     initial_retry_delay_ms?: number | null;
//     max_retry_delay_ms?: number | null;
//     request_timeout_ms?: number | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type UserRow = {
//     id: string;
//     username: string;
//     is_active: number;
//     must_change_password: number;
//     role_ids: string[];
//     role_names: string[];
//     authorities: AuthorityCode[];
//     created_at: string;
//     updated_at: string;
// };

// export type RoleRow = {
//     id: string;
//     name: string;
//     description?: string | null;
//     authority_codes: AuthorityCode[];
//     user_count: number;
//     created_at: string;
//     updated_at?: string | null;
// };

// export type LogRow = {
//     id: string;
//     level: 'info' | 'warn' | 'error';
//     source: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
//     entity_type?: string | null;
//     entity_id?: string | null;
//     message: string;
//     payload_json?: string | null;
//     created_at: string;
// };

// export type LogsQuery = {
//     level?: 'info' | 'warn' | 'error';
//     source?: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
//     entityType?: string;
//     entityId?: string;
//     limit?: number;
// };

// export type NormalizedResultRow = {
//     id: string;
//     machine_id: string;
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     sample_id?: string | null;
//     patient_id?: string | null;
//     patient_name?: string | null;
//     order_id?: string | null;
//     test_code?: string | null;
//     test_name?: string | null;
//     value?: string | null;
//     units?: string | null;
//     reference_range?: string | null;
//     abnormal_flag?: string | null;
//     observed_at?: string | null;
//     source_message_type?: string | null;
//     summary?: string | null;
//     data_json: string;
//     created_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
// };

// export type MachineRuntimeState = {
//     machineId: string;
//     status: 'disconnected' | 'connecting' | 'connected' | 'idle' | 'stopped' | 'error';
//     message?: string | null;
//     startedAt?: string | null;
//     updatedAt: string;
// };

// export type ApprovalPolicyRow = {
//     id: string;
//     name: string;
//     enabled: number;
//     applies_to_lab_id?: string | null;
//     applies_to_machine_id?: string | null;
//     applies_to_target_id?: string | null;
//     requires_approval: number;
//     min_approvals: number;
//     created_at: string;
//     updated_at: string;
// };

// export type WorkflowStatusRow = {
//     id: string;
//     normalized_result_id: string;
//     status:
//     | 'RECEIVED'
//     | 'PARSED'
//     | 'NORMALIZED'
//     | 'PENDING_APPROVAL'
//     | 'PENDING_POLICY'
//     | 'POLICY_DISABLED'
//     | 'APPROVED'
//     | 'REJECTED'
//     | 'QUEUED'
//     | 'ROUTED'
//     | 'FAILED_DELIVERY';
//     approval_policy_id?: string | null;
//     approval_required: number;
//     approval_count_required: number;
//     approval_count_received: number;
//     queued_at?: string | null;
//     routed_at?: string | null;
//     failed_at?: string | null;
//     last_error?: string | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type MachineTrafficLog = {
//     id: string;
//     machine_id: string;
//     direction: 'inbound' | 'outbound' | 'system';
//     transport: 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     event_type:
//     | 'connected'
//     | 'disconnected'
//     | 'payload'
//     | 'parse_success'
//     | 'parse_error'
//     | 'test'
//     | 'error';
//     payload?: string | null;
//     payload_preview?: string | null;
//     created_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
// };

// export type ParsedMessageRow = {
//     id: string;
//     machine_id: string;
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     message_type: string;
//     summary?: string | null;
//     data_json: string;
//     raw?: string | null;
//     created_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
// };

// export type RuntimeEvent =
//     | {
//         type: 'state';
//         machineId: string;
//         status: string;
//         message?: string | null;
//         updatedAt: string;
//     }
//     | {
//         type: 'traffic';
//         machineId: string;
//         direction: 'inbound' | 'outbound' | 'system';
//         payloadPreview: string;
//         updatedAt: string;
//     };

// export type MachineSimulationScenario =
//     | 'ASTM_BASIC'
//     | 'HL7_ORU'
//     | 'HL7_COBAS_HPV_FINAL_RESULT'
//     | 'RAW_PING';

// export type MachineSimulationState = {
//     machineId: string;
//     running: boolean;
//     scenario?: MachineSimulationScenario | null;
//     intervalMs?: number | null;
//     updatedAt: string;
// };

// export type ApprovalPolicy = {
//     id: string;
//     name: string;
//     enabled: number;
//     applies_to_lab_id?: string | null;
//     applies_to_machine_id?: string | null;
//     applies_to_target_id?: string | null;
//     requires_approval: number;
//     min_approvals: number;
//     created_at: string;
//     updated_at: string;
//     route_target_ids?: string[];
// };

// export type ResultWorkflowRow = {
//     id: string;
//     normalized_result_id: string;
//     status:
//     | 'RECEIVED'
//     | 'PARSED'
//     | 'NORMALIZED'
//     | 'PENDING_APPROVAL'
//     | 'PENDING_POLICY'
//     | 'POLICY_DISABLED'
//     | 'APPROVED'
//     | 'REJECTED'
//     | 'QUEUED'
//     | 'ROUTED'
//     | 'FAILED_DELIVERY';
//     approval_policy_id?: string | null;
//     approval_required: number;
//     approval_count_required: number;
//     approval_count_received: number;
//     queued_at?: string | null;
//     routed_at?: string | null;
//     failed_at?: string | null;
//     last_error?: string | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type ResultApprovalRow = {
//     id: string;
//     normalized_result_id: string;
//     policy_id: string;
//     step_order: number;
//     approver_user_id: string;
//     action: 'APPROVED' | 'REJECTED' | 'RETURNED';
//     comment?: string | null;
//     acted_at: string;
//     policy_name?: string | null;
//     approver_display_name?: string | null;
//     approver_username?: string | null;
//     approver_roles?: string[];
//     snapshot_result?: any;
//     snapshot_policy?: any;
//     snapshot_route_targets?: any[];
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type OutboundQueueRow = {
//     id: string;
//     normalized_result_id: string;
//     target_id: string;
//     payload_json: string;
//     preview_name?: string | null;
//     source_snapshot_json?: string | null;
//     transform_warnings_json?: string | null;
//     transform_errors_json?: string | null;
//     transform_summary_json?: string | null;
//     delivery_status: 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED';
//     retry_count: number;
//     next_retry_at?: string | null;
//     last_error?: string | null;
//     target_name?: string | null;
//     target_type?: TargetType | null;
//     target_enabled?: number | null;
//     target_auto_retry_enabled?: number | null;
//     target_max_retry_attempts?: number | null;
//     target_retry_backoff_strategy?: RetryBackoffStrategy | null;
//     target_initial_retry_delay_ms?: number | null;
//     target_max_retry_delay_ms?: number | null;
//     target_request_timeout_ms?: number | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type DeliveryAuditQuery = {
//     queueId?: string;
//     targetId?: string;
//     operation?: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
//     status?: 'STARTED' | 'DELIVERED' | 'FAILED';
//     correlationId?: string;
//     limit?: number;
// };

// export type DeliveryAuditRow = {
//     id: string;
//     queue_id: string;
//     target_id: string;
//     target_name?: string | null;
//     target_type?: TargetType | string | null;
//     operation: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
//     status: 'STARTED' | 'DELIVERED' | 'FAILED';
//     attempt_no: number;
//     http_status?: number | null;
//     correlation_id?: string | null;
//     duration_ms?: number | null;
//     error_message?: string | null;
//     queue_delivery_status?: string | null;
//     queue_retry_count?: number | null;
//     queue_last_error?: string | null;
//     queue_updated_at?: string | null;
//     created_at: string;
// };

// export type TargetTransformPreview = {
//     targetId: string;
//     targetType: TargetType;
//     normalizedResultId: string;
//     previewName: string;
//     payload: Record<string, any>;
//     warnings?: string[];
// };

// export type TargetSecretConfig = {
//     targetId: string;
//     authType: 'none' | 'bearer' | 'basic' | 'api_key';
//     username?: string | null;
//     password?: string | null;
//     token?: string | null;
//     apiKeyName?: string | null;
//     apiKeyValue?: string | null;
//     allowInsecureTls: boolean;
// };

// export type TargetDiagnosticsResult = {
//     ok: boolean;
//     message: string;
//     details?: {
//         targetId: string;
//         targetName?: string;
//         targetType?: string;
//         baseUrl?: string;
//         authType?: string;
//         tlsMode?: 'strict' | 'insecure-dev';
//         httpStatus?: number | null;
//         checkedAt: string;
//         notes?: string[];
//     };
// };

// export type TargetHarnessResult = {
//     ok: boolean;
//     message: string;
//     correlationId?: string | null;
//     details?: {
//         targetId: string;
//         targetName?: string;
//         targetType?: string;
//         endpoint?: string;
//         label?: string | null;
//         authType?: string;
//         authConfigured?: boolean;
//         tlsMode?: 'strict' | 'insecure-dev';
//         httpStatus?: number | null;
//         checkedAt: string;
//         notes?: string[];
//         responseSnippet?: string | null;
//     };
// };

// export type MappingUnmappedBehavior = 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR';

// export type MappingValueTranslation = {
//     id: string;
//     mapping_rule_id: string;
//     source_value: string;
//     destination_value?: string | null;
//     enabled: number;
//     note?: string | null;
//     created_at: string;
//     updated_at: string;
// };

// export type MappingRule = {
//     id: string;
//     target_type: TargetType;
//     source_field: string;
//     destination_field: string;
//     transform_kind: 'direct' | 'constant' | 'lookup';
//     constant_value?: string | null;
//     enabled: number;
//     value_mapping_enabled?: number;
//     unmapped_behavior?: MappingUnmappedBehavior | null;
//     default_destination_value?: string | null;
//     created_at: string;
//     updated_at: string;
// };

// export type MappingValidationResult = {
//     ok: boolean;
//     message: string;
//     targetType?: TargetType | 'ALL';
//     errors?: string[];
//     warnings?: string[];
//     recommendations?: string[];
//     summary?: {
//         enabledRules: number;
//         duplicateDestinations: number;
//         unsupportedKinds: number;
//     };
// };

// export type AppAPI = {
//     getAppVersion: () => Promise<string>;
//     ping: (msg: string) => Promise<string>;
//     log: (level: 'info' | 'warn' | 'error', message: string) => void;

//     tcpConnect: (host: string, port: number) => Promise<boolean>;
//     tcpSend: (payload: string) => Promise<boolean>;
//     tcpDisconnect: () => Promise<boolean>;

//     serialList: () => Promise<any[]>;
//     serialConnect: (path: string, baudRate: number) => Promise<boolean>;
//     serialSend: (payload: string) => Promise<boolean>;
//     serialDisconnect: () => Promise<boolean>;

//     onMachineMessage: (cb: (msg: any) => void) => () => void;

//     authLogin: (
//         username: string,
//         password: string,
//     ) => Promise<{
//         user: { id: string; username: string; authorities: string[]; mustChangePassword: boolean };
//     }>;
//     authChangePassword: (userId: string, newPassword: string) => Promise<boolean>;
//     authCurrentUser: () => Promise<CurrentUserSnapshot | null>;
//     authLogout?: () => Promise<boolean>;

//     usersList: () => Promise<UserRow[]>;
//     usersCreate: (dto: {
//         username: string;
//         password: string;
//         is_active?: number;
//         must_change_password?: number;
//         role_ids?: string[];
//     }) => Promise<{ id: string }>;
//     usersUpdate: (
//         id: string,
//         dto: {
//             username?: string;
//             is_active?: number;
//             must_change_password?: number;
//             role_ids?: string[];
//         },
//     ) => Promise<boolean>;
//     usersResetPassword: (id: string, newPassword: string) => Promise<boolean>;
//     usersDelete: (id: string) => Promise<boolean>;

//     rolesList: () => Promise<RoleRow[]>;
//     rolesAuthoritiesCatalog: () => Promise<AuthorityCode[]>;
//     rolesCreate: (dto: {
//         name: string;
//         description?: string | null;
//         authority_codes?: AuthorityCode[];
//     }) => Promise<{ id: string }>;
//     rolesUpdate: (
//         id: string,
//         dto: { name?: string; description?: string | null; authority_codes?: AuthorityCode[] },
//     ) => Promise<boolean>;
//     rolesDelete: (id: string) => Promise<boolean>;

//     labsList: () => Promise<Lab[]>;
//     labsCreate: (dto: Partial<Lab>) => Promise<{ id: string }>;
//     labsUpdate: (id: string, dto: Partial<Lab>) => Promise<boolean>;
//     labsDelete: (id: string) => Promise<boolean>;

//     machinesList: () => Promise<Machine[]>;
//     machinesCreate: (dto: Partial<Machine>) => Promise<{ id: string }>;
//     machinesUpdate: (id: string, dto: Partial<Machine>) => Promise<boolean>;
//     machinesDelete: (id: string) => Promise<boolean>;
//     machinesConnect: (id: string) => Promise<boolean>;
//     machinesDisconnect: (id: string) => Promise<boolean>;
//     machinesTest: (machine: Partial<Machine>) => Promise<{ ok: boolean; message?: string }>;

//     targetsList: () => Promise<Target[]>;
//     targetsCreate: (dto: Partial<Target>) => Promise<{ id: string }>;
//     targetsUpdate: (id: string, dto: Partial<Target>) => Promise<boolean>;
//     targetsDelete: (id: string) => Promise<boolean>;
//     targetsTest: (id: string) => Promise<TargetDiagnosticsResult>;
//     targetsHarnessSend: (
//         targetId: string,
//         payload: unknown,
//         previewName?: string | null,
//     ) => Promise<TargetHarnessResult>;

//     logsQuery: (q: LogsQuery) => Promise<LogRow[]>;

//     machinesRuntimeStart: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeStop: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeRestart: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeState: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeStates: () => Promise<MachineRuntimeState[]>;
//     onMachinesRuntimeEvent: (cb: (event: RuntimeEvent) => void) => () => void;
//     machinesLogsList: (machineId: string, limit?: number) => Promise<MachineTrafficLog[]>;
//     machinesLogsClear: (machineId: string) => Promise<boolean>;
//     machinesSimStart: (
//         machineId: string,
//         scenario?: MachineSimulationScenario,
//         intervalMs?: number,
//     ) => Promise<MachineSimulationState>;
//     machinesSimStop: (machineId: string) => Promise<MachineSimulationState>;
//     machinesSimRestart: (
//         machineId: string,
//         scenario?: MachineSimulationScenario,
//         intervalMs?: number,
//     ) => Promise<MachineSimulationState>;
//     machinesSimState: (machineId: string) => Promise<MachineSimulationState>;
//     machinesSimStates: () => Promise<MachineSimulationState[]>;
//     machinesParsedList: (machineId: string, limit?: number) => Promise<ParsedMessageRow[]>;
//     machinesNormalizedList: (machineId: string, limit?: number) => Promise<NormalizedResultRow[]>;

//     approvalPoliciesList: () => Promise<ApprovalPolicy[]>;
//     approvalPoliciesCreate: (dto: Partial<ApprovalPolicy>) => Promise<{ id: string }>;
//     approvalPoliciesUpdate: (id: string, dto: Partial<ApprovalPolicy>) => Promise<boolean>;
//     approvalPoliciesDelete: (id: string) => Promise<boolean>;

//     resultsPendingApprovals: (limit?: number) => Promise<ResultWorkflowRow[]>;
//     resultApprove: (dto: {
//         normalizedResultId: string;
//         policyId: string;
//         stepOrder: number;
//         approverUserId: string;
//         comment?: string | null;
//     }) => Promise<boolean>;
//     resultReject: (dto: {
//         normalizedResultId: string;
//         policyId: string;
//         stepOrder: number;
//         approverUserId: string;
//         comment?: string | null;
//     }) => Promise<boolean>;
//     resultApprovalsList: (normalizedResultId: string) => Promise<ResultApprovalRow[]>;
//     resultApprovalsAll: (limit?: number) => Promise<ResultApprovalRow[]>;

//     outboundQueueList: (limit?: number) => Promise<OutboundQueueRow[]>;
//     outboundQueuePending: (limit?: number) => Promise<OutboundQueueRow[]>;
//     deliveryHistoryList: (limit?: number) => Promise<OutboundQueueRow[]>;
//     deliveryAuditList: (query?: DeliveryAuditQuery) => Promise<DeliveryAuditRow[]>;
//     deliveryAuditQuery: (query?: DeliveryAuditQuery) => Promise<DeliveryAuditRow[]>;

//     targetTransformPreview: (
//         targetId: string,
//         normalizedResultId: string,
//     ) => Promise<TargetTransformPreview>;
//     outboundQueueRetry: (queueId: string) => Promise<boolean>;
//     outboundQueueRequeue: (queueId: string) => Promise<boolean>;
//     outboundQueueSendNow: (queueId: string) => Promise<boolean>;
//     targetSecretsGet: (targetId: string) => Promise<TargetSecretConfig | null>;
//     targetSecretsSave: (
//         targetId: string,
//         dto: Omit<TargetSecretConfig, 'targetId'>,
//     ) => Promise<boolean>;

//     mappingsList: () => Promise<MappingRule[]>;
//     mappingsCreate: (dto: Partial<MappingRule>) => Promise<{ id: string }>;
//     mappingsUpdate: (id: string, dto: Partial<MappingRule>) => Promise<boolean>;
//     mappingsDelete: (id: string) => Promise<boolean>;
//     mappingsValidate: (targetType: string) => Promise<MappingValidationResult>;
//     mappingValueTranslationsList: (mappingRuleId: string) => Promise<MappingValueTranslation[]>;
//     mappingValueTranslationsCreate: (
//         dto: Partial<MappingValueTranslation>,
//     ) => Promise<{ id: string }>;
//     mappingValueTranslationsUpdate: (
//         id: string,
//         dto: Partial<MappingValueTranslation>,
//     ) => Promise<boolean>;
//     mappingValueTranslationsDelete: (id: string) => Promise<boolean>;
//     mappingValueTranslationsSaveConfig: (
//         mappingRuleId: string,
//         dto: {
//             value_mapping_enabled: number;
//             unmapped_behavior: MappingUnmappedBehavior;
//             default_destination_value?: string | null;
//         },
//     ) => Promise<boolean>;
//     targetTransformPreviewFromQueue: (queueId: string) => Promise<TargetTransformPreview>;
//     targetTransformPreviewFromDeliveryHistory: (queueId: string) => Promise<TargetTransformPreview>;

//     resultReevaluatePolicy: (normalizedResultId: string) => Promise<boolean>;
//     copyToClipboard: (text: string) => Promise<void>;
// };

// export type AuthorityCode =
//     | 'USERS_WRITE'
//     | 'ROLES_WRITE'
//     | 'LABS_WRITE'
//     | 'MACHINES_WRITE'
//     | 'MAPPINGS_WRITE'
//     | 'ROUTES_WRITE'
//     | 'VIEW_LOGS'
//     | 'OUTBOX_MANAGE'
//     | 'AUDIT_READ'
//     | 'SUPER_ADMIN'
//     | 'RESULT_VIEW'
//     | 'RESULT_APPROVE'
//     | 'RESULT_REJECT'
//     | 'RESULT_ROUTE'
//     | 'RESULT_REQUEUE'
//     | 'APPROVAL_POLICY_READ'
//     | 'APPROVAL_POLICY_WRITE'
//     | 'TARGET_CONFIG_WRITE'
//     | 'MAPPING_WRITE'
//     | 'AUDIT_VIEW'
//     | 'RESULT_VIEW_SENSITIVE';

// export type CurrentUserSnapshot = {
//     id: string;
//     username: string;
//     roles: string[];
//     roleIds: string[];
//     authorities: AuthorityCode[];
//     mustChangePassword: boolean;
// };

// export type RetryBackoffStrategy = 'FIXED' | 'LINEAR' | 'EXPONENTIAL';

// export type ConnectionType = 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';

// export type ProtocolType = 'HL7' | 'ASTM' | 'RAW';

// export type Lab = {
//     id: string;
//     code?: string | null;
//     name: string;
//     location?: string | null;
//     description?: string | null;
//     is_active: number;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type Machine = {
//     id: string;
//     lab_id?: string | null;
//     lab_name?: string | null;

//     name: string;
//     code?: string | null;
//     brand?: string | null;
//     model?: string | null;
//     version?: string | null;
//     manufacturer?: string | null;

//     connection_type: ConnectionType;
//     protocol: ProtocolType;

//     // TCP / HL7_MLLP
//     host?: string | null;
//     port?: number | null;
//     tcp_mode?: 'SERVER' | 'CLIENT' | null;

//     // SERIAL
//     serial_port?: string | null;
//     baud_rate?: number | null;
//     data_bits?: number | null;
//     stop_bits?: number | null;
//     parity?: 'none' | 'even' | 'odd' | 'mark' | 'space' | null;

//     // FTP / SFTP
//     ftp_host?: string | null;
//     ftp_port?: number | null;
//     ftp_user?: string | null;
//     ftp_password?: string | null;
//     ftp_remote_dir?: string | null;

//     // FILE WATCHER
//     watch_dir?: string | null;
//     watch_pattern?: string | null;

//     is_active: number;
//     auto_connect: number;

//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

// export type Target = {
//     id: string;
//     type: TargetType;
//     name: string;
//     base_url: string;
//     enabled: number;
//     auto_retry_enabled?: number;
//     max_retry_attempts?: number | null;
//     retry_backoff_strategy?: RetryBackoffStrategy | null;
//     initial_retry_delay_ms?: number | null;
//     max_retry_delay_ms?: number | null;
//     request_timeout_ms?: number | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type UserRow = {
//     id: string;
//     username: string;
//     is_active: number;
//     must_change_password: number;
//     role_ids: string[];
//     role_names: string[];
//     authorities: AuthorityCode[];
//     created_at: string;
//     updated_at: string;
// };

// export type RoleRow = {
//     id: string;
//     name: string;
//     description?: string | null;
//     authority_codes: AuthorityCode[];
//     user_count: number;
//     created_at: string;
//     updated_at?: string | null;
// };

// export type LogRow = {
//     id: string;
//     level: 'info' | 'warn' | 'error';
//     source: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
//     entity_type?: string | null;
//     entity_id?: string | null;
//     message: string;
//     payload_json?: string | null;
//     created_at: string;
// };

// export type LogsQuery = {
//     level?: 'info' | 'warn' | 'error';
//     source?: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
//     entityType?: string;
//     entityId?: string;
//     limit?: number;
// };

// export type NormalizedResultRow = {
//     id: string;
//     machine_id: string;
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     sample_id?: string | null;
//     patient_id?: string | null;
//     patient_name?: string | null;
//     order_id?: string | null;
//     test_code?: string | null;
//     test_name?: string | null;
//     value?: string | null;
//     units?: string | null;
//     reference_range?: string | null;
//     abnormal_flag?: string | null;
//     observed_at?: string | null;
//     source_message_type?: string | null;
//     summary?: string | null;
//     data_json: string;
//     created_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
// };

// export type MachineRuntimeState = {
//     machineId: string;
//     status: 'disconnected' | 'connecting' | 'connected' | 'idle' | 'stopped' | 'error';
//     message?: string | null;
//     startedAt?: string | null;
//     updatedAt: string;
// };

// export type ApprovalPolicyRow = {
//     id: string;
//     name: string;
//     enabled: number;
//     applies_to_lab_id?: string | null;
//     applies_to_machine_id?: string | null;
//     applies_to_target_id?: string | null;
//     requires_approval: number;
//     min_approvals: number;
//     created_at: string;
//     updated_at: string;
// };

// export type WorkflowStatusRow = {
//     id: string;
//     normalized_result_id: string;
//     status:
//     | 'RECEIVED'
//     | 'PARSED'
//     | 'NORMALIZED'
//     | 'PENDING_APPROVAL'
//     | 'PENDING_POLICY'
//     | 'POLICY_DISABLED'
//     | 'APPROVED'
//     | 'REJECTED'
//     | 'QUEUED'
//     | 'ROUTED'
//     | 'FAILED_DELIVERY';
//     approval_policy_id?: string | null;
//     approval_required: number;
//     approval_count_required: number;
//     approval_count_received: number;
//     queued_at?: string | null;
//     routed_at?: string | null;
//     failed_at?: string | null;
//     last_error?: string | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type MachineTrafficLog = {
//     id: string;
//     machine_id: string;
//     direction: 'inbound' | 'outbound' | 'system';
//     transport: 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     event_type:
//     | 'connected'
//     | 'disconnected'
//     | 'payload'
//     | 'parse_success'
//     | 'parse_error'
//     | 'test'
//     | 'error';
//     payload?: string | null;
//     payload_preview?: string | null;
//     created_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
// };

// export type ParsedMessageRow = {
//     id: string;
//     machine_id: string;
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     message_type: string;
//     summary?: string | null;
//     data_json: string;
//     raw?: string | null;
//     created_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
// };

// export type RuntimeEvent =
//     | {
//         type: 'state';
//         machineId: string;
//         status: string;
//         message?: string | null;
//         updatedAt: string;
//     }
//     | {
//         type: 'traffic';
//         machineId: string;
//         direction: 'inbound' | 'outbound' | 'system';
//         payloadPreview: string;
//         updatedAt: string;
//     };

// export type MachineSimulationScenario =
//     | 'ASTM_BASIC'
//     | 'HL7_ORU'
//     | 'HL7_COBAS_HPV_FINAL_RESULT'
//     | 'RAW_PING';

// export type MachineSimulationState = {
//     machineId: string;
//     running: boolean;
//     scenario?: MachineSimulationScenario | null;
//     intervalMs?: number | null;
//     updatedAt: string;
// };

// export type ApprovalPolicy = {
//     id: string;
//     name: string;
//     enabled: number;
//     applies_to_lab_id?: string | null;
//     applies_to_machine_id?: string | null;
//     applies_to_target_id?: string | null;
//     requires_approval: number;
//     min_approvals: number;
//     created_at: string;
//     updated_at: string;
//     route_target_ids?: string[];
// };

// export type ResultWorkflowRow = {
//     id: string;
//     normalized_result_id: string;
//     status:
//     | 'RECEIVED'
//     | 'PARSED'
//     | 'NORMALIZED'
//     | 'PENDING_APPROVAL'
//     | 'PENDING_POLICY'
//     | 'POLICY_DISABLED'
//     | 'APPROVED'
//     | 'REJECTED'
//     | 'QUEUED'
//     | 'ROUTED'
//     | 'FAILED_DELIVERY';
//     approval_policy_id?: string | null;
//     approval_required: number;
//     approval_count_required: number;
//     approval_count_received: number;
//     queued_at?: string | null;
//     routed_at?: string | null;
//     failed_at?: string | null;
//     last_error?: string | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type ResultApprovalRow = {
//     id: string;
//     normalized_result_id: string;
//     policy_id: string;
//     step_order: number;
//     approver_user_id: string;
//     action: 'APPROVED' | 'REJECTED' | 'RETURNED';
//     comment?: string | null;
//     acted_at: string;
//     policy_name?: string | null;
//     approver_display_name?: string | null;
//     approver_username?: string | null;
//     approver_roles?: string[];
//     snapshot_result?: any;
//     snapshot_policy?: any;
//     snapshot_route_targets?: any[];
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type OutboundQueueRow = {
//     id: string;
//     normalized_result_id: string;
//     target_id: string;
//     payload_json: string;
//     preview_name?: string | null;
//     source_snapshot_json?: string | null;
//     transform_warnings_json?: string | null;
//     transform_errors_json?: string | null;
//     transform_summary_json?: string | null;
//     delivery_status: 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED';
//     retry_count: number;
//     next_retry_at?: string | null;
//     last_error?: string | null;
//     target_name?: string | null;
//     target_type?: TargetType | null;
//     target_enabled?: number | null;
//     target_auto_retry_enabled?: number | null;
//     target_max_retry_attempts?: number | null;
//     target_retry_backoff_strategy?: RetryBackoffStrategy | null;
//     target_initial_retry_delay_ms?: number | null;
//     target_max_retry_delay_ms?: number | null;
//     target_request_timeout_ms?: number | null;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type DeliveryAuditQuery = {
//     queueId?: string;
//     targetId?: string;
//     operation?: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
//     status?: 'STARTED' | 'DELIVERED' | 'FAILED';
//     correlationId?: string;
//     limit?: number;
// };

// export type DeliveryAuditRow = {
//     id: string;
//     queue_id: string;
//     target_id: string;
//     target_name?: string | null;
//     target_type?: TargetType | string | null;
//     operation: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
//     status: 'STARTED' | 'DELIVERED' | 'FAILED';
//     attempt_no: number;
//     http_status?: number | null;
//     correlation_id?: string | null;
//     duration_ms?: number | null;
//     error_message?: string | null;
//     queue_delivery_status?: string | null;
//     queue_retry_count?: number | null;
//     queue_last_error?: string | null;
//     queue_updated_at?: string | null;
//     created_at: string;
// };

// export type TargetTransformPreview = {
//     targetId: string;
//     targetType: TargetType;
//     normalizedResultId: string;
//     previewName: string;
//     payload: Record<string, any>;
//     warnings?: string[];
// };

// export type TargetSecretConfig = {
//     targetId: string;
//     authType: 'none' | 'bearer' | 'basic' | 'api_key';
//     username?: string | null;
//     password?: string | null;
//     token?: string | null;
//     apiKeyName?: string | null;
//     apiKeyValue?: string | null;
//     allowInsecureTls: boolean;
// };

// export type TargetDiagnosticsResult = {
//     ok: boolean;
//     message: string;
//     details?: {
//         targetId: string;
//         targetName?: string;
//         targetType?: string;
//         baseUrl?: string;
//         authType?: string;
//         tlsMode?: 'strict' | 'insecure-dev';
//         httpStatus?: number | null;
//         checkedAt: string;
//         notes?: string[];
//     };
// };

// export type TargetHarnessResult = {
//     ok: boolean;
//     message: string;
//     correlationId?: string | null;
//     details?: {
//         targetId: string;
//         targetName?: string;
//         targetType?: string;
//         endpoint?: string;
//         label?: string | null;
//         authType?: string;
//         authConfigured?: boolean;
//         tlsMode?: 'strict' | 'insecure-dev';
//         httpStatus?: number | null;
//         checkedAt: string;
//         notes?: string[];
//         responseSnippet?: string | null;
//     };
// };

// export type MappingUnmappedBehavior = 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR';

// export type MappingValueTranslation = {
//     id: string;
//     mapping_rule_id: string;
//     source_value: string;
//     destination_value?: string | null;
//     enabled: number;
//     note?: string | null;
//     created_at: string;
//     updated_at: string;
// };

// export type MappingRule = {
//     id: string;
//     target_type: TargetType;
//     source_field: string;
//     destination_field: string;
//     transform_kind: 'direct' | 'constant' | 'lookup';
//     constant_value?: string | null;
//     enabled: number;
//     value_mapping_enabled?: number;
//     unmapped_behavior?: MappingUnmappedBehavior | null;
//     default_destination_value?: string | null;
//     created_at: string;
//     updated_at: string;
// };

// export type MappingValidationResult = {
//     ok: boolean;
//     message: string;
//     targetType?: TargetType | 'ALL';
//     errors?: string[];
//     warnings?: string[];
//     recommendations?: string[];
//     summary?: {
//         enabledRules: number;
//         duplicateDestinations: number;
//         unsupportedKinds: number;
//     };
// };

// export type AppAPI = {
//     getAppVersion: () => Promise<string>;
//     ping: (msg: string) => Promise<string>;
//     log: (level: 'info' | 'warn' | 'error', message: string) => void;

//     tcpConnect: (host: string, port: number) => Promise<boolean>;
//     tcpSend: (payload: string) => Promise<boolean>;
//     tcpDisconnect: () => Promise<boolean>;

//     serialList: () => Promise<any[]>;
//     serialConnect: (path: string, baudRate: number) => Promise<boolean>;
//     serialSend: (payload: string) => Promise<boolean>;
//     serialDisconnect: () => Promise<boolean>;

//     onMachineMessage: (cb: (msg: any) => void) => () => void;

//     authLogin: (
//         username: string,
//         password: string,
//     ) => Promise<{
//         user: { id: string; username: string; authorities: string[]; mustChangePassword: boolean };
//     }>;
//     authChangePassword: (userId: string, newPassword: string) => Promise<boolean>;
//     authCurrentUser: () => Promise<CurrentUserSnapshot | null>;
//     authLogout?: () => Promise<boolean>;

//     usersList: () => Promise<UserRow[]>;
//     usersCreate: (dto: {
//         username: string;
//         password: string;
//         is_active?: number;
//         must_change_password?: number;
//         role_ids?: string[];
//     }) => Promise<{ id: string }>;
//     usersUpdate: (
//         id: string,
//         dto: {
//             username?: string;
//             is_active?: number;
//             must_change_password?: number;
//             role_ids?: string[];
//         },
//     ) => Promise<boolean>;
//     usersResetPassword: (id: string, newPassword: string) => Promise<boolean>;
//     usersDelete: (id: string) => Promise<boolean>;

//     rolesList: () => Promise<RoleRow[]>;
//     rolesAuthoritiesCatalog: () => Promise<AuthorityCode[]>;
//     rolesCreate: (dto: {
//         name: string;
//         description?: string | null;
//         authority_codes?: AuthorityCode[];
//     }) => Promise<{ id: string }>;
//     rolesUpdate: (
//         id: string,
//         dto: { name?: string; description?: string | null; authority_codes?: AuthorityCode[] },
//     ) => Promise<boolean>;
//     rolesDelete: (id: string) => Promise<boolean>;

//     labsList: () => Promise<Lab[]>;
//     labsCreate: (dto: Partial<Lab>) => Promise<{ id: string }>;
//     labsUpdate: (id: string, dto: Partial<Lab>) => Promise<boolean>;
//     labsDelete: (id: string) => Promise<boolean>;

//     machinesList: () => Promise<Machine[]>;
//     machinesCreate: (dto: Partial<Machine>) => Promise<{ id: string }>;
//     machinesUpdate: (id: string, dto: Partial<Machine>) => Promise<boolean>;
//     machinesDelete: (id: string) => Promise<boolean>;
//     machinesConnect: (id: string) => Promise<boolean>;
//     machinesDisconnect: (id: string) => Promise<boolean>;
//     machinesTest: (machine: Partial<Machine>) => Promise<{ ok: boolean; message?: string }>;

//     targetsList: () => Promise<Target[]>;
//     targetsCreate: (dto: Partial<Target>) => Promise<{ id: string }>;
//     targetsUpdate: (id: string, dto: Partial<Target>) => Promise<boolean>;
//     targetsDelete: (id: string) => Promise<boolean>;
//     targetsTest: (id: string) => Promise<TargetDiagnosticsResult>;
//     targetsHarnessSend: (
//         targetId: string,
//         payload: unknown,
//         previewName?: string | null,
//     ) => Promise<TargetHarnessResult>;

//     logsQuery: (q: LogsQuery) => Promise<LogRow[]>;

//     machinesRuntimeStart: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeStop: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeRestart: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeState: (id: string) => Promise<MachineRuntimeState>;
//     machinesRuntimeStates: () => Promise<MachineRuntimeState[]>;
//     onMachinesRuntimeEvent: (cb: (event: RuntimeEvent) => void) => () => void;
//     machinesLogsList: (machineId: string, limit?: number) => Promise<MachineTrafficLog[]>;
//     machinesLogsClear: (machineId: string) => Promise<boolean>;
//     machinesSimStart: (
//         machineId: string,
//         scenario?: MachineSimulationScenario,
//         intervalMs?: number,
//     ) => Promise<MachineSimulationState>;
//     machinesSimStop: (machineId: string) => Promise<MachineSimulationState>;
//     machinesSimRestart: (
//         machineId: string,
//         scenario?: MachineSimulationScenario,
//         intervalMs?: number,
//     ) => Promise<MachineSimulationState>;
//     machinesSimState: (machineId: string) => Promise<MachineSimulationState>;
//     machinesSimStates: () => Promise<MachineSimulationState[]>;
//     machinesParsedList: (machineId: string, limit?: number) => Promise<ParsedMessageRow[]>;
//     machinesNormalizedList: (machineId: string, limit?: number) => Promise<NormalizedResultRow[]>;

//     approvalPoliciesList: () => Promise<ApprovalPolicy[]>;
//     approvalPoliciesCreate: (dto: Partial<ApprovalPolicy>) => Promise<{ id: string }>;
//     approvalPoliciesUpdate: (id: string, dto: Partial<ApprovalPolicy>) => Promise<boolean>;
//     approvalPoliciesDelete: (id: string) => Promise<boolean>;

//     resultsPendingApprovals: (limit?: number) => Promise<ResultWorkflowRow[]>;
//     resultApprove: (dto: {
//         normalizedResultId: string;
//         policyId: string;
//         stepOrder: number;
//         approverUserId: string;
//         comment?: string | null;
//     }) => Promise<boolean>;
//     resultReject: (dto: {
//         normalizedResultId: string;
//         policyId: string;
//         stepOrder: number;
//         approverUserId: string;
//         comment?: string | null;
//     }) => Promise<boolean>;
//     resultApprovalsList: (normalizedResultId: string) => Promise<ResultApprovalRow[]>;
//     resultApprovalsAll: (limit?: number) => Promise<ResultApprovalRow[]>;

//     outboundQueueList: (limit?: number) => Promise<OutboundQueueRow[]>;
//     outboundQueuePending: (limit?: number) => Promise<OutboundQueueRow[]>;
//     deliveryHistoryList: (limit?: number) => Promise<OutboundQueueRow[]>;
//     deliveryAuditList: (query?: DeliveryAuditQuery) => Promise<DeliveryAuditRow[]>;
//     deliveryAuditQuery: (query?: DeliveryAuditQuery) => Promise<DeliveryAuditRow[]>;

//     targetTransformPreview: (
//         targetId: string,
//         normalizedResultId: string,
//     ) => Promise<TargetTransformPreview>;
//     outboundQueueRetry: (queueId: string) => Promise<boolean>;
//     outboundQueueRequeue: (queueId: string) => Promise<boolean>;
//     outboundQueueSendNow: (queueId: string) => Promise<boolean>;
//     targetSecretsGet: (targetId: string) => Promise<TargetSecretConfig | null>;
//     targetSecretsSave: (
//         targetId: string,
//         dto: Omit<TargetSecretConfig, 'targetId'>,
//     ) => Promise<boolean>;

//     mappingsList: () => Promise<MappingRule[]>;
//     mappingsCreate: (dto: Partial<MappingRule>) => Promise<{ id: string }>;
//     mappingsUpdate: (id: string, dto: Partial<MappingRule>) => Promise<boolean>;
//     mappingsDelete: (id: string) => Promise<boolean>;
//     mappingsValidate: (targetType: string) => Promise<MappingValidationResult>;
//     mappingValueTranslationsList: (mappingRuleId: string) => Promise<MappingValueTranslation[]>;
//     mappingValueTranslationsCreate: (
//         dto: Partial<MappingValueTranslation>,
//     ) => Promise<{ id: string }>;
//     mappingValueTranslationsUpdate: (
//         id: string,
//         dto: Partial<MappingValueTranslation>,
//     ) => Promise<boolean>;
//     mappingValueTranslationsDelete: (id: string) => Promise<boolean>;
//     mappingValueTranslationsSaveConfig: (
//         mappingRuleId: string,
//         dto: {
//             value_mapping_enabled: number;
//             unmapped_behavior: MappingUnmappedBehavior;
//             default_destination_value?: string | null;
//         },
//     ) => Promise<boolean>;
//     targetTransformPreviewFromQueue: (queueId: string) => Promise<TargetTransformPreview>;
//     targetTransformPreviewFromDeliveryHistory: (queueId: string) => Promise<TargetTransformPreview>;

//     resultReevaluatePolicy: (normalizedResultId: string) => Promise<boolean>;
//     copyToClipboard: (text: string) => Promise<void>;
// };


export type AuthorityCode =
    | 'USERS_WRITE'
    | 'ROLES_WRITE'
    | 'LABS_WRITE'
    | 'MACHINES_WRITE'
    | 'MAPPINGS_WRITE'
    | 'ROUTES_WRITE'
    | 'VIEW_LOGS'
    | 'OUTBOX_MANAGE'
    | 'AUDIT_READ'
    | 'SUPER_ADMIN'
    | 'RESULT_VIEW'
    | 'RESULT_APPROVE'
    | 'RESULT_REJECT'
    | 'RESULT_ROUTE'
    | 'RESULT_REQUEUE'
    | 'APPROVAL_POLICY_READ'
    | 'APPROVAL_POLICY_WRITE'
    | 'TARGET_CONFIG_WRITE'
    | 'MAPPING_WRITE'
    | 'AUDIT_VIEW'
    | 'RESULT_VIEW_SENSITIVE';

export type CurrentUserSnapshot = {
    id: string;
    username: string;
    roles: string[];
    roleIds: string[];
    authorities: AuthorityCode[];
    mustChangePassword: boolean;
};

export type RetryBackoffStrategy = 'FIXED' | 'LINEAR' | 'EXPONENTIAL';

export type ConnectionType = 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';

export type ProtocolType = 'HL7' | 'ASTM' | 'RAW';

export type Lab = {
    id: string;
    code?: string | null;
    name: string;
    location?: string | null;
    description?: string | null;
    is_active: number;
    created_at: string;
    updated_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
    updated_by_user_id?: string | null;
    updated_by_username?: string | null;
};

export type Machine = {
    id: string;
    lab_id?: string | null;
    lab_name?: string | null;

    name: string;
    code?: string | null;
    brand?: string | null;
    model?: string | null;
    version?: string | null;
    manufacturer?: string | null;

    connection_type: ConnectionType;
    protocol: ProtocolType;

    // TCP / HL7_MLLP
    host?: string | null;
    port?: number | null;
    tcp_mode?: 'SERVER' | 'CLIENT' | null;

    // SERIAL
    serial_port?: string | null;
    baud_rate?: number | null;
    data_bits?: number | null;
    stop_bits?: number | null;
    parity?: 'none' | 'even' | 'odd' | 'mark' | 'space' | null;

    // FTP / SFTP
    ftp_host?: string | null;
    ftp_port?: number | null;
    ftp_user?: string | null;
    ftp_password?: string | null;
    ftp_remote_dir?: string | null;

    // FILE WATCHER
    watch_dir?: string | null;
    watch_pattern?: string | null;

    is_active: number;
    auto_connect: number;

    created_at: string;
    updated_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
    updated_by_user_id?: string | null;
    updated_by_username?: string | null;
};

export type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

export type Target = {
    id: string;
    type: TargetType;
    name: string;
    base_url: string;
    enabled: number;
    auto_retry_enabled?: number;
    max_retry_attempts?: number | null;
    retry_backoff_strategy?: RetryBackoffStrategy | null;
    initial_retry_delay_ms?: number | null;
    max_retry_delay_ms?: number | null;
    request_timeout_ms?: number | null;
    created_at: string;
    updated_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
    updated_by_user_id?: string | null;
    updated_by_username?: string | null;
};

export type UserRow = {
    id: string;
    username: string;
    is_active: number;
    must_change_password: number;
    role_ids: string[];
    role_names: string[];
    authorities: AuthorityCode[];
    created_at: string;
    updated_at: string;
};

export type RoleRow = {
    id: string;
    name: string;
    description?: string | null;
    authority_codes: AuthorityCode[];
    user_count: number;
    created_at: string;
    updated_at?: string | null;
};

export type LogRow = {
    id: string;
    level: 'info' | 'warn' | 'error';
    source: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
    entity_type?: string | null;
    entity_id?: string | null;
    message: string;
    payload_json?: string | null;
    created_at: string;
};

export type LogsQuery = {
    level?: 'info' | 'warn' | 'error';
    source?: 'APP' | 'MACHINE' | 'TARGET' | 'AUTH';
    entityType?: string;
    entityId?: string;
    limit?: number;
};

export type NormalizedResultRow = {
    id: string;
    machine_id: string;
    protocol: 'ASTM' | 'HL7' | 'RAW';
    sample_id?: string | null;
    patient_id?: string | null;
    patient_name?: string | null;
    order_id?: string | null;
    test_code?: string | null;
    test_name?: string | null;
    value?: string | null;
    units?: string | null;
    reference_range?: string | null;
    abnormal_flag?: string | null;
    observed_at?: string | null;
    source_message_type?: string | null;
    summary?: string | null;
    data_json: string;
    created_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
};

export type MachineRuntimeState = {
    machineId: string;
    status: 'disconnected' | 'connecting' | 'connected' | 'idle' | 'stopped' | 'error';
    message?: string | null;
    startedAt?: string | null;
    updatedAt: string;
};

export type ApprovalPolicyRow = {
    id: string;
    name: string;
    enabled: number;
    applies_to_lab_id?: string | null;
    applies_to_machine_id?: string | null;
    applies_to_target_id?: string | null;
    requires_approval: number;
    min_approvals: number;
    created_at: string;
    updated_at: string;
};

export type WorkflowStatusRow = {
    id: string;
    normalized_result_id: string;
    status:
    | 'RECEIVED'
    | 'PARSED'
    | 'NORMALIZED'
    | 'PENDING_APPROVAL'
    | 'PENDING_POLICY'
    | 'POLICY_DISABLED'
    | 'APPROVED'
    | 'REJECTED'
    | 'QUEUED'
    | 'ROUTED'
    | 'FAILED_DELIVERY';
    approval_policy_id?: string | null;
    approval_required: number;
    approval_count_required: number;
    approval_count_received: number;
    queued_at?: string | null;
    routed_at?: string | null;
    failed_at?: string | null;
    last_error?: string | null;
    created_at: string;
    updated_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
    updated_by_user_id?: string | null;
    updated_by_username?: string | null;
};

export type MachineTrafficLog = {
    id: string;
    machine_id: string;
    direction: 'inbound' | 'outbound' | 'system';
    transport: 'TCP' | 'HL7_MLLP' | 'SERIAL' | 'FTP' | 'SFTP' | 'FILE_WATCHER';
    protocol: 'ASTM' | 'HL7' | 'RAW';
    event_type:
    | 'connected'
    | 'disconnected'
    | 'payload'
    | 'parse_success'
    | 'parse_error'
    | 'test'
    | 'error';
    payload?: string | null;
    payload_preview?: string | null;
    created_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
};

export type ParsedMessageRow = {
    id: string;
    machine_id: string;
    protocol: 'ASTM' | 'HL7' | 'RAW';
    message_type: string;
    summary?: string | null;
    data_json: string;
    raw?: string | null;
    created_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
};

export type RuntimeEvent =
    | {
        type: 'state';
        machineId: string;
        status: string;
        message?: string | null;
        updatedAt: string;
    }
    | {
        type: 'traffic';
        machineId: string;
        direction: 'inbound' | 'outbound' | 'system';
        payloadPreview: string;
        updatedAt: string;
    };

export type MachineSimulationScenario =
    | 'ASTM_BASIC'
    | 'HL7_ORU'
    | 'RAW_PING'
    | 'HL7_COBAS_HPV_FINAL_RESULT'
    | 'ASTM_COBAS_HPV_FINAL_RESULT';

export type MachineSimulationState = {
    machineId: string;
    running: boolean;
    scenario?: MachineSimulationScenario | null;
    intervalMs?: number | null;
    updatedAt: string;
};

export type ApprovalPolicy = {
    id: string;
    name: string;
    enabled: number;
    applies_to_lab_id?: string | null;
    applies_to_machine_id?: string | null;
    applies_to_target_id?: string | null;
    requires_approval: number;
    min_approvals: number;
    created_at: string;
    updated_at: string;
    route_target_ids?: string[];
};

export type ResultWorkflowRow = {
    id: string;
    normalized_result_id: string;
    status:
    | 'RECEIVED'
    | 'PARSED'
    | 'NORMALIZED'
    | 'PENDING_APPROVAL'
    | 'PENDING_POLICY'
    | 'POLICY_DISABLED'
    | 'APPROVED'
    | 'REJECTED'
    | 'QUEUED'
    | 'ROUTED'
    | 'FAILED_DELIVERY';
    approval_policy_id?: string | null;
    approval_required: number;
    approval_count_required: number;
    approval_count_received: number;
    queued_at?: string | null;
    routed_at?: string | null;
    failed_at?: string | null;
    last_error?: string | null;
    created_at: string;
    updated_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
    updated_by_user_id?: string | null;
    updated_by_username?: string | null;
};

export type ResultApprovalRow = {
    id: string;
    normalized_result_id: string;
    policy_id: string;
    step_order: number;
    approver_user_id: string;
    action: 'APPROVED' | 'REJECTED' | 'RETURNED';
    comment?: string | null;
    acted_at: string;
    policy_name?: string | null;
    approver_display_name?: string | null;
    approver_username?: string | null;
    approver_roles?: string[];
    snapshot_result?: any;
    snapshot_policy?: any;
    snapshot_route_targets?: any[];
    created_by_user_id?: string | null;
    created_by_username?: string | null;
    updated_by_user_id?: string | null;
    updated_by_username?: string | null;
};

export type ResultApprovalActionResult = {
    ok: boolean;
    message?: string;
    finalApprovalReached?: boolean;
    queuedCount?: number;
    queueErrors?: string[];
    alreadyActed?: boolean;
    duplicateAction?: boolean;
    duplicate?: boolean;
    action?: 'APPROVED' | 'REJECTED' | 'RETURNED' | string;
    workflowStatus?: string;
    code?: 'APPROVER_ALREADY_ACTED' | string;
    existingAction?: 'APPROVED' | 'REJECTED' | 'RETURNED' | string;
    actedAt?: string | null;
    approverUserId?: string | null;
    approverUsername?: string | null;
};

export type OutboundQueueRow = {
    id: string;
    normalized_result_id: string;
    target_id: string;
    payload_json: string;
    preview_name?: string | null;
    source_snapshot_json?: string | null;
    transform_warnings_json?: string | null;
    transform_errors_json?: string | null;
    transform_summary_json?: string | null;
    delivery_status: 'PENDING' | 'SENDING' | 'DELIVERED' | 'FAILED';
    retry_count: number;
    next_retry_at?: string | null;
    last_error?: string | null;
    target_name?: string | null;
    target_type?: TargetType | null;
    target_enabled?: number | null;
    target_auto_retry_enabled?: number | null;
    target_max_retry_attempts?: number | null;
    target_retry_backoff_strategy?: RetryBackoffStrategy | null;
    target_initial_retry_delay_ms?: number | null;
    target_max_retry_delay_ms?: number | null;
    target_request_timeout_ms?: number | null;
    created_at: string;
    updated_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
    updated_by_user_id?: string | null;
    updated_by_username?: string | null;
};

export type DeliveryAuditQuery = {
    queueId?: string;
    targetId?: string;
    operation?: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
    status?: 'STARTED' | 'DELIVERED' | 'FAILED';
    correlationId?: string;
    limit?: number;
};

export type DeliveryAuditRow = {
    id: string;
    queue_id: string;
    target_id: string;
    target_name?: string | null;
    target_type?: TargetType | string | null;
    operation: 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS';
    status: 'STARTED' | 'DELIVERED' | 'FAILED';
    attempt_no: number;
    http_status?: number | null;
    correlation_id?: string | null;
    duration_ms?: number | null;
    error_message?: string | null;
    queue_delivery_status?: string | null;
    queue_retry_count?: number | null;
    queue_last_error?: string | null;
    queue_updated_at?: string | null;
    created_at: string;
};

export type TargetTransformPreview = {
    targetId: string;
    targetType: TargetType;
    normalizedResultId: string;
    previewName: string;
    payload: Record<string, any>;
    warnings?: string[];
};

export type TargetSecretConfig = {
    targetId: string;
    authType: 'none' | 'bearer' | 'basic' | 'api_key';
    username?: string | null;
    password?: string | null;
    token?: string | null;
    apiKeyName?: string | null;
    apiKeyValue?: string | null;
    allowInsecureTls: boolean;
};

export type TargetDiagnosticsResult = {
    ok: boolean;
    message: string;
    details?: {
        targetId: string;
        targetName?: string;
        targetType?: string;
        baseUrl?: string;
        authType?: string;
        tlsMode?: 'strict' | 'insecure-dev';
        httpStatus?: number | null;
        checkedAt: string;
        notes?: string[];
    };
};

export type TargetHarnessResult = {
    ok: boolean;
    message: string;
    correlationId?: string | null;
    details?: {
        targetId: string;
        targetName?: string;
        targetType?: string;
        endpoint?: string;
        label?: string | null;
        authType?: string;
        authConfigured?: boolean;
        tlsMode?: 'strict' | 'insecure-dev';
        httpStatus?: number | null;
        checkedAt: string;
        notes?: string[];
        responseSnippet?: string | null;
    };
};

export type MappingUnmappedBehavior = 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR';

export type MappingValueTranslation = {
    id: string;
    mapping_rule_id: string;
    source_value: string;
    destination_value?: string | null;
    enabled: number;
    note?: string | null;
    created_at: string;
    updated_at: string;
};

export type MappingRule = {
    id: string;
    target_type: TargetType;
    source_field: string;
    destination_field: string;
    transform_kind: 'direct' | 'constant' | 'lookup';
    constant_value?: string | null;
    enabled: number;
    value_mapping_enabled?: number;
    unmapped_behavior?: MappingUnmappedBehavior | null;
    default_destination_value?: string | null;
    created_at: string;
    updated_at: string;
};

export type MappingValidationResult = {
    ok: boolean;
    message: string;
    targetType?: TargetType | 'ALL';
    errors?: string[];
    warnings?: string[];
    recommendations?: string[];
    summary?: {
        enabledRules: number;
        duplicateDestinations: number;
        unsupportedKinds: number;
    };
};

export type AppAPI = {
    getAppVersion: () => Promise<string>;
    ping: (msg: string) => Promise<string>;
    log: (level: 'info' | 'warn' | 'error', message: string) => void;

    tcpConnect: (host: string, port: number) => Promise<boolean>;
    tcpSend: (payload: string) => Promise<boolean>;
    tcpDisconnect: () => Promise<boolean>;

    serialList: () => Promise<any[]>;
    serialConnect: (path: string, baudRate: number) => Promise<boolean>;
    serialSend: (payload: string) => Promise<boolean>;
    serialDisconnect: () => Promise<boolean>;

    onMachineMessage: (cb: (msg: any) => void) => () => void;

    authLogin: (
        username: string,
        password: string,
    ) => Promise<{
        user: { id: string; username: string; authorities: string[]; mustChangePassword: boolean };
    }>;
    authChangePassword: (userId: string, newPassword: string) => Promise<boolean>;
    authCurrentUser: () => Promise<CurrentUserSnapshot | null>;
    authLogout?: () => Promise<boolean>;

    usersList: () => Promise<UserRow[]>;
    usersCreate: (dto: {
        username: string;
        password: string;
        is_active?: number;
        must_change_password?: number;
        role_ids?: string[];
    }) => Promise<{ id: string }>;
    usersUpdate: (
        id: string,
        dto: {
            username?: string;
            is_active?: number;
            must_change_password?: number;
            role_ids?: string[];
        },
    ) => Promise<boolean>;
    usersResetPassword: (id: string, newPassword: string) => Promise<boolean>;
    usersDelete: (id: string) => Promise<boolean>;

    rolesList: () => Promise<RoleRow[]>;
    rolesAuthoritiesCatalog: () => Promise<AuthorityCode[]>;
    rolesCreate: (dto: {
        name: string;
        description?: string | null;
        authority_codes?: AuthorityCode[];
    }) => Promise<{ id: string }>;
    rolesUpdate: (
        id: string,
        dto: { name?: string; description?: string | null; authority_codes?: AuthorityCode[] },
    ) => Promise<boolean>;
    rolesDelete: (id: string) => Promise<boolean>;

    labsList: () => Promise<Lab[]>;
    labsCreate: (dto: Partial<Lab>) => Promise<{ id: string }>;
    labsUpdate: (id: string, dto: Partial<Lab>) => Promise<boolean>;
    labsDelete: (id: string) => Promise<boolean>;

    machinesList: () => Promise<Machine[]>;
    machinesCreate: (dto: Partial<Machine>) => Promise<{ id: string }>;
    machinesUpdate: (id: string, dto: Partial<Machine>) => Promise<boolean>;
    machinesDelete: (id: string) => Promise<boolean>;
    machinesConnect: (id: string) => Promise<boolean>;
    machinesDisconnect: (id: string) => Promise<boolean>;
    machinesTest: (machine: Partial<Machine>) => Promise<{ ok: boolean; message?: string }>;

    targetsList: () => Promise<Target[]>;
    targetsCreate: (dto: Partial<Target>) => Promise<{ id: string }>;
    targetsUpdate: (id: string, dto: Partial<Target>) => Promise<boolean>;
    targetsDelete: (id: string) => Promise<boolean>;
    targetsTest: (id: string) => Promise<TargetDiagnosticsResult>;
    targetsHarnessSend: (
        targetId: string,
        payload: unknown,
        previewName?: string | null,
    ) => Promise<TargetHarnessResult>;

    logsQuery: (q: LogsQuery) => Promise<LogRow[]>;

    machinesRuntimeStart: (id: string) => Promise<MachineRuntimeState>;
    machinesRuntimeStop: (id: string) => Promise<MachineRuntimeState>;
    machinesRuntimeRestart: (id: string) => Promise<MachineRuntimeState>;
    machinesRuntimeState: (id: string) => Promise<MachineRuntimeState>;
    machinesRuntimeStates: () => Promise<MachineRuntimeState[]>;
    onMachinesRuntimeEvent: (cb: (event: RuntimeEvent) => void) => () => void;
    machinesLogsList: (machineId: string, limit?: number) => Promise<MachineTrafficLog[]>;
    machinesLogsClear: (machineId: string) => Promise<boolean>;
    machinesSimStart: (
        machineId: string,
        scenario?: MachineSimulationScenario,
        intervalMs?: number,
    ) => Promise<MachineSimulationState>;
    machinesSimStop: (machineId: string) => Promise<MachineSimulationState>;
    machinesSimRestart: (
        machineId: string,
        scenario?: MachineSimulationScenario,
        intervalMs?: number,
    ) => Promise<MachineSimulationState>;
    machinesSimState: (machineId: string) => Promise<MachineSimulationState>;
    machinesSimStates: () => Promise<MachineSimulationState[]>;
    machinesParsedList: (machineId: string, limit?: number) => Promise<ParsedMessageRow[]>;
    machinesNormalizedList: (machineId: string, limit?: number) => Promise<NormalizedResultRow[]>;

    approvalPoliciesList: () => Promise<ApprovalPolicy[]>;
    approvalPoliciesCreate: (dto: Partial<ApprovalPolicy>) => Promise<{ id: string }>;
    approvalPoliciesUpdate: (id: string, dto: Partial<ApprovalPolicy>) => Promise<boolean>;
    approvalPoliciesDelete: (id: string) => Promise<boolean>;

    resultsPendingApprovals: (limit?: number) => Promise<ResultWorkflowRow[]>;
    resultApprove: (dto: {
        normalizedResultId: string;
        policyId: string;
        stepOrder: number;
        approverUserId: string;
        comment?: string | null;
    }) => Promise<ResultApprovalActionResult>;
    resultReject: (dto: {
        normalizedResultId: string;
        policyId: string;
        stepOrder: number;
        approverUserId: string;
        comment?: string | null;
    }) => Promise<ResultApprovalActionResult>;
    resultApprovalsList: (normalizedResultId: string) => Promise<ResultApprovalRow[]>;
    resultApprovalsAll: (limit?: number) => Promise<ResultApprovalRow[]>;

    outboundQueueList: (limit?: number) => Promise<OutboundQueueRow[]>;
    outboundQueuePending: (limit?: number) => Promise<OutboundQueueRow[]>;
    deliveryHistoryList: (limit?: number) => Promise<OutboundQueueRow[]>;
    deliveryAuditList: (query?: DeliveryAuditQuery) => Promise<DeliveryAuditRow[]>;
    deliveryAuditQuery: (query?: DeliveryAuditQuery) => Promise<DeliveryAuditRow[]>;

    targetTransformPreview: (
        targetId: string,
        normalizedResultId: string,
    ) => Promise<TargetTransformPreview>;
    outboundQueueRetry: (queueId: string) => Promise<boolean>;
    outboundQueueRequeue: (queueId: string) => Promise<boolean>;
    outboundQueueSendNow: (queueId: string) => Promise<boolean>;
    targetSecretsGet: (targetId: string) => Promise<TargetSecretConfig | null>;
    targetSecretsSave: (
        targetId: string,
        dto: Omit<TargetSecretConfig, 'targetId'>,
    ) => Promise<boolean>;

    mappingsList: () => Promise<MappingRule[]>;
    mappingsCreate: (dto: Partial<MappingRule>) => Promise<{ id: string }>;
    mappingsUpdate: (id: string, dto: Partial<MappingRule>) => Promise<boolean>;
    mappingsDelete: (id: string) => Promise<boolean>;
    mappingsValidate: (targetType: string) => Promise<MappingValidationResult>;
    mappingValueTranslationsList: (mappingRuleId: string) => Promise<MappingValueTranslation[]>;
    mappingValueTranslationsCreate: (
        dto: Partial<MappingValueTranslation>,
    ) => Promise<{ id: string }>;
    mappingValueTranslationsUpdate: (
        id: string,
        dto: Partial<MappingValueTranslation>,
    ) => Promise<boolean>;
    mappingValueTranslationsDelete: (id: string) => Promise<boolean>;
    mappingValueTranslationsSaveConfig: (
        mappingRuleId: string,
        dto: {
            value_mapping_enabled: number;
            unmapped_behavior: MappingUnmappedBehavior;
            default_destination_value?: string | null;
        },
    ) => Promise<boolean>;
    targetTransformPreviewFromQueue: (queueId: string) => Promise<TargetTransformPreview>;
    targetTransformPreviewFromDeliveryHistory: (queueId: string) => Promise<TargetTransformPreview>;

    resultReevaluatePolicy: (normalizedResultId: string) => Promise<boolean>;
    copyToClipboard: (text: string) => Promise<void>;
};

