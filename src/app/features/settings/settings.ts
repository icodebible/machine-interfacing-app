import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly snack = inject(MatSnackBar);

  readonly mode = signal('');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly showNew = signal(false);
  readonly showConfirm = signal(false);
  readonly capsLockOn = signal(false);
  readonly currentUsername = signal('Operator');

  readonly newPassword = signal('');
  readonly confirmPassword = signal('');

  readonly isForced = computed(() => {
    const user = this.auth.user?.();
    return this.mode() === 'change-password' && !!user?.mustChangePassword;
  });

  readonly strengthPct = computed(() => {
    const value = this.newPassword();
    let score = 0;
    if (value.length >= 8) score += 20;
    if (value.length >= 12) score += 15;
    if (/[A-Z]/.test(value)) score += 15;
    if (/[a-z]/.test(value)) score += 15;
    if (/\d/.test(value)) score += 15;
    if (/[^A-Za-z0-9]/.test(value)) score += 20;
    return Math.max(4, Math.min(score, 100));
  });

  readonly strengthLabel = computed(() => {
    const pct = this.strengthPct();
    if (pct >= 85) return 'Strong';
    if (pct >= 60) return 'Good';
    if (pct >= 40) return 'Fair';
    return 'Weak';
  });

  readonly strengthTone = computed(() => {
    const pct = this.strengthPct();
    if (pct >= 85) return 'good';
    if (pct >= 60) return 'ok';
    if (pct >= 40) return 'warn';
    return 'bad';
  });

  readonly guidance = [
    'Use at least 12 characters whenever possible.',
    'Combine uppercase, lowercase, numbers, and symbols.',
    'Avoid names of facilities, labs, devices, or shared team phrases.',
    'Use a password unique to this workstation and integration environment.',
  ];

  readonly canSubmit = computed(() => {
    const value = this.newPassword();
    const confirm = this.confirmPassword();
    const hasMinimum = value.length >= 8;
    const matches = !!value && value === confirm;
    const complexityCount = [
      /[A-Z]/.test(value),
      /[a-z]/.test(value),
      /\d/.test(value),
      /[^A-Za-z0-9]/.test(value),
    ].filter(Boolean).length;
    return hasMinimum && matches && complexityCount >= 2;
  });

  ngOnInit(): void {
    const user: any = this.auth.user?.() ?? null;
    const username = user?.displayName || user?.username || user?.name;
    if (typeof username === 'string' && username.trim()) {
      this.currentUsername.set(username.trim());
    }

    this.route.queryParamMap.subscribe((params) => {
      this.mode.set(params.get('mode') ?? '');
    });
  }

  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  onKeyboardState(event: KeyboardEvent) {
    const state = event.getModifierState?.('CapsLock');
    if (typeof state === 'boolean') this.capsLockOn.set(state);
  }

  onNewPasswordChange(value: string) {
    this.newPassword.set(value ?? '');
    this.clearMessages();
  }

  onConfirmPasswordChange(value: string) {
    this.confirmPassword.set(value ?? '');
    this.clearMessages();
  }

  clearMessages() {
    if (this.error()) this.error.set('');
    if (this.success()) this.success.set('');
  }

  async onChangePassword() {
    this.clearMessages();

    const newPassword = this.newPassword().trim();
    const confirmPassword = this.confirmPassword().trim();

    if (!newPassword || !confirmPassword) {
      this.error.set('Enter and confirm the new password to continue.');
      return;
    }

    if (newPassword.length < 8) {
      this.error.set('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.error.set('Passwords do not match.');
      return;
    }

    this.loading.set(true);
    try {
      await this.auth.changePassword(newPassword);
      this.success.set('Password updated successfully.');
      this.snack.open('Password updated successfully', 'OK', { duration: 2800 });

      if (this.isForced()) {
        await this.router.navigateByUrl('/app/dashboard');
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to update password');
    } finally {
      this.loading.set(false);
    }
  }

  async goBack() {
    if (this.isForced()) {
      this.auth.logout();
      await this.router.navigateByUrl('/login');
      return;
    }

    await this.router.navigateByUrl('/app/dashboard');
  }
}
