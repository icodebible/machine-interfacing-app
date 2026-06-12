import { Injectable } from '@angular/core';
import { AppAPI, ApprovalPolicy } from '../../../../electron/src/preload/api/types';

declare global {
    interface Window {
        appAPI: AppAPI;
        platform: {
            copyToClipboard: (text: string) => Promise<void>;
        };
    }
}

@Injectable({ providedIn: 'root' })
export class PlatformApiService {
    get api() {
        if (!window.appAPI) throw new Error('window.appAPI not available (preload not loaded)');
        return window.appAPI;
    }

    getAppVersion() {
        return this.api.getAppVersion();
    }

    authCurrentUser() {
        return this.api.authCurrentUser();
    }

    // ✅ Clipboard helper
    copy(text: string) {
        // return window.platform.copyToClipboard(text);
        return this.api.copyToClipboard(text);
    }

    // Compatibility alias used by existing dialogs/components.
    copyToClipboard(text: string) {
        return this.copy(text);
    }

    usersList() {
        return this.api.usersList();
    }
    usersCreate(dto: any) {
        return this.api.usersCreate(dto);
    }
    usersUpdate(id: string, dto: any) {
        return this.api.usersUpdate(id, dto);
    }
    usersResetPassword(id: string, newPassword: string) {
        return this.api.usersResetPassword(id, newPassword);
    }
    usersDelete(id: string) {
        return this.api.usersDelete(id);
    }

    rolesList() {
        return this.api.rolesList();
    }
    rolesAuthoritiesCatalog() {
        return this.api.rolesAuthoritiesCatalog();
    }
    rolesCreate(dto: any) {
        return this.api.rolesCreate(dto);
    }
    rolesUpdate(id: string, dto: any) {
        return this.api.rolesUpdate(id, dto);
    }
    rolesDelete(id: string) {
        return this.api.rolesDelete(id);
    }

    // Labs
    labsList() {
        return this.api.labsList();
    }
    labsCreate(dto: any) {
        return this.api.labsCreate(dto);
    }
    labsUpdate(id: string, dto: any) {
        return this.api.labsUpdate(id, dto);
    }
    labsDelete(id: string) {
        return this.api.labsDelete(id);
    }

    // Machines
    machinesList() {
        return this.api.machinesList();
    }
    machinesCreate(dto: any) {
        return this.api.machinesCreate(dto);
    }
    machinesUpdate(id: string, dto: any) {
        return this.api.machinesUpdate(id, dto);
    }
    machinesDelete(id: string) {
        return this.api.machinesDelete(id);
    }
    machinesConnect(id: string) {
        return this.api.machinesConnect(id);
    }
    machinesDisconnect(id: string) {
        return this.api.machinesDisconnect(id);
    }

    machinesTest(machine: any) {
        return this.api.machinesTest(machine);
    }

    // Targets
    targetsList() {
        return this.api.targetsList();
    }
    targetsCreate(dto: any) {
        return this.api.targetsCreate(dto);
    }
    targetsUpdate(id: string, dto: any) {
        return this.api.targetsUpdate(id, dto);
    }
    targetsDelete(id: string) {
        return this.api.targetsDelete(id);
    }
    targetsTest(id: string) {
        return this.api.targetsTest(id);
    }

    // Logs
    logsQuery(q: any) {
        return this.api.logsQuery(q);
    }

    deliveryAuditList(q: any = {}) {
        return this.api.deliveryAuditList(q);
    }

    machinesRuntimeStart(id: string) {
        return this.api.machinesRuntimeStart(id);
    }

    machinesRuntimeStop(id: string) {
        return this.api.machinesRuntimeStop(id);
    }

    machinesRuntimeRestart(id: string) {
        return this.api.machinesRuntimeRestart(id);
    }

    machinesRuntimeState(id: string) {
        return this.api.machinesRuntimeState(id);
    }

    machinesRuntimeStates() {
        return this.api.machinesRuntimeStates();
    }

    onMachinesRuntimeEvent(cb: (event: any) => void) {
        return this.api.onMachinesRuntimeEvent(cb);
    }

    machinesLogsList(machineId: string, limit = 50) {
        return this.api.machinesLogsList(machineId, limit);
    }

    machinesLogsClear(machineId: string) {
        return this.api.machinesLogsClear(machineId);
    }

    machinesLogsReplay(logId: string, mode: 'PARSE_ONLY' | 'PARSE_AND_NORMALIZE' | 'FULL_WORKFLOW' = 'FULL_WORKFLOW') {
        return this.api.machinesLogsReplay(logId, mode);
    }

    machinesRuntimeSessionsList(machineId: string, limit = 25) {
        return this.api.machinesRuntimeSessionsList(machineId, limit);
    }

    machinesSimStart(
        machineId: string,
        scenario: 'HL7_COBAS_HPV_FINAL_RESULT' | 'ASTM_COBAS_HPV_FINAL_RESULT' | 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING' = 'ASTM_BASIC',
        intervalMs = 5000,
    ) {
        return this.api.machinesSimStart(machineId, scenario, intervalMs);
    }

    machinesSimStop(machineId: string) {
        return this.api.machinesSimStop(machineId);
    }

    machinesSimRestart(
        machineId: string,
        scenario: 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING' = 'ASTM_BASIC',
        intervalMs = 5000,
    ) {
        return this.api.machinesSimRestart(machineId, scenario, intervalMs);
    }

    machinesSimState(machineId: string) {
        return this.api.machinesSimState(machineId);
    }

    machinesSimStates() {
        return this.api.machinesSimStates();
    }

    machinesParsedList(machineId: string, limit = 50) {
        return this.api.machinesParsedList(machineId, limit);
    }

    machinesNormalizedList(machineId: string, limit = 50) {
        return this.api.machinesNormalizedList(machineId, limit);
    }

    machinesSimUseCasesList(machineId?: string | null) {
        return this.api.machinesSimUseCasesList(machineId ?? null);
    }

    machinesSimUseCaseSave(dto: any) {
        return this.api.machinesSimUseCaseSave(dto);
    }

    machinesSimUseCaseDelete(id: string) {
        return this.api.machinesSimUseCaseDelete(id);
    }

    machinesSimUseCaseRun(machineId: string, useCaseId: string, variables: Record<string, any> = {}) {
        return this.api.machinesSimUseCaseRun(machineId, useCaseId, variables);
    }

    machinesSimRunHistory(machineId: string, limit = 25) {
        return this.api.machinesSimRunHistory(machineId, limit);
    }

    approvalPoliciesList() {
        return this.api.approvalPoliciesList();
    }

    approvalPoliciesCreate(dto: Partial<ApprovalPolicy>) {
        return this.api.approvalPoliciesCreate(dto);
    }

    approvalPoliciesUpdate(id: string, dto: Partial<ApprovalPolicy>) {
        return this.api.approvalPoliciesUpdate(id, dto);
    }

    approvalPoliciesDelete(id: string) {
        return this.api.approvalPoliciesDelete(id);
    }

    resultsPendingApprovals(limit = 100) {
        return this.api.resultsPendingApprovals(limit);
    }

    resultApprove(dto: {
        normalizedResultId: string;
        policyId: string;
        stepOrder: number;
        approverUserId: string;
        comment?: string | null;
    }) {
        return this.api.resultApprove(dto);
    }

    resultReject(dto: {
        normalizedResultId: string;
        policyId: string;
        stepOrder: number;
        approverUserId: string;
        comment?: string | null;
    }) {
        return this.api.resultReject(dto);
    }

    resultApprovalsList(normalizedResultId: string) {
        return this.api.resultApprovalsList(normalizedResultId);
    }

    resultApprovalsAll(limit = 100) {
        return this.api.resultApprovalsAll(limit);
    }

    outboundQueueList(limit = 100) {
        return this.api.outboundQueueList(limit);
    }

    outboundQueuePending(limit = 100) {
        return this.api.outboundQueuePending(limit);
    }

    deliveryHistoryList(limit = 100) {
        return this.api.deliveryHistoryList(limit);
    }

    deliveryAuditQuery(q: any) {
        return this.api.deliveryAuditQuery(q);
    }

    auditEventsQuery(q: any = {}) {
        return this.api.auditEventsQuery(q);
    }

    auditEventsSummary(days = 7) {
        return this.api.auditEventsSummary(days);
    }

    deploymentReadinessCheck() {
        return this.api.deploymentReadinessCheck();
    }

    appDiagnosticsGet() {
        return this.api.appDiagnosticsGet();
    }

    databaseBackupCreate() {
        return this.api.databaseBackupCreate();
    }

    targetTransformPreview(targetId: string, normalizedResultId: string) {
        return this.api.targetTransformPreview(targetId, normalizedResultId);
    }

    outboundQueueRetry(queueId: string) {
        return this.api.outboundQueueRetry(queueId);
    }

    outboundQueueRequeue(queueId: string) {
        return this.api.outboundQueueRequeue(queueId);
    }

    outboundQueueSendNow(queueId: string) {
        return this.api.outboundQueueSendNow(queueId);
    }

    outboundQueueRebuildPayload(queueId: string) {
        return this.api.outboundQueueRebuildPayload(queueId);
    }

    targetSecretsGet(targetId: string) {
        return this.api.targetSecretsGet(targetId);
    }

    targetSecretsSave(
        targetId: string,
        dto: {
            authType: 'none' | 'bearer' | 'basic' | 'api_key';
            username?: string | null;
            password?: string | null;
            token?: string | null;
            apiKeyName?: string | null;
            apiKeyValue?: string | null;
            allowInsecureTls: boolean;
        },
    ) {
        return this.api.targetSecretsSave(targetId, dto);
    }

    mappingsList() {
        return this.api.mappingsList();
    }

    mappingsCreate(dto: any) {
        return this.api.mappingsCreate(dto);
    }

    mappingsUpdate(id: string, dto: any) {
        return this.api.mappingsUpdate(id, dto);
    }

    mappingsDelete(id: string) {
        return this.api.mappingsDelete(id);
    }

    mappingsValidate(targetType: string) {
        return this.api.mappingsValidate(targetType);
    }

    mappingsOpenMrsLisDiscover(dto: {
        targetId: string;
        sampleId?: string | null;
        sampleUuid?: string | null;
        includeConceptDetails?: boolean;
        userQuery?: string | null;
    }) {
        return this.api.mappingsOpenMrsLisDiscover(dto);
    }

    mappingsOpenMrsLisSeed(dto: any) {
        return this.api.mappingsOpenMrsLisSeed(dto);
    }

    lisTestOrderProfilesList(targetId?: string | null) {
        return this.api.lisTestOrderProfilesList(targetId ?? null);
    }

    lisTestOrderProfileGet(id: string) {
        return this.api.lisTestOrderProfileGet(id);
    }

    lisTestOrderProfileSave(payload: any) {
        return this.api.lisTestOrderProfileSave(payload);
    }

    lisTestOrderProfileSetEnabled(id: string, enabled: number) {
        return this.api.lisTestOrderProfileSetEnabled(id, enabled);
    }

    lisTestOrderProfileDelete(id: string) {
        return this.api.lisTestOrderProfileDelete(id);
    }

    mappingValueTranslationsList(mappingRuleId: string) {
        return this.api.mappingValueTranslationsList(mappingRuleId);
    }

    mappingValueTranslationsCreate(dto: any) {
        return this.api.mappingValueTranslationsCreate(dto);
    }

    mappingValueTranslationsUpdate(id: string, dto: any) {
        return this.api.mappingValueTranslationsUpdate(id, dto);
    }

    mappingValueTranslationsDelete(id: string) {
        return this.api.mappingValueTranslationsDelete(id);
    }

    mappingValueTranslationsSaveConfig(mappingRuleId: string, dto: any) {
        return this.api.mappingValueTranslationsSaveConfig(mappingRuleId, dto);
    }

    targetTransformPreviewFromQueue(queueId: string) {
        return this.api.targetTransformPreviewFromQueue(queueId);
    }

    targetTransformPreviewFromDeliveryHistory(queueId: string) {
        return this.api.targetTransformPreviewFromDeliveryHistory(queueId);
    }


    routingRulesList() {
        return this.api.routingRulesList();
    }

    routingRulesCreate(payload: any) {
        return this.api.routingRulesCreate(payload);
    }

    routingRulesUpdate(id: string, patch: any) {
        return this.api.routingRulesUpdate(id, patch);
    }

    routingRulesDelete(id: string) {
        return this.api.routingRulesDelete(id);
    }

    routingRulesPreviewResult(normalizedResultId: string, fallbackTargetIds: string[] = []) {
        return this.api.routingRulesPreviewResult(normalizedResultId, fallbackTargetIds);
    }

    // platform-api.service.ts
    targetsHarnessSend(targetId: string, payload: unknown, previewName?: string | null) {
        return this.api.targetsHarnessSend(targetId, payload, previewName);
    }

    resultReevaluatePolicy(normalizedResultId: string) {
        return this.api.resultReevaluatePolicy(normalizedResultId);
    }
}