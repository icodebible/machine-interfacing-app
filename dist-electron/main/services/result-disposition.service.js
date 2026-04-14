"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultDispositionService = void 0;
const approval_policy_service_1 = require("./approval-policy.service");
const result_workflow_service_1 = require("./result-workflow.service");
class ResultDispositionService {
    policies = new approval_policy_service_1.ApprovalPolicyService();
    workflow = new result_workflow_service_1.ResultWorkflowService();
    onNormalizedResultCreated(args) {
        const policy = this.policies.resolveForResult({
            labId: args.labId,
            machineId: args.machineId,
            targetId: args.targetId,
        });
        const approvalRequired = !!policy?.requires_approval;
        const approvalCountRequired = Number(policy?.min_approvals ?? 0);
        this.workflow.createForNormalizedResult({
            normalizedResultId: args.normalizedResultId,
            approvalPolicyId: policy?.id ?? null,
            approvalRequired,
            approvalCountRequired,
            status: approvalRequired ? 'PENDING_APPROVAL' : 'APPROVED',
        });
        return {
            approvalRequired,
            approvalCountRequired,
            approvalPolicyId: policy?.id ?? null,
        };
    }
}
exports.ResultDispositionService = ResultDispositionService;
