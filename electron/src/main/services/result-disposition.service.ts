import { ApprovalPolicyService } from './approval-policy.service';
import { ResultWorkflowService } from './result-workflow.service';

export class ResultDispositionService {
    private policies = new ApprovalPolicyService();
    private workflow = new ResultWorkflowService();

    onNormalizedResultCreated(args: {
        normalizedResultId: string;
        labId?: string | null;
        machineId?: string | null;
        targetId?: string | null;
    }) {
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
