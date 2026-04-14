import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';

import { PlatformApiService } from '../../core/platform/platform-api.service';
import { TargetDialog } from '../../shared/dialogs/target-dialog/target-dialog';

type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

type TargetStarter = {
  type: TargetType;
  label: string;
  description: string;
  defaultName: string;
  defaultBaseUrl: string;
  metadataNotes: string[];
  operationalDefaults: {
    requestTimeoutMs: number;
    autoRetry: string;
    maxAttempts: number;
    backoffStrategy: string;
    baseDelayMs: number;
    maxDelayMs: number;
  };
};

@Component({
  selector: 'app-targets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  templateUrl: './targets.html',
  styleUrl: './targets.scss',
})
export class Targets {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly starters: TargetStarter[] = [
    {
      type: 'DHIS2',
      label: 'DHIS2 target',
      description: 'Tracker / Event API connector with event-oriented mapping defaults.',
      defaultName: 'DHIS2 Production',
      defaultBaseUrl: 'https://dhis2.example.org/api',
      metadataNotes: [
        'Use the root API URL instead of a specific endpoint when possible.',
        'Keep program, stage, and org unit assumptions in mappings instead of embedding them in the URL.',
      ],
      operationalDefaults: {
        requestTimeoutMs: 15000,
        autoRetry: 'Enabled',
        maxAttempts: 3,
        backoffStrategy: 'EXPONENTIAL',
        baseDelayMs: 1500,
        maxDelayMs: 30000,
      },
    },
    {
      type: 'OPENMRS',
      label: 'OpenMRS target',
      description: 'Clinical result delivery into OpenMRS REST endpoints.',
      defaultName: 'OpenMRS Staging',
      defaultBaseUrl: 'https://openmrs.example.org/ws/rest/v1',
      metadataNotes: [
        'Keep encounter and observation shaping in mappings rather than baking it into the URL.',
        'Save credentials under connector security instead of embedding them in the endpoint.',
      ],
      operationalDefaults: {
        requestTimeoutMs: 20000,
        autoRetry: 'Enabled',
        maxAttempts: 3,
        backoffStrategy: 'EXPONENTIAL',
        baseDelayMs: 2000,
        maxDelayMs: 45000,
      },
    },
    {
      type: 'LIS',
      label: 'LIS target',
      description: 'Laboratory system endpoint using result and specimen-oriented payloads.',
      defaultName: 'LIS Inbound',
      defaultBaseUrl: 'https://lis.example.org/api',
      metadataNotes: [
        'Pair this starter with the LIS mapping template so result and specimen fields are ready.',
        'Confirm accession number, result code, and result value mapping before live send.',
      ],
      operationalDefaults: {
        requestTimeoutMs: 12000,
        autoRetry: 'Enabled',
        maxAttempts: 5,
        backoffStrategy: 'LINEAR',
        baseDelayMs: 1000,
        maxDelayMs: 15000,
      },
    },
    {
      type: 'CUSTOM_HTTP',
      label: 'Custom HTTP target',
      description: 'Generic JSON connector for partner APIs with a stable contract.',
      defaultName: 'Partner Endpoint',
      defaultBaseUrl: 'https://partner.example.org/inbound/results',
      metadataNotes: [
        'Use this starter when the remote API is not DHIS2, OpenMRS, or LIS-specific.',
        'Keep the partner contract in mappings and validate it with the connector harness before go-live.',
      ],
      operationalDefaults: {
        requestTimeoutMs: 10000,
        autoRetry: 'Disabled by default',
        maxAttempts: 1,
        backoffStrategy: 'FIXED',
        baseDelayMs: 1000,
        maxDelayMs: 1000,
      },
    },
  ];

  loading = signal(false);
  rows = signal<any[]>([]);
  selected = signal<any | null>(null);

  preview = signal<any | null>(null);
  previewLoading = signal(false);
  normalizedResultId = '';

  secretLoading = signal(false);
  savingSecrets = signal(false);
  testing = signal(false);
  diagnostics = signal<string | null>(null);
  diagnosticsDetails = signal<any | null>(null);

  showToken = signal(false);
  showPassword = signal(false);
  showApiKeyValue = signal(false);

  authType: 'none' | 'bearer' | 'basic' | 'api_key' = 'none';
  username = '';
  password = '';
  token = '';
  apiKeyName = '';
  apiKeyValue = '';
  allowInsecureTls = false;

  cols: string[] = ['target', 'type', 'status', 'updated', 'actions'];

  constructor() {
    this.refresh();
  }

  starterFor(type?: string | null) {
    return this.starters.find((item) => item.type === type) ?? null;
  }

  selectedStarter() {
    return this.starterFor(this.selected()?.type ?? null);
  }

  async refresh() {
    try {
      this.loading.set(true);
      const rows = await this.api.targetsList();
      this.rows.set(rows ?? []);

      const current = this.selected();
      if (current) {
        const still = (rows ?? []).find((r: any) => r.id === current.id) ?? null;
        this.selected.set(still);
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load targets', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  async openCreate(type?: TargetType) {
    const starter = type ? this.starterFor(type) : null;

    const ref = this.dialog.open(TargetDialog, {
      width: 'min(820px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: {
        mode: 'create',
        defaults: starter
          ? {
            type: starter.type,
            name: starter.defaultName,
            base_url: starter.defaultBaseUrl,
            enabled: 1,
          }
          : undefined,
        presetLabel: starter?.label,
        presetNotes: starter?.metadataNotes ?? [],
        recommendedOperationalDefaults: starter?.operationalDefaults ?? null,
      },
    });

    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;

    try {
      await this.api.targetsCreate(result);
      this.snack.open(
        starter ? `${starter.label} created from recommended defaults` : 'Target created',
        'Close',
        { duration: 2200 },
      );
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to create target', 'Close', {
        duration: 3500,
      });
    }
  }

  async openEdit(row: any) {
    const ref = this.dialog.open(TargetDialog, {
      width: 'min(820px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { mode: 'edit', row },
    });

    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;

    try {
      await this.api.targetsUpdate(row.id, result);
      this.snack.open('Target updated', 'Close', { duration: 1800 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to update target', 'Close', {
        duration: 3500,
      });
    }
  }

  async remove(row: any) {
    if (!confirm(`Delete target "${row.name}"?`)) return;

    try {
      await this.api.targetsDelete(row.id);

      if (this.selected()?.id === row.id) {
        this.selected.set(null);
        this.preview.set(null);
        this.diagnostics.set(null);
        this.diagnosticsDetails.set(null);
      }

      this.snack.open('Target deleted', 'Close', { duration: 1800 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to delete target', 'Close', {
        duration: 3500,
      });
    }
  }

  async selectRow(row: any) {
    this.selected.set(row);
    this.preview.set(null);
    this.diagnostics.set(null);
    this.diagnosticsDetails.set(null);
    await this.loadSecrets(row.id);
  }

  async loadSecrets(targetId: string) {
    try {
      this.secretLoading.set(true);
      const secret = await this.api.targetSecretsGet(targetId);

      this.authType = secret?.authType ?? 'none';
      this.username = secret?.username ?? '';
      this.password = secret?.password ?? '';
      this.token = secret?.token ?? '';
      this.apiKeyName = secret?.apiKeyName ?? '';
      this.apiKeyValue = secret?.apiKeyValue ?? '';
      this.allowInsecureTls = !!secret?.allowInsecureTls;

      this.showToken.set(false);
      this.showPassword.set(false);
      this.showApiKeyValue.set(false);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load connector secrets', 'Close', {
        duration: 3500,
      });
    } finally {
      this.secretLoading.set(false);
    }
  }

  async saveSecrets() {
    const target = this.selected();
    if (!target?.id) {
      this.snack.open('Select a target first.', 'Close', { duration: 2200 });
      return;
    }

    try {
      this.savingSecrets.set(true);

      await this.api.targetSecretsSave(target.id, {
        authType: this.authType,
        username: this.username || null,
        password: this.password || null,
        token: this.token || null,
        apiKeyName: this.apiKeyName || null,
        apiKeyValue: this.apiKeyValue || null,
        allowInsecureTls: this.allowInsecureTls,
      });

      this.snack.open('Connector secrets saved', 'Close', { duration: 1800 });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to save connector secrets', 'Close', {
        duration: 3500,
      });
    } finally {
      this.savingSecrets.set(false);
    }
  }

  async testConnection() {
    const target = this.selected();
    if (!target?.id) {
      this.snack.open('Select a target first.', 'Close', { duration: 2200 });
      return;
    }

    try {
      this.testing.set(true);
      this.diagnostics.set(null);
      this.diagnosticsDetails.set(null);

      const result = await this.api.targetsTest(target.id);
      this.diagnostics.set(
        result?.message ?? (result?.ok ? 'Connection successful' : 'Connection failed'),
      );
      this.diagnosticsDetails.set(result?.details ?? null);

      this.snack.open(result?.ok ? 'Connection successful' : 'Connection failed', 'Close', {
        duration: 2200,
      });
    } catch (e: any) {
      this.diagnostics.set(e?.message ?? 'Connection failed');
      this.diagnosticsDetails.set(null);
      this.snack.open(e?.message ?? 'Connection test failed', 'Close', {
        duration: 3500,
      });
    } finally {
      this.testing.set(false);
    }
  }

  async previewTransform() {
    const target = this.selected();
    if (!target?.id) {
      this.snack.open('Select a target first.', 'Close', { duration: 2200 });
      return;
    }

    if (!this.normalizedResultId.trim()) {
      this.snack.open('Enter a normalized result ID.', 'Close', { duration: 2200 });
      return;
    }

    try {
      this.previewLoading.set(true);
      const result = await this.api.targetTransformPreview(
        target.id,
        this.normalizedResultId.trim(),
      );
      this.preview.set(result);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to generate preview', 'Close', {
        duration: 3500,
      });
    } finally {
      this.previewLoading.set(false);
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

  prettyJson(value: any) {
    try {
      return JSON.stringify(value ?? {}, null, 2);
    } catch {
      return String(value);
    }
  }

  statusClass(enabled?: number | null) {
    return enabled === 1 ? 'ok' : 'bad';
  }
}