import { CommonModule } from '@angular/common';
import { Component, Inject, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PlatformApiService } from '../../../core/platform/platform-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

type AlertKind = 'info' | 'warn' | 'bad';
type OperationalAlert = { kind: AlertKind; text: string };

@Component({
  selector: 'app-outbound-queue-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './outbound-queue-detail-dialog.html',
  styleUrl: './outbound-queue-detail-dialog.scss',
})
export class OutboundQueueDetailDialog {
  private api = inject(PlatformApiService);
  private ref = inject(MatDialogRef<OutboundQueueDetailDialog>);
  private snack = inject(MatSnackBar);

  previewLoading = signal(false);
  queuePreview = signal<any | null>(null);

  storedPayload = computed(() => this.parseJson(this.data?.row?.payload_json) ?? {});
  renderedPayload = computed(() => this.queuePreview()?.payload ?? this.storedPayload());
  sourceDocument = computed(() => this.queuePreview()?.sourceDocument ?? this.parseJson(this.data?.row?.source_snapshot_json) ?? null);
  previewSummary = computed(() => this.queuePreview()?.summary ?? this.parseJson(this.data?.row?.transform_summary_json) ?? null);
  previewWarnings = computed<string[]>(() => this.asStringArray(this.queuePreview()?.warnings ?? this.parseJson(this.data?.row?.transform_warnings_json) ?? []));
  previewErrors = computed<string[]>(() => this.asStringArray(this.queuePreview()?.errors ?? this.parseJson(this.data?.row?.transform_errors_json) ?? []));

  resultHandling = computed(() => this.findResultHandling());
  resultHandlingRows = computed<any[]>(() => {
    const rows = this.resultHandling()?.rows;
    return Array.isArray(rows) ? rows : [];
  });

  payloadRowsCount = computed(() => this.countPayloadRows(this.renderedPayload()));
  payloadKind = computed(() => this.payloadKindOf(this.renderedPayload()));

  constructor(@Inject(MAT_DIALOG_DATA) public data: { row: any }) {
    void this.loadPreview();
  }

  close() {
    this.ref.close();
  }

  async loadPreview() {
    const row = this.data?.row;
    if (!row?.id) return;

    try {
      this.previewLoading.set(true);
      const result = await this.api.targetTransformPreviewFromQueue(row.id);
      this.queuePreview.set(result);
    } catch {
      this.queuePreview.set(null);
    } finally {
      this.previewLoading.set(false);
    }
  }

  async copyJson(value: unknown) {
    try {
      await this.api.copy(this.prettyJson(value));
      this.snack.open('Copied to clipboard', 'Close', { duration: 1500 });
    } catch {
      this.snack.open('Failed to copy', 'Close', { duration: 2000 });
    }
  }

  targetDisplay(row: any) {
    return row?.target_name || row?.target_id || 'Unknown target';
  }

  previewSourceLabel(preview: any) {
    switch (preview?.payloadSource) {
      case 'stored_queue':
        return 'Stored queue payload';
      case 'stored_delivery':
        return 'Stored delivered payload';
      case 'regenerated':
      default:
        return 'Regenerated with current mapping engine';
    }
  }

  readinessClass() {
    if (this.previewErrors().length || this.resultHandling()?.blockedExistingCount || this.data?.row?.delivery_status === 'BLOCKED') return 'bad';
    if (this.previewWarnings().length || this.resultHandling()?.skippedDuplicateCount) return 'warn';
    return 'good';
  }

  readinessLabel() {
    if (this.previewErrors().length || this.resultHandling()?.blockedExistingCount || this.data?.row?.delivery_status === 'BLOCKED') return 'Blocked';
    if (this.previewWarnings().length || this.resultHandling()?.skippedDuplicateCount) return 'Review warnings';
    return 'Ready';
  }

  resultHandlingLabel() {
    const handling = this.resultHandling();
    if (!handling) return 'No handling data';
    if (handling.blockedExistingCount) return 'Blocked existing results';
    if (handling.skippedDuplicateCount) return 'Duplicates skipped';
    if (handling.correctionCount) return 'Correction mode';
    if (handling.repeatCount) return 'Repeat mode';
    return 'Initial result flow';
  }

  handlingDecisionClass(row: any) {
    const decision = String(row?.decision ?? '').toUpperCase();
    if (decision.includes('BLOCK')) return 'bad';
    if (decision.includes('SKIP')) return 'warn';
    if (decision.includes('CORRECTION') || decision.includes('REPEAT')) return 'info';
    return 'good';
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
      case 'DELIVERED':
        return 'good';
      case 'FAILED':
      case 'BLOCKED':
        return 'bad';
      case 'SENDING':
        return 'warn';
      case 'PENDING':
        return 'info';
      default:
        return 'idle';
    }
  }

  statusText(row: any) {
    switch (row?.delivery_status) {
      case 'DELIVERED':
        return 'Delivery completed successfully.';
      case 'FAILED':
        return 'Last delivery attempt failed. Review the payload and error before retrying.';
      case 'BLOCKED':
        return 'Queue item is blocked by validation or duplicate-result handling.';
      case 'SENDING':
        return 'Delivery is currently in progress.';
      case 'PENDING':
        return 'Queue item is ready for delivery once validation passes.';
      default:
        return 'Current queue state is not available.';
    }
  }

  operationalAlerts(row: any) {
    if (!row) return [] as OperationalAlert[];
    const alerts: OperationalAlert[] = [];

    if (row.delivery_status === 'BLOCKED') {
      alerts.push({
        kind: 'bad',
        text: 'This queue item is blocked. Rebuild or fix mappings/result-handling issues before sending.',
      });
    }
    if (row.delivery_status === 'FAILED' && row.last_error) {
      alerts.push({
        kind: 'bad',
        text: 'This queue item failed on its last delivery attempt. Review the error details before retrying or resending.',
      });
    }
    if (row.delivery_status === 'SENDING') {
      alerts.push({
        kind: 'warn',
        text: 'Delivery is currently in progress. Avoid duplicate manual send actions unless the previous attempt is confirmed stopped.',
      });
    }
    if (row.next_retry_at) {
      alerts.push({
        kind: 'info',
        text: `A scheduled retry is set for ${this.formatDateTime(row.next_retry_at)}.`,
      });
    }
    if ((row.retry_count ?? 0) >= 3) {
      alerts.push({
        kind: 'warn',
        text: 'This item has already retried multiple times. Investigate the connector or payload before continuing.',
      });
    }
    if (row.delivery_status === 'DELIVERED') {
      alerts.push({
        kind: 'info',
        text: 'This item has already been delivered. Requeue should only be used when intentional redelivery is required.',
      });
    }

    const handling = this.resultHandling();
    if (handling?.skippedDuplicateCount) {
      alerts.push({ kind: 'warn', text: `${handling.skippedDuplicateCount} exact duplicate result row(s) were skipped.` });
    }
    if (handling?.blockedExistingCount) {
      alerts.push({ kind: 'bad', text: `${handling.blockedExistingCount} row(s) were blocked because different LIS results already exist.` });
    }

    return alerts;
  }

  private findResultHandling() {
    const renderedPayload = this.renderedPayload();
    const storedPayload = this.storedPayload();
    const sourceDocument = this.sourceDocument();
    const summary = this.previewSummary();

    return (
      renderedPayload?.context?.resultHandling ??
      renderedPayload?.resultHandling ??
      storedPayload?.context?.resultHandling ??
      storedPayload?.resultHandling ??
      sourceDocument?.resultHandling ??
      sourceDocument?.lis?.resultHandling ??
      summary?.resultHandling ??
      null
    );
  }

  private countPayloadRows(payload: any) {
    if (Array.isArray(payload)) return payload.length;
    if (Array.isArray(payload?.body)) return payload.body.length;
    if (Array.isArray(payload?.payload)) return payload.payload.length;
    if (Array.isArray(payload?.events)) return payload.events.length;
    return 0;
  }

  private payloadKindOf(payload: any) {
    return payload?.resourceType || payload?.endpoint || payload?.kind || payload?.type || 'Destination payload';
  }

  private parseJson(value: any) {
    if (!value) return null;
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private asStringArray(value: any): string[] {
    const parsed = this.parseJson(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item));
  }
}
