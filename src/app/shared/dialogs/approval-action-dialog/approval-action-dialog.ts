import { CommonModule } from '@angular/common';
import { Component, Inject, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

type DialogData = {
  action: 'approve' | 'reject';
  row: any;
};

@Component({
  selector: 'app-approval-action-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './approval-action-dialog.html',
  styleUrl: './approval-action-dialog.scss',
})
export class ApprovalActionDialog {
  private readonly ref = inject(MatDialogRef<ApprovalActionDialog>);

  readonly comment = signal('');
  readonly touched = signal(false);

  readonly commentRequired = computed(() => this.data.action === 'reject');

  readonly routeTargetSummary = computed(() => {
    const targets = Array.isArray(this.data.row?.route_targets) ? this.data.row.route_targets : [];
    if (!targets.length) return 'No route targets configured';
    return targets.map((target: any) => target?.name || target?.id).join(', ');
  });

  readonly commentInvalid = computed(() => {
    if (!this.commentRequired()) return false;
    return this.comment().trim().length < 3;
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: DialogData) {}

  onCommentInput(value: string) {
    this.comment.set(value ?? '');
  }

  markTouched() {
    this.touched.set(true);
  }

  submit() {
    this.touched.set(true);

    if (this.commentInvalid()) {
      return;
    }

    this.ref.close({
      comment: this.comment().trim() || null,
    });
  }

  close() {
    this.ref.close();
  }
}
