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

import { PlatformApiService } from '../../core/platform/platform-api.service';
import { MachineFormDialog } from '../../shared/dialogs/machine-form-dialog/machine-form-dialog';

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

  // Data
  machines = signal<any[]>([]);
  labs = signal<any[]>([]);

  // Filters
  q = signal('');
  enabled = signal<FilterEnabled>('all');
  conn = signal<FilterConn>('all');

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

  constructor() {
    this.refreshAll();
    this.updateDrawerMode();

    const onResize = () => this.updateDrawerMode();
    window.addEventListener('resize', onResize);
    this.destroyRef.onDestroy(() => window.removeEventListener('resize', onResize));
  }

  private updateDrawerMode() {
    this.drawerMode.set(window.innerWidth < 900 ? 'over' : 'side');
  }

  async refreshAll() {
    try {
      this.loading.set(true);

      const [labs, machines] = await Promise.all([this.api.labsList(), this.api.machinesList()]);

      this.labs.set(labs);
      this.machines.set(machines);

      // keep selection stable
      const sel = this.selected();
      if (sel) {
        const still = machines.find((x: any) => x.id === sel.id) ?? null;
        this.selected.set(still);
        if (!still) this.drawer().close();
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load machines', 'OK', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }

  // --- Drawer ---
  async viewDetails(row: any) {
    this.selected.set(row);
    await this.drawer().open();
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

  trackById = (_: number, r: any) => r.id;
}
