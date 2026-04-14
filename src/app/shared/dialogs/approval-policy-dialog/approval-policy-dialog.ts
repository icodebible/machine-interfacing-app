// import { CommonModule } from '@angular/common';
// import { Component, Inject, inject } from '@angular/core';
// import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatButtonModule } from '@angular/material/button';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSelectModule } from '@angular/material/select';

// type DialogData = {
//   mode: 'create' | 'edit';
//   row?: any | null;
// };

// @Component({
//   selector: 'app-approval-policy-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     ReactiveFormsModule,
//     MatDialogModule,
//     MatButtonModule,
//     MatFormFieldModule,
//     MatInputModule,
//     MatIconModule,
//     MatSelectModule,
//   ],
//   templateUrl: './approval-policy-dialog.html',
//   styleUrl: './approval-policy-dialog.scss',
// })
// export class ApprovalPolicyDialog {
//   private fb = inject(FormBuilder);
//   private ref = inject(MatDialogRef<ApprovalPolicyDialog>);
//   form: FormGroup;

//   constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
//     this.form = this.fb.group({
//       name: [this.data.row?.name ?? '', Validators.required],
//       enabled: [this.data.row?.enabled ?? 1, Validators.required],
//       requires_approval: [this.data.row?.requires_approval ?? 1, Validators.required],
//       min_approvals: [this.data.row?.min_approvals ?? 1, Validators.required],
//       applies_to_lab_id: [this.data.row?.applies_to_lab_id ?? ''],
//       applies_to_machine_id: [this.data.row?.applies_to_machine_id ?? ''],
//       applies_to_target_id: [this.data.row?.applies_to_target_id ?? ''],
//     });
//   }

//   submit() {
//     const v = this.form.getRawValue();
//     this.ref.close({
//       ...v,
//       min_approvals: Number(v.min_approvals ?? 0),
//       enabled: Number(v.enabled ?? 0),
//       requires_approval: Number(v.requires_approval ?? 0),
//       applies_to_lab_id: v.applies_to_lab_id || null,
//       applies_to_machine_id: v.applies_to_machine_id || null,
//       applies_to_target_id: v.applies_to_target_id || null,
//     });
//   }

//   close() {
//     this.ref.close();
//   }
// }

import { CommonModule } from '@angular/common';
import { Component, Inject, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PlatformApiService } from '../../../core/platform/platform-api.service';

type ScopeMode = 'GLOBAL' | 'LAB' | 'MACHINE';

type LabOption = {
  id: string;
  name: string;
  code?: string | null;
  is_active?: number | null;
};

type MachineOption = {
  id: string;
  name: string;
  lab_id?: string | null;
  lab_name?: string | null;
  connection_type?: string | null;
  protocol?: string | null;
  is_active?: number | null;
};

type TargetOption = {
  id: string;
  name: string;
  type?: string | null;
  enabled?: number | null;
};

type DialogData = {
  mode: 'create' | 'edit';
  row?: any | null;
  labs?: LabOption[] | null;
  machines?: MachineOption[] | null;
  targets?: TargetOption[] | null;
};

@Component({
  selector: 'app-approval-policy-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  templateUrl: './approval-policy-dialog.html',
  styleUrl: './approval-policy-dialog.scss',
})
export class ApprovalPolicyDialog {
  private fb = inject(FormBuilder);
  private ref = inject(MatDialogRef<ApprovalPolicyDialog>);
  private api = inject(PlatformApiService);

  readonly loading = signal(false);
  readonly labs = signal<LabOption[]>([]);
  readonly machines = signal<MachineOption[]>([]);
  readonly targets = signal<TargetOption[]>([]);

  form: FormGroup;

  // constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
  //   this.applyScopeRules(this.scopeMode());
  //   this.form = this.fb.group({
  //     name: [this.data.row?.name ?? '', Validators.required],
  //     enabled: [this.data.row?.enabled ?? 1, Validators.required],
  //     requires_approval: [this.data.row?.requires_approval ?? 1, Validators.required],
  //     min_approvals: [this.data.row?.min_approvals ?? 1, [Validators.required, Validators.min(0)]],
  //     scope_mode: [this.inferScopeMode(this.data.row), Validators.required],
  //     applies_to_lab_id: [this.data.row?.applies_to_lab_id ?? null],
  //     applies_to_machine_id: [this.data.row?.applies_to_machine_id ?? null],
  //     applies_to_target_id: [this.data.row?.applies_to_target_id ?? null],
  //   });

  //   this.syncApprovalMode(Number(this.form.controls['requires_approval']?.value ?? 1));

  //   this.form.controls['scope_mode']?.valueChanges.subscribe((scope) => {
  //     this.applyScopeRules((scope as ScopeMode) ?? 'GLOBAL');
  //   });

  //   this.form.controls['requires_approval']?.valueChanges.subscribe((value) => {
  //     this.syncApprovalMode(Number(value ?? 0));
  //   });

  //   if (data?.labs?.length || data?.machines?.length || data?.targets?.length) {
  //     this.setOptions(data?.labs ?? [], data?.machines ?? [], data?.targets ?? []);
  //   } else {
  //     void this.loadOptions();
  //   }
  // }

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {
    this.form = this.fb.group({
      name: [this.data.row?.name ?? '', Validators.required],
      enabled: [this.data.row?.enabled ?? 1, Validators.required],
      requires_approval: [this.data.row?.requires_approval ?? 1, Validators.required],
      min_approvals: [this.data.row?.min_approvals ?? 1, [Validators.required, Validators.min(0)]],
      scope_mode: [this.inferScopeMode(this.data.row), Validators.required],
      applies_to_lab_id: [this.data.row?.applies_to_lab_id ?? null],
      applies_to_machine_id: [this.data.row?.applies_to_machine_id ?? null],
      applies_to_target_id: [this.data.row?.applies_to_target_id ?? null],
    });

    this.applyScopeRules(this.form.controls['scope_mode'].value as ScopeMode);
    this.syncApprovalMode(Number(this.form.controls['requires_approval']?.value ?? 1));

    this.form.controls['scope_mode']?.valueChanges.subscribe((scope) => {
      this.applyScopeRules((scope as ScopeMode) ?? 'GLOBAL');
    });

    this.form.controls['requires_approval']?.valueChanges.subscribe((value) => {
      this.syncApprovalMode(Number(value ?? 0));
    });

    if (data?.labs?.length || data?.machines?.length || data?.targets?.length) {
      this.setOptions(data?.labs ?? [], data?.machines ?? [], data?.targets ?? []);
    } else {
      void this.loadOptions();
    }
  }

  readonly scopeMode = computed(
    () => (this.form?.controls?.['scope_mode']?.value as ScopeMode) ?? 'GLOBAL',
  );

  readonly requiresApproval = computed(
    () => Number(this.form?.controls?.['requires_approval']?.value ?? 0) === 1,
  );

  readonly selectedMachine = computed(() => {
    const id = this.form?.controls?.['applies_to_machine_id']?.value;
    return this.machines().find((machine) => machine.id === id) ?? null;
  });

  readonly selectedTarget = computed(() => {
    const id = this.form?.controls?.['applies_to_target_id']?.value;
    return this.targets().find((target) => target.id === id) ?? null;
  });

  // readonly scopeMode = computed(() => this.form.controls['scope_mode']?.value as ScopeMode);
  // readonly requiresApproval = computed(
  //   () => Number(this.form.controls['requires_approval']?.value ?? 0) === 1,
  // );

  // readonly selectedMachine = computed(() => {
  //   const id = this.form.controls['applies_to_machine_id']?.value;
  //   return this.machines().find((machine) => machine.id === id) ?? null;
  // });

  readonly selectedMachineLab = computed(() => {
    const machine = this.selectedMachine();
    if (!machine?.lab_id) return null;
    return this.labs().find((lab) => lab.id === machine.lab_id) ?? null;
  });

  // readonly selectedTarget = computed(() => {
  //   const id = this.form.controls['applies_to_target_id'].value;
  //   return this.targets().find((target) => target.id === id) ?? null;
  // });

  private inferScopeMode(row?: any | null): ScopeMode {
    if (row?.applies_to_machine_id) return 'MACHINE';
    if (row?.applies_to_lab_id) return 'LAB';
    return 'GLOBAL';
  }

  private async loadOptions() {
    this.loading.set(true);
    try {
      const [labs, machines, targets] = await Promise.all([
        this.api.labsList(),
        this.api.machinesList(),
        this.api.targetsList(),
      ]);
      this.setOptions(labs ?? [], machines ?? [], targets ?? []);
    } finally {
      this.loading.set(false);
    }
  }

  private setOptions(labs: LabOption[], machines: MachineOption[], targets: TargetOption[]) {
    const current = this.data.row ?? {};

    this.labs.set(
      (labs ?? []).filter(
        (lab) =>
          lab.is_active === 1 || lab.id === current.applies_to_lab_id || !('is_active' in lab),
      ),
    );

    this.machines.set(
      (machines ?? []).filter(
        (machine) =>
          machine.is_active === 1 ||
          machine.id === current.applies_to_machine_id ||
          !('is_active' in machine),
      ),
    );

    this.targets.set(
      (targets ?? []).filter(
        (target) =>
          target.enabled === 1 ||
          target.id === current.applies_to_target_id ||
          !('enabled' in target),
      ),
    );
  }

  private applyScopeRules(scope: ScopeMode) {
    if (scope === 'GLOBAL') {
      this.form.patchValue(
        {
          applies_to_lab_id: null,
          applies_to_machine_id: null,
        },
        { emitEvent: false },
      );
      return;
    }

    if (scope === 'LAB') {
      this.form.patchValue(
        {
          applies_to_machine_id: null,
        },
        { emitEvent: false },
      );
      return;
    }

    if (scope === 'MACHINE') {
      this.form.patchValue(
        {
          applies_to_lab_id: null,
        },
        { emitEvent: false },
      );
    }
  }

  private syncApprovalMode(requiresApproval: number) {
    const minApprovalsCtrl = this.form.controls['min_approvals'];

    if (requiresApproval === 1) {
      minApprovalsCtrl.enable({ emitEvent: false });
      const current = Number(minApprovalsCtrl.value ?? 0);
      if (current < 1) {
        minApprovalsCtrl.setValue(1, { emitEvent: false });
      }
      return;
    }

    minApprovalsCtrl.setValue(0, { emitEvent: false });
    minApprovalsCtrl.disable({ emitEvent: false });
  }

  title() {
    return this.data.mode === 'create' ? 'New Approval Policy' : 'Edit Approval Policy';
  }

  subtitle() {
    return 'Select configured resources instead of entering raw IDs, and keep scope aligned to real operations.';
  }

  machineLabel(machine: MachineOption) {
    const parts = [
      machine.name,
      machine.lab_name,
      machine.connection_type,
      machine.protocol,
    ].filter(Boolean);
    return parts.join(' • ');
  }

  targetLabel(target: TargetOption) {
    return [target.name, target.type].filter(Boolean).join(' • ');
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();
    const requiresApproval = Number(raw.requires_approval ?? 0);

    this.ref.close({
      name: String(raw.name ?? '').trim(),
      enabled: Number(raw.enabled ?? 0),
      requires_approval: requiresApproval,
      min_approvals: requiresApproval === 1 ? Math.max(1, Number(raw.min_approvals ?? 1)) : 0,
      applies_to_lab_id: raw.scope_mode === 'LAB' ? raw.applies_to_lab_id || null : null,
      applies_to_machine_id:
        raw.scope_mode === 'MACHINE' ? raw.applies_to_machine_id || null : null,
      applies_to_target_id: raw.applies_to_target_id || null,
    });
  }

  close() {
    this.ref.close();
  }
}
