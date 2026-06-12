import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlatformApiService } from '../../../core/platform/platform-api.service';
import {
  MachineSimulationProtocol,
  MachineSimulationRunResult,
  MachineSimulationRunRow,
  MachineSimulationUseCase,
  MachineSimulationUseCaseInput,
} from '../../../../../electron/src/preload/api/types';

type DialogData = { machine: any };

type EditableUseCase = MachineSimulationUseCaseInput & {
  variablesText: string;
  expectedCodesText: string;
};

const DEFAULT_MESSAGE = `MSH|^~\\&|SIMULATOR||LIS||{{messageDateTime}}||ORU^R01|{{messageControlId}}|P|2.5\nPID|1||{{patientId}}^^^SIM||{{patientFamily}}^{{patientGiven}}||19850101|M\nOBR|1|{{sampleId}}||GLU^Glucose^99LIS|||||||||||||||||||F\nOBX|1|NM|GLU^Glucose^99LIS||5.6|mmol/L|3.9-6.1|N|||F||||||{{observedAt}}`;

@Component({
  selector: 'app-machine-simulation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './machine-simulation-dialog.html',
  styleUrl: './machine-simulation-dialog.scss',
})
export class MachineSimulationDialog {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private ref = inject(MatDialogRef<MachineSimulationDialog>);
  data = inject<DialogData>(MAT_DIALOG_DATA);

  machine = this.data.machine;
  loading = signal(false);
  saving = signal(false);
  running = signal(false);
  useCases = signal<MachineSimulationUseCase[]>([]);
  runHistory = signal<MachineSimulationRunRow[]>([]);
  selectedUseCaseId = signal<string | null>(null);
  selectedTabIndex = signal(0);
  lastRun = signal<MachineSimulationRunResult | null>(null);
  runVariablesText = signal('{}');

  editor = signal<EditableUseCase>(this.emptyEditor());

  selectedUseCase = computed(() =>
    this.useCases().find((item) => item.id === this.selectedUseCaseId()) ?? null,
  );

  expectedCodes = computed(() => this.parseStringList(this.selectedUseCase()?.expected_codes_json));
  variables = computed(() => this.parseJsonObject(this.selectedUseCase()?.variables_json));
  runLogs = computed(() => this.lastRun()?.logs ?? []);

  constructor() {
    this.load();
  }

  async load() {
    try {
      this.loading.set(true);
      const [useCases, history] = await Promise.all([
        this.api.machinesSimUseCasesList(this.machine?.id ?? null),
        this.machine?.id ? this.api.machinesSimRunHistory(this.machine.id, 25) : Promise.resolve([]),
      ]);
      this.useCases.set(useCases ?? []);
      this.runHistory.set(history ?? []);
      if (!this.selectedUseCaseId() && useCases?.length) {
        this.selectUseCase(useCases[0]);
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load simulation workspace', 'OK', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }

  selectUseCase(useCase: MachineSimulationUseCase) {
    this.selectedUseCaseId.set(useCase.id);
    this.runVariablesText.set(this.pretty(this.parseJsonObject(useCase.variables_json)));
    this.editor.set(this.toEditor(useCase));
    this.lastRun.set(null);
  }

  newUseCase() {
    this.selectedUseCaseId.set(null);
    this.lastRun.set(null);
    this.editor.set(this.emptyEditor());
    this.runVariablesText.set(this.pretty(this.editor().variables ?? {}));
    this.selectedTabIndex.set(1);
  }


  patchEditor(patch: Partial<EditableUseCase>) {
    this.editor.set({ ...this.editor(), ...patch });
  }

  async saveUseCase() {
    const e = this.editor();
    const payload: MachineSimulationUseCaseInput = {
      id: e.id ?? null,
      machine_id: e.machine_id ?? null,
      code: e.code ?? null,
      name: e.name,
      description: e.description ?? null,
      test_order_code: e.test_order_code ?? null,
      test_order_name: e.test_order_name ?? null,
      protocol: e.protocol,
      message_type: e.message_type,
      sample_message: e.sample_message,
      variables: this.parseJsonObject(e.variablesText),
      expected_codes: e.expectedCodesText.split(',').map((x) => x.trim()).filter(Boolean),
      status: e.status ?? 'ACTIVE',
      sort_order: e.sort_order ?? 100,
    };

    if (!payload.name?.trim() || !payload.message_type?.trim() || !payload.sample_message?.trim()) {
      this.snack.open('Name, message type, and sample message are required.', 'OK', { duration: 2500 });
      return;
    }

    try {
      this.saving.set(true);
      const saved = await this.api.machinesSimUseCaseSave(payload);
      this.snack.open('Simulation use case saved', 'OK', { duration: 1800 });
      await this.load();
      this.selectUseCase(saved);
      this.selectedTabIndex.set(0);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to save use case', 'OK', { duration: 3500 });
    } finally {
      this.saving.set(false);
    }
  }

  async deleteUseCase(useCase: MachineSimulationUseCase | null = this.selectedUseCase()) {
    if (!useCase) return;
    if (!confirm(`Delete simulation use case "${useCase.name}"?`)) return;
    try {
      await this.api.machinesSimUseCaseDelete(useCase.id);
      this.snack.open('Simulation use case deleted', 'OK', { duration: 1800 });
      this.selectedUseCaseId.set(null);
      await this.load();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to delete use case', 'OK', { duration: 3500 });
    }
  }

  async runSelected() {
    const useCase = this.selectedUseCase();
    if (!useCase || !this.machine?.id) return;
    try {
      this.running.set(true);
      const result = await this.api.machinesSimUseCaseRun(
        this.machine.id,
        useCase.id,
        this.parseJsonObject(this.runVariablesText()),
      );
      this.lastRun.set(result);
      await this.loadHistoryOnly();
      this.snack.open(result.ok ? 'Simulation completed' : 'Simulation logged with warnings', 'OK', { duration: 2400 });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Simulation failed', 'OK', { duration: 3500 });
    } finally {
      this.running.set(false);
    }
  }

  async loadHistoryOnly() {
    if (!this.machine?.id) return;
    const rows = await this.api.machinesSimRunHistory(this.machine.id, 25);
    this.runHistory.set(rows ?? []);
  }

  close() {
    this.ref.close(true);
  }

  protocolOptions: MachineSimulationProtocol[] = ['HL7', 'ASTM', 'RAW'];

  private emptyEditor(): EditableUseCase {
    return {
      id: null,
      machine_id: null,
      code: '',
      name: 'New simulation use case',
      description: '',
      test_order_code: '',
      test_order_name: '',
      protocol: 'HL7',
      message_type: 'ORU^R01',
      sample_message: DEFAULT_MESSAGE,
      variables: {
        patientId: 'PAT001',
        patientFamily: 'TEST',
        patientGiven: 'PATIENT',
        sampleId: 'SAMPLE-001',
        messageControlId: 'SIM-0001',
        messageDateTime: '20260520123045',
        observedAt: '20260520122500',
      },
      expected_codes: ['GLU'],
      status: 'ACTIVE',
      sort_order: 100,
      variablesText: this.pretty({
        patientId: 'PAT001',
        patientFamily: 'TEST',
        patientGiven: 'PATIENT',
        sampleId: 'SAMPLE-001',
        messageControlId: 'SIM-0001',
        messageDateTime: '20260520123045',
        observedAt: '20260520122500',
      }),
      expectedCodesText: 'GLU',
    };
  }

  private toEditor(row: MachineSimulationUseCase): EditableUseCase {
    const variables = this.parseJsonObject(row.variables_json);
    const expected = this.parseStringList(row.expected_codes_json);
    return {
      id: row.id,
      machine_id: row.machine_id ?? null,
      code: row.code,
      name: row.name,
      description: row.description ?? '',
      test_order_code: row.test_order_code ?? '',
      test_order_name: row.test_order_name ?? '',
      protocol: row.protocol,
      message_type: row.message_type,
      sample_message: row.sample_message,
      variables,
      expected_codes: expected,
      status: row.status,
      sort_order: row.sort_order,
      variablesText: this.pretty(variables),
      expectedCodesText: expected.join(', '),
    };
  }

  private parseJsonObject(value: string | null | undefined): Record<string, string | number | boolean | null> {
    if (!value) return {};
    try {
      const parsed = typeof value === 'string' ? JSON.parse(value) : value;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }

  private parseStringList(value: string | null | undefined): string[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  pretty(value: unknown) {
    return JSON.stringify(value ?? {}, null, 2);
  }

  historyLogs(row: MachineSimulationRunRow) {
    try {
      return JSON.parse(row.logs_json ?? '[]') as Array<{ level: string; message: string; at: string }>;
    } catch {
      return [];
    }
  }
}
