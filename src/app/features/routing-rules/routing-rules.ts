// // import { CommonModule } from '@angular/common';
// // import { Component, OnInit, computed, signal } from '@angular/core';
// // import { MatButtonModule } from '@angular/material/button';
// // import { MatCardModule } from '@angular/material/card';
// // import { MatChipsModule } from '@angular/material/chips';
// // import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// // import { MatIconModule } from '@angular/material/icon';
// // import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// // import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// // import { MatTableModule } from '@angular/material/table';
// // import { MatTooltipModule } from '@angular/material/tooltip';
// // import { PlatformApiService } from '../../core/platform/platform-api.service';
// // import {
// //     RoutingRuleDialog,
// //     RoutingRuleDialogData,
// //     RoutingRuleDialogResult,
// // } from '../../shared/dialogs/routing-rule-dialog/routing-rule-dialog';

// // export type RoutingRuleMatchType =
// //     | 'ANY'
// //     | 'MACHINE_ID'
// //     | 'MACHINE_NAME'
// //     | 'MESSAGE_TYPE'
// //     | 'ORDER_CODE'
// //     | 'TEST_CODE'
// //     | 'SAMPLE_PREFIX';

// // export interface RoutingRuleRow {
// //     id: string;
// //     name: string;
// //     description?: string | null;
// //     enabled: boolean;
// //     priority: number;
// //     match_type: RoutingRuleMatchType;
// //     match_value?: string | null;
// //     target_id: string;
// //     target_name?: string | null;
// //     target_type?: string | null;
// //     updated_at?: string | null;
// // }

// // @Component({
// //     selector: 'app-routing-rules',
// //     standalone: true,
// //     imports: [
// //         CommonModule,
// //         MatButtonModule,
// //         MatCardModule,
// //         MatChipsModule,
// //         MatDialogModule,
// //         MatIconModule,
// //         MatProgressSpinnerModule,
// //         MatSnackBarModule,
// //         MatTableModule,
// //         MatTooltipModule,
// //     ],
// //     templateUrl: './routing-rules.html',
// //     styleUrl: './routing-rules.scss',
// // })
// // export class RoutingRules implements OnInit {
// //     readonly displayedColumns = ['priority', 'name', 'match', 'target', 'enabled', 'updated', 'actions'];
// //     readonly rules = signal<RoutingRuleRow[]>([]);
// //     readonly targets = signal<any[]>([]);
// //     readonly loading = signal(false);

// //     readonly activeCount = computed(() => this.rules().filter((rule) => rule.enabled).length);
// //     readonly inactiveCount = computed(() => this.rules().filter((rule) => !rule.enabled).length);

// //     constructor(
// //         private readonly api: PlatformApiService,
// //         private readonly dialog: MatDialog,
// //         private readonly snack: MatSnackBar,
// //     ) {}

// //     ngOnInit(): void {
// //         this.load();
// //     }

// //     async load(): Promise<void> {
// //         this.loading.set(true);
// //         try {
// //             const [rules, targets] = await Promise.all([
// //                 this.api.routingRulesList(),
// //                 this.api.targetsList(),
// //             ]);
// //             this.rules.set((rules ?? []) as RoutingRuleRow[]);
// //             this.targets.set((targets ?? []).filter((target: any) => target?.enabled !== false));
// //         } catch (error: any) {
// //             this.snack.open(error?.message || 'Failed to load routing rules.', 'Dismiss', { duration: 5000 });
// //         } finally {
// //             this.loading.set(false);
// //         }
// //     }

// //     openCreateDialog(): void {
// //         this.openDialog({ targets: this.targets(), rule: null });
// //     }

// //     openEditDialog(rule: RoutingRuleRow): void {
// //         this.openDialog({ targets: this.targets(), rule });
// //     }

// //     private openDialog(data: RoutingRuleDialogData): void {
// //         const ref = this.dialog.open(RoutingRuleDialog, {
// //             width: '760px',
// //             maxWidth: '94vw',
// //             maxHeight: '90vh',
// //             autoFocus: false,
// //             restoreFocus: true,
// //             data,
// //             panelClass: 'machine-dialog-panel',
// //         });

// //         ref.afterClosed().subscribe(async (result?: RoutingRuleDialogResult) => {
// //             if (!result) return;
// //             await this.save(result);
// //         });
// //     }

// //     async save(result: RoutingRuleDialogResult): Promise<void> {
// //         try {
// //             if (result.id) {
// //                 await this.api.routingRulesUpdate(result.id, result.payload);
// //                 this.snack.open('Routing rule updated.', 'OK', { duration: 2200 });
// //             } else {
// //                 await this.api.routingRulesCreate(result.payload);
// //                 this.snack.open('Routing rule created.', 'OK', { duration: 2200 });
// //             }
// //             await this.load();
// //         } catch (error: any) {
// //             this.snack.open(error?.message || 'Failed to save routing rule.', 'Dismiss', { duration: 5200 });
// //         }
// //     }

// //     async toggle(rule: RoutingRuleRow): Promise<void> {
// //         try {
// //             await this.api.routingRulesUpdate(rule.id, { enabled: !rule.enabled });
// //             this.snack.open(rule.enabled ? 'Routing rule disabled.' : 'Routing rule enabled.', 'OK', {
// //                 duration: 2000,
// //             });
// //             await this.load();
// //         } catch (error: any) {
// //             this.snack.open(error?.message || 'Failed to update routing rule.', 'Dismiss', { duration: 5200 });
// //         }
// //     }

// //     async delete(rule: RoutingRuleRow): Promise<void> {
// //         const ok = window.confirm(`Delete routing rule "${rule.name}"?`);
// //         if (!ok) return;
// //         try {
// //             await this.api.routingRulesDelete(rule.id);
// //             this.snack.open('Routing rule deleted.', 'OK', { duration: 2200 });
// //             await this.load();
// //         } catch (error: any) {
// //             this.snack.open(error?.message || 'Failed to delete routing rule.', 'Dismiss', { duration: 5200 });
// //         }
// //     }

// //     matchLabel(rule: RoutingRuleRow): string {
// //         if (rule.match_type === 'ANY') return 'Any approved result';
// //         const label = this.matchTypeLabel(rule.match_type);
// //         return rule.match_value ? `${label}: ${rule.match_value}` : label;
// //     }

// //     matchTypeLabel(type: RoutingRuleMatchType): string {
// //         const labels: Record<RoutingRuleMatchType, string> = {
// //             ANY: 'Any result',
// //             MACHINE_ID: 'Machine ID',
// //             MACHINE_NAME: 'Machine name',
// //             MESSAGE_TYPE: 'Message type',
// //             ORDER_CODE: 'Order code',
// //             TEST_CODE: 'Test code',
// //             SAMPLE_PREFIX: 'Sample prefix',
// //         };
// //         return labels[type] ?? String(type);
// //     }
// // }


// import { CommonModule } from '@angular/common';
// import { Component, OnInit, computed, signal } from '@angular/core';
// import { FormsModule } from '@angular/forms';
// import { MatButtonModule } from '@angular/material/button';
// import { MatCardModule } from '@angular/material/card';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatSelectModule } from '@angular/material/select';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatTableModule } from '@angular/material/table';
// import { MatTooltipModule } from '@angular/material/tooltip';
// import { PlatformApiService } from '../../core/platform/platform-api.service';
// import {
//     RoutingRuleDialog,
//     RoutingRuleDialogData,
//     RoutingRuleDialogResult,
// } from '../../shared/dialogs/routing-rule-dialog/routing-rule-dialog';

// export type RoutingRuleMatchType =
//     | 'ANY'
//     | 'MACHINE_ID'
//     | 'MACHINE_NAME'
//     | 'MESSAGE_TYPE'
//     | 'ORDER_CODE'
//     | 'TEST_CODE'
//     | 'SAMPLE_PREFIX';

// export interface RoutingRuleRow {
//     id: string;
//     name: string;
//     description?: string | null;
//     enabled: boolean | number;
//     priority: number;
//     match_type?: RoutingRuleMatchType | string | null;
//     match_value?: string | null;
//     target_id: string;
//     target_name?: string | null;
//     target_type?: string | null;
//     target_enabled?: boolean | number | null;
//     lab_id?: string | null;
//     lab_name?: string | null;
//     machine_id?: string | null;
//     machine_name?: string | null;
//     protocol?: string | null;
//     test_code?: string | null;
//     order_id?: string | null;
//     sample_id_pattern?: string | null;
//     source_message_type?: string | null;
//     stop_on_match: number;
//     created_at?: string | null;
//     updated_at?: string | null;
//     created_by_username?: string | null;
//     updated_by_username?: string | null;
// }

// type TargetLookup = {
//     id: string;
//     name?: string | null;
//     type?: string | null;
//     base_url?: string | null;
//     enabled?: boolean | number | null;
// };

// type LabLookup = {
//     id: string;
//     name?: string | null;
//     code?: string | null;
// };

// type MachineLookup = {
//     id: string;
//     name?: string | null;
//     code?: string | null;
//     lab_id?: string | null;
//     protocol?: string | null;
// };

// @Component({
//     selector: 'app-routing-rules',
//     standalone: true,
//     imports: [
//         CommonModule,
//         FormsModule,
//         MatButtonModule,
//         MatCardModule,
//         MatChipsModule,
//         MatDialogModule,
//         MatDividerModule,
//         MatFormFieldModule,
//         MatIconModule,
//         MatInputModule,
//         MatProgressBarModule,
//         MatSelectModule,
//         MatSnackBarModule,
//         MatTableModule,
//         MatTooltipModule,
//     ],
//     templateUrl: './routing-rules.html',
//     styleUrl: './routing-rules.scss',
// })
// export class RoutingRules implements OnInit {
//     readonly displayedColumns = ['rule', 'scope', 'target', 'priority', 'status', 'updated', 'actions'];
//     readonly detailColumns = ['expandedDetail'];

//     readonly rules = signal<RoutingRuleRow[]>([]);
//     readonly targets = signal<TargetLookup[]>([]);
//     readonly labs = signal<LabLookup[]>([]);
//     readonly machines = signal<MachineLookup[]>([]);
//     readonly loading = signal(false);
//     readonly filtersOpen = signal(false);
//     readonly expandedId = signal<string | null>(null);

//     readonly search = signal('');
//     readonly statusFilter = signal<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');
//     readonly targetFilter = signal<string>('ALL');
//     readonly labFilter = signal<string>('ALL');

//     readonly filteredRules = computed(() => {
//         const q = this.search().trim().toLowerCase();
//         const status = this.statusFilter();
//         const targetId = this.targetFilter();
//         const labId = this.labFilter();

//         return this.rules().filter((rule) => {
//             if (status === 'ENABLED' && !this.isEnabled(rule)) return false;
//             if (status === 'DISABLED' && this.isEnabled(rule)) return false;
//             if (targetId !== 'ALL' && rule.target_id !== targetId) return false;
//             if (labId !== 'ALL' && rule.lab_id !== labId) return false;
//             if (!q) return true;

//             return [
//                 rule.name,
//                 rule.description,
//                 rule.target_name,
//                 rule.target_id,
//                 rule.target_type,
//                 rule.lab_name,
//                 rule.machine_name,
//                 rule.protocol,
//                 rule.test_code,
//                 rule.order_id,
//                 rule.sample_id_pattern,
//                 rule.source_message_type,
//                 rule.match_type,
//                 rule.match_value,
//             ]
//                 .filter(Boolean)
//                 .join(' ')
//                 .toLowerCase()
//                 .includes(q);
//         });
//     });

//     readonly summary = computed(() => {
//         const rows = this.rules();
//         const enabled = rows.filter((rule) => this.isEnabled(rule)).length;
//         const disabled = rows.length - enabled;
//         const stopRules = rows.filter((rule) => Number(rule.stop_on_match ?? 0) === 1).length;
//         const fallbackRules = rows.filter((rule) => this.isFallbackRule(rule)).length;

//         return {
//             total: rows.length,
//             enabled,
//             disabled,
//             stopRules,
//             fallbackRules,
//         };
//     });

//     constructor(
//         private readonly api: PlatformApiService,
//         private readonly dialog: MatDialog,
//         private readonly snack: MatSnackBar,
//     ) {}

//     ngOnInit(): void {
//         void this.load();
//     }

//     async load(): Promise<void> {
//         this.loading.set(true);
//         try {
//             const [rules, targets, labs, machines] = await Promise.all([
//                 this.api.routingRulesList(),
//                 this.api.targetsList(),
//                 this.api.labsList().catch(() => []),
//                 this.api.machinesList().catch(() => []),
//             ]);

//             this.rules.set((rules ?? []) as RoutingRuleRow[]);
//             this.targets.set(((targets ?? []) as TargetLookup[]).filter((target) => Number(target?.enabled ?? 1) === 1));
//             this.labs.set((labs ?? []) as LabLookup[]);
//             this.machines.set((machines ?? []) as MachineLookup[]);
//         } catch (error: any) {
//             this.notify(error?.message || 'Failed to load routing rules.');
//         } finally {
//             this.loading.set(false);
//         }
//     }

//     toggleFilters(): void {
//         this.filtersOpen.update((value) => !value);
//     }

//     clearFilters(): void {
//         this.search.set('');
//         this.statusFilter.set('ALL');
//         this.targetFilter.set('ALL');
//         this.labFilter.set('ALL');
//     }

//     openCreateDialog(): void {
//         this.openDialog({
//             targets: this.targets(),
//             labs: this.labs(),
//             machines: this.machines(),
//             rule: null,
//         });
//     }

//     openEditDialog(rule: RoutingRuleRow): void {
//         this.openDialog({
//             targets: this.targets(),
//             labs: this.labs(),
//             machines: this.machines(),
//             rule,
//         });
//     }

//     private openDialog(data: RoutingRuleDialogData): void {
//         const ref = this.dialog.open(RoutingRuleDialog, {
//             width: '980px',
//             maxWidth: '80vw',
//             maxHeight: '92vh',
//             autoFocus: false,
//             restoreFocus: true,
//             data,
//             panelClass: 'machine-dialog-panel',
//         });

//         ref.afterClosed().subscribe(async (result?: RoutingRuleDialogResult) => {
//             if (!result) return;
//             await this.save(result);
//         });
//     }

//     async save(result: RoutingRuleDialogResult): Promise<void> {
//         try {
//             if (result.id) {
//                 await this.api.routingRulesUpdate(result.id, result.payload);
//                 this.notify('Routing rule updated.');
//             } else {
//                 await this.api.routingRulesCreate(result.payload);
//                 this.notify('Routing rule created.');
//             }
//             await this.load();
//         } catch (error: any) {
//             this.notify(error?.message || 'Failed to save routing rule.');
//         }
//     }

//     async toggle(rule: RoutingRuleRow): Promise<void> {
//         try {
//             await this.api.routingRulesUpdate(rule.id, { enabled: this.isEnabled(rule) ? 0 : 1 });
//             this.notify(this.isEnabled(rule) ? 'Routing rule disabled.' : 'Routing rule enabled.');
//             await this.load();
//         } catch (error: any) {
//             this.notify(error?.message || 'Failed to update routing rule.');
//         }
//     }

//     async delete(rule: RoutingRuleRow): Promise<void> {
//         const ok = window.confirm(`Delete routing rule "${rule.name}"?`);
//         if (!ok) return;

//         try {
//             await this.api.routingRulesDelete(rule.id);
//             this.notify('Routing rule deleted.');
//             if (this.expandedId() === rule.id) this.expandedId.set(null);
//             await this.load();
//         } catch (error: any) {
//             this.notify(error?.message || 'Failed to delete routing rule.');
//         }
//     }

//     toggleRow(rule: RoutingRuleRow): void {
//         this.expandedId.update((current) => (current === rule.id ? null : rule.id));
//     }

//     isExpanded(rule: RoutingRuleRow): boolean {
//         return this.expandedId() === rule.id;
//     }

//     rowTrackBy = (_index: number, row: RoutingRuleRow) => row.id;

//     isEnabled(rule: RoutingRuleRow): boolean {
//         return Number(rule.enabled ?? 0) === 1 || rule.enabled === true;
//     }

//     statusClass(rule: RoutingRuleRow): string {
//         return this.isEnabled(rule) ? 'ok' : 'bad';
//     }

//     routeTargetLabel(rule: RoutingRuleRow): string {
//         return rule.target_name || this.targets().find((target) => target.id === rule.target_id)?.name || rule.target_id || 'No target selected';
//     }

//     routeTargetType(rule: RoutingRuleRow): string {
//         return rule.target_type || this.targets().find((target) => target.id === rule.target_id)?.type || 'Target';
//     }

//     routeScopeLabel(rule: RoutingRuleRow): string {
//         const parts = [
//             rule.lab_name ? `Lab: ${rule.lab_name}` : null,
//             rule.machine_name ? `Machine: ${rule.machine_name}` : null,
//             rule.protocol ? `Protocol: ${rule.protocol}` : null,
//             rule.source_message_type ? `Message: ${rule.source_message_type}` : null,
//             rule.test_code ? `Test: ${rule.test_code}` : null,
//             rule.order_id ? `Order: ${rule.order_id}` : null,
//             rule.sample_id_pattern ? `Sample: ${rule.sample_id_pattern}` : null,
//             this.matchLabel(rule),
//         ].filter(Boolean);

//         const meaningfulParts = parts.filter((part) => part !== 'Any approved result');
//         return meaningfulParts.length ? meaningfulParts.join(' · ') : 'Applies to any approved result.';
//     }

//     matchLabel(rule: RoutingRuleRow): string {
//         const type = String(rule.match_type ?? 'ANY') as RoutingRuleMatchType;
//         if (!type || type === 'ANY') return 'Any approved result';
//         const label = this.matchTypeLabel(type);
//         return rule.match_value ? `${label}: ${rule.match_value}` : label;
//     }

//     matchTypeLabel(type: RoutingRuleMatchType | string): string {
//         const labels: Record<string, string> = {
//             ANY: 'Any result',
//             MACHINE_ID: 'Machine ID',
//             MACHINE_NAME: 'Machine name',
//             MESSAGE_TYPE: 'Message type',
//             ORDER_CODE: 'Order code',
//             TEST_CODE: 'Test code',
//             SAMPLE_PREFIX: 'Sample prefix',
//         };
//         return labels[type] ?? String(type);
//     }

//     formatDateTime(value?: string | null): string {
//         if (!value) return '—';
//         const date = new Date(value);
//         if (Number.isNaN(date.getTime())) return value;
//         return date.toLocaleString();
//     }

//     private isFallbackRule(rule: RoutingRuleRow): boolean {
//         return !rule.lab_id && !rule.machine_id && !rule.protocol && !rule.test_code && !rule.order_id && !rule.sample_id_pattern && !rule.source_message_type && (!rule.match_type || rule.match_type === 'ANY');
//     }

//     private notify(message: string): void {
//         this.snack.open(message, 'Close', { duration: 3200 });
//     }
// }


import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
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
import {
    RoutingRuleDialog,
    RoutingRuleDialogData,
    RoutingRuleDialogResult,
} from '../../shared/dialogs/routing-rule-dialog/routing-rule-dialog';

export type RoutingRuleMatchType =
    | 'ANY'
    | 'MACHINE_ID'
    | 'MACHINE_NAME'
    | 'MESSAGE_TYPE'
    | 'ORDER_CODE'
    | 'TEST_CODE'
    | 'SAMPLE_PREFIX';

export interface RoutingRuleRow {
    id: string;
    name: string;
    description?: string | null;
    enabled: boolean | number;
    priority: number;
    match_type?: RoutingRuleMatchType | string | null;
    match_value?: string | null;
    target_id: string;
    target_name?: string | null;
    target_type?: string | null;
    target_enabled?: boolean | number | null;
    lab_id?: string | null;
    lab_name?: string | null;
    machine_id?: string | null;
    machine_name?: string | null;
    protocol?: string | null;
    test_code?: string | null;
    order_id?: string | null;
    sample_id_pattern?: string | null;
    source_message_type?: string | null;
    stop_on_match: number;
    created_at?: string | null;
    updated_at?: string | null;
    created_by_username?: string | null;
    updated_by_username?: string | null;
}

type TargetLookup = {
    id: string;
    name?: string | null;
    type?: string | null;
    base_url?: string | null;
    enabled?: boolean | number | null;
};

type LabLookup = {
    id: string;
    name?: string | null;
    code?: string | null;
};

type MachineLookup = {
    id: string;
    name?: string | null;
    code?: string | null;
    lab_id?: string | null;
    protocol?: string | null;
};

@Component({
    selector: 'app-routing-rules',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
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
    templateUrl: './routing-rules.html',
    styleUrl: './routing-rules.scss',
})
export class RoutingRules implements OnInit {
    readonly displayedColumns = ['rule', 'scope', 'target', 'priority', 'status', 'updated', 'actions'];
    readonly detailColumns = ['expandedDetail'];

    readonly rules = signal<RoutingRuleRow[]>([]);
    readonly targets = signal<TargetLookup[]>([]);
    readonly labs = signal<LabLookup[]>([]);
    readonly machines = signal<MachineLookup[]>([]);
    readonly loading = signal(false);
    readonly filtersOpen = signal(false);
    readonly expandedId = signal<string | null>(null);

    readonly search = signal('');
    readonly statusFilter = signal<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');
    readonly targetFilter = signal<string>('ALL');
    readonly labFilter = signal<string>('ALL');

    readonly filteredRules = computed(() => {
        const q = this.search().trim().toLowerCase();
        const status = this.statusFilter();
        const targetId = this.targetFilter();
        const labId = this.labFilter();

        return this.rules().filter((rule) => {
            if (status === 'ENABLED' && !this.isEnabled(rule)) return false;
            if (status === 'DISABLED' && this.isEnabled(rule)) return false;
            if (targetId !== 'ALL' && rule.target_id !== targetId) return false;
            if (labId !== 'ALL' && rule.lab_id !== labId) return false;
            if (!q) return true;

            return [
                rule.name,
                rule.description,
                rule.target_name,
                rule.target_id,
                rule.target_type,
                rule.lab_name,
                rule.machine_name,
                rule.protocol,
                rule.test_code,
                rule.order_id,
                rule.sample_id_pattern,
                rule.source_message_type,
                rule.match_type,
                rule.match_value,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(q);
        });
    });

    readonly summary = computed(() => {
        const rows = this.rules();
        const enabled = rows.filter((rule) => this.isEnabled(rule)).length;
        const disabled = rows.length - enabled;
        const stopRules = rows.filter((rule) => Number(rule.stop_on_match ?? 0) === 1).length;
        const fallbackRules = rows.filter((rule) => this.isFallbackRule(rule)).length;

        return {
            total: rows.length,
            enabled,
            disabled,
            stopRules,
            fallbackRules,
        };
    });

    constructor(
        private readonly api: PlatformApiService,
        private readonly dialog: MatDialog,
        private readonly snack: MatSnackBar,
    ) {}

    ngOnInit(): void {
        void this.load();
    }

    async load(): Promise<void> {
        this.loading.set(true);
        try {
            const [rules, targets, labs, machines] = await Promise.all([
                this.api.routingRulesList(),
                this.api.targetsList(),
                this.api.labsList().catch(() => []),
                this.api.machinesList().catch(() => []),
            ]);

            this.rules.set((rules ?? []) as RoutingRuleRow[]);
            this.targets.set(((targets ?? []) as TargetLookup[]).filter((target) => Number(target?.enabled ?? 1) === 1));
            this.labs.set((labs ?? []) as LabLookup[]);
            this.machines.set((machines ?? []) as MachineLookup[]);
        } catch (error: any) {
            this.notify(error?.message || 'Failed to load routing rules.');
        } finally {
            this.loading.set(false);
        }
    }

    toggleFilters(): void {
        this.filtersOpen.update((value) => !value);
    }

    clearFilters(): void {
        this.search.set('');
        this.statusFilter.set('ALL');
        this.targetFilter.set('ALL');
        this.labFilter.set('ALL');
    }

    openCreateDialog(): void {
        this.openDialog({
            targets: this.targets(),
            labs: this.labs(),
            machines: this.machines(),
            rule: null,
        });
    }

    openEditDialog(rule: RoutingRuleRow): void {
        this.openDialog({
            targets: this.targets(),
            labs: this.labs(),
            machines: this.machines(),
            rule,
        });
    }

    private openDialog(data: RoutingRuleDialogData): void {
        const ref = this.dialog.open(RoutingRuleDialog, {
            width: '980px',
            maxWidth: '80vw',
            maxHeight: '92vh',
            autoFocus: false,
            restoreFocus: true,
            data,
            panelClass: 'machine-dialog-panel',
        });

        ref.afterClosed().subscribe(async (result?: RoutingRuleDialogResult) => {
            if (!result) return;
            await this.save(result);
        });
    }

    async save(result: RoutingRuleDialogResult): Promise<void> {
        try {
            if (result.id) {
                await this.api.routingRulesUpdate(result.id, result.payload);
                this.notify('Routing rule updated.');
            } else {
                await this.api.routingRulesCreate(result.payload);
                this.notify('Routing rule created.');
            }
            await this.load();
        } catch (error: any) {
            this.notify(error?.message || 'Failed to save routing rule.');
        }
    }

    async toggle(rule: RoutingRuleRow): Promise<void> {
        try {
            await this.api.routingRulesUpdate(rule.id, { enabled: this.isEnabled(rule) ? 0 : 1 });
            this.notify(this.isEnabled(rule) ? 'Routing rule disabled.' : 'Routing rule enabled.');
            await this.load();
        } catch (error: any) {
            this.notify(error?.message || 'Failed to update routing rule.');
        }
    }

    async delete(rule: RoutingRuleRow): Promise<void> {
        const ok = window.confirm(`Delete routing rule "${rule.name}"?`);
        if (!ok) return;

        try {
            await this.api.routingRulesDelete(rule.id);
            this.notify('Routing rule deleted.');
            if (this.expandedId() === rule.id) this.expandedId.set(null);
            await this.load();
        } catch (error: any) {
            this.notify(error?.message || 'Failed to delete routing rule.');
        }
    }

    toggleRow(rule: RoutingRuleRow): void {
        this.expandedId.update((current) => (current === rule.id ? null : rule.id));
    }

    isExpanded(rule: RoutingRuleRow): boolean {
        return this.expandedId() === rule.id;
    }

    rowTrackBy = (_index: number, row: RoutingRuleRow) => row.id;

    isEnabled(rule: RoutingRuleRow): boolean {
        return Number(rule.enabled ?? 0) === 1 || rule.enabled === true;
    }

    statusClass(rule: RoutingRuleRow): string {
        return this.isEnabled(rule) ? 'ok' : 'bad';
    }

    routeTargetLabel(rule: RoutingRuleRow): string {
        return rule.target_name || this.targets().find((target) => target.id === rule.target_id)?.name || rule.target_id || 'No target selected';
    }

    routeTargetType(rule: RoutingRuleRow): string {
        return rule.target_type || this.targets().find((target) => target.id === rule.target_id)?.type || 'Target';
    }

    routeScopeLabel(rule: RoutingRuleRow): string {
        const parts = [
            rule.lab_name ? `Lab: ${rule.lab_name}` : null,
            rule.machine_name ? `Machine: ${rule.machine_name}` : null,
            rule.protocol ? `Protocol: ${rule.protocol}` : null,
            rule.source_message_type ? `Message: ${rule.source_message_type}` : null,
            rule.test_code ? `Test: ${rule.test_code}` : null,
            rule.order_id ? `Order: ${rule.order_id}` : null,
            rule.sample_id_pattern ? `Sample: ${rule.sample_id_pattern}` : null,
            this.matchLabel(rule),
        ].filter(Boolean);

        const meaningfulParts = parts.filter((part) => part !== 'Any approved result');
        return meaningfulParts.length ? meaningfulParts.join(' · ') : 'Applies to any approved result.';
    }

    matchLabel(rule: RoutingRuleRow): string {
        const type = String(rule.match_type ?? 'ANY') as RoutingRuleMatchType;
        if (!type || type === 'ANY') return 'Any approved result';
        const label = this.matchTypeLabel(type);
        return rule.match_value ? `${label}: ${rule.match_value}` : label;
    }

    matchTypeLabel(type: RoutingRuleMatchType | string): string {
        const labels: Record<string, string> = {
            ANY: 'Any result',
            MACHINE_ID: 'Machine ID',
            MACHINE_NAME: 'Machine name',
            MESSAGE_TYPE: 'Message type',
            ORDER_CODE: 'Order code',
            TEST_CODE: 'Test code',
            SAMPLE_PREFIX: 'Sample prefix',
        };
        return labels[type] ?? String(type);
    }

    formatDateTime(value?: string | null): string {
        if (!value) return '—';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString();
    }

    private isFallbackRule(rule: RoutingRuleRow): boolean {
        return !rule.lab_id && !rule.machine_id && !rule.protocol && !rule.test_code && !rule.order_id && !rule.sample_id_pattern && !rule.source_message_type && (!rule.match_type || rule.match_type === 'ANY');
    }

    private notify(message: string): void {
        this.snack.open(message, 'Close', { duration: 3200 });
    }
}

