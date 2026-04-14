// import { CommonModule } from '@angular/common';
// import { Component, Inject, inject, signal } from '@angular/core';
// import { FormsModule } from '@angular/forms';

// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { MatSelectModule } from '@angular/material/select';
// import { MatSnackBar } from '@angular/material/snack-bar';
// import { PlatformApiService } from '../../../core/platform/platform-api.service';

// @Component({
//   selector: 'app-normalized-result-detail-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     FormsModule,
//     MatButtonModule,
//     MatDialogModule,
//     MatDividerModule,
//     MatFormFieldModule,
//     MatIconModule,
//     MatProgressBarModule,
//     MatSelectModule,
//   ],
//   templateUrl: './normalized-result-detail-dialog.html',
//   styleUrl: './normalized-result-detail-dialog.scss',
// })
// export class NormalizedResultDetailDialog {
//   private api = inject(PlatformApiService);
//   private snack = inject(MatSnackBar);

//   previewLoading = signal(false);
//   preview = signal<any | null>(null);
//   selectedTargetId = '';

//   constructor(
//     private dialogRef: MatDialogRef<NormalizedResultDetailDialog>,
//     @Inject(MAT_DIALOG_DATA)
//     public data: { row: any; targets: any[]; initialTargetId?: string | null },
//   ) {
//     this.selectedTargetId = data?.initialTargetId ?? '';
//   }

//   close() {
//     this.dialogRef.close();
//   }

//   async previewTransform() {
//     if (!this.data?.row?.id) {
//       this.snack.open('No normalized result selected.', 'Close', { duration: 2200 });
//       return;
//     }

//     if (!this.selectedTargetId) {
//       this.snack.open('Select a target first.', 'Close', { duration: 2200 });
//       return;
//     }

//     try {
//       this.previewLoading.set(true);
//       const result = await this.api.targetTransformPreview(this.selectedTargetId, this.data.row.id);
//       this.preview.set(result);
//     } catch (e: any) {
//       this.snack.open(e?.message ?? 'Failed to generate transform preview', 'Close', {
//         duration: 3500,
//       });
//     } finally {
//       this.previewLoading.set(false);
//     }
//   }

//   prettyJson(value: unknown): string {
//     try {
//       return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : (value ?? {}), null, 2);
//     } catch {
//       return JSON.stringify(value ?? {}, null, 2);
//     }
//   }

//   formatDateTime(value?: string | null): string {
//     if (!value) return '—';
//     const d = new Date(value);
//     if (Number.isNaN(d.getTime())) return value;

//     return new Intl.DateTimeFormat(undefined, {
//       year: 'numeric',
//       month: 'short',
//       day: '2-digit',
//       hour: '2-digit',
//       minute: '2-digit',
//       second: '2-digit',
//     }).format(d);
//   }

//   workflowClass(state?: string | null): string {
//     switch (state) {
//       case 'DELIVERED':
//         return 'ok';
//       case 'PENDING_APPROVAL':
//       case 'QUEUED':
//       case 'SENDING':
//         return 'warn';
//       case 'FAILED_DELIVERY':
//         return 'bad';
//       case 'READY':
//       default:
//         return 'idle';
//     }
//   }

//   abnormalClass(flag?: string | null): string {
//     if (!flag) return 'idle';
//     const normalized = flag.toUpperCase();
//     if (normalized === 'N' || normalized === 'NORMAL') return 'ok';
//     return 'bad';
//   }
// }


import { CommonModule } from '@angular/common';
import { Component, Inject, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PlatformApiService } from '../../../core/platform/platform-api.service';

@Component({
  selector: 'app-normalized-result-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatSelectModule,
  ],
  templateUrl: './normalized-result-detail-dialog.html',
  styleUrl: './normalized-result-detail-dialog.scss',
})
export class NormalizedResultDetailDialog {
  private api = inject(PlatformApiService);
  private snack = inject(MatSnackBar);

  previewLoading = signal(false);
  preview = signal<any | null>(null);
  selectedTargetId = '';

  constructor(
    private dialogRef: MatDialogRef<NormalizedResultDetailDialog>,
    @Inject(MAT_DIALOG_DATA)
    public data: { row: any; targets: any[]; initialTargetId?: string | null },
  ) {
    this.selectedTargetId = data?.initialTargetId ?? '';
  }

  close() {
    this.dialogRef.close();
  }

  async previewTransform() {
    if (!this.data?.row?.id) {
      this.snack.open('No normalized result selected.', 'Close', { duration: 2200 });
      return;
    }

    if (!this.selectedTargetId) {
      this.snack.open('Select a target first.', 'Close', { duration: 2200 });
      return;
    }

    try {
      this.previewLoading.set(true);
      const result = await this.api.targetTransformPreview(this.selectedTargetId, this.data.row.id);
      this.preview.set(result);
    } catch (e: any) {
      this.snack.open(e?.message ?? 'Failed to generate transform preview', 'Close', {
        duration: 3500,
      });
    } finally {
      this.previewLoading.set(false);
    }
  }

  copyJson(value: unknown) {
    const text = this.prettyJson(value);
    this.api.copy(text)
      .then(() => this.snack.open('Copied to clipboard', 'Close', { duration: 1500 }))
      .catch(() => this.snack.open('Failed to copy', 'Close', { duration: 2000 }));
  }

  prettyJson(value: unknown): string {
    try {
      return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : (value ?? {}), null, 2);
    } catch {
      return JSON.stringify(value ?? {}, null, 2);
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

  workflowClass(state?: string | null): string {
    switch (state) {
      case 'DELIVERED':
        return 'ok';
      case 'PENDING_APPROVAL':
      case 'QUEUED':
      case 'SENDING':
        return 'warn';
      case 'FAILED_DELIVERY':
        return 'bad';
      case 'READY':
      default:
        return 'idle';
    }
  }

  abnormalClass(flag?: string | null): string {
    if (!flag) return 'idle';
    const normalized = flag.toUpperCase();
    if (normalized === 'N' || normalized === 'NORMAL') return 'ok';
    return 'bad';
  }
}
