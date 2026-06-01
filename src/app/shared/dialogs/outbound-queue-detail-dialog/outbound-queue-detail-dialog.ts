// import { CommonModule } from '@angular/common';
// import { Component, Inject, inject, signal } from '@angular/core';
// import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
// import { MatButtonModule } from '@angular/material/button';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressBarModule } from '@angular/material/progress-bar';
// import { PlatformApiService } from '../../../core/platform/platform-api.service';
// import { MatSnackBar } from '@angular/material/snack-bar';

// @Component({
//   selector: 'app-outbound-queue-detail-dialog',
//   standalone: true,
//   imports: [
//     CommonModule,
//     MatDialogModule,
//     MatButtonModule,
//     MatDividerModule,
//     MatIconModule,
//     MatProgressBarModule,
//   ],
//   templateUrl: './outbound-queue-detail-dialog.html',
//   styleUrl: './outbound-queue-detail-dialog.scss',
// })
// export class OutboundQueueDetailDialog {
//   private api = inject(PlatformApiService);
//   private ref = inject(MatDialogRef<OutboundQueueDetailDialog>);
//   private snack = inject(MatSnackBar);

//   previewLoading = signal(false);
//   queuePreview = signal<any | null>(null);

//   constructor(@Inject(MAT_DIALOG_DATA) public data: { row: any }) {
//     void this.loadPreview();
//   }

//   close() {
//     this.ref.close();
//   }

//   async loadPreview() {
//     const row = this.data?.row;
//     if (!row?.id) return;

//     try {
//       this.previewLoading.set(true);
//       const result = await this.api.targetTransformPreviewFromQueue(row.id);
//       this.queuePreview.set(result);
//     } catch {
//       this.queuePreview.set(null);
//     } finally {
//       this.previewLoading.set(false);
//     }
//   }

//   async copyJson(value: unknown) {
//     try {
//       await this.api.copy(this.prettyJson(value));
//       this.snack.open('Copied to clipboard', 'Close', { duration: 1500 });
//     } catch {
//       this.snack.open('Failed to copy', 'Close', { duration: 2000 });
//     }
//   }

//   targetDisplay(row: any) {
//     return row?.target_name || row?.target_id || 'Unknown target';
//   }

//   previewSourceLabel(preview: any) {
//     switch (preview?.payloadSource) {
//       case 'stored_queue':
//         return 'Stored queue payload';
//       case 'stored_delivery':
//         return 'Stored delivered payload';
//       case 'regenerated':
//       default:
//         return 'Regenerated with current mapping engine';
//     }
//   }

//   prettyJson(value?: any) {
//     if (!value) return '—';
//     try {
//       return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
//     } catch {
//       return String(value);
//     }
//   }

//   formatDateTime(value?: string | null) {
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

//   statusClass(status?: string | null) {
//     switch (status) {
//       case 'DELIVERED':
//         return 'ok';
//       case 'FAILED':
//         return 'bad';
//       case 'SENDING':
//         return 'warn';
//       default:
//         return 'idle';
//     }
//   }

//   operationalAlerts(row: any) {
//     if (!row) return [] as Array<{ kind: 'info' | 'warn' | 'bad'; text: string }>;
//     const alerts: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

//     if (row.delivery_status === 'FAILED' && row.last_error) {
//       alerts.push({
//         kind: 'bad',
//         text: 'This queue item failed on its last delivery attempt. Review the error details before retrying or resending.',
//       });
//     }
//     if (row.delivery_status === 'SENDING') {
//       alerts.push({
//         kind: 'warn',
//         text: 'Delivery is currently in progress. Avoid duplicate manual send actions unless the previous attempt is confirmed stopped.',
//       });
//     }
//     if (row.next_retry_at) {
//       alerts.push({
//         kind: 'info',
//         text: `A scheduled retry is set for ${this.formatDateTime(row.next_retry_at)}.`,
//       });
//     }
//     if ((row.retry_count ?? 0) >= 3) {
//       alerts.push({
//         kind: 'warn',
//         text: 'This item has already retried multiple times. Investigate the connector or payload before continuing.',
//       });
//     }
//     if (row.delivery_status === 'DELIVERED') {
//       alerts.push({
//         kind: 'info',
//         text: 'This item has already been delivered. Requeue should only be used when intentional redelivery is required.',
//       });
//     }

//     return alerts;
//   }
// }


import { CommonModule } from '@angular/common';
import { Component, Inject, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PlatformApiService } from '../../../core/platform/platform-api.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-outbound-queue-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './outbound-queue-detail-dialog.html',
  styleUrl: './outbound-queue-detail-dialog.scss',
})
export class OutboundQueueDetailDialog {
  private api = inject(PlatformApiService);
  private ref = inject(MatDialogRef<OutboundQueueDetailDialog>);
  private snack = inject(MatSnackBar);

  previewLoading = signal(false);
  queuePreview = signal<any | null>(null);

  constructor(@Inject(MAT_DIALOG_DATA) public data: { row: any }) {
    void this.loadPreview();
  }

  close() {
    this.ref.close();
  }

  async loadPreview() {
    const row = this.data?.row;
    if (!row?.id) return;

    try {
      this.previewLoading.set(true);
      const result = await this.api.targetTransformPreviewFromQueue(row.id);
      this.queuePreview.set(result);
    } catch {
      this.queuePreview.set(null);
    } finally {
      this.previewLoading.set(false);
    }
  }

  async copyJson(value: unknown) {
    try {
      await this.api.copy(this.prettyJson(value));
      this.snack.open('Copied to clipboard', 'Close', { duration: 1500 });
    } catch {
      this.snack.open('Failed to copy', 'Close', { duration: 2000 });
    }
  }

  targetDisplay(row: any) {
    return row?.target_name || row?.target_id || 'Unknown target';
  }

  previewSourceLabel(preview: any) {
    switch (preview?.payloadSource) {
      case 'stored_queue':
        return 'Stored queue payload';
      case 'stored_delivery':
        return 'Stored delivered payload';
      case 'regenerated':
      default:
        return 'Regenerated with current mapping engine';
    }
  }

  prettyJson(value?: any) {
    if (!value) return '—';
    try {
      return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
    } catch {
      return String(value);
    }
  }

  formatDateTime(value?: string | null) {
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

  statusClass(status?: string | null) {
    switch (status) {
      case 'DELIVERED':
        return 'ok';
      case 'FAILED':
        return 'bad';
      case 'SENDING':
        return 'warn';
      default:
        return 'idle';
    }
  }

  operationalAlerts(row: any) {
    if (!row) return [] as Array<{ kind: 'info' | 'warn' | 'bad'; text: string }>;
    const alerts: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

    if (row.delivery_status === 'FAILED' && row.last_error) {
      alerts.push({
        kind: 'bad',
        text: 'This queue item failed on its last delivery attempt. Review the error details before retrying or resending.',
      });
    }
    if (row.delivery_status === 'SENDING') {
      alerts.push({
        kind: 'warn',
        text: 'Delivery is currently in progress. Avoid duplicate manual send actions unless the previous attempt is confirmed stopped.',
      });
    }
    if (row.next_retry_at) {
      alerts.push({
        kind: 'info',
        text: `A scheduled retry is set for ${this.formatDateTime(row.next_retry_at)}.`,
      });
    }
    if ((row.retry_count ?? 0) >= 3) {
      alerts.push({
        kind: 'warn',
        text: 'This item has already retried multiple times. Investigate the connector or payload before continuing.',
      });
    }
    if (row.delivery_status === 'DELIVERED') {
      alerts.push({
        kind: 'info',
        text: 'This item has already been delivered. Requeue should only be used when intentional redelivery is required.',
      });
    }

    return alerts;
  }
}
