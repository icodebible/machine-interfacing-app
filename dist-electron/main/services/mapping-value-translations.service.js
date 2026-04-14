"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MappingValueTranslationsService = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const nowIso = () => new Date().toISOString();
class MappingValueTranslationsService {
    listByRule(mappingRuleId) {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
          SELECT *
          FROM target_mapping_value_translations
          WHERE mapping_rule_id = ?
          ORDER BY source_value ASC, created_at ASC
        `)
            .all(mappingRuleId);
    }
    create(dto) {
        const db = (0, db_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        db.prepare(`
        INSERT INTO target_mapping_value_translations (
          id,
          mapping_rule_id,
          source_value,
          destination_value,
          enabled,
          note,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, dto.mapping_rule_id, dto.source_value, dto.destination_value ?? null, dto.enabled ?? 1, dto.note ?? null, ts, ts);
        return { id };
    }
    update(id, dto) {
        const db = (0, db_1.getDb)();
        const ts = nowIso();
        const res = db
            .prepare(`
          UPDATE target_mapping_value_translations
          SET
            source_value = COALESCE(?, source_value),
            destination_value = ?,
            enabled = COALESCE(?, enabled),
            note = ?,
            updated_at = ?
          WHERE id = ?
        `)
            .run(dto.source_value ?? null, dto.destination_value ?? null, dto.enabled ?? null, dto.note ?? null, ts, id);
        if (res.changes !== 1)
            throw new Error('Value translation not found');
        return true;
    }
    delete(id) {
        const db = (0, db_1.getDb)();
        db.prepare(`DELETE FROM target_mapping_value_translations WHERE id = ?`).run(id);
        return true;
    }
    saveConfig(mappingRuleId, dto) {
        const db = (0, db_1.getDb)();
        const res = db
            .prepare(`
          UPDATE target_mappings
          SET
            value_mapping_enabled = ?,
            unmapped_behavior = ?,
            default_destination_value = ?,
            updated_at = ?
          WHERE id = ?
        `)
            .run(dto.value_mapping_enabled ?? 0, dto.unmapped_behavior ?? 'PASSTHROUGH', dto.default_destination_value ?? null, nowIso(), mappingRuleId);
        if (res.changes !== 1)
            throw new Error('Mapping rule not found');
        return true;
    }
}
exports.MappingValueTranslationsService = MappingValueTranslationsService;
