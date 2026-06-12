import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

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
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlatformApiService } from '../../core/platform/platform-api.service';
import { LisTestOrderProfileDialog, ProfileDialogResult } from '../../shared/dialogs/lis-test-order-profile-dialog/lis-test-order-profile-dialog';
// import {
//   LisTestOrderProfileDialog,
//   type ProfileDialogResult,
// } from './lis-test-order-profile-dialog';

export type TargetRow = {
  id: string;
  name: string;
  type: string;
  base_url?: string | null;
  enabled?: number;
};

export type ProfileValueType = 'coded' | 'numeric' | 'text';

export type ProfileParameter = {
  analyzer_code: string;
  display_name?: string | null;
  concept_uuid?: string | null;
  allocation_uuid?: string | null;
  datatype?: string | null;
  value_type: ProfileValueType;
  required: number;
  sort_order?: number;
  aliases?: string[];
};

export type ProfileRow = {
  id: string;
  target_id: string;
  target_name?: string | null;
  profile_code: string;
  profile_name: string;
  order_concept_uuid?: string | null;
  order_display?: string | null;
  order_name_includes?: string[];
  enabled: number;
  parameters: ProfileParameter[];
  created_at?: string | null;
  updated_at?: string | null;
  created_by_username?: string | null;
  updated_by_username?: string | null;
};

export type OrderCandidate = {
  key: string;
  orderConceptUuid: string;
  orderDisplay: string;
  orderUuid?: string | null;
  orderNumber?: string | null;
  parameters: ProfileParameter[];
  source: 'allocation' | 'testOrders' | 'metadata';
};

export type ProfileEditor = {
  id?: string | null;
  target_id: string;
  profile_code: string;
  profile_name: string;
  order_concept_uuid: string;
  order_display: string;
  order_name_includes_text: string;
  enabled: number;
  parameters: ProfileParameter[];
};

type StatusFilter = 'ALL' | 'ENABLED' | 'DISABLED' | 'READY' | 'NEEDS_REVIEW';
type ReadinessTone = 'ok' | 'warn' | 'disabled';

@Component({
  selector: 'app-lis-test-order-profiles',
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
    MatTooltipModule,
  ],
  templateUrl: './lis-test-order-profiles.html',
  styleUrl: './lis-test-order-profiles.scss',
})
export class LisTestOrderProfiles {
  private readonly api = inject(PlatformApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly displayedColumns = ['profile', 'order', 'parameters', 'status', 'updated', 'actions'];
  readonly detailColumns = ['expandedDetail'];

  readonly loading = signal(false);
  readonly metadataLoading = signal(false);
  readonly saving = signal(false);
  readonly filtersOpen = signal(false);
  readonly search = signal('');
  readonly statusFilter = signal<StatusFilter>('ALL');
  readonly selectedTargetId = signal('');
  readonly sampleId = signal('');
  readonly expandedProfileId = signal<string | null>(null);
  readonly expandedOrderKey = signal<string | null>(null);

  readonly targets = signal<TargetRow[]>([]);
  readonly profiles = signal<ProfileRow[]>([]);
  readonly metadata = signal<unknown | null>(null);
  readonly discoveredOrders = signal<OrderCandidate[]>([]);

  readonly lisTargets = computed<TargetRow[]>(() =>
    this.targets().filter((target: TargetRow) => ['LIS', 'OPENMRS'].includes(String(target.type ?? '').toUpperCase())),
  );

  readonly selectedTarget = computed<TargetRow | null>(() =>
    this.lisTargets().find((target: TargetRow) => target.id === this.selectedTargetId()) ?? null,
  );

  readonly configuredProfiles = computed<ProfileRow[]>(() =>
    this.profiles().filter((profile: ProfileRow) => !this.selectedTargetId() || profile.target_id === this.selectedTargetId()),
  );

  readonly configuredOrderKeys = computed<Set<string>>(() => {
    const keys = new Set<string>();
    for (const profile of this.configuredProfiles()) {
      if (profile.order_concept_uuid) keys.add(this.key(profile.order_concept_uuid));
      if (profile.order_display) keys.add(this.key(profile.order_display));
    }
    return keys;
  });

  readonly unconfiguredOrders = computed<OrderCandidate[]>(() =>
    this.discoveredOrders().filter((order: OrderCandidate) => {
      const keys = this.configuredOrderKeys();
      return !keys.has(this.key(order.orderConceptUuid)) && !keys.has(this.key(order.orderDisplay));
    }),
  );

  readonly filteredProfiles = computed<ProfileRow[]>(() => {
    const term = this.key(this.search());
    const status = this.statusFilter();

    return this.configuredProfiles().filter((profile: ProfileRow) => {
      if (status === 'ENABLED' && profile.enabled !== 1) return false;
      if (status === 'DISABLED' && profile.enabled === 1) return false;
      if (status === 'READY' && this.profileReadiness(profile) !== 'ok') return false;
      if (status === 'NEEDS_REVIEW' && this.profileReadiness(profile) === 'ok') return false;

      if (!term) return true;
      const haystack = [
        profile.profile_code,
        profile.profile_name,
        profile.order_display,
        profile.order_concept_uuid,
        profile.target_name,
        ...(profile.order_name_includes ?? []),
        ...(profile.parameters ?? []).flatMap((param: ProfileParameter) => [
          param.analyzer_code,
          param.display_name,
          param.concept_uuid,
          param.datatype,
          param.value_type,
        ]),
      ]
        .map((value: unknown) => this.key(value))
        .join(' ');

      return haystack.includes(term);
    });
  });

  readonly summary = computed(() => {
    const profiles = this.configuredProfiles();
    const params = profiles.flatMap((profile: ProfileRow) => profile.parameters ?? []);
    return {
      profiles: profiles.length,
      enabled: profiles.filter((profile: ProfileRow) => profile.enabled === 1).length,
      discovered: this.discoveredOrders().length,
      unconfigured: this.unconfiguredOrders().length,
      requiredParameters: params.filter((param: ProfileParameter) => param.required === 1).length,
    };
  });

  constructor() {
    void this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const targets = ((await this.api.targetsList()) ?? []) as TargetRow[];
      this.targets.set(targets);

      if (!this.selectedTargetId()) {
        const first = targets.find((target: TargetRow) => ['LIS', 'OPENMRS'].includes(String(target.type ?? '').toUpperCase()));
        if (first) this.selectedTargetId.set(first.id);
      }

      await this.loadProfiles();
    } catch (error: unknown) {
      this.notifyError(error, 'Failed to load LIS test-order profiles');
    } finally {
      this.loading.set(false);
    }
  }

  async loadProfiles(): Promise<void> {
    const rows = ((await this.api.lisTestOrderProfilesList(this.selectedTargetId() || null)) ?? []) as ProfileRow[];
    this.profiles.set(rows.map((row: ProfileRow) => ({ ...row, parameters: row.parameters ?? [] })));
  }

  async onTargetChange(targetId: string): Promise<void> {
    this.selectedTargetId.set(targetId);
    this.metadata.set(null);
    this.discoveredOrders.set([]);
    this.expandedProfileId.set(null);
    this.expandedOrderKey.set(null);
    await this.loadProfiles();
  }

  async discoverOrders(): Promise<void> {
    const targetId = this.selectedTargetId();
    if (!targetId) {
      this.snack.open('Select a LIS/OpenMRS target first.', 'Close', { duration: 3000 });
      return;
    }

    this.metadataLoading.set(true);
    try {
      const metadata = await this.api.mappingsOpenMrsLisDiscover({
        targetId,
        sampleId: this.sampleId() || null,
        includeConceptDetails: true,
      });
      const discovered = this.toOrderCandidates(metadata);
      this.metadata.set(metadata);
      this.discoveredOrders.set(discovered);
      this.expandedOrderKey.set(discovered.length === 1 ? discovered[0].key : null);
      this.snack.open(`Discovered ${discovered.length} LIS test order(s).`, 'Close', { duration: 3200 });
    } catch (error: unknown) {
      this.notifyError(error, 'Failed to fetch LIS test-order metadata');
    } finally {
      this.metadataLoading.set(false);
    }
  }

  toggleFilters(): void {
    this.filtersOpen.update((open: boolean) => !open);
  }

  clearFilters(): void {
    this.search.set('');
    this.statusFilter.set('ALL');
  }

  isExpanded(profile: ProfileRow): boolean {
    return this.expandedProfileId() === profile.id;
  }

  toggleProfileRow(profile: ProfileRow): void {
    this.expandedProfileId.update((current: string | null) => (current === profile.id ? null : profile.id));
  }

  isOrderExpanded(order: OrderCandidate): boolean {
    return this.expandedOrderKey() === order.key;
  }

  toggleOrderRow(order: OrderCandidate): void {
    this.expandedOrderKey.update((current: string | null) => (current === order.key ? null : order.key));
  }

  rowTrackBy(_index: number, row: ProfileRow): string {
    return row.id;
  }

  openManualProfileDialog(): void {
    const targetId = this.selectedTargetId();
    if (!targetId) {
      this.snack.open('Select a LIS/OpenMRS target before creating a profile.', 'Close', { duration: 3000 });
      return;
    }

    const form: ProfileEditor = {
      target_id: targetId,
      profile_code: '',
      profile_name: '',
      order_concept_uuid: '',
      order_display: '',
      order_name_includes_text: '',
      enabled: 1,
      parameters: [],
    };

    void this.openProfileDialog(form, 'create');
  }

  configureOrder(order: OrderCandidate): void {
    const form: ProfileEditor = {
      target_id: this.selectedTargetId(),
      profile_code: this.profileCodeFromOrder(order.orderDisplay),
      profile_name: order.orderDisplay,
      order_concept_uuid: order.orderConceptUuid,
      order_display: order.orderDisplay,
      order_name_includes_text: this.defaultNameIncludes(order.orderDisplay).join(', '),
      enabled: 1,
      parameters: (order.parameters ?? []).map((param: ProfileParameter, index: number) =>
        this.normalizeProfileParameter(param, index),
      ),
    };

    void this.openProfileDialog(form, 'create', order.orderDisplay);
  }

  editProfile(profile: ProfileRow): void {
    const form: ProfileEditor = {
      id: profile.id,
      target_id: profile.target_id,
      profile_code: profile.profile_code,
      profile_name: profile.profile_name,
      order_concept_uuid: profile.order_concept_uuid ?? '',
      order_display: profile.order_display ?? profile.profile_name,
      order_name_includes_text: (profile.order_name_includes ?? []).join(', '),
      enabled: profile.enabled,
      parameters: (profile.parameters ?? []).map((param: ProfileParameter, index: number) =>
        this.normalizeProfileParameter(param, index),
      ),
    };

    void this.openProfileDialog(form, 'edit');
  }

  private async openProfileDialog(form: ProfileEditor, mode: 'create' | 'edit', sourceOrderName?: string): Promise<void> {
    const result = await firstValueFrom(
      this.dialog
        .open<LisTestOrderProfileDialog, { form: ProfileEditor; mode: 'create' | 'edit'; targetName?: string | null; sourceOrderName?: string | null }, ProfileDialogResult>(
          LisTestOrderProfileDialog,
          {
            width: 'min(1120px, 96vw)',
            maxWidth: '96vw',
            maxHeight: '92vh',
            autoFocus: false,
            restoreFocus: true,
            data: {
              form,
              mode,
              targetName: this.selectedTarget()?.name ?? null,
              sourceOrderName: sourceOrderName ?? null,
            },
          },
        )
        .afterClosed(),
    );

    if (result?.action === 'save') {
      await this.saveProfile(result.form);
    }
  }

  async saveProfile(form: ProfileEditor): Promise<void> {
    if (!form.target_id || !form.profile_code?.trim() || !form.profile_name?.trim()) {
      this.snack.open('Profile target, code, and name are required.', 'Close', { duration: 3200 });
      return;
    }
    if (!form.parameters.length) {
      this.snack.open('Add at least one profile parameter before saving.', 'Close', { duration: 3200 });
      return;
    }

    this.saving.set(true);
    try {
      const payload = {
        id: form.id ?? null,
        target_id: form.target_id,
        profile_code: form.profile_code.trim(),
        profile_name: form.profile_name.trim(),
        order_concept_uuid: String(form.order_concept_uuid ?? '').trim(),
        order_display: String(form.order_display ?? '').trim(),
        order_name_includes: this.csvToList(form.order_name_includes_text),
        enabled: Number(form.enabled ?? 1),
        parameters: form.parameters.map((param: ProfileParameter, index: number) => ({
          analyzer_code: String(param.analyzer_code ?? '').trim(),
          display_name: String(param.display_name ?? param.analyzer_code ?? '').trim(),
          concept_uuid: String(param.concept_uuid ?? '').trim() || null,
          allocation_uuid: String(param.allocation_uuid ?? '').trim() || null,
          datatype: String(param.datatype ?? '').trim() || null,
          value_type: this.normalizeValueType(param.value_type),
          required: Number(param.required ?? 1),
          sort_order: index,
          aliases: Array.isArray(param.aliases) ? param.aliases : [],
        })),
      };

      await this.api.lisTestOrderProfileSave(payload);
      await this.loadProfiles();
      this.snack.open('LIS test-order profile saved.', 'Close', { duration: 3000 });
    } catch (error: unknown) {
      this.notifyError(error, 'Failed to save LIS test-order profile');
    } finally {
      this.saving.set(false);
    }
  }

  async toggleProfile(profile: ProfileRow): Promise<void> {
    try {
      await this.api.lisTestOrderProfileSetEnabled(profile.id, profile.enabled === 1 ? 0 : 1);
      await this.loadProfiles();
    } catch (error: unknown) {
      this.notifyError(error, 'Failed to update profile status');
    }
  }

  async deleteProfile(profile: ProfileRow): Promise<void> {
    if (!this.confirmDanger(
      'Delete LIS test-order profile',
      `Profile "${profile.profile_name}" will no longer participate in LIS preview, rebuild, or delivery validation. Historical audit and queue records remain unchanged.`,
      'DELETE',
    )) return;

    try {
      await this.api.lisTestOrderProfileDelete(profile.id);
      await this.loadProfiles();
      if (this.expandedProfileId() === profile.id) this.expandedProfileId.set(null);
      this.snack.open('LIS test-order profile deleted.', 'Close', { duration: 3000 });
    } catch (error: unknown) {
      this.notifyError(error, 'Failed to delete LIS test-order profile');
    }
  }


  private confirmDanger(title: string, message: string, keyword: string) {
    const value = window.prompt(`${title}

${message}

Type ${keyword} to continue.`);
    return String(value ?? '').trim().toUpperCase() === keyword;
  }

  requiredCount(profile: ProfileRow): number {
    return (profile.parameters ?? []).filter((param: ProfileParameter) => Number(param.required ?? 0) === 1).length;
  }

  optionalCount(profile: ProfileRow): number {
    return (profile.parameters ?? []).filter((param: ProfileParameter) => Number(param.required ?? 0) !== 1).length;
  }

  orderCodes(order: OrderCandidate): string[] {
    return (order.parameters ?? [])
      .map((param: ProfileParameter) => String(param.analyzer_code ?? '').trim())
      .filter(Boolean);
  }

  orderReadyParameterCount(order: OrderCandidate): number {
    return (order.parameters ?? []).filter((param: ProfileParameter) => this.parameterReadiness(param) === 'ok').length;
  }

  orderNeedsReviewParameterCount(order: OrderCandidate): number {
    return (order.parameters ?? []).filter((param: ProfileParameter) => this.parameterReadiness(param) !== 'ok').length;
  }

  orderReadinessLabel(order: OrderCandidate): string {
    if (!order.orderConceptUuid) return 'Needs order concept UUID';
    if (!order.parameters?.length) return 'Needs parameters';
    return this.orderNeedsReviewParameterCount(order) > 0 ? 'Needs parameter review' : 'Ready to configure';
  }

  orderReadinessClass(order: OrderCandidate): string {
    return this.orderReadinessLabel(order) === 'Ready to configure' ? 'success' : 'warn';
  }

  parameterAliasLabel(param: ProfileParameter, max = 4): string {
    const aliases = (param.aliases ?? []).filter((alias: string) => !!String(alias ?? '').trim());
    if (!aliases.length) return '—';
    const visible = aliases.slice(0, max).join(', ');
    return aliases.length > max ? `${visible} +${aliases.length - max} more` : visible;
  }

  parameterReadiness(param: ProfileParameter): 'ok' | 'warn' {
    return param.analyzer_code && param.concept_uuid ? 'ok' : 'warn';
  }

  profileReadiness(profile: ProfileRow): ReadinessTone {
    if (profile.enabled !== 1) return 'disabled';
    const parameters = profile.parameters ?? [];
    if (!profile.profile_code || !profile.profile_name || !profile.order_concept_uuid || !parameters.length) {
      return 'warn';
    }
    return parameters.some((param: ProfileParameter) => this.parameterReadiness(param) === 'warn') ? 'warn' : 'ok';
  }

  profileReadinessLabel(profile: ProfileRow): string {
    const readiness = this.profileReadiness(profile);
    if (readiness === 'disabled') return 'Disabled';
    if (readiness === 'ok') return 'Ready for validation';
    if (!profile.order_concept_uuid) return 'Needs order concept UUID';
    if (!profile.parameters?.length) return 'Needs parameters';
    return 'Needs review';
  }

  statusClass(profile: ProfileRow): string {
    const readiness = this.profileReadiness(profile);
    if (readiness === 'disabled') return 'off';
    return readiness === 'ok' ? 'ok' : 'warn';
  }

  formatDateTime(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  }

  formatCodes(values: string[], max = 8): string {
    if (!values.length) return '—';
    const visible = values.slice(0, max).join(', ');
    return values.length > max ? `${visible} +${values.length - max} more` : visible;
  }

  private toOrderCandidates(metadata: unknown): OrderCandidate[] {
    const candidates = new Map<string, OrderCandidate>();

    const addOrder = (order: unknown, allocations: unknown[] = [], source: OrderCandidate['source'] = 'allocation'): void => {
      const orderObj = this.asRecord(order);
      const concept = this.asRecord(orderObj?.['concept']);
      const nestedOrder = this.asRecord(orderObj?.['order']);
      const orderConceptUuid = this.firstText(
        this.readPath(concept, 'uuid'),
        orderObj?.['orderConceptUuid'],
        orderObj?.['conceptUuid'],
        orderObj?.['testOrderConceptUuid'],
        nestedOrder?.['conceptUuid'],
        orderObj?.['uuid'],
      );
      const orderDisplay = this.firstText(
        this.readPath(concept, 'display'),
        this.readPath(concept, 'name'),
        orderObj?.['display'],
        orderObj?.['name'],
        orderObj?.['orderDisplay'],
        orderConceptUuid,
      );
      if (!orderConceptUuid && !orderDisplay) return;

      const key = this.key(orderConceptUuid || orderDisplay);
      const params = this.mergeParameters(
        this.parametersFromOrder(order),
        this.parametersFromAllocations(allocations),
      );
      const current = candidates.get(key);
      if (current) {
        current.parameters = this.mergeParameters(current.parameters, params);
        return;
      }

      candidates.set(key, {
        key,
        orderConceptUuid: orderConceptUuid || '',
        orderDisplay: orderDisplay || 'Unknown LIS test order',
        orderUuid: this.firstText(orderObj?.['uuid'], this.readPath(nestedOrder, 'uuid')),
        orderNumber: this.firstText(orderObj?.['orderNumber'], this.readPath(nestedOrder, 'orderNumber'), orderObj?.['label']),
        parameters: params,
        source,
      });
    };

    const visit = (node: unknown): void => {
      if (!node) return;
      if (Array.isArray(node)) {
        node.forEach((item: unknown) => visit(item));
        return;
      }
      if (typeof node !== 'object') return;

      const obj = this.asRecord(node);
      const order = obj?.['order'] ?? (obj?.['orders'] && !Array.isArray(obj?.['orders']) ? obj?.['orders'] : null);
      const allocations = this.arrayValue(obj?.['testAllocations']).length
        ? this.arrayValue(obj?.['testAllocations'])
        : this.arrayValue(obj?.['allocations']).length
          ? this.arrayValue(obj?.['allocations'])
          : this.arrayValue(obj?.['parameters']);

      if (order && allocations.length) {
        addOrder(order, allocations, 'allocation');
      } else if (order && this.isLikelyParameterNode(obj)) {
        addOrder(order, [obj], 'allocation');
      }

      const orders = this.arrayValue(obj?.['orders']);
      for (const item of orders) {
        const itemObj = this.asRecord(item);
        const orderAllocations = this.arrayValue(itemObj?.['testAllocations']).length
          ? this.arrayValue(itemObj?.['testAllocations'])
          : this.arrayValue(itemObj?.['allocations']);
        addOrder(item, orderAllocations, 'testOrders');
      }

      for (const value of Object.values(obj ?? {})) visit(value);
    };

    const metadataObj = this.asRecord(metadata);
    visit(metadataObj?.['allocations']);
    visit(metadataObj?.['lookup']);
    this.hydrateCandidatesFromMetadata(candidates, metadataObj);

    if (candidates.size === 0) {
      const testOrders = this.arrayValue(metadataObj?.['testOrders']);
      for (const order of testOrders) {
        const orderObj = this.asRecord(order);
        const concept = this.asRecord(orderObj?.['concept']);
        const orderConceptUuid = this.firstText(orderObj?.['uuid'], concept?.['uuid']);
        const orderDisplay = this.firstText(orderObj?.['display'], orderObj?.['name'], orderConceptUuid);
        const key = this.key(orderConceptUuid || orderDisplay);
        if (!key) continue;
        candidates.set(key, {
          key,
          orderConceptUuid: orderConceptUuid || '',
          orderDisplay: orderDisplay || 'Unknown LIS test order',
          parameters: this.resolveParametersForTestOrder(order, metadataObj, testOrders.length === 1),
          source: 'testOrders',
        });
      }
    }

    if (candidates.size === 0 && this.arrayValue(metadataObj?.['parameters']).length) {
      candidates.set('metadata-parameters', {
        key: 'metadata-parameters',
        orderConceptUuid: '',
        orderDisplay: 'Fetched LIS metadata parameters',
        parameters: this.parametersFromMetadata(this.arrayValue(metadataObj?.['parameters'])),
        source: 'metadata',
      });
    }

    return Array.from(candidates.values()).map((candidate: OrderCandidate) => ({
      ...candidate,
      parameters: (candidate.parameters ?? []).map((param: ProfileParameter, index: number) =>
        this.normalizeProfileParameter(param, index),
      ),
    }));
  }

  private hydrateCandidatesFromMetadata(candidates: Map<string, OrderCandidate>, metadataObj: Record<string, unknown> | null): void {
    const testOrders = this.arrayValue(metadataObj?.['testOrders']);
    if (!testOrders.length) return;

    for (const order of testOrders) {
      const orderObj = this.asRecord(order);
      const concept = this.asRecord(orderObj?.['concept']);
      const orderConceptUuid = this.firstText(orderObj?.['uuid'], concept?.['uuid'], orderObj?.['orderConceptUuid'], orderObj?.['conceptUuid']);
      const orderDisplay = this.firstText(orderObj?.['display'], orderObj?.['name'], concept?.['display'], concept?.['name'], orderConceptUuid);
      const key = this.key(orderConceptUuid || orderDisplay);
      if (!key) continue;

      const params = this.resolveParametersForTestOrder(order, metadataObj, false);
      const existing = candidates.get(key);
      if (existing) {
        if (!existing.parameters.length && params.length) {
          existing.parameters = params;
        } else if (params.length) {
          existing.parameters = this.mergeParameters(existing.parameters, params);
        }
        if (!existing.orderConceptUuid && orderConceptUuid) existing.orderConceptUuid = orderConceptUuid;
        if ((!existing.orderDisplay || existing.orderDisplay === existing.orderConceptUuid) && orderDisplay) existing.orderDisplay = orderDisplay;
        continue;
      }

      candidates.set(key, {
        key,
        orderConceptUuid: orderConceptUuid || '',
        orderDisplay: orderDisplay || 'Unknown LIS test order',
        parameters: params,
        source: 'testOrders',
      });
    }

    if (candidates.size === 1) {
      const only = Array.from(candidates.values())[0];
      if (!only.parameters.length) {
        only.parameters = this.parametersFromMetadata(this.arrayValue(metadataObj?.['parameters']));
      }
    }
  }

  private resolveParametersForTestOrder(order: unknown, metadataObj: Record<string, unknown> | null, allowGlobalFallback: boolean): ProfileParameter[] {
    const direct = this.parametersFromOrder(order);
    if (direct.length) return direct;

    const orderObj = this.asRecord(order);
    const concept = this.asRecord(orderObj?.['concept']);
    const orderConceptUuid = this.firstText(orderObj?.['uuid'], concept?.['uuid'], orderObj?.['orderConceptUuid'], orderObj?.['conceptUuid']);
    const orderDisplay = this.firstText(orderObj?.['display'], orderObj?.['name'], concept?.['display'], concept?.['name']);

    const scoped = this.parametersFromMetadata(this.arrayValue(metadataObj?.['parameters'])).filter((param: ProfileParameter) => {
      const aliases = this.stringList([param.aliases, param.display_name, param.analyzer_code, param.concept_uuid]);
      const haystack = aliases.map((item: string) => this.key(item));
      const orderKeys = this.stringList([orderConceptUuid, orderDisplay]).map((item: string) => this.key(item));
      return orderKeys.some((key: string) => key && haystack.some((text: string) => text.includes(key)));
    });
    if (scoped.length) return scoped;

    return allowGlobalFallback ? this.parametersFromMetadata(this.arrayValue(metadataObj?.['parameters'])) : [];
  }

  private parametersFromOrder(order: unknown): ProfileParameter[] {
    const orderObj = this.asRecord(order);
    if (!orderObj) return [];

    const concept = this.asRecord(orderObj['concept']);
    const directGroups = [
      orderObj['setMembers'],
      orderObj['members'],
      orderObj['parameters'],
      orderObj['testParameters'],
      orderObj['results'],
      orderObj['questions'],
      orderObj['orderableTests'],
      concept?.['setMembers'],
      concept?.['members'],
      concept?.['parameters'],
      concept?.['testParameters'],
      concept?.['results'],
      concept?.['questions'],
    ];

    const members = directGroups.flatMap((group: unknown) => this.arrayValue(group));
    if (!members.length) return [];

    return this.mergeParameters([], members.map((member: unknown, index: number): ProfileParameter => this.parameterFromOrderMember(member, index)));
  }

  private parameterFromOrderMember(member: unknown, index: number): ProfileParameter {
    const obj = this.asRecord(member);
    const concept = this.asRecord(
      obj?.['concept']
        ?? obj?.['parameter']
        ?? obj?.['testParameter']
        ?? obj?.['parameterConcept']
        ?? member
        ?? {},
    );
    const mappings = this.arrayValue(concept?.['mappings']);
    const mappingCodes = mappings
      .map((mapping: unknown) => {
        const mappingObj = this.asRecord(mapping);
        const conceptReference = this.asRecord(this.readPath(mappingObj, 'conceptReference'));
        const conceptReferenceTerm = this.asRecord(this.readPath(mappingObj, 'conceptReferenceTerm'));
        return this.firstText(
          this.readPath(conceptReference, 'code'),
          this.readPath(conceptReferenceTerm, 'code'),
          this.readPath(mappingObj, 'code'),
          this.readPath(mappingObj, 'display'),
        );
      })
      .filter((code: string) => !!code);
    const mapping0 = this.asRecord(mappings[0]);
    const conceptReference = this.asRecord(mapping0?.['conceptReference']);
    const conceptReferenceTerm = this.asRecord(mapping0?.['conceptReferenceTerm']);
    const analyzerCode = this.firstText(
      obj?.['analyzerCode'],
      obj?.['analyzer_code'],
      obj?.['resultCode'],
      obj?.['testCode'],
      obj?.['code'],
      conceptReference?.['code'],
      conceptReferenceTerm?.['code'],
      mappingCodes[0],
      concept?.['display'],
      concept?.['name'],
      obj?.['display'],
      obj?.['name'],
      obj?.['label'],
    );
    const datatype = this.firstText(
      this.readPath(this.asRecord(concept?.['datatype']), 'display'),
      this.readPath(this.asRecord(concept?.['datatype']), 'name'),
      this.readPath(this.asRecord(obj?.['datatype']), 'display'),
      this.readPath(this.asRecord(obj?.['datatype']), 'name'),
      obj?.['datatype'],
      obj?.['dataType'],
    );

    return {
      analyzer_code: analyzerCode || `PARAM_${index + 1}`,
      display_name: this.firstText(concept?.['display'], concept?.['name'], obj?.['display'], obj?.['name'], obj?.['label'], analyzerCode),
      concept_uuid: this.firstText(concept?.['uuid'], obj?.['conceptUuid'], obj?.['parameterUuid'], obj?.['uuid'], obj?.['concept_uuid']),
      allocation_uuid: this.firstText(obj?.['allocationUuid'], obj?.['allocation_uuid'], this.readPath(this.asRecord(obj?.['testAllocation']), 'uuid'), this.readPath(this.asRecord(obj?.['allocation']), 'uuid')),
      datatype,
      value_type: this.valueTypeFromDatatype(datatype),
      required: 1,
      sort_order: index,
      aliases: this.stringList([analyzerCode, mappingCodes, concept?.['display'], concept?.['name'], obj?.['display'], obj?.['name'], obj?.['label']]),
    };
  }

  private isLikelyParameterNode(obj: Record<string, unknown> | null): boolean {
    if (!obj) return false;
    return Boolean(
      obj['concept']
        || obj['parameter']
        || obj['testParameter']
        || obj['parameterConcept']
        || obj['conceptUuid']
        || obj['parameterUuid']
        || obj['analyzerCode']
        || obj['resultCode']
        || obj['testCode'],
    );
  }

  private parametersFromAllocations(allocations: unknown[]): ProfileParameter[] {
    return allocations
      .map((item: unknown, index: number): ProfileParameter => {
        const obj = this.asRecord(item);
        const concept = this.asRecord(
          obj?.['concept']
            ?? obj?.['parameter']
            ?? obj?.['testParameter']
            ?? obj?.['parameterConcept']
            ?? this.readPath(this.asRecord(obj?.['testAllocation']), 'concept')
            ?? this.readPath(this.asRecord(obj?.['allocation']), 'concept')
            ?? {},
        );
        const mappings = this.arrayValue(concept?.['mappings']);
            const mappingCodes = mappings
          .map((mapping: unknown) => {
            const mappingObj = this.asRecord(mapping);
            const conceptReference = this.asRecord(this.readPath(mappingObj, 'conceptReference'));
            const conceptReferenceTerm = this.asRecord(this.readPath(mappingObj, 'conceptReferenceTerm'));
            return this.firstText(
              this.readPath(conceptReference, 'code'),
              this.readPath(conceptReferenceTerm, 'code'),
              this.readPath(mappingObj, 'code'),
              this.readPath(mappingObj, 'display'),
            );
          })
          .filter((code: string) => !!code);
        const mapping0 = this.asRecord(mappings[0]);
        const conceptReference = this.asRecord(mapping0?.['conceptReference']);
        const conceptReferenceTerm = this.asRecord(mapping0?.['conceptReferenceTerm']);
        const analyzerCode = this.firstText(
          obj?.['analyzerCode'],
          obj?.['analyzer_code'],
          obj?.['resultCode'],
          obj?.['testCode'],
          obj?.['code'],
          conceptReference?.['code'],
          conceptReferenceTerm?.['code'],
          mappingCodes[0],
          concept?.['display'],
          obj?.['display'],
          obj?.['label'],
        );
        const datatype = this.firstText(
          this.readPath(this.asRecord(concept?.['datatype']), 'display'),
          this.readPath(this.asRecord(concept?.['datatype']), 'name'),
          this.readPath(this.asRecord(obj?.['datatype']), 'display'),
          this.readPath(this.asRecord(obj?.['datatype']), 'name'),
          obj?.['datatype'],
          obj?.['dataType'],
        );
        return {
          analyzer_code: analyzerCode || `PARAM_${index + 1}`,
          display_name: this.firstText(concept?.['display'], concept?.['name'], obj?.['display'], obj?.['label'], analyzerCode),
          concept_uuid: this.firstText(concept?.['uuid'], obj?.['conceptUuid'], obj?.['parameterUuid'], obj?.['concept_uuid']),
          allocation_uuid: this.firstText(
            obj?.['allocationUuid'],
            obj?.['allocation_uuid'],
            this.readPath(this.asRecord(obj?.['testAllocation']), 'uuid'),
            this.readPath(this.asRecord(obj?.['allocation']), 'uuid'),
            obj?.['uuid'],
          ),
          datatype,
          value_type: this.valueTypeFromDatatype(datatype),
          required: 1,
          sort_order: index,
          aliases: this.stringList([analyzerCode, mappingCodes, concept?.['display'], concept?.['name'], obj?.['display'], obj?.['label']]),
        };
      })
      .filter((param: ProfileParameter) => !!param.analyzer_code);
  }

  private parametersFromMetadata(parameters: unknown[]): ProfileParameter[] {
    return parameters.map((item: unknown, index: number): ProfileParameter => {
      const obj = this.asRecord(item);
      const datatype = this.firstText(obj?.['datatype'], obj?.['dataType']);
      return this.normalizeProfileParameter({
        analyzer_code: this.firstText(obj?.['analyzer_code'], obj?.['analyzerCode'], obj?.['display'], obj?.['conceptUuid'], obj?.['concept_uuid']),
        display_name: this.firstText(obj?.['display_name'], obj?.['displayName'], obj?.['display'], obj?.['analyzerCode']),
        concept_uuid: this.firstText(obj?.['concept_uuid'], obj?.['conceptUuid']),
        allocation_uuid: this.firstText(obj?.['allocation_uuid'], obj?.['allocationUuid']),
        datatype,
        value_type: this.valueTypeFromDatatype(datatype),
        required: 1,
        sort_order: index,
        aliases: this.stringList([obj?.['aliases'], obj?.['analyzerAliases'], obj?.['analyzer_aliases'], obj?.['display']]),
      }, index);
    });
  }

  private mergeParameters(a: ProfileParameter[], b: ProfileParameter[]): ProfileParameter[] {
    const rows = new Map<string, ProfileParameter>();
    for (const item of [...a, ...b]) {
      const key = this.key(item.concept_uuid || item.analyzer_code);
      if (!key) continue;
      const existing = rows.get(key);
      if (!existing) {
        rows.set(key, item);
        continue;
      }
      rows.set(key, {
        ...existing,
        ...item,
        analyzer_code: item.analyzer_code || existing.analyzer_code,
        display_name: item.display_name || existing.display_name,
        concept_uuid: item.concept_uuid || existing.concept_uuid,
        allocation_uuid: item.allocation_uuid || existing.allocation_uuid,
        datatype: item.datatype || existing.datatype,
        value_type: item.value_type || existing.value_type,
        aliases: this.stringList([existing.aliases, item.aliases]),
      });
    }
    return Array.from(rows.values());
  }

  private normalizeProfileParameter(param: any, index: number): ProfileParameter {
    const analyzerCode = this.firstText(
      param?.analyzer_code,
      param?.analyzerCode,
      param?.code,
      param?.resultCode,
      param?.testCode,
      param?.display_name,
      param?.displayName,
      param?.display,
      param?.concept_uuid,
      param?.conceptUuid,
    );

    const displayName = this.firstText(
      param?.display_name,
      param?.displayName,
      param?.display,
      param?.name,
      analyzerCode,
    );

    const conceptUuid = this.firstText(
      param?.concept_uuid,
      param?.conceptUuid,
      param?.conceptUUID,
    );

    const allocationUuid = this.firstText(
      param?.allocation_uuid,
      param?.allocationUuid,
      param?.testAllocationUuid,
    );

    const datatype = this.firstText(
      param?.datatype,
      param?.dataType,
      param?.valueDatatype,
    );

    return {
      analyzer_code: analyzerCode || `PARAM_${index + 1}`,
      display_name: displayName || analyzerCode || `Parameter ${index + 1}`,
      concept_uuid: conceptUuid || null,
      allocation_uuid: allocationUuid || null,
      datatype: datatype || null,
      value_type: this.normalizeValueType(
        param?.value_type ?? param?.valueType ?? this.valueTypeFromDatatype(datatype),
      ),
      required: Number(param?.required ?? 1),
      sort_order: Number(param?.sort_order ?? param?.sortOrder ?? index),
      aliases: this.stringList([
        param?.aliases,
        param?.analyzerAliases,
        param?.analyzer_aliases,
        analyzerCode,
        displayName,
      ]),
    };
  }

  private profileCodeFromOrder(name: string): string {
    const text = String(name ?? '');
    const words = text
      .replace(/^TEST_ORDERS:/i, '')
      .split(/[^A-Za-z0-9]+/)
      .filter((word: string) => word.length > 1);
    const acronym = words.map((word: string) => word[0]).join('').slice(0, 8).toUpperCase();
    if (/papilloma|hpv/i.test(text)) return 'HPV';
    if (/complete blood|cbc/i.test(text)) return 'CBC';
    if (/viral load|hiv/i.test(text)) return 'HIV_VL';
    return acronym || 'LIS_PROFILE';
  }

  private defaultNameIncludes(name: string): string[] {
    const clean = String(name ?? '').replace(/^TEST_ORDERS:/i, '').trim();
    const rows = [clean];
    if (/papilloma/i.test(clean)) rows.push('HPV', 'Human Papilloma Virus');
    if (/complete blood/i.test(clean)) rows.push('CBC');
    if (/viral load|hiv/i.test(clean)) rows.push('HIV Viral Load', 'HIV_VL');
    return this.stringList(rows);
  }

  private valueTypeFromDatatype(value: unknown): ProfileValueType {
    const text = String(value ?? '').toLowerCase();
    if (text.includes('coded')) return 'coded';
    if (text.includes('numeric') || text.includes('number')) return 'numeric';
    return 'text';
  }

  private normalizeValueType(value: unknown): ProfileValueType {
    const text = String(value ?? '').toLowerCase();
    return ['coded', 'numeric', 'text'].includes(text) ? (text as ProfileValueType) : 'text';
  }

  private csvToList(value: string): string[] {
    return this.stringList(String(value ?? '').split(','));
  }

  private stringList(value: unknown): string[] {
    const rows: string[] = [];
    const seen = new Set<string>();
    const push = (item: unknown): void => {
      if (Array.isArray(item)) {
        item.forEach((child: unknown) => push(child));
        return;
      }
      const text = String(item ?? '').trim();
      if (!text) return;
      const key = this.key(text);
      if (seen.has(key)) return;
      seen.add(key);
      rows.push(text);
    };
    push(value);
    return rows;
  }

  private firstText(...values: unknown[]): string {
    for (const value of values) {
      const text = String(value ?? '').trim();
      if (text) return text;
    }
    return '';
  }

  private key(value: unknown): string {
    return String(value ?? '').trim().toUpperCase();
  }

  private asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  }

  private arrayValue(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
  }

  private readPath(record: Record<string, unknown> | null, key: string): unknown {
    return record ? record[key] : undefined;
  }

  private notifyError(error: unknown, fallback: string): void {
    const message = error && typeof error === 'object' && 'message' in error ? String((error as { message?: unknown }).message ?? fallback) : fallback;
    this.snack.open(message, 'Close', { duration: 5200 });
  }
}
