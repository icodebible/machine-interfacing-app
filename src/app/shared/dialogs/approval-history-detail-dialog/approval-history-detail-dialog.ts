import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlatformApiService } from '../../../core/platform/platform-api.service';

type DialogData = { row: any };

@Component({
  selector: 'app-approval-history-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatDividerModule, MatIconModule],
  templateUrl: './approval-history-detail-dialog.html',
  styleUrl: './approval-history-detail-dialog.scss',
})
export class ApprovalHistoryDetailDialog {
  private readonly ref = inject(MatDialogRef<ApprovalHistoryDetailDialog>);
  private readonly dialogData = inject<DialogData>(MAT_DIALOG_DATA);
  private readonly api = inject(PlatformApiService);
  private readonly snack = inject(MatSnackBar);

  readonly row = computed(() => this.dialogData?.row ?? null);

  close() {
    this.ref.close();
  }

  actorDisplay() {
    const row = this.row();
    return (
      row?.approver_display_name ||
      row?.approver_username ||
      row?.approver_user_id ||
      'System user not resolved'
    );
  }

  actorReference() {
    const row = this.row();
    return row?.approver_user_id || row?.approver_username || 'No approver reference recorded';
  }

  recordedBy() {
    const row = this.row();
    return row?.created_by_username || row?.updated_by_username || 'System';
  }

  routeTargetSummary() {
    const targets = this.row()?.snapshot_route_targets ?? [];
    if (!targets.length) return 'No route target snapshot captured';
    return targets.map((target: any) => target.name || target.id).join(', ');
  }

  routeTargetList() {
    return this.row()?.snapshot_route_targets ?? [];
  }

  resultIdentity() {
    const result = this.row()?.snapshot_result;
    return (
      result?.test_name ||
      result?.test_code ||
      this.row()?.normalized_result_id ||
      'Approval record'
    );
  }

  resultValueSummary() {
    const result = this.row()?.snapshot_result;
    const value = [result?.value, result?.units].filter(Boolean).join(' ');
    return value || 'Value not recorded in snapshot';
  }

  machineLabSummary() {
    const result = this.row()?.snapshot_result;
    const machine = result?.machine_name || result?.machine_id || 'Unknown machine';
    const lab = result?.lab_name || result?.lab_id || 'Unknown lab';
    return `${machine} • ${lab}`;
  }

  policyLabel() {
    const row = this.row();
    return (
      row?.snapshot_policy?.name || row?.policy_name || row?.policy_id || 'Policy not recorded'
    );
  }

  policyScopeSummary() {
    const policy = this.row()?.snapshot_policy;
    if (!policy) return 'Policy scope snapshot not captured';

    const parts = [
      policy?.applies_to_lab_id ? `Lab: ${policy.applies_to_lab_id}` : null,
      policy?.applies_to_machine_id ? `Machine: ${policy.applies_to_machine_id}` : null,
      policy?.applies_to_target_id ? `Primary target: ${policy.applies_to_target_id}` : null,
    ].filter(Boolean);

    return parts.length ? parts.join(' • ') : 'Global scope';
  }

  decisionNotes() {
    const row = this.row();
    const notes: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

    if (row?.action === 'REJECTED') {
      notes.push({
        kind: 'bad',
        text: 'This approval snapshot records a rejection. Review the comment, route targets, and policy state before any follow-up action.',
      });
    }

    if (!String(row?.comment ?? '').trim()) {
      notes.push({
        kind: 'warn',
        text: 'No decision comment was captured on this approval record.',
      });
    }

    if (!(row?.snapshot_route_targets ?? []).length) {
      notes.push({
        kind: 'warn',
        text: 'No route target snapshot was captured, so downstream release intent cannot be reconstructed from this record alone.',
      });
    }

    if (!(row?.approver_roles ?? []).length) {
      notes.push({
        kind: 'info',
        text: 'No approver role snapshot was stored on this action.',
      });
    }

    if (!row?.snapshot_policy) {
      notes.push({
        kind: 'warn',
        text: 'The policy snapshot is missing, so this record relies on current policy metadata rather than frozen approval-time evidence.',
      });
    }

    if (!row?.snapshot_result) {
      notes.push({
        kind: 'bad',
        text: 'The normalized result snapshot is missing. Audit evidence for this action is incomplete.',
      });
    }

    if (!notes.length) {
      notes.push({
        kind: 'info',
        text: 'This approval record includes the key evidence expected for a production audit trail.',
      });
    }

    return notes;
  }

  async copyJson(value?: any, label = 'JSON') {
    try {
      await this.api.copy(this.prettyJson(value));
      this.snack.open(`${label} copied`, 'Close', { duration: 1500 });
    } catch {
      this.snack.open(`Failed to copy ${label.toLowerCase()}`, 'Close', { duration: 2200 });
    }
  }

  prettyJson(value?: any) {
    if (!value) return '—';
    try {
      return JSON.stringify(value, null, 2);
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

  actionClass(action?: string | null) {
    switch (action) {
      case 'APPROVED':
        return 'ok';
      case 'REJECTED':
        return 'bad';
      default:
        return 'idle';
    }
  }
}
