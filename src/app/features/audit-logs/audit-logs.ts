import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { PlatformApiService } from '../../core/platform/platform-api.service';

type AuditScope = 'DELIVERY' | 'SYSTEM';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './audit-logs.html',
  styleUrl: './audit-logs.scss',
})
export class AuditLogs {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  scope = signal<AuditScope>('DELIVERY');
  showFilters = signal(false);

  deliveryFilters = signal({
    status: '',
    operation: '',
    targetId: '',
    queueId: '',
    correlationId: '',
    dateFrom: '',
    dateTo: '',
    limit: 200,
  });
  systemFilters = signal({ level: '', source: '', entityType: '', entityId: '', limit: 200 });

  deliveryRows = signal<any[]>([]);
  systemRows = signal<any[]>([]);
  selectedDelivery = signal<any | null>(null);
  selectedSystem = signal<any | null>(null);

  readonly filteredDeliveryRows = computed(() => {
    const rows = this.deliveryRows();
    const q = this.deliveryFilters();
    const status = q.status.trim().toLowerCase();
    const operation = q.operation.trim().toLowerCase();
    const targetId = q.targetId.trim().toLowerCase();
    const queueId = q.queueId.trim().toLowerCase();
    const correlationId = q.correlationId.trim().toLowerCase();
    const fromMs = q.dateFrom ? new Date(q.dateFrom).getTime() : null;
    const toMs = q.dateTo ? new Date(q.dateTo).getTime() : null;

    return rows.filter((row) => {
      const createdMs = row?.created_at ? new Date(row.created_at).getTime() : null;
      const statusMatch = !status || String(row?.status ?? '').toLowerCase() === status;
      const operationMatch = !operation || String(row?.operation ?? '').toLowerCase() === operation;
      const targetMatch = !targetId || [row?.target_id, row?.target_name, row?.target_type]
        .some((value) => String(value ?? '').toLowerCase().includes(targetId));
      const queueMatch = !queueId || String(row?.queue_id ?? '').toLowerCase().includes(queueId);
      const correlationMatch = !correlationId || String(row?.correlation_id ?? '').toLowerCase().includes(correlationId);
      const fromMatch = fromMs === null || (createdMs !== null && createdMs >= fromMs);
      const toMatch = toMs === null || (createdMs !== null && createdMs <= toMs);

      return statusMatch && operationMatch && targetMatch && queueMatch && correlationMatch && fromMatch && toMatch;
    });
  });

  readonly filteredSystemRows = computed(() => {
    const rows = this.systemRows();
    const q = this.systemFilters();
    const level = q.level.trim().toLowerCase();
    const source = q.source.trim().toLowerCase();
    const entityType = q.entityType.trim().toLowerCase();
    const entityId = q.entityId.trim().toLowerCase();

    return rows.filter((row) => {
      const levelMatch = !level || String(row?.level ?? '').toLowerCase() === level;
      const sourceMatch = !source || String(row?.source ?? '').toLowerCase() === source;
      const entityTypeMatch = !entityType || String(row?.entity_type ?? '').toLowerCase().includes(entityType);
      const entityIdMatch = !entityId || String(row?.entity_id ?? '').toLowerCase().includes(entityId);
      return levelMatch && sourceMatch && entityTypeMatch && entityIdMatch;
    });
  });

  deliverySummary = computed(() => {
    const rows = this.filteredDeliveryRows();
    const correlated = rows.filter((r) => !!r.correlation_id).length;
    const queueLinked = rows.filter((r) => !!r.queue_id).length;
    return {
      total: rows.length,
      delivered: rows.filter((r) => r.status === 'DELIVERED').length,
      failed: rows.filter((r) => r.status === 'FAILED').length,
      started: rows.filter((r) => r.status === 'STARTED').length,
      correlated,
      queueLinked,
    };
  });

  systemSummary = computed(() => {
    const rows = this.filteredSystemRows();
    const withPayload = rows.filter((r) => !!r.payload_json).length;
    return {
      total: rows.length,
      errors: rows.filter((r) => String(r.level ?? '').toLowerCase() === 'error').length,
      warnings: rows.filter((r) => String(r.level ?? '').toLowerCase() === 'warn').length,
      info: rows.filter((r) => String(r.level ?? '').toLowerCase() === 'info').length,
      withPayload,
    };
  });

  constructor() {
    void this.refresh();
  }

  async refresh() {
    try {
      this.loading.set(true);
      if (this.scope() === 'DELIVERY') {
        const rows = await this.api.deliveryAuditList(this.deliveryQuery());
        this.deliveryRows.set(rows ?? []);
        this.syncSelectedDelivery();
      } else {
        const rows = await this.api.logsQuery(this.systemQuery());
        this.systemRows.set(rows ?? []);
        this.syncSelectedSystem();
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load audit logs', 'Close', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }

  async switchScope(scope: AuditScope) {
    if (this.scope() === scope) return;
    this.scope.set(scope);
    await this.refresh();
  }

  toggleFilters() {
    this.showFilters.update((value) => !value);
  }

  updateDeliveryFilter(key: string, value: any) {
    this.deliveryFilters.update((current) => ({ ...current, [key]: value }));
    this.syncSelectedDelivery();
  }

  updateSystemFilter(key: string, value: any) {
    this.systemFilters.update((current) => ({ ...current, [key]: value }));
    this.syncSelectedSystem();
  }

  async applyFilters() {
    await this.refresh();
  }

  clearFilters() {
    if (this.scope() === 'DELIVERY') {
      this.deliveryFilters.set({
        status: '',
        operation: '',
        targetId: '',
        queueId: '',
        correlationId: '',
        dateFrom: '',
        dateTo: '',
        limit: 200,
      });
      this.syncSelectedDelivery();
    } else {
      this.systemFilters.set({ level: '', source: '', entityType: '', entityId: '', limit: 200 });
      this.syncSelectedSystem();
    }
    void this.refresh();
  }

  selectDelivery(row: any) {
    this.selectedDelivery.set(row);
  }

  selectSystem(row: any) {
    this.selectedSystem.set(row);
  }

  statusClass(status?: string | null) {
    const value = String(status ?? '').toLowerCase();
    if (value === 'delivered') return 'status-delivered';
    if (value === 'failed' || value === 'error') return 'status-failed';
    if (value === 'started' || value === 'warn') return 'status-started';
    return 'status-neutral';
  }

  selectedDeliveryAlerts(row: any) {
    if (!row) return [] as Array<{ kind: 'info' | 'warn' | 'bad'; text: string }>;

    const notes: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];
    if (row.status === 'FAILED' && row.error_message) {
      notes.push({ kind: 'bad', text: 'This delivery event ended in failure and should be reviewed before retrying similar traffic.' });
    }
    if (row.status === 'STARTED') {
      notes.push({ kind: 'warn', text: 'This event was recorded as started, but the visible row does not yet show a final outcome.' });
    }
    if (row.correlation_id) {
      notes.push({ kind: 'info', text: 'Use the correlation ID to follow the same execution path across delivery and downstream traces.' });
    }
    return notes;
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

  private deliveryQuery() {
    const q = this.deliveryFilters();
    return {
      status: q.status || undefined,
      operation: q.operation || undefined,
      targetId: q.targetId || undefined,
      queueId: q.queueId || undefined,
      correlationId: q.correlationId || undefined,
      dateFrom: q.dateFrom || undefined,
      dateTo: q.dateTo || undefined,
      limit: Number(q.limit || 200),
    };
  }

  private systemQuery() {
    const q = this.systemFilters();
    return {
      level: q.level || undefined,
      source: q.source || undefined,
      entityType: q.entityType || undefined,
      entityId: q.entityId || undefined,
      limit: Number(q.limit || 200),
    };
  }

  parseJsonSafe(value: any) {
    if (!value) return null;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return null;
      }
    }
    return value;
  }

  auditEnvelope(row: any) {
    const payload = this.parseJsonSafe(row?.payload_json);
    if (!payload || typeof payload !== 'object') return null;
    if ('actor' in payload || 'resource' in payload || 'payload' in payload || 'action' in payload) {
      return payload as any;
    }
    return null;
  }

  actorSnapshot(row: any) {
    return this.auditEnvelope(row)?.actor ?? null;
  }

  resourceSnapshot(row: any) {
    return this.auditEnvelope(row)?.resource ?? null;
  }

  createdPayload(row: any) {
    const env = this.auditEnvelope(row);
    return env?.payload ?? null;
  }

  chipsOf(value: any) {
    return Array.isArray(value) ? value.filter(Boolean).map((item) => String(item)) : [];
  }

  formatJson(value: any) {
    if (!value) return '';
    if (typeof value === 'string') {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return JSON.stringify(value, null, 2);
  }

  private syncSelectedDelivery() {
    const rows = this.filteredDeliveryRows();
    const current = this.selectedDelivery();
    if (!current) {
      this.selectedDelivery.set(rows[0] ?? null);
      return;
    }
    const stillVisible = rows.find((row) => row.id === current.id) ?? null;
    this.selectedDelivery.set(stillVisible ?? rows[0] ?? null);
  }

  private syncSelectedSystem() {
    const rows = this.filteredSystemRows();
    const current = this.selectedSystem();
    if (!current) {
      this.selectedSystem.set(rows[0] ?? null);
      return;
    }
    const stillVisible = rows.find((row) => row.id === current.id) ?? null;
    this.selectedSystem.set(stillVisible ?? rows[0] ?? null);
  }
}