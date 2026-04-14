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
import { PlatformApiService } from '../../core/platform/platform-api.service';
import { ApprovalHistoryDetailDialog } from '../../shared/dialogs/approval-history-detail-dialog/approval-history-detail-dialog';

@Component({
  selector: 'app-approval-history',
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
  templateUrl: './approval-history.html',
  styleUrl: './approval-history.scss',
})
export class ApprovalHistory {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(false);
  rows = signal<any[]>([]);
  expandedRowId = signal<string | null>(null);
  selected = signal<any | null>(null);

  cols: string[] = ['result', 'action', 'actor', 'step', 'acted', 'actions'];
  detailCols: string[] = ['expandedDetail'];

  pageIndex = signal(0);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];

  readonly summary = computed(() => {
    const rows = this.rows();
    return {
      total: rows.length,
      approved: rows.filter((row: any) => row.action === 'APPROVED').length,
      rejected: rows.filter((row: any) => row.action === 'REJECTED').length,
      withComment: rows.filter((row: any) => !!String(row.comment ?? '').trim()).length,
    };
  });

  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  constructor() {
    this.refresh();
  }

  async refresh() {
    try {
      this.loading.set(true);
      const rows = await this.api.resultApprovalsAll(100);
      this.rows.set(rows ?? []);
      this.ensureValidPage();

      const expandedId = this.expandedRowId();
      if (expandedId && !(rows ?? []).some((row: any) => row.id === expandedId)) {
        this.expandedRowId.set(null);
      }

      const current = this.selected();
      if (current) {
        const still = (rows ?? []).find((r: any) => r.id === current.id) ?? null;
        this.selected.set(still);
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load approval history', 'Close', {
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
    this.selected.set(row);
    this.expandedRowId.set(this.expandedRowId() === row.id ? null : row.id);
  }

  isExpanded(row: any) {
    return this.expandedRowId() === row?.id;
  }

  openDetailDialog(row: any) {
    this.dialog.open(ApprovalHistoryDetailDialog, {
      width: 'min(980px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { row },
    });
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

  resultLabel(row: any) {
    return row?.normalized_result_id || 'Unknown result';
  }

  policyLabel(row: any) {
    return row?.policy_name || row?.policy_id || 'Policy not recorded';
  }

  actorDisplay(row: any) {
    return row?.approver_display_name || row?.approver_username || row?.approver_user_id || 'System user not resolved';
  }

  actorMeta(row: any) {
    const parts = [
      row?.approver_user_id ? `Approver ref: ${row.approver_user_id}` : null,
      row?.created_by_user_id ? `Recorded by ID: ${row.created_by_user_id}` : null,
      row?.updated_by_user_id ? `Updated by ID: ${row.updated_by_user_id}` : null,
    ].filter(Boolean);

    return parts.join(' • ');
  }

  rowNotes(row: any) {
    const notes: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

    if (row?.comment) {
      notes.push({
        kind: 'info',
        text: 'A decision comment was recorded for this approval action.',
      });
    }

    if (row?.action === 'REJECTED') {
      notes.push({
        kind: 'bad',
        text: 'This result was rejected. Review the comment and policy context carefully before any follow-up action.',
      });
    }

    if (!row?.approver_display_name && row?.approver_user_id) {
      notes.push({
        kind: 'warn',
        text: 'Approver reference is available, but a full display name was not resolved on this record.',
      });
    }

    if (!notes.length) {
      notes.push({
        kind: 'info',
        text: 'This approval record has no operational warnings.',
      });
    }

    return notes;
  }

  rowTrackBy = (_: number, row: any) => row.id;
}
