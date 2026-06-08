// // import { getDb } from '../db/db';
// // import {
// //     NormalizedResultRecord,
// //     TargetRecord,
// //     TransformPreviewResult,
// //     TransformPreviewSummary,
// // } from './target-transformer.interface';

// // type MappingRuleRow = {
// //     id: string;
// //     target_type: string;
// //     source_field: string;
// //     destination_field: string;
// //     transform_kind: 'direct' | 'constant' | 'lookup';
// //     constant_value?: string | null;
// //     enabled: number;
// //     value_mapping_enabled?: number;
// //     unmapped_behavior?: 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR' | null;
// //     default_destination_value?: string | null;
// // };

// // type TranslationRow = {
// //     id: string;
// //     mapping_rule_id: string;
// //     source_value: string;
// //     destination_value?: string | null;
// //     enabled: number;
// //     note?: string | null;
// // };

// // type RenderContext = {
// //     warnings: string[];
// //     errors: string[];
// //     summary: TransformPreviewSummary;
// // };

// // type PathToken = string | number | 'append';

// // export class TargetTransformPreviewService {
// //     preview(targetId: string, normalizedResultId: string): TransformPreviewResult {
// //         const target = this.getTarget(targetId);
// //         const result = this.getNormalizedResult(normalizedResultId);
// //         const sourceDocument = this.buildCanonicalSourceDocument(result, target);
// //         const rendered = this.renderMappings(target.type, sourceDocument);

// //         if (rendered.summary.ruleCount === 0) {
// //             rendered.warnings.unshift(
// //                 `No enabled mapping rules were found for ${target.type}. Returning the canonical source document as the preview payload.`,
// //             );
// //         }

// //         return {
// //             targetId: target.id,
// //             targetType: target.type,
// //             normalizedResultId: result.id,
// //             previewName: `${target.name || target.type} · Configured payload preview`,
// //             payload:
// //                 rendered.summary.ruleCount > 0 && Object.keys(rendered.payload).length > 0
// //                     ? rendered.payload
// //                     : sourceDocument,
// //             sourceDocument,
// //             warnings: rendered.warnings,
// //             errors: rendered.errors,
// //             summary: rendered.summary,
// //             payloadSource: 'regenerated',
// //         };
// //     }

// //     previewFromQueue(queueId: string): TransformPreviewResult {
// //         const queueRow = this.getQueueRow(queueId, 'Queue item not found');
// //         return this.previewFromStoredPayload(queueRow, 'Queued delivery payload', false);
// //     }

// //     previewFromDeliveryHistory(queueId: string): TransformPreviewResult {
// //         const queueRow = this.getQueueRow(queueId, 'Delivery history item not found');
// //         return this.previewFromStoredPayload(queueRow, 'Delivered payload', true);
// //     }

// //     private previewFromStoredPayload(
// //         queueRow: any,
// //         fallbackName: string,
// //         delivered: boolean,
// //     ): TransformPreviewResult {
// //         const target = this.getTarget(queueRow.target_id);
// //         const storedPayload = this.tryParseJson(queueRow.payload_json);

// //         if (storedPayload && typeof storedPayload === 'object' && !Array.isArray(storedPayload)) {
// //             if (!this.looksLikeLegacyFlatPayload(storedPayload)) {
// //                 const warnings = [
// //                     delivered
// //                         ? 'Preview is based on the stored delivered payload for operational accuracy.'
// //                         : 'Preview is based on the stored queue payload for operational accuracy.',
// //                     ...this.parseJsonArray(queueRow.transform_warnings_json),
// //                 ];
// //                 const errors = this.parseJsonArray(queueRow.transform_errors_json);
// //                 return {
// //                     targetId: target.id,
// //                     targetType: target.type,
// //                     normalizedResultId: queueRow.normalized_result_id,
// //                     previewName:
// //                         queueRow.preview_name || `${target.name || target.type} · ${fallbackName}`,
// //                     payload: storedPayload,
// //                     sourceDocument: this.tryParseJson(queueRow.source_snapshot_json) ?? undefined,
// //                     warnings,
// //                     errors,
// //                     summary: this.tryParseJson(queueRow.transform_summary_json) ?? undefined,
// //                     payloadSource: delivered ? 'stored_delivery' : 'stored_queue',
// //                 };
// //             }
// //         }

// //         const regenerated = this.preview(target.id, queueRow.normalized_result_id);
// //         const warnings = [...(regenerated.warnings ?? [])];
// //         if (storedPayload && this.looksLikeLegacyFlatPayload(storedPayload)) {
// //             warnings.unshift(
// //                 'Stored payload uses a legacy flat-key mapping snapshot. Preview was regenerated with the current nested renderer.',
// //             );
// //         } else {
// //             warnings.unshift(
// //                 'Stored payload metadata was unavailable or incomplete, so the preview was regenerated with the current mapping engine.',
// //             );
// //         }

// //         return {
// //             ...regenerated,
// //             warnings,
// //         };
// //     }

// //     private renderMappings(targetType: string, sourceDocument: Record<string, any>) {
// //         const db = getDb();
// //         const rules = db
// //             .prepare(
// //                 `
// //                     SELECT *
// //                     FROM target_mappings
// //                     WHERE target_type = ? AND enabled = 1
// //                     ORDER BY created_at ASC
// //                 `,
// //             )
// //             .all(targetType) as MappingRuleRow[];

// //         const translations = db
// //             .prepare(
// //                 `
// //                     SELECT *
// //                     FROM target_mapping_value_translations
// //                     WHERE enabled = 1
// //                 `,
// //             )
// //             .all() as TranslationRow[];

// //         const translationMap = new Map<string, TranslationRow[]>();
// //         for (const row of translations) {
// //             const bucket = translationMap.get(row.mapping_rule_id) ?? [];
// //             bucket.push(row);
// //             translationMap.set(row.mapping_rule_id, bucket);
// //         }

// //         const payload: Record<string, any> = {};
// //         const ctx: RenderContext = {
// //             warnings: [],
// //             errors: [],
// //             summary: {
// //                 ruleCount: rules.length,
// //                 appliedCount: 0,
// //                 skippedCount: 0,
// //                 translatedCount: 0,
// //             },
// //         };

// //         for (const rule of rules) {
// //             const destinationPath = String(rule.destination_field ?? '').trim();
// //             if (!destinationPath) {
// //                 ctx.errors.push(`Rule ${rule.id}: destination field is required.`);
// //                 ctx.summary.skippedCount += 1;
// //                 continue;
// //             }

// //             const resolved = this.resolveRuleValue(
// //                 rule,
// //                 sourceDocument,
// //                 translationMap.get(rule.id) ?? [],
// //                 ctx,
// //             );
// //             if (resolved.skip) {
// //                 ctx.summary.skippedCount += 1;
// //                 continue;
// //             }

// //             try {
// //                 this.setByPath(payload, destinationPath, resolved.value);
// //                 ctx.summary.appliedCount += 1;
// //                 if (resolved.translated) ctx.summary.translatedCount += 1;
// //             } catch (error: any) {
// //                 ctx.errors.push(
// //                     error?.message ??
// //                         `Rule ${rule.id}: failed to write destination path "${destinationPath}".`,
// //                 );
// //                 ctx.summary.skippedCount += 1;
// //             }
// //         }

// //         return { payload, ...ctx };
// //     }

// //     private resolveRuleValue(
// //         rule: MappingRuleRow,
// //         sourceDocument: Record<string, any>,
// //         translations: TranslationRow[],
// //         ctx: RenderContext,
// //     ): { value: any; skip: boolean; translated: boolean } {
// //         let resolved: any;

// //         if (rule.transform_kind === 'constant') {
// //             resolved = this.parseTypedConstant(rule.constant_value ?? null);
// //         } else {
// //             resolved = this.getByPath(sourceDocument, String(rule.source_field ?? '').trim());
// //         }

// //         const missing = resolved === undefined;

// //         if (rule.value_mapping_enabled === 1) {
// //             const translated = this.applyValueTranslation(rule, resolved, translations, ctx);
// //             if (translated.kind === 'skip') return { value: null, skip: true, translated: false };
// //             resolved = translated.value;
// //             return { value: resolved, skip: false, translated: translated.translated };
// //         }

// //         if (!missing) {
// //             return { value: resolved, skip: false, translated: false };
// //         }

// //         switch (String(rule.unmapped_behavior ?? 'PASSTHROUGH')) {
// //             case 'DEFAULT_VALUE':
// //                 return {
// //                     value: this.parseTypedConstant(rule.default_destination_value ?? null),
// //                     skip: false,
// //                     translated: false,
// //                 };
// //             case 'EMPTY':
// //                 return { value: null, skip: false, translated: false };
// //             case 'ERROR':
// //                 ctx.errors.push(
// //                     `Rule ${rule.id}: source path "${String(rule.source_field ?? '').trim()}" did not resolve a value.`,
// //                 );
// //                 return { value: null, skip: true, translated: false };
// //             case 'PASSTHROUGH':
// //             default:
// //                 ctx.warnings.push(
// //                     `Rule ${rule.id}: source path "${String(rule.source_field ?? '').trim()}" did not resolve a value; null was assigned.`,
// //                 );
// //                 return { value: null, skip: false, translated: false };
// //         }
// //     }

// //     private applyValueTranslation(
// //         rule: MappingRuleRow,
// //         rawValue: any,
// //         rows: TranslationRow[],
// //         ctx: RenderContext,
// //     ): { kind: 'ok'; value: any; translated: boolean } | { kind: 'skip' } {
// //         if (Array.isArray(rawValue)) {
// //             let translated = false;
// //             const values = rawValue.map((item) => {
// //                 const next = this.applyValueTranslation(rule, item, rows, ctx);
// //                 if (next.kind === 'ok' && next.translated) translated = true;
// //                 return next.kind === 'ok' ? next.value : null;
// //             });
// //             return { kind: 'ok', value: values, translated };
// //         }

// //         const rawKey = rawValue == null ? '' : String(rawValue);
// //         const match = rows.find((row) => String(row.source_value ?? '') === rawKey);
// //         if (match) {
// //             return {
// //                 kind: 'ok',
// //                 value: this.parseTypedConstant(match.destination_value ?? null),
// //                 translated: true,
// //             };
// //         }

// //         switch (String(rule.unmapped_behavior ?? 'PASSTHROUGH')) {
// //             case 'DEFAULT_VALUE':
// //                 return {
// //                     kind: 'ok',
// //                     value: this.parseTypedConstant(rule.default_destination_value ?? null),
// //                     translated: false,
// //                 };
// //             case 'EMPTY':
// //                 return { kind: 'ok', value: null, translated: false };
// //             case 'ERROR':
// //                 ctx.errors.push(
// //                     `Rule ${rule.id}: no value translation matched source value "${rawKey}" for destination "${rule.destination_field}".`,
// //                 );
// //                 return { kind: 'skip' };
// //             case 'PASSTHROUGH':
// //             default:
// //                 return { kind: 'ok', value: rawValue, translated: false };
// //         }
// //     }

// //     private buildCanonicalSourceDocument(
// //         result: NormalizedResultRecord,
// //         target?: TargetRecord,
// //     ): Record<string, any> {
// //         const rawData = this.tryParseJson(result.data_json) ?? {};

// //         return {
// //             meta: {
// //                 sourceDocumentVersion: 1,
// //                 generatedAt: new Date().toISOString(),
// //             },
// //             normalized: {
// //                 id: result.id,
// //                 machineId: result.machine_id,
// //                 protocol: result.protocol,
// //                 createdAt: result.created_at,
// //                 observedAt: result.observed_at ?? result.created_at,
// //                 sourceMessageType: result.source_message_type ?? null,
// //                 summary: result.summary ?? null,
// //             },
// //             patient: {
// //                 id: result.patient_id ?? null,
// //                 name: result.patient_name ?? null,
// //             },
// //             sample: {
// //                 id: result.sample_id ?? null,
// //             },
// //             specimen: {
// //                 id: result.sample_id ?? null,
// //                 sampleId: result.sample_id ?? null,
// //             },
// //             order: {
// //                 id: result.order_id ?? null,
// //             },
// //             result: {
// //                 code: result.test_code ?? null,
// //                 name: result.test_name ?? null,
// //                 value: result.value ?? null,
// //                 units: result.units ?? null,
// //                 referenceRange: result.reference_range ?? null,
// //                 abnormalFlag: result.abnormal_flag ?? null,
// //                 observedAt: result.observed_at ?? result.created_at,
// //             },
// //             source: {
// //                 machineId: result.machine_id,
// //                 protocol: result.protocol,
// //                 messageType: result.source_message_type ?? null,
// //                 createdAt: result.created_at,
// //                 observedAt: result.observed_at ?? result.created_at,
// //                 summary: result.summary ?? null,
// //             },
// //             target: target
// //                 ? {
// //                       id: target.id,
// //                       type: target.type,
// //                       name: target.name,
// //                       baseUrl: target.base_url,
// //                       enabled: target.enabled,
// //                   }
// //                 : undefined,
// //             raw: rawData,
// //         };
// //     }

// //     private getByPath(source: any, path: string): any {
// //         if (!path) return undefined;
// //         const tokens = this.parsePath(path);
// //         let cursor = source;
// //         for (const token of tokens) {
// //             if (cursor == null) return undefined;
// //             if (token === 'append') return undefined;
// //             cursor = cursor[token as any];
// //         }
// //         return cursor;
// //     }

// //     private setByPath(target: Record<string, any>, path: string, value: any) {
// //         const tokens = this.parsePath(path);
// //         if (!tokens.length) return;

// //         let cursor: any = target;
// //         for (let i = 0; i < tokens.length; i += 1) {
// //             const token = tokens[i];
// //             const isLast = i === tokens.length - 1;
// //             const nextToken = tokens[i + 1];

// //             if (typeof token === 'string') {
// //                 if (isLast) {
// //                     cursor[token] = value;
// //                     return;
// //                 }

// //                 if (cursor[token] == null || typeof cursor[token] !== 'object') {
// //                     cursor[token] =
// //                         typeof nextToken === 'number' || nextToken === 'append' ? [] : {};
// //                 }
// //                 cursor = cursor[token];
// //                 continue;
// //             }

// //             if (!Array.isArray(cursor)) {
// //                 throw new Error(
// //                     `Destination path "${path}" tries to address an array segment on a non-array value.`,
// //                 );
// //             }

// //             const index = token.toString() === 'append' ? cursor.length : token;
// //             if (cursor[index] == null) {
// //                 cursor[index] = isLast
// //                     ? value
// //                     : typeof nextToken === 'number' || nextToken === 'append'
// //                       ? []
// //                       : {};
// //             }

// //             if (isLast) {
// //                 cursor[index] = value;
// //                 return;
// //             }

// //             cursor = cursor[index];
// //         }
// //     }

// //     private parsePath(path: string): PathToken[] {
// //         const normalized = String(path ?? '').trim();
// //         if (!normalized) return [];

// //         const tokens: PathToken[] = [];
// //         let buffer = '';
// //         for (let i = 0; i < normalized.length; i += 1) {
// //             const ch = normalized[i];
// //             if (ch === '.') {
// //                 if (buffer) {
// //                     tokens.push(buffer);
// //                     buffer = '';
// //                 }
// //                 continue;
// //             }
// //             if (ch === '[') {
// //                 if (buffer) {
// //                     tokens.push(buffer);
// //                     buffer = '';
// //                 }
// //                 const end = normalized.indexOf(']', i);
// //                 const raw = end === -1 ? normalized.slice(i + 1) : normalized.slice(i + 1, end);
// //                 const trimmed = raw.trim();
// //                 if (trimmed === '') {
// //                     tokens.push('append');
// //                 } else if (/^\d+$/.test(trimmed)) {
// //                     tokens.push(Number(trimmed));
// //                 } else {
// //                     tokens.push(trimmed);
// //                 }
// //                 i = end === -1 ? normalized.length : end;
// //                 continue;
// //             }
// //             buffer += ch;
// //         }
// //         if (buffer) tokens.push(buffer);
// //         return tokens;
// //     }

// //     private parseTypedConstant(value: any): any {
// //         if (value == null) return null;
// //         const raw = String(value).trim();
// //         if (!raw) return null;
// //         if (raw === 'null') return null;
// //         if (raw === 'true') return true;
// //         if (raw === 'false') return false;
// //         if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
// //         if (
// //             (raw.startsWith('{') && raw.endsWith('}')) ||
// //             (raw.startsWith('[') && raw.endsWith(']'))
// //         ) {
// //             try {
// //                 return JSON.parse(raw);
// //             } catch {
// //                 return raw;
// //             }
// //         }
// //         return raw;
// //     }

// //     private looksLikeLegacyFlatPayload(payload: Record<string, any>): boolean {
// //         const keys = Object.keys(payload);
// //         return keys.some((key) => key.includes('[') || key.includes('.'));
// //     }

// //     private getTarget(targetId: string): TargetRecord {
// //         const db = getDb();
// //         const target = db
// //             .prepare(
// //                 `
// //                     SELECT *
// //                     FROM targets
// //                     WHERE id = ?
// //                     LIMIT 1
// //                 `,
// //             )
// //             .get(targetId) as TargetRecord | undefined;

// //         if (!target) throw new Error('Target not found');
// //         return target;
// //     }

// //     private getNormalizedResult(normalizedResultId: string): NormalizedResultRecord {
// //         const db = getDb();
// //         const result = db
// //             .prepare(
// //                 `
// //                     SELECT *
// //                     FROM normalized_lab_results
// //                     WHERE id = ?
// //                     LIMIT 1
// //                 `,
// //             )
// //             .get(normalizedResultId) as NormalizedResultRecord | undefined;

// //         if (!result) throw new Error('Normalized result not found');
// //         return result;
// //     }

// //     private getQueueRow(queueId: string, errorMessage: string) {
// //         const db = getDb();
// //         const queueRow = db
// //             .prepare(
// //                 `
// //                     SELECT *
// //                     FROM outbound_queue
// //                     WHERE id = ?
// //                     LIMIT 1
// //                 `,
// //             )
// //             .get(queueId) as any;

// //         if (!queueRow) throw new Error(errorMessage);
// //         return queueRow;
// //     }

// //     private tryParseJson(value: string | null | undefined) {
// //         if (!value || !String(value).trim()) return null;
// //         try {
// //             return JSON.parse(value);
// //         } catch {
// //             return null;
// //         }
// //     }

// //     private parseJsonArray(value: string | null | undefined): string[] {
// //         const parsed = this.tryParseJson(value);
// //         return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
// //     }
// // }

// import { getDb } from '../db/db';
// import {
//     NormalizedResultRecord,
//     TargetRecord,
//     TransformPreviewResult,
//     TransformPreviewSummary,
// } from './target-transformer.interface';

// type MappingRuleRow = {
//     id: string;
//     target_type: string;
//     source_field: string;
//     destination_field: string;
//     transform_kind: 'direct' | 'constant' | 'lookup';
//     constant_value?: string | null;
//     enabled: number;
//     value_mapping_enabled?: number;
//     unmapped_behavior?: 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR' | null;
//     default_destination_value?: string | null;
// };

// type TranslationRow = {
//     id: string;
//     mapping_rule_id: string;
//     source_value: string;
//     destination_value?: string | null;
//     enabled: number;
//     note?: string | null;
// };

// type RenderContext = {
//     warnings: string[];
//     errors: string[];
//     summary: TransformPreviewSummary;
// };

// type PathToken = string | number | 'append';

// export class TargetTransformPreviewService {
//     preview(targetId: string, normalizedResultId: string): TransformPreviewResult {
//         const target = this.getTarget(targetId);
//         const result = this.getNormalizedResult(normalizedResultId);
//         const sourceDocument = this.buildCanonicalSourceDocument(result, target);
//         const rendered = this.renderMappings(target.type, sourceDocument);
//         const defaultLisPayload =
//             target.type === 'LIS' ? this.buildDefaultLisPayload(sourceDocument) : null;

//         if (rendered.summary.ruleCount === 0) {
//             rendered.warnings.unshift(
//                 defaultLisPayload
//                     ? 'No enabled LIS mapping rules were found. Using the built-in LIS multiple-results payload generated from the normalized result.'
//                     : `No enabled mapping rules were found for ${target.type}. Returning the canonical source document as the preview payload.`,
//             );
//         }

//         return {
//             targetId: target.id,
//             targetType: target.type,
//             normalizedResultId: result.id,
//             previewName: `${target.name || target.type} · Configured payload preview`,
//             payload:
//                 rendered.summary.ruleCount > 0 && Object.keys(rendered.payload).length > 0
//                     ? rendered.payload
//                     : (defaultLisPayload ?? sourceDocument),
//             sourceDocument,
//             warnings: rendered.warnings,
//             errors: rendered.errors,
//             summary: rendered.summary,
//             payloadSource: 'regenerated',
//         };
//     }

//     previewFromQueue(queueId: string): TransformPreviewResult {
//         const queueRow = this.getQueueRow(queueId, 'Queue item not found');
//         return this.previewFromStoredPayload(queueRow, 'Queued delivery payload', false);
//     }

//     previewFromDeliveryHistory(queueId: string): TransformPreviewResult {
//         const queueRow = this.getQueueRow(queueId, 'Delivery history item not found');
//         return this.previewFromStoredPayload(queueRow, 'Delivered payload', true);
//     }

//     private previewFromStoredPayload(
//         queueRow: any,
//         fallbackName: string,
//         delivered: boolean,
//     ): TransformPreviewResult {
//         const target = this.getTarget(queueRow.target_id);
//         const storedPayload = this.tryParseJson(queueRow.payload_json);

//         if (storedPayload && typeof storedPayload === 'object' && !Array.isArray(storedPayload)) {
//             if (!this.looksLikeLegacyFlatPayload(storedPayload)) {
//                 const warnings = [
//                     delivered
//                         ? 'Preview is based on the stored delivered payload for operational accuracy.'
//                         : 'Preview is based on the stored queue payload for operational accuracy.',
//                     ...this.parseJsonArray(queueRow.transform_warnings_json),
//                 ];
//                 const errors = this.parseJsonArray(queueRow.transform_errors_json);
//                 return {
//                     targetId: target.id,
//                     targetType: target.type,
//                     normalizedResultId: queueRow.normalized_result_id,
//                     previewName: queueRow.preview_name || `${target.name || target.type} · ${fallbackName}`,
//                     payload: storedPayload,
//                     sourceDocument: this.tryParseJson(queueRow.source_snapshot_json) ?? undefined,
//                     warnings,
//                     errors,
//                     summary: this.tryParseJson(queueRow.transform_summary_json) ?? undefined,
//                     payloadSource: delivered ? 'stored_delivery' : 'stored_queue',
//                 };
//             }
//         }

//         const regenerated = this.preview(target.id, queueRow.normalized_result_id);
//         const warnings = [...(regenerated.warnings ?? [])];
//         if (storedPayload && this.looksLikeLegacyFlatPayload(storedPayload)) {
//             warnings.unshift(
//                 'Stored payload uses a legacy flat-key mapping snapshot. Preview was regenerated with the current nested renderer.',
//             );
//         } else {
//             warnings.unshift(
//                 'Stored payload metadata was unavailable or incomplete, so the preview was regenerated with the current mapping engine.',
//             );
//         }

//         return {
//             ...regenerated,
//             warnings,
//         };
//     }

//     private renderMappings(targetType: string, sourceDocument: Record<string, any>) {
//         const db = getDb();
//         const rules = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     WHERE target_type = ? AND enabled = 1
//                     ORDER BY created_at ASC
//                 `,
//             )
//             .all(targetType) as MappingRuleRow[];

//         const translations = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mapping_value_translations
//                     WHERE enabled = 1
//                 `,
//             )
//             .all() as TranslationRow[];

//         const translationMap = new Map<string, TranslationRow[]>();
//         for (const row of translations) {
//             const bucket = translationMap.get(row.mapping_rule_id) ?? [];
//             bucket.push(row);
//             translationMap.set(row.mapping_rule_id, bucket);
//         }

//         const payload: Record<string, any> = {};
//         const ctx: RenderContext = {
//             warnings: [],
//             errors: [],
//             summary: {
//                 ruleCount: rules.length,
//                 appliedCount: 0,
//                 skippedCount: 0,
//                 translatedCount: 0,
//             },
//         };

//         for (const rule of rules) {
//             const destinationPath = String(rule.destination_field ?? '').trim();
//             if (!destinationPath) {
//                 ctx.errors.push(`Rule ${rule.id}: destination field is required.`);
//                 ctx.summary.skippedCount += 1;
//                 continue;
//             }

//             const resolved = this.resolveRuleValue(
//                 rule,
//                 sourceDocument,
//                 translationMap.get(rule.id) ?? [],
//                 ctx,
//             );
//             if (resolved.skip) {
//                 ctx.summary.skippedCount += 1;
//                 continue;
//             }

//             try {
//                 this.setByPath(payload, destinationPath, resolved.value);
//                 ctx.summary.appliedCount += 1;
//                 if (resolved.translated) ctx.summary.translatedCount += 1;
//             } catch (error: any) {
//                 ctx.errors.push(
//                     error?.message ??
//                     `Rule ${rule.id}: failed to write destination path "${destinationPath}".`,
//                 );
//                 ctx.summary.skippedCount += 1;
//             }
//         }

//         return { payload, ...ctx };
//     }

//     private resolveRuleValue(
//         rule: MappingRuleRow,
//         sourceDocument: Record<string, any>,
//         translations: TranslationRow[],
//         ctx: RenderContext,
//     ): { value: any; skip: boolean; translated: boolean } {
//         let resolved: any;

//         if (rule.transform_kind === 'constant') {
//             resolved = this.parseTypedConstant(rule.constant_value ?? null);
//         } else {
//             resolved = this.getByPath(sourceDocument, String(rule.source_field ?? '').trim());
//         }

//         const missing = resolved === undefined;

//         if (rule.value_mapping_enabled === 1) {
//             const translated = this.applyValueTranslation(rule, resolved, translations, ctx);
//             if (translated.kind === 'skip') return { value: null, skip: true, translated: false };
//             resolved = translated.value;
//             return { value: resolved, skip: false, translated: translated.translated };
//         }

//         if (!missing) {
//             return { value: resolved, skip: false, translated: false };
//         }

//         switch (String(rule.unmapped_behavior ?? 'PASSTHROUGH')) {
//             case 'DEFAULT_VALUE':
//                 return {
//                     value: this.parseTypedConstant(rule.default_destination_value ?? null),
//                     skip: false,
//                     translated: false,
//                 };
//             case 'EMPTY':
//                 return { value: null, skip: false, translated: false };
//             case 'ERROR':
//                 ctx.errors.push(
//                     `Rule ${rule.id}: source path "${String(rule.source_field ?? '').trim()}" did not resolve a value.`,
//                 );
//                 return { value: null, skip: true, translated: false };
//             case 'PASSTHROUGH':
//             default:
//                 ctx.warnings.push(
//                     `Rule ${rule.id}: source path "${String(rule.source_field ?? '').trim()}" did not resolve a value; null was assigned.`,
//                 );
//                 return { value: null, skip: false, translated: false };
//         }
//     }

//     private applyValueTranslation(
//         rule: MappingRuleRow,
//         rawValue: any,
//         rows: TranslationRow[],
//         ctx: RenderContext,
//     ): { kind: 'ok'; value: any; translated: boolean } | { kind: 'skip' } {
//         if (Array.isArray(rawValue)) {
//             let translated = false;
//             const values = rawValue.map((item) => {
//                 const next = this.applyValueTranslation(rule, item, rows, ctx);
//                 if (next.kind === 'ok' && next.translated) translated = true;
//                 return next.kind === 'ok' ? next.value : null;
//             });
//             return { kind: 'ok', value: values, translated };
//         }

//         const rawKey = rawValue == null ? '' : String(rawValue);
//         const match = rows.find((row) => String(row.source_value ?? '') === rawKey);
//         if (match) {
//             return {
//                 kind: 'ok',
//                 value: this.parseTypedConstant(match.destination_value ?? null),
//                 translated: true,
//             };
//         }

//         switch (String(rule.unmapped_behavior ?? 'PASSTHROUGH')) {
//             case 'DEFAULT_VALUE':
//                 return {
//                     kind: 'ok',
//                     value: this.parseTypedConstant(rule.default_destination_value ?? null),
//                     translated: false,
//                 };
//             case 'EMPTY':
//                 return { kind: 'ok', value: null, translated: false };
//             case 'ERROR':
//                 ctx.errors.push(
//                     `Rule ${rule.id}: no value translation matched source value "${rawKey}" for destination "${rule.destination_field}".`,
//                 );
//                 return { kind: 'skip' };
//             case 'PASSTHROUGH':
//             default:
//                 return { kind: 'ok', value: rawValue, translated: false };
//         }
//     }

//     private buildCanonicalSourceDocument(
//         result: NormalizedResultRecord,
//         target?: TargetRecord,
//     ): Record<string, any> {
//         const rawData = this.tryParseJson(result.data_json) ?? {};
//         const lis = this.buildLisSourceDocument(rawData, result);

//         return {
//             meta: {
//                 sourceDocumentVersion: 1,
//                 generatedAt: new Date().toISOString(),
//             },
//             normalized: {
//                 id: result.id,
//                 machineId: result.machine_id,
//                 protocol: result.protocol,
//                 createdAt: result.created_at,
//                 observedAt: result.observed_at ?? result.created_at,
//                 sourceMessageType: result.source_message_type ?? null,
//                 summary: result.summary ?? null,
//             },
//             patient: {
//                 id: result.patient_id ?? null,
//                 name: result.patient_name ?? null,
//             },
//             sample: {
//                 id: result.sample_id ?? null,
//             },
//             specimen: {
//                 id: result.sample_id ?? null,
//                 sampleId: result.sample_id ?? null,
//             },
//             order: {
//                 id: result.order_id ?? null,
//             },
//             result: {
//                 code: result.test_code ?? null,
//                 name: result.test_name ?? null,
//                 value: result.value ?? null,
//                 units: result.units ?? null,
//                 referenceRange: result.reference_range ?? null,
//                 abnormalFlag: result.abnormal_flag ?? null,
//                 observedAt: result.observed_at ?? result.created_at,
//             },
//             source: {
//                 machineId: result.machine_id,
//                 protocol: result.protocol,
//                 messageType: result.source_message_type ?? null,
//                 createdAt: result.created_at,
//                 observedAt: result.observed_at ?? result.created_at,
//                 summary: result.summary ?? null,
//             },
//             target: target
//                 ? {
//                     id: target.id,
//                     type: target.type,
//                     name: target.name,
//                     baseUrl: target.base_url,
//                     enabled: target.enabled,
//                 }
//                 : undefined,
//             lis,
//             payload: lis
//                 ? {
//                     method: 'POST',
//                     endpoint: lis.endpoint,
//                     body: lis.multipleResultsPayload,
//                     contentType: 'application/json',
//                 }
//                 : undefined,
//             raw: rawData,
//         };
//     }

//     private buildLisSourceDocument(rawData: any, result: NormalizedResultRecord) {
//         const lis = rawData?.lis && typeof rawData.lis === 'object' ? rawData.lis : null;
//         const rows = Array.isArray(lis?.multipleResultsPayload)
//             ? lis.multipleResultsPayload
//             : this.buildLisRowsFromResults(rawData?.results ?? []);

//         if (!rows.length) return null;

//         return {
//             endpoint: lis?.endpoint ?? '/ws/rest/v1/lab/multipleresults',
//             requestBodyType: lis?.requestBodyType ?? 'array',
//             multipleResultsPayload: rows,
//             resultCount: rows.length,
//             sample: rawData?.sample ?? { uuid: result.sample_id ?? null },
//             order: rawData?.order ?? { uuid: result.order_id ?? null },
//             patient: rawData?.patient ?? {
//                 uuid: result.patient_id ?? null,
//                 name: result.patient_name ?? null,
//             },
//             instrument:
//                 rawData?.instrument ?? rows.find((row: any) => row?.instrument)?.instrument ?? null,
//             defaultRemarks: lis?.defaultRemarks ?? 'Machine interfaced result 1',
//         };
//     }

//     private buildLisRowsFromResults(results: any[]) {
//         if (!Array.isArray(results)) return [];
//         return results
//             .filter((row) => row && typeof row === 'object')
//             .map((row) => ({
//                 concept: row?.concept?.uuid ? { uuid: row.concept.uuid } : null,
//                 testAllocation: row?.testAllocation?.uuid ? { uuid: row.testAllocation.uuid } : null,
//                 valueNumeric: row?.valueNumeric ?? null,
//                 valueText: row?.valueText ?? null,
//                 valueCoded: row?.valueCoded?.uuid ? { uuid: row.valueCoded.uuid } : null,
//                 abnormal: Boolean(row?.abnormal),
//                 instrument: row?.instrument?.uuid ? { uuid: row.instrument.uuid } : null,
//                 status: {
//                     category: 'RESULT_REMARKS',
//                     status: 'REMARKS',
//                     remarks: 'Machine interfaced result 1',
//                 },
//                 testedDate: row?.observedAt ?? null,
//                 testedBy: row?.testedBy ?? null,
//             }));
//     }

//     private buildDefaultLisPayload(sourceDocument: Record<string, any>) {
//         const lis = sourceDocument?.lis;
//         const rows = Array.isArray(lis?.multipleResultsPayload) ? lis.multipleResultsPayload : [];
//         if (!rows.length) return null;

//         return {
//             method: 'POST',
//             endpoint: lis.endpoint ?? '/ws/rest/v1/lab/multipleresults',
//             contentType: 'application/json',
//             body: rows,
//             context: {
//                 sample: lis.sample ?? sourceDocument?.sample ?? null,
//                 order: lis.order ?? sourceDocument?.order ?? null,
//                 patient: lis.patient ?? sourceDocument?.patient ?? null,
//                 instrument: lis.instrument ?? sourceDocument?.raw?.instrument ?? null,
//                 resultCount: rows.length,
//             },
//         };
//     }

//     private getByPath(source: any, path: string): any {
//         if (!path) return undefined;
//         const tokens = this.parsePath(path);
//         let cursor = source;
//         for (const token of tokens) {
//             if (cursor == null) return undefined;
//             if (token === 'append') return undefined;
//             cursor = cursor[token as any];
//         }
//         return cursor;
//     }

//     private setByPath(target: Record<string, any>, path: string, value: any) {
//         const tokens = this.parsePath(path);
//         if (!tokens.length) return;

//         let cursor: any = target;
//         for (let i = 0; i < tokens.length; i += 1) {
//             const token = tokens[i];
//             const isLast = i === tokens.length - 1;
//             const nextToken = tokens[i + 1];

//             if (typeof token === 'string') {
//                 if (isLast) {
//                     cursor[token] = value;
//                     return;
//                 }

//                 if (cursor[token] == null || typeof cursor[token] !== 'object') {
//                     cursor[token] = typeof nextToken === 'number' || nextToken === 'append' ? [] : {};
//                 }
//                 cursor = cursor[token];
//                 continue;
//             }

//             if (!Array.isArray(cursor)) {
//                 throw new Error(
//                     `Destination path "${path}" tries to address an array segment on a non-array value.`,
//                 );
//             }

//             const index = token.toString() === 'append' ? cursor.length : token;
//             if (cursor[index] == null) {
//                 cursor[index] = isLast
//                     ? value
//                     : typeof nextToken === 'number' || nextToken === 'append'
//                         ? []
//                         : {};
//             }

//             if (isLast) {
//                 cursor[index] = value;
//                 return;
//             }

//             cursor = cursor[index];
//         }
//     }

//     private parsePath(path: string): PathToken[] {
//         const normalized = String(path ?? '').trim();
//         if (!normalized) return [];

//         const tokens: PathToken[] = [];
//         let buffer = '';
//         for (let i = 0; i < normalized.length; i += 1) {
//             const ch = normalized[i];
//             if (ch === '.') {
//                 if (buffer) {
//                     tokens.push(buffer);
//                     buffer = '';
//                 }
//                 continue;
//             }
//             if (ch === '[') {
//                 if (buffer) {
//                     tokens.push(buffer);
//                     buffer = '';
//                 }
//                 const end = normalized.indexOf(']', i);
//                 const raw = end === -1 ? normalized.slice(i + 1) : normalized.slice(i + 1, end);
//                 const trimmed = raw.trim();
//                 if (trimmed === '') {
//                     tokens.push('append');
//                 } else if (/^\d+$/.test(trimmed)) {
//                     tokens.push(Number(trimmed));
//                 } else {
//                     tokens.push(trimmed);
//                 }
//                 i = end === -1 ? normalized.length : end;
//                 continue;
//             }
//             buffer += ch;
//         }
//         if (buffer) tokens.push(buffer);
//         return tokens;
//     }

//     private parseTypedConstant(value: any): any {
//         if (value == null) return null;
//         const raw = String(value).trim();
//         if (!raw) return null;
//         if (raw === 'null') return null;
//         if (raw === 'true') return true;
//         if (raw === 'false') return false;
//         if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
//         if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
//             try {
//                 return JSON.parse(raw);
//             } catch {
//                 return raw;
//             }
//         }
//         return raw;
//     }

//     private looksLikeLegacyFlatPayload(payload: Record<string, any>): boolean {
//         const keys = Object.keys(payload);
//         return keys.some((key) => key.includes('[') || key.includes('.'));
//     }

//     private getTarget(targetId: string): TargetRecord {
//         const db = getDb();
//         const target = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM targets
//                     WHERE id = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(targetId) as TargetRecord | undefined;

//         if (!target) throw new Error('Target not found');
//         return target;
//     }

//     private getNormalizedResult(normalizedResultId: string): NormalizedResultRecord {
//         const db = getDb();
//         const result = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM normalized_lab_results
//                     WHERE id = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(normalizedResultId) as NormalizedResultRecord | undefined;

//         if (!result) throw new Error('Normalized result not found');
//         return result;
//     }

//     private getQueueRow(queueId: string, errorMessage: string) {
//         const db = getDb();
//         const queueRow = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM outbound_queue
//                     WHERE id = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(queueId) as any;

//         if (!queueRow) throw new Error(errorMessage);
//         return queueRow;
//     }

//     private tryParseJson(value: string | null | undefined) {
//         if (!value || !String(value).trim()) return null;
//         try {
//             return JSON.parse(value);
//         } catch {
//             return null;
//         }
//     }

//     private parseJsonArray(value: string | null | undefined): string[] {
//         const parsed = this.tryParseJson(value);
//         return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
//     }
// }


// import { getDb } from '../db/db';
// import {
//     NormalizedResultRecord,
//     TargetRecord,
//     TransformPreviewResult,
//     TransformPreviewSummary,
// } from './target-transformer.interface';

// type MappingRuleRow = {
//     id: string;
//     target_type: string;
//     source_field: string;
//     destination_field: string;
//     transform_kind: 'direct' | 'constant' | 'lookup';
//     constant_value?: string | null;
//     enabled: number;
//     value_mapping_enabled?: number;
//     unmapped_behavior?: 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR' | null;
//     default_destination_value?: string | null;
// };

// type TranslationRow = {
//     id: string;
//     mapping_rule_id: string;
//     source_value: string;
//     destination_value?: string | null;
//     enabled: number;
//     note?: string | null;
// };

// type RenderContext = {
//     warnings: string[];
//     errors: string[];
//     summary: TransformPreviewSummary;
// };

// type PathToken = string | number | 'append';

// export class TargetTransformPreviewService {
//     preview(targetId: string, normalizedResultId: string): TransformPreviewResult {
//         const target = this.getTarget(targetId);
//         const result = this.getNormalizedResult(normalizedResultId);
//         const sourceDocument = this.buildCanonicalSourceDocument(result, target);
//         const rendered = this.renderMappings(target.type, sourceDocument);

//         if (rendered.summary.ruleCount === 0) {
//             rendered.warnings.unshift(
//                 `No enabled mapping rules were found for ${target.type}. Returning the canonical source document as the preview payload.`,
//             );
//         }

//         return {
//             targetId: target.id,
//             targetType: target.type,
//             normalizedResultId: result.id,
//             previewName: `${target.name || target.type} · Configured payload preview`,
//             payload:
//                 rendered.summary.ruleCount > 0 && Object.keys(rendered.payload).length > 0
//                     ? rendered.payload
//                     : sourceDocument,
//             sourceDocument,
//             warnings: rendered.warnings,
//             errors: rendered.errors,
//             summary: rendered.summary,
//             payloadSource: 'regenerated',
//         };
//     }

//     previewFromQueue(queueId: string): TransformPreviewResult {
//         const queueRow = this.getQueueRow(queueId, 'Queue item not found');
//         return this.previewFromStoredPayload(queueRow, 'Queued delivery payload', false);
//     }

//     previewFromDeliveryHistory(queueId: string): TransformPreviewResult {
//         const queueRow = this.getQueueRow(queueId, 'Delivery history item not found');
//         return this.previewFromStoredPayload(queueRow, 'Delivered payload', true);
//     }

//     private previewFromStoredPayload(
//         queueRow: any,
//         fallbackName: string,
//         delivered: boolean,
//     ): TransformPreviewResult {
//         const target = this.getTarget(queueRow.target_id);
//         const storedPayload = this.tryParseJson(queueRow.payload_json);

//         if (storedPayload && typeof storedPayload === 'object' && !Array.isArray(storedPayload)) {
//             if (!this.looksLikeLegacyFlatPayload(storedPayload)) {
//                 const warnings = [
//                     delivered
//                         ? 'Preview is based on the stored delivered payload for operational accuracy.'
//                         : 'Preview is based on the stored queue payload for operational accuracy.',
//                     ...this.parseJsonArray(queueRow.transform_warnings_json),
//                 ];
//                 const errors = this.parseJsonArray(queueRow.transform_errors_json);
//                 return {
//                     targetId: target.id,
//                     targetType: target.type,
//                     normalizedResultId: queueRow.normalized_result_id,
//                     previewName:
//                         queueRow.preview_name || `${target.name || target.type} · ${fallbackName}`,
//                     payload: storedPayload,
//                     sourceDocument: this.tryParseJson(queueRow.source_snapshot_json) ?? undefined,
//                     warnings,
//                     errors,
//                     summary: this.tryParseJson(queueRow.transform_summary_json) ?? undefined,
//                     payloadSource: delivered ? 'stored_delivery' : 'stored_queue',
//                 };
//             }
//         }

//         const regenerated = this.preview(target.id, queueRow.normalized_result_id);
//         const warnings = [...(regenerated.warnings ?? [])];
//         if (storedPayload && this.looksLikeLegacyFlatPayload(storedPayload)) {
//             warnings.unshift(
//                 'Stored payload uses a legacy flat-key mapping snapshot. Preview was regenerated with the current nested renderer.',
//             );
//         } else {
//             warnings.unshift(
//                 'Stored payload metadata was unavailable or incomplete, so the preview was regenerated with the current mapping engine.',
//             );
//         }

//         return {
//             ...regenerated,
//             warnings,
//         };
//     }

//     private renderMappings(targetType: string, sourceDocument: Record<string, any>) {
//         const db = getDb();
//         const rules = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     WHERE target_type = ? AND enabled = 1
//                     ORDER BY created_at ASC
//                 `,
//             )
//             .all(targetType) as MappingRuleRow[];

//         const translations = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mapping_value_translations
//                     WHERE enabled = 1
//                 `,
//             )
//             .all() as TranslationRow[];

//         const translationMap = new Map<string, TranslationRow[]>();
//         for (const row of translations) {
//             const bucket = translationMap.get(row.mapping_rule_id) ?? [];
//             bucket.push(row);
//             translationMap.set(row.mapping_rule_id, bucket);
//         }

//         const payload: Record<string, any> = {};
//         const ctx: RenderContext = {
//             warnings: [],
//             errors: [],
//             summary: {
//                 ruleCount: rules.length,
//                 appliedCount: 0,
//                 skippedCount: 0,
//                 translatedCount: 0,
//             },
//         };

//         for (const rule of rules) {
//             const destinationPath = String(rule.destination_field ?? '').trim();
//             if (!destinationPath) {
//                 ctx.errors.push(`Rule ${rule.id}: destination field is required.`);
//                 ctx.summary.skippedCount += 1;
//                 continue;
//             }

//             const resolved = this.resolveRuleValue(
//                 rule,
//                 sourceDocument,
//                 translationMap.get(rule.id) ?? [],
//                 ctx,
//             );
//             if (resolved.skip) {
//                 ctx.summary.skippedCount += 1;
//                 continue;
//             }

//             try {
//                 this.setByPath(payload, destinationPath, resolved.value);
//                 ctx.summary.appliedCount += 1;
//                 if (resolved.translated) ctx.summary.translatedCount += 1;
//             } catch (error: any) {
//                 ctx.errors.push(
//                     error?.message ??
//                         `Rule ${rule.id}: failed to write destination path "${destinationPath}".`,
//                 );
//                 ctx.summary.skippedCount += 1;
//             }
//         }

//         return { payload, ...ctx };
//     }

//     private resolveRuleValue(
//         rule: MappingRuleRow,
//         sourceDocument: Record<string, any>,
//         translations: TranslationRow[],
//         ctx: RenderContext,
//     ): { value: any; skip: boolean; translated: boolean } {
//         let resolved: any;

//         if (rule.transform_kind === 'constant') {
//             resolved = this.parseTypedConstant(rule.constant_value ?? null);
//         } else {
//             resolved = this.getByPath(sourceDocument, String(rule.source_field ?? '').trim());
//         }

//         const missing = resolved === undefined;

//         if (rule.value_mapping_enabled === 1) {
//             const translated = this.applyValueTranslation(rule, resolved, translations, ctx);
//             if (translated.kind === 'skip') return { value: null, skip: true, translated: false };
//             resolved = translated.value;
//             return { value: resolved, skip: false, translated: translated.translated };
//         }

//         if (!missing) {
//             return { value: resolved, skip: false, translated: false };
//         }

//         switch (String(rule.unmapped_behavior ?? 'PASSTHROUGH')) {
//             case 'DEFAULT_VALUE':
//                 return {
//                     value: this.parseTypedConstant(rule.default_destination_value ?? null),
//                     skip: false,
//                     translated: false,
//                 };
//             case 'EMPTY':
//                 return { value: null, skip: false, translated: false };
//             case 'ERROR':
//                 ctx.errors.push(
//                     `Rule ${rule.id}: source path "${String(rule.source_field ?? '').trim()}" did not resolve a value.`,
//                 );
//                 return { value: null, skip: true, translated: false };
//             case 'PASSTHROUGH':
//             default:
//                 ctx.warnings.push(
//                     `Rule ${rule.id}: source path "${String(rule.source_field ?? '').trim()}" did not resolve a value; null was assigned.`,
//                 );
//                 return { value: null, skip: false, translated: false };
//         }
//     }

//     private applyValueTranslation(
//         rule: MappingRuleRow,
//         rawValue: any,
//         rows: TranslationRow[],
//         ctx: RenderContext,
//     ): { kind: 'ok'; value: any; translated: boolean } | { kind: 'skip' } {
//         if (Array.isArray(rawValue)) {
//             let translated = false;
//             const values = rawValue.map((item) => {
//                 const next = this.applyValueTranslation(rule, item, rows, ctx);
//                 if (next.kind === 'ok' && next.translated) translated = true;
//                 return next.kind === 'ok' ? next.value : null;
//             });
//             return { kind: 'ok', value: values, translated };
//         }

//         const rawKey = rawValue == null ? '' : String(rawValue);
//         const match = rows.find((row) => String(row.source_value ?? '') === rawKey);
//         if (match) {
//             return {
//                 kind: 'ok',
//                 value: this.parseTypedConstant(match.destination_value ?? null),
//                 translated: true,
//             };
//         }

//         switch (String(rule.unmapped_behavior ?? 'PASSTHROUGH')) {
//             case 'DEFAULT_VALUE':
//                 return {
//                     kind: 'ok',
//                     value: this.parseTypedConstant(rule.default_destination_value ?? null),
//                     translated: false,
//                 };
//             case 'EMPTY':
//                 return { kind: 'ok', value: null, translated: false };
//             case 'ERROR':
//                 ctx.errors.push(
//                     `Rule ${rule.id}: no value translation matched source value "${rawKey}" for destination "${rule.destination_field}".`,
//                 );
//                 return { kind: 'skip' };
//             case 'PASSTHROUGH':
//             default:
//                 return { kind: 'ok', value: rawValue, translated: false };
//         }
//     }

//     private buildCanonicalSourceDocument(
//         result: NormalizedResultRecord,
//         target?: TargetRecord,
//     ): Record<string, any> {
//         const rawData = this.tryParseJson(result.data_json) ?? {};

//         return {
//             meta: {
//                 sourceDocumentVersion: 1,
//                 generatedAt: new Date().toISOString(),
//             },
//             normalized: {
//                 id: result.id,
//                 machineId: result.machine_id,
//                 protocol: result.protocol,
//                 createdAt: result.created_at,
//                 observedAt: result.observed_at ?? result.created_at,
//                 sourceMessageType: result.source_message_type ?? null,
//                 summary: result.summary ?? null,
//             },
//             patient: {
//                 id: result.patient_id ?? null,
//                 name: result.patient_name ?? null,
//             },
//             sample: {
//                 id: result.sample_id ?? null,
//             },
//             specimen: {
//                 id: result.sample_id ?? null,
//                 sampleId: result.sample_id ?? null,
//             },
//             order: {
//                 id: result.order_id ?? null,
//             },
//             result: {
//                 code: result.test_code ?? null,
//                 name: result.test_name ?? null,
//                 value: result.value ?? null,
//                 units: result.units ?? null,
//                 referenceRange: result.reference_range ?? null,
//                 abnormalFlag: result.abnormal_flag ?? null,
//                 observedAt: result.observed_at ?? result.created_at,
//             },
//             source: {
//                 machineId: result.machine_id,
//                 protocol: result.protocol,
//                 messageType: result.source_message_type ?? null,
//                 createdAt: result.created_at,
//                 observedAt: result.observed_at ?? result.created_at,
//                 summary: result.summary ?? null,
//             },
//             target: target
//                 ? {
//                       id: target.id,
//                       type: target.type,
//                       name: target.name,
//                       baseUrl: target.base_url,
//                       enabled: target.enabled,
//                   }
//                 : undefined,
//             raw: rawData,
//         };
//     }

//     private getByPath(source: any, path: string): any {
//         if (!path) return undefined;
//         const tokens = this.parsePath(path);
//         let cursor = source;
//         for (const token of tokens) {
//             if (cursor == null) return undefined;
//             if (token === 'append') return undefined;
//             cursor = cursor[token as any];
//         }
//         return cursor;
//     }

//     private setByPath(target: Record<string, any>, path: string, value: any) {
//         const tokens = this.parsePath(path);
//         if (!tokens.length) return;

//         let cursor: any = target;
//         for (let i = 0; i < tokens.length; i += 1) {
//             const token = tokens[i];
//             const isLast = i === tokens.length - 1;
//             const nextToken = tokens[i + 1];

//             if (typeof token === 'string') {
//                 if (isLast) {
//                     cursor[token] = value;
//                     return;
//                 }

//                 if (cursor[token] == null || typeof cursor[token] !== 'object') {
//                     cursor[token] =
//                         typeof nextToken === 'number' || nextToken === 'append' ? [] : {};
//                 }
//                 cursor = cursor[token];
//                 continue;
//             }

//             if (!Array.isArray(cursor)) {
//                 throw new Error(
//                     `Destination path "${path}" tries to address an array segment on a non-array value.`,
//                 );
//             }

//             const index = token.toString() === 'append' ? cursor.length : token;
//             if (cursor[index] == null) {
//                 cursor[index] = isLast
//                     ? value
//                     : typeof nextToken === 'number' || nextToken === 'append'
//                       ? []
//                       : {};
//             }

//             if (isLast) {
//                 cursor[index] = value;
//                 return;
//             }

//             cursor = cursor[index];
//         }
//     }

//     private parsePath(path: string): PathToken[] {
//         const normalized = String(path ?? '').trim();
//         if (!normalized) return [];

//         const tokens: PathToken[] = [];
//         let buffer = '';
//         for (let i = 0; i < normalized.length; i += 1) {
//             const ch = normalized[i];
//             if (ch === '.') {
//                 if (buffer) {
//                     tokens.push(buffer);
//                     buffer = '';
//                 }
//                 continue;
//             }
//             if (ch === '[') {
//                 if (buffer) {
//                     tokens.push(buffer);
//                     buffer = '';
//                 }
//                 const end = normalized.indexOf(']', i);
//                 const raw = end === -1 ? normalized.slice(i + 1) : normalized.slice(i + 1, end);
//                 const trimmed = raw.trim();
//                 if (trimmed === '') {
//                     tokens.push('append');
//                 } else if (/^\d+$/.test(trimmed)) {
//                     tokens.push(Number(trimmed));
//                 } else {
//                     tokens.push(trimmed);
//                 }
//                 i = end === -1 ? normalized.length : end;
//                 continue;
//             }
//             buffer += ch;
//         }
//         if (buffer) tokens.push(buffer);
//         return tokens;
//     }

//     private parseTypedConstant(value: any): any {
//         if (value == null) return null;
//         const raw = String(value).trim();
//         if (!raw) return null;
//         if (raw === 'null') return null;
//         if (raw === 'true') return true;
//         if (raw === 'false') return false;
//         if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
//         if (
//             (raw.startsWith('{') && raw.endsWith('}')) ||
//             (raw.startsWith('[') && raw.endsWith(']'))
//         ) {
//             try {
//                 return JSON.parse(raw);
//             } catch {
//                 return raw;
//             }
//         }
//         return raw;
//     }

//     private looksLikeLegacyFlatPayload(payload: Record<string, any>): boolean {
//         const keys = Object.keys(payload);
//         return keys.some((key) => key.includes('[') || key.includes('.'));
//     }

//     private getTarget(targetId: string): TargetRecord {
//         const db = getDb();
//         const target = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM targets
//                     WHERE id = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(targetId) as TargetRecord | undefined;

//         if (!target) throw new Error('Target not found');
//         return target;
//     }

//     private getNormalizedResult(normalizedResultId: string): NormalizedResultRecord {
//         const db = getDb();
//         const result = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM normalized_lab_results
//                     WHERE id = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(normalizedResultId) as NormalizedResultRecord | undefined;

//         if (!result) throw new Error('Normalized result not found');
//         return result;
//     }

//     private getQueueRow(queueId: string, errorMessage: string) {
//         const db = getDb();
//         const queueRow = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM outbound_queue
//                     WHERE id = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(queueId) as any;

//         if (!queueRow) throw new Error(errorMessage);
//         return queueRow;
//     }

//     private tryParseJson(value: string | null | undefined) {
//         if (!value || !String(value).trim()) return null;
//         try {
//             return JSON.parse(value);
//         } catch {
//             return null;
//         }
//     }

//     private parseJsonArray(value: string | null | undefined): string[] {
//         const parsed = this.tryParseJson(value);
//         return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
//     }
// }

import { getDb } from '../db/db';
import {
    NormalizedResultRecord,
    TargetRecord,
    TransformPreviewResult,
    TransformPreviewSummary,
} from './target-transformer.interface';

type MappingRuleRow = {
    id: string;
    target_type: string;
    source_field: string;
    destination_field: string;
    transform_kind: 'direct' | 'constant' | 'lookup';
    constant_value?: string | null;
    enabled: number;
    value_mapping_enabled?: number;
    unmapped_behavior?: 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR' | null;
    default_destination_value?: string | null;
};

type TranslationRow = {
    id: string;
    mapping_rule_id: string;
    source_value: string;
    destination_value?: string | null;
    enabled: number;
    note?: string | null;
};

type RenderContext = {
    warnings: string[];
    errors: string[];
    summary: TransformPreviewSummary;
};

type PathToken = string | number | 'append';

export class TargetTransformPreviewService {
    preview(targetId: string, normalizedResultId: string): TransformPreviewResult {
        const target = this.getTarget(targetId);
        const result = this.getNormalizedResult(normalizedResultId);
        const sourceDocument = this.buildCanonicalSourceDocument(result, target);
        const rendered = this.renderMappings(target.type, sourceDocument);
        const defaultLisPayload =
            target.type === 'LIS' ? this.buildDefaultLisPayload(sourceDocument) : null;
        this.applyLisResultHandlingMessages(rendered, sourceDocument, defaultLisPayload);

        if (rendered.summary.ruleCount === 0) {
            rendered.warnings.unshift(
                defaultLisPayload
                    ? 'No enabled LIS mapping rules were found. Using the built-in LIS multiple-results payload generated from the normalized result.'
                    : `No enabled mapping rules were found for ${target.type}. Returning the canonical source document as the preview payload.`,
            );
        }

        return {
            targetId: target.id,
            targetType: target.type,
            normalizedResultId: result.id,
            previewName: `${target.name || target.type} · Configured payload preview`,
            payload:
                rendered.summary.ruleCount > 0 && Object.keys(rendered.payload).length > 0
                    ? rendered.payload
                    : (defaultLisPayload ?? sourceDocument),
            sourceDocument,
            warnings: rendered.warnings,
            errors: rendered.errors,
            summary: rendered.summary,
            payloadSource: 'regenerated',
        };
    }

    previewFromQueue(queueId: string): TransformPreviewResult {
        const queueRow = this.getQueueRow(queueId, 'Queue item not found');
        return this.previewFromStoredPayload(queueRow, 'Queued delivery payload', false);
    }

    previewFromDeliveryHistory(queueId: string): TransformPreviewResult {
        const queueRow = this.getQueueRow(queueId, 'Delivery history item not found');
        return this.previewFromStoredPayload(queueRow, 'Delivered payload', true);
    }

    private previewFromStoredPayload(
        queueRow: any,
        fallbackName: string,
        delivered: boolean,
    ): TransformPreviewResult {
        const target = this.getTarget(queueRow.target_id);
        const storedPayload = this.tryParseJson(queueRow.payload_json);

        if (storedPayload && typeof storedPayload === 'object' && !Array.isArray(storedPayload)) {
            if (!this.looksLikeLegacyFlatPayload(storedPayload)) {
                const warnings = [
                    delivered
                        ? 'Preview is based on the stored delivered payload for operational accuracy.'
                        : 'Preview is based on the stored queue payload for operational accuracy.',
                    ...this.parseJsonArray(queueRow.transform_warnings_json),
                ];
                const errors = this.parseJsonArray(queueRow.transform_errors_json);
                return {
                    targetId: target.id,
                    targetType: target.type,
                    normalizedResultId: queueRow.normalized_result_id,
                    previewName: queueRow.preview_name || `${target.name || target.type} · ${fallbackName}`,
                    payload: storedPayload,
                    sourceDocument: this.tryParseJson(queueRow.source_snapshot_json) ?? undefined,
                    warnings,
                    errors,
                    summary: this.tryParseJson(queueRow.transform_summary_json) ?? undefined,
                    payloadSource: delivered ? 'stored_delivery' : 'stored_queue',
                };
            }
        }

        const regenerated = this.preview(target.id, queueRow.normalized_result_id);
        const warnings = [...(regenerated.warnings ?? [])];
        if (storedPayload && this.looksLikeLegacyFlatPayload(storedPayload)) {
            warnings.unshift(
                'Stored payload uses a legacy flat-key mapping snapshot. Preview was regenerated with the current nested renderer.',
            );
        } else {
            warnings.unshift(
                'Stored payload metadata was unavailable or incomplete, so the preview was regenerated with the current mapping engine.',
            );
        }

        return {
            ...regenerated,
            warnings,
        };
    }

    private renderMappings(targetType: string, sourceDocument: Record<string, any>) {
        const db = getDb();
        const rules = db
            .prepare(
                `
                    SELECT *
                    FROM target_mappings
                    WHERE target_type = ? AND enabled = 1
                    ORDER BY created_at ASC
                `,
            )
            .all(targetType) as MappingRuleRow[];

        const translations = db
            .prepare(
                `
                    SELECT *
                    FROM target_mapping_value_translations
                    WHERE enabled = 1
                `,
            )
            .all() as TranslationRow[];

        const translationMap = new Map<string, TranslationRow[]>();
        for (const row of translations) {
            const bucket = translationMap.get(row.mapping_rule_id) ?? [];
            bucket.push(row);
            translationMap.set(row.mapping_rule_id, bucket);
        }

        const payload: Record<string, any> = {};
        const ctx: RenderContext = {
            warnings: [],
            errors: [],
            summary: {
                ruleCount: rules.length,
                appliedCount: 0,
                skippedCount: 0,
                translatedCount: 0,
            },
        };

        for (const rule of rules) {
            const destinationPath = String(rule.destination_field ?? '').trim();
            if (!destinationPath) {
                ctx.errors.push(`Rule ${rule.id}: destination field is required.`);
                ctx.summary.skippedCount += 1;
                continue;
            }

            const resolved = this.resolveRuleValue(
                rule,
                sourceDocument,
                translationMap.get(rule.id) ?? [],
                ctx,
            );
            if (resolved.skip) {
                ctx.summary.skippedCount += 1;
                continue;
            }

            try {
                this.setByPath(payload, destinationPath, resolved.value);
                ctx.summary.appliedCount += 1;
                if (resolved.translated) ctx.summary.translatedCount += 1;
            } catch (error: any) {
                ctx.errors.push(
                    error?.message ??
                    `Rule ${rule.id}: failed to write destination path "${destinationPath}".`,
                );
                ctx.summary.skippedCount += 1;
            }
        }

        return { payload, ...ctx };
    }

    private resolveRuleValue(
        rule: MappingRuleRow,
        sourceDocument: Record<string, any>,
        translations: TranslationRow[],
        ctx: RenderContext,
    ): { value: any; skip: boolean; translated: boolean } {
        let resolved: any;

        if (rule.transform_kind === 'constant') {
            resolved = this.parseTypedConstant(rule.constant_value ?? null);
        } else {
            resolved = this.getByPath(sourceDocument, String(rule.source_field ?? '').trim());
        }

        const missing = resolved === undefined;

        if (rule.value_mapping_enabled === 1) {
            const translated = this.applyValueTranslation(rule, resolved, translations, ctx);
            if (translated.kind === 'skip') return { value: null, skip: true, translated: false };
            resolved = translated.value;
            return { value: resolved, skip: false, translated: translated.translated };
        }

        if (!missing) {
            return { value: resolved, skip: false, translated: false };
        }

        switch (String(rule.unmapped_behavior ?? 'PASSTHROUGH')) {
            case 'DEFAULT_VALUE':
                return {
                    value: this.parseTypedConstant(rule.default_destination_value ?? null),
                    skip: false,
                    translated: false,
                };
            case 'EMPTY':
                return { value: null, skip: false, translated: false };
            case 'ERROR':
                ctx.errors.push(
                    `Rule ${rule.id}: source path "${String(rule.source_field ?? '').trim()}" did not resolve a value.`,
                );
                return { value: null, skip: true, translated: false };
            case 'PASSTHROUGH':
            default:
                ctx.warnings.push(
                    `Rule ${rule.id}: source path "${String(rule.source_field ?? '').trim()}" did not resolve a value; null was assigned.`,
                );
                return { value: null, skip: false, translated: false };
        }
    }

    private applyValueTranslation(
        rule: MappingRuleRow,
        rawValue: any,
        rows: TranslationRow[],
        ctx: RenderContext,
    ): { kind: 'ok'; value: any; translated: boolean } | { kind: 'skip' } {
        if (Array.isArray(rawValue)) {
            let translated = false;
            const values = rawValue.map((item) => {
                const next = this.applyValueTranslation(rule, item, rows, ctx);
                if (next.kind === 'ok' && next.translated) translated = true;
                return next.kind === 'ok' ? next.value : null;
            });
            return { kind: 'ok', value: values, translated };
        }

        const rawKey = rawValue == null ? '' : String(rawValue);
        const match = rows.find((row) => String(row.source_value ?? '') === rawKey);
        if (match) {
            return {
                kind: 'ok',
                value: this.parseTypedConstant(match.destination_value ?? null),
                translated: true,
            };
        }

        switch (String(rule.unmapped_behavior ?? 'PASSTHROUGH')) {
            case 'DEFAULT_VALUE':
                return {
                    kind: 'ok',
                    value: this.parseTypedConstant(rule.default_destination_value ?? null),
                    translated: false,
                };
            case 'EMPTY':
                return { kind: 'ok', value: null, translated: false };
            case 'ERROR':
                ctx.errors.push(
                    `Rule ${rule.id}: no value translation matched source value "${rawKey}" for destination "${rule.destination_field}".`,
                );
                return { kind: 'skip' };
            case 'PASSTHROUGH':
            default:
                return { kind: 'ok', value: rawValue, translated: false };
        }
    }

    private buildCanonicalSourceDocument(
        result: NormalizedResultRecord,
        target?: TargetRecord,
    ): Record<string, any> {
        const rawData = this.tryParseJson(result.data_json) ?? {};
        const lis = this.buildLisSourceDocument(rawData, result);

        return {
            meta: {
                sourceDocumentVersion: 1,
                generatedAt: new Date().toISOString(),
            },
            normalized: {
                id: result.id,
                machineId: result.machine_id,
                protocol: result.protocol,
                createdAt: result.created_at,
                observedAt: result.observed_at ?? result.created_at,
                sourceMessageType: result.source_message_type ?? null,
                summary: result.summary ?? null,
            },
            patient: {
                id: result.patient_id ?? null,
                name: result.patient_name ?? null,
            },
            sample: {
                id: result.sample_id ?? null,
            },
            specimen: {
                id: result.sample_id ?? null,
                sampleId: result.sample_id ?? null,
            },
            order: {
                id: result.order_id ?? null,
            },
            result: {
                code: result.test_code ?? null,
                name: result.test_name ?? null,
                value: result.value ?? null,
                units: result.units ?? null,
                referenceRange: result.reference_range ?? null,
                abnormalFlag: result.abnormal_flag ?? null,
                observedAt: result.observed_at ?? result.created_at,
            },
            source: {
                machineId: result.machine_id,
                protocol: result.protocol,
                messageType: result.source_message_type ?? null,
                createdAt: result.created_at,
                observedAt: result.observed_at ?? result.created_at,
                summary: result.summary ?? null,
            },
            target: target
                ? {
                    id: target.id,
                    type: target.type,
                    name: target.name,
                    baseUrl: target.base_url,
                    enabled: target.enabled,
                }
                : undefined,
            lis,
            payload: lis
                ? {
                    method: 'POST',
                    endpoint: lis.endpoint,
                    body: lis.multipleResultsPayload,
                    contentType: 'application/json',
                }
                : undefined,
            raw: rawData,
        };
    }

    private buildLisSourceDocument(rawData: any, result: NormalizedResultRecord) {
        const lis = rawData?.lis && typeof rawData.lis === 'object' ? rawData.lis : null;
        const rows = Array.isArray(lis?.multipleResultsPayload)
            ? lis.multipleResultsPayload
            : this.buildLisRowsFromResults(rawData?.results ?? []);

        if (!rows.length) return null;

        const handling = this.resolveLisResultHandling(rows, rawData);

        return {
            endpoint: lis?.endpoint ?? '/ws/rest/v1/lab/multipleresults',
            requestBodyType: lis?.requestBodyType ?? 'array',
            multipleResultsPayload: handling.rows,
            resultCount: handling.rows.length,
            originalResultCount: rows.length,
            resultHandling: handling.summary,
            sample: rawData?.sample ?? { uuid: result.sample_id ?? null },
            order: rawData?.order ?? { uuid: result.order_id ?? null },
            patient: rawData?.patient ?? {
                uuid: result.patient_id ?? null,
                name: result.patient_name ?? null,
            },
            instrument:
                rawData?.instrument ?? rows.find((row: any) => row?.instrument)?.instrument ?? null,
            defaultRemarks: lis?.defaultRemarks ?? 'Machine interfaced result 1',
        };
    }

    private buildLisRowsFromResults(results: any[]) {
        if (!Array.isArray(results)) return [];
        return results
            .filter((row) => row && typeof row === 'object')
            .map((row) => ({
                concept: row?.concept?.uuid ? { uuid: row.concept.uuid } : null,
                testAllocation: row?.testAllocation?.uuid ? { uuid: row.testAllocation.uuid } : null,
                valueNumeric: row?.valueNumeric ?? null,
                valueText: row?.valueText ?? null,
                valueCoded: row?.valueCoded?.uuid ? { uuid: row.valueCoded.uuid } : null,
                abnormal: Boolean(row?.abnormal),
                instrument: row?.instrument?.uuid ? { uuid: row.instrument.uuid } : null,
                status: {
                    category: 'RESULT_REMARKS',
                    status: 'REMARKS',
                    remarks: 'Machine interfaced result 1',
                },
                testedDate: row?.observedAt ?? null,
                testedBy: row?.testedBy ?? null,
            }));
    }

    private applyLisResultHandlingMessages(rendered: any, sourceDocument: any, defaultPayload: any): void {
        const handling = this.extractLisResultHandling(sourceDocument, defaultPayload);
        if (!handling) return;

        const warnings = Array.isArray(handling.warnings)
            ? handling.warnings.map((item: unknown) => String(item))
            : [];
        const errors = Array.isArray(handling.errors)
            ? handling.errors.map((item: unknown) => String(item))
            : [];

        rendered.warnings = Array.isArray(rendered.warnings) ? rendered.warnings : [];
        rendered.errors = Array.isArray(rendered.errors) ? rendered.errors : [];

        for (const warning of warnings) {
            if (!rendered.warnings.includes(warning)) rendered.warnings.push(warning);
        }
        for (const error of errors) {
            if (!rendered.errors.includes(error)) rendered.errors.push(error);
        }

        const summary: any = rendered.summary && typeof rendered.summary === 'object' ? rendered.summary : {};
        summary.lisResultHandling = handling;
        summary.lisReadyRows = Number(handling.readyRowCount ?? 0);
        summary.lisSkippedDuplicates = Number(handling.skippedDuplicateCount ?? 0);
        summary.lisBlockedExistingResults = Number(handling.blockedExistingCount ?? 0);
        rendered.summary = summary;
    }

    private extractLisResultHandling(sourceDocument: any, defaultPayload: any): any | null {
        const fromPayload = defaultPayload?.context?.resultHandling;
        if (fromPayload && typeof fromPayload === 'object') return fromPayload;
        const fromSource = sourceDocument?.lis?.resultHandling;
        if (fromSource && typeof fromSource === 'object') return fromSource;
        return null;
    }

    private resolveLisResultHandling(rows: any[], rawData: any): { rows: any[]; summary: any } {
        const inputRows = Array.isArray(rows) ? rows.filter((row) => row && typeof row === 'object') : [];
        const allocations = this.findLisAllocationCandidates(rawData);
        const readyRows: any[] = [];
        const warnings: string[] = [];
        const errors: string[] = [];
        const rowSummaries: any[] = [];

        let skippedDuplicateCount = 0;
        let blockedExistingCount = 0;
        let existingMatchCount = 0;
        let correctionCount = 0;
        let repeatCount = 0;

        for (let index = 0; index < inputRows.length; index += 1) {
            const row = inputRows[index];
            const mode = this.resolveLisResultMode(row, rawData);
            const existing = this.findExistingLisResultsForRow(row, allocations);
            const sameValueExisting = existing.filter((result) =>
                this.lisRowValueMatchesExistingResult(row, result),
            );
            const rowSummary = this.buildLisHandlingRowSummary(row, index, mode, existing, sameValueExisting);

            if (existing.length) existingMatchCount += existing.length;

            if (mode === 'CORRECTION') {
                correctionCount += existing.length ? 1 : 0;
                if (existing.length) {
                    warnings.push(
                        `Correction result detected for ${rowSummary.label}. ${existing.length} existing LIS result(s) were found and the new corrected value will be prepared as a new /lab/multipleresults row.`,
                    );
                    rowSummary.decision = 'READY_CORRECTION';
                }
                readyRows.push(row);
                rowSummaries.push(rowSummary);
                continue;
            }

            if (mode === 'REPEAT') {
                repeatCount += existing.length ? 1 : 0;
                if (existing.length) {
                    warnings.push(
                        `Repeat/rerun result detected for ${rowSummary.label}. ${existing.length} existing LIS result(s) were found and this repeat result will be prepared as a new /lab/multipleresults row.`,
                    );
                    rowSummary.decision = 'READY_REPEAT';
                }
                readyRows.push(row);
                rowSummaries.push(rowSummary);
                continue;
            }

            if (sameValueExisting.length) {
                skippedDuplicateCount += 1;
                rowSummary.decision = 'SKIPPED_DUPLICATE';
                warnings.push(
                    `Skipped duplicate LIS result for ${rowSummary.label}; the same value already exists in LIS. Mark the message as repeat/rerun or correction if it must be submitted again.`,
                );
                rowSummaries.push(rowSummary);
                continue;
            }

            if (existing.length) {
                blockedExistingCount += 1;
                rowSummary.decision = 'BLOCKED_EXISTING_RESULT';
                errors.push(
                    `Existing LIS result found for ${rowSummary.label}, but the incoming analyzer message is not marked as repeat/rerun or correction. Rebuild after confirming the result intent.`,
                );
                rowSummaries.push(rowSummary);
                continue;
            }

            rowSummary.decision = 'READY_INITIAL';
            readyRows.push(row);
            rowSummaries.push(rowSummary);
        }

        if (inputRows.length > 0 && readyRows.length === 0) {
            errors.push(
                'No LIS result rows remain after duplicate/repeat/correction handling. Review existing LIS results or mark the analyzer message as repeat/rerun or correction where appropriate.',
            );
        }

        return {
            rows: readyRows,
            summary: {
                mode: this.resolveLisResultMode(rawData?.lis?.resultHandling ?? rawData, rawData),
                originalRowCount: inputRows.length,
                readyRowCount: readyRows.length,
                skippedDuplicateCount,
                blockedExistingCount,
                existingMatchCount,
                correctionCount,
                repeatCount,
                hasExistingLisResults: existingMatchCount > 0,
                warnings,
                errors,
                rows: rowSummaries,
            },
        };
    }

    private findLisAllocationCandidates(rawData: any): any[] {
        const candidates = [
            rawData?.lis?.allocations,
            rawData?.lis?.metadata?.allocations,
            rawData?.openmrs?.allocations,
            rawData?.allocations,
            rawData?.sample?.allocations,
        ];

        for (const candidate of candidates) {
            if (Array.isArray(candidate)) return candidate;
            if (Array.isArray(candidate?.results)) return candidate.results;
        }

        return [];
    }

    private findExistingLisResultsForRow(row: any, allocations: any[]): any[] {
        const allocationUuid = String(row?.testAllocation?.uuid ?? row?.testAllocationUuid ?? '').trim();
        const conceptUuid = String(row?.concept?.uuid ?? row?.conceptUuid ?? '').trim();
        if (!allocations.length || (!allocationUuid && !conceptUuid)) return [];

        const existing: any[] = [];
        for (const allocation of allocations) {
            const candidateAllocationUuid = String(allocation?.uuid ?? allocation?.testAllocation?.uuid ?? '').trim();
            const candidateConceptUuid = String(
                allocation?.concept?.uuid ?? allocation?.parameter?.uuid ?? allocation?.testParameter?.uuid ?? '',
            ).trim();
            const allocationMatches = !!allocationUuid && candidateAllocationUuid === allocationUuid;
            const conceptMatches = !!conceptUuid && candidateConceptUuid === conceptUuid;
            if (!allocationMatches && !conceptMatches) continue;

            const results = Array.isArray(allocation?.results)
                ? allocation.results
                : Array.isArray(allocation?.testResults)
                  ? allocation.testResults
                  : [];

            for (const result of results) {
                const resultConceptUuid = String(result?.concept?.uuid ?? result?.conceptUuid ?? '').trim();
                if (conceptUuid && resultConceptUuid && resultConceptUuid !== conceptUuid) continue;
                if (result?.voided === true) continue;
                existing.push(result);
            }
        }

        return existing;
    }

    private resolveLisResultMode(row: any, rawData: any): 'INITIAL' | 'REPEAT' | 'CORRECTION' {
        const values = [
            row?.resultIntent,
            row?.resultMode,
            row?.resultAction,
            row?.correctionType,
            row?.obxStatus,
            row?.resultStatus,
            row?.status?.resultStatus,
            rawData?.lis?.resultHandling?.mode,
            rawData?.lis?.resultIntent,
            rawData?.lis?.resultMode,
            rawData?.resultIntent,
            rawData?.resultMode,
            rawData?.resultAction,
            rawData?.resultStatus,
            rawData?.obxStatus,
            rawData?.status?.resultStatus,
        ];

        for (const value of values) {
            const normalized = String(value ?? '').trim().toUpperCase();
            if (!normalized) continue;
            if (['C', 'CORRECTED', 'CORRECTION', 'AMENDED', 'CORRECTED_RESULT'].includes(normalized)) {
                return 'CORRECTION';
            }
            if (['R', 'REPEAT', 'RERUN', 'RETEST', 'REPEATED', 'REPEAT_RESULT'].includes(normalized)) {
                return 'REPEAT';
            }
            if (normalized.includes('CORRECT')) return 'CORRECTION';
            if (normalized.includes('RERUN') || normalized.includes('REPEAT') || normalized.includes('RETEST')) {
                return 'REPEAT';
            }
        }

        return 'INITIAL';
    }

    private buildLisHandlingRowSummary(
        row: any,
        index: number,
        mode: string,
        existing: any[],
        sameValueExisting: any[],
    ): any {
        const label = this.describeLisPayloadRow(row, index);
        return {
            index,
            label,
            mode,
            decision: 'READY_INITIAL',
            analyzerCode: row?.analyzerCode ?? row?.code ?? row?.parameterCode ?? null,
            conceptUuid: row?.concept?.uuid ?? row?.conceptUuid ?? null,
            allocationUuid: row?.testAllocation?.uuid ?? row?.testAllocationUuid ?? null,
            incomingValue: this.lisValueSignature(row),
            existingResultCount: existing.length,
            sameValueExistingCount: sameValueExisting.length,
            existingResultUuids: existing.map((result) => result?.uuid).filter(Boolean),
        };
    }

    private describeLisPayloadRow(row: any, index: number): string {
        const analyzerCode = row?.analyzerCode ?? row?.code ?? row?.parameterCode ?? row?.parameter?.code;
        const concept = row?.concept?.display ?? row?.concept?.uuid ?? row?.conceptUuid;
        const allocation = row?.testAllocation?.uuid ?? row?.testAllocationUuid;
        return String(analyzerCode || concept || allocation || `row ${index + 1}`);
    }

    private lisRowValueMatchesExistingResult(row: any, existing: any): boolean {
        const incoming = this.lisValueSignature(row);
        const saved = this.lisValueSignature(existing);
        return !!incoming && !!saved && incoming === saved;
    }

    private lisValueSignature(row: any): string {
        const codedUuid = row?.valueCoded?.uuid ?? row?.valueCodedUuid;
        if (codedUuid !== undefined && codedUuid !== null && codedUuid !== '') {
            return `coded:${String(codedUuid).trim()}`;
        }

        const codedDisplay = row?.valueCoded?.display ?? row?.valueCoded?.name;
        if (codedDisplay !== undefined && codedDisplay !== null && codedDisplay !== '') {
            return `coded-display:${String(codedDisplay).trim().toUpperCase()}`;
        }

        const numeric = row?.valueNumeric;
        if (numeric !== undefined && numeric !== null && numeric !== '') {
            const n = Number(numeric);
            return Number.isFinite(n) ? `numeric:${n}` : `numeric:${String(numeric).trim()}`;
        }

        const text = row?.valueText;
        if (text !== undefined && text !== null && text !== '') return `text:${String(text).trim()}`;

        const booleanValue = row?.valueBoolean;
        if (booleanValue !== undefined && booleanValue !== null && booleanValue !== '') {
            return `boolean:${String(booleanValue)}`;
        }

        const dateValue = row?.valueDateTime;
        if (dateValue !== undefined && dateValue !== null && dateValue !== '') {
            return `datetime:${String(dateValue).trim()}`;
        }

        return '';
    }

    private buildDefaultLisPayload(sourceDocument: Record<string, any>) {
        const lis = sourceDocument?.lis;
        const rows = Array.isArray(lis?.multipleResultsPayload) ? lis.multipleResultsPayload : [];
        if (!rows.length) return null;

        return {
            method: 'POST',
            endpoint: lis.endpoint ?? '/ws/rest/v1/lab/multipleresults',
            contentType: 'application/json',
            body: rows,
            context: {
                sample: lis.sample ?? sourceDocument?.sample ?? null,
                order: lis.order ?? sourceDocument?.order ?? null,
                patient: lis.patient ?? sourceDocument?.patient ?? null,
                instrument: lis.instrument ?? sourceDocument?.raw?.instrument ?? null,
                resultCount: rows.length,
                resultHandling: lis.resultHandling ?? null,
            },
        };
    }

    private getByPath(source: any, path: string): any {
        if (!path) return undefined;
        const tokens = this.parsePath(path);
        let cursor = source;
        for (const token of tokens) {
            if (cursor == null) return undefined;
            if (token === 'append') return undefined;
            cursor = cursor[token as any];
        }
        return cursor;
    }

    private setByPath(target: Record<string, any>, path: string, value: any) {
        const tokens = this.parsePath(path);
        if (!tokens.length) return;

        let cursor: any = target;
        for (let i = 0; i < tokens.length; i += 1) {
            const token = tokens[i];
            const isLast = i === tokens.length - 1;
            const nextToken = tokens[i + 1];

            if (typeof token === 'string') {
                if (isLast) {
                    cursor[token] = value;
                    return;
                }

                if (cursor[token] == null || typeof cursor[token] !== 'object') {
                    cursor[token] = typeof nextToken === 'number' || nextToken === 'append' ? [] : {};
                }
                cursor = cursor[token];
                continue;
            }

            if (!Array.isArray(cursor)) {
                throw new Error(
                    `Destination path "${path}" tries to address an array segment on a non-array value.`,
                );
            }

            const index = token.toString() === 'append' ? cursor.length : token;
            if (cursor[index] == null) {
                cursor[index] = isLast
                    ? value
                    : typeof nextToken === 'number' || nextToken === 'append'
                        ? []
                        : {};
            }

            if (isLast) {
                cursor[index] = value;
                return;
            }

            cursor = cursor[index];
        }
    }

    private parsePath(path: string): PathToken[] {
        const normalized = String(path ?? '').trim();
        if (!normalized) return [];

        const tokens: PathToken[] = [];
        let buffer = '';
        for (let i = 0; i < normalized.length; i += 1) {
            const ch = normalized[i];
            if (ch === '.') {
                if (buffer) {
                    tokens.push(buffer);
                    buffer = '';
                }
                continue;
            }
            if (ch === '[') {
                if (buffer) {
                    tokens.push(buffer);
                    buffer = '';
                }
                const end = normalized.indexOf(']', i);
                const raw = end === -1 ? normalized.slice(i + 1) : normalized.slice(i + 1, end);
                const trimmed = raw.trim();
                if (trimmed === '') {
                    tokens.push('append');
                } else if (/^\d+$/.test(trimmed)) {
                    tokens.push(Number(trimmed));
                } else {
                    tokens.push(trimmed);
                }
                i = end === -1 ? normalized.length : end;
                continue;
            }
            buffer += ch;
        }
        if (buffer) tokens.push(buffer);
        return tokens;
    }

    private parseTypedConstant(value: any): any {
        if (value == null) return null;
        const raw = String(value).trim();
        if (!raw) return null;
        if (raw === 'null') return null;
        if (raw === 'true') return true;
        if (raw === 'false') return false;
        if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
        if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
            try {
                return JSON.parse(raw);
            } catch {
                return raw;
            }
        }
        return raw;
    }

    private looksLikeLegacyFlatPayload(payload: Record<string, any>): boolean {
        const keys = Object.keys(payload);
        return keys.some((key) => key.includes('[') || key.includes('.'));
    }

    private getTarget(targetId: string): TargetRecord {
        const db = getDb();
        const target = db
            .prepare(
                `
                    SELECT *
                    FROM targets
                    WHERE id = ?
                    LIMIT 1
                `,
            )
            .get(targetId) as TargetRecord | undefined;

        if (!target) throw new Error('Target not found');
        return target;
    }

    private getNormalizedResult(normalizedResultId: string): NormalizedResultRecord {
        const db = getDb();
        const result = db
            .prepare(
                `
                    SELECT *
                    FROM normalized_lab_results
                    WHERE id = ?
                    LIMIT 1
                `,
            )
            .get(normalizedResultId) as NormalizedResultRecord | undefined;

        if (!result) throw new Error('Normalized result not found');
        return result;
    }

    private getQueueRow(queueId: string, errorMessage: string) {
        const db = getDb();
        const queueRow = db
            .prepare(
                `
                    SELECT *
                    FROM outbound_queue
                    WHERE id = ?
                    LIMIT 1
                `,
            )
            .get(queueId) as any;

        if (!queueRow) throw new Error(errorMessage);
        return queueRow;
    }

    private tryParseJson(value: string | null | undefined) {
        if (!value || !String(value).trim()) return null;
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }

    private parseJsonArray(value: string | null | undefined): string[] {
        const parsed = this.tryParseJson(value);
        return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    }
}
