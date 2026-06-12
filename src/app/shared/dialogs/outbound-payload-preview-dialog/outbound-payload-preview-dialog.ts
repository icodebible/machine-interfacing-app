import { CommonModule } from '@angular/common';
import { Component, Inject, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { PlatformApiService } from '../../../core/platform/platform-api.service';

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
    MatTabsModule,
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

  payloadText = computed(() => this.toPrettyJson(this.preview()?.payload ?? this.data?.row?.payload_json ?? {}));
  sourceText = computed(() => this.toPrettyJson(this.preview()?.sourceDocument ?? this.data?.row?.source_snapshot_json ?? {}));
  warnings = computed<string[]>(() => this.asStringArray(this.preview()?.warnings ?? this.parseJson(this.data?.row?.transform_warnings_json) ?? []));
  errors = computed<string[]>(() => this.asStringArray(this.preview()?.errors ?? this.parseJson(this.data?.row?.transform_errors_json) ?? []));
  summary = computed<any>(() => this.preview()?.summary ?? this.parseJson(this.data?.row?.transform_summary_json) ?? {});
  summaryText = computed(() => this.toPrettyJson(this.summary() ?? {}));
  deliveryValidation = computed<any>(() => this.summary()?.deliveryValidation ?? this.deriveDeliveryValidation());
  deliveryValidationMessages = computed<string[]>(() => this.asStringArray(this.deliveryValidation()?.messages ?? []));
  deliveryValidationErrors = computed<string[]>(() => this.asStringArray(this.deliveryValidation()?.errors ?? this.errors()));
  deliveryValidationWarnings = computed<string[]>(() => this.asStringArray(this.deliveryValidation()?.warnings ?? this.warnings()));
  deliveryMissingRequiredCodes = computed<string[]>(() => this.asStringArray(this.deliveryValidation()?.missingRequiredCodes ?? []));
  deliveryUnexpectedAnalyzerCodes = computed<string[]>(() => this.asStringArray(this.deliveryValidation()?.unexpectedAnalyzerCodes ?? []));

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
    const queueId = this.data?.row?.id;
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
    const queueId = this.data?.row?.id;
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
    try {
      await this.api.copy(this.payloadText());
      this.snack.open('Payload copied', 'Close', { duration: 1500 });
    } catch {
      this.snack.open('Copy failed', 'Close', { duration: 2500 });
    }
  }

  deliveryValidationLabel(): string {
    const status = String(this.deliveryValidation()?.status ?? '').toUpperCase();
    if (status === 'READY') return 'Ready to send';
    if (status === 'WARNING') return 'Review warnings';
    if (status === 'BLOCKED') return 'Blocked';
    return 'Not evaluated';
  }

  deliveryValidationClass(): string {
    const status = String(this.deliveryValidation()?.status ?? '').toUpperCase();
    if (status === 'READY') return 'success';
    if (status === 'WARNING') return 'warn';
    if (status === 'BLOCKED') return 'bad';
    return 'info';
  }

  payloadRowsCount(): number {
    const payload = this.parseJson(this.preview()?.payload ?? this.data?.row?.payload_json ?? {});
    if (Array.isArray(payload)) return payload.length;
    if (Array.isArray(payload?.body)) return payload.body.length;
    if (Array.isArray(payload?.payload?.body)) return payload.payload.body.length;
    if (Array.isArray(payload?.results)) return payload.results.length;
    return 0;
  }

  private deriveDeliveryValidation() {
    const errors = this.errors();
    const warnings = this.warnings();
    const status = errors.length ? 'BLOCKED' : warnings.length ? 'WARNING' : 'READY';
    return {
      status,
      severity: status === 'BLOCKED' ? 'bad' : status === 'WARNING' ? 'warn' : 'success',
      payloadRowCount: this.payloadRowsCount(),
      errors,
      warnings,
      messages: status === 'READY' ? ['Payload passed delivery validation and can be sent.'] : [...errors, ...warnings],
      missingRequiredCodes: [],
      unexpectedAnalyzerCodes: [],
    };
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
