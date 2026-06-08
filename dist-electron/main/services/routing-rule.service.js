"use strict";
// // import { randomUUID } from 'crypto';
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingRuleService = void 0;
// // import { getDb } from '../db/db';
// // import { getCurrentActorStamp } from './actor-context.service';
// // type NullableString = string | null | undefined;
// // type RoutingRuleInput = {
// //   name?: string | null;
// //   enabled?: number | boolean | null;
// //   priority?: number | string | null;
// //   target_id?: string | null;
// //   lab_id?: string | null;
// //   machine_id?: string | null;
// //   protocol?: string | null;
// //   test_code?: string | null;
// //   order_id?: string | null;
// //   sample_id_pattern?: string | null;
// //   source_message_type?: string | null;
// //   match_type?: string | null;
// //   match_value?: string | null;
// //   stop_on_match?: number | boolean | null;
// //   description?: string | null;
// // };
// // export type RoutingRuleRow = {
// //   id: string;
// //   name: string;
// //   enabled: number;
// //   priority: number;
// //   target_id: string;
// //   target_name?: string | null;
// //   target_type?: string | null;
// //   target_enabled?: number | null;
// //   lab_id?: string | null;
// //   lab_name?: string | null;
// //   machine_id?: string | null;
// //   machine_name?: string | null;
// //   protocol?: string | null;
// //   test_code?: string | null;
// //   order_id?: string | null;
// //   sample_id_pattern?: string | null;
// //   source_message_type?: string | null;
// //   stop_on_match: number;
// //   description?: string | null;
// //   match_type?: string | null;
// //   match_value?: string | null;
// //   created_at: string;
// //   updated_at: string;
// //   created_by_user_id?: string | null;
// //   created_by_username?: string | null;
// //   updated_by_user_id?: string | null;
// //   updated_by_username?: string | null;
// // };
// // export type RoutingRuleMatch = {
// //   ruleId: string;
// //   name: string;
// //   targetId: string;
// //   targetName?: string | null;
// //   priority: number;
// //   stopOnMatch: boolean;
// // };
// // export type RoutingResolution = {
// //   targetIds: string[];
// //   matchedRules: RoutingRuleMatch[];
// //   fallbackTargetIds: string[];
// //   warnings: string[];
// //   source: 'routing-rules' | 'fallback' | 'none';
// // };
// // type NormalizedRoutingSource = {
// //   id: string;
// //   machine_id?: string | null;
// //   lab_id?: string | null;
// //   protocol?: string | null;
// //   sample_id?: string | null;
// //   order_id?: string | null;
// //   test_code?: string | null;
// //   source_message_type?: string | null;
// //   data_json?: string | null;
// // };
// // export class RoutingRuleService {
// //   list(): RoutingRuleRow[] {
// //     return getDb()
// //       .prepare(
// //         `SELECT rr.*,
// //                 t.name AS target_name,
// //                 t.type AS target_type,
// //                 t.enabled AS target_enabled,
// //                 l.name AS lab_name,
// //                 m.name AS machine_name
// //            FROM routing_rules rr
// //            LEFT JOIN targets t ON t.id = rr.target_id
// //            LEFT JOIN labs l ON l.id = rr.lab_id
// //            LEFT JOIN machines m ON m.id = rr.machine_id
// //           ORDER BY rr.enabled DESC, rr.priority ASC, rr.updated_at DESC`,
// //       )
// //       .all()
// //       .map((row: any) => this.withDerivedMatch(row)) as RoutingRuleRow[];
// //   }
// //   get(id: string): RoutingRuleRow | undefined {
// //     const row = getDb()
// //       .prepare(
// //         `SELECT rr.*,
// //                 t.name AS target_name,
// //                 t.type AS target_type,
// //                 t.enabled AS target_enabled,
// //                 l.name AS lab_name,
// //                 m.name AS machine_name
// //            FROM routing_rules rr
// //            LEFT JOIN targets t ON t.id = rr.target_id
// //            LEFT JOIN labs l ON l.id = rr.lab_id
// //            LEFT JOIN machines m ON m.id = rr.machine_id
// //           WHERE rr.id = ?`,
// //       )
// //       .get(id) as RoutingRuleRow | undefined;
// //     return row ? this.withDerivedMatch(row) : undefined;
// //   }
// //   create(input: RoutingRuleInput): RoutingRuleRow {
// //     const now = new Date().toISOString();
// //     const actor = getCurrentActorStamp();
// //     const normalized = this.normalizeInput(input, true);
// //     const id = randomUUID();
// //     getDb()
// //       .prepare(
// //         `INSERT INTO routing_rules (
// //             id, name, enabled, priority, target_id, lab_id, machine_id, protocol,
// //             test_code, order_id, sample_id_pattern, source_message_type,
// //             stop_on_match, description, created_at, updated_at,
// //             created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
// //           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
// //       )
// //       .run(
// //         id,
// //         normalized.name,
// //         normalized.enabled,
// //         normalized.priority,
// //         normalized.target_id,
// //         normalized.lab_id,
// //         normalized.machine_id,
// //         normalized.protocol,
// //         normalized.test_code,
// //         normalized.order_id,
// //         normalized.sample_id_pattern,
// //         normalized.source_message_type,
// //         normalized.stop_on_match,
// //         normalized.description,
// //         now,
// //         now,
// //         actor.userId,
// //         actor.username,
// //         actor.userId,
// //         actor.username,
// //       );
// //     return this.get(id)!;
// //   }
// //   update(id: string, input: RoutingRuleInput): RoutingRuleRow {
// //     const existing = this.get(id);
// //     if (!existing) {
// //       throw new Error('Routing rule not found.');
// //     }
// //     const now = new Date().toISOString();
// //     const actor = getCurrentActorStamp();
// //     const merged = this.normalizeInput({ ...existing, ...input }, true);
// //     getDb()
// //       .prepare(
// //         `UPDATE routing_rules
// //             SET name = ?, enabled = ?, priority = ?, target_id = ?, lab_id = ?, machine_id = ?,
// //                 protocol = ?, test_code = ?, order_id = ?, sample_id_pattern = ?,
// //                 source_message_type = ?, stop_on_match = ?, description = ?, updated_at = ?,
// //                 updated_by_user_id = ?, updated_by_username = ?
// //           WHERE id = ?`,
// //       )
// //       .run(
// //         merged.name,
// //         merged.enabled,
// //         merged.priority,
// //         merged.target_id,
// //         merged.lab_id,
// //         merged.machine_id,
// //         merged.protocol,
// //         merged.test_code,
// //         merged.order_id,
// //         merged.sample_id_pattern,
// //         merged.source_message_type,
// //         merged.stop_on_match,
// //         merged.description,
// //         now,
// //         actor.userId,
// //         actor.username,
// //         id,
// //       );
// //     return this.get(id)!;
// //   }
// //   remove(id: string): boolean {
// //     const result = getDb().prepare('DELETE FROM routing_rules WHERE id = ?').run(id);
// //     return result.changes > 0;
// //   }
// //   delete(id: string): boolean {
// //     return this.remove(id);
// //   }
// //   resolveTargets(normalizedResultId: string, fallbackTargetIds: string[] = []): RoutingResolution {
// //     const source = this.getNormalizedRoutingSource(normalizedResultId);
// //     const warnings: string[] = [];
// //     if (!source) {
// //       const ids = this.cleanIds(fallbackTargetIds);
// //       return {
// //         targetIds: ids,
// //         matchedRules: [],
// //         fallbackTargetIds: ids,
// //         warnings: ['Normalized result was not found while resolving routing rules.'],
// //         source: ids.length ? 'fallback' : 'none',
// //       };
// //     }
// //     const rules = this.list().filter((rule) => Number(rule.enabled) === 1 && Number(rule.target_enabled ?? 0) === 1);
// //     const matchedRules: RoutingRuleMatch[] = [];
// //     const targetIds: string[] = [];
// //     for (const rule of rules) {
// //       if (!this.matches(rule, source)) {
// //         continue;
// //       }
// //       if (!targetIds.includes(rule.target_id)) {
// //         targetIds.push(rule.target_id);
// //       }
// //       matchedRules.push({
// //         ruleId: rule.id,
// //         name: rule.name,
// //         targetId: rule.target_id,
// //         targetName: rule.target_name ?? null,
// //         priority: Number(rule.priority ?? 100),
// //         stopOnMatch: Number(rule.stop_on_match ?? 0) === 1,
// //       });
// //       if (Number(rule.stop_on_match ?? 0) === 1) {
// //         break;
// //       }
// //     }
// //     if (targetIds.length > 0) {
// //       return {
// //         targetIds,
// //         matchedRules,
// //         fallbackTargetIds: this.cleanIds(fallbackTargetIds),
// //         warnings,
// //         source: 'routing-rules',
// //       };
// //     }
// //     const fallback = this.cleanIds(fallbackTargetIds);
// //     if (fallback.length > 0) {
// //       warnings.push('No enabled routing rule matched this result. Falling back to approval-policy target routing.');
// //       return {
// //         targetIds: fallback,
// //         matchedRules: [],
// //         fallbackTargetIds: fallback,
// //         warnings,
// //         source: 'fallback',
// //       };
// //     }
// //     warnings.push('No enabled routing rule matched this result and no approval-policy target fallback is configured.');
// //     return {
// //       targetIds: [],
// //       matchedRules: [],
// //       fallbackTargetIds: [],
// //       warnings,
// //       source: 'none',
// //     };
// //   }
// //   previewForResult(normalizedResultId: string, fallbackTargetIds: string[] = []): RoutingResolution & {
// //     normalizedResult?: NormalizedRoutingSource | null;
// //   } {
// //     const normalizedResult = this.getNormalizedRoutingSource(normalizedResultId) ?? null;
// //     return {
// //       ...this.resolveTargets(normalizedResultId, fallbackTargetIds),
// //       normalizedResult,
// //     };
// //   }
// //   private withDerivedMatch(row: RoutingRuleRow): RoutingRuleRow {
// //     const match = this.deriveGenericMatch(row);
// //     return {
// //       ...row,
// //       enabled: Number(row.enabled ?? 0),
// //       stop_on_match: Number(row.stop_on_match ?? 0),
// //       match_type: match.match_type,
// //       match_value: match.match_value,
// //     };
// //   }
// //   private deriveGenericMatch(row: RoutingRuleRow): { match_type: string; match_value: string | null } {
// //     if (this.clean(row.test_code)) return { match_type: 'TEST_CODE', match_value: this.clean(row.test_code) };
// //     if (this.clean(row.order_id)) return { match_type: 'ORDER_CODE', match_value: this.clean(row.order_id) };
// //     if (this.clean(row.machine_id)) return { match_type: 'MACHINE_ID', match_value: this.clean(row.machine_id) };
// //     if (this.clean(row.sample_id_pattern)) return { match_type: 'SAMPLE_PREFIX', match_value: this.clean(row.sample_id_pattern) };
// //     if (this.clean(row.source_message_type)) return { match_type: 'MESSAGE_TYPE', match_value: this.clean(row.source_message_type) };
// //     return { match_type: 'ANY', match_value: null };
// //   }
// //   private mapGenericMatch(input: RoutingRuleInput): Partial<RoutingRuleInput> {
// //     const type = this.normalizeToken(input.match_type);
// //     const value = this.clean(input.match_value);
// //     if (!type || type === 'ANY' || !value) return {};
// //     switch (type) {
// //       case 'MACHINE_ID':
// //       case 'MACHINE_NAME':
// //         return { machine_id: value };
// //       case 'MESSAGE_TYPE':
// //         return { source_message_type: this.normalizeToken(value) };
// //       case 'ORDER_CODE':
// //         return { order_id: value };
// //       case 'TEST_CODE':
// //         return { test_code: value };
// //       case 'SAMPLE_PREFIX':
// //         return { sample_id_pattern: value.endsWith('*') ? value : `${value}*` };
// //       default:
// //         return {};
// //     }
// //   }
// //   private getNormalizedRoutingSource(normalizedResultId: string): NormalizedRoutingSource | undefined {
// //     return getDb()
// //       .prepare(
// //         `SELECT n.id,
// //                 n.machine_id,
// //                 m.lab_id,
// //                 n.protocol,
// //                 n.sample_id,
// //                 n.order_id,
// //                 n.test_code,
// //                 n.source_message_type,
// //                 n.data_json,
// //                 m.name AS machine_name
// //            FROM normalized_lab_results n
// //            LEFT JOIN machines m ON m.id = n.machine_id
// //           WHERE n.id = ?`,
// //       )
// //       .get(normalizedResultId) as NormalizedRoutingSource | undefined;
// //   }
// //   private normalizeInput(input: RoutingRuleInput, requireTarget: boolean): Required<Pick<RoutingRuleInput, 'name' | 'enabled' | 'priority' | 'target_id' | 'stop_on_match'>> & RoutingRuleInput {
// //     const targetId = this.clean(input.target_id);
// //     if (requireTarget && !targetId) {
// //       throw new Error('Routing rule target is required.');
// //     }
// //     const name = this.clean(input.name) || 'Untitled routing rule';
// //     const priority = Number(input.priority ?? 100);
// //     const mapped = this.mapGenericMatch(input);
// //     return {
// //       name,
// //       enabled: this.boolNumber(input.enabled, 1),
// //       priority: Number.isFinite(priority) ? priority : 100,
// //       target_id: targetId,
// //       lab_id: this.clean(input.lab_id),
// //       machine_id: mapped.machine_id ?? this.clean(input.machine_id),
// //       protocol: this.normalizeToken(input.protocol),
// //       test_code: mapped.test_code ?? this.clean(input.test_code),
// //       order_id: mapped.order_id ?? this.clean(input.order_id),
// //       sample_id_pattern: mapped.sample_id_pattern ?? this.clean(input.sample_id_pattern),
// //       source_message_type: mapped.source_message_type ?? this.normalizeToken(input.source_message_type),
// //       stop_on_match: this.boolNumber(input.stop_on_match, 0),
// //       description: this.clean(input.description),
// //     };
// //   }
// //   private matches(rule: RoutingRuleRow, source: NormalizedRoutingSource): boolean {
// //     return (
// //       this.matchesExact(rule.lab_id, source.lab_id) &&
// //       (this.matchesExact(rule.machine_id, source.machine_id) || this.matchesExact(rule.machine_id, source.machine_name)) &&
// //       this.matchesToken(rule.protocol, source.protocol) &&
// //       this.matchesPatternList(rule.test_code, source.test_code, this.extractAnalyzerCodes(source)) &&
// //       this.matchesPatternList(rule.order_id, source.order_id) &&
// //       this.matchesPatternList(rule.sample_id_pattern, source.sample_id) &&
// //       this.matchesToken(rule.source_message_type, source.source_message_type)
// //     );
// //   }
// //   private extractAnalyzerCodes(source: NormalizedRoutingSource): string[] {
// //     const codes = new Set<string>();
// //     try {
// //       const parsed = source.data_json ? JSON.parse(source.data_json) : null;
// //       const results = Array.isArray(parsed?.results) ? parsed.results : [];
// //       for (const row of results) {
// //         const code = row?.code ?? row?.testCode ?? row?.analyzerCode ?? row?.id;
// //         if (code !== undefined && code !== null && String(code).trim()) {
// //           codes.add(String(code).trim());
// //         }
// //       }
// //     } catch {
// //       // Keep routing safe; invalid/legacy data_json should not break approval flow.
// //     }
// //     return Array.from(codes);
// //   }
// //   private matchesExact(expected: NullableString, actual: NullableString): boolean {
// //     const value = this.clean(expected);
// //     if (!value) return true;
// //     return String(actual ?? '').trim() === value;
// //   }
// //   private matchesToken(expected: NullableString, actual: NullableString): boolean {
// //     const value = this.clean(expected);
// //     if (!value) return true;
// //     return this.splitMatchers(value).some((entry) => this.norm(entry) === this.norm(actual));
// //   }
// //   private matchesPatternList(expected: NullableString, actual: NullableString, additionalActuals: string[] = []): boolean {
// //     const value = this.clean(expected);
// //     if (!value) return true;
// //     const candidates = [actual, ...additionalActuals]
// //       .map((item) => String(item ?? '').trim())
// //       .filter(Boolean);
// //     if (!candidates.length) return false;
// //     return this.splitMatchers(value).some((entry) => candidates.some((candidate) => this.matchesPattern(entry, candidate)));
// //   }
// //   private matchesPattern(pattern: string, actual: string): boolean {
// //     const expected = this.norm(pattern);
// //     const candidate = this.norm(actual);
// //     if (!expected) return true;
// //     if (expected === candidate) return true;
// //     if (expected.includes('*')) {
// //       const escaped = expected.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
// //       return new RegExp(`^${escaped}$`).test(candidate);
// //     }
// //     return false;
// //   }
// //   private splitMatchers(value: string): string[] {
// //     return value
// //       .split(/[;,\n]/)
// //       .map((part) => part.trim())
// //       .filter(Boolean);
// //   }
// //   private boolNumber(value: number | boolean | string | null | undefined, fallback: 0 | 1): 0 | 1 {
// //     if (value === undefined || value === null || value === '') return fallback;
// //     if (typeof value === 'boolean') return value ? 1 : 0;
// //     return Number(value) === 1 ? 1 : 0;
// //   }
// //   private normalizeToken(value: NullableString): string | null {
// //     const cleaned = this.clean(value);
// //     return cleaned ? cleaned.toUpperCase() : null;
// //   }
// //   private norm(value: NullableString): string {
// //     return String(value ?? '').trim().toUpperCase();
// //   }
// //   private clean(value: NullableString): string | null {
// //     const text = String(value ?? '').trim();
// //     return text.length ? text : null;
// //   }
// //   private cleanIds(ids: string[]): string[] {
// //     return Array.from(new Set((ids ?? []).map((id) => String(id ?? '').trim()).filter(Boolean)));
// //   }
// // }
// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
// import { getCurrentActorStamp } from './actor-context.service';
// type NullableString = string | null | undefined;
// type RoutingRuleInput = {
//   name?: string | null;
//   enabled?: number | boolean | null;
//   priority?: number | string | null;
//   target_id?: string | null;
//   lab_id?: string | null;
//   machine_id?: string | null;
//   protocol?: string | null;
//   test_code?: string | null;
//   order_id?: string | null;
//   sample_id_pattern?: string | null;
//   source_message_type?: string | null;
//   match_type?: string | null;
//   match_value?: string | null;
//   stop_on_match?: number | boolean | null;
//   description?: string | null;
// };
// export type RoutingRuleRow = {
//   id: string;
//   name: string;
//   enabled: number;
//   priority: number;
//   target_id: string;
//   target_name?: string | null;
//   target_type?: string | null;
//   target_enabled?: number | null;
//   lab_id?: string | null;
//   lab_name?: string | null;
//   machine_id?: string | null;
//   machine_name?: string | null;
//   machine_code?: string | null;
//   protocol?: string | null;
//   test_code?: string | null;
//   order_id?: string | null;
//   sample_id_pattern?: string | null;
//   source_message_type?: string | null;
//   stop_on_match: number;
//   description?: string | null;
//   match_type?: string | null;
//   match_value?: string | null;
//   created_at: string;
//   updated_at: string;
//   created_by_user_id?: string | null;
//   created_by_username?: string | null;
//   updated_by_user_id?: string | null;
//   updated_by_username?: string | null;
// };
// export type RoutingRuleMatch = {
//   ruleId: string;
//   name: string;
//   targetId: string;
//   targetName?: string | null;
//   priority: number;
//   stopOnMatch: boolean;
// };
// export type RoutingResolution = {
//   targetIds: string[];
//   matchedRules: RoutingRuleMatch[];
//   fallbackTargetIds: string[];
//   warnings: string[];
//   source: 'routing-rules' | 'fallback' | 'none';
// };
// type NormalizedRoutingSource = {
//   id: string;
//   machine_id?: string | null;
//   machine_name?: string | null;
//   machine_code?: string | null;
//   lab_id?: string | null;
//   protocol?: string | null;
//   sample_id?: string | null;
//   order_id?: string | null;
//   test_code?: string | null;
//   source_message_type?: string | null;
//   data_json?: string | null;
// };
// export class RoutingRuleService {
//   list(): RoutingRuleRow[] {
//     return getDb()
//       .prepare(
//         `SELECT rr.*,
//                 t.name AS target_name,
//                 t.type AS target_type,
//                 t.enabled AS target_enabled,
//                 l.name AS lab_name,
//                 m.name AS machine_name,
//                 m.code AS machine_code
//            FROM routing_rules rr
//            LEFT JOIN targets t ON t.id = rr.target_id
//            LEFT JOIN labs l ON l.id = rr.lab_id
//            LEFT JOIN machines m ON m.id = rr.machine_id
//           ORDER BY rr.enabled DESC, rr.priority ASC, rr.updated_at DESC`,
//       )
//       .all()
//       .map((row: any) => this.withDerivedMatch(row)) as RoutingRuleRow[];
//   }
//   get(id: string): RoutingRuleRow | undefined {
//     const row = getDb()
//       .prepare(
//         `SELECT rr.*,
//                 t.name AS target_name,
//                 t.type AS target_type,
//                 t.enabled AS target_enabled,
//                 l.name AS lab_name,
//                 m.name AS machine_name,
//                 m.code AS machine_code
//            FROM routing_rules rr
//            LEFT JOIN targets t ON t.id = rr.target_id
//            LEFT JOIN labs l ON l.id = rr.lab_id
//            LEFT JOIN machines m ON m.id = rr.machine_id
//           WHERE rr.id = ?`,
//       )
//       .get(id) as RoutingRuleRow | undefined;
//     return row ? this.withDerivedMatch(row) : undefined;
//   }
//   create(input: RoutingRuleInput): RoutingRuleRow {
//     const now = new Date().toISOString();
//     const actor = getCurrentActorStamp();
//     const normalized = this.validateReferences(this.normalizeInput(input, true));
//     const id = randomUUID();
//     getDb()
//       .prepare(
//         `INSERT INTO routing_rules (
//             id, name, enabled, priority, match_type, match_value, target_id, lab_id, machine_id, protocol,
//             test_code, order_id, sample_id_pattern, source_message_type,
//             stop_on_match, description, created_at, updated_at,
//             created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       )
//       .run(
//         id,
//         normalized.name,
//         normalized.enabled,
//         normalized.priority,
//         normalized.match_type,
//         normalized.match_value,
//         normalized.target_id,
//         normalized.lab_id,
//         normalized.machine_id,
//         normalized.protocol,
//         normalized.test_code,
//         normalized.order_id,
//         normalized.sample_id_pattern,
//         normalized.source_message_type,
//         normalized.stop_on_match,
//         normalized.description,
//         now,
//         now,
//         actor.userId,
//         actor.username,
//         actor.userId,
//         actor.username,
//       );
//     return this.get(id)!;
//   }
//   update(id: string, input: RoutingRuleInput): RoutingRuleRow {
//     const existing = this.get(id);
//     if (!existing) {
//       throw new Error('Routing rule not found.');
//     }
//     const now = new Date().toISOString();
//     const actor = getCurrentActorStamp();
//     const merged = this.validateReferences(this.normalizeInput({ ...existing, ...input }, true));
//     getDb()
//       .prepare(
//         `UPDATE routing_rules
//             SET name = ?, enabled = ?, priority = ?, match_type = ?, match_value = ?, target_id = ?, lab_id = ?, machine_id = ?,
//                 protocol = ?, test_code = ?, order_id = ?, sample_id_pattern = ?,
//                 source_message_type = ?, stop_on_match = ?, description = ?, updated_at = ?,
//                 updated_by_user_id = ?, updated_by_username = ?
//           WHERE id = ?`,
//       )
//       .run(
//         merged.name,
//         merged.enabled,
//         merged.priority,
//         merged.match_type,
//         merged.match_value,
//         merged.target_id,
//         merged.lab_id,
//         merged.machine_id,
//         merged.protocol,
//         merged.test_code,
//         merged.order_id,
//         merged.sample_id_pattern,
//         merged.source_message_type,
//         merged.stop_on_match,
//         merged.description,
//         now,
//         actor.userId,
//         actor.username,
//         id,
//       );
//     return this.get(id)!;
//   }
//   remove(id: string): boolean {
//     const result = getDb().prepare('DELETE FROM routing_rules WHERE id = ?').run(id);
//     return result.changes > 0;
//   }
//   delete(id: string): boolean {
//     return this.remove(id);
//   }
//   resolveTargets(normalizedResultId: string, fallbackTargetIds: string[] = []): RoutingResolution {
//     const source = this.getNormalizedRoutingSource(normalizedResultId);
//     const warnings: string[] = [];
//     if (!source) {
//       const ids = this.cleanIds(fallbackTargetIds);
//       return {
//         targetIds: ids,
//         matchedRules: [],
//         fallbackTargetIds: ids,
//         warnings: ['Normalized result was not found while resolving routing rules.'],
//         source: ids.length ? 'fallback' : 'none',
//       };
//     }
//     const rules = this.list().filter((rule) => Number(rule.enabled) === 1 && Number(rule.target_enabled ?? 0) === 1);
//     const matchedRules: RoutingRuleMatch[] = [];
//     const targetIds: string[] = [];
//     for (const rule of rules) {
//       if (!this.matches(rule, source)) {
//         continue;
//       }
//       if (!targetIds.includes(rule.target_id)) {
//         targetIds.push(rule.target_id);
//       }
//       matchedRules.push({
//         ruleId: rule.id,
//         name: rule.name,
//         targetId: rule.target_id,
//         targetName: rule.target_name ?? null,
//         priority: Number(rule.priority ?? 100),
//         stopOnMatch: Number(rule.stop_on_match ?? 0) === 1,
//       });
//       if (Number(rule.stop_on_match ?? 0) === 1) {
//         break;
//       }
//     }
//     if (targetIds.length > 0) {
//       return {
//         targetIds,
//         matchedRules,
//         fallbackTargetIds: this.cleanIds(fallbackTargetIds),
//         warnings,
//         source: 'routing-rules',
//       };
//     }
//     const fallback = this.cleanIds(fallbackTargetIds);
//     if (fallback.length > 0) {
//       warnings.push('No enabled routing rule matched this result. Falling back to approval-policy target routing.');
//       return {
//         targetIds: fallback,
//         matchedRules: [],
//         fallbackTargetIds: fallback,
//         warnings,
//         source: 'fallback',
//       };
//     }
//     warnings.push('No enabled routing rule matched this result and no approval-policy target fallback is configured.');
//     return {
//       targetIds: [],
//       matchedRules: [],
//       fallbackTargetIds: [],
//       warnings,
//       source: 'none',
//     };
//   }
//   previewForResult(normalizedResultId: string, fallbackTargetIds: string[] = []): RoutingResolution & {
//     normalizedResult?: NormalizedRoutingSource | null;
//   } {
//     const normalizedResult = this.getNormalizedRoutingSource(normalizedResultId) ?? null;
//     return {
//       ...this.resolveTargets(normalizedResultId, fallbackTargetIds),
//       normalizedResult,
//     };
//   }
//   private withDerivedMatch(row: RoutingRuleRow): RoutingRuleRow {
//     const storedType = this.normalizeToken(row.match_type);
//     const storedValue = this.clean(row.match_value);
//     const derived = this.deriveGenericMatch(row);
//     const hasStoredMatch = !!storedType && storedType !== 'ANY' && !!storedValue;
//     return {
//       ...row,
//       enabled: Number(row.enabled ?? 0),
//       stop_on_match: Number(row.stop_on_match ?? 0),
//       match_type: hasStoredMatch ? storedType : derived.match_type,
//       match_value: hasStoredMatch ? storedValue : derived.match_value,
//     };
//   }
//   private deriveGenericMatch(row: RoutingRuleRow): { match_type: string; match_value: string | null } {
//     if (this.clean(row.test_code)) return { match_type: 'TEST_CODE', match_value: this.clean(row.test_code) };
//     if (this.clean(row.order_id)) return { match_type: 'ORDER_CODE', match_value: this.clean(row.order_id) };
//     if (this.clean(row.machine_id)) return { match_type: 'MACHINE_ID', match_value: this.clean(row.machine_id) };
//     if (this.clean(row.sample_id_pattern)) return { match_type: 'SAMPLE_PREFIX', match_value: this.clean(row.sample_id_pattern) };
//     if (this.clean(row.source_message_type)) return { match_type: 'MESSAGE_TYPE', match_value: this.clean(row.source_message_type) };
//     return { match_type: 'ANY', match_value: null };
//   }
//   private mapGenericMatch(input: RoutingRuleInput): Partial<RoutingRuleInput> {
//     const type = this.normalizeToken(input.match_type);
//     const value = this.clean(input.match_value);
//     if (!type || type === 'ANY' || !value) return {};
//     switch (type) {
//       case 'MACHINE_ID':
//       case 'MACHINE_NAME':
//         // Keep machine name/id free-text matchers in match_type/match_value.
//         // The machine_id column is a real foreign key and should only be set from the machine dropdown.
//         return {};
//       case 'MESSAGE_TYPE':
//         return { source_message_type: this.normalizeToken(value) };
//       case 'ORDER_CODE':
//         return { order_id: value };
//       case 'TEST_CODE':
//         return { test_code: value };
//       case 'SAMPLE_PREFIX':
//         return { sample_id_pattern: value.endsWith('*') ? value : `${value}*` };
//       default:
//         return {};
//     }
//   }
//   private getNormalizedRoutingSource(normalizedResultId: string): NormalizedRoutingSource | undefined {
//     return getDb()
//       .prepare(
//         `SELECT n.id,
//                 n.machine_id,
//                 m.name AS machine_name,
//                 m.code AS machine_code,
//                 m.lab_id,
//                 n.protocol,
//                 n.sample_id,
//                 n.order_id,
//                 n.test_code,
//                 n.source_message_type,
//                 n.data_json
//            FROM normalized_lab_results n
//            LEFT JOIN machines m ON m.id = n.machine_id
//           WHERE n.id = ?`,
//       )
//       .get(normalizedResultId) as NormalizedRoutingSource | undefined;
//   }
//   private normalizeInput(
//     input: RoutingRuleInput,
//     requireTarget: boolean,
//   ): RoutingRuleInput & {
//     name: string;
//     enabled: 0 | 1;
//     priority: number;
//     target_id: string;
//     match_type: string;
//     match_value: string | null;
//     stop_on_match: 0 | 1;
//   } {
//     const targetId = this.clean(input.target_id);
//     if (requireTarget && !targetId) {
//       throw new Error('Routing rule target is required.');
//     }
//     const name = this.clean(input.name) || 'Untitled routing rule';
//     const priority = Number(input.priority ?? 100);
//     const matchType = this.normalizeToken(input.match_type) || 'ANY';
//     const matchValue = matchType === 'ANY' ? null : this.clean(input.match_value);
//     const mapped = this.mapGenericMatch({ ...input, match_type: matchType, match_value: matchValue });
//     return {
//       name,
//       enabled: this.boolNumber(input.enabled, 1),
//       priority: Number.isFinite(priority) ? Math.max(1, Math.trunc(priority)) : 100,
//       target_id: targetId as string,
//       match_type: matchType,
//       match_value: matchValue,
//       lab_id: this.clean(input.lab_id),
//       machine_id: this.clean(input.machine_id),
//       protocol: this.normalizeToken(input.protocol),
//       test_code: mapped.test_code ?? this.clean(input.test_code),
//       order_id: mapped.order_id ?? this.clean(input.order_id),
//       sample_id_pattern: mapped.sample_id_pattern ?? this.clean(input.sample_id_pattern),
//       source_message_type: mapped.source_message_type ?? this.normalizeToken(input.source_message_type),
//       stop_on_match: this.boolNumber(input.stop_on_match, 0),
//       description: this.clean(input.description),
//     };
//   }
//   private validateReferences<T extends { target_id?: string | null; lab_id?: string | null; machine_id?: string | null }>(input: T): T & { target_id: string } {
//     const targetId = this.clean(input.target_id);
//     const labId = this.clean(input.lab_id);
//     const machineId = this.clean(input.machine_id);
//     if (!targetId) {
//       throw new Error('Destination target is required before saving a routing rule.');
//     }
//     if (!this.referenceExists('targets', targetId)) {
//       throw new Error('Selected target does not exist. Refresh targets and try again.');
//     }
//     if (labId && !this.referenceExists('labs', labId)) {
//       throw new Error('Selected laboratory does not exist. Refresh laboratories and try again.');
//     }
//     if (machineId && !this.referenceExists('machines', machineId)) {
//       throw new Error('Selected machine does not exist. Refresh machines and try again.');
//     }
//     return {
//       ...input,
//       target_id: targetId,
//       lab_id: labId,
//       machine_id: machineId,
//     };
//   }
//   private referenceExists(table: 'targets' | 'labs' | 'machines', id: string): boolean {
//     const row = getDb().prepare(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`).get(id);
//     return !!row;
//   }
//   private matches(rule: RoutingRuleRow, source: NormalizedRoutingSource): boolean {
//     return (
//       this.matchesGenericRule(rule, source) &&
//       this.matchesExact(rule.lab_id, source.lab_id) &&
//       (this.matchesExact(rule.machine_id, source.machine_id) || this.matchesExact(rule.machine_id, source.machine_name) || this.matchesExact(rule.machine_id, source.machine_code)) &&
//       this.matchesToken(rule.protocol, source.protocol) &&
//       this.matchesPatternList(rule.test_code, source.test_code, this.extractAnalyzerCodes(source)) &&
//       this.matchesPatternList(rule.order_id, source.order_id) &&
//       this.matchesPatternList(rule.sample_id_pattern, source.sample_id) &&
//       this.matchesToken(rule.source_message_type, source.source_message_type)
//     );
//   }
//   private matchesGenericRule(rule: RoutingRuleRow, source: NormalizedRoutingSource): boolean {
//     const type = this.normalizeToken(rule.match_type) || 'ANY';
//     const value = this.clean(rule.match_value);
//     if (type === 'ANY' || !value) {
//       return true;
//     }
//     switch (type) {
//       case 'MACHINE_ID':
//         return this.matchesPatternList(value, source.machine_id);
//       case 'MACHINE_NAME':
//         return this.matchesPatternList(value, source.machine_name, [source.machine_code ?? '', source.machine_id ?? '']);
//       case 'MESSAGE_TYPE':
//         return this.matchesToken(value, source.source_message_type);
//       case 'ORDER_CODE':
//         return this.matchesPatternList(value, source.order_id);
//       case 'TEST_CODE':
//         return this.matchesPatternList(value, source.test_code, this.extractAnalyzerCodes(source));
//       case 'SAMPLE_PREFIX':
//         return this.matchesPatternList(value.endsWith('*') ? value : `${value}*`, source.sample_id);
//       default:
//         return true;
//     }
//   }
//   private extractAnalyzerCodes(source: NormalizedRoutingSource): string[] {
//     const codes = new Set<string>();
//     try {
//       const parsed = source.data_json ? JSON.parse(source.data_json) : null;
//       const results = Array.isArray(parsed?.results) ? parsed.results : [];
//       for (const row of results) {
//         const code = row?.code ?? row?.testCode ?? row?.analyzerCode ?? row?.id;
//         if (code !== undefined && code !== null && String(code).trim()) {
//           codes.add(String(code).trim());
//         }
//       }
//     } catch {
//       // Keep routing safe; invalid/legacy data_json should not break approval flow.
//     }
//     return Array.from(codes);
//   }
//   private matchesExact(expected: NullableString, actual: NullableString): boolean {
//     const value = this.clean(expected);
//     if (!value) return true;
//     return String(actual ?? '').trim() === value;
//   }
//   private matchesToken(expected: NullableString, actual: NullableString): boolean {
//     const value = this.clean(expected);
//     if (!value) return true;
//     return this.splitMatchers(value).some((entry) => this.norm(entry) === this.norm(actual));
//   }
//   private matchesPatternList(expected: NullableString, actual: NullableString, additionalActuals: string[] = []): boolean {
//     const value = this.clean(expected);
//     if (!value) return true;
//     const candidates = [actual, ...additionalActuals]
//       .map((item) => String(item ?? '').trim())
//       .filter(Boolean);
//     if (!candidates.length) return false;
//     return this.splitMatchers(value).some((entry) => candidates.some((candidate) => this.matchesPattern(entry, candidate)));
//   }
//   private matchesPattern(pattern: string, actual: string): boolean {
//     const expected = this.norm(pattern);
//     const candidate = this.norm(actual);
//     if (!expected) return true;
//     if (expected === candidate) return true;
//     if (expected.includes('*')) {
//       const escaped = expected.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
//       return new RegExp(`^${escaped}$`).test(candidate);
//     }
//     return false;
//   }
//   private splitMatchers(value: string): string[] {
//     return value
//       .split(/[;,\n]/)
//       .map((part) => part.trim())
//       .filter(Boolean);
//   }
//   private boolNumber(value: number | boolean | string | null | undefined, fallback: 0 | 1): 0 | 1 {
//     if (value === undefined || value === null || value === '') return fallback;
//     if (typeof value === 'boolean') return value ? 1 : 0;
//     return Number(value) === 1 ? 1 : 0;
//   }
//   private normalizeToken(value: NullableString): string | null {
//     const cleaned = this.clean(value);
//     return cleaned ? cleaned.toUpperCase() : null;
//   }
//   private norm(value: NullableString): string {
//     return String(value ?? '').trim().toUpperCase();
//   }
//   private clean(value: NullableString): string | null {
//     const text = String(value ?? '').trim();
//     return text.length ? text : null;
//   }
//   private cleanIds(ids: string[]): string[] {
//     return Array.from(new Set((ids ?? []).map((id) => String(id ?? '').trim()).filter(Boolean)));
//   }
// }
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const actor_context_service_1 = require("./actor-context.service");
class RoutingRuleService {
    list() {
        return (0, db_1.getDb)()
            .prepare(`SELECT rr.*,
                t.name AS target_name,
                t.type AS target_type,
                t.enabled AS target_enabled,
                l.name AS lab_name,
                m.name AS machine_name,
                m.code AS machine_code
           FROM routing_rules rr
           LEFT JOIN targets t ON t.id = rr.target_id
           LEFT JOIN labs l ON l.id = rr.lab_id
           LEFT JOIN machines m ON m.id = rr.machine_id
          ORDER BY rr.enabled DESC, rr.priority ASC, rr.updated_at DESC`)
            .all()
            .map((row) => this.withDerivedMatch(row));
    }
    get(id) {
        const row = (0, db_1.getDb)()
            .prepare(`SELECT rr.*,
                t.name AS target_name,
                t.type AS target_type,
                t.enabled AS target_enabled,
                l.name AS lab_name,
                m.name AS machine_name,
                m.code AS machine_code
           FROM routing_rules rr
           LEFT JOIN targets t ON t.id = rr.target_id
           LEFT JOIN labs l ON l.id = rr.lab_id
           LEFT JOIN machines m ON m.id = rr.machine_id
          WHERE rr.id = ?`)
            .get(id);
        return row ? this.withDerivedMatch(row) : undefined;
    }
    create(input) {
        const now = new Date().toISOString();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const normalized = this.validateReferences(this.normalizeInput(input, true));
        const id = (0, crypto_1.randomUUID)();
        (0, db_1.getDb)()
            .prepare(`INSERT INTO routing_rules (
            id, name, enabled, priority, match_type, match_value, target_id, lab_id, machine_id, protocol,
            test_code, order_id, sample_id_pattern, source_message_type,
            stop_on_match, description, created_at, updated_at,
            created_by_user_id, created_by_username, updated_by_user_id, updated_by_username
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
            .run(id, normalized.name, normalized.enabled, normalized.priority, normalized.match_type, normalized.match_value, normalized.target_id, normalized.lab_id, normalized.machine_id, normalized.protocol, normalized.test_code, normalized.order_id, normalized.sample_id_pattern, normalized.source_message_type, normalized.stop_on_match, normalized.description, now, now, actor.userId, actor.username, actor.userId, actor.username);
        return this.get(id);
    }
    update(id, input) {
        const existing = this.get(id);
        if (!existing) {
            throw new Error('Routing rule not found.');
        }
        const now = new Date().toISOString();
        const actor = (0, actor_context_service_1.getCurrentActorStamp)();
        const merged = this.validateReferences(this.normalizeInput({ ...existing, ...input }, true));
        (0, db_1.getDb)()
            .prepare(`UPDATE routing_rules
            SET name = ?, enabled = ?, priority = ?, match_type = ?, match_value = ?, target_id = ?, lab_id = ?, machine_id = ?,
                protocol = ?, test_code = ?, order_id = ?, sample_id_pattern = ?,
                source_message_type = ?, stop_on_match = ?, description = ?, updated_at = ?,
                updated_by_user_id = ?, updated_by_username = ?
          WHERE id = ?`)
            .run(merged.name, merged.enabled, merged.priority, merged.match_type, merged.match_value, merged.target_id, merged.lab_id, merged.machine_id, merged.protocol, merged.test_code, merged.order_id, merged.sample_id_pattern, merged.source_message_type, merged.stop_on_match, merged.description, now, actor.userId, actor.username, id);
        return this.get(id);
    }
    remove(id) {
        const result = (0, db_1.getDb)().prepare('DELETE FROM routing_rules WHERE id = ?').run(id);
        return result.changes > 0;
    }
    delete(id) {
        return this.remove(id);
    }
    resolveTargets(normalizedResultId, fallbackTargetIds = []) {
        const source = this.getNormalizedRoutingSource(normalizedResultId);
        const warnings = [];
        if (!source) {
            const ids = this.cleanIds(fallbackTargetIds);
            return {
                targetIds: ids,
                matchedRules: [],
                fallbackTargetIds: ids,
                warnings: ['Normalized result was not found while resolving routing rules.'],
                source: ids.length ? 'fallback' : 'none',
            };
        }
        const rules = this.list().filter((rule) => Number(rule.enabled) === 1 && Number(rule.target_enabled ?? 0) === 1);
        const matchedRules = [];
        const targetIds = [];
        for (const rule of rules) {
            if (!this.matches(rule, source)) {
                continue;
            }
            if (!targetIds.includes(rule.target_id)) {
                targetIds.push(rule.target_id);
            }
            matchedRules.push({
                ruleId: rule.id,
                name: rule.name,
                targetId: rule.target_id,
                targetName: rule.target_name ?? null,
                priority: Number(rule.priority ?? 100),
                stopOnMatch: Number(rule.stop_on_match ?? 0) === 1,
            });
            if (Number(rule.stop_on_match ?? 0) === 1) {
                break;
            }
        }
        if (targetIds.length > 0) {
            return {
                targetIds,
                matchedRules,
                fallbackTargetIds: this.cleanIds(fallbackTargetIds),
                warnings,
                source: 'routing-rules',
            };
        }
        const fallback = this.cleanIds(fallbackTargetIds);
        if (fallback.length > 0) {
            warnings.push('No enabled routing rule matched this result. Falling back to approval-policy target routing.');
            return {
                targetIds: fallback,
                matchedRules: [],
                fallbackTargetIds: fallback,
                warnings,
                source: 'fallback',
            };
        }
        warnings.push('No enabled routing rule matched this result and no approval-policy target fallback is configured.');
        return {
            targetIds: [],
            matchedRules: [],
            fallbackTargetIds: [],
            warnings,
            source: 'none',
        };
    }
    previewForResult(normalizedResultId, fallbackTargetIds = []) {
        const normalizedResult = this.getNormalizedRoutingSource(normalizedResultId) ?? null;
        return {
            ...this.resolveTargets(normalizedResultId, fallbackTargetIds),
            normalizedResult,
        };
    }
    withDerivedMatch(row) {
        const storedType = this.normalizeToken(row.match_type);
        const storedValue = this.clean(row.match_value);
        const derived = this.deriveGenericMatch(row);
        const hasStoredMatch = !!storedType && storedType !== 'ANY' && !!storedValue;
        return {
            ...row,
            enabled: Number(row.enabled ?? 0),
            stop_on_match: Number(row.stop_on_match ?? 0),
            match_type: hasStoredMatch ? storedType : derived.match_type,
            match_value: hasStoredMatch ? storedValue : derived.match_value,
        };
    }
    deriveGenericMatch(row) {
        if (this.clean(row.test_code))
            return { match_type: 'TEST_CODE', match_value: this.clean(row.test_code) };
        if (this.clean(row.order_id))
            return { match_type: 'ORDER_CODE', match_value: this.clean(row.order_id) };
        if (this.clean(row.machine_id))
            return { match_type: 'MACHINE_ID', match_value: this.clean(row.machine_id) };
        if (this.clean(row.sample_id_pattern))
            return { match_type: 'SAMPLE_PREFIX', match_value: this.clean(row.sample_id_pattern) };
        if (this.clean(row.source_message_type))
            return { match_type: 'MESSAGE_TYPE', match_value: this.clean(row.source_message_type) };
        return { match_type: 'ANY', match_value: null };
    }
    mapGenericMatch(input) {
        const type = this.normalizeToken(input.match_type);
        const value = this.clean(input.match_value);
        if (!type || type === 'ANY' || !value)
            return {};
        switch (type) {
            case 'MACHINE_ID':
            case 'MACHINE_NAME':
                // Keep machine name/id free-text matchers in match_type/match_value.
                // The machine_id column is a real foreign key and should only be set from the machine dropdown.
                return {};
            case 'MESSAGE_TYPE':
                return { source_message_type: this.normalizeToken(value) };
            case 'ORDER_CODE':
                return { order_id: value };
            case 'TEST_CODE':
                return { test_code: value };
            case 'SAMPLE_PREFIX':
                return { sample_id_pattern: value.endsWith('*') ? value : `${value}*` };
            default:
                return {};
        }
    }
    getNormalizedRoutingSource(normalizedResultId) {
        return (0, db_1.getDb)()
            .prepare(`SELECT n.id,
                n.machine_id,
                m.name AS machine_name,
                m.code AS machine_code,
                m.lab_id,
                n.protocol,
                n.sample_id,
                n.order_id,
                n.test_code,
                n.source_message_type,
                n.data_json
           FROM normalized_lab_results n
           LEFT JOIN machines m ON m.id = n.machine_id
          WHERE n.id = ?`)
            .get(normalizedResultId);
    }
    normalizeInput(input, requireTarget) {
        const targetId = this.clean(input.target_id);
        if (requireTarget && !targetId) {
            throw new Error('Routing rule target is required.');
        }
        const name = this.clean(input.name) || 'Untitled routing rule';
        const priority = Number(input.priority ?? 100);
        const matchType = this.normalizeToken(input.match_type) || 'ANY';
        const matchValue = matchType === 'ANY' ? null : this.clean(input.match_value);
        const mapped = this.mapGenericMatch({ ...input, match_type: matchType, match_value: matchValue });
        return {
            name,
            enabled: this.boolNumber(input.enabled, 1),
            priority: Number.isFinite(priority) ? Math.max(1, Math.trunc(priority)) : 100,
            target_id: targetId,
            match_type: matchType,
            match_value: matchValue,
            lab_id: this.clean(input.lab_id),
            machine_id: this.clean(input.machine_id),
            protocol: this.normalizeToken(input.protocol),
            test_code: mapped.test_code ?? this.clean(input.test_code),
            order_id: mapped.order_id ?? this.clean(input.order_id),
            sample_id_pattern: mapped.sample_id_pattern ?? this.clean(input.sample_id_pattern),
            source_message_type: mapped.source_message_type ?? this.normalizeToken(input.source_message_type),
            stop_on_match: this.boolNumber(input.stop_on_match, 0),
            description: this.clean(input.description),
        };
    }
    validateReferences(input) {
        const targetId = this.clean(input.target_id);
        const labId = this.clean(input.lab_id);
        const machineId = this.clean(input.machine_id);
        if (!targetId) {
            throw new Error('Destination target is required before saving a routing rule.');
        }
        if (!this.referenceExists('targets', targetId)) {
            throw new Error('Selected target does not exist. Refresh targets and try again.');
        }
        if (labId && !this.referenceExists('labs', labId)) {
            throw new Error('Selected laboratory does not exist. Refresh laboratories and try again.');
        }
        if (machineId && !this.referenceExists('machines', machineId)) {
            throw new Error('Selected machine does not exist. Refresh machines and try again.');
        }
        return {
            ...input,
            target_id: targetId,
            lab_id: labId,
            machine_id: machineId,
        };
    }
    referenceExists(table, id) {
        const row = (0, db_1.getDb)().prepare(`SELECT id FROM ${table} WHERE id = ? LIMIT 1`).get(id);
        return !!row;
    }
    matches(rule, source) {
        return (this.matchesGenericRule(rule, source) &&
            this.matchesExact(rule.lab_id, source.lab_id) &&
            (this.matchesExact(rule.machine_id, source.machine_id) || this.matchesExact(rule.machine_id, source.machine_name) || this.matchesExact(rule.machine_id, source.machine_code)) &&
            this.matchesToken(rule.protocol, source.protocol) &&
            this.matchesPatternList(rule.test_code, source.test_code, this.extractAnalyzerCodes(source)) &&
            this.matchesPatternList(rule.order_id, source.order_id) &&
            this.matchesPatternList(rule.sample_id_pattern, source.sample_id) &&
            this.matchesToken(rule.source_message_type, source.source_message_type));
    }
    matchesGenericRule(rule, source) {
        const type = this.normalizeToken(rule.match_type) || 'ANY';
        const value = this.clean(rule.match_value);
        if (type === 'ANY' || !value) {
            return true;
        }
        switch (type) {
            case 'MACHINE_ID':
                return this.matchesPatternList(value, source.machine_id);
            case 'MACHINE_NAME':
                return this.matchesPatternList(value, source.machine_name, [source.machine_code ?? '', source.machine_id ?? '']);
            case 'MESSAGE_TYPE':
                return this.matchesToken(value, source.source_message_type);
            case 'ORDER_CODE':
                return this.matchesPatternList(value, source.order_id);
            case 'TEST_CODE':
                return this.matchesPatternList(value, source.test_code, this.extractAnalyzerCodes(source));
            case 'SAMPLE_PREFIX':
                return this.matchesPatternList(value.endsWith('*') ? value : `${value}*`, source.sample_id);
            default:
                return true;
        }
    }
    extractAnalyzerCodes(source) {
        const codes = new Set();
        try {
            const parsed = source.data_json ? JSON.parse(source.data_json) : null;
            const results = Array.isArray(parsed?.results) ? parsed.results : [];
            for (const row of results) {
                const code = row?.code ?? row?.testCode ?? row?.analyzerCode ?? row?.id;
                if (code !== undefined && code !== null && String(code).trim()) {
                    codes.add(String(code).trim());
                }
            }
        }
        catch {
            // Keep routing safe; invalid/legacy data_json should not break approval flow.
        }
        return Array.from(codes);
    }
    matchesExact(expected, actual) {
        const value = this.clean(expected);
        if (!value)
            return true;
        return String(actual ?? '').trim() === value;
    }
    matchesToken(expected, actual) {
        const value = this.clean(expected);
        if (!value)
            return true;
        return this.splitMatchers(value).some((entry) => this.norm(entry) === this.norm(actual));
    }
    matchesPatternList(expected, actual, additionalActuals = []) {
        const value = this.clean(expected);
        if (!value)
            return true;
        const candidates = [actual, ...additionalActuals]
            .map((item) => String(item ?? '').trim())
            .filter(Boolean);
        if (!candidates.length)
            return false;
        return this.splitMatchers(value).some((entry) => candidates.some((candidate) => this.matchesPattern(entry, candidate)));
    }
    matchesPattern(pattern, actual) {
        const expected = this.norm(pattern);
        const candidate = this.norm(actual);
        if (!expected)
            return true;
        if (expected === candidate)
            return true;
        if (expected.includes('*')) {
            const escaped = expected.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
            return new RegExp(`^${escaped}$`).test(candidate);
        }
        return false;
    }
    splitMatchers(value) {
        return value
            .split(/[;,\n]/)
            .map((part) => part.trim())
            .filter(Boolean);
    }
    boolNumber(value, fallback) {
        if (value === undefined || value === null || value === '')
            return fallback;
        if (typeof value === 'boolean')
            return value ? 1 : 0;
        return Number(value) === 1 ? 1 : 0;
    }
    normalizeToken(value) {
        const cleaned = this.clean(value);
        return cleaned ? cleaned.toUpperCase() : null;
    }
    norm(value) {
        return String(value ?? '').trim().toUpperCase();
    }
    clean(value) {
        const text = String(value ?? '').trim();
        return text.length ? text : null;
    }
    cleanIds(ids) {
        return Array.from(new Set((ids ?? []).map((id) => String(id ?? '').trim()).filter(Boolean)));
    }
}
exports.RoutingRuleService = RoutingRuleService;
