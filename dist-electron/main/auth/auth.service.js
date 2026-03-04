"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
// Use argon2 if installed, otherwise fallback to bcryptjs
let argon2 = null;
let bcrypt = null;
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    argon2 = require('argon2');
}
catch { }
try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    bcrypt = require('bcryptjs');
}
catch { }
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
async function hashPassword(pw) {
    return bcrypt.hash(pw, 10);
}
async function verifyPassword(hash, pw) {
    return bcrypt.compare(pw, hash);
}
class AuthService {
    async ensureBootstrapAdmin() {
        const db = (0, db_1.getDb)();
        // Always make sure schema exists first (you already do migrations)
        const getRole = db.prepare(`SELECT id FROM roles WHERE name = ?`);
        const getUser = db.prepare(`SELECT id FROM users WHERE username = ?`);
        // 1) Ensure SUPER_ADMIN role exists
        let roleId = getRole.get('SUPER_ADMIN')?.id;
        if (!roleId) {
            roleId = (0, crypto_1.randomUUID)();
            db.prepare(`INSERT INTO roles (id, name, description, created_at)
                VALUES (?, ?, ?, ?)`).run(roleId, 'SUPER_ADMIN', 'System super administrator', nowIso());
        }
        // 2) Ensure role authorities exist (idempotent)
        const authorities = [
            'SUPER_ADMIN',
            'USERS_WRITE',
            'ROLES_WRITE',
            'LABS_WRITE',
            'MACHINES_WRITE',
            'MAPPINGS_WRITE',
            'ROUTES_WRITE',
            'VIEW_LOGS',
            'OUTBOX_MANAGE',
            'AUDIT_READ',
        ];
        const insAuth = db.prepare(`INSERT OR IGNORE INTO role_authorities (role_id, authority_code)
            VALUES (?, ?)`);
        const txAuth = db.transaction(() => {
            for (const a of authorities)
                insAuth.run(roleId, a);
        });
        txAuth();
        // 3) Ensure admin user exists
        let userId = getUser.get('admin')?.id;
        if (!userId) {
            userId = (0, crypto_1.randomUUID)();
            // IMPORTANT: use your hashPassword() here
            const passwordHash = await hashPassword('admin');
            db.prepare(`INSERT INTO users
                (id, username, password_hash, must_change_password, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`).run(userId, 'admin', passwordHash, 1, 1, nowIso(), nowIso());
        }
        // 4) Ensure admin is assigned to SUPER_ADMIN role
        db.prepare(`INSERT OR IGNORE INTO user_roles (user_id, role_id)
            VALUES (?, ?)`).run(userId, roleId);
        // Optional marker (not required anymore)
        db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`).run('bootstrap_done', '1');
    }
    async login(username, password) {
        const db = (0, db_1.getDb)();
        const u = db
            .prepare(`SELECT id, username, password_hash, must_change_password, is_active
                FROM users WHERE username = ?`)
            .get(username);
        if (!u || u.is_active !== 1)
            throw new Error('Invalid username or password');
        const ok = await verifyPassword(u.password_hash, password);
        if (!ok)
            throw new Error('Invalid username or password');
        const authRows = db
            .prepare(`SELECT ra.authority_code
                FROM user_roles ur
                JOIN role_authorities ra ON ra.role_id = ur.role_id
                WHERE ur.user_id = ?`)
            .all(u.id);
        const authorities = Array.from(new Set(authRows.map((r) => r.authority_code)));
        return {
            user: {
                id: u.id,
                username: u.username,
                authorities,
                mustChangePassword: u.must_change_password === 1,
            },
        };
    }
    async changePassword(userId, newPassword) {
        const db = (0, db_1.getDb)();
        const hash = await hashPassword(newPassword);
        const res = db
            .prepare(`UPDATE users
                SET password_hash = ?, must_change_password = 0, updated_at = ?
                WHERE id = ?`)
            .run(hash, nowIso(), userId);
        if (res.changes !== 1) {
            throw new Error(`Password update failed (changes=${res.changes}). User not found or session invalid.`);
        }
        return true;
    }
}
exports.AuthService = AuthService;
