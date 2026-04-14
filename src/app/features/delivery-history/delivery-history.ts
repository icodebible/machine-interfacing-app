import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { PlatformApiService } from '../../core/platform/platform-api.service';

@Component({
  selector: 'app-delivery-history',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './delivery-history.html',
  styleUrl: './delivery-history.scss',
})
export class DeliveryHistory {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  deliveredRows = signal<any[]>([]);
  auditRows = signal<any[]>([]);
  selectedAudit = signal<any | null>(null);
  previewLoading = signal(false);
  queuePreview = signal<any | null>(null);
  queueId = '';
  targetId = '';
  operation: '' | 'SEND_NOW' | 'RETRY_WORKER' | 'HARNESS' = '';
  status: '' | 'STARTED' | 'DELIVERED' | 'FAILED' = '';
  fromDate = '';
  toDate = '';
  cols: string[] = [
    'created',
    'status',
    'operation',
    'target',
    'queue',
    'attempt',
    'http',
    'actions',
  ];

  summary = computed(() => {
    const rows = this.auditRows();
    return {
      total: rows.length,
      delivered: rows.filter((r: any) => r.status === 'DELIVERED').length,
      failed: rows.filter((r: any) => r.status === 'FAILED').length,
      started: rows.filter((r: any) => r.status === 'STARTED').length,
    };
  });

  constructor() {
    this.refresh();
  }

  async refresh() {
    try {
      this.loading.set(true);

      const [deliveredRows, auditRows] = await Promise.all([
        this.api.deliveryHistoryList(100),
        this.api.deliveryAuditQuery({
          queueId: this.queueId || null,
          targetId: this.targetId || null,
          operation: this.operation || null,
          status: this.status || null,
          fromDate: this.fromDate ? new Date(this.fromDate).toISOString() : null,
          toDate: this.toDate ? new Date(`${this.toDate}T23:59:59`).toISOString() : null,
          limit: 200,
        }),
      ]);

      this.deliveredRows.set(deliveredRows ?? []);
      this.auditRows.set(auditRows ?? []);

      const current = this.selectedAudit();
      if (current) {
        const still = (auditRows ?? []).find((r: any) => r.id === current.id) ?? null;
        this.selectedAudit.set(still);
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load delivery history', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  async applyFilters() {
    await this.refresh();
  }

  clearFilters() {
    this.queueId = '';
    this.targetId = '';
    this.operation = '';
    this.status = '';
    this.fromDate = '';
    this.toDate = '';
    this.refresh();
  }

  selectAuditRow(row: any) {
    this.selectedAudit.set(row);
    this.queuePreview.set(null);
  }

  async previewFromAudit(row: any) {
    const historyId = row?.queue_id;
    if (!historyId) return;

    try {
      this.previewLoading.set(true);
      const result = await this.api.targetTransformPreviewFromDeliveryHistory(historyId);
      this.queuePreview.set(result);
      this.selectedAudit.set(row);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Preview failed', 'Close', { duration: 3500 });
    } finally {
      this.previewLoading.set(false);
    }
  }

  deliveredRecordForSelected() {
    const selected = this.selectedAudit();
    if (!selected?.queue_id) return null;
    return this.deliveredRows().find((r: any) => r.id === selected.queue_id) ?? null;
  }

  auditAlerts(row: any) {
    if (!row) return [] as Array<{ kind: 'info' | 'warn' | 'bad'; text: string }>;
    const alerts: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

    if (row.status === 'FAILED' && row.error_message) {
      alerts.push({
        kind: 'bad',
        text: 'This delivery attempt failed. Review the stored error and the delivered payload snapshot before retrying similar traffic.',
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
        text: 'This record is a confirmed delivery event and can be used as an operational reference for what left the platform.',
      });
    }
    if (!this.deliveredRecordForSelected()) {
      alerts.push({
        kind: 'warn',
        text: 'No delivered queue record was found for the selected audit row. The event log is still available, but the stored payload snapshot may be missing.',
      });
    }

    return alerts;
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

  prettyJson(value?: any) {
    if (!value) return '—';
    try {
      return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
    } catch {
      return String(value);
    }
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
}
