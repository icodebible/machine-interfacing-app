import { CommonModule } from '@angular/common';
import { Component, Inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-mapping-value-translation-entry-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './mapping-value-translation-entry-dialog.html',
  styleUrl: './mapping-value-translation-entry-dialog.scss',
})
export class MappingValueTranslationEntryDialog {
  readonly error = signal('');

  sourceValue!: string;
  destinationValue!: string;
  note!: string;
  enabled!: number;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { mode: 'create' | 'edit'; row?: any },
    private readonly ref: MatDialogRef<MappingValueTranslationEntryDialog>,
  ) {
    this.sourceValue = this.data.row?.source_value ?? '';
    this.destinationValue = this.data.row?.destination_value ?? '';
    this.note = this.data.row?.note ?? '';
    this.enabled = this.data.row?.enabled === 0 ? 0 : 1;
  }

  save() {
    this.error.set('');
    if (!this.sourceValue.trim()) {
      this.error.set('Source value is required.');
      return;
    }

    this.ref.close({
      source_value: this.sourceValue.trim(),
      destination_value: this.destinationValue.trim() || null,
      note: this.note.trim() || null,
      enabled: this.enabled,
    });
  }

  close() {
    this.ref.close();
  }
}
