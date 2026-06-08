import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
// import { ProfileEditor } from '../../../features/lis-test-order-profiles/lis-test-order-profiles';

import type { ProfileEditor, ProfileParameter, ProfileValueType } from '../../../features/lis-test-order-profiles/lis-test-order-profiles';

export type ProfileDialogData = {
  form: ProfileEditor;
  mode: 'create' | 'edit';
  targetName?: string | null;
  sourceOrderName?: string | null;
};

export type ProfileDialogResult =
  | { action: 'save'; form: ProfileEditor }
  | { action: 'cancel' }
  | undefined;

@Component({
  selector: 'app-lis-test-order-profile-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './lis-test-order-profile-dialog.html',
  styleUrl: './lis-test-order-profile-dialog.scss',
})
export class LisTestOrderProfileDialog {
  private readonly dialogRef = inject(MatDialogRef<LisTestOrderProfileDialog, ProfileDialogResult>);
  readonly data = inject(MAT_DIALOG_DATA) as ProfileDialogData;

  form: ProfileEditor = this.cloneForm(this.data.form);

  expectedCodes(): string[] {
    return this.form.parameters
      .map((param: ProfileParameter) => String(param.analyzer_code ?? '').trim())
      .filter(Boolean);
  }

  requiredCodes(): string[] {
    return this.form.parameters
      .filter((param: ProfileParameter) => Number(param.required ?? 0) === 1)
      .map((param: ProfileParameter) => String(param.analyzer_code ?? '').trim())
      .filter(Boolean);
  }

  updateForm(patch: Partial<ProfileEditor>): void {
    this.form = { ...this.form, ...patch };
  }

  updateParameter(index: number, patch: Partial<ProfileParameter>): void {
    this.form = {
      ...this.form,
      parameters: this.form.parameters.map((param: ProfileParameter, idx: number) =>
        idx === index ? { ...param, ...patch } : param,
      ),
    };
  }

  toggleRequired(index: number, checked: boolean): void {
    this.updateParameter(index, { required: checked ? 1 : 0 });
  }

  addParameter(): void {
    this.form = {
      ...this.form,
      parameters: [
        ...this.form.parameters,
        {
          analyzer_code: '',
          display_name: '',
          concept_uuid: '',
          allocation_uuid: '',
          datatype: '',
          value_type: 'text',
          required: 1,
          aliases: [],
          sort_order: this.form.parameters.length,
        },
      ],
    };
  }

  removeParameter(index: number): void {
    this.form = {
      ...this.form,
      parameters: this.form.parameters.filter((_param: ProfileParameter, idx: number) => idx !== index),
    };
  }

  parameterReadiness(param: ProfileParameter): 'ok' | 'warn' {
    return param.analyzer_code && param.concept_uuid ? 'ok' : 'warn';
  }

  readinessLabel(): string {
    if (!this.form.profile_code?.trim() || !this.form.profile_name?.trim()) return 'Needs profile identity';
    if (!this.form.order_concept_uuid?.trim()) return 'Needs order concept';
    if (!this.form.parameters.length) return 'Needs parameters';
    return this.form.parameters.some((param: ProfileParameter) => this.parameterReadiness(param) === 'warn')
      ? 'Needs review'
      : 'Ready';
  }

  canSave(): boolean {
    return (
      !!this.form.target_id?.trim() &&
      !!this.form.profile_code?.trim() &&
      !!this.form.profile_name?.trim() &&
      this.form.parameters.length > 0
    );
  }

  save(): void {
    if (!this.canSave()) return;
    this.dialogRef.close({ action: 'save', form: this.normalizedForm() });
  }

  close(): void {
    this.dialogRef.close({ action: 'cancel' });
  }

  private normalizedForm(): ProfileEditor {
    return {
      ...this.form,
      profile_code: this.form.profile_code.trim(),
      profile_name: this.form.profile_name.trim(),
      order_concept_uuid: String(this.form.order_concept_uuid ?? '').trim(),
      order_display: String(this.form.order_display ?? '').trim(),
      order_name_includes_text: String(this.form.order_name_includes_text ?? '').trim(),
      enabled: Number(this.form.enabled ?? 1),
      parameters: this.form.parameters.map((param: ProfileParameter, index: number) => ({
        analyzer_code: String(param.analyzer_code ?? '').trim(),
        display_name: String(param.display_name ?? param.analyzer_code ?? '').trim(),
        concept_uuid: String(param.concept_uuid ?? '').trim() || null,
        allocation_uuid: String(param.allocation_uuid ?? '').trim() || null,
        datatype: String(param.datatype ?? '').trim() || null,
        value_type: this.normalizeValueType(param.value_type),
        required: Number(param.required ?? 1),
        sort_order: index,
        aliases: Array.isArray(param.aliases) ? param.aliases : [],
      })),
    };
  }

  private cloneForm(form: ProfileEditor): ProfileEditor {
    return {
      ...form,
      parameters: (form.parameters ?? []).map((param: ProfileParameter, index: number) => ({
        ...param,
        value_type: this.normalizeValueType(param.value_type),
        required: Number(param.required ?? 1),
        sort_order: Number(param.sort_order ?? index),
        aliases: Array.isArray(param.aliases) ? [...param.aliases] : [],
      })),
    };
  }

  private normalizeValueType(value: unknown): ProfileValueType {
    const text = String(value ?? '').toLowerCase();
    return ['coded', 'numeric', 'text'].includes(text) ? (text as ProfileValueType) : 'text';
  }
}
