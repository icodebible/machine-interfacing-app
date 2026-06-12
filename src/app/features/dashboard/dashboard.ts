import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';

import { PlatformApiService } from '../../core/platform/platform-api.service';

type RuntimeStatus = 'connected' | 'connecting' | 'error' | 'idle' | 'stopped' | 'disconnected';

type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

type MachineOverviewRow = {
  id: string;
  name: string;
  labName: string | null;
  connectionType: string;
  protocol: 'ASTM' | 'HL7' | 'RAW';
  isActive: number;
  runtimeStatus: RuntimeStatus;
  runtimeUpdatedAt: string | null;
  simulationRunning: boolean;
  parsedRecentCount: number;
  normalizedRecentCount: number;
  latestParsedAt: string | null;
  latestNormalizedAt: string | null;
};

type AttentionItem = {
  title: string;
  subtitle: string;
  route: string;
  tone: 'bad' | 'warn' | 'info';
};

type BreakdownItem = {
  label: string;
  count: number;
  secondary?: string;
  pct: number;
};

type TrendBucket = {
  label: string;
  parsed: number;
  normalized: number;
  parsedPct: number;
  normalizedPct: number;
};

type DeliveryMixItem = {
  label: 'Delivered' | 'Queued' | 'Failed' | 'Pending Approval';
  count: number;
  pct: number;
  tone: 'ok' | 'info' | 'bad' | 'warn';
};

type LabTableRow = {
  labName: string;
  machines: number;
  connected: number;
  parsedRecent: number;
  normalizedRecent: number;
  attention: number;
};

type ConnectorHealthRow = {
  label: string;
  total: number;
  active: number;
  queued: number;
  failed: number;
};

type MappingRuleRow = {
  id: string;
  target_type: string;
  source_field?: string | null;
  destination_field: string;
  transform_kind: 'direct' | 'constant' | 'lookup' | string;
  constant_value?: string | null;
  enabled: number;
  value_mapping_enabled?: number | null;
  unmapped_behavior?: string | null;
  default_destination_value?: string | null;
};

type MappingValueTranslationRow = {
  id: string;
  mapping_rule_id: string;
  source_value: string;
  destination_value?: string | null;
  enabled: number;
  note?: string | null;
};

type LisProfileParameter = {
  analyzer_code: string;
  display_name?: string | null;
  concept_uuid?: string | null;
  allocation_uuid?: string | null;
  datatype?: string | null;
  value_type?: 'coded' | 'numeric' | 'text' | string | null;
  required?: number | boolean | null;
  aliases?: string[] | null;
};

type LisProfileRow = {
  id: string;
  target_id: string;
  target_name?: string | null;
  target_type?: string | null;
  profile_code: string;
  profile_name: string;
  order_concept_uuid?: string | null;
  order_display?: string | null;
  enabled: number;
  parameters: LisProfileParameter[];
  updated_at?: string | null;
};

type MappingCoverageStatus = 'READY' | 'WARNING' | 'BLOCKED' | 'DISABLED';

type MappingCoverageRow = {
  profileId: string;
  profileCode: string;
  profileName: string;
  targetId: string;
  targetName: string;
  targetType: string;
  enabled: number;
  orderConceptUuid?: string | null;
  orderDisplay?: string | null;
  status: MappingCoverageStatus;
  tone: 'ok' | 'warn' | 'bad' | 'idle';
  parameterCount: number;
  requiredParameterCount: number;
  codedParameterCount: number;
  missingConceptCount: number;
  missingAllocationCount: number;
  missingCodedAnswerCount: number;
  missingRequiredCodeCount: number;
  instrumentReady: boolean;
  testedByReady: boolean;
  targetEnabled: boolean;
  messages: string[];
  quickActions: Array<{ label: string; route: string }>;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTabsModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);

  loading = signal(false);
  lastRefreshed = signal<string | null>(null);

  machineRows = signal<MachineOverviewRow[]>([]);
  targets = signal<any[]>([]);
  pendingApprovals = signal<any[]>([]);
  queueRows = signal<any[]>([]);
  deliveryRows = signal<any[]>([]);
  deliveryAudit = signal<any[]>([]);
  trend24h = signal<TrendBucket[]>([]);
  mappingRows = signal<MappingRuleRow[]>([]);
  mappingTranslations = signal<MappingValueTranslationRow[]>([]);
  lisProfiles = signal<LisProfileRow[]>([]);

  summary = computed(() => {
    const rows = this.machineRows();
    const targets = this.targets();
    const pendingApprovals = this.pendingApprovals();
    const queueRows = this.queueRows();
    const deliveryRows = this.deliveryRows();
    const connected = rows.filter((row) => row.runtimeStatus === 'connected').length;
    const simulations = rows.filter((row) => row.simulationRunning).length;
    const parsedRecent = rows.reduce((sum, row) => sum + row.parsedRecentCount, 0);
    const normalizedRecent = rows.reduce((sum, row) => sum + row.normalizedRecentCount, 0);
    const failedDeliveries = queueRows.filter((row) => row.delivery_status === 'FAILED').length;
    const pendingQueue = queueRows.filter((row) => row.delivery_status === 'PENDING').length;
    const deliveredRecent = deliveryRows.filter(
      (row) => row.delivery_status === 'DELIVERED',
    ).length;
    const machinesNeedingAttention = rows.filter((row) => this.needsMachineAttention(row)).length;
    const activeTargets = targets.filter((target) => target.enabled === 1).length;

    return {
      machines: rows.length,
      connected,
      simulations,
      parsedRecent,
      normalizedRecent,
      pendingApprovals: pendingApprovals.length,
      pendingQueue,
      deliveredRecent,
      failedDeliveries,
      machinesNeedingAttention,
      activeTargets,
    };
  });

  mappingCoverageRows = computed<MappingCoverageRow[]>(() => {
    const targets = this.targets();
    const profiles = this.lisProfiles();
    const rules = this.mappingRows().filter((rule) => Number(rule.enabled ?? 0) === 1 && this.isLisTargetType(rule.target_type));
    const translations = this.mappingTranslations().filter((row) => Number(row.enabled ?? 0) === 1);
    const targetById = new Map(targets.map((target: any) => [String(target.id), target]));
    const translationByRule = new Map<string, MappingValueTranslationRow[]>();

    for (const translation of translations) {
      const bucket = translationByRule.get(translation.mapping_rule_id) ?? [];
      bucket.push(translation);
      translationByRule.set(translation.mapping_rule_id, bucket);
    }

    return profiles
      .map((profile) => this.buildMappingCoverageRow(profile, targetById.get(profile.target_id), rules, translationByRule))
      .sort((a, b) => this.coverageSortWeight(a.status) - this.coverageSortWeight(b.status) || a.profileName.localeCompare(b.profileName));
  });

  mappingCoverageSummary = computed(() => {
    const rows = this.mappingCoverageRows();
    const activeRows = rows.filter((row) => row.status !== 'DISABLED');
    const missingMappings = activeRows.reduce(
      (sum, row) =>
        sum + row.missingConceptCount + row.missingCodedAnswerCount + row.missingRequiredCodeCount + (row.instrumentReady ? 0 : 1) + (row.testedByReady ? 0 : 1),
      0,
    );

    return {
      profiles: rows.length,
      ready: activeRows.filter((row) => row.status === 'READY').length,
      warnings: activeRows.filter((row) => row.status === 'WARNING').length,
      blocked: activeRows.filter((row) => row.status === 'BLOCKED').length,
      missingMappings,
      disabled: rows.filter((row) => row.status === 'DISABLED').length,
    };
  });

  mappingCoverageAttention = computed(() =>
    this.mappingCoverageRows().filter((row) => row.status === 'BLOCKED' || row.status === 'WARNING').slice(0, 8),
  );

  machineAttention = computed<AttentionItem[]>(() =>
    this.machineRows()
      .filter((row) => this.needsMachineAttention(row))
      .slice(0, 5)
      .map((row) => ({
        title: row.name,
        subtitle: `${this.runtimeLabel(row.runtimeStatus)} · ${row.labName || 'No lab'} · ${row.connectionType}`,
        route: '/app/live-monitor',
        tone: row.runtimeStatus === 'error' ? 'bad' : 'warn',
      })),
  );

  approvalAttention = computed<AttentionItem[]>(() =>
    this.pendingApprovals()
      .slice(0, 5)
      .map((row: any) => ({
        title: row.normalized_result_id,
        subtitle: `Awaiting approval${row.approval_policy_id ? ` · Policy ${row.approval_policy_id}` : ''}`,
        route: '/app/pending-approvals',
        tone: 'warn',
      })),
  );

  deliveryAttention = computed<AttentionItem[]>(() => {
    const failedQueue = this.queueRows()
      .filter((row) => row.delivery_status === 'FAILED')
      .slice(0, 5)
      .map((row) => ({
        title: row.target_name || row.target_id || row.id,
        subtitle: row.last_error || 'Delivery failed',
        route: '/app/outbound-queue',
        tone: 'bad' as const,
      }));

    if (failedQueue.length > 0) return failedQueue;

    return this.deliveryAudit()
      .filter((row: any) => row.status === 'FAILED')
      .slice(0, 5)
      .map((row: any) => ({
        title: row.target_name || row.target_id || row.queue_id,
        subtitle: row.error_message || 'Audit reported a failed delivery',
        route: '/app/delivery-history',
        tone: 'bad' as const,
      }));
  });

  recentMachines = computed(() =>
    [...this.machineRows()]
      .sort((a, b) => this.latestMachineActivity(b) - this.latestMachineActivity(a))
      .slice(0, 8),
  );

  protocolBreakdown = computed<BreakdownItem[]>(() => {
    const bucket = new Map<string, { count: number; normalized: number }>();

    for (const row of this.machineRows()) {
      const current = bucket.get(row.protocol) ?? { count: 0, normalized: 0 };
      current.count += row.parsedRecentCount;
      current.normalized += row.normalizedRecentCount;
      bucket.set(row.protocol, current);
    }

    return this.toBreakdown(
      Array.from(bucket.entries()).map(([label, value]) => ({
        label,
        count: value.count,
        secondary: `Normalized ${value.normalized}`,
      })),
    );
  });

  connectionBreakdown = computed<BreakdownItem[]>(() => {
    const bucket = new Map<string, number>();
    for (const row of this.machineRows()) {
      bucket.set(row.connectionType, (bucket.get(row.connectionType) ?? 0) + 1);
    }
    return this.toBreakdown(
      Array.from(bucket.entries()).map(([label, count]) => ({ label, count })),
    );
  });

  targetBreakdown = computed<BreakdownItem[]>(() => {
    const bucket = new Map<TargetType | string, { total: number; active: number }>();
    for (const target of this.targets()) {
      const current = bucket.get(target.type) ?? { total: 0, active: 0 };
      current.total += 1;
      if (target.enabled === 1) current.active += 1;
      bucket.set(target.type, current);
    }

    return this.toBreakdown(
      Array.from(bucket.entries()).map(([label, value]) => ({
        label,
        count: value.total,
        secondary: `${value.active} active`,
      })),
    );
  });

  deliveryMix = computed<DeliveryMixItem[]>(() => {
    const delivered = this.deliveryRows().filter(
      (row) => row.delivery_status === 'DELIVERED',
    ).length;
    const queued = this.queueRows().filter((row) => row.delivery_status === 'PENDING').length;
    const failed = this.queueRows().filter((row) => row.delivery_status === 'FAILED').length;
    const pendingApproval = this.pendingApprovals().length;
    const total = delivered + queued + failed + pendingApproval || 1;

    return [
      {
        label: 'Delivered',
        count: delivered,
        pct: Math.round((delivered / total) * 100),
        tone: 'ok',
      },
      { label: 'Queued', count: queued, pct: Math.round((queued / total) * 100), tone: 'info' },
      { label: 'Failed', count: failed, pct: Math.round((failed / total) * 100), tone: 'bad' },
      {
        label: 'Pending Approval',
        count: pendingApproval,
        pct: Math.round((pendingApproval / total) * 100),
        tone: 'warn',
      },
    ];
  });

  deliveryMixGradient = computed(() => {
    const mix = this.deliveryMix();
    const colors: Record<DeliveryMixItem['tone'], string> = {
      ok: '#16a34a',
      info: '#0f766e',
      bad: '#dc2626',
      warn: '#d97706',
    };

    let cursor = 0;
    const stops = mix.map((item) => {
      const start = cursor;
      cursor += item.pct;
      return `${colors[item.tone]} ${start}% ${cursor}%`;
    });

    return `conic-gradient(${stops.join(', ')})`;
  });

  labTable = computed<LabTableRow[]>(() => {
    const map = new Map<string, LabTableRow>();
    for (const row of this.machineRows()) {
      const key = row.labName?.trim() || 'Unassigned';
      const current = map.get(key) ?? {
        labName: key,
        machines: 0,
        connected: 0,
        parsedRecent: 0,
        normalizedRecent: 0,
        attention: 0,
      };
      current.machines += 1;
      if (row.runtimeStatus === 'connected') current.connected += 1;
      current.parsedRecent += row.parsedRecentCount;
      current.normalizedRecent += row.normalizedRecentCount;
      if (this.needsMachineAttention(row)) current.attention += 1;
      map.set(key, current);
    }

    return Array.from(map.values())
      .sort((a, b) => b.normalizedRecent - a.normalizedRecent || b.parsedRecent - a.parsedRecent)
      .slice(0, 8);
  });

  connectorHealthTable = computed<ConnectorHealthRow[]>(() => {
    const map = new Map<string, ConnectorHealthRow>();

    for (const target of this.targets()) {
      const key = target.type || 'UNKNOWN';
      const current = map.get(key) ?? {
        label: key,
        total: 0,
        active: 0,
        queued: 0,
        failed: 0,
      };
      current.total += 1;
      if (target.enabled === 1) current.active += 1;
      map.set(key, current);
    }

    for (const row of this.queueRows()) {
      const key = row.target_type || 'UNKNOWN';
      const current = map.get(key) ?? {
        label: key,
        total: 0,
        active: 0,
        queued: 0,
        failed: 0,
      };
      if (row.delivery_status === 'PENDING') current.queued += 1;
      if (row.delivery_status === 'FAILED') current.failed += 1;
      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total || b.failed - a.failed);
  });

  constructor() {
    this.refresh();
  }

  async refresh() {
    try {
      this.loading.set(true);

      const [
        machines,
        runtimeStates,
        simStates,
        targets,
        approvals,
        queueRows,
        deliveryRows,
        deliveryAudit,
        mappings,
        lisProfiles,
      ] = await Promise.all([
        this.api.machinesList(),
        this.api.machinesRuntimeStates(),
        this.api.machinesSimStates(),
        this.api.targetsList(),
        this.api.resultsPendingApprovals(100),
        this.api.outboundQueueList(200),
        this.api.deliveryHistoryList(200),
        this.api.deliveryAuditList({ limit: 100 }),
        this.api.mappingsList(),
        this.api.lisTestOrderProfilesList(null),
      ]);

      const runtimeMap = new Map<string, { status?: RuntimeStatus | string; updatedAt?: string | null }>(
        (runtimeStates ?? []).map((row: any) => [String(row.machineId), row]),
      );
      const simMap = new Map<string, { running?: boolean }>(
        (simStates ?? []).map((row: any) => [String(row.machineId), row]),
      );

      const activitySettled = await Promise.allSettled(
        (machines ?? []).map(async (machine: any) => {
          const [parsed, normalized] = await Promise.all([
            this.api.machinesParsedList(machine.id, 50),
            this.api.machinesNormalizedList(machine.id, 50),
          ]);
          return {
            machineId: machine.id,
            parsed: parsed ?? [],
            normalized: normalized ?? [],
          };
        }),
      );

      const activityMap = new Map<string, { parsed: any[]; normalized: any[] }>();
      let failedSources = 0;
      const parsedTimes: string[] = [];
      const normalizedTimes: string[] = [];

      for (const result of activitySettled) {
        if (result.status === 'fulfilled') {
          activityMap.set(result.value.machineId, {
            parsed: result.value.parsed,
            normalized: result.value.normalized,
          });
          parsedTimes.push(
            ...(result.value.parsed ?? []).map((row: any) => row.created_at).filter(Boolean),
          );
          normalizedTimes.push(
            ...(result.value.normalized ?? []).map((row: any) => row.created_at).filter(Boolean),
          );
        } else {
          failedSources += 1;
        }
      }

      const lisMappingRules = (mappings ?? []).filter((rule: MappingRuleRow) => this.isLisTargetType(rule.target_type));
      const translationSettled = await Promise.allSettled(
        lisMappingRules.map((rule: MappingRuleRow) => this.api.mappingValueTranslationsList(rule.id)),
      );
      const mappingTranslations = translationSettled.flatMap((result: PromiseSettledResult<MappingValueTranslationRow[]>) =>
        result.status === 'fulfilled' ? ((result.value ?? []) as MappingValueTranslationRow[]) : [],
      );

      const machineRows: MachineOverviewRow[] = (machines ?? []).map((machine: any) => {
        const runtime = runtimeMap.get(String(machine.id));
        const sim = simMap.get(String(machine.id));
        const activity = activityMap.get(machine.id) ?? { parsed: [], normalized: [] };
        const latestParsedAt = activity.parsed?.[0]?.created_at ?? null;
        const latestNormalizedAt = activity.normalized?.[0]?.created_at ?? null;

        return {
          id: machine.id,
          name: machine.name,
          labName: machine.lab_name ?? null,
          connectionType: machine.connection_type,
          protocol: machine.protocol,
          runtimeStatus: (runtime?.status ?? 'disconnected') as RuntimeStatus,
          runtimeUpdatedAt: runtime?.updatedAt ?? null,
          simulationRunning: !!sim?.running,
          parsedRecentCount: this.countRecent(activity.parsed ?? []),
          normalizedRecentCount: this.countRecent(activity.normalized ?? []),
          latestParsedAt,
          latestNormalizedAt,
          isActive: machine.is_active,
        };
      });

      this.machineRows.set(machineRows);
      this.targets.set(targets ?? []);
      this.pendingApprovals.set(approvals ?? []);
      this.queueRows.set(queueRows ?? []);
      this.deliveryRows.set(deliveryRows ?? []);
      this.deliveryAudit.set(deliveryAudit ?? []);
      this.mappingRows.set((mappings ?? []) as MappingRuleRow[]);
      this.mappingTranslations.set(mappingTranslations);
      this.lisProfiles.set((lisProfiles ?? []) as LisProfileRow[]);
      this.trend24h.set(this.build24hTrend(parsedTimes, normalizedTimes));
      this.lastRefreshed.set(new Date().toISOString());

      if (failedSources > 0) {
        this.snack.open(
          `Dashboard loaded with ${failedSources} machine activity source${failedSources > 1 ? 's' : ''} skipped.`,
          'Close',
          { duration: 2600 },
        );
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load dashboard', 'Close', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
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

  relativeTime(value?: string | null): string {
    if (!value) return '—';
    const diffMs = Date.now() - this.dateValue(value);
    if (diffMs < 0) return 'just now';
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  runtimeTone(status: RuntimeStatus): 'ok' | 'warn' | 'bad' | 'idle' {
    switch (status) {
      case 'connected':
        return 'ok';
      case 'connecting':
      case 'idle':
        return 'warn';
      case 'error':
        return 'bad';
      case 'stopped':
      case 'disconnected':
      default:
        return 'idle';
    }
  }

  deliveryTone(tone: DeliveryMixItem['tone']) {
    return tone;
  }

  coverageTone(status: MappingCoverageStatus): 'ok' | 'warn' | 'bad' | 'idle' {
    if (status === 'READY') return 'ok';
    if (status === 'BLOCKED') return 'bad';
    if (status === 'WARNING') return 'warn';
    return 'idle';
  }

  coverageStatusLabel(status: MappingCoverageStatus): string {
    switch (status) {
      case 'READY':
        return 'Ready';
      case 'BLOCKED':
        return 'Blocked';
      case 'WARNING':
        return 'Needs review';
      case 'DISABLED':
      default:
        return 'Disabled';
    }
  }

  coverageMainIssue(row: MappingCoverageRow): string {
    if (!row.targetEnabled) return 'Target disabled';
    if (row.status === 'DISABLED') return 'Profile disabled';
    if (row.missingRequiredCodeCount > 0) return `${row.missingRequiredCodeCount} required analyzer code gap${row.missingRequiredCodeCount === 1 ? '' : 's'}`;
    if (row.missingConceptCount > 0) return `${row.missingConceptCount} concept mapping gap${row.missingConceptCount === 1 ? '' : 's'}`;
    if (row.missingCodedAnswerCount > 0) return `${row.missingCodedAnswerCount} coded-answer gap${row.missingCodedAnswerCount === 1 ? '' : 's'}`;
    if (!row.instrumentReady) return 'Instrument default missing';
    if (!row.testedByReady) return 'Tested-by default missing';
    if (row.missingAllocationCount > 0) return `${row.missingAllocationCount} allocation warning${row.missingAllocationCount === 1 ? '' : 's'}`;
    return 'Profile mappings look ready';
  }

  private runtimeLabel(status: RuntimeStatus): string {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting';
      case 'error':
        return 'Error';
      case 'idle':
        return 'Idle';
      case 'stopped':
        return 'Stopped';
      case 'disconnected':
      default:
        return 'Disconnected';
    }
  }

  private countRecent(rows: any[]): number {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return (rows ?? []).filter((row) => this.dateValue(row.created_at) >= cutoff).length;
  }

  private needsMachineAttention(row: MachineOverviewRow): boolean {
    return row.runtimeStatus === 'error' || row.runtimeStatus === 'connecting';
  }

  private latestMachineActivity(row: MachineOverviewRow): number {
    return Math.max(
      this.dateValue(row.runtimeUpdatedAt),
      this.dateValue(row.latestParsedAt),
      this.dateValue(row.latestNormalizedAt),
    );
  }

  private dateValue(value?: string | null): number {
    const time = value ? new Date(value).getTime() : Number.NaN;
    return Number.isNaN(time) ? 0 : time;
  }

  private buildMappingCoverageRow(
    profile: LisProfileRow,
    target: any | undefined,
    rules: MappingRuleRow[],
    translationsByRule: Map<string, MappingValueTranslationRow[]>,
  ): MappingCoverageRow {
    const parameters = profile.parameters ?? [];
    const enabled = Number(profile.enabled ?? 0) === 1;
    const targetEnabled = Number(target?.enabled ?? 0) === 1;
    const messages: string[] = [];
    const conceptRules = rules.filter((rule) => this.isConceptDestination(rule.destination_field));
    const allocationRules = rules.filter((rule) => this.isAllocationDestination(rule.destination_field));
    const codedAnswerRules = rules.filter((rule) => this.isCodedAnswerDestination(rule.destination_field));
    const instrumentReady = this.hasConstantDestination(rules, ['lis.instrument.uuid', 'instrument.uuid']);
    const testedByReady = this.hasConstantDestination(rules, ['lis.testedby', 'lis.testedby.uuid', 'testedby']);

    const missingRequiredCodeCount = parameters.filter((parameter) => Number(parameter.required ?? 0) === 1 && !this.clean(parameter.analyzer_code)).length;
    const missingConceptCount = parameters.filter((parameter) => {
      if (this.clean(parameter.concept_uuid)) return false;
      return !this.hasTranslationForParameter(parameter, conceptRules, translationsByRule, 'code');
    }).length;
    const missingAllocationCount = parameters.filter((parameter) => {
      if (this.clean(parameter.allocation_uuid)) return false;
      return !this.hasTranslationForParameter(parameter, allocationRules, translationsByRule, 'code');
    }).length;
    const codedParameters = parameters.filter((parameter) => this.isCodedParameter(parameter));
    const missingCodedAnswerCount = codedParameters.filter(
      (parameter) => !this.hasTranslationForParameter(parameter, codedAnswerRules, translationsByRule, 'result'),
    ).length;

    if (!profile.order_concept_uuid) messages.push('Order concept UUID is missing from this profile.');
    if (!parameters.length) messages.push('No profile parameters are configured.');
    if (missingRequiredCodeCount) messages.push(`${missingRequiredCodeCount} required parameter(s) have no analyzer code.`);
    if (missingConceptCount) messages.push(`${missingConceptCount} parameter concept mapping gap(s) were found.`);
    if (missingCodedAnswerCount) messages.push(`${missingCodedAnswerCount} coded parameter(s) need analyzer value → OpenMRS coded answer mappings.`);
    if (!instrumentReady) messages.push('Default LIS instrument UUID mapping is not configured.');
    if (!testedByReady) messages.push('Default tested-by mapping is not configured.');
    if (missingAllocationCount) messages.push(`${missingAllocationCount} allocation mapping warning(s); runtime sample allocation fallback may be required.`);
    if (!targetEnabled) messages.push('Target is disabled, so this coverage is not currently actionable for delivery.');

    let status: MappingCoverageStatus = 'READY';
    if (!enabled) status = 'DISABLED';
    else if (!targetEnabled || !profile.order_concept_uuid || !parameters.length || missingRequiredCodeCount || missingConceptCount || missingCodedAnswerCount || !instrumentReady || !testedByReady) {
      status = 'BLOCKED';
    } else if (missingAllocationCount) {
      status = 'WARNING';
    }

    return {
      profileId: profile.id,
      profileCode: profile.profile_code,
      profileName: profile.profile_name,
      targetId: profile.target_id,
      targetName: profile.target_name || target?.name || profile.target_id,
      targetType: profile.target_type || target?.type || 'LIS',
      enabled: Number(profile.enabled ?? 0),
      orderConceptUuid: profile.order_concept_uuid,
      orderDisplay: profile.order_display,
      status,
      tone: this.coverageTone(status),
      parameterCount: parameters.length,
      requiredParameterCount: parameters.filter((parameter) => Number(parameter.required ?? 0) === 1).length,
      codedParameterCount: codedParameters.length,
      missingConceptCount,
      missingAllocationCount,
      missingCodedAnswerCount,
      missingRequiredCodeCount,
      instrumentReady,
      testedByReady,
      targetEnabled,
      messages: messages.length ? messages : ['All key LIS mapping coverage checks passed for this profile.'],
      quickActions: [
        { label: 'Profiles', route: '/app/lis-test-order-profiles' },
        { label: 'Mappings', route: '/app/mappings' },
        { label: 'Targets', route: '/app/targets' },
      ],
    };
  }

  private hasTranslationForParameter(
    parameter: LisProfileParameter,
    rules: MappingRuleRow[],
    translationsByRule: Map<string, MappingValueTranslationRow[]>,
    mode: 'code' | 'result',
  ): boolean {
    const aliases = this.parameterAliases(parameter);
    if (!aliases.length || !rules.length) return false;

    for (const rule of rules) {
      const rows = translationsByRule.get(rule.id) ?? [];
      for (const translation of rows) {
        const source = this.clean(translation.source_value).toUpperCase();
        if (!source) continue;
        if (mode === 'code' && aliases.some((alias) => source === alias || source.includes(alias))) return true;
        if (mode === 'result' && aliases.some((alias) => source.startsWith(`${alias}=`) || source.includes(`${alias}=`))) return true;
      }
    }

    return false;
  }

  private parameterAliases(parameter: LisProfileParameter): string[] {
    const values = [parameter.analyzer_code, parameter.display_name, ...(parameter.aliases ?? [])]
      .map((value) => this.clean(value).toUpperCase().replace(/[^A-Z0-9]/g, ''))
      .filter(Boolean);
    return Array.from(new Set(values));
  }

  private isCodedParameter(parameter: LisProfileParameter): boolean {
    const valueType = this.clean(parameter.value_type).toLowerCase();
    const datatype = this.clean(parameter.datatype).toLowerCase();
    return valueType === 'coded' || datatype.includes('coded') || datatype.includes('ce');
  }

  private isLisTargetType(value: unknown): boolean {
    const type = this.clean(value).toUpperCase();
    return type === 'LIS' || type === 'OPENMRS';
  }

  private isConceptDestination(value: unknown): boolean {
    const destination = this.clean(value).toLowerCase();
    return destination === 'lis.parameter.conceptuuid' || destination === 'lis.concept.uuid' || destination.endsWith('.conceptuuid') || destination.endsWith('.concept.uuid');
  }

  private isAllocationDestination(value: unknown): boolean {
    const destination = this.clean(value).toLowerCase();
    return destination === 'lis.parameter.allocationuuid' || destination === 'lis.testallocation.uuid' || destination.endsWith('.allocationuuid') || destination.endsWith('.testallocation.uuid');
  }

  private isCodedAnswerDestination(value: unknown): boolean {
    const destination = this.clean(value).toLowerCase();
    return destination === 'lis.valuecoded.uuid' || destination === 'lis.value_coded.uuid' || destination.endsWith('.valuecoded.uuid') || destination.endsWith('.value_coded.uuid');
  }

  private hasConstantDestination(rules: MappingRuleRow[], destinations: string[]): boolean {
    const keys = new Set(destinations.map((destination) => destination.toLowerCase()));
    return rules.some((rule) =>
      Number(rule.enabled ?? 0) === 1 &&
      rule.transform_kind === 'constant' &&
      keys.has(this.clean(rule.destination_field).toLowerCase()) &&
      !!this.clean(rule.constant_value),
    );
  }

  private coverageSortWeight(status: MappingCoverageStatus): number {
    if (status === 'BLOCKED') return 0;
    if (status === 'WARNING') return 1;
    if (status === 'READY') return 2;
    return 3;
  }

  private clean(value: unknown): string {
    return String(value ?? '').trim();
  }

  private toBreakdown(
    items: Array<{ label: string; count: number; secondary?: string }>,
  ): BreakdownItem[] {
    const total = items.reduce((sum, item) => sum + item.count, 0) || 1;
    return items
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        label: item.label,
        count: item.count,
        secondary: item.secondary,
        pct: Math.max(6, Math.round((item.count / total) * 100)),
      }));
  }

  private build24hTrend(parsedTimes: string[], normalizedTimes: string[]): TrendBucket[] {
    const buckets = Array.from({ length: 24 }, (_, index) => {
      const d = new Date();
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() - (23 - index));
      return {
        key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`,
        label: `${String(d.getHours()).padStart(2, '0')}:00`,
        parsed: 0,
        normalized: 0,
      };
    });

    const indexByKey = new Map(buckets.map((bucket, idx) => [bucket.key, idx]));
    const pushValue = (value: string, field: 'parsed' | 'normalized') => {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return;
      d.setMinutes(0, 0, 0);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
      const idx = indexByKey.get(key);
      if (idx == null) return;
      buckets[idx][field] += 1;
    };

    parsedTimes.forEach((value) => pushValue(value, 'parsed'));
    normalizedTimes.forEach((value) => pushValue(value, 'normalized'));

    const maxValue = Math.max(
      1,
      ...buckets.map((bucket) => Math.max(bucket.parsed, bucket.normalized)),
    );

    return buckets.map((bucket) => ({
      label: bucket.label,
      parsed: bucket.parsed,
      normalized: bucket.normalized,
      parsedPct: Math.max(bucket.parsed > 0 ? 10 : 0, Math.round((bucket.parsed / maxValue) * 100)),
      normalizedPct: Math.max(
        bucket.normalized > 0 ? 10 : 0,
        Math.round((bucket.normalized / maxValue) * 100),
      ),
    }));
  }
}
