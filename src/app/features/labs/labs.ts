import { CommonModule } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal, viewChild } from '@angular/core';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSidenavModule, MatDrawer } from '@angular/material/sidenav';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { PlatformApiService } from '../../core/platform/platform-api.service';
import { LabFormDialog } from '../../shared/dialogs/lab-form-dialog/lab-form-dialog';

type LabRow = {
  id: string;
  created_by_user_id?: string | null;
  created_by_username?: string | null;
  updated_by_user_id?: string | null;
  updated_by_username?: string | null;
  code?: string | null;
  name: string;
  location?: string | null;
  description?: string | null;
  is_active: number;
  created_at?: string | null;
  updated_at?: string | null;
};

type FilterStatus = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-labs',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSidenavModule,
    MatMenuModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressBarModule,
    MatPaginatorModule,
  ],
  templateUrl: './labs.html',
  styleUrl: './labs.scss',
})
export class Labs {
  private api = inject(PlatformApiService);
  private dialog = inject(MatDialog);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  drawer = viewChild.required(MatDrawer);

  cols = ['name', 'location', 'actions'];

  rows = signal<LabRow[]>([]);
  loading = signal(false);

  // Search/filter above table
  q = signal('');
  status = signal<FilterStatus>('all');

  pageIndex = signal(0);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];

  // Details drawer
  selected = signal<LabRow | null>(null);
  drawerMode = signal<'side' | 'over'>('side');

  filtered = computed(() => {
    const query = this.q().trim().toLowerCase();
    const status = this.status();

    return this.rows()
      .filter((r) => {
        if (status === 'active') return r.is_active === 1;
        if (status === 'inactive') return r.is_active === 0;
        return true;
      })
      .filter((r) => {
        if (!query) return true;
        const hay =
          `${r.name} ${r.code ?? ''} ${r.location ?? ''} ${r.description ?? ''}`.toLowerCase();
        return hay.includes(query);
      });
  });

  pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filtered().slice(start, start + this.pageSize());
  });

  constructor() {
    this.refresh();
    this.updateDrawerMode();

    const onResize = () => this.updateDrawerMode();
    window.addEventListener('resize', onResize);

    this.destroyRef.onDestroy(() => {
      window.removeEventListener('resize', onResize);
    });
  }

  private updateDrawerMode() {
    // On narrow windows, use overlay drawer so table remains usable
    this.drawerMode.set(window.innerWidth < 900 ? 'over' : 'side');
  }

  async refresh() {
    try {
      this.loading.set(true);
      const list = await this.api.labsList();
      this.rows.set(list);
      this.ensureValidPage();

      // Keep selection stable if still exists
      const sel = this.selected();
      if (sel) {
        const still = list.find((x) => x.id === sel.id) ?? null;
        this.selected.set(still);
        if (!still) this.drawer().close();
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load labs', 'OK', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }

  async openCreate() {
    const ref = this.dialog.open(LabFormDialog, {
      width: '560px',
      data: { mode: 'create' },
      autoFocus: false,
      disableClose: true,
    });

    const dto = await ref.afterClosed().toPromise();
    if (!dto) return;

    try {
      await this.api.labsCreate(dto);
      this.snack.open('Lab created', 'OK', { duration: 2000 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Create failed', 'OK', { duration: 3500 });
    }
  }

  async openEdit(row: LabRow) {
    const ref = this.dialog.open(LabFormDialog, {
      width: '560px',
      data: { mode: 'edit', row },
      autoFocus: false,
      disableClose: true,
    });

    const dto = await ref.afterClosed().toPromise();
    if (!dto) return;

    try {
      await this.api.labsUpdate(row.id, dto);
      this.snack.open('Lab updated', 'OK', { duration: 2000 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Update failed', 'OK', { duration: 3500 });
    }
  }

  async remove(row: LabRow) {
    if (!confirm(`Delete lab "${row.name}"?`)) return;

    try {
      await this.api.labsDelete(row.id);
      this.snack.open('Lab deleted', 'OK', { duration: 2000 });
      if (this.selected()?.id === row.id) {
        this.selected.set(null);
        this.drawer().close();
      }
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Delete failed', 'OK', { duration: 3500 });
    }
  }

  async toggleActive(row: LabRow) {
    const next = row.is_active === 1 ? 0 : 1;
    try {
      await this.api.labsUpdate(row.id, { is_active: next });
      this.snack.open(next ? 'Lab activated' : 'Lab deactivated', 'OK', { duration: 2000 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Action failed', 'OK', { duration: 3500 });
    }
  }

  async viewDetails(row: LabRow) {
    this.selected.set(row);
    await this.drawer().open();
  }

  closeDetails() {
    this.drawer().close();
    this.selected.set(null);
  }

  // async copy(text: string) {
  //   try {
  //     await navigator.clipboard.writeText(text);
  //     this.snack.open('Copied', 'OK', { duration: 1200 });
  //   } catch {
  //     this.snack.open('Copy not available', 'OK', { duration: 2000 });
  //   }
  // }

  async copy(text: string) {
    try {
      await this.api.copy(text);
      this.snack.open('Copied to clipboard', 'OK', { duration: 1200 });
    } catch {
      this.snack.open('Failed to copy', 'OK', { duration: 2000 });
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  private ensureValidPage() {
    const total = this.filtered().length;
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) this.pageIndex.set(maxPage);
  }

  trackById = (_: number, r: LabRow) => r.id;
}
