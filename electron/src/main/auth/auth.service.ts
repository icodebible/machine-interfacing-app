import { randomUUID } from 'crypto';
import { getDb } from '../db/db';

// Use argon2 if installed, otherwise fallback to bcryptjs
let argon2: any = null;
let bcrypt: any = null;

// try {
//     // eslint-disable-next-line @typescript-eslint/no-var-requires
//     argon2 = require('argon2');
// } catch { }
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    bcrypt = require('bcryptjs');
} catch { }

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
    | 'SUPER_ADMIN'
    | 'RESULT_VIEW'
    | 'RESULT_APPROVE'
    | 'RESULT_REJECT'
    | 'RESULT_ROUTE'
    | 'RESULT_REQUEUE'
    | 'APPROVAL_POLICY_READ'
    | 'APPROVAL_POLICY_WRITE'
    | 'TARGET_CONFIG_WRITE'
    | 'MAPPING_WRITE'
    | 'AUDIT_VIEW'
    | 'RESULT_VIEW_SENSITIVE';

export const ALL_AUTHORITIES: Authority[] = [
    'USERS_WRITE',
    'ROLES_WRITE',
    'LABS_WRITE',
    'MACHINES_WRITE',
    'MAPPINGS_WRITE',
    'ROUTES_WRITE',
    'VIEW_LOGS',
    'OUTBOX_MANAGE',
    'AUDIT_READ',
    'SUPER_ADMIN',
    'RESULT_VIEW',
    'RESULT_APPROVE',
    'RESULT_REJECT',
    'RESULT_ROUTE',
    'RESULT_REQUEUE',
    'APPROVAL_POLICY_READ',
    'APPROVAL_POLICY_WRITE',
    'TARGET_CONFIG_WRITE',
    'MAPPING_WRITE',
    'AUDIT_VIEW',
    'RESULT_VIEW_SENSITIVE',
];

export type SessionUser = {
    id: string;
    username: string;
    roles?: string[];
    authorities: Authority[];
    mustChangePassword: boolean;
};

function nowIso() {
    return new Date().toISOString();
}

// TODO: START: DEPRECATED APPROACH
// async function hashPassword(pw: string) {
//     if (argon2) return argon2.hash(pw);
//     if (bcrypt) return bcrypt.hash(pw, 10);
//     throw new Error('No password hasher available (install argon2 or bcryptjs)');
// }

// async function verifyPassword(hash: string, pw: string) {
//     if (argon2) return argon2.verify(hash, pw);
//     if (bcrypt) return bcrypt.compare(pw, hash);
//     throw new Error('No password verifier available (install argon2 or bcryptjs)');
// }
// TODO: END: DEPRECATED APPROACH

export async function hashPasswordValue(pw: string) {
    return bcrypt.hash(pw, 10);
}

async function verifyPassword(hash: string, pw: string) {
    return bcrypt.compare(pw, hash);
}

export class AuthService {
    async ensureBootstrapAdmin() {
        const db = getDb();

        // Always make sure schema exists first (you already do migrations)
        const getRole: any = db.prepare(`SELECT id FROM roles WHERE name = ?`);
        const getUser: any = db.prepare(`SELECT id FROM users WHERE username = ?`);

        // 1) Ensure SUPER_ADMIN role exists
        let roleId = getRole.get('SUPER_ADMIN')?.id as string | undefined;
        if (!roleId) {
            roleId = randomUUID();
            db.prepare(
                `INSERT INTO roles (id, name, description, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)`,
            ).run(roleId, 'SUPER_ADMIN', 'System super administrator', nowIso(), nowIso());
        }

        // 2) Ensure role authorities exist (idempotent)
        const authorities = ALL_AUTHORITIES;

        const insAuth = db.prepare(
            `INSERT OR IGNORE INTO role_authorities (role_id, authority_code)
            VALUES (?, ?)`,
        );

        const txAuth = db.transaction(() => {
            for (const a of authorities) insAuth.run(roleId, a);
        });
        txAuth();

        // 3) Ensure admin user exists
        let userId = getUser.get('admin')?.id as string | undefined;

        if (!userId) {
            userId = randomUUID();

            // IMPORTANT: use your hashPassword() here
            const passwordHash = await hashPasswordValue('admin');

            db.prepare(
                `INSERT INTO users
                (id, username, password_hash, must_change_password, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
            ).run(userId, 'admin', passwordHash, 1, 1, nowIso(), nowIso());
        }

        // 4) Ensure admin is assigned to SUPER_ADMIN role
        db.prepare(
            `INSERT OR IGNORE INTO user_roles (user_id, role_id)
            VALUES (?, ?)`,
        ).run(userId, roleId);

        // Optional marker (not required anymore)
        db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`).run('bootstrap_done', '1');
    }

    async login(username: string, password: string): Promise<{ user: SessionUser }> {
        const db = getDb();
        const u: any = db
            .prepare(
                `SELECT id, username, password_hash, must_change_password, is_active
                FROM users WHERE username = ?`,
            )
            .get(username);

        if (!u || u.is_active !== 1) throw new Error('Invalid username or password');

        const ok = await verifyPassword(u.password_hash, password);
        if (!ok) throw new Error('Invalid username or password');

        const roleRows = db
            .prepare(
                `SELECT DISTINCT r.name
                FROM user_roles ur
                JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_id = ?
                ORDER BY r.name ASC`,
            )
            .all(u.id);

        const authRows = db
            .prepare(
                `SELECT ra.authority_code
                FROM user_roles ur
                JOIN role_authorities ra ON ra.role_id = ur.role_id
                WHERE ur.user_id = ?`,
            )
            .all(u.id);

        const authorities = Array.from(
            new Set(authRows.map((r: any) => r.authority_code)),
        ) as Authority[];
        const roles = Array.from(new Set(roleRows.map((r: any) => r.name)));

        const snapshot: SessionUser = {
            id: u.id,
            username: u.username,
            roles,
            authorities,
            mustChangePassword: u.must_change_password === 1,
        };

        db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`).run(
            'current_session_user',
            JSON.stringify(snapshot),
        );

        return { user: snapshot };
    }

    currentUser(): SessionUser | null {
        const db = getDb();
        const row = db
            .prepare(`SELECT value FROM meta WHERE key = ? LIMIT 1`)
            .get('current_session_user') as any;
        if (!row?.value) return null;
        try {
            return JSON.parse(String(row.value)) as SessionUser;
        } catch {
            return null;
        }
    }

    async logout() {
        const db = getDb();
        db.prepare(`DELETE FROM meta WHERE key = ?`).run('current_session_user');
        return true;
    }

    async changePassword(userId: string, newPassword: string) {
        const db = getDb();
        const hash = await hashPasswordValue(newPassword);

        const res = db
            .prepare(
                `UPDATE users
                SET password_hash = ?, must_change_password = 0, updated_at = ?
                WHERE id = ?`,
            )
            .run(hash, nowIso(), userId);

        if (res.changes !== 1) {
            throw new Error(
                `Password update failed (changes=${res.changes}). User not found or session invalid.`,
            );
        }

        return true;
    }
}
