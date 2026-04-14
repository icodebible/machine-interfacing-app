import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-parsed-result-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatDividerModule, MatIconModule],
  templateUrl: './parsed-result-detail-dialog.html',
  styleUrl: './parsed-result-detail-dialog.scss',
})
export class ParsedResultDetailDialog {
  constructor(
    private dialogRef: MatDialogRef<ParsedResultDetailDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { row: any },
  ) { }

  close() {
    this.dialogRef.close();
  }

  prettyJson(value: unknown): string {
    try {
      return JSON.stringify(value ?? {}, null, 2);
    } catch {
      return String(value ?? '');
    }
  }

  formatDateTime(value?: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;

    return new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(d);
  }

  statusClass(status?: string | null): string {
    switch (status) {
      case 'PARSED':
        return 'ok';
      case 'WARNING':
        return 'warn';
      case 'FAILED':
        return 'bad';
      default:
        return 'idle';
    }
  }
}
