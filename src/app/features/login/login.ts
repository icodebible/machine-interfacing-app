// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-login',
//   imports: [],
//   templateUrl: './login.html',
//   styleUrl: './login.scss',
// })
// export class Login {

// }

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
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
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  username = 'admin';
  password = 'admin';
  loading = false;
  error = '';

  constructor(
    private auth: AuthService,
    private router: Router,
  ) { }

  async onLogin() {
    console.log('appAPI exists? 111', (window as any).appAPI);
    console.log('appAPI exists? 222', (window as any).appAPI);

    this.error = '';
    this.loading = true;
    try {
      const user = await this.auth.login(this.username.trim(), this.password);
      // If mustChangePassword, route to settings/password screen (we’ll build next)
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
}
