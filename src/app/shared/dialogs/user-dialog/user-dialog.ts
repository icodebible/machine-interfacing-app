import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

type UserDialogData = {
  mode: 'create' | 'edit';
  row?: any | null;
  roles: any[];
};

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './user-dialog.html',
  styleUrl: './user-dialog.scss',
})
export class UserDialogComponent {
  showPassword = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData,
  ) {
    this.form = this.fb.nonNullable.group({
      username: ['', [Validators.required, Validators.maxLength(120)]],
      password: [''],
      is_active: [1, [Validators.required]],
      must_change_password: [1, [Validators.required]],
      role_ids: [[] as string[]],
    });

    if (data?.row) {
      this.form.patchValue({
        username: data.row.username ?? '',
        is_active: data.row.is_active ?? 1,
        must_change_password: data.row.must_change_password ?? 1,
        role_ids: [...(data.row.role_ids ?? [])],
      });
    }

    if (this.isProtectedUser) {
      this.form.controls['username'].disable({ emitEvent: false });
    }
  }

  get isCreate() {
    return this.data.mode === 'create';
  }

  get isProtectedUser() {
    return String(this.data.row?.username ?? '').toLowerCase() === 'admin';
  }

  get selectedRoles() {
    const ids = new Set(this.form.controls['role_ids'].value ?? []);
    return (this.data.roles ?? []).filter((role) => ids.has(role.id));
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
      username: String(raw.username ?? '').trim(),
      password: this.isCreate ? String(raw.password ?? '').trim() : undefined,
      is_active: this.isProtectedUser ? 1 : Number(raw.is_active ?? 1),
      must_change_password: Number(raw.must_change_password ?? 1),
      role_ids: [...(raw.role_ids ?? [])],
    });
  }
}
