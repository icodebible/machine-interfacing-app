// // import { CommonModule } from '@angular/common';
// // import { Component, Inject, computed, signal } from '@angular/core';
// // import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// // import { MatButtonModule } from '@angular/material/button';
// // import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// // import { MatFormFieldModule } from '@angular/material/form-field';
// // import { MatIconModule } from '@angular/material/icon';
// // import { MatInputModule } from '@angular/material/input';
// // import { MatSelectModule } from '@angular/material/select';
// // import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// // import type { RoutingRuleMatchType, RoutingRuleRow } from '../../../features/routing-rules/routing-rules';

// // export interface RoutingRuleDialogData {
// //     rule: RoutingRuleRow | null;
// //     targets: any[];
// // }

// // export interface RoutingRuleDialogResult {
// //     id?: string;
// //     payload: {
// //         name: string;
// //         description?: string | null;
// //         enabled: boolean;
// //         priority: number;
// //         match_type: RoutingRuleMatchType;
// //         match_value?: string | null;
// //         target_id: string;
// //     };
// // }

// // @Component({
// //     selector: 'app-routing-rule-dialog',
// //     standalone: true,
// //     imports: [
// //         CommonModule,
// //         ReactiveFormsModule,
// //         MatButtonModule,
// //         MatDialogModule,
// //         MatFormFieldModule,
// //         MatIconModule,
// //         MatInputModule,
// //         MatSelectModule,
// //         MatSlideToggleModule,
// //     ],
// //     templateUrl: './routing-rule-dialog.html',
// //     styleUrl: './routing-rule-dialog.scss',
// // })
// // export class RoutingRuleDialog {
// //     readonly targetSearch = signal('');
// //     readonly matchTypes: Array<{ value: RoutingRuleMatchType; label: string; hint: string; requiresValue: boolean }> = [
// //         { value: 'ANY', label: 'Any approved result', hint: 'Fallback rule for all results.', requiresValue: false },
// //         { value: 'MACHINE_ID', label: 'Machine ID', hint: 'Match the configured machine identifier.', requiresValue: true },
// //         { value: 'MACHINE_NAME', label: 'Machine name', hint: 'Match a machine display/name value.', requiresValue: true },
// //         { value: 'MESSAGE_TYPE', label: 'Message type', hint: 'For example HL7_ORU or ASTM_RESULT.', requiresValue: true },
// //         { value: 'ORDER_CODE', label: 'Order code', hint: 'Match LIS order/test order code such as ORD-124985.', requiresValue: true },
// //         { value: 'TEST_CODE', label: 'Test/parameter code', hint: 'Match analyzer or mapped test code such as HPV16.', requiresValue: true },
// //         { value: 'SAMPLE_PREFIX', label: 'Sample prefix', hint: 'Match sample/barcode prefix such as NPHL/.', requiresValue: true },
// //     ];

// //     readonly filteredTargets = computed(() => {
// //         const q = this.targetSearch().trim().toLowerCase();
// //         const targets = this.data.targets ?? [];
// //         if (!q) return targets;
// //         return targets.filter((target: any) =>
// //             [target?.name, target?.type, target?.base_url, target?.id]
// //                 .filter(Boolean)
// //                 .join(' ')
// //                 .toLowerCase()
// //                 .includes(q),
// //         );
// //     });

// //     readonly form: FormGroup;

// //     constructor(
// //         private readonly fb: FormBuilder,
// //         private readonly ref: MatDialogRef<RoutingRuleDialog, RoutingRuleDialogResult | undefined>,
// //         @Inject(MAT_DIALOG_DATA) public readonly data: RoutingRuleDialogData,
// //     ) {
// //         this.form = this.fb.group({
// //             name: [this.data.rule?.name ?? '', [Validators.required, Validators.maxLength(120)]],
// //             description: [this.data.rule?.description ?? ''],
// //             enabled: [this.data.rule?.enabled ?? true],
// //             priority: [this.data.rule?.priority ?? 100, [Validators.required, Validators.min(1)]],
// //             match_type: [this.data.rule?.match_type ?? 'ANY', [Validators.required]],
// //             match_value: [this.data.rule?.match_value ?? ''],
// //             target_id: [this.data.rule?.target_id ?? '', [Validators.required]],
// //         });
// //     }

// //     get selectedMatchType() {
// //         return this.matchTypes.find((type) => type.value === this.form.value.match_type) ?? this.matchTypes[0];
// //     }

// //     targetLabel(target: any): string {
// //         const type = target?.type ? ` · ${target.type}` : '';
// //         return `${target?.name || target?.id}${type}`;
// //     }

// //     close(): void {
// //         this.ref.close(undefined);
// //     }

// //     submit(): void {
// //         this.form.markAllAsTouched();
// //         if (this.form.invalid) return;

// //         const value = this.form.getRawValue();
// //         const payload = {
// //             name: String(value.name ?? '').trim(),
// //             description: value.description ? String(value.description).trim() : null,
// //             enabled: !!value.enabled,
// //             priority: Number(value.priority || 100),
// //             match_type: value.match_type as RoutingRuleMatchType,
// //             match_value: value.match_type === 'ANY' ? null : String(value.match_value ?? '').trim(),
// //             target_id: String(value.target_id ?? '').trim(),
// //         };

// //         this.ref.close({ id: this.data.rule?.id, payload });
// //     }
// // }


// import { CommonModule } from '@angular/common';
// import { Component, Inject, computed, signal } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { MatButtonModule } from '@angular/material/button';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatIconModule } from '@angular/material/icon';
// import { MatInputModule } from '@angular/material/input';
// import { MatSelectModule } from '@angular/material/select';
// import { MatSlideToggleModule } from '@angular/material/slide-toggle';
// import type { RoutingRuleMatchType, RoutingRuleRow } from '../../../features/routing-rules/routing-rules';

// export interface RoutingRuleDialogData {
//     rule: RoutingRuleRow | null;
//     targets: any[];
//     labs?: any[];
//     machines?: any[];
// }

// export interface RoutingRuleDialogResult {
//     id?: string;
//     payload: {
//         name: string;
//         description?: string | null;
//         enabled: number;
//         priority: number;
//         match_type: RoutingRuleMatchType | string;
//         match_value?: string | null;
//         target_id: string;
//         lab_id?: string | null;
//         machine_id?: string | null;
//         protocol?: string | null;
//         test_code?: string | null;
//         order_id?: string | null;
//         sample_id_pattern?: string | null;
//         source_message_type?: string | null;
//         stop_on_match: number;
//     };
// }

// @Component({
//     selector: 'app-routing-rule-dialog',
//     standalone: true,
//     imports: [
//         CommonModule,
//         ReactiveFormsModule,
//         MatButtonModule,
//         MatDialogModule,
//         MatFormFieldModule,
//         MatIconModule,
//         MatInputModule,
//         MatSelectModule,
//         MatSlideToggleModule,
//     ],
//     templateUrl: './routing-rule-dialog.html',
//     styleUrl: './routing-rule-dialog.scss',
// })
// export class RoutingRuleDialog {
//     readonly targetSearch = signal('');
//     readonly machineSearch = signal('');

//     readonly matchTypes: Array<{ value: RoutingRuleMatchType; label: string; hint: string; requiresValue: boolean }> = [
//         { value: 'ANY', label: 'Any approved result', hint: 'Use explicit fields below, or leave all condition fields empty for fallback routing.', requiresValue: false },
//         { value: 'MACHINE_ID', label: 'Machine ID', hint: 'Match the machine identifier stored on the normalized result.', requiresValue: true },
//         { value: 'MACHINE_NAME', label: 'Machine name', hint: 'Match a machine name or code.', requiresValue: true },
//         { value: 'MESSAGE_TYPE', label: 'Message type', hint: 'For example HL7_ORU or ASTM_RESULT.', requiresValue: true },
//         { value: 'ORDER_CODE', label: 'Order code', hint: 'Match LIS order/test order code such as ORD-124985.', requiresValue: true },
//         { value: 'TEST_CODE', label: 'Test/parameter code', hint: 'Match analyzer or mapped test code such as HPV16.', requiresValue: true },
//         { value: 'SAMPLE_PREFIX', label: 'Sample prefix', hint: 'Match sample/barcode prefix such as NPHL/.', requiresValue: true },
//     ];

//     readonly filteredTargets = computed(() => {
//         const q = this.targetSearch().trim().toLowerCase();
//         const targets = this.data.targets ?? [];
//         if (!q) return targets;
//         return targets.filter((target: any) =>
//             [target?.name, target?.type, target?.base_url, target?.id]
//                 .filter(Boolean)
//                 .join(' ')
//                 .toLowerCase()
//                 .includes(q),
//         );
//     });

//     readonly form: FormGroup;

//     constructor(
//         private readonly fb: FormBuilder,
//         private readonly ref: MatDialogRef<RoutingRuleDialog, RoutingRuleDialogResult | undefined>,
//         @Inject(MAT_DIALOG_DATA) public readonly data: RoutingRuleDialogData,
//     ) {
//         this.form = this.fb.group({
//             name: [this.data.rule?.name ?? '', [Validators.required, Validators.maxLength(120)]],
//             description: [this.data.rule?.description ?? ''],
//             enabled: [this.toBoolean(this.data.rule?.enabled ?? true)],
//             priority: [this.data.rule?.priority ?? 100, [Validators.required, Validators.min(1)]],
//             target_id: [this.data.rule?.target_id ?? '', [Validators.required]],
//             lab_id: [this.data.rule?.lab_id ?? ''],
//             machine_id: [this.data.rule?.machine_id ?? ''],
//             protocol: [this.data.rule?.protocol ?? ''],
//             source_message_type: [this.data.rule?.source_message_type ?? ''],
//             test_code: [this.data.rule?.test_code ?? ''],
//             order_id: [this.data.rule?.order_id ?? ''],
//             sample_id_pattern: [this.data.rule?.sample_id_pattern ?? ''],
//             match_type: [this.data.rule?.match_type ?? 'ANY', [Validators.required]],
//             match_value: [this.data.rule?.match_value ?? ''],
//             stop_on_match: [this.toBoolean(this.data.rule?.stop_on_match ?? false)],
//         });
//     }

//     get selectedMatchType() {
//         return this.matchTypes.find((type) => type.value === this.form.value.match_type) ?? this.matchTypes[0];
//     }

//     labsList(): any[] {
//         return this.data.labs ?? [];
//     }

//     filteredMachines(): any[] {
//         const labId = this.clean(this.form.get('lab_id')?.value);
//         const q = this.machineSearch().trim().toLowerCase();
//         return (this.data.machines ?? []).filter((machine: any) => {
//             if (labId && machine?.lab_id !== labId) return false;
//             if (!q) return true;
//             return [machine?.name, machine?.code, machine?.protocol, machine?.id]
//                 .filter(Boolean)
//                 .join(' ')
//                 .toLowerCase()
//                 .includes(q);
//         });
//     }

//     targetLabel(target: any): string {
//         const type = target?.type ? ` · ${target.type}` : '';
//         return `${target?.name || target?.id}${type}`;
//     }

//     labLabel(lab: any): string {
//         const code = lab?.code ? ` · ${lab.code}` : '';
//         return `${lab?.name || lab?.id}${code}`;
//     }

//     machineLabel(machine: any): string {
//         const code = machine?.code ? ` · ${machine.code}` : '';
//         return `${machine?.name || machine?.id}${code}`;
//     }

//     close(): void {
//         this.ref.close(undefined);
//     }

//     submit(): void {
//         this.form.markAllAsTouched();
//         if (this.form.invalid) return;

//         const value = this.form.getRawValue();
//         const matchType = String(value.match_type ?? 'ANY') as RoutingRuleMatchType;
//         const selectedMatchType = this.matchTypes.find((type) => type.value === matchType);
//         const matchValue = this.clean(value.match_value);

//         if (selectedMatchType?.requiresValue && !matchValue) {
//             this.form.get('match_value')?.setErrors({ required: true });
//             return;
//         }

//         const targetId = this.clean(value.target_id);
//         if (!targetId) {
//             this.form.get('target_id')?.setErrors({ required: true });
//             return;
//         }

//         const payload = {
//             name: this.clean(value.name) || 'Untitled routing rule',
//             description: this.clean(value.description),
//             enabled: value.enabled ? 1 : 0,
//             priority: Math.max(1, Number(value.priority || 100)),
//             target_id: targetId,
//             lab_id: this.clean(value.lab_id),
//             machine_id: this.clean(value.machine_id),
//             protocol: this.clean(value.protocol),
//             source_message_type: this.clean(value.source_message_type),
//             test_code: this.clean(value.test_code),
//             order_id: this.clean(value.order_id),
//             sample_id_pattern: this.clean(value.sample_id_pattern),
//             match_type: matchType,
//             match_value: matchType === 'ANY' ? null : matchValue,
//             stop_on_match: value.stop_on_match ? 1 : 0,
//         };

//         this.ref.close({ id: this.data.rule?.id, payload });
//     }

//     private clean(value: unknown): string | null {
//         const text = String(value ?? '').trim();
//         return text.length ? text : null;
//     }

//     private toBoolean(value: unknown): boolean {
//         return value === true || Number(value ?? 0) === 1;
//     }
// }


import { CommonModule } from '@angular/common';
import { Component, Inject, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { RoutingRuleMatchType, RoutingRuleRow } from '../../../features/routing-rules/routing-rules';

export interface RoutingRuleDialogData {
    rule: RoutingRuleRow | null;
    targets: any[];
    labs?: any[];
    machines?: any[];
}

export interface RoutingRuleDialogResult {
    id?: string;
    payload: {
        name: string;
        description?: string | null;
        enabled: number;
        priority: number;
        match_type: RoutingRuleMatchType | string;
        match_value?: string | null;
        target_id: string;
        lab_id?: string | null;
        machine_id?: string | null;
        protocol?: string | null;
        test_code?: string | null;
        order_id?: string | null;
        sample_id_pattern?: string | null;
        source_message_type?: string | null;
        stop_on_match: number;
    };
}

@Component({
    selector: 'app-routing-rule-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatSlideToggleModule,
    ],
    templateUrl: './routing-rule-dialog.html',
    styleUrl: './routing-rule-dialog.scss',
})
export class RoutingRuleDialog {
    readonly targetSearch = signal('');
    readonly machineSearch = signal('');

    readonly matchTypes: Array<{ value: RoutingRuleMatchType; label: string; hint: string; requiresValue: boolean }> = [
        { value: 'ANY', label: 'Any approved result', hint: 'Use explicit fields below, or leave all condition fields empty for fallback routing.', requiresValue: false },
        { value: 'MACHINE_ID', label: 'Machine ID', hint: 'Match the machine identifier stored on the normalized result.', requiresValue: true },
        { value: 'MACHINE_NAME', label: 'Machine name', hint: 'Match a machine name or code.', requiresValue: true },
        { value: 'MESSAGE_TYPE', label: 'Message type', hint: 'For example HL7_ORU or ASTM_RESULT.', requiresValue: true },
        { value: 'ORDER_CODE', label: 'Order code', hint: 'Match LIS order/test order code such as ORD-124985.', requiresValue: true },
        { value: 'TEST_CODE', label: 'Test/parameter code', hint: 'Match analyzer or mapped test code such as HPV16.', requiresValue: true },
        { value: 'SAMPLE_PREFIX', label: 'Sample prefix', hint: 'Match sample/barcode prefix such as NPHL/.', requiresValue: true },
    ];

    readonly filteredTargets = computed(() => {
        const q = this.targetSearch().trim().toLowerCase();
        const targets = this.data.targets ?? [];
        if (!q) return targets;
        return targets.filter((target: any) =>
            [target?.name, target?.type, target?.base_url, target?.id]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(q),
        );
    });

    readonly form: FormGroup;

    constructor(
        private readonly fb: FormBuilder,
        private readonly ref: MatDialogRef<RoutingRuleDialog, RoutingRuleDialogResult | undefined>,
        @Inject(MAT_DIALOG_DATA) public readonly data: RoutingRuleDialogData,
    ) {
        this.form = this.fb.group({
            name: [this.data.rule?.name ?? '', [Validators.required, Validators.maxLength(120)]],
            description: [this.data.rule?.description ?? ''],
            enabled: [this.toBoolean(this.data.rule?.enabled ?? true)],
            priority: [this.data.rule?.priority ?? 100, [Validators.required, Validators.min(1)]],
            target_id: [this.data.rule?.target_id ?? '', [Validators.required]],
            lab_id: [this.data.rule?.lab_id ?? ''],
            machine_id: [this.data.rule?.machine_id ?? ''],
            protocol: [this.data.rule?.protocol ?? ''],
            source_message_type: [this.data.rule?.source_message_type ?? ''],
            test_code: [this.data.rule?.test_code ?? ''],
            order_id: [this.data.rule?.order_id ?? ''],
            sample_id_pattern: [this.data.rule?.sample_id_pattern ?? ''],
            match_type: [this.data.rule?.match_type ?? 'ANY', [Validators.required]],
            match_value: [this.data.rule?.match_value ?? ''],
            stop_on_match: [this.toBoolean(this.data.rule?.stop_on_match ?? false)],
        });
    }

    get selectedMatchType() {
        return this.matchTypes.find((type) => type.value === this.form.value.match_type) ?? this.matchTypes[0];
    }

    labsList(): any[] {
        return this.data.labs ?? [];
    }

    filteredMachines(): any[] {
        const labId = this.clean(this.form.get('lab_id')?.value);
        const q = this.machineSearch().trim().toLowerCase();
        return (this.data.machines ?? []).filter((machine: any) => {
            if (labId && machine?.lab_id !== labId) return false;
            if (!q) return true;
            return [machine?.name, machine?.code, machine?.protocol, machine?.id]
                .filter(Boolean)
                .join(' ')
                .toLowerCase()
                .includes(q);
        });
    }

    targetLabel(target: any): string {
        const type = target?.type ? ` · ${target.type}` : '';
        return `${target?.name || target?.id}${type}`;
    }

    labLabel(lab: any): string {
        const code = lab?.code ? ` · ${lab.code}` : '';
        return `${lab?.name || lab?.id}${code}`;
    }

    machineLabel(machine: any): string {
        const code = machine?.code ? ` · ${machine.code}` : '';
        return `${machine?.name || machine?.id}${code}`;
    }

    close(): void {
        this.ref.close(undefined);
    }

    submit(): void {
        this.form.markAllAsTouched();
        if (this.form.invalid) return;

        const value = this.form.getRawValue();
        const matchType = String(value.match_type ?? 'ANY') as RoutingRuleMatchType;
        const selectedMatchType = this.matchTypes.find((type) => type.value === matchType);
        const matchValue = this.clean(value.match_value);

        if (selectedMatchType?.requiresValue && !matchValue) {
            this.form.get('match_value')?.setErrors({ required: true });
            return;
        }

        const targetId = this.clean(value.target_id);
        if (!targetId) {
            this.form.get('target_id')?.setErrors({ required: true });
            return;
        }

        const payload = {
            name: this.clean(value.name) || 'Untitled routing rule',
            description: this.clean(value.description),
            enabled: value.enabled ? 1 : 0,
            priority: Math.max(1, Number(value.priority || 100)),
            target_id: targetId,
            lab_id: this.clean(value.lab_id),
            machine_id: this.clean(value.machine_id),
            protocol: this.clean(value.protocol),
            source_message_type: this.clean(value.source_message_type),
            test_code: this.clean(value.test_code),
            order_id: this.clean(value.order_id),
            sample_id_pattern: this.clean(value.sample_id_pattern),
            match_type: matchType,
            match_value: matchType === 'ANY' ? null : matchValue,
            stop_on_match: value.stop_on_match ? 1 : 0,
        };

        this.ref.close({ id: this.data.rule?.id, payload });
    }

    private clean(value: unknown): string | null {
        const text = String(value ?? '').trim();
        return text.length ? text : null;
    }

    private toBoolean(value: unknown): boolean {
        return value === true || Number(value ?? 0) === 1;
    }
}

