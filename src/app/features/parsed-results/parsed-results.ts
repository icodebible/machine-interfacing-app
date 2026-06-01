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
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlatformApiService } from '../../core/platform/platform-api.service';
import { ParsedResultDetailDialog } from '../../shared/dialogs/parsed-result-detail-dialog/parsed-result-detail-dialog';

type ParsedStatus = 'PARSED' | 'WARNING' | 'FAILED';

interface ParsedResultViewRow {
  id: string;
  machineId: string;
  machineName: string;
  machineCode: string;
  labName: string;
  protocol: 'ASTM' | 'HL7' | 'RAW';
  messageType: string;
  parseStatus: ParsedStatus;
  createdAt: string;
  summary: string | null;
  patientId: string | null;
  sampleId: string | null;
  orderId: string | null;
  warningCount: number;
  errorCount: number;
  warnings: string[];
  errors: string[];
  observationCount: number;
  rawPayload: string | null;
  parsedPayload: Record<string, any>;
}

@Component({
  selector: 'app-parsed-results',
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
    MatPaginatorModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './parsed-results.html',
  styleUrl: './parsed-results.scss',
})
export class ParsedResults {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(false);
  rows = signal<ParsedResultViewRow[]>([]);
  expandedRowId = signal<string | null>(null);
  showFilters = signal(false);

  pageIndex = signal(0);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];

  searchTerm = signal('');
  protocolFilter = signal<'ALL' | ParsedResultViewRow['protocol']>('ALL');
  statusFilter = signal<'ALL' | ParsedStatus>('ALL');

  cols: string[] = ['message', 'protocol', 'status', 'received', 'actions'];
  detailCols: string[] = ['expandedDetail'];

  filteredRows = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();

    return this.rows().filter((row) => {
      const matchesTerm =
        !term ||
        [
          row.id,
          row.machineName,
          row.machineCode,
          row.labName,
          row.messageType,
          row.patientId ?? '',
          row.sampleId ?? '',
          row.orderId ?? '',
          row.summary ?? '',
          row.rawPayload ?? '',
          row.warnings.join(' '),
          row.errors.join(' '),
          JSON.stringify(row.parsedPayload ?? {}),
        ].some((value) => value.toLowerCase().includes(term));

      const protocolFilter = this.protocolFilter();
      const statusFilter = this.statusFilter();
      const matchesProtocol = protocolFilter === 'ALL' || row.protocol === protocolFilter;
      const matchesStatus = statusFilter === 'ALL' || row.parseStatus === statusFilter;

      return matchesTerm && matchesProtocol && matchesStatus;
    });
  });

  pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  summaryCards = computed(() => {
    const rows = this.filteredRows();
    return [
      { label: 'Total messages', value: rows.length, tone: 'accent-neutral' },
      {
        label: 'Parsed cleanly',
        value: rows.filter((row) => row.parseStatus === 'PARSED').length,
        tone: 'accent-good',
      },
      {
        label: 'Warnings',
        value: rows.filter((row) => row.parseStatus === 'WARNING').length,
        tone: 'accent-warn',
      },
      {
        label: 'Failures',
        value: rows.filter((row) => row.parseStatus === 'FAILED').length,
        tone: 'accent-bad',
      },
    ];
  });

  constructor() {
    this.refresh();
  }

  toggleFilters() {
    this.showFilters.set(!this.showFilters());
  }

  setSearchTerm(value: string) {
    this.searchTerm.set(value ?? '');
    this.resetPage();
  }

  setProtocolFilter(value: 'ALL' | ParsedResultViewRow['protocol']) {
    this.protocolFilter.set(value ?? 'ALL');
    this.resetPage();
  }

  setStatusFilter(value: 'ALL' | ParsedStatus) {
    this.statusFilter.set(value ?? 'ALL');
    this.resetPage();
  }

  async refresh() {
    try {
      this.loading.set(true);

      const machines = await this.api.machinesList();
      const parsedByMachine = await Promise.allSettled(
        (machines ?? []).map((machine) => this.api.machinesParsedList(machine.id, 200)),
      );

      const rows: ParsedResultViewRow[] = [];
      let failedMachines = 0;

      for (let i = 0; i < (machines ?? []).length; i++) {
        const machine = machines[i];
        const result = parsedByMachine[i];

        if (result.status !== 'fulfilled') {
          failedMachines += 1;
          continue;
        }

        for (const item of result.value ?? []) {
          rows.push(this.toViewRow(machine, item));
        }
      }

      rows.sort((a, b) => this.dateValue(b.createdAt) - this.dateValue(a.createdAt));
      this.rows.set(rows);
      this.ensureValidPage();

      if (this.expandedRowId() && !rows.some((row) => row.id === this.expandedRowId())) {
        this.expandedRowId.set(null);
      }

      if (failedMachines > 0) {
        this.snack.open(
          `Parsed results loaded with ${failedMachines} machine source${failedMachines > 1 ? 's' : ''} skipped.`,
          'Close',
          { duration: 2600 },
        );
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load parsed results', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  toggleRow(row: ParsedResultViewRow, event?: Event) {
    event?.stopPropagation();
    this.expandedRowId.set(this.expandedRowId() === row.id ? null : row.id);
  }

  isExpanded(row: ParsedResultViewRow): boolean {
    return this.expandedRowId() === row.id;
  }

  openInspector(row: ParsedResultViewRow, event?: Event) {
    event?.stopPropagation();
    this.dialog.open(ParsedResultDetailDialog, {
      width: 'min(1180px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      panelClass: 'app-wide-dialog-panel',
      data: { row },
    });
  }

  prettyJson(value: unknown): string {
    return JSON.stringify(value ?? {}, null, 2);
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

  statusClass(status?: ParsedStatus | null): string {
    switch (status) {
      case 'PARSED':
        return 'ok';
      case 'WARNING':
        return 'warn';
      case 'FAILED':
        return 'bad';
      default:
        return 'idle';
    }
  }


  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.ensureValidPage();
  }

  traceLabel(row: ParsedResultViewRow): string {
    const parts = [
      row.sampleId ? `Sample ${row.sampleId}` : null,
      row.orderId ? `Order ${row.orderId}` : null,
      row.patientId ? `Patient ${row.patientId}` : null,
    ].filter(Boolean);

    return parts.length ? parts.join(' • ') : 'No patient/sample/order trace found in parsed payload';
  }

  private resetPage() {
    this.pageIndex.set(0);
    this.ensureValidPage();
  }

  private ensureValidPage() {
    const total = this.filteredRows().length;
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) this.pageIndex.set(maxPage);
  }

  private toViewRow(machine: any, item: any): ParsedResultViewRow {
    const parsedPayload = this.safeJson(item?.data_json);
    const warnings = this.extractMessages(parsedPayload, [
      'warnings',
      'warningMessages',
      'validation.warnings',
    ]);
    const errors = this.extractMessages(parsedPayload, [
      'errors',
      'errorMessages',
      'validation.errors',
    ]);

    let status: ParsedStatus = 'PARSED';
    if (errors.length > 0 || parsedPayload['parseState'] === 'FAILED') {
      status = 'FAILED';
    } else if (warnings.length > 0) {
      status = 'WARNING';
    }

    return {
      id: item?.id,
      machineId: item?.machine_id,
      machineName: machine?.name ?? item?.machine_id,
      machineCode: machine?.code ?? '—',
      labName: machine?.lab_name ?? '—',
      protocol: item?.protocol,
      messageType: item?.message_type ?? '—',
      parseStatus: status,
      createdAt: item?.created_at,
      summary: item?.summary ?? null,
      patientId: this.extractScalar(parsedPayload, [
        'patient.patientId',
        'patient.id',
        'patientId',
        'pid.patientId',
      ]),
      sampleId: this.extractScalar(parsedPayload, [
        'order.sampleId',
        'sample.sampleId',
        'sampleId',
        'obr.sampleId',
      ]),
      orderId: this.extractScalar(parsedPayload, [
        'order.orderId',
        'order.id',
        'orderId',
        'obr.orderId',
      ]),
      warningCount: warnings.length,
      errorCount: errors.length,
      warnings,
      errors,
      observationCount: this.extractObservationCount(parsedPayload),
      rawPayload: item?.raw ?? null,
      parsedPayload,
    };
  }

  private safeJson(value: string | null | undefined): Record<string, any> {
    if (!value) return {};
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : { value: parsed };
    } catch {
      return {
        rawValue: value,
        parseError: 'Stored parsed JSON could not be decoded.',
      };
    }
  }

  private extractMessages(obj: Record<string, any>, paths: string[]): string[] {
    for (const path of paths) {
      const value = this.readPath(obj, path);
      if (Array.isArray(value)) {
        return value.map((item) => String(item));
      }
    }
    return [];
  }

  private extractScalar(obj: Record<string, any>, paths: string[]): string | null {
    for (const path of paths) {
      const value = this.readPath(obj, path);
      if (value !== undefined && value !== null && String(value).trim()) {
        return String(value);
      }
    }
    return null;
  }

  private extractObservationCount(obj: Record<string, any>): number {
    const candidates = [
      this.readPath(obj, 'observations'),
      this.readPath(obj, 'results'),
      this.readPath(obj, 'obx'),
      this.readPath(obj, 'payload.observations'),
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate.length;
    }
    return 0;
  }

  private readPath(obj: any, path: string): any {
    return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  private dateValue(value?: string | null): number {
    const time = value ? new Date(value).getTime() : Number.NaN;
    return Number.isNaN(time) ? 0 : time;
  }
}
