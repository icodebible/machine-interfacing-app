// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
// import { getCurrentActorStamp } from './actor-context.service';
// const nowIso = () => new Date().toISOString();

// export type MachineSimulationProtocol = 'HL7' | 'ASTM' | 'RAW';

// export type MachineSimulationUseCaseStatus = 'ACTIVE' | 'DISABLED';

// export type MachineSimulationUseCase = {
//     id: string;
//     machine_id?: string | null;
//     code: string;
//     name: string;
//     description?: string | null;
//     test_order_code?: string | null;
//     test_order_name?: string | null;
//     protocol: MachineSimulationProtocol;
//     message_type: string;
//     sample_message: string;
//     variables_json?: string | null;
//     expected_codes_json?: string | null;
//     status: MachineSimulationUseCaseStatus;
//     sort_order: number;
//     created_at: string;
//     updated_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
//     updated_by_user_id?: string | null;
//     updated_by_username?: string | null;
// };

// export type MachineSimulationUseCaseInput = {
//     id?: string | null;
//     machine_id?: string | null;
//     code?: string | null;
//     name: string;
//     description?: string | null;
//     test_order_code?: string | null;
//     test_order_name?: string | null;
//     protocol: MachineSimulationProtocol;
//     message_type: string;
//     sample_message: string;
//     variables?: Record<string, string | number | boolean | null>;
//     expected_codes?: string[];
//     status?: MachineSimulationUseCaseStatus;
//     sort_order?: number | null;
// };

// export type MachineSimulationRunRow = {
//     id: string;
//     machine_id: string;
//     use_case_id?: string | null;
//     use_case_name?: string | null;
//     protocol: MachineSimulationProtocol;
//     message_type: string;
//     payload_preview?: string | null;
//     result_status: 'SUCCESS' | 'FAILED';
//     result_message?: string | null;
//     logs_json?: string | null;
//     created_at: string;
//     created_by_user_id?: string | null;
//     created_by_username?: string | null;
// };

// function ensureColumn(db: ReturnType<typeof getDb>, table: string, column: string, definitionSql: string) {
//     const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
//     if (!cols.some((c) => c.name === column)) {
//         db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
//     }
// }

// function safeJson(value: unknown) {
//     try {
//         return JSON.stringify(value ?? null);
//     } catch {
//         return 'null';
//     }
// }

// function parseJson<T>(value: string | null | undefined, fallback: T): T {
//     if (!value) return fallback;
//     try {
//         return JSON.parse(value) as T;
//     } catch {
//         return fallback;
//     }
// }

// function slug(value: string) {
//     return String(value || 'SIMULATION')
//         .trim()
//         .toUpperCase()
//         .replace(/[^A-Z0-9]+/g, '_')
//         .replace(/^_+|_+$/g, '') || 'SIMULATION';
// }

// export class MachineSimulationUseCaseService {
//     ensureTable() {
//         const db = getDb();
//         db.exec(`
//             CREATE TABLE IF NOT EXISTS machine_simulation_use_cases (
//                 id TEXT PRIMARY KEY,
//                 machine_id TEXT,
//                 code TEXT NOT NULL,
//                 name TEXT NOT NULL,
//                 description TEXT,
//                 test_order_code TEXT,
//                 test_order_name TEXT,
//                 protocol TEXT NOT NULL,
//                 message_type TEXT NOT NULL,
//                 sample_message TEXT NOT NULL,
//                 variables_json TEXT,
//                 expected_codes_json TEXT,
//                 status TEXT NOT NULL DEFAULT 'ACTIVE',
//                 sort_order INTEGER NOT NULL DEFAULT 100,
//                 created_at TEXT NOT NULL,
//                 updated_at TEXT NOT NULL,
//                 created_by_user_id TEXT,
//                 created_by_username TEXT,
//                 updated_by_user_id TEXT,
//                 updated_by_username TEXT,
//                 FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
//             );

//             CREATE INDEX IF NOT EXISTS idx_machine_sim_use_cases_machine
//                 ON machine_simulation_use_cases(machine_id, status, sort_order, name);

//             CREATE INDEX IF NOT EXISTS idx_machine_sim_use_cases_protocol
//                 ON machine_simulation_use_cases(protocol, message_type);

//             CREATE TABLE IF NOT EXISTS machine_simulation_runs (
//                 id TEXT PRIMARY KEY,
//                 machine_id TEXT NOT NULL,
//                 use_case_id TEXT,
//                 use_case_name TEXT,
//                 protocol TEXT NOT NULL,
//                 message_type TEXT NOT NULL,
//                 payload_preview TEXT,
//                 result_status TEXT NOT NULL,
//                 result_message TEXT,
//                 logs_json TEXT,
//                 created_at TEXT NOT NULL,
//                 created_by_user_id TEXT,
//                 created_by_username TEXT,
//                 FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
//                 FOREIGN KEY (use_case_id) REFERENCES machine_simulation_use_cases(id) ON DELETE SET NULL
//             );

//             CREATE INDEX IF NOT EXISTS idx_machine_sim_runs_machine
//                 ON machine_simulation_runs(machine_id, created_at);
//         `);

//         ensureColumn(db, 'machine_simulation_use_cases', 'test_order_code', 'TEXT');
//         ensureColumn(db, 'machine_simulation_use_cases', 'test_order_name', 'TEXT');
//         ensureColumn(db, 'machine_simulation_use_cases', 'variables_json', 'TEXT');
//         ensureColumn(db, 'machine_simulation_use_cases', 'expected_codes_json', 'TEXT');
//         ensureColumn(db, 'machine_simulation_use_cases', 'status', "TEXT NOT NULL DEFAULT 'ACTIVE'");
//         ensureColumn(db, 'machine_simulation_use_cases', 'sort_order', 'INTEGER NOT NULL DEFAULT 100');
//         ensureColumn(db, 'machine_simulation_runs', 'use_case_name', 'TEXT');
//         ensureColumn(db, 'machine_simulation_runs', 'logs_json', 'TEXT');
//     }

//     list(machineId?: string | null): MachineSimulationUseCase[] {
//         this.ensureTable();
//         const db = getDb();
//         const rows = db.prepare(
//             `
//                 SELECT *
//                 FROM machine_simulation_use_cases
//                 WHERE (? IS NULL OR machine_id IS NULL OR machine_id = ?)
//                 ORDER BY COALESCE(machine_id, ''), sort_order ASC, name ASC
//             `,
//         ).all(machineId ?? null, machineId ?? null) as MachineSimulationUseCase[];

//         if (!rows.length) {
//             this.seedDefaults();
//             return this.list(machineId);
//         }
//         return rows;
//     }

//     get(id: string): MachineSimulationUseCase | undefined {
//         this.ensureTable();
//         return getDb()
//             .prepare(`SELECT * FROM machine_simulation_use_cases WHERE id = ?`)
//             .get(id) as MachineSimulationUseCase | undefined;
//     }

//     save(input: MachineSimulationUseCaseInput): MachineSimulationUseCase {
//         this.ensureTable();
//         const db = getDb();
//         const actor = getCurrentActorStamp();
//         const ts = nowIso();
//         const id = input.id || randomUUID();
//         const code = slug(input.code || input.name);
//         const variablesJson = safeJson(input.variables ?? {});
//         const expectedCodesJson = safeJson(input.expected_codes ?? []);

//         const existing = input.id ? this.get(input.id) : null;
//         if (existing) {
//             db.prepare(
//                 `
//                     UPDATE machine_simulation_use_cases
//                     SET machine_id = ?, code = ?, name = ?, description = ?, test_order_code = ?,
//                         test_order_name = ?, protocol = ?, message_type = ?, sample_message = ?,
//                         variables_json = ?, expected_codes_json = ?, status = ?, sort_order = ?,
//                         updated_at = ?, updated_by_user_id = ?, updated_by_username = ?
//                     WHERE id = ?
//                 `,
//             ).run(
//                 input.machine_id ?? null,
//                 code,
//                 input.name,
//                 input.description ?? null,
//                 input.test_order_code ?? null,
//                 input.test_order_name ?? null,
//                 input.protocol,
//                 input.message_type,
//                 input.sample_message,
//                 variablesJson,
//                 expectedCodesJson,
//                 input.status ?? 'ACTIVE',
//                 input.sort_order ?? 100,
//                 ts,
//                 actor.userId,
//                 actor.username,
//                 id,
//             );
//         } else {
//             db.prepare(
//                 `
//                     INSERT INTO machine_simulation_use_cases (
//                         id, machine_id, code, name, description, test_order_code, test_order_name,
//                         protocol, message_type, sample_message, variables_json, expected_codes_json,
//                         status, sort_order, created_at, updated_at,
//                         created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
//                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//                 `,
//             ).run(
//                 id,
//                 input.machine_id ?? null,
//                 code,
//                 input.name,
//                 input.description ?? null,
//                 input.test_order_code ?? null,
//                 input.test_order_name ?? null,
//                 input.protocol,
//                 input.message_type,
//                 input.sample_message,
//                 variablesJson,
//                 expectedCodesJson,
//                 input.status ?? 'ACTIVE',
//                 input.sort_order ?? 100,
//                 ts,
//                 ts,
//                 actor.userId,
//                 actor.username,
//                 actor.userId,
//                 actor.username,
//             );
//         }

//         return this.get(id)!;
//     }

//     delete(id: string): boolean {
//         this.ensureTable();
//         getDb().prepare(`DELETE FROM machine_simulation_use_cases WHERE id = ?`).run(id);
//         return true;
//     }

//     recordRun(row: Omit<MachineSimulationRunRow, 'id' | 'created_at' | 'created_by_user_id' | 'created_by_username'>): { id: string } {
//         this.ensureTable();
//         const db = getDb();
//         const actor = getCurrentActorStamp();
//         const id = randomUUID();
//         db.prepare(
//             `
//                 INSERT INTO machine_simulation_runs (
//                     id, machine_id, use_case_id, use_case_name, protocol, message_type,
//                     payload_preview, result_status, result_message, logs_json,
//                     created_at, created_by_user_id, created_by_username
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             row.machine_id,
//             row.use_case_id ?? null,
//             row.use_case_name ?? null,
//             row.protocol,
//             row.message_type,
//             row.payload_preview ?? null,
//             row.result_status,
//             row.result_message ?? null,
//             row.logs_json ?? null,
//             nowIso(),
//             actor.userId,
//             actor.username,
//         );
//         return { id };
//     }

//     listRuns(machineId: string, limit = 25): MachineSimulationRunRow[] {
//         this.ensureTable();
//         return getDb()
//             .prepare(
//                 `
//                     SELECT *
//                     FROM machine_simulation_runs
//                     WHERE machine_id = ?
//                     ORDER BY created_at DESC
//                     LIMIT ?
//                 `,
//             )
//             .all(machineId, limit) as MachineSimulationRunRow[];
//     }

//     seedDefaults(): void {
//         this.ensureTable();
//         const existing = getDb().prepare(`SELECT COUNT(*) AS count FROM machine_simulation_use_cases`).get() as { count: number };
//         if (existing.count > 0) return;

//         const defaults: MachineSimulationUseCaseInput[] = [
//             {
//                 name: 'COBAS HPV final result — HL7 OUL R22',
//                 code: 'COBAS_HPV_HL7_FINAL',
//                 description: 'Reusable HPV use case with HPV16, HPV18, and HRHPV coded observations.',
//                 test_order_code: '71432-9',
//                 test_order_name: 'Human Papilloma Virus DNA Test',
//                 protocol: 'HL7',
//                 message_type: 'OUL^R22^OUL_R22',
//                 expected_codes: ['HPV16', 'HPV18', 'HRHPV'],
//                 variables: {
//                     patientId: 'NPHL123',
//                     patientFamily: 'KISILI',
//                     patientGiven: 'SEIF',
//                     sampleId: 'NPHL/22/0000099',
//                     messageControlId: 'HPV-SIM-0001',
//                     messageDateTime: '20260520123045',
//                     observedAt: '20260520122500',
//                 },
//                 sample_message: `MSH|^~\\&|COBAS6800/8800||LIS||{{messageDateTime}}||OUL^R22^OUL_R22|{{messageControlId}}|P|2.5||||||ASCII|||ROC-06^ROCHE\nPID|1||{{patientId}}^^^NPHL||{{patientFamily}}^{{patientGiven}}||19850101|M\nSPM|1|{{sampleId}}||RCCM^RocheCellCollectionMedia^99ROC|||||||P||||||||||||||||\nOBR|1|{{sampleId}}||71432-9^HPV-GT^LN|||||||A||||||||||||||F\nOBX|1|CE|HPV16^HPV16^99LIS||POS^Positive^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|{{observedAt}}\nOBX|2|CE|HPV18^HPV18^99LIS||NEG^Negative^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|{{observedAt}}\nOBX|3|CE|HRHPV^Hr-HPV^99LIS||INVALID^Invalid.^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|{{observedAt}}`,
//                 sort_order: 10,
//             },
//             {
//                 name: 'Generic HL7 ORU final result',
//                 code: 'GENERIC_HL7_ORU_FINAL',
//                 test_order_code: 'GLU',
//                 test_order_name: 'Generic quantitative observation',
//                 protocol: 'HL7',
//                 message_type: 'ORU^R01',
//                 expected_codes: ['GLU'],
//                 variables: {
//                     patientId: 'PAT001',
//                     patientFamily: 'TEST',
//                     patientGiven: 'PATIENT',
//                     sampleId: 'SAMPLE-001',
//                     messageControlId: 'ORU-SIM-0001',
//                     messageDateTime: '20260520123045',
//                     observedAt: '20260520122500',
//                 },
//                 sample_message: `MSH|^~\\&|SIMULATOR||LIS||{{messageDateTime}}||ORU^R01|{{messageControlId}}|P|2.5\nPID|1||{{patientId}}^^^SIM||{{patientFamily}}^{{patientGiven}}||19850101|M\nOBR|1|{{sampleId}}||GLU^Glucose^99LIS|||||||||||||||||||F\nOBX|1|NM|GLU^Glucose^99LIS||5.6|mmol/L|3.9-6.1|N|||F||||||{{observedAt}}`,
//                 sort_order: 20,
//             },
//             {
//                 name: 'Raw ping / connectivity smoke test',
//                 code: 'RAW_PING',
//                 protocol: 'RAW',
//                 message_type: 'RAW_PING',
//                 expected_codes: [],
//                 variables: { sampleId: 'PING-001' },
//                 sample_message: `PING|{{sampleId}}|{{now}}`,
//                 sort_order: 30,
//             },
//         ];

//         for (const item of defaults) this.save(item);
//     }

//     variablesFor(row: Pick<MachineSimulationUseCase, 'variables_json'>): Record<string, string | number | boolean | null> {
//         return parseJson<Record<string, string | number | boolean | null>>(row.variables_json, {});
//     }

//     expectedCodesFor(row: Pick<MachineSimulationUseCase, 'expected_codes_json'>): string[] {
//         return parseJson<string[]>(row.expected_codes_json, []);
//     }
// }


import { randomUUID } from 'crypto';
import { getDb } from '../db/db';
import { getCurrentActorStamp } from './actor-context.service';
import { auditService } from './audit.service';

const nowIso = () => new Date().toISOString();

export type MachineSimulationProtocol = 'HL7' | 'ASTM' | 'RAW';

export type MachineSimulationUseCaseStatus = 'ACTIVE' | 'DISABLED';

export type MachineSimulationUseCase = {
    id: string;
    machine_id?: string | null;
    code: string;
    name: string;
    description?: string | null;
    test_order_code?: string | null;
    test_order_name?: string | null;
    protocol: MachineSimulationProtocol;
    message_type: string;
    sample_message: string;
    variables_json?: string | null;
    expected_codes_json?: string | null;
    status: MachineSimulationUseCaseStatus;
    sort_order: number;
    created_at: string;
    updated_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
    updated_by_user_id?: string | null;
    updated_by_username?: string | null;
};

export type MachineSimulationUseCaseInput = {
    id?: string | null;
    machine_id?: string | null;
    code?: string | null;
    name: string;
    description?: string | null;
    test_order_code?: string | null;
    test_order_name?: string | null;
    protocol: MachineSimulationProtocol;
    message_type: string;
    sample_message: string;
    variables?: Record<string, string | number | boolean | null>;
    expected_codes?: string[];
    status?: MachineSimulationUseCaseStatus;
    sort_order?: number | null;
};

export type MachineSimulationRunRow = {
    id: string;
    machine_id: string;
    use_case_id?: string | null;
    use_case_name?: string | null;
    protocol: MachineSimulationProtocol;
    message_type: string;
    payload_preview?: string | null;
    result_status: 'SUCCESS' | 'FAILED';
    result_message?: string | null;
    logs_json?: string | null;
    created_at: string;
    created_by_user_id?: string | null;
    created_by_username?: string | null;
};

function ensureColumn(db: ReturnType<typeof getDb>, table: string, column: string, definitionSql: string) {
    const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
    if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
    }
}

function safeJson(value: unknown) {
    try {
        return JSON.stringify(value ?? null);
    } catch {
        return 'null';
    }
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
    if (!value) return fallback;
    try {
        return JSON.parse(value) as T;
    } catch {
        return fallback;
    }
}

function slug(value: string) {
    return String(value || 'SIMULATION')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'SIMULATION';
}

export class MachineSimulationUseCaseService {
    ensureTable() {
        const db = getDb();
        db.exec(`
            CREATE TABLE IF NOT EXISTS machine_simulation_use_cases (
                id TEXT PRIMARY KEY,
                machine_id TEXT,
                code TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                test_order_code TEXT,
                test_order_name TEXT,
                protocol TEXT NOT NULL,
                message_type TEXT NOT NULL,
                sample_message TEXT NOT NULL,
                variables_json TEXT,
                expected_codes_json TEXT,
                status TEXT NOT NULL DEFAULT 'ACTIVE',
                sort_order INTEGER NOT NULL DEFAULT 100,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                created_by_user_id TEXT,
                created_by_username TEXT,
                updated_by_user_id TEXT,
                updated_by_username TEXT,
                FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_machine_sim_use_cases_machine
                ON machine_simulation_use_cases(machine_id, status, sort_order, name);

            CREATE INDEX IF NOT EXISTS idx_machine_sim_use_cases_protocol
                ON machine_simulation_use_cases(protocol, message_type);

            CREATE TABLE IF NOT EXISTS machine_simulation_runs (
                id TEXT PRIMARY KEY,
                machine_id TEXT NOT NULL,
                use_case_id TEXT,
                use_case_name TEXT,
                protocol TEXT NOT NULL,
                message_type TEXT NOT NULL,
                payload_preview TEXT,
                result_status TEXT NOT NULL,
                result_message TEXT,
                logs_json TEXT,
                created_at TEXT NOT NULL,
                created_by_user_id TEXT,
                created_by_username TEXT,
                FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
                FOREIGN KEY (use_case_id) REFERENCES machine_simulation_use_cases(id) ON DELETE SET NULL
            );

            CREATE INDEX IF NOT EXISTS idx_machine_sim_runs_machine
                ON machine_simulation_runs(machine_id, created_at);
        `);

        ensureColumn(db, 'machine_simulation_use_cases', 'test_order_code', 'TEXT');
        ensureColumn(db, 'machine_simulation_use_cases', 'test_order_name', 'TEXT');
        ensureColumn(db, 'machine_simulation_use_cases', 'variables_json', 'TEXT');
        ensureColumn(db, 'machine_simulation_use_cases', 'expected_codes_json', 'TEXT');
        ensureColumn(db, 'machine_simulation_use_cases', 'status', "TEXT NOT NULL DEFAULT 'ACTIVE'");
        ensureColumn(db, 'machine_simulation_use_cases', 'sort_order', 'INTEGER NOT NULL DEFAULT 100');
        ensureColumn(db, 'machine_simulation_runs', 'use_case_name', 'TEXT');
        ensureColumn(db, 'machine_simulation_runs', 'logs_json', 'TEXT');
    }

    list(machineId?: string | null): MachineSimulationUseCase[] {
        this.ensureTable();
        const db = getDb();
        const rows = db.prepare(
            `
                SELECT *
                FROM machine_simulation_use_cases
                WHERE (? IS NULL OR machine_id IS NULL OR machine_id = ?)
                ORDER BY COALESCE(machine_id, ''), sort_order ASC, name ASC
            `,
        ).all(machineId ?? null, machineId ?? null) as MachineSimulationUseCase[];

        if (!rows.length) {
            this.seedDefaults();
            return this.list(machineId);
        }
        return rows;
    }

    get(id: string): MachineSimulationUseCase | undefined {
        this.ensureTable();
        return getDb()
            .prepare(`SELECT * FROM machine_simulation_use_cases WHERE id = ?`)
            .get(id) as MachineSimulationUseCase | undefined;
    }

    save(input: MachineSimulationUseCaseInput): MachineSimulationUseCase {
        this.ensureTable();
        const db = getDb();
        const actor = getCurrentActorStamp();
        const ts = nowIso();
        const id = input.id || randomUUID();
        const code = slug(input.code || input.name);
        const variablesJson = safeJson(input.variables ?? {});
        const expectedCodesJson = safeJson(input.expected_codes ?? []);

        const existing = input.id ? this.get(input.id) : null;
        if (existing) {
            db.prepare(
                `
                    UPDATE machine_simulation_use_cases
                    SET machine_id = ?, code = ?, name = ?, description = ?, test_order_code = ?,
                        test_order_name = ?, protocol = ?, message_type = ?, sample_message = ?,
                        variables_json = ?, expected_codes_json = ?, status = ?, sort_order = ?,
                        updated_at = ?, updated_by_user_id = ?, updated_by_username = ?
                    WHERE id = ?
                `,
            ).run(
                input.machine_id ?? null,
                code,
                input.name,
                input.description ?? null,
                input.test_order_code ?? null,
                input.test_order_name ?? null,
                input.protocol,
                input.message_type,
                input.sample_message,
                variablesJson,
                expectedCodesJson,
                input.status ?? 'ACTIVE',
                input.sort_order ?? 100,
                ts,
                actor.userId,
                actor.username,
                id,
            );
        } else {
            db.prepare(
                `
                    INSERT INTO machine_simulation_use_cases (
                        id, machine_id, code, name, description, test_order_code, test_order_name,
                        protocol, message_type, sample_message, variables_json, expected_codes_json,
                        status, sort_order, created_at, updated_at,
                        created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `,
            ).run(
                id,
                input.machine_id ?? null,
                code,
                input.name,
                input.description ?? null,
                input.test_order_code ?? null,
                input.test_order_name ?? null,
                input.protocol,
                input.message_type,
                input.sample_message,
                variablesJson,
                expectedCodesJson,
                input.status ?? 'ACTIVE',
                input.sort_order ?? 100,
                ts,
                ts,
                actor.userId,
                actor.username,
                actor.userId,
                actor.username,
            );
        }

        auditService.record({
            source: 'SIMULATION',
            category: 'SIMULATION',
            action: existing ? 'SIMULATION_USE_CASE_UPDATED' : 'SIMULATION_USE_CASE_CREATED',
            entityType: 'machine_simulation_use_case',
            entityId: id,
            entityLabel: input.name,
            summary: `${existing ? 'Updated' : 'Created'} simulation use case: ${input.name}`,
            details: { machine_id: input.machine_id ?? null, protocol: input.protocol, message_type: input.message_type, test_order_code: input.test_order_code ?? null },
            actor,
        });

        return this.get(id)!;
    }

    delete(id: string): boolean {
        this.ensureTable();
        getDb().prepare(`DELETE FROM machine_simulation_use_cases WHERE id = ?`).run(id);
        auditService.record({
            source: 'SIMULATION',
            category: 'SIMULATION',
            action: 'SIMULATION_USE_CASE_DELETED',
            severity: 'WARNING',
            entityType: 'machine_simulation_use_case',
            entityId: id,
            summary: 'Simulation use case deleted',
        });
        return true;
    }

    recordRun(row: Omit<MachineSimulationRunRow, 'id' | 'created_at' | 'created_by_user_id' | 'created_by_username'>): { id: string } {
        this.ensureTable();
        const db = getDb();
        const actor = getCurrentActorStamp();
        const id = randomUUID();
        db.prepare(
            `
                INSERT INTO machine_simulation_runs (
                    id, machine_id, use_case_id, use_case_name, protocol, message_type,
                    payload_preview, result_status, result_message, logs_json,
                    created_at, created_by_user_id, created_by_username
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
        ).run(
            id,
            row.machine_id,
            row.use_case_id ?? null,
            row.use_case_name ?? null,
            row.protocol,
            row.message_type,
            row.payload_preview ?? null,
            row.result_status,
            row.result_message ?? null,
            row.logs_json ?? null,
            nowIso(),
            actor.userId,
            actor.username,
        );
        auditService.record({
            source: 'SIMULATION',
            category: 'SIMULATION',
            action: 'SIMULATION_USE_CASE_RUN_RECORDED',
            status: row.result_status === 'SUCCESS' ? 'SUCCESS' : 'FAILED',
            severity: row.result_status === 'SUCCESS' ? 'INFO' : 'WARNING',
            entityType: 'machine_simulation_run',
            entityId: id,
            entityLabel: row.use_case_name ?? row.message_type,
            summary: `Simulation run recorded: ${row.result_status}`,
            details: { machine_id: row.machine_id, use_case_id: row.use_case_id ?? null, protocol: row.protocol, message_type: row.message_type, result_message: row.result_message ?? null },
            actor,
        });
        return { id };
    }

    listRuns(machineId: string, limit = 25): MachineSimulationRunRow[] {
        this.ensureTable();
        return getDb()
            .prepare(
                `
                    SELECT *
                    FROM machine_simulation_runs
                    WHERE machine_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                `,
            )
            .all(machineId, limit) as MachineSimulationRunRow[];
    }

    seedDefaults(): void {
        this.ensureTable();
        const existing = getDb().prepare(`SELECT COUNT(*) AS count FROM machine_simulation_use_cases`).get() as { count: number };
        if (existing.count > 0) return;

        const defaults: MachineSimulationUseCaseInput[] = [
            {
                name: 'COBAS HPV final result — HL7 OUL R22',
                code: 'COBAS_HPV_HL7_FINAL',
                description: 'Reusable HPV use case with HPV16, HPV18, and HRHPV coded observations.',
                test_order_code: '71432-9',
                test_order_name: 'Human Papilloma Virus DNA Test',
                protocol: 'HL7',
                message_type: 'OUL^R22^OUL_R22',
                expected_codes: ['HPV16', 'HPV18', 'HRHPV'],
                variables: {
                    patientId: 'NPHL123',
                    patientFamily: 'KISILI',
                    patientGiven: 'SEIF',
                    sampleId: 'NPHL/22/0000099',
                    messageControlId: 'HPV-SIM-0001',
                    messageDateTime: '20260520123045',
                    observedAt: '20260520122500',
                },
                sample_message: `MSH|^~\\&|COBAS6800/8800||LIS||{{messageDateTime}}||OUL^R22^OUL_R22|{{messageControlId}}|P|2.5||||||ASCII|||ROC-06^ROCHE\nPID|1||{{patientId}}^^^NPHL||{{patientFamily}}^{{patientGiven}}||19850101|M\nSPM|1|{{sampleId}}||RCCM^RocheCellCollectionMedia^99ROC|||||||P||||||||||||||||\nOBR|1|{{sampleId}}||71432-9^HPV-GT^LN|||||||A||||||||||||||F\nOBX|1|CE|HPV16^HPV16^99LIS||POS^Positive^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|{{observedAt}}\nOBX|2|CE|HPV18^HPV18^99LIS||NEG^Negative^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|{{observedAt}}\nOBX|3|CE|HRHPV^Hr-HPV^99LIS||INVALID^Invalid.^99LIS||||||F|||||AUTO||C6800/8800^Roche^^~ID_000000000012076380^IM300-001794^^|{{observedAt}}`,
                sort_order: 10,
            },
            {
                name: 'Generic HL7 ORU final result',
                code: 'GENERIC_HL7_ORU_FINAL',
                test_order_code: 'GLU',
                test_order_name: 'Generic quantitative observation',
                protocol: 'HL7',
                message_type: 'ORU^R01',
                expected_codes: ['GLU'],
                variables: {
                    patientId: 'PAT001',
                    patientFamily: 'TEST',
                    patientGiven: 'PATIENT',
                    sampleId: 'SAMPLE-001',
                    messageControlId: 'ORU-SIM-0001',
                    messageDateTime: '20260520123045',
                    observedAt: '20260520122500',
                },
                sample_message: `MSH|^~\\&|SIMULATOR||LIS||{{messageDateTime}}||ORU^R01|{{messageControlId}}|P|2.5\nPID|1||{{patientId}}^^^SIM||{{patientFamily}}^{{patientGiven}}||19850101|M\nOBR|1|{{sampleId}}||GLU^Glucose^99LIS|||||||||||||||||||F\nOBX|1|NM|GLU^Glucose^99LIS||5.6|mmol/L|3.9-6.1|N|||F||||||{{observedAt}}`,
                sort_order: 20,
            },
            {
                name: 'Raw ping / connectivity smoke test',
                code: 'RAW_PING',
                protocol: 'RAW',
                message_type: 'RAW_PING',
                expected_codes: [],
                variables: { sampleId: 'PING-001' },
                sample_message: `PING|{{sampleId}}|{{now}}`,
                sort_order: 30,
            },
        ];

        for (const item of defaults) this.save(item);
    }

    variablesFor(row: Pick<MachineSimulationUseCase, 'variables_json'>): Record<string, string | number | boolean | null> {
        return parseJson<Record<string, string | number | boolean | null>>(row.variables_json, {});
    }

    expectedCodesFor(row: Pick<MachineSimulationUseCase, 'expected_codes_json'>): string[] {
        return parseJson<string[]>(row.expected_codes_json, []);
    }
}

