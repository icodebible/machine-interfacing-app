import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { hashPasswordValue } from '../auth/auth.service';
import { logEvent } from '../logging/auditLog';

const nowIso = () => new Date().toISOString();

export type UserDto = {
    username: string;
    password: string;
    is_active?: number;
    must_change_password?: number;
    role_ids?: string[];
};

export class UsersService {
    list() {
        const db = getDb();
        const rows = db
            .prepare(
                `SELECT u.*,
                    GROUP_CONCAT(DISTINCT r.id) AS role_ids_csv,
                    GROUP_CONCAT(DISTINCT r.name) AS role_names_csv
                FROM users u
                LEFT JOIN user_roles ur ON ur.user_id = u.id
                LEFT JOIN roles r ON r.id = ur.role_id
                GROUP BY u.id
                ORDER BY u.username ASC`,
            )
            .all() as any[];

        return rows.map((row) => ({
            ...row,
            role_ids: row.role_ids_csv ? String(row.role_ids_csv).split(',') : [],
            role_names: row.role_names_csv ? String(row.role_names_csv).split(',') : [],
            authorities: this.authoritiesForUser(row.id),
            is_protected: String(row.username).toLowerCase() === 'admin',
        }));
    }

    async create(dto: UserDto) {
        const db = getDb();
        const username = String(dto.username ?? '').trim();
        const password = String(dto.password ?? '');
        if (!username) throw new Error('Username is required');
        if (!password || password.length < 4)
            throw new Error('Password must contain at least 4 characters');

        const existing = db
            .prepare(`SELECT id FROM users WHERE username = ? LIMIT 1`)
            .get(username) as any;
        if (existing) throw new Error('Username already exists');

        const id = randomUUID();
        const ts = nowIso();
        const hash = await hashPasswordValue(password);

        db.prepare(
            `INSERT INTO users (id, username, password_hash, must_change_password, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).run(id, username, hash, dto.must_change_password ?? 1, dto.is_active ?? 1, ts, ts);

        this.replaceUserRoles(id, dto.role_ids ?? []);
        const created = this.list().find((row: any) => row.id === id);

        logEvent({
            level: 'info',
            source: 'AUTH',
            entityType: 'user',
            entityId: id,
            resourceName: username,
            action: 'USER_CREATED',
            message: `User created: ${username}`,
            payload: created,
        });

        return { id };
    }

    update(id: string, dto: Partial<Omit<UserDto, 'password'>>) {
        const db = getDb();
        const current = db.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).get(id) as any;
        if (!current) throw new Error('User not found');

        const username = dto.username != null ? String(dto.username).trim() : null;
        if (username === '') throw new Error('Username cannot be blank');
        if (username && username !== current.username) {
            const exists = db
                .prepare(`SELECT id FROM users WHERE username = ? AND id <> ? LIMIT 1`)
                .get(username, id) as any;
            if (exists) throw new Error('Username already exists');
        }

        if (String(current.username).toLowerCase() === 'admin' && dto.is_active === 0) {
            throw new Error('The bootstrap admin user cannot be disabled');
        }

        db.prepare(
            `UPDATE users
            SET username = COALESCE(?, username),
                must_change_password = COALESCE(?, must_change_password),
                is_active = COALESCE(?, is_active),
                updated_at = ?
            WHERE id = ?`,
        ).run(username, dto.must_change_password ?? null, dto.is_active ?? null, nowIso(), id);

        if (dto.role_ids) this.replaceUserRoles(id, dto.role_ids);
        const updated = this.list().find((row: any) => row.id === id);

        logEvent({
            level: 'info',
            source: 'AUTH',
            entityType: 'user',
            entityId: id,
            resourceName: updated?.username ?? current.username,
            action: 'USER_UPDATED',
            message: `User updated: ${updated?.username ?? current.username}`,
            payload: { changes: dto, current: updated },
        });

        return true;
    }

    async resetPassword(id: string, newPassword: string) {
        const db = getDb();
        const current = db.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).get(id) as any;
        if (!current) throw new Error('User not found');
        if (!newPassword || newPassword.length < 4)
            throw new Error('Password must contain at least 4 characters');

        const hash = await hashPasswordValue(newPassword);
        db.prepare(
            `UPDATE users
            SET password_hash = ?, must_change_password = 1, updated_at = ?
            WHERE id = ?`,
        ).run(hash, nowIso(), id);

        logEvent({
            level: 'warn',
            source: 'AUTH',
            entityType: 'user',
            entityId: id,
            resourceName: current.username,
            action: 'USER_PASSWORD_RESET',
            message: `Password reset for user: ${current.username}`,
            payload: { username: current.username, must_change_password: 1 },
        });

        return true;
    }

    delete(id: string) {
        const db = getDb();
        const current = db.prepare(`SELECT * FROM users WHERE id = ? LIMIT 1`).get(id) as any;
        if (!current) return true;
        if (String(current.username).toLowerCase() === 'admin') {
            throw new Error('The bootstrap admin user cannot be deleted');
        }

        db.prepare(`DELETE FROM users WHERE id = ?`).run(id);

        logEvent({
            level: 'warn',
            source: 'AUTH',
            entityType: 'user',
            entityId: id,
            resourceName: current.username,
            action: 'USER_DELETED',
            message: `User deleted: ${current.username}`,
            payload: { deleted: { id: current.id, username: current.username } },
        });

        return true;
    }

    private replaceUserRoles(userId: string, roleIds: string[]) {
        const db = getDb();
        const cleanIds = Array.from(new Set((roleIds ?? []).filter(Boolean)));
        const tx = db.transaction(() => {
            db.prepare(`DELETE FROM user_roles WHERE user_id = ?`).run(userId);
            const insert = db.prepare(
                `INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)`,
            );
            for (const roleId of cleanIds) insert.run(userId, roleId);
        });
        tx();
    }

    private authoritiesForUser(userId: string) {
        const db = getDb();
        const rows = db
            .prepare(
                `SELECT DISTINCT ra.authority_code
                FROM user_roles ur
                JOIN role_authorities ra ON ra.role_id = ur.role_id
                WHERE ur.user_id = ?
                ORDER BY ra.authority_code ASC`,
            )
            .all(userId) as Array<{ authority_code: string }>;
        return rows.map((row) => row.authority_code);
    }
}
