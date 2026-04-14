import { randomUUID } from 'crypto';
import { getDb } from '../db/db';

const nowIso = () => new Date().toISOString();

export class MappingValueTranslationsService {
  listByRule(mappingRuleId: string) {
    const db = getDb();
    return db
      .prepare(
        `
          SELECT *
          FROM target_mapping_value_translations
          WHERE mapping_rule_id = ?
          ORDER BY source_value ASC, created_at ASC
        `,
      )
      .all(mappingRuleId);
  }

  create(dto: {
    mapping_rule_id: string;
    source_value: string;
    destination_value?: string | null;
    enabled?: number;
    note?: string | null;
  }) {
    const db = getDb();
    const id = randomUUID();
    const ts = nowIso();

    db.prepare(
      `
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
      `,
    ).run(
      id,
      dto.mapping_rule_id,
      dto.source_value,
      dto.destination_value ?? null,
      dto.enabled ?? 1,
      dto.note ?? null,
      ts,
      ts,
    );

    return { id };
  }

  update(
    id: string,
    dto: {
      source_value?: string;
      destination_value?: string | null;
      enabled?: number;
      note?: string | null;
    },
  ) {
    const db = getDb();
    const ts = nowIso();

    const res = db
      .prepare(
        `
          UPDATE target_mapping_value_translations
          SET
            source_value = COALESCE(?, source_value),
            destination_value = ?,
            enabled = COALESCE(?, enabled),
            note = ?,
            updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        dto.source_value ?? null,
        dto.destination_value ?? null,
        dto.enabled ?? null,
        dto.note ?? null,
        ts,
        id,
      );

    if (res.changes !== 1) throw new Error('Value translation not found');
    return true;
  }

  delete(id: string) {
    const db = getDb();
    db.prepare(`DELETE FROM target_mapping_value_translations WHERE id = ?`).run(id);
    return true;
  }

  saveConfig(
    mappingRuleId: string,
    dto: {
      value_mapping_enabled: number;
      unmapped_behavior: 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR';
      default_destination_value?: string | null;
    },
  ) {
    const db = getDb();
    const res = db
      .prepare(
        `
          UPDATE target_mappings
          SET
            value_mapping_enabled = ?,
            unmapped_behavior = ?,
            default_destination_value = ?,
            updated_at = ?
          WHERE id = ?
        `,
      )
      .run(
        dto.value_mapping_enabled ?? 0,
        dto.unmapped_behavior ?? 'PASSTHROUGH',
        dto.default_destination_value ?? null,
        nowIso(),
        mappingRuleId,
      );

    if (res.changes !== 1) throw new Error('Mapping rule not found');
    return true;
  }
}
