import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { logEvent } from '../logging/auditLog';

const nowIso = () => new Date().toISOString();

export type LabDto = {
    code?: string;
    name: string;
    location?: string;
    description?: string;
    is_active?: number;
};

export class LabsService {
    list() {
        const db = getDb();
        return db.prepare(`SELECT * FROM labs ORDER BY name ASC`).all();
    }

    create(dto: LabDto) {
        const db = getDb();
        const id = randomUUID();
        const ts = nowIso();

        db.prepare(`
      INSERT INTO labs (id, code, name, location, description, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            id,
            dto.code ?? null,
            dto.name,
            dto.location ?? null,
            dto.description ?? null,
            dto.is_active ?? 1,
            ts,
            ts,
        );

        logEvent({ level: 'info', source: 'APP', entityType: 'lab', entityId: id, message: 'Lab created' });
        return { id };
    }

    update(id: string, dto: Partial<LabDto>) {
        const db = getDb();
        const ts = nowIso();

        const res = db.prepare(`
      UPDATE labs SET
        code = COALESCE(?, code),
        name = COALESCE(?, name),
        location = COALESCE(?, location),
        description = COALESCE(?, description),
        is_active = COALESCE(?, is_active),
        updated_at = ?
      WHERE id = ?
    `).run(
            dto.code ?? null,
            dto.name ?? null,
            dto.location ?? null,
            dto.description ?? null,
            dto.is_active ?? null,
            ts,
            id,
        );

        if (res.changes !== 1) throw new Error(`Lab update failed (id=${id})`);
        logEvent({ level: 'info', source: 'APP', entityType: 'lab', entityId: id, message: 'Lab updated' });
        return true;
    }

    delete(id: string) {
        const db = getDb();
        db.prepare(`DELETE FROM labs WHERE id = ?`).run(id);
        logEvent({ level: 'warn', source: 'APP', entityType: 'lab', entityId: id, message: 'Lab deleted' });
        return true;
    }
}