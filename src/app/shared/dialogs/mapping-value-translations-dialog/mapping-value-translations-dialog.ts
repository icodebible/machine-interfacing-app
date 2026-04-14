import { CommonModule } from '@angular/common';
import { Component, Inject, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { firstValueFrom } from 'rxjs';

import { PlatformApiService } from '../../../core/platform/platform-api.service';
import { MappingValueTranslationEntryDialog } from '../mapping-value-translation-entry-dialog/mapping-value-translation-entry-dialog';

type UnmappedBehavior = 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR';

type ValueRow = {
  id: string;
  mapping_rule_id: string;
  source_value: string;
  destination_value: string | null;
  enabled: number;
  note?: string | null;
  created_at: string;
  updated_at: string;
};

@Component({
  selector: 'app-mapping-value-translations-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  templateUrl: './mapping-value-translations-dialog.html',
  styleUrl: './mapping-value-translations-dialog.scss',
})
export class MappingValueTranslationsDialog {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(false);
  rows = signal<ValueRow[]>([]);
  pageIndex = signal(0);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];
  readonly cols = ['source', 'destination', 'status', 'actions'];
  private changed = false;

  valueMappingEnabled: any;
  unmappedBehavior!: UnmappedBehavior;
  defaultDestinationValue!: string;

  readonly pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { row: any },
    private readonly ref: MatDialogRef<MappingValueTranslationsDialog>,
  ) {
    this.refresh();
    this.valueMappingEnabled =
      (this.data.row?.value_mapping_enabled ?? 0) === 1 ? 'ENABLED' : 'DISABLED';
    this.unmappedBehavior =
      (this.data.row?.unmapped_behavior as UnmappedBehavior | null) ?? 'PASSTHROUGH';
    this.defaultDestinationValue = this.data.row?.default_destination_value ?? '';
  }

  async refresh() {
    try {
      this.loading.set(true);
      const rows = await this.api.mappingValueTranslationsList(this.data.row.id);
      this.rows.set((rows as any) ?? []);
      this.ensureValidPage();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load value translations', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  async saveConfig() {
    try {
      await this.api.mappingValueTranslationsSaveConfig(this.data.row.id, {
        value_mapping_enabled: this.valueMappingEnabled === 'ENABLED' ? 1 : 0,
        unmapped_behavior: this.unmappedBehavior,
        default_destination_value:
          this.unmappedBehavior === 'DEFAULT_VALUE'
            ? this.defaultDestinationValue?.trim() || null
            : null,
      });

      this.changed = true;
      this.snack.open('Value translation behavior saved', 'Close', { duration: 2200 });
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to save value translation behavior', 'Close', {
        duration: 3500,
      });
    }
  }

  async openCreate() {
    const ref = this.dialog.open(MappingValueTranslationEntryDialog, {
      width: 'min(560px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { mode: 'create' },
    });

    const dto = await firstValueFrom(ref.afterClosed());
    if (!dto) return;

    try {
      await this.api.mappingValueTranslationsCreate({
        mapping_rule_id: this.data.row.id,
        ...dto,
      });
      this.changed = true;
      this.snack.open('Value translation added', 'Close', { duration: 2000 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to add value translation', 'Close', {
        duration: 3500,
      });
    }
  }

  async openEdit(row: ValueRow) {
    const ref = this.dialog.open(MappingValueTranslationEntryDialog, {
      width: 'min(560px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: { mode: 'edit', row },
    });

    const dto = await firstValueFrom(ref.afterClosed());
    if (!dto) return;

    try {
      await this.api.mappingValueTranslationsUpdate(row.id, dto);
      this.changed = true;
      this.snack.open('Value translation updated', 'Close', { duration: 2000 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to update value translation', 'Close', {
        duration: 3500,
      });
    }
  }

  async remove(row: ValueRow) {
    if (
      !confirm(
        `Delete value translation "${row.source_value}" → "${row.destination_value ?? '—'}"?`,
      )
    ) {
      return;
    }

    try {
      await this.api.mappingValueTranslationsDelete(row.id);
      this.changed = true;
      this.snack.open('Value translation deleted', 'Close', { duration: 2000 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to delete value translation', 'Close', {
        duration: 3500,
      });
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  close() {
    this.ref.close(this.changed);
  }

  private ensureValidPage() {
    const total = this.rows().length;
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) this.pageIndex.set(maxPage);
  }
}
