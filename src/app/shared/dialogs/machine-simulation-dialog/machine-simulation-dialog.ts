// import { CommonModule } from '@angular/common';
// import { Component, DestroyRef, Inject, computed, inject, signal } from '@angular/core';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatSelectModule } from '@angular/material/select';
// import { MatInputModule } from '@angular/material/input';
// import { PlatformApiService } from '../../../core/platform/platform-api.service';

// type DialogData = {
//   machine: any;
// };

// type Scenario = 'ASTM_BASIC' | 'HL7_ORU' | 'RAW_PING';

// @Component({
//   selector: 'app-machine-simulation-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatDialogModule,
//     MatButtonModule,
//     MatIconModule,
//     MatSnackBarModule,
//     MatFormFieldModule,
//     MatSelectModule,
//     MatInputModule,
//   ],
//   templateUrl: './machine-simulation-dialog.html',
//   styleUrl: './machine-simulation-dialog.scss',
// })
// export class MachineSimulationDialog {
//   private api = inject(PlatformApiService);
//   private snack = inject(MatSnackBar);
//   private destroyRef = inject(DestroyRef);
//   private ref = inject(MatDialogRef<MachineSimulationDialog>);

//   intervalMs = signal(5000);
//   simState = signal<any>(null);
//   latestPreview = signal('');

//   allowedScenarios = computed(() => {
//     const protocol = this.data.machine?.protocol;

//     if (protocol === 'HL7') {
//       return [{ value: 'HL7_ORU' as Scenario, label: 'HL7 ORU' }];
//     }

//     if (protocol === 'RAW') {
//       return [{ value: 'RAW_PING' as Scenario, label: 'RAW Ping' }];
//     }

//     return [{ value: 'ASTM_BASIC' as Scenario, label: 'ASTM Basic' }];
//   });

//   scenario = signal<Scenario>('ASTM_BASIC');
//   statusLabel = computed(() => (this.simState()?.running ? 'Running' : 'Stopped'));

//   constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
//     this.applyDefaultScenario();
//     this.refreshState();

//     const off = this.api.onMachinesRuntimeEvent((event: any) => {
//       if (event?.machineId !== this.data.machine?.id) return;

//       if (event.type === 'traffic') {
//         this.latestPreview.set(event.payloadPreview || '');
//       }
//     });

//     this.destroyRef.onDestroy(() => off?.());
//   }

//   private applyDefaultScenario() {
//     const protocol = this.data.machine?.protocol;
//     if (protocol === 'HL7') this.scenario.set('HL7_ORU');
//     else if (protocol === 'RAW') this.scenario.set('RAW_PING');
//     else this.scenario.set('ASTM_BASIC');
//   }

//   async refreshState() {
//     if (!this.data.machine?.id) return;
//     try {
//       const state = await this.api.machinesSimState(this.data.machine.id);
//       this.simState.set(state);
//     } catch {
//       // ignore
//     }
//   }

//   async start() {
//     if (!this.data.machine?.id) return;
//     try {
//       await this.api.machinesSimStart(this.data.machine.id, this.scenario(), this.intervalMs());
//       await this.refreshState();
//       this.snack.open('Simulation started', 'Close', { duration: 1800 });
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to start simulation', 'Close', {
//         duration: 3500,
//       });
//     }
//   }

//   async stop() {
//     if (!this.data.machine?.id) return;
//     try {
//       await this.api.machinesSimStop(this.data.machine.id);
//       await this.refreshState();
//       this.snack.open('Simulation stopped', 'Close', { duration: 1800 });
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to stop simulation', 'Close', {
//         duration: 3500,
//       });
//     }
//   }

//   close() {
//     this.ref.close();
//   }
// }


// import { CommonModule } from '@angular/common';
// import { Component, DestroyRef, Inject, computed, inject, signal } from '@angular/core';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatSelectModule } from '@angular/material/select';
// import { MatInputModule } from '@angular/material/input';
// import { PlatformApiService } from '../../../core/platform/platform-api.service';

// export type SimulationScenario =
//   | 'ASTM_BASIC'
//   | 'HL7_ORU'
//   | 'HL7_COBAS_HPV_FINAL_RESULT'
//   | 'RAW_PING';

// type DialogData = {
//   machine: any;
// };

// type ScenarioOption = {
//   value: SimulationScenario;
//   label: string;
//   description?: string;
// };

// @Component({
//   selector: 'app-machine-simulation-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatDialogModule,
//     MatButtonModule,
//     MatIconModule,
//     MatSnackBarModule,
//     MatFormFieldModule,
//     MatSelectModule,
//     MatInputModule,
//   ],
//   templateUrl: './machine-simulation-dialog.html',
//   styleUrl: './machine-simulation-dialog.scss',
// })
// export class MachineSimulationDialog {
//   private api = inject(PlatformApiService);
//   private snack = inject(MatSnackBar);
//   private destroyRef = inject(DestroyRef);
//   private ref = inject(MatDialogRef<MachineSimulationDialog>);

//   intervalMs = signal(5000);
//   simState = signal<any>(null);
//   latestPreview = signal('');

//   allowedScenarios = computed<ScenarioOption[]>(() => {
//     const protocol = String(this.data.machine?.protocol ?? '').toUpperCase();
//     const connectionType = String(this.data.machine?.connection_type ?? '').toUpperCase();

//     if (protocol === 'HL7' || connectionType === 'HL7_MLLP') {
//       return [
//         {
//           value: 'HL7_COBAS_HPV_FINAL_RESULT',
//           label: 'COBAS HPV final result (HL7)',
//           description: 'Final OUL^R22 HPV result with HPV16, HPV18 and Hr-HPV values.',
//         },
//         {
//           value: 'HL7_ORU',
//           label: 'Generic HL7 ORU result',
//           description: 'Small generic HL7 message for basic parser checks.',
//         },
//       ];
//     }

//     if (protocol === 'RAW') {
//       return [{ value: 'RAW_PING', label: 'RAW ping message' }];
//     }

//     return [{ value: 'ASTM_BASIC', label: 'ASTM basic chemistry result' }];
//   });

//   scenario = signal<SimulationScenario>('ASTM_BASIC');
//   statusLabel = computed(() => (this.simState()?.running ? 'Running' : 'Stopped'));
//   selectedScenarioLabel = computed(() => {
//     const selected = this.allowedScenarios().find((item) => item.value === this.scenario());
//     return selected?.label ?? this.scenario();
//   });

//   constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
//     this.applyDefaultScenario();
//     this.refreshState();

//     const off = this.api.onMachinesRuntimeEvent((event: any) => {
//       if (event?.machineId !== this.data.machine?.id) return;

//       if (event.type === 'traffic') {
//         this.latestPreview.set(event.payloadPreview || '');
//       }
//     });

//     this.destroyRef.onDestroy(() => off?.());
//   }

//   private applyDefaultScenario() {
//     const protocol = String(this.data.machine?.protocol ?? '').toUpperCase();
//     const connectionType = String(this.data.machine?.connection_type ?? '').toUpperCase();
//     if (protocol === 'HL7' || connectionType === 'HL7_MLLP')
//       this.scenario.set('HL7_COBAS_HPV_FINAL_RESULT');
//     else if (protocol === 'RAW') this.scenario.set('RAW_PING');
//     else this.scenario.set('ASTM_BASIC');
//   }

//   async refreshState() {
//     if (!this.data.machine?.id) return;
//     try {
//       const state = await this.api.machinesSimState(this.data.machine.id);
//       this.simState.set(state);

//       if (state?.scenario) {
//         this.scenario.set(state.scenario as SimulationScenario);
//       }
//     } catch {
//       // ignore
//     }
//   }

//   async start() {
//     if (!this.data.machine?.id) return;
//     try {
//       await this.api.machinesSimStart(this.data.machine.id, this.scenario(), this.intervalMs());
//       await this.refreshState();
//       this.snack.open('Simulation started', 'Close', { duration: 1800 });
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to start simulation', 'Close', {
//         duration: 3500,
//       });
//     }
//   }

//   async stop() {
//     if (!this.data.machine?.id) return;
//     try {
//       await this.api.machinesSimStop(this.data.machine.id);
//       await this.refreshState();
//       this.snack.open('Simulation stopped', 'Close', { duration: 1800 });
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to stop simulation', 'Close', {
//         duration: 3500,
//       });
//     }
//   }

//   close() {
//     this.ref.close();
//   }
// }

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

type Scenario =
  | 'ASTM_BASIC'
  | 'HL7_ORU'
  | 'RAW_PING'
  | 'HL7_COBAS_HPV_FINAL_RESULT'
  | 'ASTM_COBAS_HPV_FINAL_RESULT';

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
      return [
        {
          value: 'HL7_COBAS_HPV_FINAL_RESULT' as Scenario,
          label: 'COBAS HPV final result (HL7)',
        },
        { value: 'HL7_ORU' as Scenario, label: 'Generic HL7 ORU result' },
      ];
    }

    if (protocol === 'RAW') {
      return [{ value: 'RAW_PING' as Scenario, label: 'RAW Ping' }];
    }

    return [
      {
        value: 'ASTM_COBAS_HPV_FINAL_RESULT' as Scenario,
        label: 'COBAS HPV final result (ASTM)',
      },
      { value: 'ASTM_BASIC' as Scenario, label: 'Generic ASTM result' },
    ];
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
    if (protocol === 'HL7') this.scenario.set('HL7_COBAS_HPV_FINAL_RESULT');
    else if (protocol === 'RAW') this.scenario.set('RAW_PING');
    else this.scenario.set('ASTM_COBAS_HPV_FINAL_RESULT');
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

