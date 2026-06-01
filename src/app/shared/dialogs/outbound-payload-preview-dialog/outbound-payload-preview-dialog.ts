// import { CommonModule } from '@angular/common';
// import { Component, Inject, OnInit, inject, signal } from '@angular/core';

// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatTooltipModule } from '@angular/material/tooltip';

// import { PlatformApiService } from '../../../core/platform/platform-api.service';

// type DialogCloseResult = { refresh?: boolean; action?: 'rebuild' | 'send' | 'retry' };
// type PreviewMessageKind = 'bad' | 'warn' | 'info';

// @Component({
//   selector: 'app-outbound-payload-preview-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatButtonModule,
//     MatDialogModule,
//     MatDividerModule,
//     MatIconModule,
//     MatProgressBarModule,
//     MatSnackBarModule,
//     MatTooltipModule,
//   ],
//   templateUrl: './outbound-payload-preview-dialog.html',
//   styleUrl: './outbound-payload-preview-dialog.scss',
// })
// export class OutboundPayloadPreviewDialog implements OnInit {
//   private readonly api = inject(PlatformApiService);
//   private readonly snack = inject(MatSnackBar);

//   readonly loading = signal(false);
//   readonly actionLoading = signal(false);
//   readonly preview = signal<any | null>(null);
//   readonly actionCompleted = signal(false);
//   readonly workingMessage = signal<string | null>(null);
//   readonly currentStatus = signal<string | null>(null);

//   constructor(
//     private readonly dialogRef: MatDialogRef<OutboundPayloadPreviewDialog, DialogCloseResult>,
//     @Inject(MAT_DIALOG_DATA)
//     public readonly data: { row: any },
//   ) {
//     this.currentStatus.set(data?.row?.delivery_status ?? null);
//   }

//   ngOnInit(): void {
//     void this.loadPreview();
//   }

//   async loadPreview(): Promise<void> {
//     const queueId = this.queueId();
//     if (!queueId) {
//       this.snack.open('No outbound queue item selected.', 'Close', { duration: 2200 });
//       return;
//     }

//     try {
//       this.loading.set(true);
//       this.workingMessage.set('Preparing the latest queued payload preview...');
//       const result = await this.api.targetTransformPreviewFromQueue(queueId);
//       this.preview.set(result ?? null);
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to load payload preview', 'Close', {
//         duration: 3800,
//       });
//     } finally {
//       this.loading.set(false);
//       this.workingMessage.set(null);
//     }
//   }

//   async rebuildPayload(): Promise<void> {
//     const queueId = this.queueId();
//     if (!queueId) return;

//     try {
//       this.actionLoading.set(true);
//       this.workingMessage.set('Rebuilding payload using the latest mappings...');
//       await this.api.outboundQueueRequeue(queueId);
//       this.actionCompleted.set(true);
//       this.currentStatus.set('PENDING');
//       this.snack.open('Payload rebuilt and queue item marked ready.', 'Close', { duration: 2400 });
//       await this.loadPreview();
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to rebuild payload', 'Close', { duration: 5200 });
//     } finally {
//       this.actionLoading.set(false);
//       this.workingMessage.set(null);
//     }
//   }

//   async sendOrRetry(): Promise<void> {
//     const queueId = this.queueId();
//     if (!queueId) return;

//     const retry = this.currentStatus() === 'FAILED' || this.data?.row?.delivery_status === 'FAILED';

//     try {
//       this.actionLoading.set(true);
//       this.workingMessage.set(retry ? 'Retrying delivery to LIS...' : 'Sending payload to LIS...');

//       if (retry) {
//         await this.api.outboundQueueRetry(queueId);
//       } else {
//         await this.api.outboundQueueSendNow(queueId);
//       }

//       this.actionCompleted.set(true);
//       this.currentStatus.set('SENDING');
//       this.snack.open(retry ? 'Retry started.' : 'Delivery started.', 'Close', { duration: 2200 });
//       this.dialogRef.close({ refresh: true, action: retry ? 'retry' : 'send' });
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Delivery failed', 'Close', { duration: 5200 });
//     } finally {
//       this.actionLoading.set(false);
//       this.workingMessage.set(null);
//     }
//   }

//   close(): void {
//     this.dialogRef.close(this.actionCompleted() ? { refresh: true } : undefined);
//   }

//   copyPayload(): void {
//     const payload = this.payload();
//     this.api
//       .copy(this.prettyJson(payload))
//       .then(() => this.snack.open('Payload copied to clipboard.', 'Close', { duration: 1600 }))
//       .catch(() => this.snack.open('Failed to copy payload.', 'Close', { duration: 2400 }));
//   }

//   queueId(): string | null {
//     return this.data?.row?.id ? String(this.data.row.id) : null;
//   }

//   targetDisplay(): string {
//     const row = this.data?.row;
//     return row?.target_name || row?.target_id || 'Unknown target';
//   }

//   previewName(): string {
//     return this.preview()?.previewName || this.data?.row?.preview_name || 'Queued delivery payload';
//   }

//   payloadSource(): string {
//     return this.preview()?.payloadSource || 'queued';
//   }

//   payload(): unknown {
//     const result = this.preview();
//     if (result && Object.prototype.hasOwnProperty.call(result, 'payload')) return result.payload;
//     return this.tryParseJson(this.data?.row?.payload_json, this.data?.row?.payload_json ?? null);
//   }

//   sourceDocument(): unknown {
//     const result = this.preview();
//     if (result && Object.prototype.hasOwnProperty.call(result, 'sourceDocument')) return result.sourceDocument;
//     return this.tryParseJson(this.data?.row?.source_snapshot_json, null);
//   }

//   warnings(): string[] {
//     const resultWarnings = this.preview()?.warnings;
//     if (Array.isArray(resultWarnings)) return resultWarnings.map((item: unknown) => String(item));
//     const stored = this.tryParseJson(this.data?.row?.transform_warnings_json, []);
//     return Array.isArray(stored) ? stored.map((item: unknown) => String(item)) : [];
//   }

//   errors(): string[] {
//     const resultErrors = this.preview()?.errors;
//     if (Array.isArray(resultErrors)) return resultErrors.map((item: unknown) => String(item));
//     const stored = this.tryParseJson(this.data?.row?.transform_errors_json, []);
//     return Array.isArray(stored) ? stored.map((item: unknown) => String(item)) : [];
//   }

//   summary(): any {
//     const resultSummary = this.preview()?.summary;
//     if (resultSummary && typeof resultSummary === 'object') return resultSummary;
//     return this.tryParseJson(this.data?.row?.transform_summary_json, null);
//   }

//   readinessClass(): 'ok' | 'warn' | 'bad' | 'idle' {
//     if (this.errors().length > 0) return 'bad';
//     if (this.warnings().length > 0) return 'warn';
//     if (this.preview() || this.data?.row?.payload_json) return 'ok';
//     return 'idle';
//   }

//   readinessLabel(): string {
//     if (this.errors().length > 0) return 'Blocked';
//     if (this.warnings().length > 0) return 'Ready with warnings';
//     if (this.preview() || this.data?.row?.payload_json) return 'Ready to send';
//     return 'No payload';
//   }

//   payloadKind(): string {
//     const payload = this.payload();
//     if (Array.isArray(payload)) return 'Array payload';
//     if (payload && typeof payload === 'object') return 'Object payload';
//     if (typeof payload === 'string') return 'Text payload';
//     return 'No payload';
//   }

//   payloadRowsCount(): number | string {
//     const payload: any = this.payload();
//     if (Array.isArray(payload)) return payload.length;
//     if (Array.isArray(payload?.results)) return payload.results.length;
//     if (Array.isArray(payload?.data)) return payload.data.length;
//     if (payload && typeof payload === 'object') return Object.keys(payload).length ? '1 object' : 0;
//     return payload ? 1 : 0;
//   }

//   messageList(): Array<{ kind: PreviewMessageKind; text: string }> {
//     const errors = this.errors().map((text) => ({ kind: 'bad' as const, text }));
//     const warnings = this.warnings().map((text) => ({ kind: 'warn' as const, text }));

//     if (errors.length || warnings.length) return [...errors, ...warnings];

//     return [
//       {
//         kind: 'info',
//         text: 'No blocking errors were found in the queued payload preview.',
//       },
//     ];
//   }

//   canSend(): boolean {
//     return !this.loading() && !this.actionLoading() && this.errors().length === 0 && this.currentStatus() !== 'SENDING';
//   }

//   canRebuild(): boolean {
//     return !this.loading() && !this.actionLoading();
//   }

//   actionLabel(): string {
//     return this.currentStatus() === 'FAILED' || this.data?.row?.delivery_status === 'FAILED'
//       ? 'Retry delivery'
//       : 'Send now';
//   }

//   statusText(): string {
//     switch (this.currentStatus()) {
//       case 'FAILED':
//         return 'Needs intervention';
//       case 'SENDING':
//         return 'Delivery in progress';
//       case 'DELIVERED':
//         return 'Delivered successfully';
//       case 'PENDING':
//         return 'Ready for delivery';
//       default:
//         return this.currentStatus() || '—';
//     }
//   }

//   statusClass(): 'ok' | 'warn' | 'bad' | 'idle' {
//     switch (this.currentStatus()) {
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

//   formatDateTime(value?: string | null): string {
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

//   prettyJson(value: unknown): string {
//     try {
//       return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value ?? {}, null, 2);
//     } catch {
//       return typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2);
//     }
//   }

//   private tryParseJson(value: unknown, fallback: unknown): unknown {
//     if (value === null || value === undefined || value === '') return fallback;
//     if (typeof value !== 'string') return value;

//     try {
//       return JSON.parse(value);
//     } catch {
//       return fallback;
//     }
//   }
// }

import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject, signal } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlatformApiService } from '../../../core/platform/platform-api.service';

type DialogCloseResult = { refresh?: boolean; action?: 'rebuild' | 'send' | 'retry' };
type PreviewMessageKind = 'bad' | 'warn' | 'info';

@Component({
  selector: 'app-outbound-payload-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './outbound-payload-preview-dialog.html',
  styleUrl: './outbound-payload-preview-dialog.scss',
})
export class OutboundPayloadPreviewDialog implements OnInit {
  private readonly api = inject(PlatformApiService);
  private readonly snack = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly actionLoading = signal(false);
  readonly preview = signal<any | null>(null);
  readonly actionCompleted = signal(false);
  readonly workingMessage = signal<string | null>(null);
  readonly currentStatus = signal<string | null>(null);

  constructor(
    private readonly dialogRef: MatDialogRef<OutboundPayloadPreviewDialog, DialogCloseResult>,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: { row: any },
  ) {
    this.currentStatus.set(data?.row?.delivery_status ?? null);
  }

  ngOnInit(): void {
    void this.loadPreview();
  }

  async loadPreview(): Promise<void> {
    const queueId = this.queueId();
    if (!queueId) {
      this.snack.open('No outbound queue item selected.', 'Close', { duration: 2200 });
      return;
    }

    try {
      this.loading.set(true);
      this.workingMessage.set('Preparing the latest queued payload preview...');
      const result = await this.api.targetTransformPreviewFromQueue(queueId);
      this.preview.set(result ?? null);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load payload preview', 'Close', {
        duration: 3800,
      });
    } finally {
      this.loading.set(false);
      this.workingMessage.set(null);
    }
  }

  async rebuildPayload(): Promise<void> {
    const queueId = this.queueId();
    if (!queueId) return;

    try {
      this.actionLoading.set(true);
      this.workingMessage.set('Rebuilding payload using the latest mappings...');
      await this.api.outboundQueueRequeue(queueId);
      this.actionCompleted.set(true);
      this.currentStatus.set('PENDING');
      this.snack.open('Payload rebuilt and queue item marked ready.', 'Close', { duration: 2400 });
      await this.loadPreview();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to rebuild payload', 'Close', { duration: 5200 });
    } finally {
      this.actionLoading.set(false);
      this.workingMessage.set(null);
    }
  }

  async sendOrRetry(): Promise<void> {
    const queueId = this.queueId();
    if (!queueId) return;

    const retry = this.currentStatus() === 'FAILED' || this.data?.row?.delivery_status === 'FAILED';

    try {
      this.actionLoading.set(true);
      this.workingMessage.set(retry ? 'Retrying delivery to LIS...' : 'Sending payload to LIS...');

      if (retry) {
        await this.api.outboundQueueRetry(queueId);
      } else {
        await this.api.outboundQueueSendNow(queueId);
      }

      this.actionCompleted.set(true);
      this.currentStatus.set('SENDING');
      this.snack.open(retry ? 'Retry started.' : 'Delivery started.', 'Close', { duration: 2200 });
      this.dialogRef.close({ refresh: true, action: retry ? 'retry' : 'send' });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Delivery failed', 'Close', { duration: 5200 });
    } finally {
      this.actionLoading.set(false);
      this.workingMessage.set(null);
    }
  }

  close(): void {
    this.dialogRef.close(this.actionCompleted() ? { refresh: true } : undefined);
  }

  copyPayload(): void {
    const payload = this.payload();
    this.api
      .copy(this.prettyJson(payload))
      .then(() => this.snack.open('Payload copied to clipboard.', 'Close', { duration: 1600 }))
      .catch(() => this.snack.open('Failed to copy payload.', 'Close', { duration: 2400 }));
  }

  queueId(): string | null {
    return this.data?.row?.id ? String(this.data.row.id) : null;
  }

  targetDisplay(): string {
    const row = this.data?.row;
    return row?.target_name || row?.target_id || 'Unknown target';
  }

  previewName(): string {
    return this.preview()?.previewName || this.data?.row?.preview_name || 'Queued delivery payload';
  }

  payloadSource(): string {
    return this.preview()?.payloadSource || 'queued';
  }

  payload(): unknown {
    const result = this.preview();
    if (result && Object.prototype.hasOwnProperty.call(result, 'payload')) return result.payload;
    return this.tryParseJson(this.data?.row?.payload_json, this.data?.row?.payload_json ?? null);
  }

  sourceDocument(): unknown {
    const result = this.preview();
    if (result && Object.prototype.hasOwnProperty.call(result, 'sourceDocument')) return result.sourceDocument;
    return this.tryParseJson(this.data?.row?.source_snapshot_json, null);
  }

  warnings(): string[] {
    const resultWarnings = this.preview()?.warnings;
    if (Array.isArray(resultWarnings)) return resultWarnings.map((item: unknown) => String(item));
    const stored = this.tryParseJson(this.data?.row?.transform_warnings_json, []);
    return Array.isArray(stored) ? stored.map((item: unknown) => String(item)) : [];
  }

  errors(): string[] {
    const resultErrors = this.preview()?.errors;
    if (Array.isArray(resultErrors)) return resultErrors.map((item: unknown) => String(item));
    const stored = this.tryParseJson(this.data?.row?.transform_errors_json, []);
    return Array.isArray(stored) ? stored.map((item: unknown) => String(item)) : [];
  }

  summary(): any {
    const resultSummary = this.preview()?.summary;
    if (resultSummary && typeof resultSummary === 'object') return resultSummary;
    return this.tryParseJson(this.data?.row?.transform_summary_json, null);
  }

  readinessClass(): 'ok' | 'warn' | 'bad' | 'idle' {
    if (this.errors().length > 0) return 'bad';
    if (this.warnings().length > 0) return 'warn';
    if (this.preview() || this.data?.row?.payload_json) return 'ok';
    return 'idle';
  }

  readinessLabel(): string {
    if (this.errors().length > 0) return 'Blocked';
    if (this.warnings().length > 0) return 'Ready with warnings';
    if (this.preview() || this.data?.row?.payload_json) return 'Ready to send';
    return 'No payload';
  }

  payloadKind(): string {
    const payload = this.payload();
    if (Array.isArray(payload)) return 'Array payload';
    if (payload && typeof payload === 'object') return 'Object payload';
    if (typeof payload === 'string') return 'Text payload';
    return 'No payload';
  }

  payloadRowsCount(): number | string {
    const payload: any = this.payload();
    if (Array.isArray(payload)) return payload.length;
    if (Array.isArray(payload?.results)) return payload.results.length;
    if (Array.isArray(payload?.data)) return payload.data.length;
    if (payload && typeof payload === 'object') return Object.keys(payload).length ? '1 object' : 0;
    return payload ? 1 : 0;
  }

  messageList(): Array<{ kind: PreviewMessageKind; text: string }> {
    const errors = this.errors().map((text) => ({ kind: 'bad' as const, text }));
    const warnings = this.warnings().map((text) => ({ kind: 'warn' as const, text }));

    if (errors.length || warnings.length) return [...errors, ...warnings];

    return [
      {
        kind: 'info',
        text: 'No blocking errors were found in the queued payload preview.',
      },
    ];
  }

  canSend(): boolean {
    return !this.loading() && !this.actionLoading() && this.errors().length === 0 && this.currentStatus() !== 'SENDING';
  }

  canRebuild(): boolean {
    return !this.loading() && !this.actionLoading();
  }

  actionLabel(): string {
    return this.currentStatus() === 'FAILED' || this.data?.row?.delivery_status === 'FAILED'
      ? 'Retry delivery'
      : 'Send now';
  }

  statusText(): string {
    switch (this.currentStatus()) {
      case 'FAILED':
        return 'Needs intervention';
      case 'SENDING':
        return 'Delivery in progress';
      case 'DELIVERED':
        return 'Delivered successfully';
      case 'PENDING':
        return 'Ready for delivery';
      default:
        return this.currentStatus() || '—';
    }
  }

  statusClass(): 'ok' | 'warn' | 'bad' | 'idle' {
    switch (this.currentStatus()) {
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

  formatDateTime(value?: string | null): string {
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

  prettyJson(value: unknown): string {
    try {
      return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value ?? {}, null, 2);
    } catch {
      return typeof value === 'string' ? value : JSON.stringify(value ?? {}, null, 2);
    }
  }

  private tryParseJson(value: unknown, fallback: unknown): unknown {
    if (value === null || value === undefined || value === '') return fallback;
    if (typeof value !== 'string') return value;

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
}
