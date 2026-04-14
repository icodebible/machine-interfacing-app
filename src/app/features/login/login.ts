import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  username = 'admin';
  password = '';
  loading = false;
  error = '';
  showPassword = false;
  capsLockOn = false;

  readonly environmentLabel = 'Local secure workstation';

  readonly highlights = [
    'Machine connectivity and simulation',
    'Parsing and normalization pipeline',
    'Approval, queue, and delivery traceability',
  ];

  constructor(
    private auth: AuthService,
    private router: Router,
  ) { }

  @HostListener('window:keydown', ['$event'])
  @HostListener('window:keyup', ['$event'])
  onKeyboardState(event: KeyboardEvent) {
    const capsState = event.getModifierState?.('CapsLock');
    if (typeof capsState === 'boolean') {
      this.capsLockOn = capsState;
    }
  }

  async onLogin() {
    this.error = '';

    const username = this.username.trim();
    if (!username || !this.password) {
      this.error = 'Enter your username and password to continue.';
      return;
    }

    this.loading = true;
    try {
      const user = await this.auth.login(username, this.password);
      if (user.mustChangePassword) {
        await this.router.navigateByUrl('/app/settings?mode=change-password');
      } else {
        await this.router.navigateByUrl('/app/dashboard');
      }
    } catch (e: any) {
      this.error = e?.message ?? 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  clearError() {
    if (this.error) this.error = '';
  }
}
