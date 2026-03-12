import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-lab-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './lab-form-dialog.html',
  styleUrl: './lab-form-dialog.scss',
})
export class LabFormDialog {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<LabFormDialog>);
  readonly data = inject<any>(MAT_DIALOG_DATA);

  form = this.fb.group({
    name: ['', Validators.required],
    code: [''],
    location: [''],
    description: [''],
  });

  constructor() {
    const row = this.data?.row;
    if (row) this.form.patchValue(row);
  }

  cancel() {
    this.dialogRef.close(null);
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = {
      ...this.form.getRawValue(),
      // normalize empty strings -> null (nice for DB consistency)
      code: this.form.value.code?.trim() || null,
      location: this.form.value.location?.trim() || null,
      description: this.form.value.description?.trim() || null,
    };

    this.dialogRef.close(dto);
  }
}