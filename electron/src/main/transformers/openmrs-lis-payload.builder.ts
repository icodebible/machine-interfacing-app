// import { getDb } from '../db/db';
// import { TargetRecord } from './target-transformer.interface';

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

// type BuilderResult = {
//     used: boolean;
//     payload: Record<string, any>;
//     warnings: string[];
//     errors: string[];
// };

// type Observation = {
//     code?: string | null;
//     name?: string | null;
//     value?: any;
//     rawValue?: any;
//     valueText?: string | null;
//     valueType?: string | null;
//     units?: string | null;
//     referenceRange?: string | null;
//     abnormalFlag?: string | null;
//     resultStatus?: string | null;
//     observedAt?: string | null;
//     instrumentRaw?: string | null;
//     equipment?: Array<{ identifier?: string | null; text?: string | null; codingSystem?: string | null }>;
//     target?: Record<string, any>;
//     targetConceptUuid?: string | null;
//     testAllocationUuid?: string | null;
//     targetAllocationUuid?: string | null;
//     valueCodedUuid?: string | null;
//     targetDatatype?: string | null;
// };

// const MULTIPLE_RESULTS_ENDPOINT = '/openmrs/ws/rest/v1/lab/multipleresults';

// const DESTINATION_ALIASES = {
//     endpoint: [
//         'lis.endpoint',
//         'openmrs.endpoint',
//         'payload.endpoint',
//         'endpoint',
//     ],
//     instrumentUuid: [
//         'lis.defaults.instrumentUuid',
//         'lis.default.instrumentUuid',
//         'payload.body[].instrument.uuid',
//         'body[].instrument.uuid',
//         'instrument.uuid',
//     ],
//     testedBy: [
//         'lis.defaults.testedBy',
//         'lis.default.testedBy',
//         'payload.body[].testedBy',
//         'body[].testedBy',
//         'testedBy',
//     ],
//     statusCategory: [
//         'lis.defaults.status.category',
//         'payload.body[].status.category',
//         'body[].status.category',
//         'status.category',
//     ],
//     statusStatus: [
//         'lis.defaults.status.status',
//         'payload.body[].status.status',
//         'body[].status.status',
//         'status.status',
//     ],
//     statusRemarks: [
//         'lis.defaults.status.remarks',
//         'payload.body[].status.remarks',
//         'body[].status.remarks',
//         'status.remarks',
//     ],
//     conceptUuid: [
//         'lis.parameter.conceptUuid',
//         'lis.parameters[].conceptUuid',
//         'payload.body[].concept.uuid',
//         'body[].concept.uuid',
//         'result.parameterConceptUuid',
//     ],
//     allocationUuid: [
//         'lis.parameter.allocationUuid',
//         'lis.parameters[].allocationUuid',
//         'payload.body[].testAllocation.uuid',
//         'body[].testAllocation.uuid',
//         'result.testAllocationUuid',
//     ],
//     valueCodedUuid: [
//         'lis.valueCoded.uuid',
//         'lis.parameter.valueCodedUuid',
//         'payload.body[].valueCoded.uuid',
//         'body[].valueCoded.uuid',
//         'result.valueCodedUuid',
//     ],
//     datatype: [
//         'lis.parameter.datatype',
//         'lis.parameters[].datatype',
//         'result.datatype',
//     ],
// };

// export function buildOpenMrsLisPayload(
//     target: TargetRecord,
//     sourceDocument: Record<string, any>,
// ): BuilderResult {
//     if (target.type !== 'LIS') {
//         return { used: false, payload: sourceDocument, warnings: [], errors: [] };
//     }

//     const warnings: string[] = [];
//     const errors: string[] = [];
//     const rules = readLisRules();
//     const translations = readTranslations();
//     const translationMap = groupTranslations(translations);
//     const observations = getObservations(sourceDocument);

//     if (!observations.length) {
//         return {
//             used: false,
//             payload: sourceDocument,
//             warnings: ['No observation rows were found in the normalized source document.'],
//             errors,
//         };
//     }

//     const constants = {
//         endpoint: constantFor(rules, DESTINATION_ALIASES.endpoint) ?? MULTIPLE_RESULTS_ENDPOINT,
//         instrumentUuid: constantFor(rules, DESTINATION_ALIASES.instrumentUuid),
//         testedBy: constantFor(rules, DESTINATION_ALIASES.testedBy),
//         statusCategory: constantFor(rules, DESTINATION_ALIASES.statusCategory) ?? 'RESULT_REMARKS',
//         statusStatus: constantFor(rules, DESTINATION_ALIASES.statusStatus) ?? 'REMARKS',
//         statusRemarks:
//             constantFor(rules, DESTINATION_ALIASES.statusRemarks) ??
//             'Imported from analyzer via machine interfacing',
//     };

//     const conceptMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.conceptUuid);
//     const allocationMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.allocationUuid);
//     const valueCodedMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.valueCodedUuid);
//     const datatypeMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.datatype);

//     const body: any[] = [];
//     const resolvedObservations: any[] = [];

//     for (const obs of observations) {
//         const sourceCode = firstNonEmpty(obs.code, obs.name);
//         const sourceValue = firstNonEmpty(obs.value, obs.rawValue, obs.valueText);
//         const codeKey = normalizeKey(sourceCode);
//         const valueKey = normalizeKey(sourceValue);

//         if (!codeKey) {
//             warnings.push('An observation was skipped because it has no result/test parameter code.');
//             continue;
//         }

//         const conceptUuid = firstNonEmpty(
//             obs.target?.conceptUuid,
//             obs.targetConceptUuid,
//             lookupMap(conceptMap, [sourceCode, codeKey]),
//         );
//         const allocationUuid = firstNonEmpty(
//             obs.target?.testAllocationUuid,
//             obs.testAllocationUuid,
//             obs.targetAllocationUuid,
//             lookupMap(allocationMap, [sourceCode, codeKey]),
//         );
//         const datatype = String(
//             firstNonEmpty(
//                 obs.target?.datatype,
//                 obs.targetDatatype,
//                 lookupMap(datatypeMap, [sourceCode, codeKey]),
//                 inferDatatype(obs.valueType),
//             ) ?? 'text',
//         ).toLowerCase();

//         const rowWarnings: string[] = [];
//         if (!conceptUuid) rowWarnings.push(`No LIS concept UUID mapping found for analyzer code "${sourceCode}".`);
//         if (!allocationUuid) {
//             rowWarnings.push(`No LIS test allocation UUID mapping found for analyzer code "${sourceCode}".`);
//         }

//         const row: any = {
//             concept: conceptUuid ? { uuid: conceptUuid } : undefined,
//             testAllocation: allocationUuid ? { uuid: allocationUuid } : undefined,
//             valueNumeric: null,
//             valueText: null,
//             valueCoded: null,
//             abnormal: isAbnormal(obs.abnormalFlag),
//             instrument: constants.instrumentUuid ? { uuid: constants.instrumentUuid } : undefined,
//             status: {
//                 category: constants.statusCategory,
//                 status: constants.statusStatus,
//                 remarks: constants.statusRemarks,
//             },
//             testedDate: normalizeDate(firstNonEmpty(obs.observedAt, sourceDocument?.result?.observedAt)),
//             testedBy: constants.testedBy ?? undefined,
//         };

//         if (datatype.includes('coded') || ['ce', 'cwe', 'cw'].includes(String(obs.valueType ?? '').toLowerCase())) {
//             const valueCodedUuid = firstNonEmpty(
//                 obs.target?.valueCodedUuid,
//                 obs.valueCodedUuid,
//                 lookupMap(valueCodedMap, [
//                     `${sourceCode}=${sourceValue}`,
//                     `${sourceCode}|${sourceValue}`,
//                     `${codeKey}=${valueKey}`,
//                     `${codeKey}|${valueKey}`,
//                     sourceValue,
//                     valueKey,
//                 ]),
//             );

//             if (valueCodedUuid) {
//                 row.valueCoded = { uuid: valueCodedUuid };
//             } else {
//                 rowWarnings.push(
//                     `No LIS coded answer UUID mapping found for analyzer result "${sourceCode}=${sourceValue}".`,
//                 );
//             }
//         } else if (datatype.includes('number') || datatype.includes('numeric') || String(obs.valueType ?? '').toLowerCase() === 'nm') {
//             const numericValue = Number(String(sourceValue ?? '').trim());
//             if (Number.isFinite(numericValue)) {
//                 row.valueNumeric = numericValue;
//             } else {
//                 row.valueText = sourceValue == null ? null : String(sourceValue);
//                 rowWarnings.push(
//                     `Analyzer result "${sourceCode}" was expected to be numeric but value "${sourceValue}" was not numeric; it was staged as text.`,
//                 );
//             }
//         } else {
//             row.valueText = sourceValue == null ? null : String(sourceValue);
//         }

//         const hasValue = row.valueCoded || row.valueNumeric != null || row.valueText != null;
//         const ready = !!row.concept && !!row.testAllocation && hasValue;

//         resolvedObservations.push({
//             sourceCode,
//             sourceValue,
//             datatype,
//             conceptUuid: conceptUuid ?? null,
//             testAllocationUuid: allocationUuid ?? null,
//             ready,
//             warnings: rowWarnings,
//         });

//         if (ready) {
//             body.push(stripUndefined(row));
//         } else {
//             warnings.push(...rowWarnings);
//         }
//     }

//     if (!body.length) {
//         errors.push(
//             'No LIS multiple-results rows are ready. Configure LIS mappings for analyzer code → concept UUID, analyzer code → allocation UUID, and analyzer value → coded answer UUID where applicable.',
//         );
//     }

//     return {
//         used: body.length > 0,
//         warnings,
//         errors: body.length > 0 ? [] : errors,
//         payload: {
//             resourceType: 'OpenMRSLabMultipleResultsRequest',
//             method: 'POST',
//             endpoint: constants.endpoint,
//             sample: {
//                 id: sourceDocument?.sample?.id ?? null,
//                 label: sourceDocument?.sample?.label ?? sourceDocument?.sample?.id ?? null,
//                 uuid: sourceDocument?.sample?.uuid ?? null,
//             },
//             order: {
//                 id: sourceDocument?.order?.id ?? null,
//                 uuid: sourceDocument?.order?.uuid ?? null,
//                 testCode: sourceDocument?.result?.code ?? null,
//                 testName: sourceDocument?.result?.name ?? null,
//             },
//             body,
//             mapping: {
//                 strategy: 'configured-openmrs-lis-multiple-results',
//                 observationCount: observations.length,
//                 readyCount: body.length,
//                 pendingMappingCount: Math.max(0, observations.length - body.length),
//                 observations: resolvedObservations,
//             },
//         },
//     };
// }

// function readLisRules(): MappingRuleRow[] {
//     const db = getDb();
//     return db
//         .prepare(
//             `
//                 SELECT *
//                 FROM target_mappings
//                 WHERE target_type = 'LIS' AND enabled = 1
//                 ORDER BY created_at ASC
//             `,
//         )
//         .all() as MappingRuleRow[];
// }

// function readTranslations(): TranslationRow[] {
//     const db = getDb();
//     return db
//         .prepare(
//             `
//                 SELECT t.*
//                 FROM target_mapping_value_translations t
//                 INNER JOIN target_mappings m ON m.id = t.mapping_rule_id
//                 WHERE t.enabled = 1 AND m.target_type = 'LIS' AND m.enabled = 1
//             `,
//         )
//         .all() as TranslationRow[];
// }

// function groupTranslations(rows: TranslationRow[]) {
//     const grouped = new Map<string, TranslationRow[]>();
//     for (const row of rows) {
//         const bucket = grouped.get(row.mapping_rule_id) ?? [];
//         bucket.push(row);
//         grouped.set(row.mapping_rule_id, bucket);
//     }
//     return grouped;
// }

// function constantFor(rules: MappingRuleRow[], destinationAliases: string[]) {
//     const rule = rules.find(
//         (item) => item.transform_kind === 'constant' && destinationAliases.includes(item.destination_field),
//     );
//     return parseScalar(rule?.constant_value ?? null);
// }

// function buildDestinationMap(
//     rules: MappingRuleRow[],
//     translationMap: Map<string, TranslationRow[]>,
//     destinationAliases: string[],
// ) {
//     const map = new Map<string, any>();
//     for (const rule of rules.filter((item) => destinationAliases.includes(item.destination_field))) {
//         for (const row of translationMap.get(rule.id) ?? []) {
//             const destinationValue = parseScalar(row.destination_value ?? null);
//             if (destinationValue == null || destinationValue === '') continue;
//             map.set(normalizeKey(row.source_value), destinationValue);
//             map.set(String(row.source_value ?? '').trim(), destinationValue);
//         }
//     }
//     return map;
// }

// function lookupMap(map: Map<string, any>, candidates: any[]) {
//     for (const candidate of candidates) {
//         const raw = String(candidate ?? '').trim();
//         if (!raw) continue;
//         if (map.has(raw)) return map.get(raw);
//         const normalized = normalizeKey(raw);
//         if (map.has(normalized)) return map.get(normalized);
//     }
//     return null;
// }

// function getObservations(sourceDocument: Record<string, any>): Observation[] {
//     const candidates = [
//         sourceDocument?.result?.observations,
//         sourceDocument?.result?.rows,
//         sourceDocument?.observations,
//         sourceDocument?.raw?.normalizedResults,
//         sourceDocument?.raw?.observations,
//     ];

//     for (const candidate of candidates) {
//         if (Array.isArray(candidate) && candidate.length > 0) return candidate as Observation[];
//     }

//     if (sourceDocument?.result?.code) {
//         return [
//             {
//                 code: sourceDocument.result.code,
//                 name: sourceDocument.result.name,
//                 value: sourceDocument.result.value,
//                 valueType: sourceDocument.result.valueType,
//                 units: sourceDocument.result.units,
//                 referenceRange: sourceDocument.result.referenceRange,
//                 abnormalFlag: sourceDocument.result.abnormalFlag,
//                 observedAt: sourceDocument.result.observedAt,
//             },
//         ];
//     }

//     return [];
// }

// function normalizeKey(value: any) {
//     return String(value ?? '')
//         .trim()
//         .toUpperCase()
//         .replace(/[^A-Z0-9]+/g, '');
// }

// function firstNonEmpty(...values: any[]) {
//     for (const value of values) {
//         if (value !== undefined && value !== null && String(value).trim() !== '') return value;
//     }
//     return null;
// }

// function inferDatatype(valueType: any) {
//     const value = String(valueType ?? '').trim().toUpperCase();
//     if (value === 'NM' || value === 'SN') return 'numeric';
//     if (value === 'CE' || value === 'CWE' || value === 'CW') return 'coded';
//     return 'text';
// }

// function isAbnormal(flag: any) {
//     const value = String(flag ?? '').trim().toUpperCase();
//     if (!value || value === 'N' || value === 'NORMAL') return false;
//     return true;
// }

// function normalizeDate(value: any) {
//     const raw = String(value ?? '').trim();
//     if (!raw) return null;
//     if (/^\d{14}$/.test(raw)) {
//         return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}.000+0000`;
//     }
//     if (/^\d{8}$/.test(raw)) {
//         return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000+0000`;
//     }
//     return raw;
// }

// function parseScalar(value: any) {
//     if (value == null) return null;
//     const raw = String(value).trim();
//     if (!raw) return null;
//     if (raw === 'null') return null;
//     if (raw === 'true') return true;
//     if (raw === 'false') return false;
//     if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
//     if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
//         try {
//             return JSON.parse(raw);
//         } catch {
//             return raw;
//         }
//     }
//     return raw;
// }

// function stripUndefined<T extends Record<string, any>>(row: T): T {
//     for (const key of Object.keys(row)) {
//         if (row[key] === undefined) delete row[key];
//     }
//     return row;
// }


// import { getDb } from '../db/db';
// import { TargetRecord } from './target-transformer.interface';

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

// type BuilderResult = {
//     used: boolean;
//     payload: Record<string, any>;
//     warnings: string[];
//     errors: string[];
// };

// type Observation = {
//     code?: string | null;
//     name?: string | null;
//     value?: any;
//     rawValue?: any;
//     valueText?: string | null;
//     valueType?: string | null;
//     units?: string | null;
//     referenceRange?: string | null;
//     abnormalFlag?: string | null;
//     resultStatus?: string | null;
//     observedAt?: string | null;
//     instrumentRaw?: string | null;
//     equipment?: Array<{ identifier?: string | null; text?: string | null; codingSystem?: string | null }>;
//     target?: Record<string, any>;
//     targetConceptUuid?: string | null;
//     testAllocationUuid?: string | null;
//     targetAllocationUuid?: string | null;
//     valueCodedUuid?: string | null;
//     targetDatatype?: string | null;
// };

// const MULTIPLE_RESULTS_ENDPOINT = '/openmrs/ws/rest/v1/lab/multipleresults';

// const DESTINATION_ALIASES = {
//     endpoint: [
//         'lis.endpoint',
//         'openmrs.endpoint',
//         'payload.endpoint',
//         'endpoint',
//     ],
//     instrumentUuid: [
//         'lis.defaults.instrumentUuid',
//         'lis.default.instrumentUuid',
//         'payload.body[].instrument.uuid',
//         'body[].instrument.uuid',
//         'instrument.uuid',
//     ],
//     testedBy: [
//         'lis.defaults.testedBy',
//         'lis.default.testedBy',
//         'payload.body[].testedBy',
//         'body[].testedBy',
//         'testedBy',
//     ],
//     statusCategory: [
//         'lis.defaults.status.category',
//         'payload.body[].status.category',
//         'body[].status.category',
//         'status.category',
//     ],
//     statusStatus: [
//         'lis.defaults.status.status',
//         'payload.body[].status.status',
//         'body[].status.status',
//         'status.status',
//     ],
//     statusRemarks: [
//         'lis.defaults.status.remarks',
//         'payload.body[].status.remarks',
//         'body[].status.remarks',
//         'status.remarks',
//     ],
//     conceptUuid: [
//         'lis.parameter.conceptUuid',
//         'lis.parameters[].conceptUuid',
//         'payload.body[].concept.uuid',
//         'body[].concept.uuid',
//         'result.parameterConceptUuid',
//     ],
//     allocationUuid: [
//         'lis.parameter.allocationUuid',
//         'lis.parameters[].allocationUuid',
//         'payload.body[].testAllocation.uuid',
//         'body[].testAllocation.uuid',
//         'result.testAllocationUuid',
//     ],
//     valueCodedUuid: [
//         'lis.valueCoded.uuid',
//         'lis.parameter.valueCodedUuid',
//         'payload.body[].valueCoded.uuid',
//         'body[].valueCoded.uuid',
//         'result.valueCodedUuid',
//     ],
//     datatype: [
//         'lis.parameter.datatype',
//         'lis.parameters[].datatype',
//         'result.datatype',
//     ],
// };

// export function buildOpenMrsLisPayload(
//     target: TargetRecord,
//     sourceDocument: Record<string, any>,
// ): BuilderResult {
//     if (target.type !== 'LIS') {
//         return { used: false, payload: sourceDocument, warnings: [], errors: [] };
//     }

//     const warnings: string[] = [];
//     const errors: string[] = [];
//     const rules = readLisRules();
//     const translations = readTranslations();
//     const translationMap = groupTranslations(translations);
//     const observations = getObservations(sourceDocument);

//     if (!observations.length) {
//         return {
//             used: false,
//             payload: sourceDocument,
//             warnings: ['No observation rows were found in the normalized source document.'],
//             errors,
//         };
//     }

//     const constants = {
//         endpoint: constantFor(rules, DESTINATION_ALIASES.endpoint) ?? MULTIPLE_RESULTS_ENDPOINT,
//         instrumentUuid: constantFor(rules, DESTINATION_ALIASES.instrumentUuid),
//         testedBy: constantFor(rules, DESTINATION_ALIASES.testedBy),
//         statusCategory: constantFor(rules, DESTINATION_ALIASES.statusCategory) ?? 'RESULT_REMARKS',
//         statusStatus: constantFor(rules, DESTINATION_ALIASES.statusStatus) ?? 'REMARKS',
//         statusRemarks:
//             constantFor(rules, DESTINATION_ALIASES.statusRemarks) ??
//             'Imported from analyzer via machine interfacing',
//     };

//     const conceptMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.conceptUuid);
//     const allocationMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.allocationUuid);
//     const valueCodedMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.valueCodedUuid);
//     const datatypeMap = buildDestinationMap(rules, translationMap, DESTINATION_ALIASES.datatype);

//     const body: any[] = [];
//     const resolvedObservations: any[] = [];

//     for (const obs of observations) {
//         const sourceCode = firstNonEmpty(obs.code, obs.name);
//         const sourceValue = firstNonEmpty(obs.value, obs.rawValue, obs.valueText);
//         const codeKey = normalizeKey(sourceCode);
//         const valueKey = normalizeKey(sourceValue);

//         if (!codeKey) {
//             warnings.push('An observation was skipped because it has no result/test parameter code.');
//             continue;
//         }

//         const conceptUuid = firstNonEmpty(
//             obs.target?.conceptUuid,
//             obs.targetConceptUuid,
//             lookupMap(conceptMap, [sourceCode, codeKey]),
//         );
//         const allocationUuid = firstNonEmpty(
//             obs.target?.testAllocationUuid,
//             obs.testAllocationUuid,
//             obs.targetAllocationUuid,
//             lookupMap(allocationMap, [sourceCode, codeKey]),
//         );
//         const datatype = String(
//             firstNonEmpty(
//                 obs.target?.datatype,
//                 obs.targetDatatype,
//                 lookupMap(datatypeMap, [sourceCode, codeKey]),
//                 inferDatatype(obs.valueType),
//             ) ?? 'text',
//         ).toLowerCase();

//         const rowWarnings: string[] = [];
//         if (!conceptUuid) rowWarnings.push(`No LIS concept UUID mapping found for analyzer code "${sourceCode}".`);
//         if (!allocationUuid) {
//             rowWarnings.push(`No LIS test allocation UUID mapping found for analyzer code "${sourceCode}".`);
//         }

//         const row: any = {
//             concept: conceptUuid ? { uuid: conceptUuid } : undefined,
//             testAllocation: allocationUuid ? { uuid: allocationUuid } : undefined,
//             valueNumeric: null,
//             valueText: null,
//             valueCoded: null,
//             abnormal: isAbnormal(obs.abnormalFlag),
//             instrument: constants.instrumentUuid ? { uuid: constants.instrumentUuid } : undefined,
//             status: {
//                 category: constants.statusCategory,
//                 status: constants.statusStatus,
//                 remarks: constants.statusRemarks,
//             },
//             testedDate: normalizeDate(firstNonEmpty(obs.observedAt, sourceDocument?.result?.observedAt)),
//             testedBy: constants.testedBy ?? undefined,
//         };

//         if (datatype.includes('coded') || ['ce', 'cwe', 'cw'].includes(String(obs.valueType ?? '').toLowerCase())) {
//             const valueCodedUuid = firstNonEmpty(
//                 obs.target?.valueCodedUuid,
//                 obs.valueCodedUuid,
//                 lookupMap(valueCodedMap, [
//                     `${sourceCode}=${sourceValue}`,
//                     `${sourceCode}|${sourceValue}`,
//                     `${codeKey}=${valueKey}`,
//                     `${codeKey}|${valueKey}`,
//                     sourceValue,
//                     valueKey,
//                 ]),
//             );

//             if (valueCodedUuid) {
//                 row.valueCoded = { uuid: valueCodedUuid };
//             } else {
//                 rowWarnings.push(
//                     `No LIS coded answer UUID mapping found for analyzer result "${sourceCode}=${sourceValue}".`,
//                 );
//             }
//         } else if (datatype.includes('number') || datatype.includes('numeric') || String(obs.valueType ?? '').toLowerCase() === 'nm') {
//             const numericValue = Number(String(sourceValue ?? '').trim());
//             if (Number.isFinite(numericValue)) {
//                 row.valueNumeric = numericValue;
//             } else {
//                 row.valueText = sourceValue == null ? null : String(sourceValue);
//                 rowWarnings.push(
//                     `Analyzer result "${sourceCode}" was expected to be numeric but value "${sourceValue}" was not numeric; it was staged as text.`,
//                 );
//             }
//         } else {
//             row.valueText = sourceValue == null ? null : String(sourceValue);
//         }

//         const hasValue = row.valueCoded || row.valueNumeric != null || row.valueText != null;
//         const ready = !!row.concept && !!row.testAllocation && hasValue;

//         resolvedObservations.push({
//             sourceCode,
//             sourceValue,
//             datatype,
//             conceptUuid: conceptUuid ?? null,
//             testAllocationUuid: allocationUuid ?? null,
//             ready,
//             warnings: rowWarnings,
//         });

//         if (ready) {
//             body.push(stripUndefined(row));
//         } else {
//             warnings.push(...rowWarnings);
//         }
//     }

//     if (!body.length) {
//         errors.push(
//             'No LIS multiple-results rows are ready. Configure LIS mappings for analyzer code → concept UUID, analyzer code → allocation UUID, and analyzer value → coded answer UUID where applicable.',
//         );
//     }

//     return {
//         used: body.length > 0,
//         warnings,
//         errors: body.length > 0 ? [] : errors,
//         payload: {
//             resourceType: 'OpenMRSLabMultipleResultsRequest',
//             method: 'POST',
//             endpoint: constants.endpoint,
//             sample: {
//                 id: sourceDocument?.sample?.id ?? null,
//                 label: sourceDocument?.sample?.label ?? sourceDocument?.sample?.id ?? null,
//                 uuid: sourceDocument?.sample?.uuid ?? null,
//             },
//             order: {
//                 id: sourceDocument?.order?.id ?? null,
//                 uuid: sourceDocument?.order?.uuid ?? null,
//                 testCode: sourceDocument?.result?.code ?? null,
//                 testName: sourceDocument?.result?.name ?? null,
//             },
//             body,
//             mapping: {
//                 strategy: 'configured-openmrs-lis-multiple-results',
//                 observationCount: observations.length,
//                 readyCount: body.length,
//                 pendingMappingCount: Math.max(0, observations.length - body.length),
//                 observations: resolvedObservations,
//             },
//         },
//     };
// }

// function readLisRules(): MappingRuleRow[] {
//     const db = getDb();
//     return db
//         .prepare(
//             `
//                 SELECT *
//                 FROM target_mappings
//                 WHERE target_type = 'LIS' AND enabled = 1
//                 ORDER BY created_at ASC
//             `,
//         )
//         .all() as MappingRuleRow[];
// }

// function readTranslations(): TranslationRow[] {
//     const db = getDb();
//     return db
//         .prepare(
//             `
//                 SELECT t.*
//                 FROM target_mapping_value_translations t
//                 INNER JOIN target_mappings m ON m.id = t.mapping_rule_id
//                 WHERE t.enabled = 1 AND m.target_type = 'LIS' AND m.enabled = 1
//             `,
//         )
//         .all() as TranslationRow[];
// }

// function groupTranslations(rows: TranslationRow[]) {
//     const grouped = new Map<string, TranslationRow[]>();
//     for (const row of rows) {
//         const bucket = grouped.get(row.mapping_rule_id) ?? [];
//         bucket.push(row);
//         grouped.set(row.mapping_rule_id, bucket);
//     }
//     return grouped;
// }

// function constantFor(rules: MappingRuleRow[], destinationAliases: string[]) {
//     const rule = rules.find(
//         (item) => item.transform_kind === 'constant' && destinationAliases.includes(item.destination_field),
//     );
//     return parseScalar(rule?.constant_value ?? null);
// }

// function buildDestinationMap(
//     rules: MappingRuleRow[],
//     translationMap: Map<string, TranslationRow[]>,
//     destinationAliases: string[],
// ) {
//     const map = new Map<string, any>();
//     for (const rule of rules.filter((item) => destinationAliases.includes(item.destination_field))) {
//         for (const row of translationMap.get(rule.id) ?? []) {
//             const destinationValue = parseScalar(row.destination_value ?? null);
//             if (destinationValue == null || destinationValue === '') continue;
//             map.set(normalizeKey(row.source_value), destinationValue);
//             map.set(String(row.source_value ?? '').trim(), destinationValue);
//         }
//     }
//     return map;
// }

// function lookupMap(map: Map<string, any>, candidates: any[]) {
//     for (const candidate of candidates) {
//         const raw = String(candidate ?? '').trim();
//         if (!raw) continue;
//         if (map.has(raw)) return map.get(raw);
//         const normalized = normalizeKey(raw);
//         if (map.has(normalized)) return map.get(normalized);
//     }
//     return null;
// }

// function getObservations(sourceDocument: Record<string, any>): Observation[] {
//     const candidates = [
//         sourceDocument?.result?.observations,
//         sourceDocument?.result?.rows,
//         sourceDocument?.observations,
//         sourceDocument?.raw?.normalizedResults,
//         sourceDocument?.raw?.observations,
//     ];

//     for (const candidate of candidates) {
//         if (Array.isArray(candidate) && candidate.length > 0) return candidate as Observation[];
//     }

//     if (sourceDocument?.result?.code) {
//         return [
//             {
//                 code: sourceDocument.result.code,
//                 name: sourceDocument.result.name,
//                 value: sourceDocument.result.value,
//                 valueType: sourceDocument.result.valueType,
//                 units: sourceDocument.result.units,
//                 referenceRange: sourceDocument.result.referenceRange,
//                 abnormalFlag: sourceDocument.result.abnormalFlag,
//                 observedAt: sourceDocument.result.observedAt,
//             },
//         ];
//     }

//     return [];
// }

// function normalizeKey(value: any) {
//     return String(value ?? '')
//         .trim()
//         .toUpperCase()
//         .replace(/[^A-Z0-9]+/g, '');
// }

// function firstNonEmpty(...values: any[]) {
//     for (const value of values) {
//         if (value !== undefined && value !== null && String(value).trim() !== '') return value;
//     }
//     return null;
// }

// function inferDatatype(valueType: any) {
//     const value = String(valueType ?? '').trim().toUpperCase();
//     if (value === 'NM' || value === 'SN') return 'numeric';
//     if (value === 'CE' || value === 'CWE' || value === 'CW') return 'coded';
//     return 'text';
// }

// function isAbnormal(flag: any) {
//     const value = String(flag ?? '').trim().toUpperCase();
//     if (!value || value === 'N' || value === 'NORMAL') return false;
//     return true;
// }

// function normalizeDate(value: any) {
//     const raw = String(value ?? '').trim();
//     if (!raw) return null;
//     if (/^\d{14}$/.test(raw)) {
//         return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}.000+0000`;
//     }
//     if (/^\d{8}$/.test(raw)) {
//         return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000+0000`;
//     }
//     return raw;
// }

// function parseScalar(value: any) {
//     if (value == null) return null;
//     const raw = String(value).trim();
//     if (!raw) return null;
//     if (raw === 'null') return null;
//     if (raw === 'true') return true;
//     if (raw === 'false') return false;
//     if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
//     if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
//         try {
//             return JSON.parse(raw);
//         } catch {
//             return raw;
//         }
//     }
//     return raw;
// }

// function stripUndefined<T extends Record<string, any>>(row: T): T {
//     for (const key of Object.keys(row)) {
//         if (row[key] === undefined) delete row[key];
//     }
//     return row;
// }



// import { getDb } from "../db/db";

// const DEFAULT_ENDPOINT = "/openmrs/ws/rest/v1/lab/multipleresults";

// type MappingRuleRow = {
//   id: string;
//   target_type: string;
//   source_field: string;
//   destination_field: string;
//   transform_kind: "direct" | "constant" | "lookup";
//   constant_value?: string | null;
//   enabled: number;
//   value_mapping_enabled?: number;
//   unmapped_behavior?:
//     | "PASSTHROUGH"
//     | "DEFAULT_VALUE"
//     | "EMPTY"
//     | "ERROR"
//     | null;
//   default_destination_value?: string | null;
// };

// type TranslationRow = {
//   id: string;
//   mapping_rule_id: string;
//   source_value: string;
//   destination_value?: string | null;
//   enabled: number;
//   note?: string | null;
// };

// type Observation = {
//   code?: string | null;
//   name?: string | null;
//   value?: any;
//   valueType?: string | null;
//   units?: string | null;
//   referenceRange?: string | null;
//   abnormalFlag?: string | null;
//   observedAt?: string | null;
//   resultStatus?: string | null;
//   raw?: any;
// };

// export type OpenMrsLisPayloadBuildResult = {
//   used: boolean;
//   payload: Record<string, any>;
//   warnings: string[];
//   errors: string[];
// };

// export function buildOpenMrsLisPayload(
//   target: any,
//   sourceDocument: Record<string, any>,
// ): OpenMrsLisPayloadBuildResult {
//   if (!target || target.type !== "LIS") {
//     return { used: false, payload: sourceDocument, warnings: [], errors: [] };
//   }

//   const rules = readLisRules();
//   const translationMap = groupTranslations(readTranslations());
//   const observations = getObservations(sourceDocument);
//   const warnings: string[] = [];
//   const errors: string[] = [];
//   const body: any[] = [];
//   const resolvedObservations: any[] = [];

//   const endpoint =
//     firstNonEmpty(
//       constantFor(rules, ["lis.endpoint", "endpoint", "payload.endpoint"]),
//       sourceDocument?.lis?.endpoint,
//       DEFAULT_ENDPOINT,
//     ) ?? DEFAULT_ENDPOINT;
//   const instrumentUuid = constantFor(rules, [
//     "lis.defaults.instrumentUuid",
//     "instrument.uuid",
//   ]);
//   const testedBy = constantFor(rules, ["lis.defaults.testedBy", "testedBy"]);
//   const statusCategory =
//     constantFor(rules, ["lis.defaults.status.category", "status.category"]) ??
//     "RESULT_REMARKS";
//   const statusStatus =
//     constantFor(rules, ["lis.defaults.status.status", "status.status"]) ??
//     "REMARKS";
//   const statusRemarks =
//     constantFor(rules, ["lis.defaults.status.remarks", "status.remarks"]) ??
//     "Imported from analyzer via machine interfacing";

//   const conceptByCode = buildDestinationMap(rules, translationMap, [
//     "lis.parameter.conceptUuid",
//   ]);
//   const allocationByCode = buildDestinationMap(rules, translationMap, [
//     "lis.parameter.allocationUuid",
//     "lis.parameter.testAllocationUuid",
//   ]);
//   const datatypeByCode = buildDestinationMap(rules, translationMap, [
//     "lis.parameter.datatype",
//   ]);
//   const codedAnswerByValue = buildDestinationMap(rules, translationMap, [
//     "lis.valueCoded.uuid",
//     "valueCoded.uuid",
//   ]);
//   const canResolveAllocationAtDelivery = hasSampleIdentity(sourceDocument);

//   for (const observation of observations) {
//     const sourceCode = firstNonEmpty(observation.code, observation.name);
//     const sourceValue = observation.value;
//     const codeKey = normalizeKey(sourceCode);
//     const datatype = String(
//       firstNonEmpty(
//         lookupMap(datatypeByCode, [sourceCode, codeKey]),
//         inferDatatype(observation.valueType),
//       ) ?? "text",
//     ).toLowerCase();

//     const conceptUuid = lookupMap(conceptByCode, [sourceCode, codeKey]);
//     const allocationUuid = lookupMap(allocationByCode, [sourceCode, codeKey]);
//     const rowWarnings: string[] = [];
//     const rowErrors: string[] = [];

//     if (!conceptUuid) {
//       rowErrors.push(
//         `No LIS concept UUID mapping found for analyzer code "${sourceCode}".`,
//       );
//     }

//     if (!allocationUuid && !canResolveAllocationAtDelivery) {
//       rowErrors.push(
//         `No LIS test allocation UUID mapping found for analyzer code "${sourceCode}" and no sample label/UUID is available for delivery-time allocation lookup.`,
//       );
//     } else if (!allocationUuid) {
//       rowWarnings.push(
//         `No static LIS allocation UUID mapping found for "${sourceCode}". It will be resolved from the OpenMRS sample allocation at delivery time.`,
//       );
//     }

//     const row: Record<string, any> = {
//       concept: conceptUuid ? { uuid: conceptUuid } : undefined,
//       testAllocation: allocationUuid ? { uuid: allocationUuid } : undefined,
//       valueNumeric: null,
//       valueText: null,
//       valueCoded: null,
//       abnormal: isAbnormal(observation.abnormalFlag),
//       instrument: instrumentUuid ? { uuid: instrumentUuid } : undefined,
//       status: {
//         category: statusCategory,
//         status: statusStatus,
//         remarks: statusRemarks,
//       },
//       testedDate: normalizeDate(
//         observation.observedAt ?? sourceDocument?.normalized?.observedAt,
//       ),
//       testedBy: testedBy || undefined,
//     };

//     if (datatype.includes("coded")) {
//       const codedUuid = lookupMap(codedAnswerByValue, [
//         `${sourceCode}=${sourceValue}`,
//         `${codeKey}=${normalizeKey(sourceValue)}`,
//         sourceValue,
//         normalizeKey(sourceValue),
//       ]);
//       if (!codedUuid) {
//         rowErrors.push(
//           `No LIS coded answer UUID mapping found for analyzer result "${sourceCode}=${sourceValue}".`,
//         );
//       } else {
//         row.valueCoded = { uuid: codedUuid };
//       }
//     } else if (datatype.includes("num") || observation.valueType === "NM") {
//       const numeric = Number(sourceValue);
//       if (Number.isFinite(numeric)) {
//         row.valueNumeric = numeric;
//       } else {
//         rowErrors.push(
//           `Analyzer result "${sourceCode}" expected a numeric value but received "${sourceValue}".`,
//         );
//       }
//     } else {
//       row.valueText = sourceValue == null ? null : String(sourceValue);
//     }

//     const ready = rowErrors.length === 0;
//     resolvedObservations.push({
//       sourceCode,
//       sourceValue,
//       datatype,
//       conceptUuid: conceptUuid ?? null,
//       testAllocationUuid: allocationUuid ?? null,
//       allocationResolution: allocationUuid
//         ? "static-mapping"
//         : canResolveAllocationAtDelivery
//           ? "delivery-time-sample-allocation"
//           : "missing",
//       ready,
//       warnings: rowWarnings,
//       errors: rowErrors,
//     });

//     warnings.push(...rowWarnings);
//     if (ready) {
//       body.push(stripUndefined(row));
//     } else {
//       errors.push(...rowErrors);
//     }
//   }

//   if (!body.length) {
//     errors.push(
//       "No LIS multiple-results rows are ready. Configure LIS mappings for analyzer code → concept UUID and analyzer value → coded answer UUID where applicable. Allocation UUIDs can be resolved dynamically from the OpenMRS sample allocation when the sample label/UUID is available.",
//     );
//   }

//   const sample = {
//     id: firstNonEmpty(
//       sourceDocument?.sample?.id,
//       sourceDocument?.specimen?.sampleId,
//       sourceDocument?.lis?.sample?.label,
//     ),
//     label: firstNonEmpty(
//       sourceDocument?.lis?.sample?.label,
//       sourceDocument?.sample?.label,
//       sourceDocument?.sample?.id,
//     ),
//     uuid: firstNonEmpty(
//       sourceDocument?.lis?.sample?.uuid,
//       sourceDocument?.sample?.uuid,
//     ),
//   };

//   return {
//     used: body.length > 0,
//     warnings,
//     errors,
//     payload: {
//       resourceType: "OpenMRSLabMultipleResultsRequest",
//       method: "POST",
//       endpoint,
//       sample,
//       order: {
//         id: sourceDocument?.order?.id ?? null,
//         uuid: sourceDocument?.order?.uuid ?? null,
//         testCode: sourceDocument?.result?.code ?? null,
//         testName: sourceDocument?.result?.name ?? null,
//       },
//       allocationResolution: {
//         strategy: "sample-allocation-by-concept",
//         enabled: body.some((row) => !row?.testAllocation?.uuid),
//         requiredWhenMissingTestAllocation: true,
//       },
//       body,
//       mapping: {
//         strategy: "configured-openmrs-lis-multiple-results",
//         observationCount: observations.length,
//         readyCount: body.length,
//         pendingMappingCount: Math.max(0, observations.length - body.length),
//         observations: resolvedObservations,
//       },
//     },
//   };
// }

// function readLisRules(): MappingRuleRow[] {
//   const db = getDb();
//   return db
//     .prepare(
//       `
//                 SELECT *
//                 FROM target_mappings
//                 WHERE target_type = 'LIS' AND enabled = 1
//                 ORDER BY created_at ASC
//             `,
//     )
//     .all() as MappingRuleRow[];
// }

// function readTranslations(): TranslationRow[] {
//   const db = getDb();
//   return db
//     .prepare(
//       `
//                 SELECT t.*
//                 FROM target_mapping_value_translations t
//                 INNER JOIN target_mappings m ON m.id = t.mapping_rule_id
//                 WHERE t.enabled = 1 AND m.target_type = 'LIS' AND m.enabled = 1
//             `,
//     )
//     .all() as TranslationRow[];
// }

// function groupTranslations(rows: TranslationRow[]) {
//   const grouped = new Map<string, TranslationRow[]>();
//   for (const row of rows) {
//     const bucket = grouped.get(row.mapping_rule_id) ?? [];
//     bucket.push(row);
//     grouped.set(row.mapping_rule_id, bucket);
//   }
//   return grouped;
// }

// function constantFor(rules: MappingRuleRow[], destinationAliases: string[]) {
//   const rule = rules.find(
//     (item) =>
//       item.transform_kind === "constant" &&
//       destinationAliases.includes(item.destination_field),
//   );
//   return parseScalar(rule?.constant_value ?? null);
// }

// function buildDestinationMap(
//   rules: MappingRuleRow[],
//   translationMap: Map<string, TranslationRow[]>,
//   destinationAliases: string[],
// ) {
//   const map = new Map<string, any>();
//   for (const rule of rules.filter((item) =>
//     destinationAliases.includes(item.destination_field),
//   )) {
//     for (const row of translationMap.get(rule.id) ?? []) {
//       const destinationValue = parseScalar(row.destination_value ?? null);
//       if (destinationValue == null || destinationValue === "") continue;
//       const raw = String(row.source_value ?? "").trim();
//       map.set(raw, destinationValue);
//       map.set(normalizeKey(raw), destinationValue);
//     }
//   }
//   return map;
// }

// function lookupMap(map: Map<string, any>, candidates: any[]) {
//   for (const candidate of candidates) {
//     const raw = String(candidate ?? "").trim();
//     if (!raw) continue;
//     if (map.has(raw)) return map.get(raw);
//     const normalized = normalizeKey(raw);
//     if (map.has(normalized)) return map.get(normalized);
//   }
//   return null;
// }

// function getObservations(sourceDocument: Record<string, any>): Observation[] {
//   const candidates = [
//     sourceDocument?.result?.observations,
//     sourceDocument?.result?.rows,
//     sourceDocument?.observations,
//     sourceDocument?.raw?.normalizedResults,
//     sourceDocument?.raw?.observations,
//     sourceDocument?.raw?.results,
//   ];

//   for (const candidate of candidates) {
//     if (Array.isArray(candidate) && candidate.length > 0) {
//       return candidate
//         .map(normalizeObservation)
//         .filter((item: Observation) => item.code || item.name);
//     }
//   }

//   if (sourceDocument?.result?.code) {
//     return [
//       normalizeObservation({
//         code: sourceDocument.result.code,
//         name: sourceDocument.result.name,
//         value: sourceDocument.result.value,
//         valueType: sourceDocument.result.valueType,
//         units: sourceDocument.result.units,
//         referenceRange: sourceDocument.result.referenceRange,
//         abnormalFlag: sourceDocument.result.abnormalFlag,
//         observedAt: sourceDocument.result.observedAt,
//       }),
//     ];
//   }

//   return [];
// }

// function normalizeObservation(row: any): Observation {
//   const code = firstNonEmpty(
//     row?.code,
//     row?.testCode,
//     row?.analyteCode,
//     row?.universalServiceId,
//     row?.identifier,
//     row?.concept?.display,
//     row?.concept?.uuid,
//   );
//   const value = firstNonEmpty(
//     row?.value,
//     row?.resultValue,
//     row?.valueText,
//     row?.valueNumeric,
//     row?.valueCoded?.display,
//     row?.valueCoded?.uuid,
//   );

//   return {
//     code,
//     name: firstNonEmpty(
//       row?.name,
//       row?.testName,
//       row?.display,
//       row?.concept?.display,
//     ),
//     value,
//     valueType: firstNonEmpty(row?.valueType, row?.datatype, row?.dataType),
//     units: row?.units ?? null,
//     referenceRange: firstNonEmpty(row?.referenceRange, row?.range),
//     abnormalFlag: firstNonEmpty(row?.abnormalFlag, row?.flag),
//     observedAt: firstNonEmpty(row?.observedAt, row?.testedDate, row?.dateTime),
//     raw: row,
//   };
// }

// function hasSampleIdentity(sourceDocument: Record<string, any>) {
//   return !!firstNonEmpty(
//     sourceDocument?.lis?.sample?.uuid,
//     sourceDocument?.sample?.uuid,
//     sourceDocument?.lis?.sample?.label,
//     sourceDocument?.sample?.label,
//     sourceDocument?.sample?.id,
//     sourceDocument?.specimen?.sampleId,
//   );
// }

// function normalizeKey(value: any) {
//   return String(value ?? "")
//     .trim()
//     .toUpperCase()
//     .replace(/[^A-Z0-9]+/g, "");
// }

// function firstNonEmpty(...values: any[]) {
//   for (const value of values) {
//     if (value !== undefined && value !== null && String(value).trim() !== "")
//       return value;
//   }
//   return null;
// }

// function inferDatatype(valueType: any) {
//   const value = String(valueType ?? "")
//     .trim()
//     .toUpperCase();
//   if (value === "NM" || value === "SN" || value.includes("NUM"))
//     return "numeric";
//   if (
//     value === "CE" ||
//     value === "CWE" ||
//     value === "CW" ||
//     value.includes("COD")
//   )
//     return "coded";
//   return "text";
// }

// function isAbnormal(flag: any) {
//   const value = String(flag ?? "")
//     .trim()
//     .toUpperCase();
//   if (!value || value === "N" || value === "NORMAL") return false;
//   return true;
// }

// function normalizeDate(value: any) {
//   const raw = String(value ?? "").trim();
//   if (!raw) return null;
//   if (/^\d{14}$/.test(raw)) {
//     return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}.000+0000`;
//   }
//   if (/^\d{8}$/.test(raw)) {
//     return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000+0000`;
//   }
//   return raw;
// }

// function parseScalar(value: any) {
//   if (value == null) return null;
//   const raw = String(value).trim();
//   if (!raw) return null;
//   if (raw === "null") return null;
//   if (raw === "true") return true;
//   if (raw === "false") return false;
//   if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
//   if (
//     (raw.startsWith("{") && raw.endsWith("}")) ||
//     (raw.startsWith("[") && raw.endsWith("]"))
//   ) {
//     try {
//       return JSON.parse(raw);
//     } catch {
//       return raw;
//     }
//   }
//   return raw;
// }

// function stripUndefined<T extends Record<string, any>>(row: T): T {
//   for (const key of Object.keys(row)) {
//     if (row[key] === undefined) delete row[key];
//   }
//   return row;
// }





// import { getDb } from "../db/db";

// const DEFAULT_ENDPOINT = "/openmrs/ws/rest/v1/lab/multipleresults";

// type MappingRuleRow = {
//   id: string;
//   target_type: string;
//   source_field: string;
//   destination_field: string;
//   transform_kind: "direct" | "constant" | "lookup";
//   constant_value?: string | null;
//   enabled: number;
//   value_mapping_enabled?: number;
//   unmapped_behavior?:
//     | "PASSTHROUGH"
//     | "DEFAULT_VALUE"
//     | "EMPTY"
//     | "ERROR"
//     | null;
//   default_destination_value?: string | null;
// };

// type TranslationRow = {
//   id: string;
//   mapping_rule_id: string;
//   source_value: string;
//   destination_value?: string | null;
//   enabled: number;
//   note?: string | null;
// };

// type Observation = {
//   code?: string | null;
//   name?: string | null;
//   value?: any;
//   valueType?: string | null;
//   units?: string | null;
//   referenceRange?: string | null;
//   abnormalFlag?: string | null;
//   observedAt?: string | null;
//   resultStatus?: string | null;
//   raw?: any;
// };

// export type OpenMrsLisPayloadBuildResult = {
//   used: boolean;
//   payload: Record<string, any>;
//   warnings: string[];
//   errors: string[];
// };

// export function buildOpenMrsLisPayload(
//   target: any,
//   sourceDocument: Record<string, any>,
// ): OpenMrsLisPayloadBuildResult {
//   if (!target || target.type !== "LIS") {
//     return { used: false, payload: sourceDocument, warnings: [], errors: [] };
//   }

//   const rules = readLisRules();
//   const translationMap = groupTranslations(readTranslations());
//   const observations = getObservations(sourceDocument);
//   const warnings: string[] = [];
//   const errors: string[] = [];
//   const body: any[] = [];
//   const resolvedObservations: any[] = [];

//   const endpoint =
//     firstNonEmpty(
//       constantFor(rules, ["lis.endpoint", "endpoint", "payload.endpoint"]),
//       sourceDocument?.lis?.endpoint,
//       DEFAULT_ENDPOINT,
//     ) ?? DEFAULT_ENDPOINT;
//   const instrumentUuid = constantFor(rules, [
//     "lis.defaults.instrumentUuid",
//     "instrument.uuid",
//   ]);
//   const testedBy = constantFor(rules, ["lis.defaults.testedBy", "testedBy"]);
//   const statusCategory =
//     constantFor(rules, ["lis.defaults.status.category", "status.category"]) ??
//     "RESULT_REMARKS";
//   const statusStatus =
//     constantFor(rules, ["lis.defaults.status.status", "status.status"]) ??
//     "REMARKS";
//   const statusRemarks =
//     constantFor(rules, ["lis.defaults.status.remarks", "status.remarks"]) ??
//     "Imported from analyzer via machine interfacing";

//   const conceptByCode = buildDestinationMap(rules, translationMap, [
//     "lis.parameter.conceptUuid",
//   ]);
//   const allocationByCode = buildDestinationMap(rules, translationMap, [
//     "lis.parameter.allocationUuid",
//     "lis.parameter.testAllocationUuid",
//   ]);
//   const datatypeByCode = buildDestinationMap(rules, translationMap, [
//     "lis.parameter.datatype",
//   ]);
//   const codedAnswerByValue = buildDestinationMap(rules, translationMap, [
//     "lis.valueCoded.uuid",
//     "valueCoded.uuid",
//   ]);
//   const canResolveAllocationAtDelivery = hasSampleIdentity(sourceDocument);

//   for (const observation of observations) {
//     const sourceCode = firstNonEmpty(observation.code, observation.name);
//     const sourceValue = observation.value;
//     const codeAliases = observationCodeAliases(observation, sourceCode);
//     const datatype = String(
//       firstNonEmpty(
//         lookupMap(datatypeByCode, codeAliases),
//         inferDatatype(observation.valueType),
//       ) ?? "text",
//     ).toLowerCase();

//     const conceptUuid = lookupMap(conceptByCode, codeAliases);
//     const allocationUuid = lookupMap(allocationByCode, codeAliases);
//     const rowWarnings: string[] = [];
//     const rowErrors: string[] = [];

//     if (!conceptUuid) {
//       rowErrors.push(
//         `No LIS concept UUID mapping found for analyzer code "${sourceCode}".`,
//       );
//     }

//     if (!allocationUuid && !canResolveAllocationAtDelivery) {
//       rowErrors.push(
//         `No LIS test allocation UUID mapping found for analyzer code "${sourceCode}" and no sample label/UUID is available for delivery-time allocation lookup.`,
//       );
//     } else if (!allocationUuid) {
//       rowWarnings.push(
//         `No static LIS allocation UUID mapping found for "${sourceCode}". It will be resolved from the OpenMRS sample allocation at delivery time.`,
//       );
//     }

//     const row: Record<string, any> = {
//       concept: conceptUuid ? { uuid: conceptUuid } : undefined,
//       testAllocation: allocationUuid ? { uuid: allocationUuid } : undefined,
//       valueNumeric: null,
//       valueText: null,
//       valueCoded: null,
//       abnormal: isAbnormal(observation.abnormalFlag),
//       instrument: instrumentUuid ? { uuid: instrumentUuid } : undefined,
//       status: {
//         category: statusCategory,
//         status: statusStatus,
//         remarks: statusRemarks,
//       },
//       testedDate: normalizeDate(
//         observation.observedAt ?? sourceDocument?.normalized?.observedAt,
//       ),
//       testedBy: testedBy || undefined,
//     };

//     if (datatype.includes("coded")) {
//       const codedUuid = lookupMap(
//         codedAnswerByValue,
//         codedAnswerLookupCandidates(codeAliases, sourceValue),
//       );
//       if (!codedUuid) {
//         rowErrors.push(
//           `No LIS coded answer UUID mapping found for analyzer result "${sourceCode}=${sourceValue}".`,
//         );
//       } else {
//         row.valueCoded = { uuid: codedUuid };
//       }
//     } else if (datatype.includes("num") || observation.valueType === "NM") {
//       const numeric = Number(sourceValue);
//       if (Number.isFinite(numeric)) {
//         row.valueNumeric = numeric;
//       } else {
//         rowErrors.push(
//           `Analyzer result "${sourceCode}" expected a numeric value but received "${sourceValue}".`,
//         );
//       }
//     } else {
//       row.valueText = sourceValue == null ? null : String(sourceValue);
//     }

//     const ready = rowErrors.length === 0;
//     resolvedObservations.push({
//       sourceCode,
//       sourceValue,
//       datatype,
//       conceptUuid: conceptUuid ?? null,
//       testAllocationUuid: allocationUuid ?? null,
//       allocationResolution: allocationUuid
//         ? "static-mapping"
//         : canResolveAllocationAtDelivery
//           ? "delivery-time-sample-allocation"
//           : "missing",
//       ready,
//       warnings: rowWarnings,
//       errors: rowErrors,
//     });

//     warnings.push(...rowWarnings);
//     if (ready) {
//       body.push(stripUndefined(row));
//     } else {
//       errors.push(...rowErrors);
//     }
//   }

//   if (!body.length) {
//     errors.push(
//       "No LIS multiple-results rows are ready. Configure LIS mappings for analyzer code → concept UUID and analyzer value → coded answer UUID where applicable. Allocation UUIDs can be resolved dynamically from the OpenMRS sample allocation when the sample label/UUID is available.",
//     );
//   }

//   const sample = {
//     id: firstNonEmpty(
//       sourceDocument?.sample?.id,
//       sourceDocument?.specimen?.sampleId,
//       sourceDocument?.lis?.sample?.label,
//     ),
//     label: firstNonEmpty(
//       sourceDocument?.lis?.sample?.label,
//       sourceDocument?.sample?.label,
//       sourceDocument?.sample?.id,
//     ),
//     uuid: firstNonEmpty(
//       sourceDocument?.lis?.sample?.uuid,
//       sourceDocument?.sample?.uuid,
//     ),
//   };

//   return {
//     used: body.length > 0,
//     warnings,
//     errors,
//     payload: {
//       resourceType: "OpenMRSLabMultipleResultsRequest",
//       method: "POST",
//       endpoint,
//       sample,
//       order: {
//         id: sourceDocument?.order?.id ?? null,
//         uuid: sourceDocument?.order?.uuid ?? null,
//         testCode: sourceDocument?.result?.code ?? null,
//         testName: sourceDocument?.result?.name ?? null,
//       },
//       allocationResolution: {
//         strategy: "sample-allocation-by-concept",
//         enabled: body.some((row) => !row?.testAllocation?.uuid),
//         requiredWhenMissingTestAllocation: true,
//       },
//       body,
//       mapping: {
//         strategy: "configured-openmrs-lis-multiple-results",
//         observationCount: observations.length,
//         readyCount: body.length,
//         pendingMappingCount: Math.max(0, observations.length - body.length),
//         observations: resolvedObservations,
//       },
//     },
//   };
// }

// function readLisRules(): MappingRuleRow[] {
//   const db = getDb();
//   return db
//     .prepare(
//       `
//                 SELECT *
//                 FROM target_mappings
//                 WHERE target_type = 'LIS' AND enabled = 1
//                 ORDER BY created_at ASC
//             `,
//     )
//     .all() as MappingRuleRow[];
// }

// function readTranslations(): TranslationRow[] {
//   const db = getDb();
//   return db
//     .prepare(
//       `
//                 SELECT t.*
//                 FROM target_mapping_value_translations t
//                 INNER JOIN target_mappings m ON m.id = t.mapping_rule_id
//                 WHERE t.enabled = 1 AND m.target_type = 'LIS' AND m.enabled = 1
//             `,
//     )
//     .all() as TranslationRow[];
// }

// function groupTranslations(rows: TranslationRow[]) {
//   const grouped = new Map<string, TranslationRow[]>();
//   for (const row of rows) {
//     const bucket = grouped.get(row.mapping_rule_id) ?? [];
//     bucket.push(row);
//     grouped.set(row.mapping_rule_id, bucket);
//   }
//   return grouped;
// }

// function constantFor(rules: MappingRuleRow[], destinationAliases: string[]) {
//   const rule = rules.find(
//     (item) =>
//       item.transform_kind === "constant" &&
//       destinationAliases.includes(item.destination_field),
//   );
//   return parseScalar(rule?.constant_value ?? null);
// }

// function buildDestinationMap(
//   rules: MappingRuleRow[],
//   translationMap: Map<string, TranslationRow[]>,
//   destinationAliases: string[],
// ) {
//   const map = new Map<string, any>();
//   for (const rule of rules.filter((item) =>
//     destinationAliases.includes(item.destination_field),
//   )) {
//     for (const row of translationMap.get(rule.id) ?? []) {
//       const destinationValue = parseScalar(row.destination_value ?? null);
//       if (destinationValue == null || destinationValue === "") continue;
//       const raw = String(row.source_value ?? "").trim();
//       map.set(raw, destinationValue);
//       map.set(normalizeKey(raw), destinationValue);
//     }
//   }
//   return map;
// }


// function observationCodeAliases(observation: Observation, sourceCode: any) {
//   return uniqueNonEmpty([
//     sourceCode,
//     normalizeKey(sourceCode),
//     observation.name,
//     normalizeKey(observation.name),
//     observation.raw?.code,
//     observation.raw?.testCode,
//     observation.raw?.analyteCode,
//     observation.raw?.universalServiceId,
//     observation.raw?.identifier,
//     observation.raw?.display,
//     observation.raw?.concept?.display,
//     observation.raw?.concept?.uuid,
//   ]);
// }

// function codedAnswerLookupCandidates(codeAliases: any[], sourceValue: any) {
//   const valueAliases = uniqueNonEmpty([
//     sourceValue,
//     normalizeKey(sourceValue),
//     String(sourceValue ?? "").replace(/\.$/, ""),
//     normalizeKey(String(sourceValue ?? "").replace(/\.$/, "")),
//   ]);
//   const candidates: any[] = [];
//   for (const code of codeAliases) {
//     for (const value of valueAliases) {
//       candidates.push(`${code}=${value}`);
//       candidates.push(`${normalizeKey(code)}=${normalizeKey(value)}`);
//     }
//   }
//   candidates.push(...valueAliases);
//   return uniqueNonEmpty(candidates);
// }

// function uniqueNonEmpty(values: any[]) {
//   const seen = new Set<string>();
//   const output: string[] = [];
//   for (const value of values) {
//     const raw = String(value ?? "").trim();
//     if (!raw || seen.has(raw)) continue;
//     seen.add(raw);
//     output.push(raw);
//   }
//   return output;
// }

// function lookupMap(map: Map<string, any>, candidates: any[]) {
//   for (const candidate of candidates) {
//     const raw = String(candidate ?? "").trim();
//     if (!raw) continue;
//     if (map.has(raw)) return map.get(raw);
//     const normalized = normalizeKey(raw);
//     if (map.has(normalized)) return map.get(normalized);
//   }
//   return null;
// }

// function getObservations(sourceDocument: Record<string, any>): Observation[] {
//   const candidates = [
//     sourceDocument?.result?.observations,
//     sourceDocument?.result?.rows,
//     sourceDocument?.observations,
//     sourceDocument?.raw?.normalizedResults,
//     sourceDocument?.raw?.observations,
//     sourceDocument?.raw?.results,
//   ];

//   for (const candidate of candidates) {
//     if (Array.isArray(candidate) && candidate.length > 0) {
//       return candidate
//         .map(normalizeObservation)
//         .filter((item: Observation) => item.code || item.name);
//     }
//   }

//   if (sourceDocument?.result?.code) {
//     return [
//       normalizeObservation({
//         code: sourceDocument.result.code,
//         name: sourceDocument.result.name,
//         value: sourceDocument.result.value,
//         valueType: sourceDocument.result.valueType,
//         units: sourceDocument.result.units,
//         referenceRange: sourceDocument.result.referenceRange,
//         abnormalFlag: sourceDocument.result.abnormalFlag,
//         observedAt: sourceDocument.result.observedAt,
//       }),
//     ];
//   }

//   return [];
// }

// function normalizeObservation(row: any): Observation {
//   const code = firstNonEmpty(
//     row?.code,
//     row?.testCode,
//     row?.analyteCode,
//     row?.universalServiceId,
//     row?.identifier,
//     row?.concept?.display,
//     row?.concept?.uuid,
//   );
//   const value = firstNonEmpty(
//     row?.value,
//     row?.resultValue,
//     row?.valueText,
//     row?.valueNumeric,
//     row?.valueCoded?.display,
//     row?.valueCoded?.uuid,
//   );

//   return {
//     code,
//     name: firstNonEmpty(
//       row?.name,
//       row?.testName,
//       row?.display,
//       row?.concept?.display,
//     ),
//     value,
//     valueType: firstNonEmpty(row?.valueType, row?.datatype, row?.dataType),
//     units: row?.units ?? null,
//     referenceRange: firstNonEmpty(row?.referenceRange, row?.range),
//     abnormalFlag: firstNonEmpty(row?.abnormalFlag, row?.flag),
//     observedAt: firstNonEmpty(row?.observedAt, row?.testedDate, row?.dateTime),
//     raw: row,
//   };
// }

// function hasSampleIdentity(sourceDocument: Record<string, any>) {
//   return !!firstNonEmpty(
//     sourceDocument?.lis?.sample?.uuid,
//     sourceDocument?.sample?.uuid,
//     sourceDocument?.lis?.sample?.label,
//     sourceDocument?.sample?.label,
//     sourceDocument?.sample?.id,
//     sourceDocument?.specimen?.sampleId,
//   );
// }

// function normalizeKey(value: any) {
//   return String(value ?? "")
//     .trim()
//     .toUpperCase()
//     .replace(/[^A-Z0-9]+/g, "");
// }

// function firstNonEmpty(...values: any[]) {
//   for (const value of values) {
//     if (value !== undefined && value !== null && String(value).trim() !== "")
//       return value;
//   }
//   return null;
// }

// function inferDatatype(valueType: any) {
//   const value = String(valueType ?? "")
//     .trim()
//     .toUpperCase();
//   if (value === "NM" || value === "SN" || value.includes("NUM"))
//     return "numeric";
//   if (
//     value === "CE" ||
//     value === "CWE" ||
//     value === "CW" ||
//     value.includes("COD")
//   )
//     return "coded";
//   return "text";
// }

// function isAbnormal(flag: any) {
//   const value = String(flag ?? "")
//     .trim()
//     .toUpperCase();
//   if (!value || value === "N" || value === "NORMAL") return false;
//   return true;
// }

// function normalizeDate(value: any) {
//   const raw = String(value ?? "").trim();
//   if (!raw) return null;
//   if (/^\d{14}$/.test(raw)) {
//     return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}.000+0000`;
//   }
//   if (/^\d{8}$/.test(raw)) {
//     return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000+0000`;
//   }
//   return raw;
// }

// function parseScalar(value: any) {
//   if (value == null) return null;
//   const raw = String(value).trim();
//   if (!raw) return null;
//   if (raw === "null") return null;
//   if (raw === "true") return true;
//   if (raw === "false") return false;
//   if (/^-?\d+(\.\d+)?$/.test(raw)) return Number(raw);
//   if (
//     (raw.startsWith("{") && raw.endsWith("}")) ||
//     (raw.startsWith("[") && raw.endsWith("]"))
//   ) {
//     try {
//       return JSON.parse(raw);
//     } catch {
//       return raw;
//     }
//   }
//   return raw;
// }

// function stripUndefined<T extends Record<string, any>>(row: T): T {
//   for (const key of Object.keys(row)) {
//     if (row[key] === undefined) delete row[key];
//   }
//   return row;
// }




// import { getDb } from '../db/db';

// const LIS_CONCEPT_DESTINATIONS = new Set([
//   'lis.parameter.conceptUuid',
//   'lis.parameter.concept.uuid',
//   'lis.concept.uuid',
//   'concept.uuid',
// ]);

// const LIS_ALLOCATION_DESTINATIONS = new Set([
//   'lis.parameter.allocationUuid',
//   'lis.parameter.testAllocationUuid',
//   'lis.testAllocation.uuid',
//   'testAllocation.uuid',
// ]);

// const LIS_CODED_ANSWER_DESTINATIONS = new Set([
//   'lis.valueCoded.uuid',
//   'lis.answer.uuid',
//   'valueCoded.uuid',
// ]);

// const LIS_DATATYPE_DESTINATIONS = new Set([
//   'lis.parameter.datatype',
//   'lis.datatype',
// ]);

// type TargetRecord = {
//   id: string;
//   type: string;
//   name?: string | null;
// };

// type MappingRuleRow = {
//   id: string;
//   target_type: string;
//   source_field: string;
//   destination_field: string;
//   transform_kind: 'direct' | 'constant' | 'lookup';
//   constant_value?: string | null;
//   enabled: number;
//   value_mapping_enabled?: number;
//   unmapped_behavior?: 'PASSTHROUGH' | 'DEFAULT_VALUE' | 'EMPTY' | 'ERROR' | null;
//   default_destination_value?: string | null;
// };

// type TranslationRow = {
//   id: string;
//   mapping_rule_id: string;
//   source_value: string;
//   destination_value?: string | null;
//   enabled: number;
//   note?: string | null;
// };

// type ObservationCandidate = {
//   code: string;
//   value: any;
//   display?: string | null;
//   units?: string | null;
//   abnormal?: boolean;
//   observedAt?: string | null;
//   raw: any;
// };

// type ResolverMaps = {
//   conceptByCode: Map<string, string>;
//   allocationByCode: Map<string, string>;
//   answerByCodeAndValue: Map<string, string>;
//   answerByValue: Map<string, string>;
//   datatypeByCode: Map<string, string>;
//   warnings: string[];
// };

// export type OpenMrsLisPayloadBuildResult = {
//   used: boolean;
//   payload: Record<string, any> | null;
//   warnings: string[];
//   errors: string[];
//   rowCount: number;
// };

// export function buildOpenMrsLisPayload(
//   target: TargetRecord,
//   sourceDocument: Record<string, any>,
// ): OpenMrsLisPayloadBuildResult {
//   if (target.type !== 'LIS' && target.type !== 'OPENMRS') {
//     return { used: false, payload: null, warnings: [], errors: [], rowCount: 0 };
//   }

//   const resolver = loadResolverMaps(target.type);
//   const observations = extractObservations(sourceDocument);
//   const warnings = [...resolver.warnings];
//   const errors: string[] = [];

//   if (!observations.length) {
//     return {
//       used: false,
//       payload: null,
//       warnings: [
//         ...warnings,
//         'No machine observations were found to build an OpenMRS LIS multiple-results payload.',
//       ],
//       errors,
//       rowCount: 0,
//     };
//   }

//   const sample = extractSampleContext(sourceDocument);
//   const instrument = extractInstrumentContext(sourceDocument);
//   const testedBy = extractTestedBy(sourceDocument);
//   const defaultRemarks = extractDefaultRemarks(sourceDocument);

//   const rows: any[] = [];

//   for (const observation of observations) {
//     const codeCandidates = codeLookupCandidates(observation.code, observation.display ?? null);
//     const valueCandidates = valueLookupCandidates(observation.value);
//     const answerCandidates = answerLookupCandidates(codeCandidates, valueCandidates);

//     const conceptUuid = resolveFromMap(resolver.conceptByCode, codeCandidates);
//     const allocationUuid = resolveFromMap(resolver.allocationByCode, codeCandidates);
//     const codedAnswerUuid = resolveFromMap(resolver.answerByCodeAndValue, answerCandidates) ??
//       resolveFromMap(resolver.answerByValue, valueCandidates);
//     const datatype = resolveFromMap(resolver.datatypeByCode, codeCandidates);

//     if (!conceptUuid) {
//       errors.push(
//         `No LIS concept UUID mapping found for analyzer code "${observation.code}".`,
//       );
//       continue;
//     }

//     const row: any = {
//       concept: { uuid: conceptUuid },
//       valueNumeric: null,
//       valueText: null,
//       valueCoded: null,
//       abnormal: Boolean(observation.abnormal),
//       status: {
//         category: 'RESULT_REMARKS',
//         status: 'REMARKS',
//         remarks: defaultRemarks,
//       },
//       testedDate: observation.observedAt ?? sourceDocument?.normalized?.observedAt ?? null,
//       testedBy,
//     };

//     if (allocationUuid) {
//       row.testAllocation = { uuid: allocationUuid };
//     } else if (sample.uuid || sample.label) {
//       warnings.push(
//         `No stored allocation UUID mapping found for analyzer code "${observation.code}". It will be resolved dynamically from /lab/samplelookup and /lab/allocationsbysample before delivery.`,
//       );
//     } else {
//       errors.push(
//         `No LIS test allocation UUID mapping found for analyzer code "${observation.code}" and no sample label/UUID is available for dynamic allocation lookup.`,
//       );
//       continue;
//     }

//     if (instrument?.uuid) row.instrument = { uuid: instrument.uuid };

//     if (isLikelyNumericResult(observation.value, datatype)) {
//       row.valueNumeric = Number(observation.value);
//     } else if (codedAnswerUuid) {
//       row.valueCoded = { uuid: codedAnswerUuid };
//     } else {
//       const rawValue = normalizeDisplayValue(observation.value);
//       if (rawValue) {
//         if (isCodedDatatype(datatype)) {
//           errors.push(
//             `No LIS coded answer UUID mapping found for analyzer result "${observation.code}=${rawValue}".`,
//           );
//           continue;
//         }
//         row.valueText = rawValue;
//       } else {
//         errors.push(
//           `Analyzer code "${observation.code}" did not have a result value to send to LIS.`,
//         );
//         continue;
//       }
//     }

//     rows.push(row);
//   }

//   if (!rows.length) {
//     warnings.unshift(
//       'No LIS multiple-results rows are ready. Configure LIS mappings for analyzer code → concept UUID, analyzer code → allocation UUID when static allocation is required, and analyzer value → coded answer UUID where applicable.',
//     );
//   }

//   return {
//     used: rows.length > 0,
//     payload: rows.length
//       ? {
//           resourceType: 'OpenMRSLabMultipleResultsRequest',
//           version: 1,
//           method: 'POST',
//           endpoint: '/lab/multipleresults',
//           contentType: 'application/json',
//           body: rows,
//           context: {
//             sample,
//             instrument,
//             testedBy,
//             source: {
//               targetId: target.id,
//               targetName: target.name ?? null,
//               machineId: sourceDocument?.normalized?.machineId ?? null,
//               protocol: sourceDocument?.normalized?.protocol ?? null,
//             },
//             dynamicResolution: {
//               allocationResolution: 'sample-lookup-and-allocation-match',
//               matchStrategy: 'concept UUID first, then analyzer code/reference mapping/display fallback',
//             },
//           },
//         }
//       : null,
//     warnings,
//     errors,
//     rowCount: rows.length,
//   };
// }

// function loadResolverMaps(targetType: string): ResolverMaps {
//   const maps: ResolverMaps = {
//     conceptByCode: new Map(),
//     allocationByCode: new Map(),
//     answerByCodeAndValue: new Map(),
//     answerByValue: new Map(),
//     datatypeByCode: new Map(),
//     warnings: [],
//   };

//   let rules: MappingRuleRow[] = [];
//   let translations: TranslationRow[] = [];

//   try {
//     const db = getDb();
//     rules = db
//       .prepare(
//         `
//           SELECT *
//           FROM target_mappings
//           WHERE target_type = ? AND enabled = 1
//           ORDER BY created_at ASC
//         `,
//       )
//       .all(targetType) as MappingRuleRow[];

//     const ruleIds = rules.map((rule) => rule.id);
//     if (ruleIds.length) {
//       const placeholders = ruleIds.map(() => '?').join(',');
//       translations = db
//         .prepare(
//           `
//             SELECT *
//             FROM target_mapping_value_translations
//             WHERE enabled = 1 AND mapping_rule_id IN (${placeholders})
//           `,
//         )
//         .all(...ruleIds) as TranslationRow[];
//     }
//   } catch (error: any) {
//     maps.warnings.push(`Could not load LIS mapping resolver rules: ${error?.message ?? error}`);
//     return maps;
//   }

//   const translationsByRule = new Map<string, TranslationRow[]>();
//   for (const row of translations) {
//     if (!translationsByRule.has(row.mapping_rule_id)) translationsByRule.set(row.mapping_rule_id, []);
//     translationsByRule.get(row.mapping_rule_id)!.push(row);
//   }

//   for (const rule of rules) {
//     const destination = String(rule.destination_field ?? '').trim();
//     const values = translationsByRule.get(rule.id) ?? [];

//     if (LIS_CONCEPT_DESTINATIONS.has(destination)) {
//       loadTranslationMap(maps.conceptByCode, values, rule.default_destination_value);
//       continue;
//     }

//     if (LIS_ALLOCATION_DESTINATIONS.has(destination)) {
//       loadTranslationMap(maps.allocationByCode, values, rule.default_destination_value);
//       continue;
//     }

//     if (LIS_CODED_ANSWER_DESTINATIONS.has(destination)) {
//       for (const value of values) {
//         const source = String(value.source_value ?? '').trim();
//         const destinationValue = String(value.destination_value ?? '').trim();
//         if (!source || !destinationValue) continue;
//         const normalizedSource = normalizeKey(source);
//         if (source.includes('=')) {
//           maps.answerByCodeAndValue.set(normalizedSource, destinationValue);
//         } else {
//           maps.answerByValue.set(normalizedSource, destinationValue);
//         }
//       }
//       continue;
//     }

//     if (LIS_DATATYPE_DESTINATIONS.has(destination)) {
//       loadTranslationMap(maps.datatypeByCode, values, rule.default_destination_value);
//     }
//   }

//   return maps;
// }

// function loadTranslationMap(
//   map: Map<string, string>,
//   translations: TranslationRow[],
//   defaultDestination?: string | null,
// ) {
//   for (const row of translations) {
//     const source = String(row.source_value ?? '').trim();
//     const destination = String(row.destination_value ?? defaultDestination ?? '').trim();
//     if (!source || !destination) continue;
//     for (const key of codeLookupCandidates(source, null)) {
//       map.set(normalizeKey(key), destination);
//     }
//   }
// }

// function extractObservations(sourceDocument: Record<string, any>): ObservationCandidate[] {
//   const raw = sourceDocument?.raw ?? {};
//   const candidates: any[] = [];

//   appendArray(candidates, raw?.results);
//   appendArray(candidates, raw?.observations);
//   appendArray(candidates, raw?.obx);
//   appendArray(candidates, raw?.lis?.observations);
//   appendArray(candidates, raw?.lis?.results);
//   appendArray(candidates, sourceDocument?.result?.observations);

//   const lisRows = Array.isArray(raw?.lis?.multipleResultsPayload)
//     ? raw.lis.multipleResultsPayload
//     : [];
//   for (const row of lisRows) candidates.push(row);

//   if (sourceDocument?.result?.code || sourceDocument?.result?.value !== undefined) {
//     candidates.push(sourceDocument.result);
//   }

//   const seen = new Set<string>();
//   return candidates
//     .map((row) => toObservation(row, sourceDocument))
//     .filter((row): row is ObservationCandidate => !!row && !!row.code)
//     .filter((row) => {
//       const fingerprint = `${row.code}|${normalizeDisplayValue(row.value)}|${row.observedAt ?? ''}`;
//       if (seen.has(fingerprint)) return false;
//       seen.add(fingerprint);
//       return true;
//     });
// }

// function appendArray(target: any[], value: any) {
//   if (Array.isArray(value)) target.push(...value);
// }

// function toObservation(row: any, sourceDocument: Record<string, any>): ObservationCandidate | null {
//   if (!row || typeof row !== 'object') return null;

//   const code = firstNonEmpty(
//     row.code,
//     row.testCode,
//     row.test_code,
//     row.analyzerCode,
//     row.parameterCode,
//     row.identifier,
//     row.observationIdentifier,
//     row?.concept?.display,
//     row?.concept?.uuid,
//     row?.parameter?.display,
//     sourceDocument?.result?.code,
//   );

//   if (!code) return null;

//   const value = firstDefined(
//     row.value,
//     row.result,
//     row.resultValue,
//     row.valueText,
//     row.valueNumeric,
//     row?.valueCoded?.display,
//     row?.valueCoded?.name,
//     row?.valueCoded?.uuid,
//     sourceDocument?.result?.value,
//   );

//   return {
//     code,
//     value,
//     display: firstNonEmpty(row.display, row.name, row.testName, row.parameterName, row?.concept?.display),
//     units: firstNonEmpty(row.units, row.unit, row.valueUnits),
//     abnormal: Boolean(row.abnormal ?? row.isAbnormal ?? row.abnormalFlag),
//     observedAt: firstNonEmpty(row.observedAt, row.resultedAt, row.testedDate, sourceDocument?.result?.observedAt),
//     raw: row,
//   };
// }

// function extractSampleContext(sourceDocument: Record<string, any>) {
//   const raw = sourceDocument?.raw ?? {};
//   const sample = raw?.sample ?? raw?.specimen ?? raw?.lis?.sample ?? sourceDocument?.sample ?? sourceDocument?.specimen ?? {};
//   const id = firstNonEmpty(sample.id, sample.label, sample.accessionNumber, sample.barcode, raw.sampleId, raw.sample_id, sourceDocument?.sample?.id);
//   return {
//     uuid: firstNonEmpty(sample.uuid, sample.sampleUuid, raw.sampleUuid) ?? null,
//     label: firstNonEmpty(sample.label, sample.display, id) ?? null,
//     id: id ?? null,
//   };
// }

// function extractInstrumentContext(sourceDocument: Record<string, any>) {
//   const raw = sourceDocument?.raw ?? {};
//   const instrument = raw?.instrument ?? raw?.lis?.instrument ?? raw?.device ?? {};
//   return {
//     uuid: firstNonEmpty(instrument.uuid, raw.instrumentUuid, raw.instrument_uuid) ?? null,
//     display: firstNonEmpty(instrument.display, instrument.name, raw.instrument, raw.deviceName) ?? null,
//   };
// }

// function extractTestedBy(sourceDocument: Record<string, any>) {
//   const raw = sourceDocument?.raw ?? {};
//   const testedBy = raw?.testedBy ?? raw?.lis?.testedBy ?? sourceDocument?.lis?.testedBy ?? null;
//   if (typeof testedBy === 'string') return testedBy;
//   return firstNonEmpty(testedBy?.uuid, raw.testedByUuid, raw.tested_by_uuid, raw.lis?.testedByUuid) ?? null;
// }

// function extractDefaultRemarks(sourceDocument: Record<string, any>) {
//   return firstNonEmpty(
//     sourceDocument?.raw?.lis?.defaultRemarks,
//     sourceDocument?.raw?.remarks,
//     'Machine interfaced result',
//   ) ?? 'Machine interfaced result';
// }

// function codeLookupCandidates(code: any, display: string | null): string[] {
//   const values = [code, display]
//     .map((value) => String(value ?? '').trim())
//     .filter(Boolean);
//   const expanded = new Set<string>();
//   for (const value of values) {
//     expanded.add(value);
//     expanded.add(value.toUpperCase());
//     expanded.add(value.toLowerCase());
//     expanded.add(value.replace(/[-_\s]+/g, '').toUpperCase());
//     expanded.add(value.replace(/[^a-zA-Z0-9]+/g, '').toUpperCase());
//   }
//   return Array.from(expanded);
// }

// function valueLookupCandidates(value: any): string[] {
//   const raw = normalizeDisplayValue(value);
//   if (!raw) return [];
//   const normalized = raw.trim();
//   const upper = normalized.toUpperCase();
//   const values = new Set<string>([normalized, upper]);

//   if (upper === 'POSITIVE') values.add('POS');
//   if (upper === 'NEGATIVE') values.add('NEG');
//   if (upper === 'INVALID.') values.add('INVALID');
//   if (upper === 'INVALID') values.add('INVALID.');
//   if (upper === 'POS') values.add('Positive');
//   if (upper === 'NEG') values.add('Negative');

//   return Array.from(values);
// }

// function answerLookupCandidates(codeCandidates: string[], valueCandidates: string[]): string[] {
//   const values: string[] = [];
//   for (const code of codeCandidates) {
//     for (const value of valueCandidates) {
//       values.push(`${code}=${value}`);
//       values.push(`${code}:${value}`);
//       values.push(`${code}|${value}`);
//     }
//   }
//   return values;
// }

// function resolveFromMap(map: Map<string, string>, candidates: string[]): string | null {
//   for (const candidate of candidates) {
//     const value = map.get(normalizeKey(candidate));
//     if (value) return value;
//   }
//   return null;
// }

// function normalizeKey(value: any): string {
//   return String(value ?? '').trim().replace(/\s+/g, ' ').toUpperCase();
// }

// function normalizeDisplayValue(value: any): string {
//   if (value === null || value === undefined) return '';
//   if (typeof value === 'object') {
//     return String(value.display ?? value.name ?? value.uuid ?? '').trim();
//   }
//   return String(value).trim();
// }

// function isLikelyNumericResult(value: any, datatype?: string | null): boolean {
//   if (isCodedDatatype(datatype)) return false;
//   if (typeof value === 'number') return Number.isFinite(value);
//   const text = normalizeDisplayValue(value);
//   if (!text) return false;
//   if (/^[<>]/.test(text)) return false;
//   return /^-?\d+(\.\d+)?$/.test(text);
// }

// function isCodedDatatype(datatype?: string | null): boolean {
//   return String(datatype ?? '').toLowerCase().includes('coded');
// }

// function firstNonEmpty(...values: any[]): string | null {
//   for (const value of values) {
//     const text = String(value ?? '').trim();
//     if (text) return text;
//   }
//   return null;
// }

// function firstDefined(...values: any[]): any {
//   for (const value of values) {
//     if (value !== undefined && value !== null && value !== '') return value;
//   }
//   return null;
// }


import { getDb } from '../db/db';

type MappingRuleRow = {
    id: string;
    target_type: string;
    source_field?: string | null;
    destination_field: string;
    transform_kind?: string | null;
    constant_value?: string | null;
    enabled: number;
    value_mapping_enabled?: number | null;
    unmapped_behavior?: string | null;
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

type AnalyzerObservation = {
    code: string;
    value: any;
    display?: string | null;
    parentCode?: string | null;
    source?: any;
};

type TranslationIndex = {
    conceptUuidByCode: Map<string, string>;
    allocationUuidByCode: Map<string, string>;
    codedUuidByResult: Map<string, string>;
    directValuesByDestination: Map<string, any>;
    conceptRuleCount: number;
    codedRuleCount: number;
    allocationRuleCount: number;
};

export type OpenMrsLisPayloadBuildResult = {
    payload: any | null;
    warnings: string[];
    errors: string[];
    summary: {
        ruleCount: number;
        appliedCount: number;
        skippedCount: number;
        translatedCount: number;
        lisRows: number;
        observationCount: number;
        compositeExpandedCount: number;
    };
};

const DEFAULT_LIS_ENDPOINT = '/lab/multipleresults';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function buildOpenMrsLisMultipleResultsPayload(args: {
    targetType: string;
    sourceDocument: Record<string, any>;
    target?: any;
}): OpenMrsLisPayloadBuildResult {
    const builder = new OpenMrsLisPayloadBuilder(args.targetType, args.sourceDocument, args.target);
    return builder.build();
}

class OpenMrsLisPayloadBuilder {
    private readonly warnings: string[] = [];
    private readonly errors: string[] = [];
    private readonly rows: any[] = [];
    private compositeExpandedCount = 0;

    constructor(
        private readonly targetType: string,
        private readonly sourceDocument: Record<string, any>,
        private readonly target?: any,
    ) {}

    build(): OpenMrsLisPayloadBuildResult {
        const translations = this.readLisTranslations();
        const observations = this.extractAnalyzerObservations(this.sourceDocument);
        const allocationByConceptUuid = this.extractAllocationIndex(this.sourceDocument);
        const context = this.extractContext(this.sourceDocument, translations.directValuesByDestination);

        for (const observation of observations) {
            const mappedConceptUuid = this.lookupConceptUuid(observation, translations);
            if (!mappedConceptUuid) {
                this.errors.push(
                    `No LIS concept UUID mapping found for analyzer code "${observation.code}".` +
                        ' Configure analyzer code → OpenMRS LIS parameter concept UUID in the LIS Mapping Assistant.',
                );
                continue;
            }

            const codedUuid = this.lookupCodedAnswerUuid(observation, translations);
            const value = this.valueText(observation.value);
            const numericValue = this.toNumber(value);
            const isEmpty = value === '' || observation.value == null;

            if (!codedUuid && numericValue == null && !isEmpty) {
                this.errors.push(
                    `No LIS coded answer UUID mapping found for analyzer result "${observation.code}=${value}".` +
                        ' Configure analyzer value → OpenMRS coded answer UUID, or ensure the result is numeric/text for this LIS parameter.',
                );
                continue;
            }

            const allocationUuid =
                this.lookupMappedAllocationUuid(observation, translations) ??
                allocationByConceptUuid.get(this.key(mappedConceptUuid)) ??
                null;

            if (!allocationUuid) {
                this.warnings.push(
                    `No current sample allocation UUID was found for LIS concept "${mappedConceptUuid}". ` +
                        'The delivery adapter will try to resolve it from /lab/samplelookup and /lab/allocationsbysample before sending.',
                );
            }

            const row: Record<string, any> = {
                concept: { uuid: mappedConceptUuid },
                testAllocation: allocationUuid ? { uuid: allocationUuid } : undefined,
                valueNumeric: codedUuid || numericValue == null ? null : numericValue,
                valueText: codedUuid || numericValue != null ? null : value || null,
                valueCoded: codedUuid ? { uuid: codedUuid } : null,
                abnormal: this.isAbnormal(observation),
                instrument: context.instrumentUuid ? { uuid: context.instrumentUuid } : undefined,
                status: {
                    category: context.statusCategory,
                    status: context.status,
                    remarks: context.remarks,
                },
                testedDate: context.testedDate,
                testedBy: context.testedBy,
            };

            this.rows.push(this.removeUndefined(row));
        }

        if (!observations.length) {
            this.warnings.push('No analyzer observations were found in the normalized source document.');
        }

        if (!this.rows.length) {
            this.errors.push(
                'No LIS multiple-results rows are ready. Configure LIS mappings for analyzer code → concept UUID and analyzer value → coded answer UUID where applicable.',
            );
        }

        this.warnings.push(
            'LIS preview uses the OpenMRS dynamic multiple-results builder. Generic mapping rules remain available for non-LIS targets and advanced payload shaping.',
        );

        return {
            payload: this.rows.length
                ? {
                      resourceType: 'OpenMRSLabMultipleResultsRequest',
                      endpoint: DEFAULT_LIS_ENDPOINT,
                      body: this.rows,
                      context: {
                          targetId: this.target?.id ?? null,
                          targetName: this.target?.name ?? null,
                          sample: context.sample,
                          order: context.order,
                          patient: context.patient,
                          instrument: context.instrument,
                          resultCount: this.rows.length,
                          observationCount: observations.length,
                          compositeExpandedCount: this.compositeExpandedCount,
                      },
                  }
                : null,
            warnings: this.unique(this.warnings),
            errors: this.unique(this.errors),
            summary: {
                ruleCount:
                    translations.conceptRuleCount +
                    translations.codedRuleCount +
                    translations.allocationRuleCount,
                appliedCount: this.rows.length,
                skippedCount: Math.max(0, observations.length - this.rows.length),
                translatedCount: this.rows.filter((row) => !!row?.valueCoded?.uuid).length,
                lisRows: this.rows.length,
                observationCount: observations.length,
                compositeExpandedCount: this.compositeExpandedCount,
            },
        };
    }

    private readLisTranslations(): TranslationIndex {
        const db = getDb();
        const targetType = String(this.targetType ?? 'LIS').trim() || 'LIS';
        const candidateTargetTypes = Array.from(new Set([targetType, 'LIS', 'OPENMRS']));
        const placeholders = candidateTargetTypes.map(() => '?').join(', ');

        const rules = db
            .prepare(
                `
                    SELECT *
                    FROM target_mappings
                    WHERE enabled = 1 AND target_type IN (${placeholders})
                    ORDER BY created_at ASC
                `,
            )
            .all(...candidateTargetTypes) as MappingRuleRow[];

        const enabledRuleIds = new Set(rules.map((rule) => rule.id));
        const translations = db
            .prepare(
                `
                    SELECT *
                    FROM target_mapping_value_translations
                    WHERE enabled = 1
                `,
            )
            .all() as TranslationRow[];

        const rowsByRuleId = new Map<string, TranslationRow[]>();
        for (const row of translations) {
            if (!enabledRuleIds.has(row.mapping_rule_id)) continue;
            const bucket = rowsByRuleId.get(row.mapping_rule_id) ?? [];
            bucket.push(row);
            rowsByRuleId.set(row.mapping_rule_id, bucket);
        }

        const index: TranslationIndex = {
            conceptUuidByCode: new Map<string, string>(),
            allocationUuidByCode: new Map<string, string>(),
            codedUuidByResult: new Map<string, string>(),
            directValuesByDestination: new Map<string, any>(),
            conceptRuleCount: 0,
            codedRuleCount: 0,
            allocationRuleCount: 0,
        };

        for (const rule of rules) {
            const destination = String(rule.destination_field ?? '').trim();
            const destinationKey = destination.toLowerCase();
            const rows = rowsByRuleId.get(rule.id) ?? [];

            if (rule.transform_kind === 'constant') {
                index.directValuesByDestination.set(destinationKey, this.parseTypedConstant(rule.constant_value ?? null));
            }

            if (this.isConceptDestination(destinationKey)) {
                index.conceptRuleCount += 1;
                this.addTranslationRows(index.conceptUuidByCode, rows, 'code');
                continue;
            }

            if (this.isAllocationDestination(destinationKey)) {
                index.allocationRuleCount += 1;
                this.addTranslationRows(index.allocationUuidByCode, rows, 'code');
                continue;
            }

            if (this.isCodedAnswerDestination(destinationKey)) {
                index.codedRuleCount += 1;
                this.addTranslationRows(index.codedUuidByResult, rows, 'result');
            }
        }

        return index;
    }

    private addTranslationRows(map: Map<string, string>, rows: TranslationRow[], mode: 'code' | 'result') {
        for (const row of rows) {
            const source = String(row.source_value ?? '').trim();
            const destinationUuid = this.extractUuid(row.destination_value);
            if (!source || !destinationUuid) continue;

            const keys = mode === 'result' ? this.resultKeyAliases(source) : this.codeAliases(source);
            for (const key of keys) map.set(key, destinationUuid);
        }
    }

    private extractAnalyzerObservations(source: any): AnalyzerObservation[] {
        const rawObservations: AnalyzerObservation[] = [];
        const add = (candidate: any, parentCode?: string | null) => {
            const observation = this.toObservation(candidate, parentCode);
            if (!observation) return;

            const expanded = this.expandCompositeObservation(observation);
            if (expanded.length) {
                this.compositeExpandedCount += expanded.length;
                for (const child of expanded) rawObservations.push(child);
                return;
            }

            rawObservations.push(observation);
        };

        const knownCollections = [
            source?.raw?.observations,
            source?.raw?.obx,
            source?.raw?.results,
            source?.raw?.resultItems,
            source?.raw?.tests,
            source?.observations,
            source?.results,
            source?.normalized?.observations,
            source?.normalized?.results,
        ];

        for (const collection of knownCollections) {
            if (Array.isArray(collection)) {
                for (const item of collection) add(item);
            }
        }

        add({
            code: source?.result?.code ?? source?.normalized?.testCode ?? source?.raw?.testCode,
            display: source?.result?.name ?? source?.normalized?.testName ?? source?.raw?.testName,
            value: source?.result?.value ?? source?.normalized?.value ?? source?.raw?.value,
            units: source?.result?.units ?? source?.raw?.units,
            abnormalFlag: source?.result?.abnormalFlag ?? source?.raw?.abnormalFlag,
        });

        return this.dedupeObservations(rawObservations);
    }

    private toObservation(candidate: any, parentCode?: string | null): AnalyzerObservation | null {
        if (candidate == null) return null;
        if (typeof candidate === 'string') {
            const single = this.parseKeyValue(candidate);
            if (!single) return null;
            return { code: single.code, value: single.value, parentCode: parentCode ?? null, source: candidate };
        }
        if (typeof candidate !== 'object') return null;

        const code = this.firstText(
            candidate.code,
            candidate.analyzerCode,
            candidate.testCode,
            candidate.test_code,
            candidate.identifier,
            candidate.obxCode,
            candidate.observationCode,
            candidate.loinc,
            candidate.conceptCode,
            candidate.concept?.code,
            candidate.concept?.display,
            candidate.test?.code,
            candidate.name,
        );

        const value = this.firstExisting(
            candidate.value,
            candidate.result,
            candidate.resultValue,
            candidate.observationValue,
            candidate.valueCoded?.display,
            candidate.valueCoded?.name,
            candidate.valueText,
            candidate.valueNumeric,
            candidate.rawValue,
        );

        if (!code && typeof value === 'string') {
            const single = this.parseKeyValue(value);
            if (single) {
                return {
                    code: single.code,
                    value: single.value,
                    display: candidate.display ?? candidate.name ?? null,
                    parentCode: parentCode ?? null,
                    source: candidate,
                };
            }
        }

        if (!code || value === undefined || value === null) return null;
        return {
            code,
            value,
            display: candidate.display ?? candidate.name ?? candidate.testName ?? null,
            parentCode: parentCode ?? null,
            source: candidate,
        };
    }

    private expandCompositeObservation(observation: AnalyzerObservation): AnalyzerObservation[] {
        if (typeof observation.value !== 'string') return [];
        const pieces = observation.value
            .split(';')
            .map((piece) => piece.trim())
            .filter(Boolean)
            .map((piece) => this.parseKeyValue(piece))
            .filter((piece): piece is { code: string; value: string } => !!piece);

        if (pieces.length < 2) return [];
        return pieces.map((piece) => ({
            code: piece.code,
            value: piece.value,
            parentCode: observation.code,
            source: observation.source,
        }));
    }

    private parseKeyValue(raw: string): { code: string; value: string } | null {
        const text = String(raw ?? '').trim();
        const index = text.indexOf('=');
        if (index <= 0 || index === text.length - 1) return null;
        const code = text.slice(0, index).trim();
        const value = text.slice(index + 1).trim();
        if (!code || !value) return null;
        return { code, value };
    }

    private lookupConceptUuid(observation: AnalyzerObservation, translations: TranslationIndex): string | null {
        for (const alias of this.observationCodeAliases(observation)) {
            const uuid = translations.conceptUuidByCode.get(alias);
            if (uuid) return uuid;
        }
        return null;
    }

    private lookupMappedAllocationUuid(observation: AnalyzerObservation, translations: TranslationIndex): string | null {
        for (const alias of this.observationCodeAliases(observation)) {
            const uuid = translations.allocationUuidByCode.get(alias);
            if (uuid) return uuid;
        }
        return null;
    }

    private lookupCodedAnswerUuid(observation: AnalyzerObservation, translations: TranslationIndex): string | null {
        const value = this.valueText(observation.value);
        if (!value) return null;

        const keys = [
            ...this.resultKeyAliases(`${observation.code}=${value}`),
            ...(observation.parentCode ? this.resultKeyAliases(`${observation.parentCode}=${value}`) : []),
            ...this.resultKeyAliases(value),
        ];

        for (const key of keys) {
            const uuid = translations.codedUuidByResult.get(key);
            if (uuid) return uuid;
        }
        return null;
    }

    private observationCodeAliases(observation: AnalyzerObservation): string[] {
        return this.unique([
            ...this.codeAliases(observation.code),
            ...(observation.display ? this.codeAliases(observation.display) : []),
        ]);
    }

    private codeAliases(raw: any): string[] {
        const text = String(raw ?? '').trim();
        if (!text) return [];
        const upper = text.toUpperCase();
        const withoutPrefix = upper.includes(':') ? upper.split(':').pop()!.trim() : upper;
        const relaxed = withoutPrefix.replace(/[^A-Z0-9]/g, '');
        const hrhpv = relaxed === 'HRHPV' || relaxed === 'HRHPVRESULT' ? 'HRHPV' : null;
        return this.unique([upper, withoutPrefix, relaxed, hrhpv].filter(Boolean) as string[]);
    }

    private resultKeyAliases(raw: any): string[] {
        const text = String(raw ?? '').trim();
        if (!text) return [];
        const parsed = this.parseKeyValue(text);
        if (!parsed) return this.valueAliases(text);

        const valueAliases = this.valueAliases(parsed.value);
        const keys: string[] = [];
        for (const codeAlias of this.codeAliases(parsed.code)) {
            for (const valueAlias of valueAliases) {
                keys.push(`${codeAlias}=${valueAlias}`);
            }
        }
        return this.unique(keys);
    }

    private valueAliases(raw: any): string[] {
        const text = String(raw ?? '').trim();
        if (!text) return [];
        const upper = text.toUpperCase();
        const normalized = upper.replace(/\.+$/, '').trim();
        const aliases = [upper, normalized, upper.replace(/[^A-Z0-9]/g, '')];
        if (normalized === 'POSITIVE') aliases.push('POS');
        if (normalized === 'NEGATIVE') aliases.push('NEG');
        if (normalized === 'INVALID') aliases.push('INV');
        if (normalized === 'POS') aliases.push('POSITIVE');
        if (normalized === 'NEG') aliases.push('NEGATIVE');
        if (normalized === 'INV') aliases.push('INVALID');
        return this.unique(aliases.filter(Boolean));
    }

    private extractAllocationIndex(source: any): Map<string, string> {
        const allocationByConceptUuid = new Map<string, string>();
        const visit = (node: any, parent: any = null) => {
            if (!node) return;
            if (Array.isArray(node)) {
                for (const item of node) visit(item, parent);
                return;
            }
            if (typeof node !== 'object') return;

            const conceptUuid = this.firstText(
                node.concept?.uuid,
                node.parameter?.uuid,
                node.testParameter?.uuid,
                node.parameterConcept?.uuid,
                node.conceptUuid,
                node.parameterUuid,
            );
            const allocationUuid = this.firstText(
                node.testAllocation?.uuid,
                node.allocation?.uuid,
                node.uuid,
                parent?.testAllocation?.uuid,
                parent?.allocation?.uuid,
            );

            if (conceptUuid && allocationUuid) {
                allocationByConceptUuid.set(this.key(conceptUuid), allocationUuid);
            }

            for (const value of Object.values(node)) visit(value, node);
        };

        visit(source?.raw?.allocations);
        visit(source?.raw?.allocation);
        visit(source?.raw?.sampleAllocations);
        visit(source?.lis?.allocations);
        visit(source?.lis?.parameters);
        return allocationByConceptUuid;
    }

    private extractContext(source: any, directValues: Map<string, any>) {
        const raw = source?.raw ?? {};
        const lis = source?.lis ?? {};
        const sample = lis?.sample ?? source?.sample ?? raw?.sample ?? null;
        const order = lis?.order ?? source?.order ?? raw?.order ?? null;
        const patient = lis?.patient ?? source?.patient ?? raw?.patient ?? null;
        const instrument = lis?.instrument ?? raw?.instrument ?? null;

        return {
            sample,
            order,
            patient,
            instrument,
            instrumentUuid: this.firstText(
                directValues.get('lis.instrument.uuid'),
                directValues.get('instrument.uuid'),
                instrument?.uuid,
                raw?.instrumentUuid,
            ),
            testedBy: this.firstText(
                directValues.get('lis.testedby'),
                directValues.get('lis.testedby.uuid'),
                directValues.get('testedby'),
                raw?.testedBy,
                lis?.testedBy,
            ),
            testedDate: this.firstText(raw?.testedDate, lis?.testedDate, source?.result?.observedAt, source?.normalized?.observedAt),
            statusCategory: this.firstText(directValues.get('lis.status.category'), lis?.status?.category) ?? 'RESULT_REMARKS',
            status: this.firstText(directValues.get('lis.status.status'), lis?.status?.status) ?? 'REMARKS',
            remarks: this.firstText(directValues.get('lis.status.remarks'), lis?.defaultRemarks, raw?.remarks) ?? 'Machine interfaced result',
        };
    }

    private isConceptDestination(destination: string): boolean {
        return destination === 'lis.parameter.conceptuuid' ||
            destination === 'lis.concept.uuid' ||
            destination.endsWith('.conceptuuid') ||
            destination.endsWith('.concept.uuid');
    }

    private isAllocationDestination(destination: string): boolean {
        return destination === 'lis.parameter.allocationuuid' ||
            destination === 'lis.testallocation.uuid' ||
            destination.endsWith('.allocationuuid') ||
            destination.endsWith('.testallocation.uuid');
    }

    private isCodedAnswerDestination(destination: string): boolean {
        return destination === 'lis.valuecoded.uuid' ||
            destination === 'lis.value_coded.uuid' ||
            destination.endsWith('.valuecoded.uuid') ||
            destination.endsWith('.value_coded.uuid');
    }

    private extractUuid(value: any): string | null {
        if (value == null) return null;
        if (typeof value === 'object') {
            return UUID_RE.test(String(value.uuid ?? '')) ? String(value.uuid) : null;
        }
        const raw = String(value ?? '').trim();
        if (!raw) return null;
        if (UUID_RE.test(raw)) return raw;
        if ((raw.startsWith('{') && raw.endsWith('}')) || (raw.startsWith('[') && raw.endsWith(']'))) {
            try {
                const parsed = JSON.parse(raw);
                return this.extractUuid(parsed);
            } catch {
                return null;
            }
        }
        const match = raw.match(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i);
        return match?.[0] ?? null;
    }

    private parseTypedConstant(value: any): any {
        if (value == null) return null;
        if (typeof value !== 'string') return value;
        const raw = value.trim();
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

    private firstExisting(...values: any[]) {
        for (const value of values) {
            if (value !== undefined && value !== null) return value;
        }
        return undefined;
    }

    private firstText(...values: any[]): string | null {
        for (const value of values) {
            const text = String(value ?? '').trim();
            if (text) return text;
        }
        return null;
    }

    private valueText(value: any): string {
        if (value == null) return '';
        if (typeof value === 'number') return String(value);
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return String(value).trim();
    }

    private toNumber(value: string): number | null {
        if (!/^-?\d+(\.\d+)?$/.test(String(value ?? '').trim())) return null;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
    }

    private isAbnormal(observation: AnalyzerObservation): boolean {
        const flag = String(observation.source?.abnormalFlag ?? observation.source?.flag ?? '').trim().toUpperCase();
        return ['A', 'AA', 'H', 'HH', 'L', 'LL', 'ABNORMAL'].includes(flag);
    }

    private dedupeObservations(observations: AnalyzerObservation[]): AnalyzerObservation[] {
        const seen = new Set<string>();
        const uniqueRows: AnalyzerObservation[] = [];
        for (const observation of observations) {
            const key = `${this.key(observation.code)}|${this.valueText(observation.value)}|${this.key(observation.parentCode ?? '')}`;
            if (seen.has(key)) continue;
            seen.add(key);
            uniqueRows.push(observation);
        }
        return uniqueRows;
    }

    private removeUndefined<T extends Record<string, any>>(row: T): T {
        return Object.fromEntries(Object.entries(row).filter(([, value]) => value !== undefined)) as T;
    }

    private key(value: any): string {
        return String(value ?? '').trim().toUpperCase();
    }

    private unique<T>(values: T[]): T[] {
        return Array.from(new Set(values));
    }
}