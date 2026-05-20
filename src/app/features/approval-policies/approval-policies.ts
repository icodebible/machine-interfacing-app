import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { firstValueFrom } from 'rxjs';
import { PlatformApiService } from '../../core/platform/platform-api.service';
import { ApprovalPolicyDialog } from '../../shared/dialogs/approval-policy-dialog/approval-policy-dialog';

@Component({
  selector: 'app-approval-policies',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatTableModule,
    MatDividerModule,
    MatPaginatorModule,
  ],
  templateUrl: './approval-policies.html',
  styleUrl: './approval-policies.scss',
})
export class ApprovalPolicies {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  loading = signal(false);
  rows = signal<any[]>([]);
  labs = signal<any[]>([]);
  machines = signal<any[]>([]);
  targets = signal<any[]>([]);
  selected = signal<any | null>(null);
  cols: string[] = ['policy', 'scope', 'approval', 'status', 'updated', 'actions'];

  pageIndex = signal(0);
  pageSize = signal(10);
  readonly pageSizeOptions = [10, 25, 50];

  summary = computed(() => {
    const rows = this.rows();
    return {
      total: rows.length,
      enabled: rows.filter((row: any) => row.enabled === 1).length,
      requiresApproval: rows.filter((row: any) => row.requires_approval === 1).length,
      global: rows.filter((row: any) => !row.applies_to_lab_id && !row.applies_to_machine_id).length,
      withRouteTargets: rows.filter((row: any) => this.routeTargetIds(row).length > 0).length,
    };
  });

  pagedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows().slice(start, start + this.pageSize());
  });

  constructor() {
    this.refresh();
  }

  async refresh() {
    try {
      this.loading.set(true);
      const [rows, labs, machines, targets] = await Promise.all([
        this.api.approvalPoliciesList(),
        this.api.labsList(),
        this.api.machinesList(),
        this.api.targetsList(),
      ]);
      this.rows.set(rows ?? []);
      this.labs.set(labs ?? []);
      this.machines.set(machines ?? []);
      this.targets.set(targets ?? []);
      this.ensureValidPage();

      const current = this.selected();
      if (current) {
        const still = (rows ?? []).find((row: any) => row.id === current.id) ?? null;
        this.selected.set(still);
      }
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to load approval policies', 'Close', {
        duration: 3500,
      });
    } finally {
      this.loading.set(false);
    }
  }

  selectRow(row: any) {
    this.selected.set(row);
  }

  async openCreate() {
    const ref = this.dialog.open(ApprovalPolicyDialog, {
      width: 'min(860px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: {
        mode: 'create',
        labs: this.labs(),
        machines: this.machines(),
        targets: this.targets(),
      },
    });

    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;

    try {
      await this.api.approvalPoliciesCreate(result);
      this.snack.open('Approval policy created', 'Close', { duration: 1800 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to create approval policy', 'Close', {
        duration: 3500,
      });
    }
  }

  async openEdit(row: any) {
    const ref = this.dialog.open(ApprovalPolicyDialog, {
      width: 'min(860px, 96vw)',
      maxWidth: '96vw',
      autoFocus: false,
      restoreFocus: true,
      data: {
        mode: 'edit',
        row,
        labs: this.labs(),
        machines: this.machines(),
        targets: this.targets(),
      },
    });

    const result = await firstValueFrom(ref.afterClosed());
    if (!result) return;

    try {
      await this.api.approvalPoliciesUpdate(row.id, result);
      this.snack.open('Approval policy updated', 'Close', { duration: 1800 });
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to update approval policy', 'Close', {
        duration: 3500,
      });
    }
  }

  async remove(row: any) {
    if (!confirm(`Delete approval policy "${row.name}"?`)) return;

    try {
      await this.api.approvalPoliciesDelete(row.id);
      this.snack.open('Approval policy deleted', 'Close', { duration: 1800 });
      if (this.selected()?.id === row.id) {
        this.selected.set(null);
      }
      await this.refresh();
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to delete approval policy', 'Close', {
        duration: 3500,
      });
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  private ensureValidPage() {
    const total = this.rows().length;
    const maxPage = Math.max(0, Math.ceil(total / this.pageSize()) - 1);
    if (this.pageIndex() > maxPage) this.pageIndex.set(maxPage);
  }

  private findLab(id?: string | null) {
    return this.labs().find((lab: any) => lab.id === id) ?? null;
  }

  private findMachine(id?: string | null) {
    return this.machines().find((machine: any) => machine.id === id) ?? null;
  }

  private findTarget(id?: string | null) {
    return this.targets().find((target: any) => target.id === id) ?? null;
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

  scopeLabel(row: any) {
    const parts: string[] = [];
    const machine = this.findMachine(row?.applies_to_machine_id);
    const lab = row?.applies_to_machine_id
      ? machine?.lab_name || this.findLab(machine?.lab_id)?.name
      : this.findLab(row?.applies_to_lab_id)?.name;

    if (machine) {
      parts.push(`Machine: ${machine.name}`);
      if (lab) parts.push(`Lab: ${lab}`);
    } else if (row?.applies_to_machine_id) {
      parts.push(`Machine: ${row.applies_to_machine_id}`);
    }

    if (!row?.applies_to_machine_id && lab) {
      parts.push(`Lab: ${lab}`);
    } else if (!row?.applies_to_machine_id && row?.applies_to_lab_id) {
      parts.push(`Lab: ${row.applies_to_lab_id}`);
    }

    return parts.length ? parts.join(' • ') : 'Global';
  }

  scopeKind(row: any) {
    return row?.applies_to_lab_id || row?.applies_to_machine_id ? 'scoped' : 'global';
  }

  routeTargetIds(row: any): string[] {
    const ids = Array.isArray(row?.route_target_ids)
      ? row.route_target_ids
      : row?.applies_to_target_id
        ? [row.applies_to_target_id]
        : [];

    return Array.from(
      new Set(
        ids
          .map((value: unknown) => String(value ?? '').trim())
          .filter((value: string) => value.length > 0),
      ),
    );
  }

  routeTargets(row: any) {
    const ids = this.routeTargetIds(row);
    return ids.map((id) => this.findTarget(id) ?? { id, name: id }).filter(Boolean);
  }

  routeTargetSummary(row: any) {
    const targets = this.routeTargets(row);
    if (!targets.length) return 'No route targets configured';
    return targets.map((target: any) => target.name || target.id).join(', ');
  }

  statusClass(enabled?: number | null) {
    return enabled === 1 ? 'ok' : 'bad';
  }
}
