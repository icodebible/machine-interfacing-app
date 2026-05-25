import { getDb } from '../db/db';
import { TargetRecord } from './target-transformer.interface';

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

type BuilderResult = {
    used: boolean;
    payload: Record<string, any>;
    warnings: string[];
    errors: string[];
};

type Observation = {
    code?: string | null;
    name?: string | null;
    value?: any;
    rawValue?: any;
    valueText?: string | null;
    valueType?: string | null;
    units?: string | null;
    referenceRange?: string | null;
    abnormalFlag?: string | null;
    resultStatus?: string | null;
    observedAt?: string | null;
    instrumentRaw?: string | null;
    equipment?: Array<{ identifier?: string | null; text?: string | null; codingSystem?: string | null }>;
    target?: Record<string, any>;
    targetConceptUuid?: string | null;
    testAllocationUuid?: string | null;
    targetAllocationUuid?: string | null;
    valueCodedUuid?: string | null;
    targetDatatype?: string | null;
};

const MULTIPLE_RESULTS_ENDPOINT = '/openmrs/ws/rest/v1/lab/multipleresults';

const DESTINATION_ALIASES = {
    endpoint: [
        'lis.endpoint',
        'openmrs.endpoint',
        'payload.endpoint',
        'endpoint',
    ],
    instrumentUuid: [
        'lis.defaults.instrumentUuid',
        'lis.default.instrumentUuid',
        'payload.body[].instrument.uuid',
        'body[].instrument.uuid',
        'instrument.uuid',
    ],
    testedBy: [
        'lis.defaults.testedBy',
        'lis.default.testedBy',
        'payload.body[].testedBy',
        'body[].testedBy',
        'testedBy',
    ],
    statusCategory: [
        'lis.defaults.status.category',
        'payload.body[].status.category',
        'body[].status.category',
        'status.category',
    ],
    statusStatus: [
        'lis.defaults.status.status',
        'payload.body[].status.status',
        'body[].status.status',
        'status.status',
    ],
    statusRemarks: [
        'lis.defaults.status.remarks',
        'payload.body[].status.remarks',
        'body[].status.remarks',
        'status.remarks',
    ],
    conceptUuid: [
        'lis.parameter.conceptUuid',
        'lis.parameters[].conceptUuid',
        'payload.body[].concept.uuid',
        'body[].concept.uuid',
        'result.parameterConceptUuid',
    ],
    allocationUuid: [
        'lis.parameter.allocationUuid',
        'lis.parameters[].allocationUuid',
        'payload.body[].testAllocation.uuid',
        'body[].testAllocation.uuid',
        'result.testAllocationUuid',
    ],
    valueCodedUuid: [
        'lis.valueCoded.uuid',
        'lis.parameter.valueCodedUuid',
        'payload.body[].valueCoded.uuid',
        'body[].valueCoded.uuid',
        'result.valueCodedUuid',
    ],
    datatype: [
        'lis.parameter.datatype',
        'lis.parameters[].datatype',
        'result.datatype',
    ],
};

export function buildOpenMrsLisPayload(
    target: TargetRecord,
    sourceDocument: Record<string, any>,
): BuilderResult {
    if (target.type !== 'LIS') {
        return { used: false, payload: sourceDocument, warnings: [], errors: [] };
    }

    const warnings: string[] = [];
    const errors: string[] = [];
    const rules = readLisRules();
    const translations = readTranslations();
    const translationMap = groupTranslations(translations);
    const observations = getObservations(sourceDocument);

    if (!observations.length) {
        return {
            used: false,
            payload: sourceDocument,
            warnings: ['No observation rows were found in the normalized source document.'],
            errors,
        };
    }

    const constants = {
        endpoint: constantFor(rules, DESTINATION_ALIASES.endpoint) ?? MULTIPLE_RESULTS_ENDPOINT,
        instrumentUuid: constantFor(rules, DESTINATION_ALIASES.instrumentUuid),
        testedBy: constantFor(rules, DESTINATION_ALIASES.testedBy),
        statusCategory: constantFor(rules, DESTINATION_ALIASES.statusCategory) ?? 'RESULT_REMARKS',
        statusStatus: constantFor(rules, DESTINATION_ALIASES.statusStatus) ?? 'REMARKS',
        statusRemarks:
            constantFor(rules, DESTINATION_ALIASES.statusRemarks) ??
            'Imported from analyzer via machine interfacing',
    };

    const conceptMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.conceptUuid);
    const allocationMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.allocationUuid);
    const valueCodedMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.valueCodedUuid);
    const datatypeMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.datatype);

    const body: any[] = [];
    const resolvedObservations: any[] = [];

    for (const obs of observations) {
        const sourceCode = firstNonEmpty(obs.code, obs.name);
        const sourceValue = firstNonEmpty(obs.value, obs.rawValue, obs.valueText);
        const codeKey = normalizeKey(sourceCode);
        const valueKey = normalizeKey(sourceValue);

        if (!codeKey) {
            warnings.push('An observation was skipped because it has no result/test parameter code.');
            continue;
        }

        const conceptUuid = firstNonEmpty(
            obs.target?.conceptUuid,
            obs.targetConceptUuid,
            lookupMap(conceptMap, [sourceCode, codeKey]),
        );
        const allocationUuid = firstNonEmpty(
            obs.target?.testAllocationUuid,
            obs.testAllocationUuid,
            obs.targetAllocationUuid,
            lookupMap(allocationMap, [sourceCode, codeKey]),
        );
        const datatype = String(
            firstNonEmpty(
                obs.target?.datatype,
                obs.targetDatatype,
                lookupMap(datatypeMap, [sourceCode, codeKey]),
                inferDatatype(obs.valueType),
            ) ?? 'text',
        ).toLowerCase();

        const rowWarnings: string[] = [];
        if (!conceptUuid) rowWarnings.push(`No LIS concept UUID mapping found for analyzer code "${sourceCode}".`);
        if (!allocationUuid) {
            rowWarnings.push(`No LIS test allocation UUID mapping found for analyzer code "${sourceCode}".`);
        }

        const row: any = {
            concept: conceptUuid ? { uuid: conceptUuid } : undefined,
            testAllocation: allocationUuid ? { uuid: allocationUuid } : undefined,
            valueNumeric: null,
            valueText: null,
            valueCoded: null,
            abnormal: isAbnormal(obs.abnormalFlag),
            instrument: constants.instrumentUuid ? { uuid: constants.instrumentUuid } : undefined,
            status: {
                category: constants.statusCategory,
                status: constants.statusStatus,
                remarks: constants.statusRemarks,
            },
            testedDate: normalizeDate(firstNonEmpty(obs.observedAt, sourceDocument?.result?.observedAt)),
            testedBy: constants.testedBy ?? undefined,
        };

        if (datatype.includes('coded') || ['ce', 'cwe', 'cw'].includes(String(obs.valueType ?? '').toLowerCase())) {
            const valueCodedUuid = firstNonEmpty(
                obs.target?.valueCodedUuid,
                obs.valueCodedUuid,
                lookupMap(valueCodedMap, [
                    `${sourceCode}=${sourceValue}`,
                    `${sourceCode}|${sourceValue}`,
                    `${codeKey}=${valueKey}`,
                    `${codeKey}|${valueKey}`,
                    sourceValue,
                    valueKey,
                ]),
            );

            if (valueCodedUuid) {
                row.valueCoded = { uuid: valueCodedUuid };
            } else {
                rowWarnings.push(
                    `No LIS coded answer UUID mapping found for analyzer result "${sourceCode}=${sourceValue}".`,
                );
            }
        } else if (datatype.includes('number') || datatype.includes('numeric') || String(obs.valueType ?? '').toLowerCase() === 'nm') {
            const numericValue = Number(String(sourceValue ?? '').trim());
            if (Number.isFinite(numericValue)) {
                row.valueNumeric = numericValue;
            } else {
                row.valueText = sourceValue == null ? null : String(sourceValue);
                rowWarnings.push(
                    `Analyzer result "${sourceCode}" was expected to be numeric but value "${sourceValue}" was not numeric; it was staged as text.`,
                );
            }
        } else {
            row.valueText = sourceValue == null ? null : String(sourceValue);
        }

        const hasValue = row.valueCoded || row.valueNumeric != null || row.valueText != null;
        const ready = !!row.concept && !!row.testAllocation && hasValue;

        resolvedObservations.push({
            sourceCode,
            sourceValue,
            datatype,
            conceptUuid: conceptUuid ?? null,
            testAllocationUuid: allocationUuid ?? null,
            ready,
            warnings: rowWarnings,
        });

        if (ready) {
            body.push(stripUndefined(row));
        } else {
            warnings.push(...rowWarnings);
        }
    }

    if (!body.length) {
        errors.push(
            'No LIS multiple-results rows are ready. Configure LIS mappings for analyzer code → concept UUID, analyzer code → allocation UUID, and analyzer value → coded answer UUID where applicable.',
        );
    }

    return {
        used: body.length > 0,
        warnings,
        errors: body.length > 0 ? [] : errors,
        payload: {
            resourceType: 'OpenMRSLabMultipleResultsRequest',
            method: 'POST',
            endpoint: constants.endpoint,
            sample: {
                id: sourceDocument?.sample?.id ?? null,
                label: sourceDocument?.sample?.label ?? sourceDocument?.sample?.id ?? null,
                uuid: sourceDocument?.sample?.uuid ?? null,
            },
            order: {
                id: sourceDocument?.order?.id ?? null,
                uuid: sourceDocument?.order?.uuid ?? null,
                testCode: sourceDocument?.result?.code ?? null,
                testName: sourceDocument?.result?.name ?? null,
            },
            body,
            mapping: {
                strategy: 'configured-openmrs-lis-multiple-results',
                observationCount: observations.length,
                readyCount: body.length,
                pendingMappingCount: Math.max(0, observations.length - body.length),
                observations: resolvedObservations,
            },
        },
    };
}

function readLisRules(): MappingRuleRow[] {
    const db = getDb();
    return db
        .prepare(
            `
                SELECT *
                FROM target_mappings
                WHERE target_type = 'LIS' AND enabled = 1
                ORDER BY created_at ASC
            `,
        )
        .all() as MappingRuleRow[];
}

function readTranslations(): TranslationRow[] {
    const db = getDb();
    return db
        .prepare(
            `
                SELECT t.*
                FROM target_mapping_value_translations t
                INNER JOIN target_mappings m ON m.id = t.mapping_rule_id
                WHERE t.enabled = 1 AND m.target_type = 'LIS' AND m.enabled = 1
            `,
        )
        .all() as TranslationRow[];
}

function groupTranslations(rows: TranslationRow[]) {
    const grouped = new Map<string, TranslationRow[]>();
    for (const row of rows) {
        const bucket = grouped.get(row.mapping_rule_id) ?? [];
        bucket.push(row);
        grouped.set(row.mapping_rule_id, bucket);
    }
    return grouped;
}

function constantFor(rules: MappingRuleRow[], destinationAliases: string[]) {
    const rule = rules.find(
        (item) => item.transform_kind === 'constant' && destinationAliases.includes(item.destination_field),
    );
    return parseScalar(rule?.constant_value ?? null);
}

function buildDestinationMap(
    rules: MappingRuleRow[],
    translationMap: Map<string, TranslationRow[]>,
    destinationAliases: string[],
) {
    const map = new Map<string, any>();
    for (const rule of rules.filter((item) => destinationAliases.includes(item.destination_field))) {
        for (const row of translationMap.get(rule.id) ?? []) {
            const destinationValue = parseScalar(row.destination_value ?? null);
            if (destinationValue == null || destinationValue === '') continue;
            map.set(normalizeKey(row.source_value), destinationValue);
            map.set(String(row.source_value ?? '').trim(), destinationValue);
        }
    }
    return map;
}

function lookupMap(map: Map<string, any>, candidates: any[]) {
    for (const candidate of candidates) {
        const raw = String(candidate ?? '').trim();
        if (!raw) continue;
        if (map.has(raw)) return map.get(raw);
        const normalized = normalizeKey(raw);
        if (map.has(normalized)) return map.get(normalized);
    }
    return null;
}

function getObservations(sourceDocument: Record<string, any>): Observation[] {
    const candidates = [
        sourceDocument?.result?.observations,
        sourceDocument?.result?.rows,
        sourceDocument?.observations,
        sourceDocument?.raw?.normalizedResults,
        sourceDocument?.raw?.observations,
    ];

    for (const candidate of candidates) {
        if (Array.isArray(candidate) && candidate.length > 0) return candidate as Observation[];
    }

    if (sourceDocument?.result?.code) {
        return [
            {
                code: sourceDocument.result.code,
                name: sourceDocument.result.name,
                value: sourceDocument.result.value,
                valueType: sourceDocument.result.valueType,
                units: sourceDocument.result.units,
                referenceRange: sourceDocument.result.referenceRange,
                abnormalFlag: sourceDocument.result.abnormalFlag,
                observedAt: sourceDocument.result.observedAt,
            },
        ];
    }

    return [];
}

function normalizeKey(value: any) {
    return String(value ?? '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '');
}

function firstNonEmpty(...values: any[]) {
    for (const value of values) {
        if (value !== undefined && value !== null && String(value).trim() !== '') return value;
    }
    return null;
}

function inferDatatype(valueType: any) {
    const value = String(valueType ?? '').trim().toUpperCase();
    if (value === 'NM' || value === 'SN') return 'numeric';
    if (value === 'CE' || value === 'CWE' || value === 'CW') return 'coded';
    return 'text';
}

function isAbnormal(flag: any) {
    const value = String(flag ?? '').trim().toUpperCase();
    if (!value || value === 'N' || value === 'NORMAL') return false;
    return true;
}

function normalizeDate(value: any) {
    const raw = String(value ?? '').trim();
    if (!raw) return null;
    if (/^\d{14}$/.test(raw)) {
        return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}.000+0000`;
    }
    if (/^\d{8}$/.test(raw)) {
        return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000+0000`;
    }
    return raw;
}

function parseScalar(value: any) {
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

function stripUndefined<T extends Record<string, any>>(row: T): T {
    for (const key of Object.keys(row)) {
        if (row[key] === undefined) delete row[key];
    }
    return row;
}
