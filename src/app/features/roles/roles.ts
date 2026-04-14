import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { PlatformApiService } from '../../core/platform/platform-api.service';
import { RoleDialogComponent } from '../../shared/dialogs/role-dialog/role-dialog';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    MatDividerModule,
    MatTooltipModule,
  ],
  templateUrl: './roles.html',
  styleUrl: './roles.scss',
})
export class Roles {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly cols = ['role', 'authorities', 'status', 'updated', 'actions'];

  loading = signal(false);
  rows = signal<any[]>([]);
  catalog = signal<string[]>([]);
  selected = signal<any | null>(null);
  detailsExpanded = signal(false);

  summary = computed(() => {
    const rows = this.rows();
    return {
      total: rows.length,
      privileged: rows.filter((r) => r.is_system_role).length,
      assigned: rows.filter((r) => Number(r.user_count || 0) > 0).length,
      authorityLinks: rows.reduce(
        (sum, row) => sum + Number((row.authority_codes || []).length),
        0,
      ),
    };
  });

  constructor() {
    void this.refresh();
  }

  async refresh() {
    try {
      this.loading.set(true);
      const [rows, catalog] = await Promise.all([
        this.api.rolesList(),
        this.api.rolesAuthoritiesCatalog(),
      ]);
      this.rows.set(rows ?? []);
      this.catalog.set(catalog ?? []);
      const selectedId = this.selected()?.id;
      const keep = selectedId
        ? (rows ?? []).find((row: any) => row.id === selectedId)
        : ((rows ?? [])[0] ?? null);
      this.selected.set(keep ?? null);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load roles', 'Close', { duration: 3500 });
    } finally {
      this.loading.set(false);
    }
  }

  selectRow(row: any) {
    this.selected.set(row);
  }

  toggleDetails(row: any, event?: Event) {
    event?.stopPropagation();
    const isSame = this.selected()?.id === row?.id;
    this.selected.set(row);
    this.detailsExpanded.set(isSame ? !this.detailsExpanded() : true);
  }

  statusClass(row: any) {
    return row?.is_system_role ? 'info' : Number(row?.user_count || 0) > 0 ? 'ok' : 'warn';
  }

  authorityPreview(row: any, limit = 4) {
    return [...(row?.authority_codes ?? [])].slice(0, limit);
  }

  overflowCount(values: any[] | undefined | null, limit = 4) {
    return Math.max(0, (values ?? []).length - limit);
  }

  async openCreate() {
    const ref = this.dialog.open(RoleDialogComponent, {
      data: { mode: 'create', catalog: this.catalog() },
      autoFocus: false,
      restoreFocus: false,
    });
    const draft = await firstValueFrom(ref.afterClosed());
    if (!draft) return;

    try {
      this.loading.set(true);
      await this.api.rolesCreate(draft);
      this.snack.open('Role created successfully', 'Close', { duration: 2500 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to create role', 'Close', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  async openEdit(row: any, event?: Event) {
    event?.stopPropagation();
    const ref = this.dialog.open(RoleDialogComponent, {
      data: { mode: 'edit', row, catalog: this.catalog() },
      autoFocus: false,
      restoreFocus: false,
    });
    const draft = await firstValueFrom(ref.afterClosed());
    if (!draft) return;

    try {
      this.loading.set(true);
      await this.api.rolesUpdate(row.id, {
        name: draft.name,
        description: draft.description,
        authority_codes: draft.authority_codes,
      });
      this.snack.open('Role updated successfully', 'Close', { duration: 2500 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to update role', 'Close', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  async remove(row: any, event?: Event) {
    event?.stopPropagation();
    if (row?.is_system_role || String(row?.name ?? '').toUpperCase() === 'SUPER_ADMIN') {
      this.snack.open('SUPER_ADMIN cannot be deleted', 'Close', { duration: 4000 });
      return;
    }
    const confirmed = confirm(`Delete role ${row.name}?`);
    if (!confirmed) return;

    try {
      this.loading.set(true);
      await this.api.rolesDelete(row.id);
      this.snack.open('Role deleted', 'Close', { duration: 2500 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to delete role', 'Close', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  formatDateTime(value?: string | null) {
    return value ? new Date(value).toLocaleString() : '—';
  }
}
