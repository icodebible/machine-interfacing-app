import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlatformApiService } from '../../core/platform/platform-api.service';
import { OutboundQueueDetailDialog } from '../../shared/dialogs/outbound-queue-detail-dialog/outbound-queue-detail-dialog';

@Component({
  selector: 'app-outbound-queue',
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
  templateUrl: './outbound-queue.html',
  styleUrl: './outbound-queue.scss',
})
export class OutboundQueue {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(false);
  mode = signal<'all' | 'pending'>('all');
  rows = signal<any[]>([]);
  expandedRowId = signal<string | null>(null);
  cols: string[] = ['target', 'status', 'retry', 'schedule', 'created', 'actions'];
  detailCols: string[] = ['expandedDetail'];

  pageIndex = signal(0);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];

  summary = computed(() => {
    const rows = this.rows();
    return {
      total: rows.length,
      pending: rows.filter((row: any) => row.delivery_status === 'PENDING').length,
      sending: rows.filter((row: any) => row.delivery_status === 'SENDING').length,
      failed: rows.filter((row: any) => row.delivery_status === 'FAILED').length,
      delivered: rows.filter((row: any) => row.delivery_status === 'DELIVERED').length,
    };
  });

  pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  constructor() {
    this.refresh();
  }

  async refresh() {
    try {
      this.loading.set(true);

      const rows =
        this.mode() === 'pending'
          ? await this.api.outboundQueuePending(100)
          : await this.api.outboundQueueList(100);

      this.rows.set(rows ?? []);
      this.ensureValidPage();

      const expandedId = this.expandedRowId();
      if (expandedId && !(rows ?? []).some((row: any) => row.id === expandedId)) {
        this.expandedRowId.set(null);
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load outbound queue', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  selectMode(mode: 'all' | 'pending') {
    this.mode.set(mode);
    this.pageIndex.set(0);
    this.expandedRowId.set(null);
    this.refresh();
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

  openDetailDialog(row: any) {
    this.dialog.open(OutboundQueueDetailDialog, {
      width: 'min(1100px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { row },
    });
  }

  async retry(row: any) {
    try {
      await this.api.outboundQueueRetry(row.id);
      this.snack.open('Queue item marked for retry', 'Close', { duration: 1800 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Retry failed', 'Close', { duration: 3500 });
    }
  }

  async requeue(row: any) {
    try {
      await this.api.outboundQueueRequeue(row.id);
      this.snack.open('Queue item requeued', 'Close', { duration: 1800 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Requeue failed', 'Close', { duration: 3500 });
    }
  }

  async sendNow(row: any) {
    try {
      await this.api.outboundQueueSendNow(row.id);
      this.snack.open('Delivery started', 'Close', { duration: 1800 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Delivery failed', 'Close', { duration: 3500 });
    }
  }

  targetDisplay(row: any) {
    return row?.target_name || row?.target_id || 'Unknown target';
  }

  canRetry(row: any) {
    return row?.delivery_status === 'FAILED';
  }

  canRequeue(row: any) {
    return row?.delivery_status === 'FAILED' || row?.delivery_status === 'DELIVERED';
  }

  canSendNow(row: any) {
    return row?.delivery_status !== 'SENDING';
  }

  summaryNotes(row: any) {
    const notes: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

    if (row?.delivery_status === 'FAILED' && row?.last_error) {
      notes.push({
        kind: 'bad',
        text: row.last_error,
      });
    }

    if (row?.delivery_status === 'SENDING') {
      notes.push({
        kind: 'warn',
        text: 'Delivery is currently in progress.',
      });
    }

    if (row?.next_retry_at) {
      notes.push({
        kind: 'info',
        text: `Retry scheduled for ${this.formatDateTime(row.next_retry_at)}.`,
      });
    }

    if ((row?.retry_count ?? 0) >= 3) {
      notes.push({
        kind: 'warn',
        text: 'This item has already retried multiple times.',
      });
    }

    if (!notes.length) {
      notes.push({
        kind: 'info',
        text: 'No active operational warnings for this queue item.',
      });
    }

    return notes;
  }

  statusText(row: any) {
    switch (row?.delivery_status) {
      case 'FAILED':
        return 'Needs intervention';
      case 'SENDING':
        return 'Delivery in progress';
      case 'DELIVERED':
        return 'Delivered successfully';
      default:
        return 'Ready for delivery';
    }
  }

  payloadHint(row: any) {
    const raw = row?.payload_json;
    if (!raw) return 'No stored payload available';
    try {
      const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
      return `${str.length.toLocaleString()} chars stored`;
    } catch {
      return 'Stored payload available';
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
      case 'DELIVERED':
        return 'ok';
      case 'FAILED':
        return 'bad';
      case 'SENDING':
        return 'warn';
      default:
        return 'idle';
    }
  }

  rowTrackBy = (_: number, row: any) => row.id;
}
