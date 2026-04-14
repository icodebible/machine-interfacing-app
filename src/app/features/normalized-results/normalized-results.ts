import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
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
import { MatTableModule } from '@angular/material/table';

import { PlatformApiService } from '../../core/platform/platform-api.service';
import { NormalizedResultDetailDialog } from '../../shared/dialogs/normalized-result-detail-dialog/normalized-result-detail-dialog';

type WorkflowState =
  | 'READY'
  | 'PENDING_APPROVAL'
  | 'QUEUED'
  | 'SENDING'
  | 'DELIVERED'
  | 'FAILED_DELIVERY';

interface NormalizedResultViewRow {
  id: string;
  machineId: string;
  machineName: string;
  machineCode: string;
  labName: string;
  protocol: 'ASTM' | 'HL7' | 'RAW';
  patientId: string | null;
  patientName: string | null;
  sampleId: string | null;
  orderId: string | null;
  testCode: string | null;
  testName: string | null;
  value: string | null;
  units: string | null;
  referenceRange: string | null;
  abnormalFlag: string | null;
  observedAt: string | null;
  sourceMessageType: string | null;
  summary: string | null;
  workflowState: WorkflowState;
  queueTargetName: string | null;
  queueTargetId: string | null;
  deliveryStatus: string | null;
  dataJson: string;
  createdAt: string;
}

@Component({
  selector: 'app-normalized-results',
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
    MatTableModule,
  ],
  templateUrl: './normalized-results.html',
  styleUrl: './normalized-results.scss',
})
export class NormalizedResults {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(false);
  rows = signal<NormalizedResultViewRow[]>([]);
  targets = signal<any[]>([]);
  expandedRowId = signal<string | null>(null);

  searchTerm = '';
  protocolFilter: 'ALL' | NormalizedResultViewRow['protocol'] = 'ALL';
  workflowFilter: 'ALL' | WorkflowState = 'ALL';

  cols: string[] = ['result', 'clinical', 'workflow', 'observed', 'actions'];
  detailCols: string[] = ['expandedDetail'];

  filteredRows = computed(() => {
    const term = this.searchTerm.trim().toLowerCase();

    return this.rows().filter((row) => {
      const matchesTerm =
        !term ||
        [
          row.id,
          row.machineName,
          row.machineCode,
          row.labName,
          row.patientId ?? '',
          row.patientName ?? '',
          row.sampleId ?? '',
          row.orderId ?? '',
          row.testCode ?? '',
          row.testName ?? '',
          row.summary ?? '',
        ].some((value) => value.toLowerCase().includes(term));

      const matchesProtocol = this.protocolFilter === 'ALL' || row.protocol === this.protocolFilter;
      const matchesWorkflow =
        this.workflowFilter === 'ALL' || row.workflowState === this.workflowFilter;

      return matchesTerm && matchesProtocol && matchesWorkflow;
    });
  });

  summaryCards = computed(() => {
    const rows = this.filteredRows();
    return [
      { label: 'Total results', value: rows.length, tone: 'idle' },
      {
        label: 'Pending approval',
        value: rows.filter((row) => row.workflowState === 'PENDING_APPROVAL').length,
        tone: 'warn',
      },
      {
        label: 'In queue / sending',
        value: rows.filter(
          (row) => row.workflowState === 'QUEUED' || row.workflowState === 'SENDING',
        ).length,
        tone: 'warn',
      },
      {
        label: 'Delivered',
        value: rows.filter((row) => row.workflowState === 'DELIVERED').length,
        tone: 'ok',
      },
      {
        label: 'Failed delivery',
        value: rows.filter((row) => row.workflowState === 'FAILED_DELIVERY').length,
        tone: 'bad',
      },
    ];
  });

  constructor() {
    this.refresh();
  }

  async refresh() {
    try {
      this.loading.set(true);

      const [machines, targets, pendingApprovals, queueItems, deliveredItems] = await Promise.all([
        this.api.machinesList(),
        this.api.targetsList(),
        this.api.resultsPendingApprovals(500),
        this.api.outboundQueueList(500),
        this.api.deliveryHistoryList(500),
      ]);

      const normalizedByMachine = await Promise.allSettled(
        (machines ?? []).map((machine) => this.api.machinesNormalizedList(machine.id, 200)),
      );

      const pendingSet = new Set(
        (pendingApprovals ?? []).map((item: any) => item.normalized_result_id),
      );
      const queueByResult = new Map<string, any>();
      for (const item of queueItems ?? []) {
        const current = queueByResult.get(item.normalized_result_id);
        if (!current || this.dateValue(item.created_at) > this.dateValue(current.created_at)) {
          queueByResult.set(item.normalized_result_id, item);
        }
      }

      const deliveredByResult = new Map<string, any>();
      for (const item of deliveredItems ?? []) {
        const current = deliveredByResult.get(item.normalized_result_id);
        if (!current || this.dateValue(item.updated_at) > this.dateValue(current.updated_at)) {
          deliveredByResult.set(item.normalized_result_id, item);
        }
      }

      const rows: NormalizedResultViewRow[] = [];
      let failedMachines = 0;

      for (let i = 0; i < (machines ?? []).length; i++) {
        const machine = machines[i];
        const result = normalizedByMachine[i];

        if (result.status !== 'fulfilled') {
          failedMachines += 1;
          continue;
        }

        for (const item of result.value ?? []) {
          rows.push(this.toViewRow(machine, item, pendingSet, queueByResult, deliveredByResult));
        }
      }

      rows.sort(
        (a, b) =>
          this.dateValue(b.observedAt ?? b.createdAt) - this.dateValue(a.observedAt ?? a.createdAt),
      );
      this.rows.set(rows);
      this.targets.set((targets ?? []).filter((target: any) => target.enabled === 1));

      if (this.expandedRowId() && !rows.some((row) => row.id === this.expandedRowId())) {
        this.expandedRowId.set(null);
      }

      if (failedMachines > 0) {
        this.snack.open(
          `Normalized results loaded with ${failedMachines} machine source${failedMachines > 1 ? 's' : ''} skipped.`,
          'Close',
          { duration: 2600 },
        );
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load normalized results', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  toggleRow(row: NormalizedResultViewRow, event?: Event) {
    event?.stopPropagation();
    this.expandedRowId.set(this.expandedRowId() === row.id ? null : row.id);
  }

  isExpanded(row: NormalizedResultViewRow): boolean {
    return this.expandedRowId() === row.id;
  }

  openInspector(row: NormalizedResultViewRow, event?: Event) {
    event?.stopPropagation();
    this.dialog.open(NormalizedResultDetailDialog, {
      width: 'min(1240px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      panelClass: 'app-wide-dialog-panel',
      data: {
        row,
        targets: this.targets(),
        initialTargetId: row.queueTargetId ?? this.targets()[0]?.id ?? '',
      },
    });
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

  workflowClass(state?: WorkflowState | null): string {
    switch (state) {
      case 'DELIVERED':
        return 'ok';
      case 'PENDING_APPROVAL':
      case 'QUEUED':
      case 'SENDING':
        return 'warn';
      case 'FAILED_DELIVERY':
        return 'bad';
      case 'READY':
      default:
        return 'idle';
    }
  }

  abnormalClass(flag?: string | null): string {
    if (!flag) return 'idle';
    const normalized = flag.toUpperCase();
    if (normalized === 'N' || normalized === 'NORMAL') return 'ok';
    return 'bad';
  }

  private toViewRow(
    machine: any,
    item: any,
    pendingSet: Set<string>,
    queueByResult: Map<string, any>,
    deliveredByResult: Map<string, any>,
  ): NormalizedResultViewRow {
    const delivered = deliveredByResult.get(item.id);
    const queue = queueByResult.get(item.id);

    let workflowState: WorkflowState = 'READY';
    if (delivered?.delivery_status === 'DELIVERED') {
      workflowState = 'DELIVERED';
    } else if (queue?.delivery_status === 'FAILED') {
      workflowState = 'FAILED_DELIVERY';
    } else if (queue?.delivery_status === 'SENDING') {
      workflowState = 'SENDING';
    } else if (queue) {
      workflowState = 'QUEUED';
    } else if (pendingSet.has(item.id)) {
      workflowState = 'PENDING_APPROVAL';
    }

    return {
      id: item.id,
      machineId: item.machine_id,
      machineName: machine?.name ?? item.machine_id,
      machineCode: machine?.code ?? '—',
      labName: machine?.lab_name ?? '—',
      protocol: item.protocol,
      patientId: item.patient_id ?? null,
      patientName: item.patient_name ?? null,
      sampleId: item.sample_id ?? null,
      orderId: item.order_id ?? null,
      testCode: item.test_code ?? null,
      testName: item.test_name ?? null,
      value: item.value ?? null,
      units: item.units ?? null,
      referenceRange: item.reference_range ?? null,
      abnormalFlag: item.abnormal_flag ?? null,
      observedAt: item.observed_at ?? null,
      sourceMessageType: item.source_message_type ?? null,
      summary: item.summary ?? null,
      workflowState,
      queueTargetName: queue?.target_name ?? delivered?.target_name ?? null,
      queueTargetId: queue?.target_id ?? delivered?.target_id ?? null,
      deliveryStatus: queue?.delivery_status ?? delivered?.delivery_status ?? null,
      dataJson: item.data_json,
      createdAt: item.created_at,
    };
  }

  private dateValue(value?: string | null): number {
    const time = value ? new Date(value).getTime() : Number.NaN;
    return Number.isNaN(time) ? 0 : time;
  }
}
