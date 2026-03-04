import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

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
  ],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  // mode = '';
  // newPassword = '';
  // confirmPassword = '';
  // loading = false;
  // error = '';

  // constructor(
  //   private route: ActivatedRoute,
  //   private router: Router,
  //   private auth: AuthService,
  // ) {
  //   this.route.queryParamMap.subscribe((p) => {
  //     this.mode = p.get('mode') ?? '';
  //   });
  // }

  // async onChangePassword() {
  //   this.error = '';

  //   if (this.newPassword.length < 8) {
  //     this.error = 'Password must be at least 8 characters.';
  //     return;
  //   }
  //   if (this.newPassword !== this.confirmPassword) {
  //     this.error = 'Passwords do not match.';
  //     return;
  //   }

  //   this.loading = true;
  //   try {
  //     await this.auth.changePassword(this.newPassword);
  //     await this.router.navigateByUrl('/app/dashboard');
  //   } catch (e: any) {
  //     this.error = e?.message ?? 'Failed to update password';
  //   } finally {
  //     this.loading = false;
  //   }
  // }

  mode = '';
  newPassword = '';
  confirmPassword = '';
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private snack: MatSnackBar,
  ) {
    this.route.queryParamMap.subscribe((p) => {
      this.mode = p.get('mode') ?? '';
    });
  }

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
}
