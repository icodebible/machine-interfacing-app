"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const auth_service_1 = require("../auth/auth.service");
const auditLog_1 = require("../logging/auditLog");
const nowIso = () => new Date().toISOString();
class RolesService {
    list() {
        const db = (0, db_1.getDb)();
        const rows = db
            .prepare(`SELECT r.*, COUNT(DISTINCT ur.user_id) AS user_count,
                    GROUP_CONCAT(DISTINCT ra.authority_code) AS authority_codes_csv
                FROM roles r
                LEFT JOIN user_roles ur ON ur.role_id = r.id
                LEFT JOIN role_authorities ra ON ra.role_id = r.id
                GROUP BY r.id
                ORDER BY r.name ASC`)
            .all();
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
        return [...auth_service_1.ALL_AUTHORITIES];
    }
    create(dto) {
        const db = (0, db_1.getDb)();
        const name = String(dto.name ?? '').trim();
        if (!name)
            throw new Error('Role name is required');
        const exists = db.prepare(`SELECT id FROM roles WHERE name = ? LIMIT 1`).get(name);
        if (exists)
            throw new Error('Role name already exists');
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        db.prepare(`INSERT INTO roles (id, name, description, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?)`).run(id, name, dto.description ?? null, ts, ts);
        this.replaceAuthorities(id, dto.authority_codes ?? []);
        const created = this.list().find((row) => row.id === id);
        (0, auditLog_1.logEvent)({
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
    update(id, dto) {
        const db = (0, db_1.getDb)();
        const current = db.prepare(`SELECT * FROM roles WHERE id = ? LIMIT 1`).get(id);
        if (!current)
            throw new Error('Role not found');
        const isSystemRole = String(current.name).toUpperCase() === 'SUPER_ADMIN';
        const name = dto.name != null ? String(dto.name).trim() : null;
        if (name === '')
            throw new Error('Role name cannot be blank');
        if (isSystemRole && name && name !== current.name) {
            throw new Error('SUPER_ADMIN role name cannot be changed');
        }
        if (name && name !== current.name) {
            const exists = db
                .prepare(`SELECT id FROM roles WHERE name = ? AND id <> ? LIMIT 1`)
                .get(name, id);
            if (exists)
                throw new Error('Role name already exists');
        }
        db.prepare(`UPDATE roles
            SET name = COALESCE(?, name),
                description = COALESCE(?, description),
                updated_at = ?
            WHERE id = ?`).run(name, dto.description ?? null, nowIso(), id);
        if (dto.authority_codes) {
            if (isSystemRole)
                throw new Error('SUPER_ADMIN authorities are system-managed and cannot be changed here');
            this.replaceAuthorities(id, dto.authority_codes);
        }
        const updated = this.list().find((row) => row.id === id);
        (0, auditLog_1.logEvent)({
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
    delete(id) {
        const db = (0, db_1.getDb)();
        const current = db.prepare(`SELECT * FROM roles WHERE id = ? LIMIT 1`).get(id);
        if (!current)
            return true;
        if (String(current.name).toUpperCase() === 'SUPER_ADMIN') {
            throw new Error('SUPER_ADMIN cannot be deleted');
        }
        db.prepare(`DELETE FROM roles WHERE id = ?`).run(id);
        (0, auditLog_1.logEvent)({
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
    replaceAuthorities(roleId, authorityCodes) {
        const cleanCodes = Array.from(new Set((authorityCodes ?? []).filter((value) => auth_service_1.ALL_AUTHORITIES.includes(value))));
        const db = (0, db_1.getDb)();
        const tx = db.transaction(() => {
            db.prepare(`DELETE FROM role_authorities WHERE role_id = ?`).run(roleId);
            const insert = db.prepare(`INSERT OR IGNORE INTO role_authorities (role_id, authority_code) VALUES (?, ?)`);
            for (const code of cleanCodes)
                insert.run(roleId, code);
        });
        tx();
    }
}
exports.RolesService = RolesService;
