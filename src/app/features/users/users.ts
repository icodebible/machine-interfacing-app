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
import { UserDialogComponent } from '../../shared/dialogs/user-dialog/user-dialog';
import { UserPasswordDialogComponent } from '../../shared/dialogs/user-password-dialog/user-password-dialog';

@Component({
  selector: 'app-users',
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
  templateUrl: './users.html',
  styleUrl: './users.scss',
})
export class Users {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  readonly cols = ['user', 'roles', 'status', 'updated', 'actions'];

  loading = signal(false);
  rows = signal<any[]>([]);
  roles = signal<any[]>([]);
  selected = signal<any | null>(null);
  currentUser = signal<any | null>(null);
  detailsExpanded = signal(false);

  summary = computed(() => {
    const rows = this.rows();
    return {
      total: rows.length,
      active: rows.filter((r) => r.is_active === 1).length,
      mustChangePassword: rows.filter((r) => r.must_change_password === 1).length,
      superAdmins: rows.filter((r) => (r.authorities ?? []).includes('SUPER_ADMIN')).length,
    };
  });

  constructor() {
    void this.refresh();
  }

  async refresh() {
    try {
      this.loading.set(true);
      const [rows, roles, currentUser] = await Promise.all([
        this.api.usersList(),
        this.api.rolesList(),
        this.api.authCurrentUser(),
      ]);
      this.rows.set(rows ?? []);
      this.roles.set(roles ?? []);
      this.currentUser.set(currentUser ?? null);
      const selectedId = this.selected()?.id;
      const keep = selectedId
        ? (rows ?? []).find((row: any) => row.id === selectedId)
        : ((rows ?? [])[0] ?? null);
      this.selected.set(keep ?? null);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load users', 'Close', { duration: 3500 });
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

  statusClass(active: number) {
    return active === 1 ? 'ok' : 'bad';
  }

  isProtected(row: any) {
    return String(row?.username ?? '').toLowerCase() === 'admin';
  }

  rolePreview(row: any, limit = 3) {
    return [...(row?.role_names ?? [])].slice(0, limit);
  }

  authorityPreview(row: any, limit = 6) {
    return [...(row?.authorities ?? [])].slice(0, limit);
  }

  overflowCount(values: any[] | undefined | null, limit = 3) {
    return Math.max(0, (values ?? []).length - limit);
  }

  async openCreate() {
    const ref = this.dialog.open(UserDialogComponent, {
      data: { mode: 'create', roles: this.roles() },
      autoFocus: false,
      restoreFocus: false,
    });
    const draft = await firstValueFrom(ref.afterClosed());
    if (!draft) return;

    try {
      this.loading.set(true);
      await this.api.usersCreate(draft);
      this.snack.open('User created successfully', 'Close', { duration: 2500 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to create user', 'Close', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  async openEdit(row: any, event?: Event) {
    event?.stopPropagation();
    const ref = this.dialog.open(UserDialogComponent, {
      data: { mode: 'edit', row, roles: this.roles() },
      autoFocus: false,
      restoreFocus: false,
    });
    const draft = await firstValueFrom(ref.afterClosed());
    if (!draft) return;

    try {
      this.loading.set(true);
      await this.api.usersUpdate(row.id, {
        username: draft.username,
        is_active: draft.is_active,
        must_change_password: draft.must_change_password,
        role_ids: draft.role_ids,
      });
      this.snack.open('User updated successfully', 'Close', { duration: 2500 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to update user', 'Close', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  async openResetPassword(row: any, event?: Event) {
    event?.stopPropagation();
    const ref = this.dialog.open(UserPasswordDialogComponent, {
      data: { row, currentUser: this.currentUser() },
      autoFocus: false,
      restoreFocus: false,
    });
    const password = await firstValueFrom(ref.afterClosed());
    if (!password) return;

    try {
      this.loading.set(true);
      await this.api.usersResetPassword(row.id, String(password));
      this.snack.open('Password reset successfully', 'Close', { duration: 2500 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to reset password', 'Close', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  async remove(row: any, event?: Event) {
    event?.stopPropagation();
    if (this.isProtected(row)) {
      this.snack.open('The bootstrap admin user cannot be deleted', 'Close', { duration: 4000 });
      return;
    }
    const confirmed = confirm(`Delete user ${row.username}?`);
    if (!confirmed) return;

    try {
      this.loading.set(true);
      await this.api.usersDelete(row.id);
      this.snack.open('User deleted', 'Close', { duration: 2500 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to delete user', 'Close', { duration: 4000 });
    } finally {
      this.loading.set(false);
    }
  }

  formatDateTime(value?: string | null) {
    return value ? new Date(value).toLocaleString() : '—';
  }
}
