import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Inject, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PlatformApiService } from '../../../core/platform/platform-api.service';

type LogRow = {
  id: string;
  machine_id: string;
  direction: 'inbound' | 'outbound' | 'system';
  transport: string;
  protocol: string;
  event_type: string;
  payload?: string | null;
  payload_preview?: string | null;
  parsed_message_id?: string | null;
  normalized_result_id?: string | null;
  processing_status?: string | null;
  processing_message?: string | null;
  session_id?: string | null;
  session_mode?: string | null;
  replay_of_log_id?: string | null;
  replay_mode?: string | null;
  created_at: string;
};

type DialogData = {
  machine: any;
};

type DirectionFilter = 'ALL' | 'inbound' | 'outbound' | 'system';
type EventFilter =
  | 'ALL'
  | 'payload'
  | 'connected'
  | 'disconnected'
  | 'parse_success'
  | 'parse_error'
  | 'replay'
  | 'test'
  | 'error';

@Component({
  selector: 'app-machine-logs-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './machine-logs-dialog.html',
  styleUrl: './machine-logs-dialog.scss',
})
export class MachineLogsDialog {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private ref = inject(MatDialogRef<MachineLogsDialog>);

  logs = signal<LogRow[]>([]);
  loading = signal(false);
  limit = signal(50);
  lastRefreshed = signal<string | null>(null);
  search = signal('');
  directionFilter = signal<DirectionFilter>('ALL');
  eventFilter = signal<EventFilter>('ALL');
  selectedLogId = signal<string | null>(null);
  replaying = signal(false);

  filteredLogs = computed(() => {
    const search = this.search().trim().toLowerCase();
    const direction = this.directionFilter();
    const event = this.eventFilter();

    return this.logs().filter((log) => {
      const matchesSearch =
        !search ||
        [
          log.direction,
          log.transport,
          log.protocol,
          log.event_type,
          log.payload_preview ?? '',
          log.payload ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(search);

      const matchesDirection = direction === 'ALL' || log.direction === direction;
      const matchesEvent = event === 'ALL' || log.event_type === event;

      return matchesSearch && matchesDirection && matchesEvent;
    });
  });

  selectedLog = computed(() => {
    const id = this.selectedLogId();
    const filtered = this.filteredLogs();
    if (!filtered.length) return null;
    if (!id) return filtered[0];
    return filtered.find((log) => log.id === id) ?? filtered[0];
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.refresh();

    const off = this.api.onMachinesRuntimeEvent((event: any) => {
      if (event?.machineId === this.data.machine?.id) {
        this.refresh();
      }
    });

    this.destroyRef.onDestroy(() => off?.());
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

  relativeTime(value?: string | null) {
    if (!value) return '—';
    const diffMs = Date.now() - new Date(value).getTime();
    if (Number.isNaN(diffMs) || diffMs < 0) return 'just now';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  async refresh() {
    if (!this.data.machine?.id) return;
    try {
      this.loading.set(true);
      const rows = await this.api.machinesLogsList(this.data.machine.id, this.limit());
      this.logs.set(rows ?? []);
      this.lastRefreshed.set(new Date().toISOString());
      const first = (rows ?? [])[0]?.id ?? null;
      if (first && !this.selectedLogId()) {
        this.selectedLogId.set(first);
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load logs', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  async clear() {
    if (!this.data.machine?.id) return;
    if (!confirm(`Clear traffic logs for "${this.data.machine?.name}"?`)) return;

    try {
      await this.api.machinesLogsClear(this.data.machine.id);
      this.logs.set([]);
      this.selectedLogId.set(null);
      this.snack.open('Traffic logs cleared', 'Close', { duration: 1800 });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to clear logs', 'Close', {
        duration: 3500,
      });
    }
  }

  setLimit(value: number) {
    this.limit.set(Number(value) || 50);
    this.refresh();
  }

  clearFilters() {
    this.search.set('');
    this.directionFilter.set('ALL');
    this.eventFilter.set('ALL');
  }

  selectLog(log: LogRow) {
    this.selectedLogId.set(log.id);
  }

  async copy(text: string) {
    try {
      await this.api.copy(text);
      this.snack.open('Copied to clipboard', 'Close', { duration: 1200 });
    } catch {
      this.snack.open('Failed to copy', 'Close', { duration: 2000 });
    }
  }

  payloadText(log: LogRow | null) {
    return log?.payload ?? log?.payload_preview ?? '—';
  }

  canReplay(log: LogRow | null) {
    return !!log?.payload && log.direction !== 'outbound';
  }

  statusBadgeClass(status?: string | null) {
    const value = String(status ?? '').toUpperCase();
    if (value.includes('ERROR')) return 'status-badge--error';
    if (value.includes('EMPTY') || value.includes('WARN')) return 'status-badge--warning';
    if (value.includes('NORMALIZED') || value.includes('PARSED')) return 'status-badge--success';
    return 'status-badge--neutral';
  }

  async replaySelected(mode: 'PARSE_ONLY' | 'PARSE_AND_NORMALIZE' | 'FULL_WORKFLOW') {
    const log = this.selectedLog();
    if (!log?.id || !this.canReplay(log)) return;
    try {
      this.replaying.set(true);
      const result = await this.api.machinesLogsReplay(log.id, mode);
      this.snack.open(result?.ok ? 'Replay completed' : 'Replay completed with warnings', 'Close', { duration: 2600 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Replay failed', 'Close', { duration: 3500 });
    } finally {
      this.replaying.set(false);
    }
  }

  close() {
    this.ref.close();
  }
}
