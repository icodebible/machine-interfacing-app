import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../core/auth/auth.service';

type NavItem = {
  label: string;
  icon: string;
  route: string;
  requires?: string;
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatDividerModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  private auth = inject(AuthService);

  user = computed(() => this.auth.user?.() ?? null);

  can = (code?: string) => {
    if (!code) return true;
    const u = this.user();
    return !!u?.authorities?.includes(code);
  };

  navMain: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard' },
    { label: 'Laboratories', icon: 'science', route: '/app/labs' },
    { label: 'Machines', icon: 'memory', route: '/app/machines' },
    { label: 'Live Monitor', icon: 'lan', route: '/app/live-monitor' },
    { label: 'Mappings', icon: 'rule', route: '/app/mappings' },
    { label: 'Routes', icon: 'route', route: '/app/routes' },
    { label: 'Outbox', icon: 'outbox', route: '/app/outbox' },
  ];

  navAdmin: NavItem[] = [
    { label: 'Users', icon: 'group', route: '/app/users', requires: 'USERS_WRITE' },
    { label: 'Roles', icon: 'admin_panel_settings', route: '/app/roles', requires: 'ROLES_WRITE' },
    { label: 'Audit Logs', icon: 'policy', route: '/app/audit-logs', requires: 'AUDIT_READ' },
  ];

  navBottom: NavItem[] = [{ label: 'Settings', icon: 'settings', route: '/app/settings' }];

  showAdmin = computed(() => this.navAdmin.some((i) => this.can(i.requires)));

  logout() {
    this.auth.logout();
  }
}