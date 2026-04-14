import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

type TransformKind = 'direct' | 'constant' | 'lookup';

type TemplateRule = {
  source_field: string;
  destination_field: string;
  transform_kind: TransformKind;
  constant_value?: string | null;
  enabled?: number;
  note?: string;
};

type TemplateGroup = {
  targetType: 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
  title: string;
  description: string;
  rules: TemplateRule[];
  useCase: string;
};

@Component({
  selector: 'app-starter-template-info-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule],
  templateUrl: './starter-template-info-dialog.html',
  styleUrl: './starter-template-info-dialog.scss',
})
export class StarterTemplateInfoDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { template: TemplateGroup },
    private readonly ref: MatDialogRef<StarterTemplateInfoDialog>,
  ) { }

  get constantRules() {
    return this.data.template.rules.filter(
      (rule) => rule.transform_kind === 'constant' || !!rule.note,
    );
  }

  close() {
    this.ref.close();
  }
}
