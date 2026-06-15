// import { CommonModule } from '@angular/common';
// import { Component, computed, inject, signal } from '@angular/core';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatTableModule } from '@angular/material/table';
// import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { PlatformApiService } from '../../core/platform/platform-api.service';
// import { OutboundQueueDetailDialog } from '../../shared/dialogs/outbound-queue-detail-dialog/outbound-queue-detail-dialog';
// import { OutboundPayloadPreviewDialog } from '../../shared/dialogs/outbound-payload-preview-dialog/outbound-payload-preview-dialog';

// @Component({
//   selector: 'app-outbound-queue',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatButtonModule,
//     MatDialogModule,
//     MatIconModule,
//     MatProgressBarModule,
//     MatSnackBarModule,
//     MatTableModule,
//     MatDividerModule,
//     MatPaginatorModule,
//     MatTooltipModule,
//   ],
//   templateUrl: './outbound-queue.html',
//   styleUrl: './outbound-queue.scss',
// })
// export class OutboundQueue {
//   private api = inject(PlatformApiService);
//   private snack = inject(MatSnackBar);
//   private dialog = inject(MatDialog);

//   loading = signal(false);
//   mode = signal<'all' | 'pending'>('all');
//   rows = signal<any[]>([]);
//   expandedRowId = signal<string | null>(null);
//   cols: string[] = ['target', 'status', 'retry', 'schedule', 'created', 'actions'];
//   detailCols: string[] = ['expandedDetail'];

//   pageIndex = signal(0);
//   pageSize = signal(10);
//   readonly pageSizeOptions = [10, 25, 50];

//   summary = computed(() => {
//     const rows = this.rows();
//     return {
//       total: rows.length,
//       pending: rows.filter((row: any) => row.delivery_status === 'PENDING').length,
//       sending: rows.filter((row: any) => row.delivery_status === 'SENDING').length,
//       failed: rows.filter((row: any) => row.delivery_status === 'FAILED').length,
//       delivered: rows.filter((row: any) => row.delivery_status === 'DELIVERED').length,
//     };
//   });

//   pagedRows = computed(() => {
//     const start = this.pageIndex() * this.pageSize();
//     return this.rows().slice(start, start + this.pageSize());
//   });

//   constructor() {
//     this.refresh();
//   }

//   async refresh() {
//     try {
//       this.loading.set(true);

//       const rows =
//         this.mode() === 'pending'
//           ? await this.api.outboundQueuePending(100)
//           : await this.api.outboundQueueList(100);

//       this.rows.set(rows ?? []);
//       this.ensureValidPage();

//       const expandedId = this.expandedRowId();
//       if (expandedId && !(rows ?? []).some((row: any) => row.id === expandedId)) {
//         this.expandedRowId.set(null);
//       }
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to load outbound queue', 'Close', {
//         duration: 3500,
//       });
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   selectMode(mode: 'all' | 'pending') {
//     this.mode.set(mode);
//     this.pageIndex.set(0);
//     this.expandedRowId.set(null);
//     this.refresh();
//   }

//   onPageChange(event: PageEvent) {
//     this.pageIndex.set(event.pageIndex);
//     this.pageSize.set(event.pageSize);
//     this.expandedRowId.set(null);
//   }

//   private ensureValidPage() {
//     const total = this.rows().length;
//     const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
//     if (this.pageIndex() > maxPage) this.pageIndex.set(maxPage);
//   }

//   toggleRow(row: any) {
//     this.expandedRowId.set(this.expandedRowId() === row.id ? null : row.id);
//   }

//   isExpanded(row: any) {
//     return this.expandedRowId() === row?.id;
//   }

//   openDetailDialog(row: any) {
//     this.dialog.open(OutboundQueueDetailDialog, {
//       width: 'min(1100px, 96vw)',
//       maxWidth: '96vw',
//       autoFocus: false,
//       restoreFocus: true,
//       data: { row },
//     });
//   }

//   openPayloadPreviewDialog(row: any) {
//     const ref = this.dialog.open(OutboundPayloadPreviewDialog, {
//       width: 'min(1180px, 96vw)',
//       maxWidth: '96vw',
//       maxHeight: '92vh',
//       autoFocus: false,
//       restoreFocus: true,
//       panelClass: 'outbound-payload-preview-panel',
//       data: { row },
//     });

//     ref.afterClosed().subscribe((result?: { refresh?: boolean }) => {
//       if (result?.refresh) void this.refresh();
//     });
//   }

//   async retry(row: any) {
//     try {
//       await this.api.outboundQueueRetry(row.id);
//       this.snack.open('Queue item marked for retry', 'Close', { duration: 1800 });
//       await this.refresh();
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Retry failed', 'Close', { duration: 3500 });
//     }
//   }

//   async requeue(row: any) {
//     try {
//       await this.api.outboundQueueRequeue(row.id);
//       this.snack.open('Queue item requeued', 'Close', { duration: 1800 });
//       await this.refresh();
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Requeue failed', 'Close', { duration: 3500 });
//     }
//   }

//   async sendNow(row: any) {
//     try {
//       await this.api.outboundQueueSendNow(row.id);
//       this.snack.open('Delivery started', 'Close', { duration: 1800 });
//       await this.refresh();
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Delivery failed', 'Close', { duration: 3500 });
//     }
//   }

//   targetDisplay(row: any) {
//     return row?.target_name || row?.target_id || 'Unknown target';
//   }

//   canRetry(row: any) {
//     return row?.delivery_status === 'FAILED';
//   }

//   canRequeue(row: any) {
//     return row?.delivery_status === 'FAILED' || row?.delivery_status === 'DELIVERED';
//   }

//   canSendNow(row: any) {
//     return row?.delivery_status !== 'SENDING';
//   }

//   summaryNotes(row: any) {
//     const notes: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

//     if (row?.delivery_status === 'FAILED' && row?.last_error) {
//       notes.push({
//         kind: 'bad',
//         text: row.last_error,
//       });
//     }

//     if (row?.delivery_status === 'SENDING') {
//       notes.push({
//         kind: 'warn',
//         text: 'Delivery is currently in progress.',
//       });
//     }

//     if (row?.next_retry_at) {
//       notes.push({
//         kind: 'info',
//         text: `Retry scheduled for ${this.formatDateTime(row.next_retry_at)}.`,
//       });
//     }

//     if ((row?.retry_count ?? 0) >= 3) {
//       notes.push({
//         kind: 'warn',
//         text: 'This item has already retried multiple times.',
//       });
//     }

//     if (!notes.length) {
//       notes.push({
//         kind: 'info',
//         text: 'No active operational warnings for this queue item.',
//       });
//     }

//     return notes;
//   }

//   statusText(row: any) {
//     switch (row?.delivery_status) {
//       case 'FAILED':
//         return 'Needs intervention';
//       case 'SENDING':
//         return 'Delivery in progress';
//       case 'DELIVERED':
//         return 'Delivered successfully';
//       default:
//         return 'Ready for delivery';
//     }
//   }

//   payloadHint(row: any) {
//     const raw = row?.payload_json;
//     if (!raw) return 'No stored payload available';
//     try {
//       const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
//       return `${str.length.toLocaleString()} chars stored`;
//     } catch {
//       return 'Stored payload available';
//     }
//   }

//   formatDateTime(value?: string | null) {
//     if (!value) return '—';
//     const d = new Date(value);
//     if (Number.isNaN(d.getTime())) return value;

//     return new Intl.DateTimeFormat(undefined, {
//       year: 'numeric',
//       month: 'short',
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//     }).format(d);
//   }

//   statusClass(status?: string | null) {
//     switch (status) {
//       case 'DELIVERED':
//         return 'ok';
//       case 'FAILED':
//         return 'bad';
//       case 'SENDING':
//         return 'warn';
//       default:
//         return 'idle';
//     }
//   }

//   rowTrackBy = (_: number, row: any) => row.id;
// }



// import { CommonModule } from '@angular/common';
// import { Component, computed, inject, signal } from '@angular/core';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatTableModule } from '@angular/material/table';
// import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { PlatformApiService } from '../../core/platform/platform-api.service';
// import { OutboundQueueDetailDialog } from '../../shared/dialogs/outbound-queue-detail-dialog/outbound-queue-detail-dialog';
// import { OutboundPayloadPreviewDialog } from '../../shared/dialogs/outbound-payload-preview-dialog/outbound-payload-preview-dialog';
// import { OutboundQueueRow } from '../../../../electron/src/preload/api/types';

// @Component({
//   selector: 'app-outbound-queue',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatButtonModule,
//     MatDialogModule,
//     MatIconModule,
//     MatProgressBarModule,
//     MatSnackBarModule,
//     MatTableModule,
//     MatDividerModule,
//     MatPaginatorModule,
//     MatTooltipModule,
//   ],
//   templateUrl: './outbound-queue.html',
//   styleUrl: './outbound-queue.scss',
// })
// export class OutboundQueue {
//   private api = inject(PlatformApiService);
//   private snack = inject(MatSnackBar);
//   private dialog = inject(MatDialog);

//   loading = signal(false);
//   mode = signal<'all' | 'pending'>('all');
//   rows = signal<any[]>([]);
//   expandedRowId = signal<string | null>(null);
//   cols: string[] = ['target', 'status', 'retry', 'schedule', 'created', 'actions'];
//   detailCols: string[] = ['expandedDetail'];

//   pageIndex = signal(0);
//   pageSize = signal(10);
//   readonly pageSizeOptions = [10, 25, 50];

//   summary = computed(() => {
//     const rows = this.rows();
//     return {
//       total: rows.length,
//       pending: rows.filter((row: any) => row.delivery_status === 'PENDING').length,
//       sending: rows.filter((row: any) => row.delivery_status === 'SENDING').length,
//       failed: rows.filter((row: any) => row.delivery_status === 'FAILED').length,
//       blocked: rows.filter((row: any) => row.delivery_status === 'BLOCKED').length,
//       delivered: rows.filter((row: any) => row.delivery_status === 'DELIVERED').length,
//     };
//   });

//   pagedRows = computed(() => {
//     const start = this.pageIndex() * this.pageSize();
//     return this.rows().slice(start, start + this.pageSize());
//   });

//   constructor() {
//     this.refresh();
//   }

//   async refresh() {
//     try {
//       this.loading.set(true);

//       const rows =
//         this.mode() === 'pending'
//           ? await this.api.outboundQueuePending(100)
//           : await this.api.outboundQueueList(100);

//       this.rows.set(rows ?? []);
//       this.ensureValidPage();

//       const expandedId = this.expandedRowId();
//       if (expandedId && !(rows ?? []).some((row: any) => row.id === expandedId)) {
//         this.expandedRowId.set(null);
//       }
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to load outbound queue', 'Close', {
//         duration: 3500,
//       });
//     } finally {
//       this.loading.set(false);
//     }
//   }

//   selectMode(mode: 'all' | 'pending') {
//     this.mode.set(mode);
//     this.pageIndex.set(0);
//     this.expandedRowId.set(null);
//     this.refresh();
//   }

//   onPageChange(event: PageEvent) {
//     this.pageIndex.set(event.pageIndex);
//     this.pageSize.set(event.pageSize);
//     this.expandedRowId.set(null);
//   }

//   private ensureValidPage() {
//     const total = this.rows().length;
//     const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
//     if (this.pageIndex() > maxPage) this.pageIndex.set(maxPage);
//   }

//   toggleRow(row: any) {
//     this.expandedRowId.set(this.expandedRowId() === row.id ? null : row.id);
//   }

//   isExpanded(row: any) {
//     return this.expandedRowId() === row?.id;
//   }

//   openDetailDialog(row: any) {
//     this.dialog.open(OutboundQueueDetailDialog, {
//       width: 'min(1100px, 96vw)',
//       maxWidth: '96vw',
//       autoFocus: false,
//       restoreFocus: true,
//       data: { row },
//     });
//   }

//   openPayloadPreviewDialog(row: any) {
//     const ref = this.dialog.open(OutboundPayloadPreviewDialog, {
//       width: 'min(1180px, 96vw)',
//       maxWidth: '96vw',
//       maxHeight: '92vh',
//       autoFocus: false,
//       restoreFocus: true,
//       panelClass: 'outbound-payload-preview-panel',
//       data: { row },
//     });

//     ref.afterClosed().subscribe((result?: { refresh?: boolean }) => {
//       if (result?.refresh) void this.refresh();
//     });
//   }

//   async rebuildPayload(row: any) {
//     if (!this.confirmQueueAction(
//       'Rebuild payload',
//       row,
//       'This will regenerate the payload from the latest mappings and validation rules before delivery.',
//       'REBUILD',
//     )) return;
//     try {
//       await this.api.outboundQueueRebuildPayload(row.id);
//       this.snack.open('Payload rebuilt from latest mappings and delivery validation', 'Close', { duration: 2200 });
//       await this.refresh();
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Payload rebuild failed', 'Close', { duration: 4500 });
//       await this.refresh();
//     }
//   }

//   async retry(row: any) {
//     try {
//       await this.api.outboundQueueRetry(row.id);
//       this.snack.open('Queue item marked for retry', 'Close', { duration: 1800 });
//       await this.refresh();
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Retry failed', 'Close', { duration: 3500 });
//     }
//   }

//   async requeue(row: any) {
//     if (!this.confirmQueueAction(
//       'Requeue item',
//       row,
//       'This will move the selected queue item back into a retryable state.',
//       'REQUEUE',
//     )) return;
//     try {
//       await this.api.outboundQueueRequeue(row.id);
//       this.snack.open('Queue item requeued', 'Close', { duration: 1800 });
//       await this.refresh();
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Requeue failed', 'Close', { duration: 3500 });
//     }
//   }

//   async sendNow(row: any) {
//     if (!this.confirmQueueAction(
//       'Send now',
//       row,
//       'This will immediately attempt delivery to the configured target.',
//       'SEND',
//     )) return;
//     try {
//       await this.api.outboundQueueSendNow(row.id);
//       this.snack.open('Delivery started', 'Close', { duration: 1800 });
//       await this.refresh();
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Delivery failed', 'Close', { duration: 3500 });
//     }
//   }


//   private confirmQueueAction(title: string, row: any, message: string, keyword: string) {
//     const target = this.targetDisplay(row);
//     const queueId = row?.id || 'unknown';
//     const value = window.prompt(`${title}

// Queue: ${queueId}
// Target: ${target}
// Status: ${row?.delivery_status || '—'}

// ${message}

// Type ${keyword} to continue.`);
//     return String(value ?? '').trim().toUpperCase() === keyword;
//   }
//   targetDisplay(row: any) {
//     return row?.target_name || row?.target_id || 'Unknown target';
//   }

//   canRebuildPayload(row: OutboundQueueRow): boolean {
//     const status = String(row.delivery_status || '').toUpperCase();

//     return status === 'PENDING'
//       || status === 'FAILED'
//       || status === 'BLOCKED';
//   }

//   canRetry(row: any) {
//     return row?.delivery_status === 'FAILED' || row?.delivery_status === 'BLOCKED';
//   }

//   canRequeue(row: any) {
//     return row?.delivery_status === 'FAILED' || row?.delivery_status === 'DELIVERED' || row?.delivery_status === 'BLOCKED';
//   }

//   canSendNow(row: any) {
//     return row?.delivery_status !== 'SENDING' && row?.delivery_status !== 'BLOCKED';
//   }

//   summaryNotes(row: any) {
//     const notes: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

//     if ((row?.delivery_status === 'FAILED' || row?.delivery_status === 'BLOCKED') && row?.last_error) {
//       notes.push({
//         kind: 'bad',
//         text: row.last_error,
//       });
//     }

//     if (row?.delivery_status === 'SENDING') {
//       notes.push({
//         kind: 'warn',
//         text: 'Delivery is currently in progress.',
//       });
//     }

//     if (row?.next_retry_at) {
//       notes.push({
//         kind: 'info',
//         text: `Retry scheduled for ${this.formatDateTime(row.next_retry_at)}.`,
//       });
//     }

//     if ((row?.retry_count ?? 0) >= 3) {
//       notes.push({
//         kind: 'warn',
//         text: 'This item has already retried multiple times.',
//       });
//     }

//     if (!notes.length) {
//       notes.push({
//         kind: 'info',
//         text: 'No active operational warnings for this queue item.',
//       });
//     }

//     return notes;
//   }

//   statusText(row: any) {
//     switch (row?.delivery_status) {
//       case 'FAILED':
//         return 'Needs intervention';
//       case 'SENDING':
//         return 'Delivery in progress';
//       case 'DELIVERED':
//         return 'Delivered successfully';
//       case 'BLOCKED':
//         return 'Blocked by delivery validation';
//       default:
//         return 'Ready for delivery';
//     }
//   }

//   payloadHint(row: any) {
//     const raw = row?.payload_json;
//     if (!raw) return 'No stored payload available';
//     try {
//       const str = typeof raw === 'string' ? raw : JSON.stringify(raw);
//       return `${str.length.toLocaleString()} chars stored`;
//     } catch {
//       return 'Stored payload available';
//     }
//   }

//   formatDateTime(value?: string | null) {
//     if (!value) return '—';
//     const d = new Date(value);
//     if (Number.isNaN(d.getTime())) return value;

//     return new Intl.DateTimeFormat(undefined, {
//       year: 'numeric',
//       month: 'short',
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//     }).format(d);
//   }

//   statusClass(status?: string | null) {
//     switch (status) {
//       case 'DELIVERED':
//         return 'ok';
//       case 'FAILED':
//       case 'BLOCKED':
//         return 'bad';
//       case 'SENDING':
//         return 'warn';
//       default:
//         return 'idle';
//     }
//   }

//   rowTrackBy = (_: number, row: any) => row.id;
// }


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
import { OutboundPayloadPreviewDialog } from '../../shared/dialogs/outbound-payload-preview-dialog/outbound-payload-preview-dialog';

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
  rowActions = signal<Record<string, 'sendNow' | 'retry' | 'requeue' | 'rebuild'>>({});
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
      blocked: rows.filter((row: any) => row.delivery_status === 'BLOCKED').length,
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

  openPayloadPreviewDialog(row: any) {
    const ref = this.dialog.open(OutboundPayloadPreviewDialog, {
      width: 'min(1180px, 96vw)',
      maxWidth: '96vw',
      maxHeight: '92vh',
      autoFocus: false,
      restoreFocus: true,
      panelClass: 'outbound-payload-preview-panel',
      data: { row },
    });

    ref.afterClosed().subscribe((result?: { refresh?: boolean }) => {
      if (result?.refresh) void this.refresh();
    });
  }

  async rebuildPayload(row: any) {
    if (this.isRowBusy(row)) return;
    try {
      this.setRowAction(row, 'rebuild');
      this.snack.open('Rebuilding payload from latest mappings...', 'Close', { duration: 2000 });
      await this.api.outboundQueueRebuildPayload(row.id);
      this.snack.open('Payload rebuilt using the latest mappings and routing context', 'Close', { duration: 3000 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(this.errorMessage(e, 'Payload rebuild failed'), 'Close', { duration: 6500 });
    } finally {
      this.clearRowAction(row);
    }
  }

  async retry(row: any) {
    if (this.isRowBusy(row)) return;
    try {
      this.setRowAction(row, 'retry');
      this.snack.open('Retrying delivery...', 'Close', { duration: 2000 });
      await this.api.outboundQueueRetry(row.id);
      this.snack.open('Retry completed successfully', 'Close', { duration: 3000 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(this.errorMessage(e, 'Retry failed'), 'Close', { duration: 6500 });
      await this.refresh();
    } finally {
      this.clearRowAction(row);
    }
  }

  async requeue(row: any) {
    if (this.isRowBusy(row)) return;
    try {
      this.setRowAction(row, 'requeue');
      await this.api.outboundQueueRequeue(row.id);
      this.snack.open('Queue item requeued', 'Close', { duration: 3000 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(this.errorMessage(e, 'Requeue failed'), 'Close', { duration: 6500 });
    } finally {
      this.clearRowAction(row);
    }
  }

  async sendNow(row: any) {
    const reason = this.sendNowDisabledReason(row);
    if (reason) {
      this.snack.open(reason, 'Close', { duration: 6500 });
      return;
    }

    try {
      this.setRowAction(row, 'sendNow');
      this.snack.open(`Sending payload to ${this.targetDisplay(row)}...`, 'Close', { duration: 2500 });
      const result: any = await this.api.outboundQueueSendNow(row.id);
      this.snack.open(result?.message ?? 'Delivery completed successfully', 'Close', { duration: 4500 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(this.errorMessage(e, 'Delivery failed'), 'Close', { duration: 8000 });
      await this.refresh();
    } finally {
      this.clearRowAction(row);
    }
  }

  explainSendNow(row: any) {
    const reason = this.sendNowDisabledReason(row);
    if (reason) this.snack.open(reason, 'Close', { duration: 6500 });
  }

  sendNowTooltip(row: any) {
    return this.sendNowDisabledReason(row) ?? 'Send this queue item immediately';
  }

  sendNowDisabledReason(row: any): string | null {
    if (!row?.id) return 'Queue item is missing an identifier.';
    if (this.isRowBusy(row)) return 'An action is already running for this queue item.';
    if (row.delivery_status === 'SENDING') return 'Delivery is already in progress. Refresh the queue or open details for status.';
    if (row.delivery_status === 'BLOCKED') return 'Payload is blocked by validation. Rebuild payload before sending.';
    if (!row.payload_json) return 'No stored payload is available for this queue item.';
    return null;
  }

  targetDisplay(row: any) {
    return row?.target_name || row?.target_id || 'Unknown target';
  }

  canRetry(row: any) {
    return !this.isRowBusy(row) && row?.delivery_status === 'FAILED';
  }

  canRequeue(row: any) {
    return !this.isRowBusy(row) && (row?.delivery_status === 'FAILED' || row?.delivery_status === 'DELIVERED' || row?.delivery_status === 'BLOCKED');
  }

  canSendNow(row: any) {
    return !this.sendNowDisabledReason(row);
  }

  canRebuildPayload(row: any) {
    return !this.isRowBusy(row) && !!row?.id && row?.delivery_status !== 'SENDING' && row?.delivery_status !== 'DELIVERED';
  }

  isRowBusy(row: any) {
    return !!row?.id && !!this.rowActions()[row.id];
  }

  private setRowAction(row: any, action: 'sendNow' | 'retry' | 'requeue' | 'rebuild') {
    if (!row?.id) return;
    this.rowActions.update((current) => ({ ...current, [row.id]: action }));
  }

  private clearRowAction(row: any) {
    if (!row?.id) return;
    this.rowActions.update((current) => {
      const next = { ...current };
      delete next[row.id];
      return next;
    });
  }

  private errorMessage(error: any, fallback: string) {
    const message = String(error?.message ?? error ?? '').trim();
    return message || fallback;
  }

  summaryNotes(row: any) {
    const notes: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

    if ((row?.delivery_status === 'FAILED' || row?.delivery_status === 'BLOCKED') && row?.last_error) {
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

    const handling = this.resultHandlingSummary(row);
    if (handling) {
      if ((handling.blockedExistingCount ?? 0) > 0) {
        notes.push({
          kind: 'bad',
          text: `${handling.blockedExistingCount} row(s) blocked because existing LIS results were found. Open payload preview for details.`,
        });
      }
      if ((handling.skippedDuplicateCount ?? 0) > 0) {
        notes.push({
          kind: 'warn',
          text: `${handling.skippedDuplicateCount} duplicate row(s) skipped because the same value already exists in LIS.`,
        });
      }
      if ((handling.correctionCount ?? 0) > 0 || (handling.repeatCount ?? 0) > 0) {
        notes.push({
          kind: 'info',
          text: `${handling.correctionCount ?? 0} correction row(s) and ${handling.repeatCount ?? 0} repeat row(s) prepared.`,
        });
      }
    }

    if (!notes.length) {
      notes.push({
        kind: 'info',
        text: 'No active operational warnings for this queue item.',
      });
    }

    return notes;
  }

  resultHandlingSummary(row: any) {
    const parsed = this.safeParseJson(row?.transform_summary_json);
    return parsed?.lisResultHandling ?? parsed?.resultHandling ?? null;
  }

  private safeParseJson(value: any) {
    if (!value) return null;
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  statusText(row: any) {
    switch (row?.delivery_status) {
      case 'FAILED':
        return 'Needs intervention';
      case 'SENDING':
        return 'Delivery in progress';
      case 'DELIVERED':
        return 'Delivered successfully';
      case 'BLOCKED':
        return 'Payload needs rebuild';
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
      case 'BLOCKED':
        return 'bad';
      case 'SENDING':
        return 'warn';
      default:
        return 'idle';
    }
  }

  rowTrackBy = (_: number, row: any) => row.id;
}

