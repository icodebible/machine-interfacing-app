import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    MatCardModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  mode = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';
  currentUsername = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private snack: MatSnackBar,
  ) {
    this.currentUsername = this.auth.user()?.username ?? 'user';
    const u = this.auth.user();
    this.isForced = this.mode === 'change-password' && !!u?.mustChangePassword;

    this.route.queryParamMap.subscribe((p) => {
      this.mode = p.get('mode') ?? '';
    });
  }
  ngOnInit(): void {}

  async onChangePassword() {
    this.error = '';

    if (this.newPassword.length < 8) {
      this.error = 'Password must be at least 8 characters.';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match.';
      return;
    }

    this.loading = true;
    try {
      await this.auth.changePassword(this.newPassword);

      this.snack.open('Password updated successfully', 'OK', { duration: 3000 });

      // After forced change, go to dashboard
      await this.router.navigateByUrl('/app/dashboard');
    } catch (e: any) {
      this.error = e?.message ?? 'Failed to update password';
    } finally {
      this.loading = false;
    }
  }

  isForced = false; // set this on init based on route mode + user.mustChangePassword

  showNew = false;
  showConfirm = false;

  strengthPct = 10;
  strengthLabel = 'Weak';
  canSubmit = false;

  recomputeStrength() {
    const p = this.newPassword ?? '';
    let score = 0;
    if (p.length >= 8) score += 25;
    if (p.length >= 12) score += 15;
    if (/[A-Z]/.test(p)) score += 15;
    if (/[a-z]/.test(p)) score += 15;
    if (/\d/.test(p)) score += 15;
    if (/[^A-Za-z0-9]/.test(p)) score += 15;

    this.strengthPct = Math.min(100, Math.max(10, score));

    this.strengthLabel =
      this.strengthPct >= 80
        ? 'Strong'
        : this.strengthPct >= 55
          ? 'Good'
          : this.strengthPct >= 35
            ? 'Fair'
            : 'Weak';

    this.canSubmit =
      (this.newPassword?.length ?? 0) >= 8 && this.newPassword === this.confirmPassword;
  }

  goBack() {
    if (this.isForced) {
      this.auth.logout();
      this.router.navigateByUrl('/login');
    } else {
      this.router.navigateByUrl('/app/dashboard');
    }
  }
}
