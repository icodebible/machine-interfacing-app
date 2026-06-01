import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PlatformApiService } from '../../core/platform/platform-api.service';
import { MappingDialog } from '../../shared/dialogs/mapping-dialog/mapping-dialog';
import { StarterTemplateInfoDialog } from '../../shared/dialogs/starter-template-info-dialog/starter-template-info-dialog';
import { MappingValueTranslationsDialog } from '../../shared/dialogs/mapping-value-translations-dialog/mapping-value-translations-dialog';
import { OpenMrsLisMappingAssistantDialog } from '../../shared/dialogs/openmrs-lis-mapping-assistant-dialog/openmrs-lis-mapping-assistant-dialog';

type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
type TransformKind = 'direct' | 'constant' | 'lookup';
type UnmappedBehavior = 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR';

type LisTargetOption = {
  id: string;
  name: string;
  type: MappingTargetType;
  base_url: string;
  enabled: number;
};

type TemplateRule = {
  source_field: string;
  destination_field: string;
  transform_kind: TransformKind;
  constant_value?: string | null;
  enabled?: number;
  note?: string;
};

type TemplateGroup = {
  id: string;
  targetType: MappingTargetType;
  title: string;
  description: string;
  rules: TemplateRule[];
  useCase: string;
};

type MappingRow = {
  id: string;
  target_type: MappingTargetType;
  source_field: string;
  destination_field: string;
  transform_kind: TransformKind;
  constant_value?: string | null;
  enabled: number;
  value_mapping_enabled?: number;
  unmapped_behavior?: UnmappedBehavior | null;
  default_destination_value?: string | null;
  created_at: string;
  updated_at: string;
};

type TranslationRow = {
  id: string;
  source_value?: string | null;
  destination_value?: string | null;
  source?: string | null;
  destination?: string | null;
  from_value?: string | null;
  to_value?: string | null;
  enabled?: number | null;
  updated_at?: string | null;
};

@Component({
  selector: 'app-mappings',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './mappings.html',
  styleUrl: './mappings.scss',
})
export class Mappings {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly targetTypes: Array<MappingTargetType | 'ALL'> = [
    'ALL',
    'DHIS2',
    'OPENMRS',
    'LIS',
    'CUSTOM_HTTP',
  ];

  readonly templates: TemplateGroup[] = [
    {
      id: 'dhis2-event',
      targetType: 'DHIS2',
      title: 'DHIS2 event starter',
      description: 'Adds minimum event context and common result data values for DHIS2 delivery.',
      useCase: 'Use when you need a fast baseline for event-based DHIS2 result submission.',
      rules: [
        {
          source_field: '',
          destination_field: 'event.program',
          transform_kind: 'constant',
          constant_value: 'PROGRAM_ID',
          note: 'Replace with the actual DHIS2 program id.',
        },
        {
          source_field: '',
          destination_field: 'event.programStage',
          transform_kind: 'constant',
          constant_value: 'PROGRAM_STAGE_ID',
          note: 'Replace with the actual program stage id.',
        },
        {
          source_field: '',
          destination_field: 'event.orgUnit',
          transform_kind: 'constant',
          constant_value: 'ORG_UNIT_UID',
          note: 'Replace with the correct org unit uid.',
        },
        {
          source_field: 'result.observedAt',
          destination_field: 'event.eventDate',
          transform_kind: 'direct',
        },
        {
          source_field: 'result.value',
          destination_field: 'event.dataValues.resultValue',
          transform_kind: 'direct',
        },
        {
          source_field: 'result.testCode',
          destination_field: 'event.dataValues.testCode',
          transform_kind: 'direct',
        },
      ],
    },
    {
      id: 'dhis2-tracker',
      targetType: 'DHIS2',
      title: 'DHIS2 tracker starter',
      description:
        'Bootstraps tracked entity, attributes, enrollment, and event-oriented tracker payload mapping.',
      useCase:
        'Use when the receiver expects DHIS2 tracker-style payloads instead of a flat event body.',
      rules: [
        {
          source_field: '',
          destination_field: 'trackedEntities[0].trackedEntityType',
          transform_kind: 'constant',
          constant_value: 'TRACKED_ENTITY_TYPE_UID',
          note: 'Replace with the target tracked entity type uid.',
        },
        {
          source_field: '',
          destination_field: 'trackedEntities[0].orgUnit',
          transform_kind: 'constant',
          constant_value: 'ORG_UNIT_UID',
          note: 'Replace with the correct organisation unit uid.',
        },
        {
          source_field: '',
          destination_field: 'trackedEntities[0].attributes[0].attribute',
          transform_kind: 'constant',
          constant_value: 'ATTRIBUTE_UID_PATIENT_ID',
        },
        {
          source_field: 'patient.identifier',
          destination_field: 'trackedEntities[0].attributes[0].value',
          transform_kind: 'direct',
        },
        {
          source_field: '',
          destination_field: 'trackedEntities[0].enrollments[0].program',
          transform_kind: 'constant',
          constant_value: 'PROGRAM_UID',
        },
        {
          source_field: 'result.observedAt',
          destination_field: 'trackedEntities[0].enrollments[0].occurredAt',
          transform_kind: 'direct',
        },
        {
          source_field: '',
          destination_field: 'trackedEntities[0].enrollments[0].events[0].programStage',
          transform_kind: 'constant',
          constant_value: 'PROGRAM_STAGE_UID',
        },
        {
          source_field: 'result.value',
          destination_field: 'trackedEntities[0].enrollments[0].events[0].dataValues[0].value',
          transform_kind: 'direct',
        },
      ],
    },
    {
      id: 'openmrs-result',
      targetType: 'OPENMRS',
      title: 'OpenMRS result starter',
      description: 'Provides identifiers, encounter timing, and a minimal obs payload shape.',
      useCase: 'Use when an OpenMRS instance expects a small encounter and observation payload.',
      rules: [
        {
          source_field: 'patient.identifier',
          destination_field: 'patient.identifier',
          transform_kind: 'direct',
        },
        {
          source_field: 'result.observedAt',
          destination_field: 'encounter.encounterDatetime',
          transform_kind: 'direct',
        },
        {
          source_field: 'result.testCode',
          destination_field: 'obs.concept',
          transform_kind: 'direct',
        },
        { source_field: 'result.value', destination_field: 'obs.value', transform_kind: 'direct' },
        {
          source_field: '',
          destination_field: 'encounter.encounterType',
          transform_kind: 'constant',
          constant_value: 'LAB_RESULT',
          note: 'Replace with the OpenMRS encounter type you expect.',
        },
      ],
    },
    {
      id: 'custom-http-json',
      targetType: 'CUSTOM_HTTP',
      title: 'Custom HTTP JSON starter',
      description: 'Provides a partner-friendly nested JSON shape for custom endpoints.',
      useCase: 'Use when a partner endpoint accepts a structured JSON payload over HTTP.',
      rules: [
        {
          source_field: 'patient.identifier',
          destination_field: 'payload.patient.identifier',
          transform_kind: 'direct',
        },
        {
          source_field: 'result.testCode',
          destination_field: 'payload.result.code',
          transform_kind: 'direct',
        },
        {
          source_field: 'result.value',
          destination_field: 'payload.result.value',
          transform_kind: 'direct',
        },
        {
          source_field: 'result.observedAt',
          destination_field: 'payload.result.observedAt',
          transform_kind: 'direct',
        },
        {
          source_field: '',
          destination_field: 'payload.source',
          transform_kind: 'constant',
          constant_value: 'machine-interfacing',
          note: 'Use a stable source identifier agreed with the partner.',
        },
      ],
    },
  ];

  loading = signal(false);
  rows = signal<MappingRow[]>([]);
  showStarterTemplates = signal(false);
  validation = signal<any | null>(null);
  selectedTargetType = signal<MappingTargetType | 'ALL'>('ALL');
  selectedTemplateId = signal<string>('dhis2-event');
  translationCountMap = signal<Record<string, number>>({});
  translationMap = signal<Record<string, TranslationRow[]>>({});
  expandedId = signal<string | null>(null);
  pageIndex = signal(0);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];
  cols: string[] = ['target', 'destination', 'transform', 'valueMode', 'status', 'actions'];
  detailCols: string[] = ['expandedDetail'];


  lisTargets = signal<LisTargetOption[]>([]);
  lisSelectedTargetId = signal<string>('');

  readonly showLisAssistant = computed(() => this.selectedTargetType() === 'LIS');
  readonly selectedLisTarget = computed(() => {
    const id = this.lisSelectedTargetId();
    return this.lisTargets().find((target) => target.id === id) ?? null;
  });

  readonly filteredRows = computed(() => {
    const type = this.selectedTargetType();
    const rows = this.rows();
    return type === 'ALL' ? rows : rows.filter((row) => row.target_type === type);
  });

  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredRows().slice(start, start + this.pageSize());
  });

  readonly visibleTemplates = computed(() => {
    const type = this.selectedTargetType();
    return type === 'ALL'
      ? this.templates
      : this.templates.filter((item) => item.targetType === type);
  });

  readonly selectedTemplate = computed(() => {
    const visible = this.visibleTemplates();
    return visible.find((item) => item.id === this.selectedTemplateId()) ?? visible[0] ?? null;
  });

  readonly selectedTemplateSummary = computed(() => {
    const template = this.selectedTemplate();
    if (!template) return null;
    const required = template.rules.filter(
      (rule) => rule.transform_kind === 'constant' || !!rule.note,
    );
    return {
      template,
      requiredCount: required.length,
      previewRules: template.rules.slice(0, 3),
    };
  });

  readonly summary = computed(() => {
    const rows = this.filteredRows();
    const enabled = rows.filter((row) => Number(row.enabled) === 1).length;
    const valueMapped = rows.filter((row) => Number(row.value_mapping_enabled ?? 0) === 1).length;
    const strictFallback = rows.filter((row) => row.unmapped_behavior === 'ERROR').length;
    const connectorFamilies = new Set(rows.map((row) => row.target_type)).size;
    const totalValueMappings = rows.reduce((sum, row) => sum + this.translationCount(row.id), 0);

    return {
      total: rows.length,
      enabled,
      valueMapped,
      totalValueMappings,
      strictFallback,
      connectorFamilies,
    };
  });

  constructor() {
    this.refresh();
    this.refreshLisTargets();
  }

  async refresh() {
    try {
      this.loading.set(true);
      const rows = (await this.api.mappingsList()) as MappingRow[] | null;
      this.rows.set(rows ?? []);
      await this.refreshTranslationCounts(rows ?? []);
      this.ensureValidPage();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load mappings', 'Close', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }

  async refreshLisTargets() {
    try {
      const targets = ((await this.api.targetsList()) ?? []) as LisTargetOption[];
      const lisTargets = targets.filter((target) => ['LIS', 'OPENMRS'].includes(target.type));
      this.lisTargets.set(lisTargets);
      if (!this.lisSelectedTargetId() && lisTargets.length > 0) {
        this.lisSelectedTargetId.set(lisTargets[0].id);
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load LIS targets', 'Close', { duration: 3500 });
    }
  }

  async openOpenMrsLisAssistant() {
    if (this.lisTargets().length === 0) {
      await this.refreshLisTargets();
    }

    const ref = this.dialog.open(OpenMrsLisMappingAssistantDialog, {
      width: '80vw',
      maxWidth: '80vw',
      maxHeight: '90vh',
      autoFocus: false,
      restoreFocus: true,
      data: {
        targets: this.lisTargets(),
        selectedTargetId: this.lisSelectedTargetId(),
      },
    });

    const changed = await firstValueFrom(ref.afterClosed());
    if (changed) {
      await this.refresh();
      this.selectedTargetType.set('LIS');
      this.snack.open('LIS mappings refreshed after configuration update.', 'Close', { duration: 2600 });
    }
  }

  async openCreate(type?: MappingTargetType | undefined | 'ALL') {
    const ref = this.dialog.open(MappingDialog, {
      width: 'min(820px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: {
        mode: 'create',
        defaults: type && type !== 'ALL' ? { target_type: type } : undefined,
      },
    });

    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;

    try {
      await this.api.mappingsCreate(result);
      this.snack.open('Mapping rule created', 'Close', { duration: 1800 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to create mapping rule', 'Close', { duration: 3500 });
    }
  }

  async openEdit(row: MappingRow) {
    const ref = this.dialog.open(MappingDialog, {
      width: 'min(820px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { mode: 'edit', row },
    });

    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;

    try {
      await this.api.mappingsUpdate(row.id, result);
      this.snack.open('Mapping rule updated', 'Close', { duration: 1800 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to update mapping rule', 'Close', { duration: 3500 });
    }
  }

  openTemplateInfo(template: TemplateGroup) {
    this.dialog.open(StarterTemplateInfoDialog, {
      width: 'min(920px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { template },
    });
  }

  async openValueTranslations(row: MappingRow) {
    const ref = this.dialog.open(MappingValueTranslationsDialog, {
      width: 'min(1080px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { row },
    });

    const changed = await firstValueFrom(ref.afterClosed());
    if (changed) await this.refresh();
  }

  async remove(row: MappingRow) {
    if (!confirm(`Delete mapping "${row.source_field || 'constant'} → ${row.destination_field}"?`))
      return;
    try {
      await this.api.mappingsDelete(row.id);
      this.snack.open('Mapping rule deleted', 'Close', { duration: 1800 });
      if (this.expandedId() === row.id) this.expandedId.set(null);
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to delete mapping rule', 'Close', { duration: 3500 });
    }
  }

  async validate(type?: MappingTargetType) {
    const targetType =
      type ??
      (this.selectedTargetType() === 'ALL'
        ? (this.selectedTemplate()?.targetType ?? 'DHIS2')
        : this.selectedTargetType());
    try {
      const result = await this.api.mappingsValidate(targetType);
      this.validation.set(result);
      this.snack.open(result.message, 'Close', { duration: 2600 });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Validation failed', 'Close', { duration: 3500 });
    }
  }

  async applySelectedTemplate() {
    const template = this.selectedTemplate();
    if (!template) {
      this.snack.open('Choose a starter template first.', 'Close', { duration: 2200 });
      return;
    }
    await this.applyTemplate(template);
  }

  async applyTemplate(template: TemplateGroup) {
    const existingRows = this.rows().filter((row) => row.target_type === template.targetType);
    const existingDestinations = new Set(
      existingRows.map((row) => String(row.destination_field ?? '').trim()).filter(Boolean),
    );
    const toCreate = template.rules.filter(
      (rule) => !existingDestinations.has(String(rule.destination_field ?? '').trim()),
    );

    if (toCreate.length === 0) {
      this.snack.open(`${template.title} is already present. No new rules were added.`, 'Close', {
        duration: 2600,
      });
      return;
    }

    try {
      this.loading.set(true);
      for (const rule of toCreate) {
        await this.api.mappingsCreate({
          target_type: template.targetType,
          source_field: rule.transform_kind === 'constant' ? '' : rule.source_field,
          destination_field: rule.destination_field,
          transform_kind: rule.transform_kind,
          constant_value: rule.transform_kind === 'constant' ? (rule.constant_value ?? '') : null,
          enabled: rule.enabled ?? 1,
        });
      }

      await this.refresh();
      this.selectedTargetType.set(template.targetType);
      this.selectedTemplateId.set(template.id);
      this.pageIndex.set(0);
      this.snack.open(
        `Added ${toCreate.length} starter rule${toCreate.length === 1 ? '' : 's'} for ${template.targetType}.`,
        'Close',
        { duration: 2800 },
      );
      await this.validate(template.targetType);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to apply starter template', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  setTargetType(type: MappingTargetType | 'ALL') {
    this.selectedTargetType.set(type);
    this.pageIndex.set(0);
    if (type === 'ALL') this.validation.set(null);
    this.ensureValidPage();
  }

  selectTemplate(template: TemplateGroup) {
    this.selectedTemplateId.set(template.id);
  }

  toggleStarterTemplates() {
    this.showStarterTemplates.update((value) => !value);
  }

  toggleExpanded(row: MappingRow) {
    this.expandedId.update((current) => (current === row.id ? null : row.id));
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  helperCount(type: MappingTargetType) {
    return this.rows().filter((row) => row.target_type === type).length;
  }

  transformPreviewLabel(row: MappingRow) {
    if (row.transform_kind === 'constant') return row.constant_value || 'Constant value';
    if (row.transform_kind === 'lookup') return `Lookup from ${row.source_field || 'source field'}`;
    return row.source_field || 'Direct mapping';
  }

  rowSummaryNotes(row: MappingRow) {
    const notes: Array<{ kind: 'info' | 'warn'; text: string }> = [];
    if (row.value_mapping_enabled === 1) {
      notes.push({
        kind: 'info',
        text: `${this.translationCount(row.id)} value translation${this.translationCount(row.id) === 1 ? '' : 's'} configured.`,
      });
    } else {
      notes.push({ kind: 'info', text: 'Value translation is not enabled for this field.' });
    }
    if (row.unmapped_behavior === 'ERROR') {
      notes.push({
        kind: 'warn',
        text: 'Unmapped values are configured to stop delivery until translated.',
      });
    } else if (row.unmapped_behavior === 'DEFAULT_VALUE') {
      notes.push({
        kind: 'info',
        text: `Fallback default value: ${row.default_destination_value || 'not set'}`,
      });
    } else {
      notes.push({
        kind: 'info',
        text: `Fallback behavior: ${this.unmappedBehaviorLabel(row.unmapped_behavior)}`,
      });
    }
    return notes;
  }

  valueModeLabel(row: MappingRow): string {
    if (row.value_mapping_enabled !== 1) return 'Passthrough';
    const count = this.translationCount(row.id);
    if (count > 0) return `${count} value map${count === 1 ? '' : 's'}`;
    return this.unmappedBehaviorLabel(row.unmapped_behavior) === 'Passthrough'
      ? 'Enabled'
      : this.unmappedBehaviorLabel(row.unmapped_behavior);
  }

  valueModeTone(row: MappingRow): 'ok' | 'warn' | 'idle' {
    if (row.value_mapping_enabled !== 1) return 'idle';
    if (row.unmapped_behavior === 'ERROR') return 'warn';
    return 'ok';
  }

  translationCount(mappingRuleId: string): number {
    return this.translationCountMap()[mappingRuleId] ?? 0;
  }

  unmappedBehaviorLabel(value?: string | null): string {
    switch (value) {
      case 'DEFAULT_VALUE':
        return 'Default value';
      case 'EMPTY':
        return 'Empty';
      case 'ERROR':
        return 'Strict';
      case 'PASSTHROUGH':
      default:
        return 'Passthrough';
    }
  }

  transformKindLabel(kind: TransformKind): string {
    switch (kind) {
      case 'constant':
        return 'Constant';
      case 'lookup':
        return 'Lookup';
      case 'direct':
      default:
        return 'Direct';
    }
  }

  transformKindTone(kind: TransformKind): 'direct' | 'constant' | 'lookup' {
    return kind;
  }

  translationRows(mappingRuleId: string): TranslationRow[] {
    return this.translationMap()[mappingRuleId] ?? [];
  }

  translationPairsPreview(row: MappingRow, limit = 3): string[] {
    return this.translationRows(row.id)
      .map(
        (item) =>
          `${this.translationSourceValue(item) || '—'} → ${this.translationDestinationValue(item) || '—'}`,
      )
      .slice(0, limit);
  }

  remainingTranslationCount(row: MappingRow, limit = 3): number {
    return Math.max(0, this.translationCount(row.id) - limit);
  }

  hasTranslations(row: MappingRow): boolean {
    return this.translationCount(row.id) > 0;
  }

  translationSourceValue(item: TranslationRow): string {
    return String(item.source_value ?? item.source ?? item.from_value ?? '').trim() || '—';
  }

  translationDestinationValue(item: TranslationRow): string {
    return String(item.destination_value ?? item.destination ?? item.to_value ?? '').trim() || '—';
  }

  mappingReadiness(row: MappingRow): {
    label: string;
    tone: 'ok' | 'warn' | 'idle';
    description: string;
  } {
    const translationEnabled = Number(row.value_mapping_enabled ?? 0) === 1;
    const count = this.translationCount(row.id);

    if (row.enabled !== 1) {
      return {
        label: 'Inactive',
        tone: 'idle',
        description:
          'This rule is currently disabled and will not participate in transformation output.',
      };
    }

    if (translationEnabled && row.unmapped_behavior === 'ERROR') {
      return {
        label: 'Strict',
        tone: 'warn',
        description:
          count > 0
            ? 'Unmapped incoming values will stop delivery until they are translated explicitly.'
            : 'Value translation is enabled in strict mode, but no mapping values are configured yet.',
      };
    }

    if (translationEnabled && count > 0) {
      return {
        label: 'Ready',
        tone: 'ok',
        description: `This rule includes ${count} value mapping${count === 1 ? '' : 's'} and a defined fallback strategy.`,
      };
    }

    return {
      label: 'Flexible',
      tone: 'idle',
      description:
        'This rule relies on direct passthrough or fallback handling instead of explicit translation pairs.',
    };
  }

  validationHealthTone(): 'ok' | 'warn' | 'idle' {
    const validation = this.validation();
    if (!validation) return 'idle';
    return validation.ok ? 'ok' : 'warn';
  }

  validationHealthLabel(): string {
    const validation = this.validation();
    if (!validation) return 'Not validated';
    return validation.ok ? 'Ready for use' : 'Needs attention';
  }

  validationHighlights() {
    const validation = this.validation();
    const summary = validation?.summary ?? {};
    return [
      {
        label: 'Readiness',
        value: this.validationHealthLabel(),
        sub: validation?.message ?? 'Run validation to review connector-specific rule integrity.',
        tone: this.validationHealthTone(),
      },
      {
        label: 'Enabled rules',
        value: String(summary.enabledRules ?? 0),
        sub: 'Rules currently participating in transform output.',
        tone: 'ok' as const,
      },
      {
        label: 'Duplicate destinations',
        value: String(summary.duplicateDestinations ?? 0),
        sub: 'Multiple rules targeting the same destination path.',
        tone: (summary.duplicateDestinations ?? 0) > 0 ? ('warn' as const) : ('ok' as const),
      },
      {
        label: 'Unsupported kinds',
        value: String(summary.unsupportedKinds ?? 0),
        sub: 'Transform kinds not supported by the current target handler.',
        tone: (summary.unsupportedKinds ?? 0) > 0 ? ('warn' as const) : ('ok' as const),
      },
    ];
  }

  trackById = (_index: number, row: MappingRow) => row.id;

  private async refreshTranslationCounts(rows: MappingRow[]) {
    const settled = await Promise.allSettled(
      rows.map(async (row) => {
        const translations = ((await this.api.mappingValueTranslationsList(row.id)) ??
          []) as TranslationRow[];
        return { id: row.id, count: translations.length, translations };
      }),
    );

    const countMap: Record<string, number> = {};
    const translationsMap: Record<string, TranslationRow[]> = {};

    for (const item of settled) {
      if (item.status === 'fulfilled') {
        countMap[item.value.id] = item.value.count;
        translationsMap[item.value.id] = item.value.translations;
      }
    }

    this.translationCountMap.set(countMap);
    this.translationMap.set(translationsMap);
  }

  private ensureValidPage() {
    const total = this.filteredRows().length;
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) this.pageIndex.set(maxPage);
  }
}
