import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PlatformApiService } from '../../../core/platform/platform-api.service';

type ParsedRow = {
  id: string;
  machine_id: string;
  protocol: 'ASTM' | 'HL7' | 'RAW';
  message_type: string;
  summary?: string | null;
  data_json: string;
  raw?: string | null;
  created_at: string;
};

type DialogData = {
  machine: any;
};

@Component({
  selector: 'app-machine-parsed-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './machine-parsed-dialog.html',
  styleUrl: './machine-parsed-dialog.scss',
})
export class MachineParsedDialog {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private ref = inject(MatDialogRef<MachineParsedDialog>);

  rows = signal<ParsedRow[]>([]);
  loading = signal(false);
  limit = signal(50);
  lastRefreshed = signal<string | null>(null);

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

  prettyJson(value?: string | null) {
    if (!value) return '—';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  async refresh() {
    if (!this.data.machine?.id) return;
    try {
      this.loading.set(true);
      const rows = await this.api.machinesParsedList(
        this.data.machine.id,
        this.limit(),
      );
      this.rows.set(rows ?? []);
      this.lastRefreshed.set(new Date().toISOString());
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load parsed messages', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  setLimit(value: number) {
    this.limit.set(Number(value) || 50);
    this.refresh();
  }

  async copy(text: string) {
    try {
      await this.api.copy(text);
      this.snack.open('Copied to clipboard', 'Close', { duration: 1200 });
    } catch {
      this.snack.open('Failed to copy', 'Close', { duration: 2000 });
    }
  }

  close() {
    this.ref.close();
  }
}