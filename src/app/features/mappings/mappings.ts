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

type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
type TransformKind = 'direct' | 'constant' | 'lookup';
type UnmappedBehavior = 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR';

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
      description: 'Builds a configurable DHIS2 event payload using indexed array paths.',
      useCase: 'Use when you need an event payload without hardcoding a DHIS2-specific adapter.',
      rules: [
        { source_field: '', destination_field: 'events[0].status', transform_kind: 'constant', constant_value: 'COMPLETED' },
        { source_field: '', destination_field: 'events[0].program', transform_kind: 'constant', constant_value: 'PROGRAM_UID', note: 'Replace with the actual DHIS2 program uid.' },
        { source_field: '', destination_field: 'events[0].programStage', transform_kind: 'constant', constant_value: 'PROGRAM_STAGE_UID', note: 'Replace with the actual program stage uid.' },
        { source_field: '', destination_field: 'events[0].orgUnit', transform_kind: 'constant', constant_value: 'ORG_UNIT_UID', note: 'Replace with the correct org unit uid.' },
        { source_field: 'patient.id', destination_field: 'events[0].trackedEntity', transform_kind: 'direct' },
        { source_field: 'result.observedAt', destination_field: 'events[0].occurredAt', transform_kind: 'direct' },
        { source_field: '', destination_field: 'events[0].dataValues[0].dataElement', transform_kind: 'constant', constant_value: 'DATA_ELEMENT_UID_RESULT_VALUE' },
        { source_field: 'result.value', destination_field: 'events[0].dataValues[0].value', transform_kind: 'direct' },
      ],
    },
    {
      id: 'dhis2-tracker',
      targetType: 'DHIS2',
      title: 'DHIS2 tracker starter',
      description: 'Bootstraps a tracked entity payload with attributes, enrollment, and one event.',
      useCase: 'Use when the receiver expects tracker-style payloads with trackedEntities, attributes, and enrollment/event nesting.',
      rules: [
        { source_field: '', destination_field: 'trackedEntities[0].trackedEntityType', transform_kind: 'constant', constant_value: 'TRACKED_ENTITY_TYPE_UID', note: 'Replace with the target tracked entity type uid.' },
        { source_field: '', destination_field: 'trackedEntities[0].orgUnit', transform_kind: 'constant', constant_value: 'ORG_UNIT_UID', note: 'Replace with the correct organisation unit uid.' },
        { source_field: '', destination_field: 'trackedEntities[0].attributes[0].attribute', transform_kind: 'constant', constant_value: 'ATTRIBUTE_UID_PATIENT_ID' },
        { source_field: 'patient.id', destination_field: 'trackedEntities[0].attributes[0].value', transform_kind: 'direct' },
        { source_field: '', destination_field: 'trackedEntities[0].enrollments[0].program', transform_kind: 'constant', constant_value: 'PROGRAM_UID' },
        { source_field: 'result.observedAt', destination_field: 'trackedEntities[0].enrollments[0].occurredAt', transform_kind: 'direct' },
        { source_field: '', destination_field: 'trackedEntities[0].enrollments[0].events[0].programStage', transform_kind: 'constant', constant_value: 'PROGRAM_STAGE_UID' },
        { source_field: 'result.value', destination_field: 'trackedEntities[0].enrollments[0].events[0].dataValues[0].value', transform_kind: 'direct' },
      ],
    },
    {
      id: 'openmrs-result',
      targetType: 'OPENMRS',
      title: 'OpenMRS result starter',
      description: 'Provides identifiers, encounter timing, and a minimal obs payload shape.',
      useCase: 'Use when an OpenMRS instance expects a small encounter and observation payload.',
      rules: [
        { source_field: 'patient.id', destination_field: 'patient.identifier', transform_kind: 'direct' },
        { source_field: 'result.observedAt', destination_field: 'encounter.encounterDatetime', transform_kind: 'direct' },
        { source_field: 'result.code', destination_field: 'obs.concept', transform_kind: 'direct' },
        { source_field: 'result.value', destination_field: 'obs.value', transform_kind: 'direct' },
        { source_field: '', destination_field: 'encounter.encounterType', transform_kind: 'constant', constant_value: 'LAB_RESULT', note: 'Replace with the OpenMRS encounter type you expect.' },
      ],
    },
    {
      id: 'lis-result',
      targetType: 'LIS',
      title: 'LIS result starter',
      description: 'Builds a specimen- and result-focused structure for LIS delivery.',
      useCase: 'Use when the receiving LIS expects accession-based result payloads.',
      rules: [
        { source_field: 'patient.id', destination_field: 'patient.identifier', transform_kind: 'direct' },
        { source_field: 'order.id', destination_field: 'specimen.accessionNumber', transform_kind: 'direct' },
        { source_field: 'result.code', destination_field: 'result.testCode', transform_kind: 'direct' },
        { source_field: 'result.value', destination_field: 'result.value', transform_kind: 'direct' },
        { source_field: 'result.units', destination_field: 'result.units', transform_kind: 'direct' },
      ],
    },
    {
      id: 'custom-http-json',
      targetType: 'CUSTOM_HTTP',
      title: 'Custom HTTP JSON starter',
      description: 'Provides a partner-friendly nested JSON shape for custom endpoints.',
      useCase: 'Use when a partner endpoint accepts a structured JSON payload over HTTP.',
      rules: [
        { source_field: 'patient.id', destination_field: 'payload.patient.identifier', transform_kind: 'direct' },
        { source_field: 'result.code', destination_field: 'payload.result.code', transform_kind: 'direct' },
        { source_field: 'result.value', destination_field: 'payload.result.value', transform_kind: 'direct' },
        { source_field: 'result.observedAt', destination_field: 'payload.result.observedAt', transform_kind: 'direct' },
        { source_field: '', destination_field: 'payload.source', transform_kind: 'constant', constant_value: 'machine-interfacing', note: 'Use a stable source identifier agreed with the partner.' },
      ],
    },
  ];

  loading = signal(false);
  rows = signal<MappingRow[]>([]);
  validation = signal<any | null>(null);
  selectedTargetType = signal<MappingTargetType | 'ALL'>('ALL');
  selectedTemplateId = signal<string | null>('dhis2-event');
  translationCountMap = signal<Record<string, number>>({});
  pageIndex = signal(0);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];
  cols: string[] = ['target', 'source', 'destination', 'kind', 'valueMode', 'status', 'actions'];

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
    return type === 'ALL' ? this.templates : this.templates.filter((item) => item.targetType === type);
  });

  readonly selectedTemplate = computed(() => {
    const preferred = this.selectedTemplateId();
    const visible = this.visibleTemplates();
    return visible.find((item) => item.id === preferred) ?? visible[0] ?? null;
  });

  readonly selectedTemplateSummary = computed(() => {
    const template = this.selectedTemplate();
    if (!template) return null;
    const required = template.rules.filter((rule) => rule.transform_kind === 'constant' || !!rule.note);
    return {
      template,
      requiredCount: required.length,
      previewRules: template.rules.slice(0, 3),
    };
  });

  constructor() {
    this.refresh();
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
    if (changed) {
      await this.refresh();
    }
  }

  async remove(row: MappingRow) {
    if (!confirm(`Delete mapping "${row.source_field || 'constant'} → ${row.destination_field}"?`)) {
      return;
    }

    try {
      await this.api.mappingsDelete(row.id);
      this.snack.open('Mapping rule deleted', 'Close', { duration: 1800 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to delete mapping rule', 'Close', { duration: 3500 });
    }
  }

  async validate(type?: MappingTargetType) {
    const targetType = type ?? (this.selectedTargetType() === 'ALL' ? this.selectedTemplate()?.targetType ?? 'DHIS2' : this.selectedTargetType());
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
    const existingDestinations = new Set(existingRows.map((row) => String(row.destination_field ?? '').trim()).filter(Boolean));

    const toCreate = template.rules.filter((rule) => !existingDestinations.has(String(rule.destination_field ?? '').trim()));

    if (toCreate.length === 0) {
      this.snack.open(`${template.title} is already present. No new rules were added.`, 'Close', { duration: 2600 });
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
          constant_value: rule.transform_kind === 'constant' ? rule.constant_value ?? '' : null,
          enabled: rule.enabled ?? 1,
        });
      }

      await this.refresh();
      this.selectedTargetType.set(template.targetType);
      this.selectedTemplateId.set(template.id);
      this.pageIndex.set(0);
      this.snack.open(`Added ${toCreate.length} starter rule${toCreate.length === 1 ? '' : 's'} from ${template.title}.`, 'Close', { duration: 2800 });
      await this.validate(template.targetType);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to apply starter template', 'Close', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }

  setTargetType(type: MappingTargetType | 'ALL') {
    this.selectedTargetType.set(type);
    this.pageIndex.set(0);
    if (type === 'ALL') {
      this.validation.set(null);
      return;
    }
    const firstForType = this.templates.find((item) => item.targetType === type);
    if (firstForType) {
      this.selectedTemplateId.set(firstForType.id);
    }
    this.ensureValidPage();
  }

  selectTemplate(template: TemplateGroup) {
    this.selectedTemplateId.set(template.id);
  }

  focusTemplate(template: TemplateGroup) {
    this.selectedTargetType.set(template.targetType);
    this.selectedTemplateId.set(template.id);
    this.pageIndex.set(0);
    this.ensureValidPage();
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  helperCount(type: MappingTargetType) {
    return this.rows().filter((row) => row.target_type === type).length;
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

  private async refreshTranslationCounts(rows: MappingRow[]) {
    const settled = await Promise.allSettled(
      rows.map(async (row) => ({
        id: row.id,
        count: (await this.api.mappingValueTranslationsList(row.id)).length,
      })),
    );

    const map: Record<string, number> = {};
    for (const item of settled) {
      if (item.status === 'fulfilled') {
        map[item.value.id] = item.value.count;
      }
    }
    this.translationCountMap.set(map);
  }

  private ensureValidPage() {
    const total = this.filteredRows().length;
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) this.pageIndex.set(maxPage);
  }
}
