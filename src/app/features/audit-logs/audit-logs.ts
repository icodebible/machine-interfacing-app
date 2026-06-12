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

type AuditScope = 'DELIVERY' | 'AUDIT' | 'READINESS' | 'SYSTEM';
type DeliveryNote = { kind: 'info' | 'warn' | 'bad'; text: string };

type ReadinessStatus = 'READY' | 'READY_WITH_WARNINGS' | 'BLOCKED' | string;
type ReadinessSeverity = 'OK' | 'WARNING' | 'BLOCKER' | string;

type DeploymentReadinessCheck = {
  key: string;
  label: string;
  severity: ReadinessSeverity;
  passed: boolean;
  message: string;
  details?: Record<string, any> | null;
};



type ReleaseChecklistRisk = 'REQUIRED' | 'RECOMMENDED';

type ReleaseChecklistItem = {
  id: string;
  title: string;
  description: string;
  owner: string;
  risk: ReleaseChecklistRisk;
};

type ReleaseChecklistGroup = {
  key: string;
  title: string;
  icon: string;
  description: string;
  items: ReleaseChecklistItem[];
};

type AppDiagnostics = {
  generatedAt: string;
  app: { name: string; productName: string; version: string; isPackaged: boolean; appPath: string; executablePath: string };
  runtime: { electron?: string; chrome?: string; node?: string; v8?: string; platform: string; arch: string };
  paths: { userDataPath: string; dataPath: string; logsPath: string; backupsPath: string; databasePath: string; releaseOutputPath?: string | null };
  database: { path: string; exists: boolean; sizeBytes: number; walSizeBytes: number; shmSizeBytes: number; latestBackup?: null | { name: string; path: string; sizeBytes: number; createdAt: string } };
  package: { appId?: string | null; productName?: string | null; outputDir?: string | null; asar: boolean; npmRebuild: boolean; electronBuilderConfigured: boolean; publishConfigured: boolean; publishLooksPlaceholder: boolean; targets: Record<string, any>; scripts: Record<string, string | null> };
  storage: Array<{ key: string; label: string; path: string; ok: boolean; message: string }>;
};

type DeploymentReadinessReport = {
  ok: boolean;
  status: ReadinessStatus;
  score: number;
  checkedAt: string;
  summary: { total: number; passed: number; warnings: number; blockers: number };
  checks: DeploymentReadinessCheck[];
};

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
  systemFilters = signal({
    level: '',
    source: '',
    entityType: '',
    entityId: '',
    dateFrom: '',
    dateTo: '',
    search: '',
    limit: 200,
  });
  auditFilters = signal({
    source: '',
    category: '',
    action: '',
    severity: '',
    status: '',
    entityType: '',
    entityId: '',
    search: '',
    dateFrom: '',
    dateTo: '',
    limit: 200,
  });

  deliveryRows = signal<any[]>([]);
  systemRows = signal<any[]>([]);
  auditRows = signal<any[]>([]);
  auditSummarySnapshot = signal<any | null>(null);
  readinessReport = signal<DeploymentReadinessReport | null>(null);
  appDiagnostics = signal<AppDiagnostics | null>(null);
  backupRunning = signal(false);

  readonly releaseChecklistGroups: ReleaseChecklistGroup[] = [
    {
      key: 'build-package',
      title: 'Build and packaged application',
      icon: 'inventory_2',
      description: 'Confirm the renderer, Electron main process, preload bundle, and packaged artifact are all healthy.',
      items: [
        {
          id: 'build-web',
          title: 'Run the web production build',
          description: 'Run npm run build and confirm the Angular bundle completes without budget, template, or style errors.',
          owner: 'Developer / Release lead',
          risk: 'REQUIRED',
        },
        {
          id: 'build-electron',
          title: 'Run the Electron build',
          description: 'Run npm run build:electron and confirm main/preload TypeScript contracts compile cleanly.',
          owner: 'Developer / Release lead',
          risk: 'REQUIRED',
        },
        {
          id: 'package-installer',
          title: 'Package the desktop artifact',
          description: 'Run the platform packaging script and confirm the generated installer/AppImage opens on a clean workstation.',
          owner: 'Deployment engineer',
          risk: 'REQUIRED',
        },
      ],
    },
    {
      key: 'storage-backup',
      title: 'Storage, backup, and rollback',
      icon: 'backup',
      description: 'Verify the local database, logs, and backup folder are writable and the rollback path is known before go-live.',
      items: [
        {
          id: 'db-backup',
          title: 'Create a database backup',
          description: 'Use Create DB backup from this readiness page and confirm the latest backup appears in packaging diagnostics.',
          owner: 'System administrator',
          risk: 'REQUIRED',
        },
        {
          id: 'storage-paths',
          title: 'Confirm production storage paths',
          description: 'Review user data, database, logs, backups, and release output paths on the target workstation.',
          owner: 'System administrator',
          risk: 'REQUIRED',
        },
        {
          id: 'rollback-note',
          title: 'Prepare rollback notes',
          description: 'Keep the previous installer and latest SQLite backup available before upgrading production users.',
          owner: 'Deployment engineer',
          risk: 'RECOMMENDED',
        },
      ],
    },
    {
      key: 'runtime-simulation',
      title: 'Runtime, simulation, and traceability',
      icon: 'monitor_heart',
      description: 'Validate live and simulated analyzer traffic from raw message through parsed, normalized, and workflow records.',
      items: [
        {
          id: 'machine-runtime',
          title: 'Exercise machine runtime actions',
          description: 'Create/edit a machine, start/stop/restart runtime, and confirm Live Monitor and traffic logs update correctly.',
          owner: 'Lab integration tester',
          risk: 'REQUIRED',
        },
        {
          id: 'simulation-use-case',
          title: 'Run a saved simulation use case',
          description: 'Run a representative analyzer use case and confirm session, traffic, parsed, normalized, and workflow linkage.',
          owner: 'Lab integration tester',
          risk: 'REQUIRED',
        },
        {
          id: 'replay-diagnostics',
          title: 'Replay one recorded message',
          description: 'Use the logs console replay path to confirm parser, normalizer, and workflow diagnostics remain stable.',
          owner: 'Lab integration tester',
          risk: 'RECOMMENDED',
        },
      ],
    },
    {
      key: 'lis-payload',
      title: 'LIS profiles, mapping, and payloads',
      icon: 'fact_check',
      description: 'Confirm configured LIS profiles and mapping rules can produce a valid OpenMRS LIS payload without missing metadata.',
      items: [
        {
          id: 'profile-discovery',
          title: 'Fetch and verify LIS test-order profiles',
          description: 'Fetch representative LIS orders and confirm enabled profiles have order UUIDs and required analyzer parameters.',
          owner: 'LIS configuration lead',
          risk: 'REQUIRED',
        },
        {
          id: 'mapping-coverage',
          title: 'Review mapping coverage dashboard',
          description: 'Confirm concept, coded-answer, allocation, instrument, and tested-by gaps are cleared or intentionally accepted.',
          owner: 'LIS configuration lead',
          risk: 'REQUIRED',
        },
        {
          id: 'payload-preview',
          title: 'Preview and rebuild a payload',
          description: 'Open an outbound item, preview the payload, rebuild from latest mappings, and confirm validation remains clean.',
          owner: 'LIS configuration lead',
          risk: 'REQUIRED',
        },
      ],
    },
    {
      key: 'workflow-delivery',
      title: 'Approval, routing, and delivery',
      icon: 'outbox',
      description: 'Validate the operational path from normalized result review to queue creation and delivery audit correlation.',
      items: [
        {
          id: 'approval-routing',
          title: 'Approve a representative result',
          description: 'Confirm approval triggers routing rules or fallback policy and creates the correct outbound queue item.',
          owner: 'Lab operations tester',
          risk: 'REQUIRED',
        },
        {
          id: 'send-now',
          title: 'Send or dry-run a queue item',
          description: 'Use Send now only against a safe target and confirm delivery audit status, correlation ID, and result context.',
          owner: 'Lab operations tester',
          risk: 'REQUIRED',
        },
        {
          id: 'retry-requeue',
          title: 'Confirm retry and requeue behavior',
          description: 'Use a failed or blocked item to confirm retry, requeue, rebuild, and safety confirmations behave as expected.',
          owner: 'Lab operations tester',
          risk: 'RECOMMENDED',
        },
      ],
    },
    {
      key: 'security-audit',
      title: 'Security, audit, and operator acceptance',
      icon: 'shield',
      description: 'Confirm sensitive data is protected and administrators can explain what changed, who changed it, and when.',
      items: [
        {
          id: 'redaction',
          title: 'Check sensitive data redaction',
          description: 'Inspect audit payloads, target details, delivery snapshots, and diagnostics for password/token/API-key leakage.',
          owner: 'Security reviewer',
          risk: 'REQUIRED',
        },
        {
          id: 'audit-filters',
          title: 'Verify audit filters and event details',
          description: 'Search by source, category, status, entity, actor, and time range; confirm details remain readable and redacted.',
          owner: 'System administrator',
          risk: 'REQUIRED',
        },
        {
          id: 'operator-acceptance',
          title: 'Complete operator acceptance walkthrough',
          description: 'Have the operator run the final scenarios and confirm the UI wording, confirmations, and corrective actions are clear.',
          owner: 'Product owner / Operator',
          risk: 'RECOMMENDED',
        },
      ],
    },
  ];

  selectedDelivery = signal<any | null>(null);
  selectedSystem = signal<any | null>(null);
  selectedAudit = signal<any | null>(null);

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
    const search = q.search.trim().toLowerCase();
    const fromMs = q.dateFrom ? new Date(q.dateFrom).getTime() : null;
    const toMs = q.dateTo ? new Date(q.dateTo).getTime() : null;

    return rows.filter((row) => {
      const createdMs = row?.created_at ? new Date(row.created_at).getTime() : null;
      const levelMatch = !level || String(row?.level ?? '').toLowerCase() === level;
      const sourceMatch = !source || String(row?.source ?? '').toLowerCase() === source;
      const entityTypeMatch = !entityType || String(row?.entity_type ?? '').toLowerCase().includes(entityType);
      const entityIdMatch = !entityId || String(row?.entity_id ?? '').toLowerCase().includes(entityId);
      const searchMatch = !search || [row?.message, row?.payload_json, row?.entity_type, row?.entity_id]
        .some((value) => String(value ?? '').toLowerCase().includes(search));
      const fromMatch = fromMs === null || (createdMs !== null && createdMs >= fromMs);
      const toMatch = toMs === null || (createdMs !== null && createdMs <= toMs);
      return levelMatch && sourceMatch && entityTypeMatch && entityIdMatch && searchMatch && fromMatch && toMatch;
    });
  });

  readonly filteredAuditRows = computed(() => {
    const rows = this.auditRows();
    const q = this.auditFilters();
    const source = q.source.trim().toLowerCase();
    const category = q.category.trim().toLowerCase();
    const action = q.action.trim().toLowerCase();
    const severity = q.severity.trim().toLowerCase();
    const status = q.status.trim().toLowerCase();
    const entityType = q.entityType.trim().toLowerCase();
    const entityId = q.entityId.trim().toLowerCase();
    const search = q.search.trim().toLowerCase();
    const fromMs = q.dateFrom ? new Date(q.dateFrom).getTime() : null;
    const toMs = q.dateTo ? new Date(q.dateTo).getTime() : null;

    return rows.filter((row) => {
      const createdMs = row?.event_time || row?.created_at ? new Date(row.event_time || row.created_at).getTime() : null;
      const sourceMatch = !source || String(row?.source ?? '').toLowerCase() === source;
      const categoryMatch = !category || String(row?.category ?? '').toLowerCase() === category;
      const actionMatch = !action || String(row?.action ?? '').toLowerCase().includes(action);
      const severityMatch = !severity || String(row?.severity ?? '').toLowerCase() === severity;
      const statusMatch = !status || String(row?.status ?? '').toLowerCase() === status;
      const entityTypeMatch = !entityType || String(row?.entity_type ?? '').toLowerCase().includes(entityType);
      const entityIdMatch = !entityId || String(row?.entity_id ?? '').toLowerCase().includes(entityId);
      const searchMatch = !search || [row?.summary, row?.entity_label, row?.actor_username, row?.details_json, row?.action]
        .some((value) => String(value ?? '').toLowerCase().includes(search));
      const fromMatch = fromMs === null || (createdMs !== null && createdMs >= fromMs);
      const toMatch = toMs === null || (createdMs !== null && createdMs <= toMs);
      return sourceMatch && categoryMatch && actionMatch && severityMatch && statusMatch && entityTypeMatch && entityIdMatch && searchMatch && fromMatch && toMatch;
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

  auditSummary = computed(() => {
    const rows = this.filteredAuditRows();
    const sources = new Set(rows.map((row) => String(row.source ?? '')).filter(Boolean)).size;
    const categories = new Set(rows.map((row) => String(row.category ?? '')).filter(Boolean)).size;
    return {
      total: rows.length,
      failed: rows.filter((row) => ['FAILED', 'BLOCKED'].includes(String(row.status ?? '').toUpperCase())).length,
      warnings: rows.filter((row) => ['WARNING', 'CRITICAL'].includes(String(row.severity ?? '').toUpperCase())).length,
      errors: rows.filter((row) => ['ERROR', 'CRITICAL'].includes(String(row.severity ?? '').toUpperCase())).length,
      sources,
      categories,
    };
  });

  readinessSummary = computed(() => {
    const report = this.readinessReport();
    return report?.summary ?? { total: 0, passed: 0, warnings: 0, blockers: 0 };
  });

  readinessChecks = computed(() => this.readinessReport()?.checks ?? []);

  packagingSummary = computed(() => {
    const diagnostics = this.appDiagnostics();
    const storageFailures = diagnostics?.storage?.filter((item) => !item.ok).length ?? 0;
    return {
      storageFailures,
      databaseSize: diagnostics?.database?.sizeBytes ?? 0,
      latestBackup: diagnostics?.database?.latestBackup ?? null,
      packageReady: !!diagnostics?.package?.electronBuilderConfigured && !!diagnostics?.package?.scripts?.['buildRelease'],
    };
  });

  releaseChecklistSummary = computed(() => {
    const groups = this.releaseChecklistGroups;
    const items = groups.flatMap((group) => group.items);
    return {
      groups: groups.length,
      total: items.length,
      required: items.filter((item) => item.risk === 'REQUIRED').length,
      recommended: items.filter((item) => item.risk === 'RECOMMENDED').length,
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
      } else if (this.scope() === 'AUDIT') {
        const rows = await this.api.auditEventsQuery(this.auditQuery());
        this.auditRows.set(rows ?? []);
        this.auditSummarySnapshot.set(await this.safeAuditSummary());
        this.syncSelectedAudit();
      } else if (this.scope() === 'READINESS') {
        const [report, diagnostics] = await Promise.all([
          this.api.deploymentReadinessCheck(),
          this.api.appDiagnosticsGet(),
        ]);
        this.readinessReport.set(report ?? null);
        this.appDiagnostics.set(diagnostics ?? null);
      } else {
        const rows = await this.api.logsQuery(this.systemQuery());
        this.systemRows.set(rows ?? []);
        this.syncSelectedSystem();
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load audit/readiness data', 'Close', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }


  async createDatabaseBackup() {
    if (!confirm('Create a local SQLite database backup now? This is safe and does not change live data.')) return;
    try {
      this.backupRunning.set(true);
      const result = await this.api.databaseBackupCreate();
      this.snack.open(`Database backup created: ${this.formatBytes(result?.sizeBytes ?? 0)}`, 'OK', { duration: 3500 });
      this.appDiagnostics.set(await this.api.appDiagnosticsGet());
      this.readinessReport.set(await this.api.deploymentReadinessCheck());
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to create database backup', 'Close', { duration: 4500 });
    } finally {
      this.backupRunning.set(false);
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

  updateAuditFilter(key: string, value: any) {
    this.auditFilters.update((current) => ({ ...current, [key]: value }));
    this.syncSelectedAudit();
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
    } else if (this.scope() === 'AUDIT') {
      this.auditFilters.set({
        source: '',
        category: '',
        action: '',
        severity: '',
        status: '',
        entityType: '',
        entityId: '',
        search: '',
        dateFrom: '',
        dateTo: '',
        limit: 200,
      });
      this.syncSelectedAudit();
    } else {
      this.systemFilters.set({
        level: '',
        source: '',
        entityType: '',
        entityId: '',
        dateFrom: '',
        dateTo: '',
        search: '',
        limit: 200,
      });
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

  selectAudit(row: any) {
    this.selectedAudit.set(row);
  }

  statusClass(status?: string | null) {
    const value = String(status ?? '').toLowerCase();
    if (['delivered', 'success', 'ready', 'ok'].includes(value)) return 'status-delivered';
    if (['failed', 'error', 'critical', 'blocked', 'blocker'].includes(value)) return 'status-failed';
    if (['started', 'warn', 'warning', 'requested', 'ready_with_warnings'].includes(value)) return 'status-started';
    return 'status-neutral';
  }

  readinessClass(checkOrStatus?: { severity?: string; passed?: boolean } | string | null) {
    if (typeof checkOrStatus === 'string') return this.statusClass(checkOrStatus);
    if (!checkOrStatus) return 'status-neutral';
    if (checkOrStatus.passed) return 'status-delivered';
    return this.statusClass(checkOrStatus.severity);
  }

  readinessStatusLabel(status?: string | null) {
    const value = String(status ?? '').toUpperCase();
    if (value === 'READY_WITH_WARNINGS') return 'Ready with warnings';
    if (value === 'BLOCKED') return 'Blocked';
    if (value === 'READY') return 'Ready';
    return value || 'Not checked';
  }

  releaseRiskClass(risk?: string | null) {
    const value = String(risk ?? '').toUpperCase();
    return value === 'REQUIRED' ? 'status-started' : 'status-neutral';
  }

  releaseRiskLabel(risk?: string | null) {
    const value = String(risk ?? '').toUpperCase();
    return value === 'REQUIRED' ? 'Required' : 'Recommended';
  }

  selectedDeliveryAlerts(row: any): DeliveryNote[] {
    if (!row) return [];

    const notes: DeliveryNote[] = [];
    const errors = this.queueErrors(row);
    const warnings = this.queueWarnings(row);

    if (row.status === 'FAILED' && row.error_message) {
      notes.push({ kind: 'bad', text: 'This delivery event ended in failure and should be reviewed before retrying similar traffic.' });
    }
    if (row.status === 'STARTED') {
      notes.push({ kind: 'warn', text: 'This event was recorded as started, but the visible row does not yet show a final outcome.' });
    }
    if (errors.length) {
      notes.push({ kind: 'bad', text: `${errors.length} transformation issue(s) were recorded on the queue item.` });
    }
    if (warnings.length) {
      notes.push({ kind: 'warn', text: `${warnings.length} transformation warning(s) were recorded on the queue item.` });
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

  private auditQuery() {
    const q = this.auditFilters();
    return {
      q: q.search || undefined,
      source: q.source || undefined,
      category: q.category || undefined,
      action: q.action || undefined,
      severity: q.severity || undefined,
      status: q.status || undefined,
      entityType: q.entityType || undefined,
      entityId: q.entityId || undefined,
      from: q.dateFrom || undefined,
      to: q.dateTo || undefined,
      limit: Number(q.limit || 200),
    };
  }

  private async safeAuditSummary() {
    try {
      return await this.api.auditEventsSummary(7);
    } catch {
      return null;
    }
  }

  private systemQuery() {
    const q = this.systemFilters();
    return {
      level: q.level || undefined,
      source: q.source || undefined,
      entityType: q.entityType || undefined,
      entityId: q.entityId || undefined,
      dateFrom: q.dateFrom || undefined,
      dateTo: q.dateTo || undefined,
      search: q.search || undefined,
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

  queuePayload(row: any) {
    return this.parseJsonSafe(row?.queue_payload_json);
  }

  queueSourceSnapshot(row: any) {
    return this.parseJsonSafe(row?.queue_source_snapshot_json);
  }

  queueTransformSummary(row: any) {
    return this.parseJsonSafe(row?.queue_transform_summary_json);
  }

  queueWarnings(row: any): string[] {
    return this.asStringArray(this.parseJsonSafe(row?.queue_transform_warnings_json));
  }

  queueErrors(row: any): string[] {
    return this.asStringArray(this.parseJsonSafe(row?.queue_transform_errors_json));
  }

  hasDeliveryPayloadSnapshot(row: any) {
    return !!this.queuePayload(row) || !!this.queueSourceSnapshot(row) || !!this.queueTransformSummary(row);
  }

  chipsOf(value: any) {
    return Array.isArray(value) ? value.filter(Boolean).map((item) => String(item)) : [];
  }

  formatJson(value: any) {
    if (!value) return '';
    const redacted = this.redactSensitive(value);
    if (typeof redacted === 'string') {
      try {
        return JSON.stringify(this.redactSensitive(JSON.parse(redacted)), null, 2);
      } catch {
        return this.redactSensitiveText(redacted);
      }
    }
    return JSON.stringify(redacted, null, 2);
  }

  private redactSensitive(value: any): any {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return this.redactSensitiveText(value);
    if (Array.isArray(value)) return value.map((item) => this.redactSensitive(item));
    if (typeof value !== 'object') return value;

    const out: Record<string, any> = {};
    for (const [key, child] of Object.entries(value)) {
      out[key] = /(password|passwd|token|secret|api[_-]?key|authorization|auth|credential|private|bearer|sessionid|cookie)/i.test(key)
        ? '[REDACTED]'
        : this.redactSensitive(child);
    }
    return out;
  }

  private redactSensitiveText(value: string): string {
    return String(value ?? '').replace(/(bearer\s+)[a-z0-9._\-]+|(basic\s+)[a-z0-9+/=]+|((?:password|passwd|token|api[_-]?key|authorization)=)[^&\s]+/ig, (_match, bearer, basic, key) => {
      if (bearer) return `${bearer}[REDACTED]`;
      if (basic) return `${basic}[REDACTED]`;
      if (key) return `${key}[REDACTED]`;
      return '[REDACTED]';
    });
  }

  private asStringArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item));
    return [String(value)];
  }

  auditDetailsPayload(row: any) {
    return row?.details ?? this.parseJsonSafe(row?.details_json);
  }

  auditBeforePayload(row: any) {
    return row?.before ?? this.parseJsonSafe(row?.before_json);
  }

  auditAfterPayload(row: any) {
    return row?.after ?? this.parseJsonSafe(row?.after_json);
  }

  auditActionLabel(row: any) {
    return String(row?.action ?? '—').replace(/_/g, ' ');
  }


  formatBytes(value?: number | null) {
    const bytes = Number(value ?? 0);
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unit = 0;
    while (size >= 1024 && unit < units.length - 1) {
      size /= 1024;
      unit += 1;
    }
    return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
  }

  statusLabel(value: boolean) {
    return value ? 'Ready' : 'Needs review';
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

  private syncSelectedAudit() {
    const rows = this.filteredAuditRows();
    const current = this.selectedAudit();
    if (!current) {
      this.selectedAudit.set(rows[0] ?? null);
      return;
    }
    const stillVisible = rows.find((row) => row.id === current.id) ?? null;
    this.selectedAudit.set(stillVisible ?? rows[0] ?? null);
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
