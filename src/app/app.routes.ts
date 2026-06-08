import { Routes } from '@angular/router';

import { Dashboard } from './features/dashboard/dashboard';
import { Labs } from './features/labs/labs';
import { Machines } from './features/machines/machines';
import { LiveMonitor } from './features/live-monitor/live-monitor';
import { Mappings } from './features/mappings/mappings';
import { RoutingRules } from './features/routing-rules/routing-rules';
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
import { ParsedResults } from './features/parsed-results/parsed-results';
import { NormalizedResults } from './features/normalized-results/normalized-results';
import { PendingApprovals } from './features/pending-approvals/pending-approvals';
import { ApprovalHistory } from './features/approval-history/approval-history';
import { OutboundQueue } from './features/outbound-queue/outbound-queue';
import { DeliveryHistory } from './features/delivery-history/delivery-history';
import { ApprovalPolicies } from './features/approval-policies/approval-policies';
import { Targets } from './features/targets/targets';
import { LisTestOrderProfiles } from './features/lis-test-order-profiles/lis-test-order-profiles';

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
            { path: 'lis-test-order-profiles', component: LisTestOrderProfiles, canActivate: [passwordChangeGuard] },
            { path: 'routes', redirectTo: 'routing-rules', pathMatch: 'full' },
            { path: 'routing-rules', component: RoutingRules, canActivate: [passwordChangeGuard] },
            { path: 'targets', component: Targets, canActivate: [passwordChangeGuard] },

            { path: 'outbox', component: Outbox, canActivate: [passwordChangeGuard] },

            { path: 'parsed-results', component: ParsedResults, canActivate: [passwordChangeGuard] },
            {
                path: 'normalized-results',
                component: NormalizedResults,
                canActivate: [passwordChangeGuard],
            },
            {
                path: 'pending-approvals',
                component: PendingApprovals,
                canActivate: [passwordChangeGuard, permissionGuard('RESULT_APPROVE')],
            },
            {
                path: 'approval-history',
                component: ApprovalHistory,
                canActivate: [passwordChangeGuard, permissionGuard('RESULT_APPROVE')],
            },
            {
                path: 'outbound-queue',
                component: OutboundQueue,
                canActivate: [passwordChangeGuard, permissionGuard('RESULT_ROUTE')],
            },
            {
                path: 'delivery-history',
                component: DeliveryHistory,
                canActivate: [passwordChangeGuard, permissionGuard('RESULT_ROUTE')],
            },
            {
                path: 'approval-policies',
                component: ApprovalPolicies,
                canActivate: [passwordChangeGuard, permissionGuard('APPROVAL_POLICY_WRITE')],
            },
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
            { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
            { path: '**', redirectTo: 'dashboard' },
        ],
    },
];
