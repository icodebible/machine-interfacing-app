import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlatformApiService } from '../../core/platform/platform-api.service';
import { MachineLogsDialog } from '../../shared/dialogs/machine-logs-dialog/machine-logs-dialog';

type RuntimeStatus = 'connected' | 'connecting' | 'error' | 'idle' | 'stopped' | 'disconnected';

type RuntimeFilter =
  | 'ALL'
  | 'CONNECTED'
  | 'CONNECTING'
  | 'ATTENTION'
  | 'IDLE'
  | 'STOPPED'
  | 'DISCONNECTED';

type ActivityFilter =
  | 'ALL'
  | 'RECENT_ACTIVITY'
  | 'SIMULATING'
  | 'HAS_PARSED'
  | 'HAS_NORMALIZED'
  | 'ATTENTION';

type ConnectionFilter = 'ALL' | 'TCP' | 'SERIAL' | 'HL7_MLLP' | 'FTP' | 'SFTP' | 'FILE_WATCHER';

interface RecentLogRow {
  id: string;
  direction: 'inbound' | 'outbound' | 'system';
  eventType: string;
  payloadPreview: string | null;
  createdAt: string | null;
}

interface RecentSessionRow {
  id: string;
  mode: string;
  status: string;
  startedAt: string | null;
  stoppedAt: string | null;
  lastActivityAt: string | null;
  message: string | null;
}

interface LiveMonitorRow {
  id: string;
  name: string;
  code: string | null;
  labName: string | null;
  brand: string | null;
  model: string | null;
  connectionType: ConnectionFilter extends infer T ? Exclude<T, 'ALL'> | string : string;
  protocol: 'ASTM' | 'HL7' | 'RAW';
  isActive: number;

  runtimeStatus: RuntimeStatus;
  runtimeMessage: string | null;
  runtimeUpdatedAt: string | null;

  simulationRunning: boolean;
  simulationScenario: 'ASTM_BASIC' | 'HL7_ORU' | 'HL7_COBAS_HPV_FINAL_RESULT' | 'ASTM_COBAS_HPV_FINAL_RESULT' | 'RAW_PING' | null;
  simulationIntervalMs: number | null;
  simulationUpdatedAt: string | null;

  latestTrafficPreview: string | null;
  latestTrafficAt: string | null;
  recentLogs: RecentLogRow[];
  recentSessions: RecentSessionRow[];
  activeSessionId: string | null;
  latestProcessingStatus: string | null;

  parsedRecentCount: number;
  normalizedRecentCount: number;
  latestParsedAt: string | null;
  latestNormalizedAt: string | null;
}

@Component({
  selector: 'app-live-monitor',
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
    MatSidenavModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './live-monitor.html',
  styleUrl: './live-monitor.scss',
})
export class LiveMonitor {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);

  drawer = viewChild.required(MatDrawer);

  loading = signal(false);
  rows = signal<LiveMonitorRow[]>([]);
  expandedId = signal<string | null>(null);
  selectedId = signal<string | null>(null);
  drawerMode = signal<'side' | 'over'>('side');

  q = signal('');
  runtimeFilter = signal<RuntimeFilter>('ALL');
  connFilter = signal<ConnectionFilter>('ALL');
  activityFilter = signal<ActivityFilter>('ALL');

  cols: string[] = ['machine', 'runtime', 'simulation', 'activity', 'traffic', 'actions'];
  detailCols: string[] = ['expandedDetail'];

  selected = computed(() => {
    const id = this.selectedId();
    if (!id) return null;
    return this.rows().find((row) => row.id === id) ?? null;
  });

  summary = computed(() => {
    const rows = this.rows();
    return {
      total: rows.length,
      connected: rows.filter((row) => row.runtimeStatus === 'connected').length,
      simulations: rows.filter((row) => row.simulationRunning).length,
      recentActivity: rows.filter((row) => this.hasRecentActivity(row)).length,
      attention: rows.filter((row) => this.needsAttention(row)).length,
    };
  });

  filtered = computed(() => {
    const query = this.q().trim().toLowerCase();
    const runtime = this.runtimeFilter();
    const conn = this.connFilter();
    const activity = this.activityFilter();

    return this.rows().filter((row) => {
      const matchesQuery =
        !query ||
        [
          row.name,
          row.code ?? '',
          row.labName ?? '',
          row.brand ?? '',
          row.model ?? '',
          row.connectionType,
          row.protocol,
          row.runtimeMessage ?? '',
          row.latestTrafficPreview ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(query);

      const matchesRuntime = this.matchesRuntimeFilter(row, runtime);
      const matchesConn = conn === 'ALL' || row.connectionType === conn;
      const matchesActivity = this.matchesActivityFilter(row, activity);

      return matchesQuery && matchesRuntime && matchesConn && matchesActivity;
    });
  });

  constructor() {
    this.refresh();
    this.updateDrawerMode();

    const onResize = () => this.updateDrawerMode();
    window.addEventListener('resize', onResize);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));

    const off = this.api.onMachinesRuntimeEvent((event: any) => {
      if (event?.type === 'state') {
        this.patchRuntimeState(
          event.machineId,
          event.status,
          event.message ?? null,
          event.updatedAt,
        );
      }

      if (event?.type === 'traffic') {
        this.patchTraffic(event.machineId, event.payloadPreview ?? null, event.updatedAt);
      }
    });

    this.destroyRef.onDestroy(() => off());
  }

  async refresh() {
    try {
      this.loading.set(true);

      const [machines, runtimeStates, simStates] = await Promise.all([
        this.api.machinesList(),
        this.api.machinesRuntimeStates(),
        this.api.machinesSimStates(),
      ]);

      const runtimeMap = new Map(
        (runtimeStates ?? []).map((state: any) => [state.machineId, state]),
      );
      const simMap = new Map((simStates ?? []).map((state: any) => [state.machineId, state]));

      const activitySettled = await Promise.allSettled(
        (machines ?? []).map(async (machine: any) => {
          const [logs, parsed, normalized, sessions] = await Promise.all([
            this.api.machinesLogsList(machine.id, 8),
            this.api.machinesParsedList(machine.id, 20),
            this.api.machinesNormalizedList(machine.id, 20),
            this.api.machinesRuntimeSessionsList(machine.id, 5),
          ]);

          return {
            machineId: machine.id,
            logs: logs ?? [],
            parsed: parsed ?? [],
            normalized: normalized ?? [],
            sessions: sessions ?? [],
          };
        }),
      );

      const activityMap = new Map<string, { logs: any[]; parsed: any[]; normalized: any[]; sessions: any[] }>();
      let failedSources = 0;

      for (const settled of activitySettled) {
        if (settled.status === 'fulfilled') {
          activityMap.set(settled.value.machineId, {
            logs: settled.value.logs,
            parsed: settled.value.parsed,
            normalized: settled.value.normalized,
            sessions: settled.value.sessions,
          });
        } else {
          failedSources += 1;
        }
      }

      const rows: LiveMonitorRow[] = (machines ?? []).map((machine: any) => {
        const runtime = runtimeMap.get(machine.id);
        const sim = simMap.get(machine.id);
        const activity = activityMap.get(machine.id) ?? { logs: [], parsed: [], normalized: [], sessions: [] };
        const latestLog = activity.logs[0] ?? null;
        const latestParsed = activity.parsed[0] ?? null;
        const latestNormalized = activity.normalized[0] ?? null;

        return {
          id: machine.id,
          name: machine.name,
          code: machine.code ?? null,
          labName: machine.lab_name ?? null,
          brand: machine.brand ?? null,
          model: machine.model ?? null,
          connectionType: machine.connection_type,
          protocol: machine.protocol,
          isActive: machine.is_active,

          runtimeStatus: (runtime?.status ?? 'disconnected') as RuntimeStatus,
          runtimeMessage: runtime?.message ?? null,
          runtimeUpdatedAt: runtime?.updatedAt ?? null,

          simulationRunning: !!sim?.running,
          simulationScenario: sim?.scenario ?? null,
          simulationIntervalMs: sim?.intervalMs ?? null,
          simulationUpdatedAt: sim?.updatedAt ?? null,

          latestTrafficPreview: latestLog?.payload_preview ?? latestLog?.payload ?? null,
          latestTrafficAt: latestLog?.created_at ?? null,
          recentLogs: (activity.logs ?? []).map((log: any) => ({
            id: log.id,
            direction: log.direction,
            eventType: log.event_type,
            payloadPreview: log.payload_preview ?? null,
            createdAt: log.created_at ?? null,
          })),
          recentSessions: (activity.sessions ?? []).map((session: any) => ({
            id: session.id,
            mode: session.mode,
            status: session.status,
            startedAt: session.started_at ?? null,
            stoppedAt: session.stopped_at ?? null,
            lastActivityAt: session.last_activity_at ?? null,
            message: session.message ?? null,
          })),
          activeSessionId: (activity.sessions ?? []).find((session: any) => session.status === 'STARTED')?.id ?? null,
          latestProcessingStatus: latestLog?.processing_status ?? null,

          parsedRecentCount: (activity.parsed ?? []).length,
          normalizedRecentCount: (activity.normalized ?? []).length,
          latestParsedAt: latestParsed?.created_at ?? null,
          latestNormalizedAt: latestNormalized?.created_at ?? null,
        };
      });

      rows.sort((a, b) => {
        const aTime = this.latestActivityValue(a);
        const bTime = this.latestActivityValue(b);
        if (bTime !== aTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      });

      this.rows.set(rows);

      if (this.selectedId()) {
        const selectedStillExists = rows.some((row) => row.id === this.selectedId());
        if (!selectedStillExists) {
          this.selectedId.set(null);
          this.drawer().close();
        }
      }

      if (failedSources > 0) {
        this.snack.open(
          `Live Monitor loaded with ${failedSources} machine activity source${failedSources > 1 ? 's' : ''} skipped.`,
          'Close',
          { duration: 2600 },
        );
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load live monitor', 'Close', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }

  clearFilters() {
    this.q.set('');
    this.runtimeFilter.set('ALL');
    this.connFilter.set('ALL');
    this.activityFilter.set('ALL');
  }

  toggleExpanded(row: LiveMonitorRow) {
    this.expandedId.update((current) => (current === row.id ? null : row.id));
  }

  async openDetails(row: LiveMonitorRow) {
    this.selectedId.set(row.id);
    await this.drawer().open();
  }

  closeDetails() {
    this.drawer().close();
  }

  openLogs(row: LiveMonitorRow) {
    this.dialog.open(MachineLogsDialog, {
      width: 'min(1180px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      disableClose: false,
      panelClass: 'machine-logs-terminal-dialog',
      data: {
        machine: {
          id: row.id,
          name: row.name,
          protocol: row.protocol,
          connection_type: row.connectionType,
        },
      },
    });
  }

  async refreshMachine(row: LiveMonitorRow) {
    try {
      const [runtime, sim, logs, parsed, normalized, sessions] = await Promise.all([
        this.api.machinesRuntimeState(row.id),
        this.api.machinesSimState(row.id),
        this.api.machinesLogsList(row.id, 8),
        this.api.machinesParsedList(row.id, 20),
        this.api.machinesNormalizedList(row.id, 20),
        this.api.machinesRuntimeSessionsList(row.id, 5),
      ]);

      this.rows.update((rows) =>
        rows.map((item) => {
          if (item.id !== row.id) return item;
          const latestLog = logs?.[0] ?? null;
          return {
            ...item,
            runtimeStatus: (runtime?.status ?? item.runtimeStatus) as RuntimeStatus,
            runtimeMessage: runtime?.message ?? item.runtimeMessage,
            runtimeUpdatedAt: runtime?.updatedAt ?? item.runtimeUpdatedAt,
            simulationRunning: !!sim?.running,
            simulationScenario: sim?.scenario ?? null,
            simulationIntervalMs: sim?.intervalMs ?? null,
            simulationUpdatedAt: sim?.updatedAt ?? null,
            latestTrafficPreview: latestLog?.payload_preview ?? latestLog?.payload ?? null,
            latestTrafficAt: latestLog?.created_at ?? null,
            recentLogs: (logs ?? []).map((log: any) => ({
              id: log.id,
              direction: log.direction,
              eventType: log.event_type,
              payloadPreview: log.payload_preview ?? null,
              createdAt: log.created_at ?? null,
            })),
            recentSessions: (sessions ?? []).map((session: any) => ({
              id: session.id,
              mode: session.mode,
              status: session.status,
              startedAt: session.started_at ?? null,
              stoppedAt: session.stopped_at ?? null,
              lastActivityAt: session.last_activity_at ?? null,
              message: session.message ?? null,
            })),
            activeSessionId: (sessions ?? []).find((session: any) => session.status === 'STARTED')?.id ?? null,
            latestProcessingStatus: latestLog?.processing_status ?? null,
            parsedRecentCount: (parsed ?? []).length,
            normalizedRecentCount: (normalized ?? []).length,
            latestParsedAt: parsed?.[0]?.created_at ?? null,
            latestNormalizedAt: normalized?.[0]?.created_at ?? null,
          } satisfies LiveMonitorRow;
        }),
      );
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to refresh machine activity', 'Close', {
        duration: 3000,
      });
    }
  }

  async startRuntime(row: LiveMonitorRow) {
    try {
      await this.api.machinesRuntimeStart(row.id);
      this.snack.open('Runtime started', 'Close', { duration: 2000 });
      await this.refreshMachine(row);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to start runtime', 'Close', { duration: 3500 });
    }
  }

  async stopRuntime(row: LiveMonitorRow) {
    try {
      await this.api.machinesRuntimeStop(row.id);
      this.snack.open('Runtime stopped', 'Close', { duration: 2000 });
      await this.refreshMachine(row);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to stop runtime', 'Close', { duration: 3500 });
    }
  }

  async restartRuntime(row: LiveMonitorRow) {
    try {
      await this.api.machinesRuntimeRestart(row.id);
      this.snack.open('Runtime restarted', 'Close', { duration: 2000 });
      await this.refreshMachine(row);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to restart runtime', 'Close', { duration: 3500 });
    }
  }

  async startSimulation(row: LiveMonitorRow) {
    try {
      await this.api.machinesSimStart(row.id, this.defaultScenario(row), 5000);
      this.snack.open('Simulation started', 'Close', { duration: 2000 });
      await this.refreshMachine(row);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to start simulation', 'Close', { duration: 3500 });
    }
  }

  async stopSimulation(row: LiveMonitorRow) {
    try {
      await this.api.machinesSimStop(row.id);
      this.snack.open('Simulation stopped', 'Close', { duration: 2000 });
      await this.refreshMachine(row);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to stop simulation', 'Close', { duration: 3500 });
    }
  }

  async clearLogs(row: LiveMonitorRow) {
    if (!confirm(`Clear traffic logs for "${row.name}"?`)) return;

    try {
      await this.api.machinesLogsClear(row.id);
      this.snack.open('Traffic logs cleared', 'Close', { duration: 2000 });
      await this.refreshMachine(row);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to clear logs', 'Close', { duration: 3500 });
    }
  }

  runtimeClass(status?: RuntimeStatus | null): string {
    switch (status) {
      case 'connected':
        return 'ok';
      case 'connecting':
      case 'idle':
        return 'warn';
      case 'error':
        return 'bad';
      case 'stopped':
      case 'disconnected':
      default:
        return 'idle';
    }
  }

  activityClass(row: LiveMonitorRow): string {
    if (this.needsAttention(row)) return 'bad';
    if (this.hasRecentActivity(row)) return 'ok';
    return 'idle';
  }

  simulationClass(row: LiveMonitorRow): string {
    return row.simulationRunning ? 'ok' : 'idle';
  }

  activityLabel(row: LiveMonitorRow): string {
    if (this.needsAttention(row)) return 'Attention needed';
    if (this.hasRecentActivity(row)) return 'Recent activity';
    return 'Quiet';
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

  relativeTime(value?: string | null): string {
    if (!value) return '—';
    const diffMs = Date.now() - this.dateValue(value);
    if (diffMs < 0) return 'just now';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  trackById = (_: number, row: LiveMonitorRow) => row.id;

  private defaultScenario(row: LiveMonitorRow): 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING' {
    switch (row.protocol) {
      case 'HL7':
        return 'HL7_ORU';
      case 'RAW':
        return 'RAW_PING';
      case 'ASTM':
      default:
        return 'ASTM_BASIC';
    }
  }

  private matchesRuntimeFilter(row: LiveMonitorRow, filter: RuntimeFilter): boolean {
    if (filter === 'ALL') return true;
    if (filter === 'ATTENTION') return this.needsAttention(row);
    return row.runtimeStatus.toUpperCase() === filter;
  }

  private matchesActivityFilter(row: LiveMonitorRow, filter: ActivityFilter): boolean {
    switch (filter) {
      case 'ALL':
        return true;
      case 'RECENT_ACTIVITY':
        return this.hasRecentActivity(row);
      case 'SIMULATING':
        return row.simulationRunning;
      case 'HAS_PARSED':
        return row.parsedRecentCount > 0;
      case 'HAS_NORMALIZED':
        return row.normalizedRecentCount > 0;
      case 'ATTENTION':
        return this.needsAttention(row);
      default:
        return true;
    }
  }

  private hasRecentActivity(row: LiveMonitorRow): boolean {
    const cutoff = Date.now() - 10 * 60 * 1000;
    return [row.latestTrafficAt, row.latestParsedAt, row.latestNormalizedAt].some(
      (value) => this.dateValue(value) >= cutoff,
    );
  }

  private needsAttention(row: LiveMonitorRow): boolean {
    return (
      row.runtimeStatus === 'error' || (row.isActive === 1 && row.runtimeStatus === 'connecting')
    );
  }

  private latestActivityValue(row: LiveMonitorRow): number {
    return Math.max(
      this.dateValue(row.latestTrafficAt),
      this.dateValue(row.latestParsedAt),
      this.dateValue(row.latestNormalizedAt),
      this.dateValue(row.runtimeUpdatedAt),
    );
  }

  private dateValue(value?: string | null): number {
    const time = value ? new Date(value).getTime() : Number.NaN;
    return Number.isNaN(time) ? 0 : time;
  }

  private updateDrawerMode() {
    this.drawerMode.set(window.innerWidth < 1100 ? 'over' : 'side');
  }

  private patchRuntimeState(
    machineId: string,
    status: RuntimeStatus,
    message: string | null,
    updatedAt: string,
  ) {
    this.rows.update((rows) =>
      rows.map((row) =>
        row.id === machineId
          ? {
              ...row,
              runtimeStatus: status,
              runtimeMessage: message,
              runtimeUpdatedAt: updatedAt,
            }
          : row,
      ),
    );
  }

  private patchTraffic(machineId: string, payloadPreview: string | null, updatedAt: string) {
    this.rows.update((rows) =>
      rows.map((row) => {
        if (row.id !== machineId) return row;
        const liveLog: RecentLogRow = {
          id: `live-${machineId}-${updatedAt}`,
          direction: 'inbound',
          eventType: 'payload',
          payloadPreview,
          createdAt: updatedAt,
        };
        return {
          ...row,
          latestTrafficPreview: payloadPreview,
          latestTrafficAt: updatedAt,
          recentLogs: [liveLog, ...row.recentLogs].slice(0, 8),
        };
      }),
    );
  }
}
