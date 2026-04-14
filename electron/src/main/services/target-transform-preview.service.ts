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

        if (rendered.summary.ruleCount === 0) {
            rendered.warnings.unshift(
                `No enabled mapping rules were found for ${target.type}. Returning the canonical source document as the preview payload.`,
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
                    : sourceDocument,
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
                    previewName:
                        queueRow.preview_name || `${target.name || target.type} · ${fallbackName}`,
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
            raw: rawData,
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
                    cursor[token] =
                        typeof nextToken === 'number' || nextToken === 'append' ? [] : {};
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
        if (
            (raw.startsWith('{') && raw.endsWith('}')) ||
            (raw.startsWith('[') && raw.endsWith(']'))
        ) {
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
