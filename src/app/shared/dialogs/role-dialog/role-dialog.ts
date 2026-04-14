import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

type RoleDialogData = {
  mode: 'create' | 'edit';
  row?: any | null;
  catalog: string[];
};

@Component({
  selector: 'app-role-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './role-dialog.html',
  styleUrl: './role-dialog.scss',
})
export class RoleDialogComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<RoleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RoleDialogData,
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: [''],
      authority_codes: [[] as string[]],
    });

    if (data?.row) {
      this.form.patchValue({
        name: data.row.name ?? '',
        description: data.row.description ?? '',
        authority_codes: [...(data.row.authority_codes ?? [])],
      });
    }

    if (this.isSystemRole) {
      this.form.controls['name'].disable({ emitEvent: false });
    }
  }

  get isCreate() {
    return this.data.mode === 'create';
  }

  get isSystemRole() {
    return String(this.data.row?.name ?? '').toUpperCase() === 'SUPER_ADMIN';
  }

  get selectedAuthorities() {
    const selected = new Set(this.form.controls['authority_codes'].value ?? []);
    return (this.data.catalog ?? []).filter((code) => selected.has(code));
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.dialogRef.close({
      name: String(raw.name ?? '').trim(),
      description: String(raw.description ?? '').trim(),
      authority_codes: [...(raw.authority_codes ?? [])],
    });
  }
}
