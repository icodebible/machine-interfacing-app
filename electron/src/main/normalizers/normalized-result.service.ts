import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { getCurrentActorStamp } from '../services/actor-context.service';
import { NormalizedLabResult } from './normalizer.interface';
import { ResultFlowService } from '../services/result-flow.service';

const nowIso = () => new Date().toISOString();

function ensureColumn(
    db: ReturnType<typeof getDb>,
    table: string,
    column: string,
    definitionSql: string,
) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
    }
}

export class NormalizedResultService {
    private readonly flow = new ResultFlowService();

    ensureTable() {
        const db = getDb();

        db.exec(`
            CREATE TABLE IF NOT EXISTS normalized_lab_results (
                id TEXT PRIMARY KEY,
                machine_id TEXT NOT NULL,
                protocol TEXT NOT NULL,
                sample_id TEXT,
                patient_id TEXT,
                patient_name TEXT,
                order_id TEXT,
                test_code TEXT,
                test_name TEXT,
                value TEXT,
                units TEXT,
                reference_range TEXT,
                abnormal_flag TEXT,
                observed_at TEXT,
                source_message_type TEXT,
                summary TEXT,
                data_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                created_by_user_id TEXT,
                created_by_username TEXT
            );

            CREATE INDEX IF NOT EXISTS idx_normalized_lab_results_machine_id
                ON normalized_lab_results(machine_id);

            CREATE INDEX IF NOT EXISTS idx_normalized_lab_results_created_at
                ON normalized_lab_results(created_at);
            `);

        ensureColumn(db, 'normalized_lab_results', 'created_by_user_id', 'TEXT');
        ensureColumn(db, 'normalized_lab_results', 'created_by_username', 'TEXT');
    }

    create(result: NormalizedLabResult) {
        const db = getDb();
        const actor = getCurrentActorStamp();
        const id = randomUUID();

        db.prepare(
            `
                INSERT INTO normalized_lab_results (
                id,
                machine_id,
                protocol,
                sample_id,
                patient_id,
                patient_name,
                order_id,
                test_code,
                test_name,
                value,
                units,
                reference_range,
                abnormal_flag,
                observed_at,
                source_message_type,
                summary,
                data_json,
                created_at,
                created_by_user_id,
                created_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            id,
            result.machineId,
            result.protocol,
            result.sampleId ?? null,
            result.patientId ?? null,
            result.patientName ?? null,
            result.orderId ?? null,
            result.testCode ?? null,
            result.testName ?? null,
            result.value ?? null,
            result.units ?? null,
            result.referenceRange ?? null,
            result.abnormalFlag ?? null,
            result.observedAt ?? null,
            result.sourceMessageType ?? null,
            result.summary ?? null,
            JSON.stringify(result.data ?? {}),
            nowIso(),
            actor.userId,
            actor.username,
        );

        // Advance the workflow exactly once using the inserted normalized result id.
        this.flow.advanceAfterNormalization(id);
        return { id };
    }

    listByMachine(machineId: string, limit = 50) {
        const db = getDb();
        return db
            .prepare(
                `
                SELECT *
                FROM normalized_lab_results
                WHERE machine_id = ?
                ORDER BY created_at DESC
                LIMIT ?
                `,
            )
            .all(machineId, limit);
    }
}
