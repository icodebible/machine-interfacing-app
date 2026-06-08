import { randomUUID } from 'crypto';
import { getDb } from '../db/db';

const nowIso = () => new Date().toISOString();

type Actor = {
  id?: string | null;
  username?: string | null;
};

type ProfileParameterInput = {
  id?: string | null;
  analyzer_code?: string | null;
  analyzerCode?: string | null;
  display_name?: string | null;
  displayName?: string | null;
  concept_uuid?: string | null;
  conceptUuid?: string | null;
  allocation_uuid?: string | null;
  allocationUuid?: string | null;
  datatype?: string | null;
  value_type?: 'coded' | 'numeric' | 'text' | string | null;
  valueType?: 'coded' | 'numeric' | 'text' | string | null;
  required?: number | boolean | null;
  sort_order?: number | null;
  sortOrder?: number | null;
  aliases?: string[] | null;
  aliases_json?: string | null;
};

export type LisTestOrderProfileInput = {
  id?: string | null;
  target_id?: string | null;
  targetId?: string | null;
  profile_code?: string | null;
  profileCode?: string | null;
  profile_name?: string | null;
  profileName?: string | null;
  order_concept_uuid?: string | null;
  orderConceptUuid?: string | null;
  order_display?: string | null;
  orderDisplay?: string | null;
  order_name_includes?: string[] | null;
  orderNameIncludes?: string[] | null;
  enabled?: number | boolean | null;
  parameters?: ProfileParameterInput[];
  actor?: Actor | null;
};

export class LisTestOrderProfileService {
  list(targetId?: string | null) {
    const db = getDb();
    const rows = (targetId
      ? db
          .prepare(
            `
              SELECT p.*, t.name AS target_name, t.type AS target_type
              FROM lis_test_order_profiles p
              LEFT JOIN targets t ON t.id = p.target_id
              WHERE p.target_id = ?
              ORDER BY p.enabled DESC, p.profile_name ASC, p.profile_code ASC
            `,
          )
          .all(targetId)
      : db
          .prepare(
            `
              SELECT p.*, t.name AS target_name, t.type AS target_type
              FROM lis_test_order_profiles p
              LEFT JOIN targets t ON t.id = p.target_id
              ORDER BY t.name ASC, p.enabled DESC, p.profile_name ASC, p.profile_code ASC
            `,
          )
          .all()) as any[];

    const ids = rows.map((row) => row.id).filter(Boolean);
    const paramsByProfile = this.parametersForProfiles(ids);
    return rows.map((row) => this.withParsedJson({ ...row, parameters: paramsByProfile.get(row.id) ?? [] }));
  }

  get(id: string) {
    const db = getDb();
    const row = db
      .prepare(
        `
          SELECT p.*, t.name AS target_name, t.type AS target_type
          FROM lis_test_order_profiles p
          LEFT JOIN targets t ON t.id = p.target_id
          WHERE p.id = ?
          LIMIT 1
        `,
      )
      .get(id) as any | undefined;
    if (!row) return null;
    const params = this.parametersForProfiles([id]).get(id) ?? [];
    return this.withParsedJson({ ...row, parameters: params });
  }

  save(input: LisTestOrderProfileInput) {
    const db = getDb();
    const id = this.clean(input.id) || randomUUID();
    const targetId = this.clean(input.target_id ?? input.targetId);
    const profileCode = this.clean(input.profile_code ?? input.profileCode);
    const profileName = this.clean(input.profile_name ?? input.profileName);
    const orderConceptUuid = this.clean(input.order_concept_uuid ?? input.orderConceptUuid);
    const orderDisplay = this.clean(input.order_display ?? input.orderDisplay) || profileName;
    const includes = this.stringList(input.order_name_includes ?? input.orderNameIncludes);
    const enabled = this.numberFlag(input.enabled, 1);
    const actor = input.actor ?? null;

    if (!targetId) throw new Error('LIS target is required before saving a test-order profile.');
    if (!profileCode) throw new Error('Profile code is required.');
    if (!profileName) throw new Error('Profile name is required.');
    if (!orderConceptUuid && !orderDisplay && includes.length === 0) {
      throw new Error('Provide an order concept UUID or order-name match terms for this profile.');
    }

    this.assertTargetExists(targetId);

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
        .get(id) as { id: string } | undefined;

      if (existing?.id) {
        db.prepare(
          `
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
          `,
        ).run(
          targetId,
          profileCode,
          profileName,
          orderConceptUuid,
          orderDisplay,
          JSON.stringify(includes),
          enabled,
          ts,
          actor?.id ?? null,
          actor?.username ?? null,
          id,
        );
      } else {
        db.prepare(
          `
            INSERT INTO lis_test_order_profiles (
              id, target_id, profile_code, profile_name, order_concept_uuid, order_display,
              order_name_includes_json, enabled, created_at, updated_at,
              created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
        ).run(
          id,
          targetId,
          profileCode,
          profileName,
          orderConceptUuid,
          orderDisplay,
          JSON.stringify(includes),
          enabled,
          ts,
          ts,
          actor?.id ?? null,
          actor?.username ?? null,
          actor?.id ?? null,
          actor?.username ?? null,
        );
      }

      db.prepare(`DELETE FROM lis_test_order_profile_parameters WHERE profile_id = ?`).run(id);
      const stmt = db.prepare(
        `
          INSERT INTO lis_test_order_profile_parameters (
            id, profile_id, analyzer_code, display_name, concept_uuid, allocation_uuid,
            datatype, value_type, required, sort_order, aliases_json, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      );

      for (const param of parameters) {
        stmt.run(
          randomUUID(),
          id,
          param.analyzer_code,
          param.display_name,
          param.concept_uuid,
          param.allocation_uuid,
          param.datatype,
          param.value_type,
          param.required,
          param.sort_order,
          JSON.stringify(param.aliases),
          ts,
          ts,
        );
      }
    });

    result();
    return this.get(id);
  }

  setEnabled(id: string, enabled: number | boolean) {
    const db = getDb();
    db.prepare(
      `UPDATE lis_test_order_profiles SET enabled = ?, updated_at = ? WHERE id = ?`,
    ).run(this.numberFlag(enabled, 1), nowIso(), id);
    return true;
  }

  delete(id: string) {
    const db = getDb();
    db.prepare(`DELETE FROM lis_test_order_profiles WHERE id = ?`).run(id);
    return true;
  }

  private parametersForProfiles(profileIds: string[]) {
    const map = new Map<string, any[]>();
    if (profileIds.length === 0) return map;
    const placeholders = profileIds.map(() => '?').join(', ');
    const rows = getDb()
      .prepare(
        `
          SELECT *
          FROM lis_test_order_profile_parameters
          WHERE profile_id IN (${placeholders})
          ORDER BY sort_order ASC, analyzer_code ASC
        `,
      )
      .all(...profileIds) as any[];

    for (const row of rows) {
      const parsed = this.withParsedJson(row);
      const bucket = map.get(row.profile_id) ?? [];
      bucket.push(parsed);
      map.set(row.profile_id, bucket);
    }
    return map;
  }

  private normalizeParameter(item: ProfileParameterInput, index: number) {
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

  private withParsedJson(row: any) {
    const copy = { ...row };
    copy.order_name_includes = this.stringList(this.tryParseJson(row?.order_name_includes_json));
    copy.aliases = this.stringList(this.tryParseJson(row?.aliases_json));
    return copy;
  }

  private assertTargetExists(targetId: string) {
    const row = getDb().prepare(`SELECT id FROM targets WHERE id = ? LIMIT 1`).get(targetId) as
      | { id: string }
      | undefined;
    if (!row?.id) throw new Error('Selected LIS target does not exist. Refresh targets and try again.');
  }

  private clean(value: any): string | null {
    const text = String(value ?? '').trim();
    return text.length ? text : null;
  }

  private numberFlag(value: any, fallback: number) {
    if (value === true) return 1;
    if (value === false) return 0;
    const n = Number(value);
    return Number.isFinite(n) ? (n ? 1 : 0) : fallback;
  }

  private stringList(value: any): string[] {
    const out: string[] = [];
    const seen = new Set<string>();
    const push = (item: any) => {
      if (Array.isArray(item)) {
        item.forEach(push);
        return;
      }
      const text = String(item ?? '').trim();
      if (!text) return;
      for (const piece of text.split(',').map((x) => x.trim()).filter(Boolean)) {
        const key = piece.toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(piece);
      }
    };
    push(value);
    return out;
  }

  private tryParseJson(value: any) {
    if (value == null) return null;
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
}
