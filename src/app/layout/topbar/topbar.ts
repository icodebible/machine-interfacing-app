import { CommonModule } from '@angular/common';
import { Component, DestroyRef, EventEmitter, Output, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { filter } from 'rxjs/operators';

import { AuthService } from '../../core/auth/auth.service';

type RouteMeta = {
  title: string;
  subtitle: string;
};

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDividerModule, MatIconModule, MatMenuModule],
  templateUrl: './topbar.html',
  styleUrl: './topbar.scss',
})
export class Topbar {
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  @Output() toggleNav = new EventEmitter<void>();

  readonly pageTitle = signal('Dashboard');
  readonly pageSubtitle = signal('Operational overview and system navigation.');
  readonly userName = signal('Admin');
  readonly roleSummary = signal('');

  private readonly routeMeta: Record<string, RouteMeta> = {
    '/dashboard': {
      title: 'Dashboard',
      subtitle: 'Operational overview and system navigation.',
    },
    '/live-monitor': {
      title: 'Live Monitor',
      subtitle: 'Observe runtime health, activity, and machine traffic in real time.',
    },
    '/machines': {
      title: 'Machines',
      subtitle: 'Manage machine configuration, runtime actions, and diagnostics.',
    },
    '/labs': {
      title: 'Laboratories',
      subtitle: 'Manage laboratory ownership and machine grouping.',
    },
    '/parsed-results': {
      title: 'Parsed Results',
      subtitle: 'Inspect parser output before normalization.',
    },
    '/normalized-results': {
      title: 'Normalized Results',
      subtitle: 'Review canonical business results before delivery.',
    },
    '/pending-approvals': {
      title: 'Pending Approvals',
      subtitle: 'Review normalized results waiting for approval decisions.',
    },
    '/approval-history': {
      title: 'Approval History',
      subtitle: 'Review result approval and rejection actions across the system.',
    },
    '/approval-policies': {
      title: 'Approval Policies',
      subtitle: 'Configure approval scope and workflow rules.',
    },
    '/targets': {
      title: 'Targets',
      subtitle: 'Configure connectors, secrets, diagnostics, and preview behavior.',
    },
    '/mappings': {
      title: 'Transform Mappings',
      subtitle: 'Maintain target-specific payload mappings and validation rules.',
    },
    '/routing-rules': {
      title: 'Routing Rules',
      subtitle: 'Review routing logic and delivery decision paths.',
    },
    '/outbound-queue': {
      title: 'Outbound Queue',
      subtitle: 'Manage delivery queue state, retries, and operator actions.',
    },
    '/delivery-history': {
      title: 'Delivery History',
      subtitle: 'Track delivered and failed outbound results.',
    },
    '/audit-logs': {
      title: 'Audit Logs',
      subtitle: 'Trace system actions, actors, and operational activity.',
    },
    '/users': {
      title: 'Users',
      subtitle: 'Manage application users and accountability context.',
    },
    '/roles': {
      title: 'Roles',
      subtitle: 'Manage permissions, authority bundles, and governance rules.',
    },
    '/settings': {
      title: 'Settings',
      subtitle: 'Configure local platform behavior and workstation preferences.',
    },
    '/outbox': {
      title: 'Legacy Outbox',
      subtitle: 'Legacy routing workspace pending final decision.',
    },
  };

  constructor() {
    this.applyRouteMeta(this.router.url);
    this.restoreSessionPresentation();

    const sub = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.applyRouteMeta(event.urlAfterRedirects || event.url));

    this.destroyRef.onDestroy(() => sub.unsubscribe());
  }

  get initials(): string {
    const raw = this.userName().trim();
    if (!raw) return 'A';
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }

  openNav() {
    this.toggleNav.emit();
  }

  async logout() {
    this.auth.logout();
    await this.router.navigateByUrl('/login');
    this.snack.open('Logged out', 'OK', { duration: 2500 });
  }

  private applyRouteMeta(url: string) {
    const rawPath = (url || '').split('?')[0] || '/app/dashboard';
    const path = this.normalizeRoutePath(rawPath);

    const exact = this.routeMeta[path];
    if (exact) {
      this.pageTitle.set(exact.title);
      this.pageSubtitle.set(exact.subtitle);
      return;
    }

    const match = Object.keys(this.routeMeta)
      .sort((a, b) => b.length - a.length)
      .find((key) => path === key || path.startsWith(`${key}/`));

    const meta = match ? this.routeMeta[match] : this.routeMeta['/dashboard'];
    this.pageTitle.set(meta.title);
    this.pageSubtitle.set(meta.subtitle);
  }

  private normalizeRoutePath(path: string): string {
    if (!path) return '/dashboard';
    if (path === '/app' || path === '/app/') return '/dashboard';
    if (path.startsWith('/app/')) return path.slice(4) || '/dashboard';
    return path;
  }

  private restoreSessionPresentation() {
    const authAny = this.auth as any;

    try {
      const currentUser =
        typeof authAny.user === 'function'
          ? authAny.user()
          : typeof authAny.currentUser === 'function'
            ? authAny.currentUser()
            : null;

      const name = currentUser?.displayName || currentUser?.username || currentUser?.name;
      if (typeof name === 'string' && name.trim()) {
        this.userName.set(name.trim());
      }

      const roles = Array.isArray(currentUser?.roles) ? currentUser.roles.filter(Boolean) : [];
      const authorities = Array.isArray(currentUser?.authorities)
        ? currentUser.authorities.filter(Boolean)
        : [];

      if (roles.length > 0) {
        this.roleSummary.set(
          roles.length <= 2
            ? roles.join(', ')
            : `${roles.slice(0, 2).join(', ')} +${roles.length - 2}`,
        );
        return;
      }

      if (authorities.length > 0) {
        this.roleSummary.set(
          authorities.length === 1 ? authorities[0] : `${authorities.length} authorities`,
        );
        return;
      }
    } catch {
      // fallback below
    }

    try {
      const candidateKeys = ['currentUser', 'sessionUser', 'auth_user'];
      for (const key of candidateKeys) {
        const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const name = parsed?.displayName || parsed?.username || parsed?.name;
        const roles = Array.isArray(parsed?.roles) ? parsed.roles.filter(Boolean) : [];

        if (typeof name === 'string' && name.trim()) {
          this.userName.set(name.trim());
        }
        if (roles.length > 0) {
          this.roleSummary.set(
            roles.length <= 2
              ? roles.join(', ')
              : `${roles.slice(0, 2).join(', ')} +${roles.length - 2}`,
          );
        }
        return;
      }
    } catch {
      // keep defaults safely
    }
  }
}
