
import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PlatformApiService } from '../../core/platform/platform-api.service';
import { ApprovalActionDialog } from '../../shared/dialogs/approval-action-dialog/approval-action-dialog';
import { PendingApprovalDetailDialog } from '../../shared/dialogs/pending-approval-detail-dialog/pending-approval-detail-dialog';

@Component({
  selector: 'app-pending-approvals',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    MatDividerModule,
    MatPaginatorModule,
    MatTooltipModule,
  ],
  templateUrl: './pending-approvals.html',
  styleUrl: './pending-approvals.scss',
})
export class PendingApprovals {
  private api = inject(PlatformApiService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(false);
  rows = signal<any[]>([]);
  policies = signal<any[]>([]);
  expandedRowId = signal<string | null>(null);
  cols: string[] = ['result', 'policy', 'approvals', 'status', 'created', 'actions'];
  detailCols: string[] = ['expandedDetail'];

  pageIndex = signal(0);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];

  readonly summary = computed(() => {
    const rows = this.rows();
    return {
      total: rows.length,
      requiresAction: rows.filter((row: any) => this.canAct(row)).length,
      waitingMore: rows.filter(
        (row: any) =>
          Number(row.approval_count_received ?? 0) < Number(row.approval_count_required ?? 0),
      ).length,
      blocked: rows.filter((row: any) => !this.canAct(row)).length,
    };
  });

  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  constructor() {
    this.refresh();
  }

  private approverUserId() {
    const u: any = this.auth.user?.();
    return u?.id ?? u?.userId ?? u?.username ?? u?.email ?? 'unknown-user';
  }

  currentApproverIdentity() {
    const u: any = this.auth.user?.();
    if (!u) {
      return {
        id: 'unknown-user',
        username: 'Unknown user',
        display: 'Unknown user',
        raw: null,
      };
    }

    const id = u?.id ?? u?.userId ?? u?.username ?? u?.email ?? 'unknown-user';
    const username = u?.username ?? u?.email ?? u?.name ?? id;
    const displayName = [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();

    return {
      id,
      username,
      display: displayName || username,
      raw: u,
    };
  }

  async refresh() {
    try {
      this.loading.set(true);
      const [rows, policies] = await Promise.all([
        this.api.resultsPendingApprovals(200),
        this.api.approvalPoliciesList(),
      ]);
      this.rows.set(rows ?? []);
      this.policies.set(policies ?? []);
      this.ensureValidPage();

      const expandedId = this.expandedRowId();
      if (expandedId && !(rows ?? []).some((r: any) => r.id === expandedId)) {
        this.expandedRowId.set(null);
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load pending approvals', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.expandedRowId.set(null);
  }

  private ensureValidPage() {
    const total = this.rows().length;
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) this.pageIndex.set(maxPage);
  }

  toggleRow(row: any) {
    this.expandedRowId.set(this.expandedRowId() === row.id ? null : row.id);
  }

  isExpanded(row: any) {
    return this.expandedRowId() === row?.id;
  }

  policyName(policyId?: string | null) {
    if (!policyId) return 'Policy not matched yet';
    return this.policies().find((policy: any) => policy.id === policyId)?.name ?? policyId;
  }

  canAct(row: any) {
    return row?.status === 'PENDING_APPROVAL' && !!row?.approval_policy_id;
  }

  canReevaluate(row: any) {
    return ['PENDING_POLICY', 'POLICY_DISABLED'].includes(String(row?.status ?? ''));
  }

  actionBlockedMessage(row: any) {
    return (
      row?.last_error ||
      (row?.status === 'POLICY_DISABLED'
        ? 'Enable the matched approval policy before approving this result.'
        : row?.status === 'PENDING_POLICY'
          ? 'Configure and enable a matching policy with routing targets before approval can continue.'
          : 'This result is not ready for approval yet.')
    );
  }

  async reevaluatePolicy(row: any) {
    if (!this.canReevaluate(row)) {
      this.snack.open(this.actionBlockedMessage(row), 'Close', { duration: 4200 });
      return;
    }

    try {
      await this.api.resultReevaluatePolicy(row.normalized_result_id);
      this.snack.open('Policy re-check completed', 'Close', { duration: 2200 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Policy re-check failed', 'Close', { duration: 4200 });
    }
  }

  async openAction(row: any, action: 'approve' | 'reject') {
    if (!this.canAct(row)) {
      this.snack.open(this.actionBlockedMessage(row), 'Close', { duration: 4200 });
      return;
    }

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
      const dto = {
        normalizedResultId: row.normalized_result_id,
        policyId: row.approval_policy_id,
        stepOrder: 1,
        approverUserId: this.approverUserId(),
        comment: result.comment ?? null,
      };

      if (action === 'approve') {
        await this.api.resultApprove(dto);
        this.snack.open('Result approved', 'Close', { duration: 1800 });
      } else {
        await this.api.resultReject(dto);
        this.snack.open('Result rejected', 'Close', { duration: 1800 });
      }

      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Action failed', 'Close', {
        duration: 3500,
      });
    }
  }

  async openDetailDialog(row: any) {
    const ref = this.dialog.open(PendingApprovalDetailDialog, {
      width: 'min(1080px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: {
        row,
        policyName: this.policyName(row?.approval_policy_id),
        currentApprover: this.currentApproverIdentity(),
      },
    });

    const result = await firstValueFrom(ref.afterClosed());
    if (!result?.action) return;

    if (result.action === 'reevaluate') {
      await this.reevaluatePolicy(row);
      return;
    }

    await this.openAction(row, result.action);
  }

  expansionNotes(row: any) {
    const notes: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

    if (row?.last_error) {
      notes.push({ kind: 'bad', text: row.last_error });
    }

    if (!row?.approval_policy_id) {
      notes.push({
        kind: 'warn',
        text: 'This result does not yet have an approval policy linked to it.',
      });
    }

    if (row?.status === 'PENDING_POLICY') {
      notes.push({
        kind: 'warn',
        text: 'A matching policy must be configured and enabled before this result can proceed.',
      });
    }

    if (row?.status === 'POLICY_DISABLED') {
      notes.push({
        kind: 'warn',
        text: 'The matched policy is disabled. Approval and routing are intentionally paused.',
      });
    }

    if (row?.status === 'PENDING_APPROVAL') {
      notes.push({
        kind: 'info',
        text: 'This result is ready for supervisor review and approval decision.',
      });
    }

    return notes.length
      ? notes
      : [{ kind: 'info' as const, text: 'No active workflow warnings for this result.' }];
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
      case 'PENDING_POLICY':
      case 'POLICY_DISABLED':
        return 'idle';
      default:
        return 'idle';
    }
  }

  rowTrackBy = (_: number, row: any) => row.id;
}
