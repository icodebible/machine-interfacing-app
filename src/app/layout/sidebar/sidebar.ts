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

  navOperations: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/app/dashboard' },
    { label: 'Laboratories', icon: 'science', route: '/app/labs' },
    { label: 'Machines', icon: 'memory', route: '/app/machines' },
    { label: 'Live Monitor', icon: 'lan', route: '/app/live-monitor' },
  ];

  navResults: NavItem[] = [
    { label: 'Parsed Results', icon: 'receipt_long', route: '/app/parsed-results' },
    { label: 'Normalized Results', icon: 'science', route: '/app/normalized-results' },
    {
      label: 'Pending Approvals',
      icon: 'approval',
      route: '/app/pending-approvals',
      requires: 'RESULT_APPROVE',
    },
    {
      label: 'Approval History',
      icon: 'history',
      route: '/app/approval-history',
      requires: 'RESULT_APPROVE',
    },
  ];

  navRouting: NavItem[] = [
    // { label: 'Routing Rules', icon: 'alt_route', route: '/app/routing-rules' },
    { label: 'Targets', icon: 'route', route: '/app/targets' },
    { label: 'Transform Mappings', icon: 'rule', route: '/app/mappings' },
    {
      label: 'Outbound Queue',
      icon: 'outbox',
      route: '/app/outbound-queue',
      requires: 'RESULT_ROUTE',
    },
    {
      label: 'Delivery History',
      icon: 'local_shipping',
      route: '/app/delivery-history',
      requires: 'RESULT_ROUTE',
    },
    // { label: 'Legacy Outbox', icon: 'archive', route: '/app/outbox' },
  ];

  navAdmin: NavItem[] = [
    // { label: 'Users', icon: 'group', route: '/app/users', requires: 'USERS_WRITE' },
    // { label: 'Roles', icon: 'admin_panel_settings', route: '/app/roles', requires: 'ROLES_WRITE' },
    {
      label: 'Approval Policies',
      icon: 'fact_check',
      route: '/app/approval-policies',
      requires: 'APPROVAL_POLICY_WRITE',
    },
    { label: 'Audit Logs', icon: 'policy', route: '/app/audit-logs', requires: 'AUDIT_READ' },
  ];

  navBottom: NavItem[] = [{ label: 'Settings', icon: 'settings', route: '/app/settings' }];

  showResults = computed(() => this.navResults.some((i) => this.can(i.requires)));
  showRouting = computed(() => this.navRouting.some((i) => this.can(i.requires)));
  showAdmin = computed(() => this.navAdmin.some((i) => this.can(i.requires)));

  logout() {
    this.auth.logout();
  }
}
