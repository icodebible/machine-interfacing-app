export type Authority =
    | 'USERS_WRITE'
    | 'ROLES_WRITE'
    | 'LABS_WRITE'
    | 'MACHINES_WRITE'
    | 'MAPPINGS_WRITE'
    | 'ROUTES_WRITE'
    | 'VIEW_LOGS'
    | 'OUTBOX_MANAGE'
    | 'AUDIT_READ'
    | 'SUPER_ADMIN';