import { CommonModule } from '@angular/common';
import { Component, DestroyRef, Inject, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { PlatformApiService } from '../../../core/platform/platform-api.service';

type DialogData = {
  machine: any;
};

type Scenario = 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING';

@Component({
  selector: 'app-machine-simulation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './machine-simulation-dialog.html',
  styleUrl: './machine-simulation-dialog.scss',
})
export class MachineSimulationDialog {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private ref = inject(MatDialogRef<MachineSimulationDialog>);

  intervalMs = signal(5000);
  simState = signal<any>(null);
  latestPreview = signal('');

  allowedScenarios = computed(() => {
    const protocol = this.data.machine?.protocol;

    if (protocol === 'HL7') {
      return [{ value: 'HL7_ORU' as Scenario, label: 'HL7 ORU' }];
    }

    if (protocol === 'RAW') {
      return [{ value: 'RAW_PING' as Scenario, label: 'RAW Ping' }];
    }

    return [{ value: 'ASTM_BASIC' as Scenario, label: 'ASTM Basic' }];
  });

  scenario = signal<Scenario>('ASTM_BASIC');
  statusLabel = computed(() => (this.simState()?.running ? 'Running' : 'Stopped'));

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.applyDefaultScenario();
    this.refreshState();

    const off = this.api.onMachinesRuntimeEvent((event: any) => {
      if (event?.machineId !== this.data.machine?.id) return;

      if (event.type === 'traffic') {
        this.latestPreview.set(event.payloadPreview || '');
      }
    });

    this.destroyRef.onDestroy(() => off?.());
  }

  private applyDefaultScenario() {
    const protocol = this.data.machine?.protocol;
    if (protocol === 'HL7') this.scenario.set('HL7_ORU');
    else if (protocol === 'RAW') this.scenario.set('RAW_PING');
    else this.scenario.set('ASTM_BASIC');
  }

  async refreshState() {
    if (!this.data.machine?.id) return;
    try {
      const state = await this.api.machinesSimState(this.data.machine.id);
      this.simState.set(state);
    } catch {
      // ignore
    }
  }

  async start() {
    if (!this.data.machine?.id) return;
    try {
      await this.api.machinesSimStart(this.data.machine.id, this.scenario(), this.intervalMs());
      await this.refreshState();
      this.snack.open('Simulation started', 'Close', { duration: 1800 });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to start simulation', 'Close', {
        duration: 3500,
      });
    }
  }

  async stop() {
    if (!this.data.machine?.id) return;
    try {
      await this.api.machinesSimStop(this.data.machine.id);
      await this.refreshState();
      this.snack.open('Simulation stopped', 'Close', { duration: 1800 });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to stop simulation', 'Close', {
        duration: 3500,
      });
    }
  }

  close() {
    this.ref.close();
  }
}
