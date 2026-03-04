// import { Routes } from '@angular/router';
// import { MachineConsole } from './features/machine-console/machine-console';

// export const routes: Routes = [
//     { path: '', redirectTo: 'machine-console', pathMatch: 'full' },
//     { path: 'machine-console', component: MachineConsole },
// ];

import { Routes } from '@angular/router';

import { Dashboard } from './features/dashboard/dashboard';
import { Labs } from './features/labs/labs';
import { Machines } from './features/machines/machines';
import { LiveMonitor } from './features/live-monitor/live-monitor';
import { Mappings } from './features/mappings/mappings';
import { RoutesTargets } from './features/routes-targets/routes-targets';
import { Outbox } from './features/outbox/outbox';
import { Users } from './features/users/users';
import { Roles } from './features/roles/roles';
import { AuditLogs } from './features/audit-logs/audit-logs';
import { Settings } from './features/settings/settings';
import { Shell } from './layout/shell/shell';
import { authGuard } from './core/auth/auth.guard';
import { permissionGuard } from './core/auth/permission.guard';
import { Login } from './features/login/login';
import { passwordChangeGuard } from './core/auth/password-change.guard';

export const routes: Routes = [
    { path: '', redirectTo: 'app/dashboard', pathMatch: 'full' },
    { path: 'login', component: Login },

    {
        path: 'app',
        component: Shell,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: Dashboard, canActivate: [passwordChangeGuard] },
            { path: 'labs', component: Labs, canActivate: [passwordChangeGuard] },
            { path: 'machines', component: Machines, canActivate: [passwordChangeGuard] },
            { path: 'live-monitor', component: LiveMonitor, canActivate: [passwordChangeGuard] },
            { path: 'mappings', component: Mappings, canActivate: [passwordChangeGuard] },
            { path: 'routes', component: RoutesTargets, canActivate: [passwordChangeGuard] },
            { path: 'outbox', component: Outbox, canActivate: [passwordChangeGuard] },

            // Admin-only
            {
                path: 'users',
                component: Users,
                canActivate: [passwordChangeGuard, permissionGuard('USERS_WRITE')],
            },
            {
                path: 'roles',
                component: Roles,
                canActivate: [passwordChangeGuard, permissionGuard('ROLES_WRITE')],
            },
            {
                path: 'audit-logs',
                component: AuditLogs,
                canActivate: [passwordChangeGuard, permissionGuard('AUDIT_READ')],
            },

            { path: 'settings', component: Settings },
        ],
    },
];
