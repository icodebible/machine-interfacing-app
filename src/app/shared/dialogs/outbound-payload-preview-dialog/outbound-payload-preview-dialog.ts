import { CommonModule } from '@angular/common';
import { Component, Inject, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PlatformApiService } from '../../../core/platform/platform-api.service';

type MessageKind = 'info' | 'warn' | 'bad';
type PreviewMessage = { kind: MessageKind; text: string };

@Component({
  selector: 'app-outbound-payload-preview-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './outbound-payload-preview-dialog.html',
  styleUrl: './outbound-payload-preview-dialog.scss',
})
export class OutboundPayloadPreviewDialog {
  private readonly api = inject(PlatformApiService);
  private readonly snack = inject(MatSnackBar);

  loading = signal(false);
  rebuilding = signal(false);
  preview = signal<any | null>(null);
  error = signal<string | null>(null);

  queueId = computed(() => this.data?.row?.id ?? null);
  currentStatus = computed(() => String(this.data?.row?.delivery_status ?? this.preview()?.delivery_status ?? '').trim() || null);
  previewName = computed(() => this.preview()?.previewName || this.data?.row?.preview_name || 'Latest mapping preview');

  payload = computed(() => this.preview()?.payload ?? this.parseJson(this.data?.row?.payload_json) ?? {});
  sourceDocument = computed(() => this.preview()?.sourceDocument ?? this.parseJson(this.data?.row?.source_snapshot_json) ?? null);
  summary = computed(() => this.preview()?.summary ?? this.parseJson(this.data?.row?.transform_summary_json) ?? null);

  payloadText = computed(() => this.toPrettyJson(this.payload()));
  sourceText = computed(() => this.toPrettyJson(this.sourceDocument() ?? {}));
  summaryText = computed(() => this.toPrettyJson(this.summary() ?? {}));

  warnings = computed<string[]>(() => this.asStringArray(this.preview()?.warnings ?? this.parseJson(this.data?.row?.transform_warnings_json) ?? []));
  errors = computed<string[]>(() => this.asStringArray(this.preview()?.errors ?? this.parseJson(this.data?.row?.transform_errors_json) ?? []));

  resultHandling = computed(() => this.findResultHandling());
  resultHandlingRows = computed<any[]>(() => {
    const rows = this.resultHandling()?.rows;
    return Array.isArray(rows) ? rows : [];
  });

  messageList = computed<PreviewMessage[]>(() => {
    const messages: PreviewMessage[] = [];

    for (const error of this.errors()) {
      messages.push({ kind: 'bad', text: error });
    }

    for (const warning of this.warnings()) {
      messages.push({ kind: 'warn', text: warning });
    }

    const handling = this.resultHandling();
    if (handling?.skippedDuplicateCount) {
      messages.push({
        kind: 'warn',
        text: `${handling.skippedDuplicateCount} exact duplicate result row(s) will be skipped before delivery.`,
      });
    }
    if (handling?.blockedExistingCount) {
      messages.push({
        kind: 'bad',
        text: `${handling.blockedExistingCount} result row(s) are blocked because different LIS results already exist.`,
      });
    }
    if (handling?.correctionCount) {
      messages.push({
        kind: 'info',
        text: `${handling.correctionCount} row(s) are prepared as correction result(s).`,
      });
    }
    if (handling?.repeatCount) {
      messages.push({
        kind: 'info',
        text: `${handling.repeatCount} row(s) are prepared as repeat/rerun result(s).`,
      });
    }

    if (!messages.length) {
      messages.push({ kind: 'info', text: 'Payload is ready for review. No blocking transform errors were found.' });
    }

    return messages;
  });

  constructor(
    private readonly dialogRef: MatDialogRef<OutboundPayloadPreviewDialog>,
    @Inject(MAT_DIALOG_DATA) public readonly data: { row: any },
  ) {
    void this.loadPreview();
  }

  close(refresh = false) {
    this.dialogRef.close({ refresh });
  }

  async loadPreview() {
    const queueId = this.queueId();
    if (!queueId) return;

    try {
      this.loading.set(true);
      this.error.set(null);
      const preview = await this.api.targetTransformPreviewFromQueue(queueId);
      this.preview.set(preview);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Unable to load payload preview.');
    } finally {
      this.loading.set(false);
    }
  }

  async rebuildPayload() {
    const queueId = this.queueId();
    if (!queueId) return;

    try {
      this.rebuilding.set(true);
      this.error.set(null);
      const preview = await this.api.outboundQueueRebuildPayload(queueId);
      this.preview.set(preview);
      this.snack.open('Payload rebuilt from latest mappings and routing context', 'Close', { duration: 2400 });
    } catch (e: any) {
      this.error.set(e?.message ?? 'Payload rebuild failed.');
      this.snack.open(e?.message ?? 'Payload rebuild failed', 'Close', { duration: 4500 });
    } finally {
      this.rebuilding.set(false);
    }
  }

  async copyPayload() {
    await this.copyJson(this.payload());
  }

  async copySource() {
    await this.copyJson(this.sourceDocument() ?? {});
  }

  async copySummary() {
    await this.copyJson(this.summary() ?? {});
  }

  async copyJson(value: unknown) {
    try {
      await this.api.copy(this.toPrettyJson(value));
      this.snack.open('Copied to clipboard', 'Close', { duration: 1500 });
    } catch {
      this.snack.open('Copy failed', 'Close', { duration: 2500 });
    }
  }

  targetDisplay() {
    return this.data?.row?.target_name || this.data?.row?.target_id || 'Unknown target';
  }

  statusClass() {
    switch (this.currentStatus()) {
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

  statusText() {
    switch (this.currentStatus()) {
      case 'DELIVERED':
        return 'Delivery completed successfully.';
      case 'FAILED':
        return 'Last delivery attempt failed. Review the error and payload before retrying.';
      case 'BLOCKED':
        return 'Payload is blocked by transform or duplicate-result validation.';
      case 'SENDING':
        return 'Delivery is currently in progress.';
      case 'PENDING':
        return 'Payload is queued and ready for delivery once validation passes.';
      default:
        return 'Current queue state is not available.';
    }
  }

  readinessClass() {
    if (this.errors().length || this.resultHandling()?.blockedExistingCount) return 'bad';
    if (this.warnings().length || this.resultHandling()?.skippedDuplicateCount) return 'warn';
    return 'good';
  }

  readinessLabel() {
    if (this.errors().length || this.resultHandling()?.blockedExistingCount) return 'Blocked';
    if (this.warnings().length || this.resultHandling()?.skippedDuplicateCount) return 'Review warnings';
    return 'Ready';
  }

  payloadSource() {
    switch (this.preview()?.payloadSource) {
      case 'stored_queue':
        return 'Stored queue payload';
      case 'stored_delivery':
        return 'Stored delivery payload';
      case 'regenerated':
        return 'Regenerated preview';
      default:
        return this.preview() ? 'Transform preview' : 'Stored queue payload';
    }
  }

  payloadRowsCount() {
    const payload = this.payload();
    if (Array.isArray(payload)) return payload.length;
    if (Array.isArray(payload?.body)) return payload.body.length;
    if (Array.isArray(payload?.payload)) return payload.payload.length;
    if (Array.isArray(payload?.events)) return payload.events.length;
    return 0;
  }

  payloadKind() {
    const payload = this.payload();
    return payload?.resourceType || payload?.endpoint || payload?.kind || payload?.type || 'Destination payload';
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

  private findResultHandling() {
    const payload = this.payload();
    const sourceDocument = this.sourceDocument();
    const summary = this.summary();

    return (
      payload?.context?.resultHandling ??
      payload?.resultHandling ??
      sourceDocument?.resultHandling ??
      sourceDocument?.lis?.resultHandling ??
      summary?.resultHandling ??
      null
    );
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

  private toPrettyJson(value: any) {
    const parsed = this.parseJson(value);
    try {
      return JSON.stringify(parsed ?? {}, null, 2);
    } catch {
      return String(value ?? '');
    }
  }

  private asStringArray(value: any): string[] {
    const parsed = this.parseJson(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => String(item));
  }
}
