import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { PlatformApiService } from '../../core/platform/platform-api.service';
import { MachineFormDialog } from '../../shared/dialogs/machine-form-dialog/machine-form-dialog';
import { MachineLogsDialog } from '../../shared/dialogs/machine-logs-dialog/machine-logs-dialog';
import { MachineSimulationDialog } from '../../shared/dialogs/machine-simulation-dialog/machine-simulation-dialog';
import { MachineParsedDialog } from '../../shared/dialogs/machine-parsed-dialog/machine-parsed-dialog';
import { MachineNormalizedDialog } from '../../shared/dialogs/machine-normalized-dialog/machine-normalized-dialog';

type FilterEnabled = 'all' | 'enabled' | 'disabled';
type FilterConn = 'all' | 'TCP' | 'SERIAL' | 'HL7_MLLP' | 'FTP' | 'SFTP' | 'FILE_WATCHER';

@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [
    CommonModule,

    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSidenavModule,
    MatMenuModule,
    MatDividerModule,

    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatPaginatorModule,
  ],
  templateUrl: './machines.html',
  styleUrl: './machines.scss',
})
export class Machines {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);
  drawer = viewChild.required(MatDrawer);

  cols = ['machine', 'lab', 'connection', 'status', 'actions'];

  loading = signal(false);

  runtimeStates = signal<Record<string, any>>({});
  latestTraffic = signal<Record<string, string>>({});
  machineLogs = signal<Record<string, any[]>>({});
  logsLoading = signal(false);

  simulationStates = signal<Record<string, any>>({});
  simulationScenario = signal<'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING'>('ASTM_BASIC');
  simulationIntervalMs = signal(5000);

  // Data
  machines = signal<any[]>([]);
  labs = signal<any[]>([]);

  // Filters
  q = signal('');
  enabled = signal<FilterEnabled>('all');
  conn = signal<FilterConn>('all');

  pageIndex = signal(0);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];

  // Drawer
  selected = signal<any | null>(null);
  drawerMode = signal<'side' | 'over'>('side');

  filtered = computed(() => {
    const query = this.q().trim().toLowerCase();
    const enabled = this.enabled();
    const conn = this.conn();

    return (
      this.machines()
        // .filter((m) => {
        //   if (enabled === 'enabled') return m.enabled === 1;
        //   if (enabled === 'disabled') return m.enabled === 0;
        //   return true;
        // })
        .filter((m) => {
          if (enabled === 'enabled') return m.is_active === 1;
          if (enabled === 'disabled') return m.is_active === 0;
          return true;
        })
        .filter((m) => (conn === 'all' ? true : m.connection_type === conn))
        .filter((m) => {
          if (!query) return true;
          const hay =
            `${m.name} ${m.code ?? ''} ${m.brand ?? ''} ${m.model ?? ''} ${m.lab_name ?? ''}`.toLowerCase();
          return hay.includes(query);
        })
    );
  });

  pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  constructor() {
    this.refreshAll();
    this.updateDrawerMode();

    const onResize = () => this.updateDrawerMode();
    window.addEventListener('resize', onResize);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));

    const off = this.api.onMachinesRuntimeEvent((event: any) => {
      if (event.type === 'state') {
        const map = { ...this.runtimeStates() };
        map[event.machineId] = {
          ...(map[event.machineId] ?? {}),
          status: event.status,
          message: event.message,
          updatedAt: event.updatedAt,
          machineId: event.machineId,
        };
        this.runtimeStates.set(map);
      }

      // if (event.type === 'traffic') {
      //   const map = { ...this.latestTraffic() };
      //   map[event.machineId] = event.payloadPreview;
      //   this.latestTraffic.set(map);
      // }

      if (event.type === 'traffic') {
        const trafficMap = { ...this.latestTraffic() };
        trafficMap[event.machineId] = event.payloadPreview;
        this.latestTraffic.set(trafficMap);

        // Optionally refresh selected machine logs
        if (this.selected()?.id === event.machineId) {
          this.loadMachineLogs(event.machineId, 30);
        }
      }
    });

    this.destroyRef.onDestroy(() => off());
  }

  async refreshSimulationStates() {
    try {
      const states = await this.api.machinesSimStates();
      const map: Record<string, any> = {};
      for (const s of states ?? []) {
        map[s.machineId] = s;
      }
      this.simulationStates.set(map);
    } catch { }
  }

  simOf(m: any) {
    return (
      this.simulationStates()[m.id] ?? {
        running: false,
        scenario: null,
        intervalMs: null,
      }
    );
  }

  logsOf(machineId: string | null | undefined) {
    if (!machineId) return [];
    return this.machineLogs()[machineId] ?? [];
  }

  async clearLogs(row: any | null | undefined) {
    if (!row?.id) return;
    if (!confirm(`Clear traffic logs for "${row.name}"?`)) return;

    try {
      await this.api.machinesLogsClear(row.id);
      const map = { ...this.machineLogs() };
      map[row.id] = [];
      this.machineLogs.set(map);
      this.snack.open('Traffic logs cleared', 'OK', { duration: 1800 });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to clear logs', 'OK', {
        duration: 3500,
      });
    }
  }

  trafficOf(m: any) {
    return this.latestTraffic()[m.id] ?? null;
  }

  private updateDrawerMode() {
    this.drawerMode.set(window.innerWidth < 900 ? 'over' : 'side');
  }

  async loadMachineLogs(machineId: string, limit = 30) {
    try {
      this.logsLoading.set(true);
      const rows = await this.api.machinesLogsList(machineId, limit);
      const map = { ...this.machineLogs() };
      map[machineId] = rows ?? [];
      this.machineLogs.set(map);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load machine logs', 'OK', { duration: 3500 });
    } finally {
      this.logsLoading.set(false);
    }
  }

  async refreshAll() {
    try {
      this.loading.set(true);

      const [labs, machines, runtimeStates, simulationStates] = await Promise.all([
        this.api.labsList(),
        this.api.machinesList(),
        this.api.machinesRuntimeStates(),
        this.api.machinesSimStates(),
      ]);

      this.labs.set(labs);
      this.machines.set(machines);
      this.ensureValidPage();

      const map: Record<string, any> = {};
      for (const s of runtimeStates ?? []) {
        map[s.machineId] = s;
      }
      this.runtimeStates.set(map);

      const simMap: Record<string, any> = {};
      for (const s of simulationStates ?? []) {
        simMap[s.machineId] = s;
      }
      this.simulationStates.set(simMap);

      const sel = this.selected();
      if (sel) {
        const still = machines.find((x: any) => x.id === sel.id) ?? null;
        this.selected.set(still);
        if (!still) this.drawer().close();
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load machines', 'OK', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  // --- Drawer ---
  // async viewDetails(row: any) {
  //   this.selected.set(row);
  //   await this.drawer().open();
  // }

  async viewDetails(row: any) {
    this.selected.set(row);
    await this.drawer().open();
    await this.loadMachineLogs(row.id, 30);
  }

  closeDetails() {
    this.drawer().close();
    this.selected.set(null);
  }

  // --- CRUD ---
  async openCreate() {
    const ref = this.dialog.open(MachineFormDialog, {
      width: '720px',
      maxWidth: '92vw',
      data: { mode: 'create', labs: this.labs() },
      autoFocus: false,
      disableClose: true,
    });

    const dto = await ref.afterClosed().toPromise();
    if (!dto) return;

    try {
      await this.api.machinesCreate(dto);
      this.snack.open('Machine created', 'OK', { duration: 2000 });
      await this.refreshAll();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Create failed', 'OK', { duration: 3500 });
    }
  }

  async openEdit(row: any) {
    console.log('WE DECIDE::: ', JSON.stringify(row));
    const ref = this.dialog.open(MachineFormDialog, {
      width: '720px',
      maxWidth: '92vw',
      data: { mode: 'edit', machine: row, labs: this.labs() },
      autoFocus: false,
      disableClose: true,
    });

    const dto = await ref.afterClosed().toPromise();
    if (!dto) return;

    try {
      await this.api.machinesUpdate(row.id, dto);
      this.snack.open('Machine updated', 'OK', { duration: 2000 });
      await this.refreshAll();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Update failed', 'OK', { duration: 3500 });
    }
  }

  async remove(row: any) {
    if (!confirm(`Delete machine "${row.name}"?`)) return;
    try {
      await this.api.machinesDelete(row.id);
      this.snack.open('Machine deleted', 'OK', { duration: 2000 });
      if (this.selected()?.id === row.id) {
        this.selected.set(null);
        this.drawer().close();
      }
      await this.refreshAll();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Delete failed', 'OK', { duration: 3500 });
    }
  }

  async toggleEnabled(row: any) {
    const next = row.is_active === 1 ? 0 : 1;

    try {
      await this.api.machinesUpdate(row.id, { is_active: next });
      this.snack.open(next ? 'Machine enabled' : 'Machine disabled', 'OK', {
        duration: 1600,
      });
      await this.refreshAll();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Action failed', 'OK', { duration: 3500 });
    }
  }

  // --- Actions ---
  async test(row: any) {
    try {
      const res = await this.api.machinesTest(row);
      this.snack.open(res?.message ?? (res?.ok ? 'Test OK' : 'Test failed'), 'OK', {
        duration: 2500,
      });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Test failed', 'OK', { duration: 3500 });
    }
  }

  async connect(row: any) {
    try {
      await this.api.machinesConnect(row.id);
      this.snack.open('Connect requested', 'OK', { duration: 1800 });
      // live status comes later; for now refresh
      await this.refreshAll();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Connect failed', 'OK', { duration: 3500 });
    }
  }

  async disconnect(row: any) {
    try {
      await this.api.machinesDisconnect(row.id);
      this.snack.open('Disconnect requested', 'OK', { duration: 1800 });
      await this.refreshAll();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Disconnect failed', 'OK', { duration: 3500 });
    }
  }

  async copy(text: string) {
    try {
      await this.api.copy(text); // your IPC clipboard solution
      this.snack.open('Copied to clipboard', 'OK', { duration: 1200 });
    } catch {
      this.snack.open('Failed to copy', 'OK', { duration: 2000 });
    }
  }

  async refreshRuntimeStates() {
    try {
      const states = await this.api.machinesRuntimeStates();
      const map: Record<string, any> = {};

      for (const s of states ?? []) {
        map[s.machineId] = s;
      }

      this.runtimeStates.set(map);
    } catch {
      // keep UI usable even if runtime service is not ready
    }
  }

  // Display helpers
  connLabel(m: any) {
    const t = m.connection_type;

    if (t === 'TCP' || t === 'HL7_MLLP') {
      return m.host && m.port ? `${t} ${m.host}:${m.port}` : `${t} (not set)`;
    }

    if (t === 'SERIAL') {
      return m.serial_port ? `SERIAL ${m.serial_port}` : 'SERIAL (not set)';
    }

    if (t === 'FILE_WATCHER') {
      return m.watch_dir ? `WATCH ${m.watch_dir}` : 'WATCH (not set)';
    }

    if (t === 'FTP' || t === 'SFTP') {
      return m.ftp_host ? `${t} ${m.ftp_host}` : `${t} (not set)`;
    }

    return t ?? '—';
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  private ensureValidPage() {
    const total = this.filtered().length;
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) this.pageIndex.set(maxPage);
  }

  trackById = (_: number, r: any) => r.id;

  runtimeOf(m: any) {
    return this.runtimeStates()[m.id] ?? { status: 'disconnected', message: 'Not started' };
  }

  runtimeStatusOf(m: any) {
    return this.runtimeOf(m).status ?? 'disconnected';
  }

  runtimeStatusLabel(m: any) {
    const status = this.runtimeStatusOf(m);
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'idle':
        return 'Idle';
      case 'stopped':
        return 'Stopped';
      case 'error':
        return 'Error';
      case 'disconnected':
      default:
        return 'Not started';
    }
  }

  runtimeRunning(m: any) {
    return ['connecting', 'connected', 'idle'].includes(this.runtimeStatusOf(m));
  }

  canStartRuntime(m: any) {
    return m?.is_active === 1 && !this.runtimeRunning(m);
  }

  canStopRuntime(m: any) {
    return this.runtimeRunning(m);
  }

  canRestartRuntime(m: any) {
    return (
      m?.is_active === 1 &&
      ['connecting', 'connected', 'idle', 'error'].includes(this.runtimeStatusOf(m))
    );
  }

  simulationRunning(m: any) {
    return !!this.simOf(m).running;
  }

  simulationStatusLabel(m: any) {
    return this.simulationRunning(m) ? 'Running' : 'Stopped';
  }

  canStartSimulation(m: any) {
    return m?.is_active === 1 && !this.simulationRunning(m);
  }

  canStopSimulation(m: any) {
    return this.simulationRunning(m);
  }

  async startRuntime(row: any) {
    try {
      await this.api.machinesRuntimeStart(row.id);
      this.snack.open('Runtime started', 'OK', { duration: 1800 });
      await this.refreshRuntimeStates();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Start failed', 'OK', { duration: 3500 });
    }
  }

  async stopRuntime(row: any) {
    try {
      await this.api.machinesRuntimeStop(row.id);
      this.snack.open('Runtime stopped', 'OK', { duration: 1800 });
      await this.refreshRuntimeStates();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Stop failed', 'OK', { duration: 3500 });
    }
  }

  async restartRuntime(row: any) {
    try {
      await this.api.machinesRuntimeRestart(row.id);
      this.snack.open('Runtime restarted', 'OK', { duration: 1800 });
      await this.refreshRuntimeStates();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Restart failed', 'OK', { duration: 3500 });
    }
  }

  async startSimulation(row: any) {
    try {
      await this.api.machinesSimStart(
        row.id,
        this.simulationScenario(),
        this.simulationIntervalMs(),
      );
      this.snack.open('Simulation started', 'OK', { duration: 1800 });
      await this.refreshSimulationStates();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Simulation start failed', 'OK', { duration: 3500 });
    }
  }

  async stopSimulation(row: any) {
    try {
      await this.api.machinesSimStop(row.id);
      this.snack.open('Simulation stopped', 'OK', { duration: 1800 });
      await this.refreshSimulationStates();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Simulation stop failed', 'OK', { duration: 3500 });
    }
  }

  openSimulation(row: any) {
    this.dialog.open(MachineSimulationDialog, {
      width: 'min(820px, 96vw)',
      maxWidth: '96vw',
      disableClose: true,
      autoFocus: false,
      restoreFocus: true,
      data: { machine: row },
    });
  }

  openLogs(row: any) {
    this.dialog.open(MachineLogsDialog, {
      width: 'min(960px, 96vw)',
      maxWidth: '96vw',
      disableClose: true,
      autoFocus: false,
      restoreFocus: true,
      data: { machine: row },
    });
  }

  openParsed(row: any) {
    this.dialog.open(MachineParsedDialog, {
      width: 'min(980px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { machine: row },
    });
  }

  openNormalized(row: any) {
    this.dialog.open(MachineNormalizedDialog, {
      width: 'min(1040px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { machine: row },
    });
  }

  // openLogs(row: any) {
  //   // this.dialog.open(MachineLogsDialog, {
  //   //   width: 'min(960px, 96vw)',
  //   //   maxWidth: '96vw',
  //   //   autoFocus: false,
  //   //   data: { machine: row },
  //   // });

  //   this.dialog.open(MachineLogsDialog, {
  //     width: 'min(960px, 96vw)',
  //     maxWidth: '96vw',
  //     autoFocus: false,
  //     restoreFocus: true,
  //     data: { machine: row },
  //   });
  // }

  // openSimulation(row: any) {
  //   // this.dialog.open(MachineSimulationDialog, {
  //   //   width: 'min(820px, 96vw)',
  //   //   maxWidth: '96vw',
  //   //   autoFocus: false,
  //   //   data: { machine: row },
  //   // });

  //   this.dialog.open(MachineSimulationDialog, {
  //     width: 'min(820px, 96vw)',
  //     maxWidth: '96vw',
  //     autoFocus: false,
  //     restoreFocus: true,
  //     data: { machine: row },
  //   });
  // }
}
