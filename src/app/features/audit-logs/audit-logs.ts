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

  deliverySummary = computed(() => {
    const rows = this.deliveryRows();
    return {
      total: rows.length,
      delivered: rows.filter((r) => r.status === 'DELIVERED').length,
      failed: rows.filter((r) => r.status === 'FAILED').length,
      started: rows.filter((r) => r.status === 'STARTED').length,
    };
  });

  systemSummary = computed(() => {
    const rows = this.systemRows();
    return {
      total: rows.length,
      errors: rows.filter((r) => r.level === 'error').length,
      warnings: rows.filter((r) => r.level === 'warn').length,
      info: rows.filter((r) => r.level === 'info').length,
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
        this.selectedDelivery.set((rows ?? [])[0] ?? null);
      } else {
        const rows = await this.api.logsQuery(this.systemQuery());
        this.systemRows.set(rows ?? []);
        this.selectedSystem.set((rows ?? [])[0] ?? null);
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

  updateDeliveryFilter(key: string, value: any) {
    this.deliveryFilters.update((current) => ({ ...current, [key]: value }));
  }
  updateSystemFilter(key: string, value: any) {
    this.systemFilters.update((current) => ({ ...current, [key]: value }));
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
    } else {
      this.systemFilters.set({ level: '', source: '', entityType: '', entityId: '', limit: 200 });
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
    if (
      'actor' in payload ||
      'resource' in payload ||
      'payload' in payload ||
      'action' in payload
    ) {
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
}
