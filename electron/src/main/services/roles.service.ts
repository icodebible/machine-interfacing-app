import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { ALL_AUTHORITIES, Authority } from '../auth/auth.service';
import { logEvent } from '../logging/auditLog';

const nowIso = () => new Date().toISOString();

export type RoleDto = {
    name: string;
    description?: string | null;
    authority_codes?: Authority[];
};

export class RolesService {
    list() {
        const db = getDb();
        const rows = db
            .prepare(
                `SELECT r.*, COUNT(DISTINCT ur.user_id) AS user_count,
                    GROUP_CONCAT(DISTINCT ra.authority_code) AS authority_codes_csv
                FROM roles r
                LEFT JOIN user_roles ur ON ur.role_id = r.id
                LEFT JOIN role_authorities ra ON ra.role_id = r.id
                GROUP BY r.id
                ORDER BY r.name ASC`,
            )
            .all() as any[];

        return rows.map((row) => ({
            ...row,
            authority_codes: row.authority_codes_csv
                ? String(row.authority_codes_csv).split(',').sort()
                : [],
            user_count: Number(row.user_count ?? 0),
            is_system_role: String(row.name).toUpperCase() === 'SUPER_ADMIN',
            updated_at: row.updated_at ?? row.created_at,
        }));
    }

    authoritiesCatalog() {
        return [...ALL_AUTHORITIES];
    }

    create(dto: RoleDto) {
        const db = getDb();
        const name = String(dto.name ?? '').trim();
        if (!name) throw new Error('Role name is required');

        const exists = db.prepare(`SELECT id FROM roles WHERE name = ? LIMIT 1`).get(name) as any;
        if (exists) throw new Error('Role name already exists');

        const id = randomUUID();
        const ts = nowIso();

        db.prepare(
            `INSERT INTO roles (id, name, description, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)`,
        ).run(id, name, dto.description ?? null, ts, ts);

        this.replaceAuthorities(id, dto.authority_codes ?? []);
        const created = this.list().find((row: any) => row.id === id);

        logEvent({
            level: 'info',
            source: 'AUTH',
            entityType: 'role',
            entityId: id,
            resourceName: name,
            action: 'ROLE_CREATED',
            message: `Role created: ${name}`,
            payload: created,
        });

        return { id };
    }

    update(id: string, dto: Partial<RoleDto>) {
        const db = getDb();
        const current = db.prepare(`SELECT * FROM roles WHERE id = ? LIMIT 1`).get(id) as any;
        if (!current) throw new Error('Role not found');

        const isSystemRole = String(current.name).toUpperCase() === 'SUPER_ADMIN';
        const name = dto.name != null ? String(dto.name).trim() : null;
        if (name === '') throw new Error('Role name cannot be blank');
        if (isSystemRole && name && name !== current.name) {
            throw new Error('SUPER_ADMIN role name cannot be changed');
        }
        if (name && name !== current.name) {
            const exists = db
                .prepare(`SELECT id FROM roles WHERE name = ? AND id <> ? LIMIT 1`)
                .get(name, id) as any;
            if (exists) throw new Error('Role name already exists');
        }

        db.prepare(
            `UPDATE roles
            SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                updated_at = ?
            WHERE id = ?`,
        ).run(name, dto.description ?? null, nowIso(), id);

        if (dto.authority_codes) {
            if (isSystemRole)
                throw new Error('SUPER_ADMIN authorities are system-managed and cannot be changed here');
            this.replaceAuthorities(id, dto.authority_codes);
        }

        const updated = this.list().find((row: any) => row.id === id);

        logEvent({
            level: 'info',
            source: 'AUTH',
            entityType: 'role',
            entityId: id,
            resourceName: updated?.name ?? current.name,
            action: 'ROLE_UPDATED',
            message: `Role updated: ${updated?.name ?? current.name}`,
            payload: { changes: dto, current: updated },
        });

        return true;
    }

    delete(id: string) {
        const db = getDb();
        const current = db.prepare(`SELECT * FROM roles WHERE id = ? LIMIT 1`).get(id) as any;
        if (!current) return true;
        if (String(current.name).toUpperCase() === 'SUPER_ADMIN') {
            throw new Error('SUPER_ADMIN cannot be deleted');
        }

        db.prepare(`DELETE FROM roles WHERE id = ?`).run(id);

        logEvent({
            level: 'warn',
            source: 'AUTH',
            entityType: 'role',
            entityId: id,
            resourceName: current.name,
            action: 'ROLE_DELETED',
            message: `Role deleted: ${current.name}`,
            payload: { deleted: { id: current.id, name: current.name } },
        });

        return true;
    }

    private replaceAuthorities(roleId: string, authorityCodes: Authority[]) {
        const cleanCodes = Array.from(
            new Set(
                (authorityCodes ?? []).filter((value) => ALL_AUTHORITIES.includes(value as Authority)),
            ),
        ) as Authority[];

        const db = getDb();
        const tx = db.transaction(() => {
            db.prepare(`DELETE FROM role_authorities WHERE role_id = ?`).run(roleId);
            const insert = db.prepare(
                `INSERT OR IGNORE INTO role_authorities (role_id, authority_code) VALUES (?, ?)`,
            );
            for (const code of cleanCodes) insert.run(roleId, code);
        });
        tx();
    }
}
