import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { logEvent } from '../logging/auditLog';

const nowIso = () => new Date().toISOString();

export type TargetDto = {
    type: 'DHIS2' | 'OPENMRS';
    name: string;
    base_url: string;
    token?: string;
    enabled?: number;
};

export class TargetsService {
    list() {
        const db = getDb();
        return db.prepare(`SELECT * FROM targets ORDER BY type ASC, name ASC`).all();
    }

    create(dto: TargetDto) {
        const db = getDb();
        const id = randomUUID();
        const ts = nowIso();

        db.prepare(
            `
                INSERT INTO targets (id, type, name, base_url, token, enabled, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(id, dto.type, dto.name, dto.base_url, dto.token ?? null, dto.enabled ?? 1, ts, ts);

        logEvent({
            level: 'info',
            source: 'APP',
            entityType: 'target',
            entityId: id,
            message: 'Target created',
        });
        return { id };
    }

    update(id: string, dto: Partial<TargetDto>) {
        const db = getDb();
        const ts = nowIso();

        const res = db
            .prepare(
                `
                UPDATE targets SET
                    type = COALESCE(?, type),
                    name = COALESCE(?, name),
                    base_url = COALESCE(?, base_url),
                    token = COALESCE(?, token),
                    enabled = COALESCE(?, enabled),
                    updated_at = ?
                WHERE id = ?
                `,
            )
            .run(
                dto.type ?? null,
                dto.name ?? null,
                dto.base_url ?? null,
                dto.token ?? null,
                dto.enabled ?? null,
                ts,
                id,
            );

        if (res.changes !== 1) throw new Error(`Target update failed (id=${id})`);
        logEvent({
            level: 'info',
            source: 'APP',
            entityType: 'target',
            entityId: id,
            message: 'Target updated',
        });
        return true;
    }

    delete(id: string) {
        const db = getDb();
        db.prepare(`DELETE FROM targets WHERE id = ?`).run(id);
        logEvent({
            level: 'warn',
            source: 'APP',
            entityType: 'target',
            entityId: id,
            message: 'Target deleted',
        });
        return true;
    }

    test(id: string) {
        // Foundation: real HTTP test comes next (Milestone 4)
        logEvent({
            level: 'info',
            source: 'TARGET',
            entityType: 'target',
            entityId: id,
            message: 'Target test requested',
        });
        return { ok: true, message: 'Test queued (implement HTTP ping next milestone).' };
    }
}
