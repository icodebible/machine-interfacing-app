import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';

import { PlatformApiService } from '../../core/platform/platform-api.service';
import { TargetDialog } from '../../shared/dialogs/target-dialog/target-dialog';

type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
type DialogSection = 'overview' | 'security' | 'preview';

type TargetStarter = {
  type: TargetType;
  label: string;
  description: string;
  defaultName: string;
  defaultBaseUrl: string;
  metadataNotes: string[];
  operationalDefaults: {
    requestTimeoutMs: number;
    autoRetry: boolean;
    maxAttempts: number;
    backoffStrategy: 'FIXED' | 'LINEAR' | 'EXPONENTIAL';
    baseDelayMs: number;
    maxDelayMs: number;
  };
};

type TargetRow = {
  id: string;
  type: TargetType;
  name: string;
  base_url: string;
  enabled: number;
  auto_retry_enabled?: number | null;
  max_retry_attempts?: number | null;
  retry_backoff_strategy?: string | null;
  initial_retry_delay_ms?: number | null;
  max_retry_delay_ms?: number | null;
  request_timeout_ms?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  created_by_username?: string | null;
  updated_by_username?: string | null;
};

type TargetDialogResult = {
  changed?: boolean;
  focusId?: string | null;
};

@Component({
  selector: 'app-targets',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './targets.html',
  styleUrl: './targets.scss',
})
export class Targets {
  private readonly api = inject(PlatformApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly cols = ['target', 'delivery', 'status', 'actions'];
  readonly detailCols = ['expandedDetail'];

  readonly loading = signal(false);
  readonly rows = signal<TargetRow[]>([]);
  readonly expandedId = signal<string | null>(null);
  readonly showStarters = signal(false);

  readonly starters: TargetStarter[] = [
    {
      type: 'DHIS2',
      label: 'DHIS2 target',
      description: 'Tracker and event API connector for DHIS2-bound payloads and mapped outbound JSON.',
      defaultName: 'DHIS2 Production',
      defaultBaseUrl: 'https://dhis2.example.org/api',
      metadataNotes: [
        'Use the root API URL instead of a deeply nested endpoint path.',
        'Keep program, stage, and org unit shaping in mappings instead of embedding them in the URL.',
      ],
      operationalDefaults: {
        requestTimeoutMs: 15000,
        autoRetry: true,
        maxAttempts: 3,
        backoffStrategy: 'EXPONENTIAL',
        baseDelayMs: 1500,
        maxDelayMs: 30000,
      },
    },
    {
      type: 'OPENMRS',
      label: 'OpenMRS target',
      description: 'Clinical result delivery into OpenMRS REST endpoints with mapping-driven payload shaping.',
      defaultName: 'OpenMRS Staging',
      defaultBaseUrl: 'https://openmrs.example.org/ws/rest/v1',
      metadataNotes: [
        'Keep encounter and observation shaping in mappings rather than baking it into the endpoint URL.',
        'Store credentials in connector security, not in the endpoint value.',
      ],
      operationalDefaults: {
        requestTimeoutMs: 20000,
        autoRetry: true,
        maxAttempts: 3,
        backoffStrategy: 'EXPONENTIAL',
        baseDelayMs: 2000,
        maxDelayMs: 45000,
      },
    },
    {
      type: 'LIS',
      label: 'LIS target',
      description: 'Result and specimen-oriented delivery for laboratory systems with stable inbound contracts.',
      defaultName: 'LIS Inbound',
      defaultBaseUrl: 'https://lis.example.org/api',
      metadataNotes: [
        'Pair this starter with the LIS mapping template so specimen and result fields are aligned.',
        'Confirm accession number, result code, and result value mapping before live send.',
      ],
      operationalDefaults: {
        requestTimeoutMs: 12000,
        autoRetry: true,
        maxAttempts: 5,
        backoffStrategy: 'LINEAR',
        baseDelayMs: 1000,
        maxDelayMs: 15000,
      },
    },
    {
      type: 'CUSTOM_HTTP',
      label: 'Custom HTTP target',
      description: 'Generic HTTP JSON endpoint for partner systems and custom payload contracts.',
      defaultName: 'Partner Endpoint',
      defaultBaseUrl: 'https://partner.example.org/inbound/results',
      metadataNotes: [
        'Use mappings to shape the exact outbound body expected by the receiving system.',
        'Keep partner-specific authentication material in the security section.',
      ],
      operationalDefaults: {
        requestTimeoutMs: 10000,
        autoRetry: true,
        maxAttempts: 4,
        backoffStrategy: 'EXPONENTIAL',
        baseDelayMs: 1000,
        maxDelayMs: 20000,
      },
    },
  ];

  readonly summary = computed(() => {
    const rows = this.rows();
    const enabled = rows.filter((row) => Number(row.enabled) === 1).length;
    const disabled = rows.length - enabled;
    const retryReady = rows.filter((row) => Number(row.auto_retry_enabled ?? 1) === 1).length;
    const configuredTypes = new Set(rows.map((row) => row.type)).size;

    return {
      total: rows.length,
      enabled,
      disabled,
      configuredTypes,
      retryReady,
    };
  });

  constructor() {
    void this.refresh();
  }

  async refresh() {
    this.loading.set(true);
    try {
      const rows = await this.api.targetsList();
      this.rows.set((rows ?? []) as TargetRow[]);
    } catch (error: any) {
      this.snack.open(error?.message || 'Failed to load targets.', 'Close', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }

  toggleStarters() {
    this.showStarters.update((value) => !value);
  }

  openCreate(starter?: TargetStarter) {
    const ref = this.dialog.open(TargetDialog, {
      width: '980px',
      maxWidth: '96vw',
      autoFocus: false,
      data: {
        mode: 'create',
        startSection: 'overview',
        defaults: starter
          ? {
            name: starter.defaultName,
            type: starter.type,
            base_url: starter.defaultBaseUrl,
            enabled: 1,
          }
          : undefined,
        recommendedOperationalDefaults: starter?.operationalDefaults,
        presetLabel: starter?.label,
        presetNotes: starter?.metadataNotes,
      },
    });

    void firstValueFrom(ref.afterClosed()).then(async (result: TargetDialogResult | undefined) => {
      if (!result?.changed) {
        return;
      }

      await this.refresh();

      if (result.focusId) {
        this.expandedId.set(result.focusId);
      }
    });
  }

  openWorkspace(row: TargetRow, startSection: DialogSection = 'overview') {
    const ref = this.dialog.open(TargetDialog, {
      width: '980px',
      maxWidth: '96vw',
      autoFocus: false,
      data: {
        mode: 'edit',
        row,
        startSection,
      },
    });

    void firstValueFrom(ref.afterClosed()).then(async (result: TargetDialogResult | undefined) => {
      if (!result?.changed) {
        return;
      }

      await this.refresh();

      if (result.focusId) {
        this.expandedId.set(result.focusId);
      }
    });
  }

  async remove(row: TargetRow) {
    const ok = confirm(`Delete target "${row.name}"? This will not remove historical queue or audit records already created.`);
    if (!ok) {
      return;
    }

    try {
      await this.api.targetsDelete(row.id);
      this.snack.open('Target removed.', 'Close', { duration: 2500 });

      if (this.expandedId() === row.id) {
        this.expandedId.set(null);
      }

      await this.refresh();
    } catch (error: any) {
      this.snack.open(error?.message || 'Failed to delete target.', 'Close', { duration: 3500 });
    }
  }

  toggleExpanded(row: TargetRow) {
    this.expandedId.update((current) => (current === row.id ? null : row.id));
  }

  statusClass(enabled: number) {
    return Number(enabled) === 1 ? 'ok' : 'bad';
  }

  formatRetry(row: TargetRow) {
    if (Number(row.auto_retry_enabled ?? 1) !== 1) {
      return 'Retry disabled';
    }

    const attempts = row.max_retry_attempts ?? 0;
    const strategy = row.retry_backoff_strategy || 'EXPONENTIAL';
    return `${attempts} attempts · ${strategy}`;
  }

  formatTimeout(row: TargetRow) {
    const timeout = row.request_timeout_ms ?? 15000;
    return `${timeout.toLocaleString()} ms timeout`;
  }

  formatBackoff(row: TargetRow) {
    if (Number(row.auto_retry_enabled ?? 1) !== 1) {
      return 'No retry backoff applied';
    }

    const initial = row.initial_retry_delay_ms ?? 0;
    const max = row.max_retry_delay_ms ?? 0;
    return `${initial.toLocaleString()} → ${max.toLocaleString()} ms`;
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

  relativeTime(value?: string | null) {
    if (!value) {
      return '—';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const diffMs = Date.now() - date.getTime();
    const minutes = Math.round(diffMs / 60000);

    if (minutes < 1) {
      return 'Just now';
    }
    if (minutes < 60) {
      return `${minutes} min ago`;
    }

    const hours = Math.round(minutes / 60);
    if (hours < 24) {
      return `${hours} hr ago`;
    }

    const days = Math.round(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  trackById = (_index: number, row: TargetRow) => row.id;
}
