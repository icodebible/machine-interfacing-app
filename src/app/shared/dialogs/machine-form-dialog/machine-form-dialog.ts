import { CommonModule } from '@angular/common';
import {
  Component,
  Inject,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlatformApiService } from '../../../core/platform/platform-api.service';

// ✅ Adjust import to your actual path/service name

export type ConnectionType =
  | 'TCP'
  | 'HL7_MLLP'
  | 'SERIAL'
  | 'FTP'
  | 'SFTP'
  | 'FILE_WATCHER';

export type ProtocolType = 'ASTM' | 'HL7' | 'RAW';

export type Lab = { id: string; name: string; code?: string | null };

export type MachineDto = {
  id?: string;
  lab_id: string | null;

  name: string;
  code?: string | null;
  brand?: string | null;
  model?: string | null;
  version?: string | null;
  manufacturer?: string | null;

  connection_type: ConnectionType;
  protocol: ProtocolType;

  // TCP / HL7
  host?: string | null;
  port?: number | null;
  tcp_mode?: 'SERVER' | 'CLIENT' | null;

  // SERIAL
  serial_port?: string | null;
  baud_rate?: number | null;
  data_bits?: number | null;
  stop_bits?: number | null;
  parity?: 'none' | 'even' | 'odd' | 'mark' | 'space' | null;

  // FTP / SFTP
  ftp_host?: string | null;
  ftp_port?: number | null;
  ftp_user?: string | null;
  ftp_password?: string | null;
  ftp_remote_dir?: string | null;

  // FILE WATCHER
  watch_dir?: string | null;
  watch_pattern?: string | null;

  is_active: number;     // 1/0
  auto_connect: number;  // 1/0
};

export type MachineFormDialogData = {
  mode: 'create' | 'edit';
  machine?: Partial<MachineDto> | null;
  labs?: Lab[] | null;
};

@Component({
  selector: 'app-machine-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    MatSnackBarModule,
  ],
  templateUrl: './machine-form-dialog.html',
  styleUrl: './machine-form-dialog.scss',
})
export class MachineFormDialog {
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);
  private platform = inject(PlatformApiService);
  private dialogRef = inject(MatDialogRef<MachineFormDialog>);

  labs = signal<Lab[]>([]);
  loading = signal(false);
  testing = signal(false);

  mode: 'create' | 'edit';
  initial: Partial<MachineDto> | null;

  connectionTypes: { value: ConnectionType; label: string; hint: string }[] = [
    { value: 'TCP', label: 'TCP/IP', hint: 'ASTM over TCP, RAW TCP, custom socket protocols' },
    // { value: 'HL7_MLLP', label: 'HL7 MLLP', hint: 'HL7 over TCP using MLLP framing' },
    { value: 'SERIAL', label: 'Serial (RS232)', hint: 'COM/tty serial connection' },
    { value: 'FTP', label: 'FTP File Drop', hint: 'Poll remote FTP folder for result files' },
    // { value: 'SFTP', label: 'SFTP File Drop', hint: 'Poll remote SFTP folder for result files' },
    // { value: 'FILE_WATCHER', label: 'Folder Watcher', hint: 'Watch a local folder for new files' },
  ];

  protocols: { value: ProtocolType; label: string; hint: string }[] = [
    { value: 'ASTM', label: 'ASTM', hint: 'Common analyzer protocol (often over TCP/Serial)' },
    { value: 'HL7', label: 'HL7', hint: 'HL7 messages (often MLLP)' },
    { value: 'RAW', label: 'RAW', hint: 'No parsing (store/log raw traffic)' },
  ];

  // ✅ Form (aligned with unified schema)
  form = this.fb.group({
    lab_id: [null as string | null, []],

    name: ['', [Validators.required, Validators.minLength(2)]],
    code: [null as string | null],
    brand: [null as string | null],
    model: [null as string | null],
    version: [null as string | null],
    manufacturer: [null as string | null],

    connection_type: ['TCP' as ConnectionType, [Validators.required]],
    protocol: ['ASTM' as ProtocolType, [Validators.required]],

    host: ['0.0.0.0' as string | null],
    port: [null as number | null],
    tcp_mode: ['SERVER' as 'SERVER' | 'CLIENT'],

    serial_port: [null as string | null],
    baud_rate: [9600 as number | null],
    data_bits: [8 as number | null],
    stop_bits: [1 as number | null],
    parity: ['none' as any],

    ftp_host: [null as string | null],
    ftp_port: [21 as number | null],
    ftp_user: [null as string | null],
    ftp_password: [null as string | null],
    ftp_remote_dir: [null as string | null],

    watch_dir: [null as string | null],
    watch_pattern: ['*' as string | null],

    is_active: [1 as number, [Validators.required]],
    auto_connect: [0 as number, [Validators.required]],
  });

  // ---------- UI computed flags ----------
  ctype = computed(() => this.form.get('connection_type')!.value as ConnectionType);
  needsTcp = computed(() => this.ctype() === 'TCP' || this.ctype() === 'HL7_MLLP');
  needsSerial = computed(() => this.ctype() === 'SERIAL');
  needsFtp = computed(() => this.ctype() === 'FTP' || this.ctype() === 'SFTP');
  needsWatch = computed(() => this.ctype() === 'FILE_WATCHER');

  title = computed(() => (this.mode === 'create' ? 'Add Machine' : 'Edit Machine'));
  subtitle = computed(() => {
    const t = this.connectionTypes.find((x) => x.value === this.ctype());
    return t?.hint ?? '';
  });

  constructor(@Inject(MAT_DIALOG_DATA) data: MachineFormDialogData) {
    this.mode = data?.mode ?? 'create';
    this.initial = data?.machine ?? null;

    if (data?.labs?.length) this.labs.set(data.labs);

    // Apply initial values
    if (this.initial) {
      console.log("INITIAL::: ", JSON.stringify(this.initial));
      this.form.patchValue({
        ...this.initial,
      } as any);
    }

    // Keep validators in sync with connection type (robust)
    this.applyConnectionValidators();

    // Re-apply validators when connection type changes
    this.form.get('connection_type')!.valueChanges.subscribe(() => {
      if (this.needsTcp() && !this.form.get('host')!.value) {
        this.form.patchValue({ host: '0.0.0.0', tcp_mode: 'SERVER' }, { emitEvent: false });
      }
      this.applyConnectionValidators();
    });

    // Load labs if not provided
    if (!data?.labs?.length) {
      this.loadLabs();
    }

    // Optional: auto-set protocol defaults based on connection_type
    effect(() => {
      const ct = this.ctype();
      const protocol = this.form.get('protocol')!.value;

      if ((ct === 'TCP' || ct === 'HL7_MLLP') && !this.form.get('tcp_mode')!.value) {
        this.form.get('tcp_mode')!.setValue('SERVER');
      }

      if (ct === 'HL7_MLLP' && protocol !== 'HL7') {
        this.form.get('protocol')!.setValue('HL7');
      }
      if (ct === 'SERIAL' && protocol === 'HL7') {
        // many serial machines are ASTM; keep user choice if they already set it
      }
    });
  }

  private async loadLabs() {
    this.loading.set(true);
    try {
      const labs = await this.platform.labsList();
      this.labs.set(labs ?? []);
    } catch (e: any) {
      this.snack.open(`Failed to load labs: ${e?.message ?? e}`, 'Close', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  private applyConnectionValidators() {
    // Clear all dynamic validators first
    const host = this.form.get('host')!;
    const port = this.form.get('port')!;
    const serialPort = this.form.get('serial_port')!;
    const baud = this.form.get('baud_rate')!;
    const ftpHost = this.form.get('ftp_host')!;
    const ftpPort = this.form.get('ftp_port')!;
    const watchDir = this.form.get('watch_dir')!;

    host.clearValidators();
    port.clearValidators();
    serialPort.clearValidators();
    baud.clearValidators();
    ftpHost.clearValidators();
    ftpPort.clearValidators();
    watchDir.clearValidators();

    // Apply based on connection type
    if (this.needsTcp()) {
      host.setValidators([Validators.required]);
      port.setValidators([Validators.required, Validators.min(1), Validators.max(65535)]);
    }

    if (this.needsSerial()) {
      serialPort.setValidators([Validators.required]);
      baud.setValidators([Validators.required, Validators.min(300)]);
    }

    if (this.needsFtp()) {
      ftpHost.setValidators([Validators.required]);
      ftpPort.setValidators([Validators.required, Validators.min(1), Validators.max(65535)]);
    }

    if (this.needsWatch()) {
      watchDir.setValidators([Validators.required]);
    }

    host.updateValueAndValidity({ emitEvent: false });
    port.updateValueAndValidity({ emitEvent: false });
    serialPort.updateValueAndValidity({ emitEvent: false });
    baud.updateValueAndValidity({ emitEvent: false });
    ftpHost.updateValueAndValidity({ emitEvent: false });
    ftpPort.updateValueAndValidity({ emitEvent: false });
    watchDir.updateValueAndValidity({ emitEvent: false });
  }

  // ---------- Actions ----------
  cancel() {
    this.dialogRef.close(null);
  }

  save() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.snack.open('Please fix the highlighted fields.', 'Close', { duration: 2500 });
      return;
    }

    const raw = this.form.getRawValue();
    const tcpMode = (raw.tcp_mode ?? 'SERVER') as 'SERVER' | 'CLIENT';

    // Ensure numeric flags are stored as 0/1 and TCP server has a stable bind address.
    const payload: MachineDto = {
      ...(raw as any),
      host: this.needsTcp() ? (raw.host || (tcpMode === 'SERVER' ? '0.0.0.0' : null)) : raw.host,
      tcp_mode: this.needsTcp() ? tcpMode : null,
      is_active: Number(raw.is_active ?? 1),
      auto_connect: Number(raw.auto_connect ?? 0),
    };

    this.dialogRef.close(payload);
  }

  async testConnection() {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.snack.open('Fix required fields before testing.', 'Close', { duration: 2500 });
      return;
    }

    this.testing.set(true);
    try {
      const payload = this.form.getRawValue();
      const res = await this.platform.machinesTest(payload as any);

      if (res?.ok) {
        this.snack.open(res?.message ?? 'Connection test succeeded.', 'Close', { duration: 3000 });
      } else {
        this.snack.open(res?.message ?? 'Connection test failed.', 'Close', { duration: 4000 });
      }
    } catch (e: any) {
      this.snack.open(`Test failed: ${e?.message ?? e}`, 'Close', { duration: 4500 });
    } finally {
      this.testing.set(false);
    }
  }

  // Convenience getters for template
  hasError(name: string, error: string) {
    const c = this.form.get(name);
    return !!(c && c.touched && c.hasError(error));
  }
}