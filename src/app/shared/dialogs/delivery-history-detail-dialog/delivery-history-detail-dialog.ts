import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

type DeliveryHistoryDetailDialogData = {
  row: any;
  preview: any | null;
  deliveredRecord: any | null;
};

@Component({
  selector: 'app-delivery-history-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './delivery-history-detail-dialog.html',
  styleUrl: './delivery-history-detail-dialog.scss',
})
export class DeliveryHistoryDetailDialog {
  readonly data = inject<DeliveryHistoryDetailDialogData>(MAT_DIALOG_DATA);

  summaryCards() {
    const row = this.data.row;
    return [
      { label: 'Status', value: row?.status || '—', note: this.statusSummaryLabel(row) },
      { label: 'Operation', value: row?.operation || '—', note: `Attempt ${row?.attempt_no ?? '—'}` },
      { label: 'HTTP', value: row?.http_status ?? '—', note: `${row?.duration_ms ?? '—'} ms` },
      { label: 'Payload', value: this.data.preview?.payloadSource || '—', note: this.data.deliveredRecord ? 'Queue snapshot available' : 'Queue snapshot missing' },
    ];
  }

  alerts() {
    const row = this.data.row;
    const alerts: Array<{ kind: 'info' | 'warn' | 'bad'; text: string }> = [];

    if (row?.status === 'FAILED' && row?.error_message) {
      alerts.push({ kind: 'bad', text: 'This delivery attempt failed. Review the stored error and full payload content before retrying similar traffic.' });
    }
    if (row?.status === 'STARTED') {
      alerts.push({ kind: 'warn', text: 'The attempt was recorded as started but this row has no final delivery outcome.' });
    }
    if (row?.status === 'DELIVERED') {
      alerts.push({ kind: 'info', text: 'This row is a confirmed outbound delivery event and can be used as an operational reference.' });
    }
    if (!this.data.deliveredRecord) {
      alerts.push({ kind: 'warn', text: 'No delivered queue snapshot was found for the selected event.' });
    }

    return alerts;
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

  prettyJson(value?: any) {
    if (!value) return '—';
    try {
      return JSON.stringify(typeof value === 'string' ? JSON.parse(value) : value, null, 2);
    } catch {
      return String(value);
    }
  }

  statusSummaryLabel(row: any) {
    switch (row?.status) {
      case 'DELIVERED':
        return 'Confirmed delivery';
      case 'FAILED':
        return 'Failed attempt';
      case 'STARTED':
        return 'In progress / incomplete';
      default:
        return 'Recorded event';
    }
  }
}