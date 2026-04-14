import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

type UserPasswordDialogData = {
  row: any;
  currentUser: any;
};

@Component({
  selector: 'app-user-password-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './user-password-dialog.html',
  styleUrl: './user-password-dialog.scss',
})
export class UserPasswordDialogComponent {
  show = false;
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserPasswordDialogData,
  ) {
    this.form = this.fb.nonNullable.group({
      password: ['', [Validators.required, Validators.minLength(3)]],
    });
  }

  get canUseBootstrapPreset() {
    const isAdminTarget = String(this.data?.row?.username ?? '').toLowerCase() === 'admin';
    const currentUsername = String(this.data?.currentUser?.username ?? '').toLowerCase();
    const hasSuperAdmin = (this.data?.currentUser?.authorities ?? []).includes('SUPER_ADMIN');
    return isAdminTarget && (currentUsername === 'admin' || hasSuperAdmin);
  }

  useBootstrapPassword() {
    this.form.patchValue({ password: 'admin' });
    this.show = true;
  }

  cancel() {
    this.dialogRef.close();
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.dialogRef.close(String(this.form.controls['password'].value ?? '').trim());
  }
}
