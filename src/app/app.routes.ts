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

export const routes: Routes = [
    { path: '', redirectTo: 'app/dashboard', pathMatch: 'full' },
    { path: 'login', component: Login },

    {
        path: 'app',
        component: Shell,
        canActivate: [authGuard],
        children: [
            { path: 'dashboard', component: Dashboard },
            { path: 'labs', component: Labs },
            { path: 'machines', component: Machines },
            { path: 'live-monitor', component: LiveMonitor },
            { path: 'mappings', component: Mappings },
            { path: 'routes', component: RoutesTargets },
            { path: 'outbox', component: Outbox },

            // Admin-only
            {
                path: 'users',
                component: Users,
                canActivate: [permissionGuard('USERS_WRITE')],
            },
            {
                path: 'roles',
                component: Roles,
                canActivate: [permissionGuard('ROLES_WRITE')],
            },
            {
                path: 'audit-logs',
                component: AuditLogs,
                canActivate: [permissionGuard('AUDIT_READ')],
            },

            { path: 'settings', component: Settings },
        ],
    },
];
