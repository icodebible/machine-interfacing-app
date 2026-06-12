"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LisTestOrderProfileService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const audit_service_1 = require("./audit.service");
const nowIso = () => new Date().toISOString();
function tableExists(db, table) {
    const row = db
        .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1`)
        .get(table);
    return !!row?.name;
}
function ensureColumn(db, table, column, definitionSql) {
    if (!tableExists(db, table))
        return;
    const cols = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!cols.some((c) => c.name === column)) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definitionSql}`);
    }
}
class LisTestOrderProfileService {
    ensureTables() {
        const db = (0, db_1.getDb)();
        db.exec(`
      CREATE TABLE IF NOT EXISTS lis_test_order_profiles (
        id TEXT PRIMARY KEY,
        target_id TEXT NOT NULL,
        profile_code TEXT NOT NULL,
        profile_name TEXT NOT NULL,
        order_concept_uuid TEXT,
        order_display TEXT,
        order_name_includes_json TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        created_by_user_id TEXT,
        created_by_username TEXT,
        updated_by_user_id TEXT,
        updated_by_username TEXT,
        FOREIGN KEY (target_id) REFERENCES targets(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_lis_test_order_profiles_target
      ON lis_test_order_profiles(target_id, enabled, profile_name);

      CREATE INDEX IF NOT EXISTS idx_lis_test_order_profiles_order_concept
      ON lis_test_order_profiles(order_concept_uuid);

      CREATE UNIQUE INDEX IF NOT EXISTS idx_lis_test_order_profiles_target_code
      ON lis_test_order_profiles(target_id, profile_code);

      CREATE TABLE IF NOT EXISTS lis_test_order_profile_parameters (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL,
        analyzer_code TEXT NOT NULL,
        display_name TEXT,
        concept_uuid TEXT,
        allocation_uuid TEXT,
        datatype TEXT,
        value_type TEXT NOT NULL DEFAULT 'text',
        required INTEGER NOT NULL DEFAULT 1,
        sort_order INTEGER NOT NULL DEFAULT 0,
        aliases_json TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (profile_id) REFERENCES lis_test_order_profiles(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_lis_test_order_profile_parameters_profile
      ON lis_test_order_profile_parameters(profile_id, sort_order, analyzer_code);

      CREATE INDEX IF NOT EXISTS idx_lis_test_order_profile_parameters_code
      ON lis_test_order_profile_parameters(analyzer_code);
    `);
        ensureColumn(db, 'lis_test_order_profiles', 'target_id', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'profile_code', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'profile_name', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'order_concept_uuid', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'order_display', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'order_name_includes_json', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'enabled', 'INTEGER NOT NULL DEFAULT 1');
        ensureColumn(db, 'lis_test_order_profiles', 'created_at', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'updated_at', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'created_by_user_id', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'created_by_username', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'updated_by_user_id', 'TEXT');
        ensureColumn(db, 'lis_test_order_profiles', 'updated_by_username', 'TEXT');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'profile_id', 'TEXT');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'analyzer_code', 'TEXT');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'display_name', 'TEXT');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'concept_uuid', 'TEXT');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'allocation_uuid', 'TEXT');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'datatype', 'TEXT');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'value_type', "TEXT NOT NULL DEFAULT 'text'");
        ensureColumn(db, 'lis_test_order_profile_parameters', 'required', 'INTEGER NOT NULL DEFAULT 1');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'sort_order', 'INTEGER NOT NULL DEFAULT 0');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'aliases_json', 'TEXT');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'created_at', 'TEXT');
        ensureColumn(db, 'lis_test_order_profile_parameters', 'updated_at', 'TEXT');
    }
    list(targetId) {
        this.ensureTables();
        const db = (0, db_1.getDb)();
        const rows = (targetId
            ? db
                .prepare(`
              SELECT p.*, t.name AS target_name, t.type AS target_type
              FROM lis_test_order_profiles p
              LEFT JOIN targets t ON t.id = p.target_id
              WHERE p.target_id = ?
              ORDER BY p.enabled DESC, p.profile_name ASC, p.profile_code ASC
            `)
                .all(targetId)
            : db
                .prepare(`
              SELECT p.*, t.name AS target_name, t.type AS target_type
              FROM lis_test_order_profiles p
              LEFT JOIN targets t ON t.id = p.target_id
              ORDER BY t.name ASC, p.enabled DESC, p.profile_name ASC, p.profile_code ASC
            `)
                .all());
        const ids = rows.map((row) => row.id).filter(Boolean);
        const paramsByProfile = this.parametersForProfiles(ids);
        return rows.map((row) => this.withParsedJson({ ...row, parameters: paramsByProfile.get(row.id) ?? [] }));
    }
    get(id) {
        this.ensureTables();
        const db = (0, db_1.getDb)();
        const row = db
            .prepare(`
          SELECT p.*, t.name AS target_name, t.type AS target_type
          FROM lis_test_order_profiles p
          LEFT JOIN targets t ON t.id = p.target_id
          WHERE p.id = ?
          LIMIT 1
        `)
            .get(id);
        if (!row)
            return null;
        const params = this.parametersForProfiles([id]).get(id) ?? [];
        return this.withParsedJson({ ...row, parameters: params });
    }
    save(input) {
        this.ensureTables();
        const db = (0, db_1.getDb)();
        let id = this.clean(input.id) || (0, crypto_1.randomUUID)();
        const targetId = this.clean(input.target_id ?? input.targetId);
        const profileCode = this.clean(input.profile_code ?? input.profileCode);
        const profileName = this.clean(input.profile_name ?? input.profileName);
        const orderConceptUuid = this.clean(input.order_concept_uuid ?? input.orderConceptUuid);
        const orderDisplay = this.clean(input.order_display ?? input.orderDisplay) || profileName;
        const includes = this.stringList(input.order_name_includes ?? input.orderNameIncludes);
        const enabled = this.numberFlag(input.enabled, 1);
        const actor = input.actor ?? null;
        if (!targetId)
            throw new Error('LIS target is required before saving a test-order profile.');
        if (!profileCode)
            throw new Error('Profile code is required.');
        if (!profileName)
            throw new Error('Profile name is required.');
        if (!orderConceptUuid && !orderDisplay && includes.length === 0) {
            throw new Error('Provide an order concept UUID or order-name match terms for this profile.');
        }
        this.assertTargetExists(targetId);
        const existingByCode = db
            .prepare(`SELECT id FROM lis_test_order_profiles WHERE target_id = ? AND profile_code = ? LIMIT 1`)
            .get(targetId, profileCode);
        if (!this.clean(input.id) && existingByCode?.id) {
            id = existingByCode.id;
        }
        else if (this.clean(input.id) && existingByCode?.id && existingByCode.id !== id) {
            throw new Error(`Another LIS test-order profile already uses code "${profileCode}" for this target.`);
        }
        const existingBeforeSave = db
            .prepare(`SELECT id FROM lis_test_order_profiles WHERE id = ? LIMIT 1`)
            .get(id);
        const parameters = (input.parameters ?? [])
            .map((item, index) => this.normalizeParameter(item, index))
            .filter((item) => item.analyzer_code);
        if (parameters.length === 0) {
            throw new Error('Add at least one analyzer parameter before saving this test-order profile.');
        }
        const ts = nowIso();
        const result = db.transaction(() => {
            const existing = db
                .prepare(`SELECT id FROM lis_test_order_profiles WHERE id = ? LIMIT 1`)
                .get(id);
            if (existing?.id) {
                db.prepare(`
            UPDATE lis_test_order_profiles
            SET target_id = ?,
                profile_code = ?,
                profile_name = ?,
                order_concept_uuid = ?,
                order_display = ?,
                order_name_includes_json = ?,
                enabled = ?,
                updated_at = ?,
                updated_by_user_id = ?,
                updated_by_username = ?
            WHERE id = ?
          `).run(targetId, profileCode, profileName, orderConceptUuid, orderDisplay, JSON.stringify(includes), enabled, ts, actor?.id ?? null, actor?.username ?? null, id);
            }
            else {
                db.prepare(`
            INSERT INTO lis_test_order_profiles (
              id, target_id, profile_code, profile_name, order_concept_uuid, order_display,
              order_name_includes_json, enabled, created_at, updated_at,
              created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(id, targetId, profileCode, profileName, orderConceptUuid, orderDisplay, JSON.stringify(includes), enabled, ts, ts, actor?.id ?? null, actor?.username ?? null, actor?.id ?? null, actor?.username ?? null);
            }
            db.prepare(`DELETE FROM lis_test_order_profile_parameters WHERE profile_id = ?`).run(id);
            const stmt = db.prepare(`
          INSERT INTO lis_test_order_profile_parameters (
            id, profile_id, analyzer_code, display_name, concept_uuid, allocation_uuid,
            datatype, value_type, required, sort_order, aliases_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
            for (const param of parameters) {
                stmt.run((0, crypto_1.randomUUID)(), id, param.analyzer_code, param.display_name, param.concept_uuid, param.allocation_uuid, param.datatype, param.value_type, param.required, param.sort_order, JSON.stringify(param.aliases), ts, ts);
            }
        });
        result();
        audit_service_1.auditService.record({
            source: 'LIS',
            category: 'LIS_PROFILE',
            action: existingBeforeSave?.id ? 'LIS_PROFILE_UPDATED' : 'LIS_PROFILE_CREATED',
            entityType: 'lis_test_order_profile',
            entityId: id,
            entityLabel: profileName,
            summary: `${existingBeforeSave?.id ? 'Updated' : 'Created'} LIS test-order profile: ${profileName}`,
            details: { targetId, profileCode, profileName, orderConceptUuid, parameterCount: parameters.length, enabled },
            actor,
        });
        return this.get(id);
    }
    setEnabled(id, enabled) {
        this.ensureTables();
        const db = (0, db_1.getDb)();
        const enabledFlag = this.numberFlag(enabled, 1);
        db.prepare(`UPDATE lis_test_order_profiles SET enabled = ?, updated_at = ? WHERE id = ?`).run(enabledFlag, nowIso(), id);
        audit_service_1.auditService.record({
            source: 'LIS',
            category: 'LIS_PROFILE',
            action: enabledFlag === 1 ? 'LIS_PROFILE_ENABLED' : 'LIS_PROFILE_DISABLED',
            entityType: 'lis_test_order_profile',
            entityId: id,
            summary: enabledFlag === 1 ? 'LIS test-order profile enabled' : 'LIS test-order profile disabled',
        });
        return true;
    }
    delete(id) {
        this.ensureTables();
        const db = (0, db_1.getDb)();
        db.prepare(`DELETE FROM lis_test_order_profiles WHERE id = ?`).run(id);
        audit_service_1.auditService.record({
            source: 'LIS',
            category: 'LIS_PROFILE',
            action: 'LIS_PROFILE_DELETED',
            severity: 'WARNING',
            entityType: 'lis_test_order_profile',
            entityId: id,
            summary: 'LIS test-order profile deleted',
        });
        return true;
    }
    parametersForProfiles(profileIds) {
        this.ensureTables();
        const map = new Map();
        if (profileIds.length === 0)
            return map;
        const placeholders = profileIds.map(() => '?').join(', ');
        const rows = (0, db_1.getDb)()
            .prepare(`
          SELECT *
          FROM lis_test_order_profile_parameters
          WHERE profile_id IN (${placeholders})
          ORDER BY sort_order ASC, analyzer_code ASC
        `)
            .all(...profileIds);
        for (const row of rows) {
            const parsed = this.withParsedJson(row);
            const bucket = map.get(row.profile_id) ?? [];
            bucket.push(parsed);
            map.set(row.profile_id, bucket);
        }
        return map;
    }
    normalizeParameter(item, index) {
        const analyzerCode = this.clean(item.analyzer_code ?? item.analyzerCode);
        const valueType = String(item.value_type ?? item.valueType ?? item.datatype ?? 'text')
            .trim()
            .toLowerCase();
        return {
            analyzer_code: analyzerCode,
            display_name: this.clean(item.display_name ?? item.displayName) || analyzerCode,
            concept_uuid: this.clean(item.concept_uuid ?? item.conceptUuid),
            allocation_uuid: this.clean(item.allocation_uuid ?? item.allocationUuid),
            datatype: this.clean(item.datatype),
            value_type: ['coded', 'numeric', 'text'].includes(valueType) ? valueType : 'text',
            required: this.numberFlag(item.required, 1),
            sort_order: Number(item.sort_order ?? item.sortOrder ?? index),
            aliases: this.stringList(item.aliases ?? this.tryParseJson(item.aliases_json)),
        };
    }
    withParsedJson(row) {
        const copy = { ...row };
        copy.order_name_includes = this.stringList(this.tryParseJson(row?.order_name_includes_json));
        copy.aliases = this.stringList(this.tryParseJson(row?.aliases_json));
        return copy;
    }
    assertTargetExists(targetId) {
        const row = (0, db_1.getDb)().prepare(`SELECT id FROM targets WHERE id = ? LIMIT 1`).get(targetId);
        if (!row?.id)
            throw new Error('Selected LIS target does not exist. Refresh targets and try again.');
    }
    clean(value) {
        const text = String(value ?? '').trim();
        return text.length ? text : null;
    }
    numberFlag(value, fallback) {
        if (value === true)
            return 1;
        if (value === false)
            return 0;
        const n = Number(value);
        return Number.isFinite(n) ? (n ? 1 : 0) : fallback;
    }
    stringList(value) {
        const out = [];
        const seen = new Set();
        const push = (item) => {
            if (Array.isArray(item)) {
                item.forEach(push);
                return;
            }
            const text = String(item ?? '').trim();
            if (!text)
                return;
            for (const piece of text.split(',').map((x) => x.trim()).filter(Boolean)) {
                const key = piece.toUpperCase();
                if (seen.has(key))
                    continue;
                seen.add(key);
                out.push(piece);
            }
        };
        push(value);
        return out;
    }
    tryParseJson(value) {
        if (value == null)
            return null;
        if (typeof value !== 'string')
            return value;
        try {
            return JSON.parse(value);
        }
        catch {
            return null;
        }
    }
}
exports.LisTestOrderProfileService = LisTestOrderProfileService;
