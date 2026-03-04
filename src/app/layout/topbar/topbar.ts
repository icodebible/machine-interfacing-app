import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-topbar',
  imports: [CommonModule, MatIconModule, MatMenuModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  constructor(
    private auth: AuthService,
    private router: Router,
    private snack: MatSnackBar,
  ) {}

  async logout() {
    // local session reset (v1 best practice)
    this.auth.logout();

    // navigate to login
    await this.router.navigateByUrl('/login');

    // subtle desktop feedback
    this.snack.open('Logged out', 'OK', { duration: 2500 });
  }
}
