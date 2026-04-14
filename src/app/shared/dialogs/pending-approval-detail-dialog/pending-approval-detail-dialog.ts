import { CommonModule } from '@angular/common';
import { Component, Inject, computed, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
  MatDialog,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { PlatformApiService } from '../../../core/platform/platform-api.service';
import { ApprovalActionDialog } from '../approval-action-dialog/approval-action-dialog';

type DialogData = { row: any };

@Component({
  selector: 'app-pending-approval-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './pending-approval-detail-dialog.html',
  styleUrl: './pending-approval-detail-dialog.scss',
})
export class PendingApprovalDetailDialog {
  private readonly ref = inject(MatDialogRef<PendingApprovalDetailDialog>);
  private readonly dialog = inject(MatDialog);
  private readonly api = inject(PlatformApiService);
  private readonly auth = inject(AuthService);

  readonly row = computed(() => this.data?.row ?? null);
  historyLoading = signal(false);
  history = signal<any[]>([]);
  actionInProgress = signal(false);

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    void this.loadHistory();
  }

  close(changed = false) {
    this.ref.close({ changed });
  }

  private approverUserId() {
    const u: any = this.auth.user?.();
    return u?.id ?? u?.userId ?? u?.username ?? u?.email ?? 'unknown-user';
  }

  currentApprover() {
    const u: any = this.auth.user?.();
    const display = u?.displayName || u?.name || [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
    const username = u?.username || u?.email || u?.id || 'Unknown approver';
    const roles = Array.isArray(u?.roles) ? u.roles.join(', ') : '';
    const identity = display ? `${display} • ${username}` : username;
    return roles ? `${identity} • ${roles}` : identity;
  }

  canAct() {
    return this.row()?.status === 'PENDING_APPROVAL' && !!this.row()?.approval_policy_id;
  }

  canReevaluate() {
    return ['PENDING_POLICY', 'POLICY_DISABLED'].includes(String(this.row()?.status ?? ''));
  }

  actionBlockedMessage() {
    const row = this.row();
    return (
      row?.last_error ||
      (row?.status === 'POLICY_DISABLED'
        ? 'Enable the matched approval policy before approving this result.'
        : row?.status === 'PENDING_POLICY'
          ? 'Configure and enable a matching policy with routing targets before approval can continue.'
          : 'This result is not ready for approval yet.')
    );
  }

  reviewAlert() {
    const row = this.row();
    if (!row) return null;

    if (row?.status === 'POLICY_DISABLED') {
      return {
        tone: 'bad',
        title: 'Policy is disabled',
        message: this.actionBlockedMessage(),
      };
    }

    if (row?.status === 'PENDING_POLICY') {
      return {
        tone: 'warn',
        title: 'Policy configuration required',
        message: this.actionBlockedMessage(),
      };
    }

    if (row?.last_error) {
      return {
        tone: 'warn',
        title: 'Operational warning',
        message: row.last_error,
      };
    }

    return {
      tone: 'info',
      title: 'Ready for review',
      message:
        'Review the normalized result context, policy scope, and routing targets before deciding whether to approve or reject.',
    };
  }

  async reevaluatePolicy() {
    const row = this.row();
    if (!this.canReevaluate()) return;

    try {
      this.actionInProgress.set(true);
      await this.api.resultReevaluatePolicy(row.normalized_result_id);
      this.ref.close({ changed: true, action: 'reevaluate' });
    } finally {
      this.actionInProgress.set(false);
    }
  }

  async openAction(action: 'approve' | 'reject') {
    const row = this.row();
    if (!this.canAct()) return;

    const ref = this.dialog.open(ApprovalActionDialog, {
      width: 'min(640px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { row, action },
    });

    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;

    try {
      this.actionInProgress.set(true);
      const dto = {
        normalizedResultId: row.normalized_result_id,
        policyId: row.approval_policy_id,
        stepOrder: 1,
        approverUserId: this.approverUserId(),
        comment: result.comment ?? null,
      };

      if (action === 'approve') {
        await this.api.resultApprove(dto);
      } else {
        await this.api.resultReject(dto);
      }

      this.close(true);
    } finally {
      this.actionInProgress.set(false);
    }
  }

  async loadHistory() {
    const row = this.row();
    if (!row?.normalized_result_id) return;
    try {
      this.historyLoading.set(true);
      const rows = await this.api.resultApprovalsList(row.normalized_result_id);
      this.history.set(rows ?? []);
    } finally {
      this.historyLoading.set(false);
    }
  }

  routeTargetSummary() {
    const targets = this.routeTargetList();
    if (!targets.length) return 'No route targets configured';
    return targets.map((target: any) => target.name || target.id).join(', ');
  }

  routeTargetList() {
    return this.row()?.route_targets ?? [];
  }

  resultValueSummary() {
    const row = this.row();
    return [row?.value, row?.units].filter(Boolean).join(' ') || 'Value not available';
  }

  patientSummary() {
    const row = this.row();
    return row?.patient_name || row?.patient_id || 'Patient information not available';
  }

  sampleOrderSummary() {
    const row = this.row();
    return row?.sample_id || row?.order_id || 'No sample or order reference';
  }

  prettyJson(value?: any) {
    if (!value) return '—';
    try {
      return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
    } catch {
      return String(value);
    }
  }

  formatDateTime(value?: string | null) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  }

  statusClass(status?: string | null) {
    switch (status) {
      case 'APPROVED':
        return 'ok';
      case 'REJECTED':
        return 'bad';
      case 'PENDING_APPROVAL':
        return 'warn';
      default:
        return 'idle';
    }
  }
}
