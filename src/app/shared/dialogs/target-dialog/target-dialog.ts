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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

type TargetDialogData = {
  mode: 'create' | 'edit';
  row?: any;
  defaults?: Partial<{
    name: string;
    type: TargetType;
    base_url: string;
    enabled: number;
  }>;
  presetLabel?: string;
  presetNotes?: string[];
  recommendedOperationalDefaults?: {
    requestTimeoutMs: number;
    autoRetry: string;
    maxAttempts: number;
    backoffStrategy: string;
    baseDelayMs: number;
    maxDelayMs: number;
  } | null;
};

@Component({
  selector: 'app-target-dialog',
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
    MatSlideToggleModule,
  ],
  templateUrl: './target-dialog.html',
  styleUrl: './target-dialog.scss',
})
export class TargetDialog {
  readonly targetTypes: TargetType[] = ['DHIS2', 'OPENMRS', 'LIS', 'CUSTOM_HTTP'];

  readonly helperByType: Record<
    TargetType,
    { label: string; exampleUrl: string; helperLines: string[] }
  > = {
    DHIS2: {
      label: 'DHIS2 Tracker / Event API',
      exampleUrl: 'https://your-dhis2.example.org/api',
      helperLines: [
        'Keep secrets out of the target form. Save tokens and credentials in the connector security section.',
        'Use the root API URL rather than a specific resource path when possible.',
        'Keep program, stage, and org unit assumptions in mappings instead of embedding them in the endpoint URL.',
      ],
    },
    OPENMRS: {
      label: 'OpenMRS integration endpoint',
      exampleUrl: 'https://openmrs.example.org/ws/rest/v1',
      helperLines: [
        'Use an environment-specific OpenMRS base URL.',
        'Keep encounter / obs shaping in mappings rather than hard-coding it into the URL.',
      ],
    },
    LIS: {
      label: 'Laboratory Information System endpoint',
      exampleUrl: 'https://lis.example.org/api',
      helperLines: [
        'LIS delivery is supported through the adapter layer.',
        'Ensure result.* and specimen.* mapping rules are defined before production send.',
      ],
    },
    CUSTOM_HTTP: {
      label: 'Generic JSON HTTP endpoint',
      exampleUrl: 'https://partner.example.org/inbound/results',
      helperLines: [
        'Custom HTTP is best for partner endpoints with stable JSON contracts.',
        'Use mappings to shape the exact outbound body expected by the remote API.',
      ],
    },
  };

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<TargetDialog>,
    @Inject(MAT_DIALOG_DATA) public data: TargetDialogData,
  ) {
    this.form = this.fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      type: ['DHIS2' as TargetType, [Validators.required]],
      base_url: ['', [Validators.required, Validators.maxLength(500)]],
      enabled: [true],
    });

    const defaults = data?.defaults;

    if (defaults) {
      this.form.patchValue({
        name: defaults.name ?? '',
        type: defaults.type ?? 'DHIS2',
        base_url: defaults.base_url ?? '',
        enabled: (defaults.enabled ?? 1) === 1,
      });
    }

    if (data?.row) {
      this.form.patchValue({
        name: data.row.name ?? '',
        type: data.row.type ?? 'DHIS2',
        base_url: data.row.base_url ?? '',
        enabled: (data.row.enabled ?? 1) === 1,
      });
    }
  }

  get selectedType() {
    return this.form.controls['type'].value;
  }

  get helper() {
    return (this.helperByType as any)[this.selectedType];
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
      name: raw.name.trim(),
      type: raw.type,
      base_url: this.normalizeBaseUrl(raw.base_url),
      enabled: raw.enabled ? 1 : 0,
    });
  }

  private normalizeBaseUrl(value: string) {
    let next = String(value ?? '').trim();
    if (!/^https?:\/\//i.test(next)) {
      next = `https://${next}`;
    }
    return next.replace(/\/+$/, '');
  }
}
