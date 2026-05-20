import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { startWith } from 'rxjs';
import { PlatformApiService } from '../../../core/platform/platform-api.service';

type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
type RetryBackoffStrategy = 'FIXED' | 'LINEAR' | 'EXPONENTIAL';
type TargetDialogMode = 'create' | 'edit';
type DialogSection = 'overview' | 'security' | 'preview';
type AuthType = 'none' | 'bearer' | 'basic' | 'api_key';

type TargetRow = {
  id: string;
  type: TargetType;
  name: string;
  base_url: string;
  enabled: number;
  auto_retry_enabled?: number | null;
  max_retry_attempts?: number | null;
  retry_backoff_strategy?: RetryBackoffStrategy | null;
  initial_retry_delay_ms?: number | null;
  max_retry_delay_ms?: number | null;
  request_timeout_ms?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type TargetDialogData = {
  mode: TargetDialogMode;
  row?: TargetRow;
  defaults?: Partial<TargetRow>;
  recommendedOperationalDefaults?: {
    requestTimeoutMs: number;
    autoRetry: boolean;
    maxAttempts: number;
    backoffStrategy: RetryBackoffStrategy;
    baseDelayMs: number;
    maxDelayMs: number;
  };
  presetLabel?: string;
  presetNotes?: string[];
  startSection?: DialogSection;
};

@Component({
  selector: 'app-target-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  templateUrl: './target-dialog.html',
  styleUrl: './target-dialog.scss',
})
export class TargetDialog {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(PlatformApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<TargetDialog>);
  readonly data = inject<TargetDialogData>(MAT_DIALOG_DATA);

  readonly mode = signal<TargetDialogMode>(this.data.mode);
  readonly activeSection = signal<DialogSection>(this.data.startSection ?? 'overview');
  readonly currentRow = signal<TargetRow | null>(this.data.row ?? null);
  readonly changed = signal(false);

  readonly savingTarget = signal(false);
  readonly loadingSecrets = signal(false);
  readonly savingSecrets = signal(false);
  readonly testingConnection = signal(false);
  readonly generatingPreview = signal(false);

  readonly authType = signal<AuthType>('none');
  readonly username = signal('');
  readonly password = signal('');
  readonly token = signal('');
  readonly apiKeyName = signal('X-API-Key');
  readonly apiKeyValue = signal('');
  readonly allowInsecureTls = signal(false);

  readonly diagnostics = signal<any | null>(null);
  readonly preview = signal<any | null>(null);
  readonly normalizedResultId = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(160)]],
    type: ['DHIS2' as TargetType, Validators.required],
    base_url: ['', [Validators.required, Validators.maxLength(1024)]],
    enabled: [true],
    request_timeout_ms: [15000, [Validators.required, Validators.min(1000)]],
    auto_retry_enabled: [true],
    max_retry_attempts: [3, [Validators.required, Validators.min(0), Validators.max(20)]],
    retry_backoff_strategy: ['EXPONENTIAL' as RetryBackoffStrategy, Validators.required],
    initial_retry_delay_ms: [1500, [Validators.required, Validators.min(0)]],
    max_retry_delay_ms: [30000, [Validators.required, Validators.min(0)]],
  });

  readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );

  readonly selectedType = toSignal(
    this.form.controls.type.valueChanges.pipe(startWith(this.form.controls.type.value)),
    { initialValue: this.form.controls.type.value },
  );

  readonly isPersisted = computed(() => !!this.currentRow()?.id);
  readonly dialogTitle = computed(() => (this.mode() === 'create' ? 'Create target' : 'Target workspace'));
  readonly dialogSubtitle = computed(() => (
    this.isPersisted()
      ? 'Manage target configuration, connector security, connection checks, and payload preview in one place.'
      : 'Save the target first, then continue with security, connection testing, and preview.'
  ));

  readonly helperByType: Record<TargetType, { summary: string; guidance: string[] }> = {
    DHIS2: {
      summary: 'Best for tracker and event-oriented DHIS2 payload delivery.',
      guidance: [
        'Use the API root as the base URL and keep payload shape in mappings.',
        'Handle program, stage, and data element placement through transformation rules.',
      ],
    },
    OPENMRS: {
      summary: 'Best for observation and encounter delivery into OpenMRS REST APIs.',
      guidance: [
        'Keep endpoint identity stable and push payload shaping into configuration-driven mappings.',
        'Use connector security for credentials instead of embedding secrets in the URL.',
      ],
    },
    LIS: {
      summary: 'Best for laboratory result delivery into LIS contracts and specimen-oriented APIs.',
      guidance: [
        'Keep specimen and accession field alignment in the mapping layer.',
        'Confirm result code and value conventions before live routing.',
      ],
    },
    CUSTOM_HTTP: {
      summary: 'Best for partner-specific HTTP JSON endpoints where the body is fully mapping-driven.',
      guidance: [
        'Use mappings for the exact JSON structure expected by the receiver.',
        'Store all partner authentication settings in the security section.',
      ],
    },
  };

  readonly helper = computed(() => this.helperByType[this.selectedType()]);
  readonly summaryCards = computed(() => {
    const form = this.formValue();
    const row = this.currentRow();

    return [
      {
        label: 'Type',
        value: form.type,
        note: row?.id ? `Saved target id: ${row.id}` : 'Not yet saved',
      },
      {
        label: 'Status',
        value: form.enabled ? 'Enabled' : 'Disabled',
        note: form.enabled ? 'Eligible for workflow routing' : 'Retained for staged configuration',
      },
      {
        label: 'Timeout',
        value: `${Number(form.request_timeout_ms || 0).toLocaleString()} ms`,
        note: `Retry ${form.auto_retry_enabled ? 'enabled' : 'disabled'}`,
      },
      {
        label: 'Retry profile',
        value: form.auto_retry_enabled
          ? `${form.max_retry_attempts} · ${form.retry_backoff_strategy}`
          : 'Disabled',
        note: `${Number(form.initial_retry_delay_ms || 0).toLocaleString()} → ${Number(form.max_retry_delay_ms || 0).toLocaleString()} ms`,
      },
    ];
  });

  readonly isBusy = computed(() => (
    this.savingTarget()
    || this.loadingSecrets()
    || this.savingSecrets()
    || this.testingConnection()
    || this.generatingPreview()
  ));

  constructor() {
    this.applyInitialState();

    effect(() => {
      const row = this.currentRow();
      if (row?.id) {
        void this.loadSecrets(row.id);
      }
    });
  }

  setActiveSection(section: DialogSection) {
    this.activeSection.set(section);
  }

  async saveTarget() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.savingTarget.set(true);

    try {
      const dto = this.buildTargetDto();
      const isCreateAction = !this.currentRow()?.id;
      let focusId = this.currentRow()?.id ?? null;

      if (this.currentRow()?.id) {
        await this.api.targetsUpdate(this.currentRow()!.id, dto);
      } else {
        const created = await this.api.targetsCreate(dto);
        focusId = created?.id ?? null;
      }

      const refreshedRow = focusId ? await this.refreshPersistedRow(focusId) : null;
      if (refreshedRow) {
        this.currentRow.set(refreshedRow);
        this.patchForm(refreshedRow);
        this.mode.set('edit');
      }

      this.changed.set(true);
      this.snack.open(isCreateAction ? 'Target created.' : 'Target saved.', 'Close', { duration: 2400 });

      if (!this.isPersisted()) {
        return;
      }

      if (this.activeSection() === 'overview') {
        this.activeSection.set('security');
      }
    } catch (error: any) {
      this.snack.open(error?.message || 'Failed to save target.', 'Close', { duration: 3500 });
    } finally {
      this.savingTarget.set(false);
    }
  }

  async saveSecurity() {
    const row = this.currentRow();
    if (!row?.id) {
      this.snack.open('Save the target first before saving security settings.', 'Close', { duration: 3200 });
      return;
    }

    this.savingSecrets.set(true);
    try {
      await this.api.targetSecretsSave(row.id, {
        authType: this.authType(),
        username: this.username().trim() || null,
        password: this.password() || null,
        token: this.token().trim() || null,
        apiKeyName: this.apiKeyName().trim() || null,
        apiKeyValue: this.apiKeyValue() || null,
        allowInsecureTls: this.allowInsecureTls(),
      });
      this.changed.set(true);
      this.snack.open('Security settings saved.', 'Close', { duration: 2400 });
    } catch (error: any) {
      this.snack.open(error?.message || 'Failed to save security settings.', 'Close', { duration: 3500 });
    } finally {
      this.savingSecrets.set(false);
    }
  }

  async testConnection() {
    const row = this.currentRow();
    if (!row?.id) {
      this.snack.open('Save the target first before testing the connection.', 'Close', { duration: 3200 });
      return;
    }

    this.testingConnection.set(true);
    this.diagnostics.set(null);

    try {
      const result = await this.api.targetsTest(row.id);
      this.diagnostics.set(result);
      this.snack.open(result?.ok ? 'Connection test completed.' : 'Connection test returned warnings.', 'Close', {
        duration: 2600,
      });
    } catch (error: any) {
      this.snack.open(error?.message || 'Failed to test the connection.', 'Close', { duration: 3500 });
    } finally {
      this.testingConnection.set(false);
    }
  }

  async generatePreview() {
    const row = this.currentRow();
    const normalizedResultId = this.normalizedResultId().trim();

    if (!row?.id) {
      this.snack.open('Save the target first before previewing the transformation.', 'Close', { duration: 3200 });
      return;
    }

    if (!normalizedResultId) {
      this.snack.open('Enter a normalized result id to generate the preview.', 'Close', { duration: 3200 });
      return;
    }

    this.generatingPreview.set(true);
    this.preview.set(null);

    try {
      const preview = await this.api.targetTransformPreview(row.id, normalizedResultId);
      this.preview.set(preview);
    } catch (error: any) {
      this.snack.open(error?.message || 'Failed to generate preview.', 'Close', { duration: 3500 });
    } finally {
      this.generatingPreview.set(false);
    }
  }

  close() {
    this.dialogRef.close({
      changed: this.changed(),
      focusId: this.currentRow()?.id ?? null,
    });
  }

  formatJson(value: unknown) {
    return JSON.stringify(value ?? {}, null, 2);
  }

  formatDateTime(value?: string | null) {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  private applyInitialState() {
    const row = this.data.row;
    const defaults = this.data.defaults;
    const recommended = this.data.recommendedOperationalDefaults;

    if (recommended) {
      this.form.patchValue({
        request_timeout_ms: recommended.requestTimeoutMs,
        auto_retry_enabled: recommended.autoRetry,
        max_retry_attempts: recommended.maxAttempts,
        retry_backoff_strategy: recommended.backoffStrategy,
        initial_retry_delay_ms: recommended.baseDelayMs,
        max_retry_delay_ms: recommended.maxDelayMs,
      });
    }

    if (defaults) {
      this.form.patchValue({
        name: defaults.name ?? this.form.controls.name.value,
        type: defaults.type ?? this.form.controls.type.value,
        base_url: defaults.base_url ?? this.form.controls.base_url.value,
        enabled: Number(defaults.enabled ?? 1) === 1,
        request_timeout_ms: Number(defaults.request_timeout_ms ?? this.form.controls.request_timeout_ms.value),
        auto_retry_enabled: Number(defaults.auto_retry_enabled ?? 1) === 1,
        max_retry_attempts: Number(defaults.max_retry_attempts ?? this.form.controls.max_retry_attempts.value),
        retry_backoff_strategy: (defaults.retry_backoff_strategy ?? this.form.controls.retry_backoff_strategy.value) as RetryBackoffStrategy,
        initial_retry_delay_ms: Number(defaults.initial_retry_delay_ms ?? this.form.controls.initial_retry_delay_ms.value),
        max_retry_delay_ms: Number(defaults.max_retry_delay_ms ?? this.form.controls.max_retry_delay_ms.value),
      });
    }

    if (row) {
      this.patchForm(row);
    }
  }

  private patchForm(row: TargetRow) {
    this.form.patchValue({
      name: row.name,
      type: row.type,
      base_url: row.base_url,
      enabled: Number(row.enabled) === 1,
      request_timeout_ms: Number(row.request_timeout_ms ?? 15000),
      auto_retry_enabled: Number(row.auto_retry_enabled ?? 1) === 1,
      max_retry_attempts: Number(row.max_retry_attempts ?? 3),
      retry_backoff_strategy: (row.retry_backoff_strategy ?? 'EXPONENTIAL') as RetryBackoffStrategy,
      initial_retry_delay_ms: Number(row.initial_retry_delay_ms ?? 1500),
      max_retry_delay_ms: Number(row.max_retry_delay_ms ?? 30000),
    });
  }

  private async loadSecrets(targetId: string) {
    this.loadingSecrets.set(true);
    try {
      const secret = await this.api.targetSecretsGet(targetId);
      this.authType.set((secret?.authType ?? 'none') as AuthType);
      this.username.set(secret?.username ?? '');
      this.password.set(secret?.password ?? '');
      this.token.set(secret?.token ?? '');
      this.apiKeyName.set(secret?.apiKeyName ?? 'X-API-Key');
      this.apiKeyValue.set(secret?.apiKeyValue ?? '');
      this.allowInsecureTls.set(!!secret?.allowInsecureTls);
    } catch {
      this.authType.set('none');
      this.username.set('');
      this.password.set('');
      this.token.set('');
      this.apiKeyName.set('X-API-Key');
      this.apiKeyValue.set('');
      this.allowInsecureTls.set(false);
    } finally {
      this.loadingSecrets.set(false);
    }
  }

  private buildTargetDto() {
    const raw = this.form.getRawValue();
    return {
      name: raw.name.trim(),
      type: raw.type,
      base_url: raw.base_url.trim(),
      enabled: raw.enabled ? 1 : 0,
      request_timeout_ms: Number(raw.request_timeout_ms),
      auto_retry_enabled: raw.auto_retry_enabled ? 1 : 0,
      max_retry_attempts: Number(raw.max_retry_attempts),
      retry_backoff_strategy: raw.retry_backoff_strategy,
      initial_retry_delay_ms: Number(raw.initial_retry_delay_ms),
      max_retry_delay_ms: Number(raw.max_retry_delay_ms),
    };
  }

  private async refreshPersistedRow(id: string) {
    const rows = await this.api.targetsList();
    return ((rows ?? []) as TargetRow[]).find((row) => row.id === id) ?? null;
  }
}
