import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlatformApiService } from '../../core/platform/platform-api.service';
import { DeliveryHistoryDetailDialog } from '../../shared/dialogs/delivery-history-detail-dialog/delivery-history-detail-dialog';

@Component({
  selector: 'app-delivery-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
  ],
  templateUrl: './delivery-history.html',
  styleUrl: './delivery-history.scss',
})
export class DeliveryHistory {
  private readonly api = inject(PlatformApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(false);
  readonly deliveredRows = signal<any[]>([]);
  readonly auditRows = signal<any[]>([]);
  readonly showFilters = signal(false);
  readonly expandedId = signal<string | null>(null);
  readonly previewLoadingId = signal<string | null>(null);
  readonly previewMap = signal<Record<string, any>>({});
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];

  queueId = '';
  targetId = '';
  operation: '' | 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS' = '';
  status: '' | 'STARTED' | 'DELIVERED' | 'FAILED' = '';
  fromDate = '';
  toDate = '';

  readonly cols: string[] = [
    'delivery',
    'status',
    'operation',
    'target',
    'queue',
    'attempt',
    'http',
    'actions',
  ];
  readonly detailCols: string[] = ['expandedDetail'];

  readonly filteredAuditRows = computed(() => {
    const queueId = this.queueId.trim().toLowerCase();
    const targetId = this.targetId.trim().toLowerCase();
    const operation = this.operation;
    const status = this.status;
    const fromTime = this.fromDate ? new Date(`${this.fromDate}T00:00:00`).getTime() : null;
    const toTime = this.toDate ? new Date(`${this.toDate}T23:59:59.999`).getTime() : null;

    return this.auditRows().filter((row: any) => {
      const createdAtTime = row?.created_at ? new Date(row.created_at).getTime() : null;
      const queueMatch = !queueId || String(row?.queue_id ?? '').toLowerCase().includes(queueId);
      const targetMatch = !targetId || [row?.target_id, row?.target_name, row?.target_type]
        .some((value) => String(value ?? '').toLowerCase().includes(targetId));
      const operationMatch = !operation || row?.operation === operation;
      const statusMatch = !status || row?.status === status;
      const fromMatch = fromTime === null || (createdAtTime !== null && createdAtTime >= fromTime);
      const toMatch = toTime === null || (createdAtTime !== null && createdAtTime <= toTime);

      return queueMatch && targetMatch && operationMatch && statusMatch && fromMatch && toMatch;
    });
  });

  readonly pagedAuditRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredAuditRows().slice(start, start + this.pageSize());
  });

  readonly summary = computed(() => {
    const rows = this.filteredAuditRows();
    return {
      total: rows.length,
      delivered: rows.filter((r: any) => r.status === 'DELIVERED').length,
      failed: rows.filter((r: any) => r.status === 'FAILED').length,
      started: rows.filter((r: any) => r.status === 'STARTED').length,
    };
  });

  constructor() {
    void this.refresh();
  }

  async refresh() {
    try {
      this.loading.set(true);

      const [deliveredRows, auditRows] = await Promise.all([
        this.api.deliveryHistoryList(300),
        this.api.deliveryAuditQuery({
          queueId: null,
          targetId: null,
          operation: null,
          status: null,
          fromDate: null,
          toDate: null,
          limit: 500,
        }),
      ]);

      this.deliveredRows.set(deliveredRows ?? []);
      this.auditRows.set(auditRows ?? []);
      this.ensureValidPage();

      const currentExpanded = this.expandedId();
      if (currentExpanded) {
        const stillExists = (auditRows ?? []).some((r: any) => r.id === currentExpanded);
        if (!stillExists) this.expandedId.set(null);
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load delivery history', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    this.pageIndex.set(0);
    this.ensureValidPage();
  }

  clearFilters() {
    this.queueId = '';
    this.targetId = '';
    this.operation = '';
    this.status = '';
    this.fromDate = '';
    this.toDate = '';
    this.pageIndex.set(0);
    this.ensureValidPage();
  }

  toggleFilters() {
    this.showFilters.update((value) => !value);
  }

  async toggleExpanded(row: any) {
    const isClosing = this.expandedId() === row.id;
    this.expandedId.set(isClosing ? null : row.id);

    if (!isClosing && row?.queue_id && !this.previewFor(row.id)) {
      await this.previewFromAudit(row, false);
    }
  }

  async previewFromAudit(row: any, toastOnError = true) {
    const historyId = row?.queue_id;
    if (!historyId) return;

    try {
      this.previewLoadingId.set(row.id);
      const result = await this.api.targetTransformPreviewFromDeliveryHistory(historyId);
      this.previewMap.update((current) => ({ ...current, [row.id]: result }));
    } catch (e: any) {
      if (toastOnError) {
        this.snack.open(e?.message ?? 'Preview failed', 'Close', { duration: 3500 });
      }
    } finally {
      this.previewLoadingId.set(null);
    }
  }

  async openDetail(row: any) {
    if (row?.queue_id && !this.previewFor(row.id)) {
      await this.previewFromAudit(row, false);
    }

    this.dialog.open(DeliveryHistoryDetailDialog, {
      width: 'min(1140px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: {
        row,
        preview: this.previewFor(row.id),
        deliveredRecord: this.deliveredRecordFor(row),
      },
    });
  }

  previewFor(auditId: string) {
    return this.previewMap()[auditId] ?? null;
  }

  deliveredRecordFor(row: any) {
    if (!row?.queue_id) return null;
    return this.deliveredRows().find((r: any) => r.id === row.queue_id) ?? null;
  }

  auditAlerts(row: any) {
    if (!row) return [] as Array<{ kind: 'info' | 'warn' | 'bad'; text: string }>;
    const alerts: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

    if (row.status === 'FAILED' && row.error_message) {
      alerts.push({
        kind: 'bad',
        text: 'This delivery attempt failed. Review the stored error and the full payload detail before retrying similar traffic.',
      });
    }
    if (row.status === 'STARTED') {
      alerts.push({
        kind: 'warn',
        text: 'The delivery attempt was recorded as started but has no final delivery outcome in this row.',
      });
    }
    if (row.status === 'DELIVERED') {
      alerts.push({
        kind: 'info',
        text: 'This record is a confirmed delivery event and can be used as an operational reference.',
      });
    }
    if (!this.deliveredRecordFor(row)) {
      alerts.push({
        kind: 'warn',
        text: 'No delivered queue snapshot was found for this row.',
      });
    }

    return alerts;
  }

  compactSummary(row: any) {
    const preview = this.previewFor(row.id);
    return {
      payloadSource: preview?.payloadSource || '—',
      rules: preview?.summary?.ruleCount ?? '—',
      translated: preview?.summary?.translatedCount ?? '—',
      deliveredSnapshot: this.deliveredRecordFor(row) ? 'Available' : 'Missing',
    };
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
      case 'DELIVERED':
        return 'ok';
      case 'FAILED':
        return 'bad';
      case 'STARTED':
      case 'SENDING':
        return 'warn';
      default:
        return 'idle';
    }
  }

  statusSummaryLabel(row: any) {
    switch (row?.status) {
      case 'DELIVERED':
        return 'Confirmed delivery';
      case 'FAILED':
        return 'Failed attempt';
      case 'STARTED':
        return 'In progress / incomplete';
      default:
        return 'Recorded event';
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  trackById = (_index: number, row: any) => row.id;

  private ensureValidPage() {
    const total = this.filteredAuditRows().length;
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) {
      this.pageIndex.set(maxPage);
    }
  }
}