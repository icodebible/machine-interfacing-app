// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';

// const nowIso = () => new Date().toISOString();

// export type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
// export type MappingTransformKind = 'direct' | 'constant' | 'lookup';

// export const SUPPORTED_TARGET_TYPES: MappingTargetType[] = [
//     'DHIS2',
//     'OPENMRS',
//     'LIS',
//     'CUSTOM_HTTP',
// ];

// const CANONICAL_SOURCE_PREFIXES = [
//     'meta.',
//     'normalized.',
//     'patient.',
//     'sample.',
//     'specimen.',
//     'order.',
//     'result.',
//     'source.',
//     'target.',
//     'raw.',
// ];

// const CONNECTOR_RULES: Record<
//     MappingTargetType,
//     {
//         allowedDestinationPrefixes: string[];
//         requiredDestinations: string[];
//         supportedTransforms: MappingTransformKind[];
//         helperText: string[];
//     }
// > = {
//     DHIS2: {
//         allowedDestinationPrefixes: ['events[', 'trackedEntities[', 'event.', 'tei.', 'enrollment.', 'attribute.'],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use indexed array paths like events[0].dataValues[0].value for DHIS2 event payloads.',
//             'Use trackedEntities[0].attributes[0].value and nested enrollment/event paths for tracker payloads.',
//             'Source paths come from the canonical source document, such as patient.id, result.value, or raw.<path>.',
//         ],
//     },
//     OPENMRS: {
//         allowedDestinationPrefixes: ['patient.', 'encounter.', 'visit.', 'obs.', 'identifier.', 'payload.'],
//         requiredDestinations: ['patient.identifier', 'encounter.encounterDatetime'],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use encounter.* and obs.* destinations for clinical payloads.',
//             'Keep patient.* destinations focused on identifier and demographic keys.',
//         ],
//     },
//     LIS: {
//         allowedDestinationPrefixes: ['patient.', 'order.', 'specimen.', 'result.', 'instrument.', 'payload.'],
//         requiredDestinations: ['result.testCode', 'result.value'],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Model LIS payloads around specimen, order, and result groupings.',
//             'Keep test code and result value explicitly mapped.',
//         ],
//     },
//     CUSTOM_HTTP: {
//         allowedDestinationPrefixes: [],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant'],
//         helperText: [
//             'Custom HTTP accepts free-form destination paths.',
//             'Prefer direct and constant rules unless you have implemented lookup semantics intentionally.',
//         ],
//     },
// };

// export class MappingsService {
//     list() {
//         const db = getDb();
//         return db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     ORDER BY target_type ASC, source_field ASC
//                 `,
//             )
//             .all();
//     }

//     create(dto: any) {
//         const db = getDb();
//         const id = randomUUID();
//         const ts = nowIso();

//         db.prepare(
//             `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             ts,
//             ts,
//         );

//         return { id };
//     }

//     update(id: string, dto: any) {
//         const db = getDb();

//         db.prepare(
//             `
//                 UPDATE target_mappings
//                 SET target_type = ?,
//                     source_field = ?,
//                     destination_field = ?,
//                     transform_kind = ?,
//                     constant_value = ?,
//                     enabled = ?,
//                     updated_at = ?
//                 WHERE id = ?
//             `,
//         ).run(
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             nowIso(),
//             id,
//         );

//         return true;
//     }

//     delete(id: string) {
//         const db = getDb();
//         db.prepare(`DELETE FROM target_mappings WHERE id = ?`).run(id);
//         return true;
//     }

//     validate(targetType: string) {
//         if (!SUPPORTED_TARGET_TYPES.includes(targetType as MappingTargetType)) {
//             return {
//                 ok: false,
//                 message: `Unsupported target type: ${targetType}`,
//                 targetType,
//                 errors: [`Unsupported target type: ${targetType}`],
//                 warnings: [],
//                 recommendations: [],
//                 summary: {
//                     enabledRules: 0,
//                     duplicateDestinations: 0,
//                     unsupportedKinds: 0,
//                 },
//             };
//         }

//         const typedTarget = targetType as MappingTargetType;
//         const connectorRules = CONNECTOR_RULES[typedTarget];

//         const db = getDb();
//         const rows = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     WHERE target_type = ? AND enabled = 1
//                     ORDER BY created_at ASC
//                 `,
//             )
//             .all(targetType) as any[];

//         const errors: string[] = [];
//         const warnings: string[] = [];
//         const recommendations: string[] = [...connectorRules.helperText];

//         if (rows.length === 0) {
//             warnings.push(`No enabled mappings found for ${targetType}.`);
//         }

//         const duplicateDest = new Set<string>();
//         const seenDest = new Set<string>();
//         let unsupportedKinds = 0;

//         for (const row of rows) {
//             const sourceField = String(row.source_field ?? '').trim();
//             const destinationField = String(row.destination_field ?? '').trim();
//             const transformKind = String(row.transform_kind ?? 'direct').trim() as MappingTransformKind;
//             const constantValue = row.constant_value;

//             if (!destinationField) {
//                 errors.push(`Rule ${row.id}: destination field is required.`);
//             }

//             if (transformKind === 'constant') {
//                 if (!String(constantValue ?? '').trim()) {
//                     errors.push(`Rule ${row.id}: constant mappings require a constant value.`);
//                 }
//             } else if (!sourceField) {
//                 errors.push(`Rule ${row.id}: source field is required for ${transformKind} mappings.`);
//             }

//             if (!connectorRules.supportedTransforms.includes(transformKind)) {
//                 unsupportedKinds += 1;
//                 errors.push(
//                     `Rule ${row.id}: transform kind "${transformKind}" is not supported for ${targetType}.`,
//                 );
//             }

//             if (
//                 transformKind !== 'constant' &&
//                 sourceField &&
//                 !CANONICAL_SOURCE_PREFIXES.some((prefix) => sourceField.startsWith(prefix))
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: source path "${sourceField}" is outside the canonical source document prefixes (${CANONICAL_SOURCE_PREFIXES.join(', ')}).`,
//                 );
//             }

//             if (seenDest.has(destinationField)) {
//                 duplicateDest.add(destinationField);
//             }
//             if (destinationField) {
//                 seenDest.add(destinationField);
//             }

//             if (
//                 destinationField &&
//                 connectorRules.allowedDestinationPrefixes.length > 0 &&
//                 !connectorRules.allowedDestinationPrefixes.some((prefix) => destinationField.startsWith(prefix))
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: destination "${destinationField}" does not match the usual ${targetType} path prefixes (${connectorRules.allowedDestinationPrefixes.join(', ')}).`,
//                 );
//             }
//         }

//         if (duplicateDest.size > 0) {
//             errors.push(`Duplicate destination fields: ${Array.from(duplicateDest).sort().join(', ')}`);
//         }

//         const mappedDestinations = new Set(
//             rows.map((row) => String(row.destination_field ?? '').trim()).filter(Boolean),
//         );

//         for (const requiredDestination of connectorRules.requiredDestinations) {
//             if (!mappedDestinations.has(requiredDestination)) {
//                 warnings.push(
//                     `Recommended destination "${requiredDestination}" is not currently mapped for ${targetType}.`,
//                 );
//             }
//         }

//         return {
//             ok: errors.length === 0,
//             message:
//                 errors.length === 0
//                     ? warnings.length === 0
//                         ? 'Mappings look valid.'
//                         : 'Mappings are usable but have warnings.'
//                     : 'Mappings need review.',
//             targetType,
//             errors,
//             warnings,
//             recommendations,
//             summary: {
//                 enabledRules: rows.length,
//                 duplicateDestinations: duplicateDest.size,
//                 unsupportedKinds,
//             },
//         };
//     }
// }

// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';

// const nowIso = () => new Date().toISOString();

// export type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
// export type MappingTransformKind = 'direct' | 'constant' | 'lookup';

// export const SUPPORTED_TARGET_TYPES: MappingTargetType[] = [
//     'DHIS2',
//     'OPENMRS',
//     'LIS',
//     'CUSTOM_HTTP',
// ];

// const CANONICAL_SOURCE_PREFIXES = [
//     'meta.',
//     'normalized.',
//     'patient.',
//     'sample.',
//     'specimen.',
//     'order.',
//     'result.',
//     'source.',
//     'target.',
//     'lis.',
//     'payload.',
//     'raw.',
// ];

// const CONNECTOR_RULES: Record<
//     MappingTargetType,
//     {
//         allowedDestinationPrefixes: string[];
//         requiredDestinations: string[];
//         supportedTransforms: MappingTransformKind[];
//         helperText: string[];
//     }
// > = {
//     DHIS2: {
//         allowedDestinationPrefixes: [
//             'events[',
//             'trackedEntities[',
//             'event.',
//             'tei.',
//             'enrollment.',
//             'attribute.',
//         ],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use indexed array paths like events[0].dataValues[0].value for DHIS2 event payloads.',
//             'Use trackedEntities[0].attributes[0].value and nested enrollment/event paths for tracker payloads.',
//             'Source paths come from the canonical source document, such as patient.id, result.value, or raw.<path>.',
//         ],
//     },
//     OPENMRS: {
//         allowedDestinationPrefixes: [
//             'patient.',
//             'encounter.',
//             'visit.',
//             'obs.',
//             'identifier.',
//             'payload.',
//         ],
//         requiredDestinations: ['patient.identifier', 'encounter.encounterDatetime'],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use encounter.* and obs.* destinations for clinical payloads.',
//             'Keep patient.* destinations focused on identifier and demographic keys.',
//         ],
//     },
//     LIS: {
//         allowedDestinationPrefixes: [
//             'patient.',
//             'order.',
//             'specimen.',
//             'result.',
//             'instrument.',
//             'lis.',
//             'payload.',
//             'body',
//             'body[',
//             'endpoint',
//             'method',
//         ],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Model LIS payloads around specimen, order, result groupings, and payload.body rows for /lab/multipleresults.',
//             'For OpenMRS LIS multiple results, the body should be an array of rows with concept, testAllocation, value*, abnormal, instrument, status, testedDate, and testedBy.',
//         ],
//     },
//     CUSTOM_HTTP: {
//         allowedDestinationPrefixes: [],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant'],
//         helperText: [
//             'Custom HTTP accepts free-form destination paths.',
//             'Prefer direct and constant rules unless you have implemented lookup semantics intentionally.',
//         ],
//     },
// };

// export class MappingsService {
//     list() {
//         const db = getDb();
//         return db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     ORDER BY target_type ASC, source_field ASC
//                 `,
//             )
//             .all();
//     }

//     create(dto: any) {
//         const db = getDb();
//         const id = randomUUID();
//         const ts = nowIso();

//         db.prepare(
//             `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             ts,
//             ts,
//         );

//         return { id };
//     }

//     update(id: string, dto: any) {
//         const db = getDb();

//         db.prepare(
//             `
//                 UPDATE target_mappings
//                 SET target_type = ?,
//                     source_field = ?,
//                     destination_field = ?,
//                     transform_kind = ?,
//                     constant_value = ?,
//                     enabled = ?,
//                     updated_at = ?
//                 WHERE id = ?
//             `,
//         ).run(
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             nowIso(),
//             id,
//         );

//         return true;
//     }

//     delete(id: string) {
//         const db = getDb();
//         db.prepare(`DELETE FROM target_mappings WHERE id = ?`).run(id);
//         return true;
//     }

//     validate(targetType: string) {
//         if (!SUPPORTED_TARGET_TYPES.includes(targetType as MappingTargetType)) {
//             return {
//                 ok: false,
//                 message: `Unsupported target type: ${targetType}`,
//                 targetType,
//                 errors: [`Unsupported target type: ${targetType}`],
//                 warnings: [],
//                 recommendations: [],
//                 summary: {
//                     enabledRules: 0,
//                     duplicateDestinations: 0,
//                     unsupportedKinds: 0,
//                 },
//             };
//         }

//         const typedTarget = targetType as MappingTargetType;
//         const connectorRules = CONNECTOR_RULES[typedTarget];

//         const db = getDb();
//         const rows = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     WHERE target_type = ? AND enabled = 1
//                     ORDER BY created_at ASC
//                 `,
//             )
//             .all(targetType) as any[];

//         const errors: string[] = [];
//         const warnings: string[] = [];
//         const recommendations: string[] = [...connectorRules.helperText];

//         if (rows.length === 0) {
//             warnings.push(`No enabled mappings found for ${targetType}.`);
//         }

//         const duplicateDest = new Set<string>();
//         const seenDest = new Set<string>();
//         let unsupportedKinds = 0;

//         for (const row of rows) {
//             const sourceField = String(row.source_field ?? '').trim();
//             const destinationField = String(row.destination_field ?? '').trim();
//             const transformKind = String(row.transform_kind ?? 'direct').trim() as MappingTransformKind;
//             const constantValue = row.constant_value;

//             if (!destinationField) {
//                 errors.push(`Rule ${row.id}: destination field is required.`);
//             }

//             if (transformKind === 'constant') {
//                 if (!String(constantValue ?? '').trim()) {
//                     errors.push(`Rule ${row.id}: constant mappings require a constant value.`);
//                 }
//             } else if (!sourceField) {
//                 errors.push(`Rule ${row.id}: source field is required for ${transformKind} mappings.`);
//             }

//             if (!connectorRules.supportedTransforms.includes(transformKind)) {
//                 unsupportedKinds += 1;
//                 errors.push(
//                     `Rule ${row.id}: transform kind "${transformKind}" is not supported for ${targetType}.`,
//                 );
//             }

//             if (
//                 transformKind !== 'constant' &&
//                 sourceField &&
//                 !CANONICAL_SOURCE_PREFIXES.some((prefix) => sourceField.startsWith(prefix))
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: source path "${sourceField}" is outside the canonical source document prefixes (${CANONICAL_SOURCE_PREFIXES.join(', ')}).`,
//                 );
//             }

//             if (seenDest.has(destinationField)) {
//                 duplicateDest.add(destinationField);
//             }
//             if (destinationField) {
//                 seenDest.add(destinationField);
//             }

//             if (
//                 destinationField &&
//                 connectorRules.allowedDestinationPrefixes.length > 0 &&
//                 !connectorRules.allowedDestinationPrefixes.some((prefix) =>
//                     destinationField.startsWith(prefix),
//                 )
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: destination "${destinationField}" does not match the usual ${targetType} path prefixes (${connectorRules.allowedDestinationPrefixes.join(', ')}).`,
//                 );
//             }
//         }

//         if (duplicateDest.size > 0) {
//             errors.push(`Duplicate destination fields: ${Array.from(duplicateDest).sort().join(', ')}`);
//         }

//         const mappedDestinations = new Set(
//             rows.map((row) => String(row.destination_field ?? '').trim()).filter(Boolean),
//         );

//         for (const requiredDestination of connectorRules.requiredDestinations) {
//             if (!mappedDestinations.has(requiredDestination)) {
//                 warnings.push(
//                     `Recommended destination "${requiredDestination}" is not currently mapped for ${targetType}.`,
//                 );
//             }
//         }

//         return {
//             ok: errors.length === 0,
//             message:
//                 errors.length === 0
//                     ? warnings.length === 0
//                         ? 'Mappings look valid.'
//                         : 'Mappings are usable but have warnings.'
//                     : 'Mappings need review.',
//             targetType,
//             errors,
//             warnings,
//             recommendations,
//             summary: {
//                 enabledRules: rows.length,
//                 duplicateDestinations: duplicateDest.size,
//                 unsupportedKinds,
//             },
//         };
//     }
// }

// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';

// const nowIso = () => new Date().toISOString();

// export type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
// export type MappingTransformKind = 'direct' | 'constant' | 'lookup';

// export const SUPPORTED_TARGET_TYPES: MappingTargetType[] = [
//     'DHIS2',
//     'OPENMRS',
//     'LIS',
//     'CUSTOM_HTTP',
// ];

// const CANONICAL_SOURCE_PREFIXES = [
//     'meta.',
//     'normalized.',
//     'patient.',
//     'sample.',
//     'specimen.',
//     'order.',
//     'result.',
//     'source.',
//     'target.',
//     'raw.',
// ];

// const CONNECTOR_RULES: Record<
//     MappingTargetType,
//     {
//         allowedDestinationPrefixes: string[];
//         requiredDestinations: string[];
//         supportedTransforms: MappingTransformKind[];
//         helperText: string[];
//     }
// > = {
//     DHIS2: {
//         allowedDestinationPrefixes: ['events[', 'trackedEntities[', 'event.', 'tei.', 'enrollment.', 'attribute.'],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use indexed array paths like events[0].dataValues[0].value for DHIS2 event payloads.',
//             'Use trackedEntities[0].attributes[0].value and nested enrollment/event paths for tracker payloads.',
//             'Source paths come from the canonical source document, such as patient.id, result.value, or raw.<path>.',
//         ],
//     },
//     OPENMRS: {
//         allowedDestinationPrefixes: ['patient.', 'encounter.', 'visit.', 'obs.', 'identifier.', 'payload.'],
//         requiredDestinations: ['patient.identifier', 'encounter.encounterDatetime'],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use encounter.* and obs.* destinations for clinical payloads.',
//             'Keep patient.* destinations focused on identifier and demographic keys.',
//         ],
//     },
//     LIS: {
//         allowedDestinationPrefixes: [
//             'patient.',
//             'order.',
//             'sample.',
//             'specimen.',
//             'result.',
//             'instrument.',
//             'payload.',
//             'body[',
//             'lis.',
//             'status.',
//             'testedBy',
//             'endpoint',
//         ],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'For OpenMRS LIS multiple results, configure translations rather than hard-coding UUIDs in code.',
//             'Use lookup rules with destinations lis.parameter.conceptUuid and lis.parameter.allocationUuid to map analyzer result codes such as HPV16 to OpenMRS concept and testAllocation UUIDs.',
//             'Use lookup rule lis.valueCoded.uuid to map analyzer values such as HPV16=POS, HPV18=NEG, or INVALID to OpenMRS coded answer UUIDs.',
//             'Use constant rules lis.defaults.instrumentUuid, lis.defaults.testedBy, lis.defaults.status.category, lis.defaults.status.status, and lis.defaults.status.remarks for common LIS row defaults.',
//         ],
//     },
//     CUSTOM_HTTP: {
//         allowedDestinationPrefixes: [],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant'],
//         helperText: [
//             'Custom HTTP accepts free-form destination paths.',
//             'Prefer direct and constant rules unless you have implemented lookup semantics intentionally.',
//         ],
//     },
// };

// export class MappingsService {
//     list() {
//         const db = getDb();
//         return db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     ORDER BY target_type ASC, source_field ASC
//                 `,
//             )
//             .all();
//     }

//     create(dto: any) {
//         const db = getDb();
//         const id = randomUUID();
//         const ts = nowIso();

//         db.prepare(
//             `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             ts,
//             ts,
//         );

//         return { id };
//     }

//     update(id: string, dto: any) {
//         const db = getDb();

//         db.prepare(
//             `
//                 UPDATE target_mappings
//                 SET target_type = ?,
//                     source_field = ?,
//                     destination_field = ?,
//                     transform_kind = ?,
//                     constant_value = ?,
//                     enabled = ?,
//                     updated_at = ?
//                 WHERE id = ?
//             `,
//         ).run(
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             nowIso(),
//             id,
//         );

//         return true;
//     }

//     delete(id: string) {
//         const db = getDb();
//         db.prepare(`DELETE FROM target_mappings WHERE id = ?`).run(id);
//         return true;
//     }

//     validate(targetType: string) {
//         if (!SUPPORTED_TARGET_TYPES.includes(targetType as MappingTargetType)) {
//             return {
//                 ok: false,
//                 message: `Unsupported target type: ${targetType}`,
//                 targetType,
//                 errors: [`Unsupported target type: ${targetType}`],
//                 warnings: [],
//                 recommendations: [],
//                 summary: {
//                     enabledRules: 0,
//                     duplicateDestinations: 0,
//                     unsupportedKinds: 0,
//                 },
//             };
//         }

//         const typedTarget = targetType as MappingTargetType;
//         const connectorRules = CONNECTOR_RULES[typedTarget];

//         const db = getDb();
//         const rows = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     WHERE target_type = ? AND enabled = 1
//                     ORDER BY created_at ASC
//                 `,
//             )
//             .all(targetType) as any[];

//         const errors: string[] = [];
//         const warnings: string[] = [];
//         const recommendations: string[] = [...connectorRules.helperText];

//         if (rows.length === 0) {
//             warnings.push(`No enabled mappings found for ${targetType}.`);
//         }

//         const duplicateDest = new Set<string>();
//         const seenDest = new Set<string>();
//         let unsupportedKinds = 0;

//         for (const row of rows) {
//             const sourceField = String(row.source_field ?? '').trim();
//             const destinationField = String(row.destination_field ?? '').trim();
//             const transformKind = String(row.transform_kind ?? 'direct').trim() as MappingTransformKind;
//             const constantValue = row.constant_value;

//             if (!destinationField) {
//                 errors.push(`Rule ${row.id}: destination field is required.`);
//             }

//             if (transformKind === 'constant') {
//                 if (!String(constantValue ?? '').trim()) {
//                     errors.push(`Rule ${row.id}: constant mappings require a constant value.`);
//                 }
//             } else if (!sourceField) {
//                 errors.push(`Rule ${row.id}: source field is required for ${transformKind} mappings.`);
//             }

//             if (!connectorRules.supportedTransforms.includes(transformKind)) {
//                 unsupportedKinds += 1;
//                 errors.push(
//                     `Rule ${row.id}: transform kind "${transformKind}" is not supported for ${targetType}.`,
//                 );
//             }

//             if (
//                 transformKind !== 'constant' &&
//                 sourceField &&
//                 !CANONICAL_SOURCE_PREFIXES.some((prefix) => sourceField.startsWith(prefix))
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: source path "${sourceField}" is outside the canonical source document prefixes (${CANONICAL_SOURCE_PREFIXES.join(', ')}).`,
//                 );
//             }

//             if (seenDest.has(destinationField)) {
//                 duplicateDest.add(destinationField);
//             }
//             if (destinationField) {
//                 seenDest.add(destinationField);
//             }

//             if (
//                 destinationField &&
//                 connectorRules.allowedDestinationPrefixes.length > 0 &&
//                 !connectorRules.allowedDestinationPrefixes.some((prefix) => destinationField.startsWith(prefix))
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: destination "${destinationField}" does not match the usual ${targetType} path prefixes (${connectorRules.allowedDestinationPrefixes.join(', ')}).`,
//                 );
//             }
//         }

//         if (duplicateDest.size > 0) {
//             errors.push(`Duplicate destination fields: ${Array.from(duplicateDest).sort().join(', ')}`);
//         }

//         const mappedDestinations = new Set(
//             rows.map((row) => String(row.destination_field ?? '').trim()).filter(Boolean),
//         );

//         for (const requiredDestination of connectorRules.requiredDestinations) {
//             if (!mappedDestinations.has(requiredDestination)) {
//                 warnings.push(
//                     `Recommended destination "${requiredDestination}" is not currently mapped for ${targetType}.`,
//                 );
//             }
//         }

//         return {
//             ok: errors.length === 0,
//             message:
//                 errors.length === 0
//                     ? warnings.length === 0
//                         ? 'Mappings look valid.'
//                         : 'Mappings are usable but have warnings.'
//                     : 'Mappings need review.',
//             targetType,
//             errors,
//             warnings,
//             recommendations,
//             summary: {
//                 enabledRules: rows.length,
//                 duplicateDestinations: duplicateDest.size,
//                 unsupportedKinds,
//             },
//         };
//     }
// }

// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
// import { OpenMrsLisMetadataRequest, OpenMrsLisMetadataService } from './openmrs-lis-metadata.service';
// // import { OpenMrsLisMetadataRequest, OpenMrsLisMetadataService } from './openmrs-lis-metadata.service';

// const nowIso = () => new Date().toISOString();

// export type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
// export type MappingTransformKind = 'direct' | 'constant' | 'lookup';

// export const SUPPORTED_TARGET_TYPES: MappingTargetType[] = [
//     'DHIS2',
//     'OPENMRS',
//     'LIS',
//     'CUSTOM_HTTP',
// ];

// const CANONICAL_SOURCE_PREFIXES = [
//     'meta.',
//     'normalized.',
//     'patient.',
//     'sample.',
//     'specimen.',
//     'order.',
//     'result.',
//     'source.',
//     'target.',
//     'raw.',
// ];

// const CONNECTOR_RULES: Record<
//     MappingTargetType,
//     {
//         allowedDestinationPrefixes: string[];
//         requiredDestinations: string[];
//         supportedTransforms: MappingTransformKind[];
//         helperText: string[];
//     }
// > = {
//     DHIS2: {
//         allowedDestinationPrefixes: ['events[', 'trackedEntities[', 'event.', 'tei.', 'enrollment.', 'attribute.'],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use indexed array paths like events[0].dataValues[0].value for DHIS2 event payloads.',
//             'Use trackedEntities[0].attributes[0].value and nested enrollment/event paths for tracker payloads.',
//             'Source paths come from the canonical source document, such as patient.id, result.value, or raw.<path>.',
//         ],
//     },
//     OPENMRS: {
//         allowedDestinationPrefixes: ['patient.', 'encounter.', 'visit.', 'obs.', 'identifier.', 'payload.'],
//         requiredDestinations: ['patient.identifier', 'encounter.encounterDatetime'],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use encounter.* and obs.* destinations for clinical payloads.',
//             'Keep patient.* destinations focused on identifier and demographic keys.',
//         ],
//     },
//     LIS: {
//         allowedDestinationPrefixes: ['patient.', 'order.', 'specimen.', 'result.', 'instrument.', 'payload.', 'lis.', 'body[]', 'endpoint', 'status.', 'testedBy'],
//         requiredDestinations: ['lis.parameter.conceptUuid', 'lis.parameter.allocationUuid', 'lis.valueCoded.uuid'],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'For OpenMRS-backed LIS delivery, configure analyzer code → concept UUID and analyzer code → allocation UUID.',
//             'For coded test parameters, configure analyzer result values such as HPV16=POS → OpenMRS coded answer UUID.',
//             'Constant LIS defaults such as endpoint, instrument UUID, testedBy, and result remarks are supported through lis.* destinations.',
//         ],
//     },
//     CUSTOM_HTTP: {
//         allowedDestinationPrefixes: [],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant'],
//         helperText: [
//             'Custom HTTP accepts free-form destination paths.',
//             'Prefer direct and constant rules unless you have implemented lookup semantics intentionally.',
//         ],
//     },
// };

// export type OpenMrsLisMappingSeedInput = {
//     endpoint?: string | null;
//     instrumentUuid?: string | null;
//     testedBy?: string | null;
//     statusCategory?: string | null;
//     statusStatus?: string | null;
//     statusRemarks?: string | null;
//     parameters: Array<{
//         analyzerCode: string;
//         conceptUuid?: string | null;
//         allocationUuid?: string | null;
//         datatype?: string | null;
//         codedAnswers?: Array<{ sourceValue: string; destinationUuid: string; note?: string | null }>;
//     }>;
// };

// export class MappingsService {
//     private readonly openMrsLisMetadata = new OpenMrsLisMetadataService();
//     list() {
//         const db = getDb();
//         return db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     ORDER BY target_type ASC, source_field ASC
//                 `,
//             )
//             .all();
//     }

//     create(dto: any) {
//         const db = getDb();
//         const id = randomUUID();
//         const ts = nowIso();

//         db.prepare(
//             `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             ts,
//             ts,
//         );

//         return { id };
//     }

//     update(id: string, dto: any) {
//         const db = getDb();

//         db.prepare(
//             `
//                 UPDATE target_mappings
//                 SET target_type = ?,
//                     source_field = ?,
//                     destination_field = ?,
//                     transform_kind = ?,
//                     constant_value = ?,
//                     enabled = ?,
//                     updated_at = ?
//                 WHERE id = ?
//             `,
//         ).run(
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             nowIso(),
//             id,
//         );

//         return true;
//     }

//     delete(id: string) {
//         const db = getDb();
//         db.prepare(`DELETE FROM target_mappings WHERE id = ?`).run(id);
//         return true;
//     }

//     discoverOpenMrsLisMetadata(input: OpenMrsLisMetadataRequest) {
//         return this.openMrsLisMetadata.discover(input);
//     }

//     seedOpenMrsLisMappings(input: OpenMrsLisMappingSeedInput) {
//         const db = getDb();
//         const ts = nowIso();
//         const summary = {
//             rulesCreated: 0,
//             rulesUpdated: 0,
//             translationsCreated: 0,
//             translationsUpdated: 0,
//             skippedParameters: 0,
//         };

//         const inTransaction = db.transaction(() => {
//             const constants = [
//                 { destination: 'lis.endpoint', value: input.endpoint || '/openmrs/ws/rest/v1/lab/multipleresults' },
//                 { destination: 'lis.defaults.instrumentUuid', value: input.instrumentUuid ?? null },
//                 { destination: 'lis.defaults.testedBy', value: input.testedBy ?? null },
//                 { destination: 'lis.defaults.status.category', value: input.statusCategory || 'RESULT_REMARKS' },
//                 { destination: 'lis.defaults.status.status', value: input.statusStatus || 'REMARKS' },
//                 {
//                     destination: 'lis.defaults.status.remarks',
//                     value: input.statusRemarks || 'Imported from analyzer via machine interfacing',
//                 },
//             ];

//             for (const item of constants) {
//                 if (item.value == null || String(item.value).trim() === '') continue;
//                 this.upsertMappingRule(
//                     db,
//                     {
//                         target_type: 'LIS',
//                         source_field: '',
//                         destination_field: item.destination,
//                         transform_kind: 'constant',
//                         constant_value: String(item.value),
//                         enabled: 1,
//                         value_mapping_enabled: 0,
//                         unmapped_behavior: 'PASSTHROUGH',
//                         default_destination_value: null,
//                     },
//                     summary,
//                     ts,
//                 );
//             }

//             const conceptRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code',
//                     destination_field: 'lis.parameter.conceptUuid',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'ERROR',
//                     default_destination_value: null,
//                 },
//                 summary,
//                 ts,
//             );
//             const allocationRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code',
//                     destination_field: 'lis.parameter.allocationUuid',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'ERROR',
//                     default_destination_value: null,
//                 },
//                 summary,
//                 ts,
//             );
//             const datatypeRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code',
//                     destination_field: 'lis.parameter.datatype',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'DEFAULT_VALUE',
//                     default_destination_value: 'text',
//                 },
//                 summary,
//                 ts,
//             );
//             const codedAnswerRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code + result.observations[].value',
//                     destination_field: 'lis.valueCoded.uuid',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'ERROR',
//                     default_destination_value: null,
//                 },
//                 summary,
//                 ts,
//             );

//             for (const parameter of input.parameters ?? []) {
//                 const code = String(parameter.analyzerCode ?? '').trim();
//                 if (!code) {
//                     summary.skippedParameters += 1;
//                     continue;
//                 }

//                 if (parameter.conceptUuid) {
//                     this.upsertTranslation(db, conceptRuleId, code, parameter.conceptUuid, 'Analyzer code to OpenMRS concept UUID', summary, ts);
//                 }
//                 if (parameter.allocationUuid) {
//                     this.upsertTranslation(db, allocationRuleId, code, parameter.allocationUuid, 'Analyzer code to OpenMRS test allocation UUID', summary, ts);
//                 }
//                 if (parameter.datatype) {
//                     this.upsertTranslation(db, datatypeRuleId, code, parameter.datatype, 'Analyzer code to OpenMRS datatype', summary, ts);
//                 }

//                 for (const answer of parameter.codedAnswers ?? []) {
//                     const answerCode = String(answer.sourceValue ?? '').trim();
//                     const answerUuid = String(answer.destinationUuid ?? '').trim();
//                     if (!answerCode || !answerUuid) continue;
//                     this.upsertTranslation(
//                         db,
//                         codedAnswerRuleId,
//                         `${code}=${answerCode}`,
//                         answerUuid,
//                         answer.note ?? 'Analyzer coded result to OpenMRS answer UUID',
//                         summary,
//                         ts,
//                     );
//                 }
//             }
//         });

//         inTransaction();
//         return {
//             ok: true,
//             message: `LIS mapping seed completed. ${summary.rulesCreated} rules created, ${summary.rulesUpdated} rules updated, ${summary.translationsCreated} value mappings created, ${summary.translationsUpdated} value mappings updated.`,
//             summary,
//         };
//     }

//     private upsertMappingRule(db: ReturnType<typeof getDb>, dto: any, summary: any, ts: string): string {
//         const existing = db
//             .prepare(
//                 `
//                     SELECT id
//                     FROM target_mappings
//                     WHERE target_type = ? AND destination_field = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(dto.target_type, dto.destination_field) as { id: string } | undefined;

//         if (existing?.id) {
//             db.prepare(
//                 `
//                     UPDATE target_mappings
//                     SET source_field = ?,
//                         transform_kind = ?,
//                         constant_value = ?,
//                         enabled = ?,
//                         value_mapping_enabled = ?,
//                         unmapped_behavior = ?,
//                         default_destination_value = ?,
//                         updated_at = ?
//                     WHERE id = ?
//                 `,
//             ).run(
//                 String(dto.source_field ?? '').trim(),
//                 dto.transform_kind ?? 'direct',
//                 dto.constant_value ?? null,
//                 dto.enabled ?? 1,
//                 dto.value_mapping_enabled ?? 0,
//                 dto.unmapped_behavior ?? 'PASSTHROUGH',
//                 dto.default_destination_value ?? null,
//                 ts,
//                 existing.id,
//             );
//             summary.rulesUpdated += 1;
//             return existing.id;
//         }

//         const id = randomUUID();
//         db.prepare(
//             `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     value_mapping_enabled,
//                     unmapped_behavior,
//                     default_destination_value,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.target_type,
//             String(dto.source_field ?? '').trim(),
//             String(dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             dto.value_mapping_enabled ?? 0,
//             dto.unmapped_behavior ?? 'PASSTHROUGH',
//             dto.default_destination_value ?? null,
//             ts,
//             ts,
//         );
//         summary.rulesCreated += 1;
//         return id;
//     }

//     private upsertTranslation(
//         db: ReturnType<typeof getDb>,
//         mappingRuleId: string,
//         sourceValue: string,
//         destinationValue: string,
//         note: string,
//         summary: any,
//         ts: string,
//     ) {
//         const source = String(sourceValue ?? '').trim();
//         const destination = String(destinationValue ?? '').trim();
//         if (!source || !destination) return;

//         const existing = db
//             .prepare(
//                 `
//                     SELECT id
//                     FROM target_mapping_value_translations
//                     WHERE mapping_rule_id = ? AND source_value = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(mappingRuleId, source) as { id: string } | undefined;

//         if (existing?.id) {
//             db.prepare(
//                 `
//                     UPDATE target_mapping_value_translations
//                     SET destination_value = ?,
//                         enabled = 1,
//                         note = ?,
//                         updated_at = ?
//                     WHERE id = ?
//                 `,
//             ).run(destination, note, ts, existing.id);
//             summary.translationsUpdated += 1;
//             return;
//         }

//         db.prepare(
//             `
//                 INSERT INTO target_mapping_value_translations (
//                     id,
//                     mapping_rule_id,
//                     source_value,
//                     destination_value,
//                     enabled,
//                     note,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
//             `,
//         ).run(randomUUID(), mappingRuleId, source, destination, note, ts, ts);
//         summary.translationsCreated += 1;
//     }

//     validate(targetType: string) {
//         if (!SUPPORTED_TARGET_TYPES.includes(targetType as MappingTargetType)) {
//             return {
//                 ok: false,
//                 message: `Unsupported target type: ${targetType}`,
//                 targetType,
//                 errors: [`Unsupported target type: ${targetType}`],
//                 warnings: [],
//                 recommendations: [],
//                 summary: {
//                     enabledRules: 0,
//                     duplicateDestinations: 0,
//                     unsupportedKinds: 0,
//                 },
//             };
//         }

//         const typedTarget = targetType as MappingTargetType;
//         const connectorRules = CONNECTOR_RULES[typedTarget];

//         const db = getDb();
//         const rows = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     WHERE target_type = ? AND enabled = 1
//                     ORDER BY created_at ASC
//                 `,
//             )
//             .all(targetType) as any[];

//         const errors: string[] = [];
//         const warnings: string[] = [];
//         const recommendations: string[] = [...connectorRules.helperText];

//         if (rows.length === 0) {
//             warnings.push(`No enabled mappings found for ${targetType}.`);
//         }

//         const duplicateDest = new Set<string>();
//         const seenDest = new Set<string>();
//         let unsupportedKinds = 0;

//         for (const row of rows) {
//             const sourceField = String(row.source_field ?? '').trim();
//             const destinationField = String(row.destination_field ?? '').trim();
//             const transformKind = String(row.transform_kind ?? 'direct').trim() as MappingTransformKind;
//             const constantValue = row.constant_value;

//             if (!destinationField) {
//                 errors.push(`Rule ${row.id}: destination field is required.`);
//             }

//             if (transformKind === 'constant') {
//                 if (!String(constantValue ?? '').trim()) {
//                     errors.push(`Rule ${row.id}: constant mappings require a constant value.`);
//                 }
//             } else if (!sourceField) {
//                 errors.push(`Rule ${row.id}: source field is required for ${transformKind} mappings.`);
//             }

//             if (!connectorRules.supportedTransforms.includes(transformKind)) {
//                 unsupportedKinds += 1;
//                 errors.push(
//                     `Rule ${row.id}: transform kind "${transformKind}" is not supported for ${targetType}.`,
//                 );
//             }

//             if (
//                 transformKind !== 'constant' &&
//                 sourceField &&
//                 !CANONICAL_SOURCE_PREFIXES.some((prefix) => sourceField.startsWith(prefix))
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: source path "${sourceField}" is outside the canonical source document prefixes (${CANONICAL_SOURCE_PREFIXES.join(', ')}).`,
//                 );
//             }

//             if (seenDest.has(destinationField)) {
//                 duplicateDest.add(destinationField);
//             }
//             if (destinationField) {
//                 seenDest.add(destinationField);
//             }

//             if (
//                 destinationField &&
//                 connectorRules.allowedDestinationPrefixes.length > 0 &&
//                 !connectorRules.allowedDestinationPrefixes.some((prefix) => destinationField.startsWith(prefix))
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: destination "${destinationField}" does not match the usual ${targetType} path prefixes (${connectorRules.allowedDestinationPrefixes.join(', ')}).`,
//                 );
//             }
//         }

//         if (duplicateDest.size > 0) {
//             errors.push(`Duplicate destination fields: ${Array.from(duplicateDest).sort().join(', ')}`);
//         }

//         const mappedDestinations = new Set(
//             rows.map((row) => String(row.destination_field ?? '').trim()).filter(Boolean),
//         );

//         for (const requiredDestination of connectorRules.requiredDestinations) {
//             if (!mappedDestinations.has(requiredDestination)) {
//                 warnings.push(
//                     `Recommended destination "${requiredDestination}" is not currently mapped for ${targetType}.`,
//                 );
//             }
//         }

//         return {
//             ok: errors.length === 0,
//             message:
//                 errors.length === 0
//                     ? warnings.length === 0
//                         ? 'Mappings look valid.'
//                         : 'Mappings are usable but have warnings.'
//                     : 'Mappings need review.',
//             targetType,
//             errors,
//             warnings,
//             recommendations,
//             summary: {
//                 enabledRules: rows.length,
//                 duplicateDestinations: duplicateDest.size,
//                 unsupportedKinds,
//             },
//         };
//     }
// }

// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
// import { OpenMrsLisMetadataRequest, OpenMrsLisMetadataService } from './openmrs-lis-metadata.service';

// const nowIso = () => new Date().toISOString();

// export type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
// export type MappingTransformKind = 'direct' | 'constant' | 'lookup';

// export const SUPPORTED_TARGET_TYPES: MappingTargetType[] = [
//     'DHIS2',
//     'OPENMRS',
//     'LIS',
//     'CUSTOM_HTTP',
// ];

// const CANONICAL_SOURCE_PREFIXES = [
//     'meta.',
//     'normalized.',
//     'patient.',
//     'sample.',
//     'specimen.',
//     'order.',
//     'result.',
//     'source.',
//     'target.',
//     'raw.',
// ];

// const CONNECTOR_RULES: Record<
//     MappingTargetType,
//     {
//         allowedDestinationPrefixes: string[];
//         requiredDestinations: string[];
//         supportedTransforms: MappingTransformKind[];
//         helperText: string[];
//     }
// > = {
//     DHIS2: {
//         allowedDestinationPrefixes: ['events[', 'trackedEntities[', 'event.', 'tei.', 'enrollment.', 'attribute.'],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use indexed array paths like events[0].dataValues[0].value for DHIS2 event payloads.',
//             'Use trackedEntities[0].attributes[0].value and nested enrollment/event paths for tracker payloads.',
//             'Source paths come from the canonical source document, such as patient.id, result.value, or raw.<path>.',
//         ],
//     },
//     OPENMRS: {
//         allowedDestinationPrefixes: ['patient.', 'encounter.', 'visit.', 'obs.', 'identifier.', 'payload.'],
//         requiredDestinations: ['patient.identifier', 'encounter.encounterDatetime'],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use encounter.* and obs.* destinations for clinical payloads.',
//             'Keep patient.* destinations focused on identifier and demographic keys.',
//         ],
//     },
//     LIS: {
//         allowedDestinationPrefixes: ['patient.', 'order.', 'specimen.', 'result.', 'instrument.', 'payload.', 'lis.', 'body[]', 'endpoint', 'status.', 'testedBy'],
//         requiredDestinations: ['lis.parameter.conceptUuid', 'lis.parameter.allocationUuid', 'lis.valueCoded.uuid'],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'For OpenMRS-backed LIS delivery, configure analyzer code → concept UUID and analyzer code → allocation UUID.',
//             'For coded test parameters, configure analyzer result values such as HPV16=POS → OpenMRS coded answer UUID.',
//             'Constant LIS defaults such as endpoint, instrument UUID, testedBy, and result remarks are supported through lis.* destinations.',
//         ],
//     },
//     CUSTOM_HTTP: {
//         allowedDestinationPrefixes: [],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant'],
//         helperText: [
//             'Custom HTTP accepts free-form destination paths.',
//             'Prefer direct and constant rules unless you have implemented lookup semantics intentionally.',
//         ],
//     },
// };

// export type OpenMrsLisMappingSeedInput = {
//     endpoint?: string | null;
//     instrumentUuid?: string | null;
//     testedBy?: string | null;
//     statusCategory?: string | null;
//     statusStatus?: string | null;
//     statusRemarks?: string | null;
//     parameters: Array<{
//         analyzerCode: string;
//         conceptUuid?: string | null;
//         allocationUuid?: string | null;
//         datatype?: string | null;
//         codedAnswers?: Array<{ sourceValue: string; destinationUuid: string; note?: string | null }>;
//     }>;
// };

// export class MappingsService {
//     private readonly openMrsLisMetadata = new OpenMrsLisMetadataService();
//     list() {
//         const db = getDb();
//         return db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     ORDER BY target_type ASC, source_field ASC
//                 `,
//             )
//             .all();
//     }

//     create(dto: any) {
//         const db = getDb();
//         const id = randomUUID();
//         const ts = nowIso();

//         db.prepare(
//             `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             ts,
//             ts,
//         );

//         return { id };
//     }

//     update(id: string, dto: any) {
//         const db = getDb();

//         db.prepare(
//             `
//                 UPDATE target_mappings
//                 SET target_type = ?,
//                     source_field = ?,
//                     destination_field = ?,
//                     transform_kind = ?,
//                     constant_value = ?,
//                     enabled = ?,
//                     updated_at = ?
//                 WHERE id = ?
//             `,
//         ).run(
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             nowIso(),
//             id,
//         );

//         return true;
//     }

//     delete(id: string) {
//         const db = getDb();
//         db.prepare(`DELETE FROM target_mappings WHERE id = ?`).run(id);
//         return true;
//     }

//     discoverOpenMrsLisMetadata(input: OpenMrsLisMetadataRequest) {
//         return this.openMrsLisMetadata.discover(input);
//     }

//     seedOpenMrsLisMappings(input: OpenMrsLisMappingSeedInput) {
//         const db = getDb();
//         const ts = nowIso();
//         const summary = {
//             rulesCreated: 0,
//             rulesUpdated: 0,
//             translationsCreated: 0,
//             translationsUpdated: 0,
//             skippedParameters: 0,
//         };

//         const inTransaction = db.transaction(() => {
//             const constants = [
//                 { destination: 'lis.endpoint', value: input.endpoint || '/openmrs/ws/rest/v1/lab/multipleresults' },
//                 { destination: 'lis.defaults.instrumentUuid', value: input.instrumentUuid ?? null },
//                 { destination: 'lis.defaults.testedBy', value: input.testedBy ?? null },
//                 { destination: 'lis.defaults.status.category', value: input.statusCategory || 'RESULT_REMARKS' },
//                 { destination: 'lis.defaults.status.status', value: input.statusStatus || 'REMARKS' },
//                 {
//                     destination: 'lis.defaults.status.remarks',
//                     value: input.statusRemarks || 'Imported from analyzer via machine interfacing',
//                 },
//             ];

//             for (const item of constants) {
//                 if (item.value == null || String(item.value).trim() === '') continue;
//                 this.upsertMappingRule(
//                     db,
//                     {
//                         target_type: 'LIS',
//                         source_field: '',
//                         destination_field: item.destination,
//                         transform_kind: 'constant',
//                         constant_value: String(item.value),
//                         enabled: 1,
//                         value_mapping_enabled: 0,
//                         unmapped_behavior: 'PASSTHROUGH',
//                         default_destination_value: null,
//                     },
//                     summary,
//                     ts,
//                 );
//             }

//             const conceptRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code',
//                     destination_field: 'lis.parameter.conceptUuid',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'ERROR',
//                     default_destination_value: null,
//                 },
//                 summary,
//                 ts,
//             );
//             const allocationRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code',
//                     destination_field: 'lis.parameter.allocationUuid',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'ERROR',
//                     default_destination_value: null,
//                 },
//                 summary,
//                 ts,
//             );
//             const datatypeRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code',
//                     destination_field: 'lis.parameter.datatype',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'DEFAULT_VALUE',
//                     default_destination_value: 'text',
//                 },
//                 summary,
//                 ts,
//             );
//             const codedAnswerRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code + result.observations[].value',
//                     destination_field: 'lis.valueCoded.uuid',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'ERROR',
//                     default_destination_value: null,
//                 },
//                 summary,
//                 ts,
//             );

//             for (const parameter of input.parameters ?? []) {
//                 const code = String(parameter.analyzerCode ?? '').trim();
//                 if (!code) {
//                     summary.skippedParameters += 1;
//                     continue;
//                 }

//                 if (parameter.conceptUuid) {
//                     this.upsertTranslation(db, conceptRuleId, code, parameter.conceptUuid, 'Analyzer code to OpenMRS concept UUID', summary, ts);
//                 }
//                 if (parameter.allocationUuid) {
//                     this.upsertTranslation(db, allocationRuleId, code, parameter.allocationUuid, 'Analyzer code to OpenMRS test allocation UUID', summary, ts);
//                 }
//                 if (parameter.datatype) {
//                     this.upsertTranslation(db, datatypeRuleId, code, parameter.datatype, 'Analyzer code to OpenMRS datatype', summary, ts);
//                 }

//                 for (const answer of parameter.codedAnswers ?? []) {
//                     const answerCode = String(answer.sourceValue ?? '').trim();
//                     const answerUuid = String(answer.destinationUuid ?? '').trim();
//                     if (!answerCode || !answerUuid) continue;
//                     this.upsertTranslation(
//                         db,
//                         codedAnswerRuleId,
//                         `${code}=${answerCode}`,
//                         answerUuid,
//                         answer.note ?? 'Analyzer coded result to OpenMRS answer UUID',
//                         summary,
//                         ts,
//                     );
//                 }
//             }
//         });

//         inTransaction();
//         return {
//             ok: true,
//             message: `LIS mapping seed completed. ${summary.rulesCreated} rules created, ${summary.rulesUpdated} rules updated, ${summary.translationsCreated} value mappings created, ${summary.translationsUpdated} value mappings updated.`,
//             summary,
//         };
//     }

//     private upsertMappingRule(db: ReturnType<typeof getDb>, dto: any, summary: any, ts: string): string {
//         const existing = db
//             .prepare(
//                 `
//                     SELECT id
//                     FROM target_mappings
//                     WHERE target_type = ? AND destination_field = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(dto.target_type, dto.destination_field) as { id: string } | undefined;

//         if (existing?.id) {
//             db.prepare(
//                 `
//                     UPDATE target_mappings
//                     SET source_field = ?,
//                         transform_kind = ?,
//                         constant_value = ?,
//                         enabled = ?,
//                         value_mapping_enabled = ?,
//                         unmapped_behavior = ?,
//                         default_destination_value = ?,
//                         updated_at = ?
//                     WHERE id = ?
//                 `,
//             ).run(
//                 String(dto.source_field ?? '').trim(),
//                 dto.transform_kind ?? 'direct',
//                 dto.constant_value ?? null,
//                 dto.enabled ?? 1,
//                 dto.value_mapping_enabled ?? 0,
//                 dto.unmapped_behavior ?? 'PASSTHROUGH',
//                 dto.default_destination_value ?? null,
//                 ts,
//                 existing.id,
//             );
//             summary.rulesUpdated += 1;
//             return existing.id;
//         }

//         const id = randomUUID();
//         db.prepare(
//             `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     value_mapping_enabled,
//                     unmapped_behavior,
//                     default_destination_value,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.target_type,
//             String(dto.source_field ?? '').trim(),
//             String(dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             dto.value_mapping_enabled ?? 0,
//             dto.unmapped_behavior ?? 'PASSTHROUGH',
//             dto.default_destination_value ?? null,
//             ts,
//             ts,
//         );
//         summary.rulesCreated += 1;
//         return id;
//     }

//     private upsertTranslation(
//         db: ReturnType<typeof getDb>,
//         mappingRuleId: string,
//         sourceValue: string,
//         destinationValue: string,
//         note: string,
//         summary: any,
//         ts: string,
//     ) {
//         const source = String(sourceValue ?? '').trim();
//         const destination = String(destinationValue ?? '').trim();
//         if (!source || !destination) return;

//         const existing = db
//             .prepare(
//                 `
//                     SELECT id
//                     FROM target_mapping_value_translations
//                     WHERE mapping_rule_id = ? AND source_value = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(mappingRuleId, source) as { id: string } | undefined;

//         if (existing?.id) {
//             db.prepare(
//                 `
//                     UPDATE target_mapping_value_translations
//                     SET destination_value = ?,
//                         enabled = 1,
//                         note = ?,
//                         updated_at = ?
//                     WHERE id = ?
//                 `,
//             ).run(destination, note, ts, existing.id);
//             summary.translationsUpdated += 1;
//             return;
//         }

//         db.prepare(
//             `
//                 INSERT INTO target_mapping_value_translations (
//                     id,
//                     mapping_rule_id,
//                     source_value,
//                     destination_value,
//                     enabled,
//                     note,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
//             `,
//         ).run(randomUUID(), mappingRuleId, source, destination, note, ts, ts);
//         summary.translationsCreated += 1;
//     }

//     validate(targetType: string) {
//         if (!SUPPORTED_TARGET_TYPES.includes(targetType as MappingTargetType)) {
//             return {
//                 ok: false,
//                 message: `Unsupported target type: ${targetType}`,
//                 targetType,
//                 errors: [`Unsupported target type: ${targetType}`],
//                 warnings: [],
//                 recommendations: [],
//                 summary: {
//                     enabledRules: 0,
//                     duplicateDestinations: 0,
//                     unsupportedKinds: 0,
//                 },
//             };
//         }

//         const typedTarget = targetType as MappingTargetType;
//         const connectorRules = CONNECTOR_RULES[typedTarget];

//         const db = getDb();
//         const rows = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     WHERE target_type = ? AND enabled = 1
//                     ORDER BY created_at ASC
//                 `,
//             )
//             .all(targetType) as any[];

//         const errors: string[] = [];
//         const warnings: string[] = [];
//         const recommendations: string[] = [...connectorRules.helperText];

//         if (rows.length === 0) {
//             warnings.push(`No enabled mappings found for ${targetType}.`);
//         }

//         const duplicateDest = new Set<string>();
//         const seenDest = new Set<string>();
//         let unsupportedKinds = 0;

//         for (const row of rows) {
//             const sourceField = String(row.source_field ?? '').trim();
//             const destinationField = String(row.destination_field ?? '').trim();
//             const transformKind = String(row.transform_kind ?? 'direct').trim() as MappingTransformKind;
//             const constantValue = row.constant_value;

//             if (!destinationField) {
//                 errors.push(`Rule ${row.id}: destination field is required.`);
//             }

//             if (transformKind === 'constant') {
//                 if (!String(constantValue ?? '').trim()) {
//                     errors.push(`Rule ${row.id}: constant mappings require a constant value.`);
//                 }
//             } else if (!sourceField) {
//                 errors.push(`Rule ${row.id}: source field is required for ${transformKind} mappings.`);
//             }

//             if (!connectorRules.supportedTransforms.includes(transformKind)) {
//                 unsupportedKinds += 1;
//                 errors.push(
//                     `Rule ${row.id}: transform kind "${transformKind}" is not supported for ${targetType}.`,
//                 );
//             }

//             if (
//                 transformKind !== 'constant' &&
//                 sourceField &&
//                 !CANONICAL_SOURCE_PREFIXES.some((prefix) => sourceField.startsWith(prefix))
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: source path "${sourceField}" is outside the canonical source document prefixes (${CANONICAL_SOURCE_PREFIXES.join(', ')}).`,
//                 );
//             }

//             if (seenDest.has(destinationField)) {
//                 duplicateDest.add(destinationField);
//             }
//             if (destinationField) {
//                 seenDest.add(destinationField);
//             }

//             if (
//                 destinationField &&
//                 connectorRules.allowedDestinationPrefixes.length > 0 &&
//                 !connectorRules.allowedDestinationPrefixes.some((prefix) => destinationField.startsWith(prefix))
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: destination "${destinationField}" does not match the usual ${targetType} path prefixes (${connectorRules.allowedDestinationPrefixes.join(', ')}).`,
//                 );
//             }
//         }

//         if (duplicateDest.size > 0) {
//             errors.push(`Duplicate destination fields: ${Array.from(duplicateDest).sort().join(', ')}`);
//         }

//         const mappedDestinations = new Set(
//             rows.map((row) => String(row.destination_field ?? '').trim()).filter(Boolean),
//         );

//         for (const requiredDestination of connectorRules.requiredDestinations) {
//             if (!mappedDestinations.has(requiredDestination)) {
//                 warnings.push(
//                     `Recommended destination "${requiredDestination}" is not currently mapped for ${targetType}.`,
//                 );
//             }
//         }

//         return {
//             ok: errors.length === 0,
//             message:
//                 errors.length === 0
//                     ? warnings.length === 0
//                         ? 'Mappings look valid.'
//                         : 'Mappings are usable but have warnings.'
//                     : 'Mappings need review.',
//             targetType,
//             errors,
//             warnings,
//             recommendations,
//             summary: {
//                 enabledRules: rows.length,
//                 duplicateDestinations: duplicateDest.size,
//                 unsupportedKinds,
//             },
//         };
//     }
// }



// import { randomUUID } from 'crypto';
// import { getDb } from '../db/db';
// import {
//     OpenMrsLisMetadataRequest,
//     OpenMrsLisMetadataService,
// } from './openmrs-lis-metadata.service';

// const nowIso = () => new Date().toISOString();

// export type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
// export type MappingTransformKind = 'direct' | 'constant' | 'lookup';

// export const SUPPORTED_TARGET_TYPES: MappingTargetType[] = [
//     'DHIS2',
//     'OPENMRS',
//     'LIS',
//     'CUSTOM_HTTP',
// ];

// const CANONICAL_SOURCE_PREFIXES = [
//     'meta.',
//     'normalized.',
//     'patient.',
//     'sample.',
//     'specimen.',
//     'order.',
//     'result.',
//     'source.',
//     'target.',
//     'raw.',
// ];

// const CONNECTOR_RULES: Record<
//     MappingTargetType,
//     {
//         allowedDestinationPrefixes: string[];
//         requiredDestinations: string[];
//         supportedTransforms: MappingTransformKind[];
//         helperText: string[];
//     }
// > = {
//     DHIS2: {
//         allowedDestinationPrefixes: [
//             'events[',
//             'trackedEntities[',
//             'event.',
//             'tei.',
//             'enrollment.',
//             'attribute.',
//         ],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use indexed array paths like events[0].dataValues[0].value for DHIS2 event payloads.',
//             'Use trackedEntities[0].attributes[0].value and nested enrollment/event paths for tracker payloads.',
//             'Source paths come from the canonical source document, such as patient.id, result.value, or raw.<path>.',
//         ],
//     },
//     OPENMRS: {
//         allowedDestinationPrefixes: [
//             'patient.',
//             'encounter.',
//             'visit.',
//             'obs.',
//             'identifier.',
//             'payload.',
//         ],
//         requiredDestinations: ['patient.identifier', 'encounter.encounterDatetime'],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'Use encounter.* and obs.* destinations for clinical payloads.',
//             'Keep patient.* destinations focused on identifier and demographic keys.',
//         ],
//     },
//     LIS: {
//         allowedDestinationPrefixes: [
//             'patient.',
//             'order.',
//             'sample.',
//             'specimen.',
//             'result.',
//             'instrument.',
//             'payload.',
//             'lis.',
//             'body[]',
//             'body[',
//             'endpoint',
//             'status.',
//             'testedBy',
//         ],
//         requiredDestinations: ['lis.parameter.conceptUuid', 'lis.valueCoded.uuid'],
//         supportedTransforms: ['direct', 'constant', 'lookup'],
//         helperText: [
//             'For OpenMRS-backed LIS delivery, configure analyzer code → concept UUID and analyzer result value → coded answer UUID. Test allocation UUIDs are resolved dynamically from the sample allocation at delivery time when the sample label/UUID is present.',
//             'Static analyzer code → allocation UUID mappings remain supported as an optional fallback, but they should not be used as the main strategy because allocations are sample-specific.',
//             'For coded test parameters, configure analyzer result values such as HPV16=POS → OpenMRS coded answer UUID.',
//             'Constant LIS defaults such as endpoint, instrument UUID, testedBy, and result remarks are supported through lis.* destinations.',
//         ],
//     },
//     CUSTOM_HTTP: {
//         allowedDestinationPrefixes: [],
//         requiredDestinations: [],
//         supportedTransforms: ['direct', 'constant'],
//         helperText: [
//             'Custom HTTP accepts free-form destination paths.',
//             'Prefer direct and constant rules unless you have implemented lookup semantics intentionally.',
//         ],
//     },
// };

// export type OpenMrsLisMappingSeedInput = {
//     endpoint?: string | null;
//     instrumentUuid?: string | null;
//     testedBy?: string | null;
//     statusCategory?: string | null;
//     statusStatus?: string | null;
//     statusRemarks?: string | null;
//     parameters: Array<{
//         analyzerCode: string;
//         conceptUuid?: string | null;
//         allocationUuid?: string | null;
//         datatype?: string | null;
//         codedAnswers?: Array<{
//             sourceValue: string;
//             destinationUuid: string;
//             note?: string | null;
//         }>;
//     }>;
// };

// export class MappingsService {
//     private readonly openMrsLisMetadata = new OpenMrsLisMetadataService();
//     list() {
//         const db = getDb();
//         return db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     ORDER BY target_type ASC, source_field ASC
//                 `,
//             )
//             .all();
//     }

//     create(dto: any) {
//         const db = getDb();
//         const id = randomUUID();
//         const ts = nowIso();

//         db.prepare(
//             `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             ts,
//             ts,
//         );

//         return { id };
//     }

//     update(id: string, dto: any) {
//         const db = getDb();

//         db.prepare(
//             `
//                 UPDATE target_mappings
//                 SET target_type = ?,
//                     source_field = ?,
//                     destination_field = ?,
//                     transform_kind = ?,
//                     constant_value = ?,
//                     enabled = ?,
//                     updated_at = ?
//                 WHERE id = ?
//             `,
//         ).run(
//             dto.target_type,
//             (dto.source_field ?? '').trim(),
//             (dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             nowIso(),
//             id,
//         );

//         return true;
//     }

//     delete(id: string) {
//         const db = getDb();
//         db.prepare(`DELETE FROM target_mappings WHERE id = ?`).run(id);
//         return true;
//     }

//     discoverOpenMrsLisMetadata(input: OpenMrsLisMetadataRequest) {
//         return this.openMrsLisMetadata.discover(input);
//     }

//     seedOpenMrsLisMappings(input: OpenMrsLisMappingSeedInput) {
//         const db = getDb();
//         const ts = nowIso();
//         const summary = {
//             rulesCreated: 0,
//             rulesUpdated: 0,
//             translationsCreated: 0,
//             translationsUpdated: 0,
//             skippedParameters: 0,
//         };

//         const inTransaction = db.transaction(() => {
//             const constants = [
//                 {
//                     destination: 'lis.endpoint',
//                     value: input.endpoint || '/openmrs/ws/rest/v1/lab/multipleresults',
//                 },
//                 {
//                     destination: 'lis.defaults.instrumentUuid',
//                     value: input.instrumentUuid ?? null,
//                 },
//                 { destination: 'lis.defaults.testedBy', value: input.testedBy ?? null },
//                 {
//                     destination: 'lis.defaults.status.category',
//                     value: input.statusCategory || 'RESULT_REMARKS',
//                 },
//                 {
//                     destination: 'lis.defaults.status.status',
//                     value: input.statusStatus || 'REMARKS',
//                 },
//                 {
//                     destination: 'lis.defaults.status.remarks',
//                     value: input.statusRemarks || 'Imported from analyzer via machine interfacing',
//                 },
//             ];

//             for (const item of constants) {
//                 if (item.value == null || String(item.value).trim() === '') continue;
//                 this.upsertMappingRule(
//                     db,
//                     {
//                         target_type: 'LIS',
//                         source_field: '',
//                         destination_field: item.destination,
//                         transform_kind: 'constant',
//                         constant_value: String(item.value),
//                         enabled: 1,
//                         value_mapping_enabled: 0,
//                         unmapped_behavior: 'PASSTHROUGH',
//                         default_destination_value: null,
//                     },
//                     summary,
//                     ts,
//                 );
//             }

//             const conceptRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code',
//                     destination_field: 'lis.parameter.conceptUuid',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'ERROR',
//                     default_destination_value: null,
//                 },
//                 summary,
//                 ts,
//             );
//             const allocationRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code',
//                     destination_field: 'lis.parameter.allocationUuid',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'ERROR',
//                     default_destination_value: null,
//                 },
//                 summary,
//                 ts,
//             );
//             const datatypeRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code',
//                     destination_field: 'lis.parameter.datatype',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'DEFAULT_VALUE',
//                     default_destination_value: 'text',
//                 },
//                 summary,
//                 ts,
//             );
//             const codedAnswerRuleId = this.upsertMappingRule(
//                 db,
//                 {
//                     target_type: 'LIS',
//                     source_field: 'result.observations[].code + result.observations[].value',
//                     destination_field: 'lis.valueCoded.uuid',
//                     transform_kind: 'lookup',
//                     constant_value: null,
//                     enabled: 1,
//                     value_mapping_enabled: 1,
//                     unmapped_behavior: 'ERROR',
//                     default_destination_value: null,
//                 },
//                 summary,
//                 ts,
//             );

//             for (const parameter of input.parameters ?? []) {
//                 const code = String(parameter.analyzerCode ?? '').trim();
//                 if (!code) {
//                     summary.skippedParameters += 1;
//                     continue;
//                 }

//                 if (parameter.conceptUuid) {
//                     this.upsertTranslation(
//                         db,
//                         conceptRuleId,
//                         code,
//                         parameter.conceptUuid,
//                         'Analyzer code to OpenMRS concept UUID',
//                         summary,
//                         ts,
//                     );
//                 }
//                 if (parameter.allocationUuid) {
//                     this.upsertTranslation(
//                         db,
//                         allocationRuleId,
//                         code,
//                         parameter.allocationUuid,
//                         'Optional fallback: analyzer code to OpenMRS test allocation UUID for the selected sample',
//                         summary,
//                         ts,
//                     );
//                 }
//                 if (parameter.datatype) {
//                     this.upsertTranslation(
//                         db,
//                         datatypeRuleId,
//                         code,
//                         parameter.datatype,
//                         'Analyzer code to OpenMRS datatype',
//                         summary,
//                         ts,
//                     );
//                 }

//                 for (const answer of parameter.codedAnswers ?? []) {
//                     const answerCode = String(answer.sourceValue ?? '').trim();
//                     const answerUuid = String(answer.destinationUuid ?? '').trim();
//                     if (!answerCode || !answerUuid) continue;
//                     this.upsertTranslation(
//                         db,
//                         codedAnswerRuleId,
//                         `${code}=${answerCode}`,
//                         answerUuid,
//                         answer.note ?? 'Analyzer coded result to OpenMRS answer UUID',
//                         summary,
//                         ts,
//                     );
//                 }
//             }
//         });

//         inTransaction();
//         return {
//             ok: true,
//             message: `LIS mapping seed completed. ${summary.rulesCreated} rules created, ${summary.rulesUpdated} rules updated, ${summary.translationsCreated} value mappings created, ${summary.translationsUpdated} value mappings updated.`,
//             summary,
//         };
//     }

//     private upsertMappingRule(
//         db: ReturnType<typeof getDb>,
//         dto: any,
//         summary: any,
//         ts: string,
//     ): string {
//         const existing = db
//             .prepare(
//                 `
//                     SELECT id
//                     FROM target_mappings
//                     WHERE target_type = ? AND destination_field = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(dto.target_type, dto.destination_field) as { id: string } | undefined;

//         if (existing?.id) {
//             db.prepare(
//                 `
//                     UPDATE target_mappings
//                     SET source_field = ?,
//                         transform_kind = ?,
//                         constant_value = ?,
//                         enabled = ?,
//                         value_mapping_enabled = ?,
//                         unmapped_behavior = ?,
//                         default_destination_value = ?,
//                         updated_at = ?
//                     WHERE id = ?
//                 `,
//             ).run(
//                 String(dto.source_field ?? '').trim(),
//                 dto.transform_kind ?? 'direct',
//                 dto.constant_value ?? null,
//                 dto.enabled ?? 1,
//                 dto.value_mapping_enabled ?? 0,
//                 dto.unmapped_behavior ?? 'PASSTHROUGH',
//                 dto.default_destination_value ?? null,
//                 ts,
//                 existing.id,
//             );
//             summary.rulesUpdated += 1;
//             return existing.id;
//         }

//         const id = randomUUID();
//         db.prepare(
//             `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     value_mapping_enabled,
//                     unmapped_behavior,
//                     default_destination_value,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//         ).run(
//             id,
//             dto.target_type,
//             String(dto.source_field ?? '').trim(),
//             String(dto.destination_field ?? '').trim(),
//             dto.transform_kind ?? 'direct',
//             dto.constant_value ?? null,
//             dto.enabled ?? 1,
//             dto.value_mapping_enabled ?? 0,
//             dto.unmapped_behavior ?? 'PASSTHROUGH',
//             dto.default_destination_value ?? null,
//             ts,
//             ts,
//         );
//         summary.rulesCreated += 1;
//         return id;
//     }

//     private upsertTranslation(
//         db: ReturnType<typeof getDb>,
//         mappingRuleId: string,
//         sourceValue: string,
//         destinationValue: string,
//         note: string,
//         summary: any,
//         ts: string,
//     ) {
//         const source = String(sourceValue ?? '').trim();
//         const destination = String(destinationValue ?? '').trim();
//         if (!source || !destination) return;

//         const existing = db
//             .prepare(
//                 `
//                     SELECT id
//                     FROM target_mapping_value_translations
//                     WHERE mapping_rule_id = ? AND source_value = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(mappingRuleId, source) as { id: string } | undefined;

//         if (existing?.id) {
//             db.prepare(
//                 `
//                     UPDATE target_mapping_value_translations
//                     SET destination_value = ?,
//                         enabled = 1,
//                         note = ?,
//                         updated_at = ?
//                     WHERE id = ?
//                 `,
//             ).run(destination, note, ts, existing.id);
//             summary.translationsUpdated += 1;
//             return;
//         }

//         db.prepare(
//             `
//                 INSERT INTO target_mapping_value_translations (
//                     id,
//                     mapping_rule_id,
//                     source_value,
//                     destination_value,
//                     enabled,
//                     note,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
//             `,
//         ).run(randomUUID(), mappingRuleId, source, destination, note, ts, ts);
//         summary.translationsCreated += 1;
//     }

//     validate(targetType: string) {
//         if (!SUPPORTED_TARGET_TYPES.includes(targetType as MappingTargetType)) {
//             return {
//                 ok: false,
//                 message: `Unsupported target type: ${targetType}`,
//                 targetType,
//                 errors: [`Unsupported target type: ${targetType}`],
//                 warnings: [],
//                 recommendations: [],
//                 summary: {
//                     enabledRules: 0,
//                     duplicateDestinations: 0,
//                     unsupportedKinds: 0,
//                 },
//             };
//         }

//         const typedTarget = targetType as MappingTargetType;
//         const connectorRules = CONNECTOR_RULES[typedTarget];

//         const db = getDb();
//         const rows = db
//             .prepare(
//                 `
//                     SELECT *
//                     FROM target_mappings
//                     WHERE target_type = ? AND enabled = 1
//                     ORDER BY created_at ASC
//                 `,
//             )
//             .all(targetType) as any[];

//         const errors: string[] = [];
//         const warnings: string[] = [];
//         const recommendations: string[] = [...connectorRules.helperText];

//         if (rows.length === 0) {
//             warnings.push(`No enabled mappings found for ${targetType}.`);
//         }

//         const duplicateDest = new Set<string>();
//         const seenDest = new Set<string>();
//         let unsupportedKinds = 0;

//         for (const row of rows) {
//             const sourceField = String(row.source_field ?? '').trim();
//             const destinationField = String(row.destination_field ?? '').trim();
//             const transformKind = String(row.transform_kind ?? 'direct').trim() as MappingTransformKind;
//             const constantValue = row.constant_value;

//             if (!destinationField) {
//                 errors.push(`Rule ${row.id}: destination field is required.`);
//             }

//             if (transformKind === 'constant') {
//                 if (!String(constantValue ?? '').trim()) {
//                     errors.push(`Rule ${row.id}: constant mappings require a constant value.`);
//                 }
//             } else if (!sourceField) {
//                 errors.push(`Rule ${row.id}: source field is required for ${transformKind} mappings.`);
//             }

//             if (!connectorRules.supportedTransforms.includes(transformKind)) {
//                 unsupportedKinds += 1;
//                 errors.push(
//                     `Rule ${row.id}: transform kind "${transformKind}" is not supported for ${targetType}.`,
//                 );
//             }

//             if (
//                 transformKind !== 'constant' &&
//                 sourceField &&
//                 !CANONICAL_SOURCE_PREFIXES.some((prefix) => sourceField.startsWith(prefix))
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: source path "${sourceField}" is outside the canonical source document prefixes (${CANONICAL_SOURCE_PREFIXES.join(', ')}).`,
//                 );
//             }

//             if (seenDest.has(destinationField)) {
//                 duplicateDest.add(destinationField);
//             }
//             if (destinationField) {
//                 seenDest.add(destinationField);
//             }

//             if (
//                 destinationField &&
//                 connectorRules.allowedDestinationPrefixes.length > 0 &&
//                 !connectorRules.allowedDestinationPrefixes.some((prefix) =>
//                     destinationField.startsWith(prefix),
//                 )
//             ) {
//                 warnings.push(
//                     `Rule ${row.id}: destination "${destinationField}" does not match the usual ${targetType} path prefixes (${connectorRules.allowedDestinationPrefixes.join(', ')}).`,
//                 );
//             }
//         }

//         if (duplicateDest.size > 0) {
//             errors.push(`Duplicate destination fields: ${Array.from(duplicateDest).sort().join(', ')}`);
//         }

//         const mappedDestinations = new Set(
//             rows.map((row) => String(row.destination_field ?? '').trim()).filter(Boolean),
//         );

//         for (const requiredDestination of connectorRules.requiredDestinations) {
//             if (!mappedDestinations.has(requiredDestination)) {
//                 warnings.push(
//                     `Recommended destination "${requiredDestination}" is not currently mapped for ${targetType}.`,
//                 );
//             }
//         }

//         return {
//             ok: errors.length === 0,
//             message:
//                 errors.length === 0
//                     ? warnings.length === 0
//                         ? 'Mappings look valid.'
//                         : 'Mappings are usable but have warnings.'
//                     : 'Mappings need review.',
//             targetType,
//             errors,
//             warnings,
//             recommendations,
//             summary: {
//                 enabledRules: rows.length,
//                 duplicateDestinations: duplicateDest.size,
//                 unsupportedKinds,
//             },
//         };
//     }
// }


// import { randomUUID } from "crypto";
// import { getDb } from "../db/db";
// import {
//   OpenMrsLisMetadataRequest,
//   OpenMrsLisMetadataService,
// } from "./openmrs-lis-metadata.service";

// const nowIso = () => new Date().toISOString();

// export type MappingTargetType = "DHIS2" | "OPENMRS" | "LIS" | "CUSTOM_HTTP";
// export type MappingTransformKind = "direct" | "constant" | "lookup";

// export const SUPPORTED_TARGET_TYPES: MappingTargetType[] = [
//   "DHIS2",
//   "OPENMRS",
//   "LIS",
//   "CUSTOM_HTTP",
// ];

// const CANONICAL_SOURCE_PREFIXES = [
//   "meta.",
//   "normalized.",
//   "patient.",
//   "sample.",
//   "specimen.",
//   "order.",
//   "result.",
//   "source.",
//   "target.",
//   "raw.",
// ];

// const CONNECTOR_RULES: Record<
//   MappingTargetType,
//   {
//     allowedDestinationPrefixes: string[];
//     requiredDestinations: string[];
//     supportedTransforms: MappingTransformKind[];
//     helperText: string[];
//   }
// > = {
//   DHIS2: {
//     allowedDestinationPrefixes: [
//       "events[",
//       "trackedEntities[",
//       "event.",
//       "tei.",
//       "enrollment.",
//       "attribute.",
//     ],
//     requiredDestinations: [],
//     supportedTransforms: ["direct", "constant", "lookup"],
//     helperText: [
//       "Use indexed array paths like events[0].dataValues[0].value for DHIS2 event payloads.",
//       "Use trackedEntities[0].attributes[0].value and nested enrollment/event paths for tracker payloads.",
//       "Source paths come from the canonical source document, such as patient.id, result.value, or raw.<path>.",
//     ],
//   },
//   OPENMRS: {
//     allowedDestinationPrefixes: [
//       "patient.",
//       "encounter.",
//       "visit.",
//       "obs.",
//       "identifier.",
//       "payload.",
//     ],
//     requiredDestinations: ["patient.identifier", "encounter.encounterDatetime"],
//     supportedTransforms: ["direct", "constant", "lookup"],
//     helperText: [
//       "Use encounter.* and obs.* destinations for clinical payloads.",
//       "Keep patient.* destinations focused on identifier and demographic keys.",
//     ],
//   },
//   LIS: {
//     allowedDestinationPrefixes: [
//       "patient.",
//       "order.",
//       "sample.",
//       "specimen.",
//       "result.",
//       "instrument.",
//       "payload.",
//       "lis.",
//       "body[]",
//       "body[",
//       "endpoint",
//       "status.",
//       "testedBy",
//     ],
//     requiredDestinations: ["lis.parameter.conceptUuid", "lis.valueCoded.uuid"],
//     supportedTransforms: ["direct", "constant", "lookup"],
//     helperText: [
//       "For OpenMRS-backed LIS delivery, configure analyzer code → concept UUID and analyzer result value → coded answer UUID. Test allocation UUIDs are resolved dynamically from the sample allocation at delivery time when the sample label/UUID is present.",
//       "Static analyzer code → allocation UUID mappings remain supported as an optional fallback only. They should not be treated as required because allocations are sample-specific.",
//       "For coded test parameters, configure analyzer result values such as HPV16=POS → OpenMRS coded answer UUID.",
//       "Constant LIS defaults such as endpoint, instrument UUID, testedBy, and result remarks are supported through lis.* destinations.",
//     ],
//   },
//   CUSTOM_HTTP: {
//     allowedDestinationPrefixes: [],
//     requiredDestinations: [],
//     supportedTransforms: ["direct", "constant"],
//     helperText: [
//       "Custom HTTP accepts free-form destination paths.",
//       "Prefer direct and constant rules unless you have implemented lookup semantics intentionally.",
//     ],
//   },
// };

// export type OpenMrsLisMappingSeedInput = {
//   endpoint?: string | null;
//   instrumentUuid?: string | null;
//   testedBy?: string | null;
//   statusCategory?: string | null;
//   statusStatus?: string | null;
//   statusRemarks?: string | null;
//   parameters: Array<{
//     analyzerCode: string;
//     conceptUuid?: string | null;
//     allocationUuid?: string | null;
//     datatype?: string | null;
//     codedAnswers?: Array<{
//       sourceValue: string;
//       destinationUuid: string;
//       note?: string | null;
//     }>;
//   }>;
// };

// export class MappingsService {
//   private readonly openMrsLisMetadata = new OpenMrsLisMetadataService();
//   list() {
//     const db = getDb();
//     return db
//       .prepare(
//         `
//                     SELECT *
//                     FROM target_mappings
//                     ORDER BY target_type ASC, source_field ASC
//                 `,
//       )
//       .all();
//   }

//   create(dto: any) {
//     const db = getDb();
//     const id = randomUUID();
//     const ts = nowIso();

//     db.prepare(
//       `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//     ).run(
//       id,
//       dto.target_type,
//       (dto.source_field ?? "").trim(),
//       (dto.destination_field ?? "").trim(),
//       dto.transform_kind ?? "direct",
//       dto.constant_value ?? null,
//       dto.enabled ?? 1,
//       ts,
//       ts,
//     );

//     return { id };
//   }

//   update(id: string, dto: any) {
//     const db = getDb();

//     db.prepare(
//       `
//                 UPDATE target_mappings
//                 SET target_type = ?,
//                     source_field = ?,
//                     destination_field = ?,
//                     transform_kind = ?,
//                     constant_value = ?,
//                     enabled = ?,
//                     updated_at = ?
//                 WHERE id = ?
//             `,
//     ).run(
//       dto.target_type,
//       (dto.source_field ?? "").trim(),
//       (dto.destination_field ?? "").trim(),
//       dto.transform_kind ?? "direct",
//       dto.constant_value ?? null,
//       dto.enabled ?? 1,
//       nowIso(),
//       id,
//     );

//     return true;
//   }

//   delete(id: string) {
//     const db = getDb();
//     db.prepare(`DELETE FROM target_mappings WHERE id = ?`).run(id);
//     return true;
//   }

//   discoverOpenMrsLisMetadata(input: OpenMrsLisMetadataRequest) {
//     return this.openMrsLisMetadata.discover(input);
//   }

//   seedOpenMrsLisMappings(input: OpenMrsLisMappingSeedInput) {
//     const db = getDb();
//     const ts = nowIso();
//     const summary = {
//       rulesCreated: 0,
//       rulesUpdated: 0,
//       translationsCreated: 0,
//       translationsUpdated: 0,
//       skippedParameters: 0,
//     };

//     const inTransaction = db.transaction(() => {
//       const constants = [
//         {
//           destination: "lis.endpoint",
//           value: input.endpoint || "/openmrs/ws/rest/v1/lab/multipleresults",
//         },
//         {
//           destination: "lis.defaults.instrumentUuid",
//           value: input.instrumentUuid ?? null,
//         },
//         { destination: "lis.defaults.testedBy", value: input.testedBy ?? null },
//         {
//           destination: "lis.defaults.status.category",
//           value: input.statusCategory || "RESULT_REMARKS",
//         },
//         {
//           destination: "lis.defaults.status.status",
//           value: input.statusStatus || "REMARKS",
//         },
//         {
//           destination: "lis.defaults.status.remarks",
//           value:
//             input.statusRemarks ||
//             "Imported from analyzer via machine interfacing",
//         },
//       ];

//       for (const item of constants) {
//         if (item.value == null || String(item.value).trim() === "") continue;
//         this.upsertMappingRule(
//           db,
//           {
//             target_type: "LIS",
//             source_field: "",
//             destination_field: item.destination,
//             transform_kind: "constant",
//             constant_value: String(item.value),
//             enabled: 1,
//             value_mapping_enabled: 0,
//             unmapped_behavior: "PASSTHROUGH",
//             default_destination_value: null,
//           },
//           summary,
//           ts,
//         );
//       }

//       const conceptRuleId = this.upsertMappingRule(
//         db,
//         {
//           target_type: "LIS",
//           source_field: "result.observations[].code",
//           destination_field: "lis.parameter.conceptUuid",
//           transform_kind: "lookup",
//           constant_value: null,
//           enabled: 1,
//           value_mapping_enabled: 1,
//           unmapped_behavior: "ERROR",
//           default_destination_value: null,
//         },
//         summary,
//         ts,
//       );
//       const allocationRuleId = this.upsertMappingRule(
//         db,
//         {
//           target_type: "LIS",
//           source_field: "result.observations[].code",
//           destination_field: "lis.parameter.allocationUuid",
//           transform_kind: "lookup",
//           constant_value: null,
//           enabled: 1,
//           value_mapping_enabled: 1,
//           unmapped_behavior: "PASSTHROUGH",
//           default_destination_value: null,
//         },
//         summary,
//         ts,
//       );
//       const datatypeRuleId = this.upsertMappingRule(
//         db,
//         {
//           target_type: "LIS",
//           source_field: "result.observations[].code",
//           destination_field: "lis.parameter.datatype",
//           transform_kind: "lookup",
//           constant_value: null,
//           enabled: 1,
//           value_mapping_enabled: 1,
//           unmapped_behavior: "DEFAULT_VALUE",
//           default_destination_value: "text",
//         },
//         summary,
//         ts,
//       );
//       const codedAnswerRuleId = this.upsertMappingRule(
//         db,
//         {
//           target_type: "LIS",
//           source_field:
//             "result.observations[].code + result.observations[].value",
//           destination_field: "lis.valueCoded.uuid",
//           transform_kind: "lookup",
//           constant_value: null,
//           enabled: 1,
//           value_mapping_enabled: 1,
//           unmapped_behavior: "ERROR",
//           default_destination_value: null,
//         },
//         summary,
//         ts,
//       );

//       for (const parameter of input.parameters ?? []) {
//         const code = String(parameter.analyzerCode ?? "").trim();
//         if (!code) {
//           summary.skippedParameters += 1;
//           continue;
//         }

//         if (parameter.conceptUuid) {
//           this.upsertTranslation(
//             db,
//             conceptRuleId,
//             code,
//             parameter.conceptUuid,
//             "Analyzer code to OpenMRS concept UUID",
//             summary,
//             ts,
//           );
//         }
//         if (parameter.allocationUuid) {
//           this.upsertTranslation(
//             db,
//             allocationRuleId,
//             code,
//             parameter.allocationUuid,
//             "Optional fallback: analyzer code to OpenMRS test allocation UUID for the selected sample",
//             summary,
//             ts,
//           );
//         }
//         if (parameter.datatype) {
//           this.upsertTranslation(
//             db,
//             datatypeRuleId,
//             code,
//             parameter.datatype,
//             "Analyzer code to OpenMRS datatype",
//             summary,
//             ts,
//           );
//         }

//         for (const answer of parameter.codedAnswers ?? []) {
//           const answerCode = String(answer.sourceValue ?? "").trim();
//           const answerUuid = String(answer.destinationUuid ?? "").trim();
//           if (!answerCode || !answerUuid) continue;
//           this.upsertTranslation(
//             db,
//             codedAnswerRuleId,
//             `${code}=${answerCode}`,
//             answerUuid,
//             answer.note ?? "Analyzer coded result to OpenMRS answer UUID",
//             summary,
//             ts,
//           );
//         }
//       }
//     });

//     inTransaction();
//     return {
//       ok: true,
//       message: `LIS mapping seed completed. ${summary.rulesCreated} rules created, ${summary.rulesUpdated} rules updated, ${summary.translationsCreated} value mappings created, ${summary.translationsUpdated} value mappings updated.`,
//       summary,
//     };
//   }

//   private upsertMappingRule(
//     db: ReturnType<typeof getDb>,
//     dto: any,
//     summary: any,
//     ts: string,
//   ): string {
//     const existing = db
//       .prepare(
//         `
//                     SELECT id
//                     FROM target_mappings
//                     WHERE target_type = ? AND destination_field = ?
//                     LIMIT 1
//                 `,
//       )
//       .get(dto.target_type, dto.destination_field) as
//       | { id: string }
//       | undefined;

//     if (existing?.id) {
//       db.prepare(
//         `
//                     UPDATE target_mappings
//                     SET source_field = ?,
//                         transform_kind = ?,
//                         constant_value = ?,
//                         enabled = ?,
//                         value_mapping_enabled = ?,
//                         unmapped_behavior = ?,
//                         default_destination_value = ?,
//                         updated_at = ?
//                     WHERE id = ?
//                 `,
//       ).run(
//         String(dto.source_field ?? "").trim(),
//         dto.transform_kind ?? "direct",
//         dto.constant_value ?? null,
//         dto.enabled ?? 1,
//         dto.value_mapping_enabled ?? 0,
//         dto.unmapped_behavior ?? "PASSTHROUGH",
//         dto.default_destination_value ?? null,
//         ts,
//         existing.id,
//       );
//       summary.rulesUpdated += 1;
//       return existing.id;
//     }

//     const id = randomUUID();
//     db.prepare(
//       `
//                 INSERT INTO target_mappings (
//                     id,
//                     target_type,
//                     source_field,
//                     destination_field,
//                     transform_kind,
//                     constant_value,
//                     enabled,
//                     value_mapping_enabled,
//                     unmapped_behavior,
//                     default_destination_value,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//             `,
//     ).run(
//       id,
//       dto.target_type,
//       String(dto.source_field ?? "").trim(),
//       String(dto.destination_field ?? "").trim(),
//       dto.transform_kind ?? "direct",
//       dto.constant_value ?? null,
//       dto.enabled ?? 1,
//       dto.value_mapping_enabled ?? 0,
//       dto.unmapped_behavior ?? "PASSTHROUGH",
//       dto.default_destination_value ?? null,
//       ts,
//       ts,
//     );
//     summary.rulesCreated += 1;
//     return id;
//   }

//   private upsertTranslation(
//     db: ReturnType<typeof getDb>,
//     mappingRuleId: string,
//     sourceValue: string,
//     destinationValue: string,
//     note: string,
//     summary: any,
//     ts: string,
//   ) {
//     const source = String(sourceValue ?? "").trim();
//     const destination = String(destinationValue ?? "").trim();
//     if (!source || !destination) return;

//     const existing = db
//       .prepare(
//         `
//                     SELECT id
//                     FROM target_mapping_value_translations
//                     WHERE mapping_rule_id = ? AND source_value = ?
//                     LIMIT 1
//                 `,
//       )
//       .get(mappingRuleId, source) as { id: string } | undefined;

//     if (existing?.id) {
//       db.prepare(
//         `
//                     UPDATE target_mapping_value_translations
//                     SET destination_value = ?,
//                         enabled = 1,
//                         note = ?,
//                         updated_at = ?
//                     WHERE id = ?
//                 `,
//       ).run(destination, note, ts, existing.id);
//       summary.translationsUpdated += 1;
//       return;
//     }

//     db.prepare(
//       `
//                 INSERT INTO target_mapping_value_translations (
//                     id,
//                     mapping_rule_id,
//                     source_value,
//                     destination_value,
//                     enabled,
//                     note,
//                     created_at,
//                     updated_at
//                 ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
//             `,
//     ).run(randomUUID(), mappingRuleId, source, destination, note, ts, ts);
//     summary.translationsCreated += 1;
//   }

//   validate(targetType: string) {
//     if (!SUPPORTED_TARGET_TYPES.includes(targetType as MappingTargetType)) {
//       return {
//         ok: false,
//         message: `Unsupported target type: ${targetType}`,
//         targetType,
//         errors: [`Unsupported target type: ${targetType}`],
//         warnings: [],
//         recommendations: [],
//         summary: {
//           enabledRules: 0,
//           duplicateDestinations: 0,
//           unsupportedKinds: 0,
//         },
//       };
//     }

//     const typedTarget = targetType as MappingTargetType;
//     const connectorRules = CONNECTOR_RULES[typedTarget];

//     const db = getDb();
//     const rows = db
//       .prepare(
//         `
//                     SELECT *
//                     FROM target_mappings
//                     WHERE target_type = ? AND enabled = 1
//                     ORDER BY created_at ASC
//                 `,
//       )
//       .all(targetType) as any[];

//     const errors: string[] = [];
//     const warnings: string[] = [];
//     const recommendations: string[] = [...connectorRules.helperText];

//     if (rows.length === 0) {
//       warnings.push(`No enabled mappings found for ${targetType}.`);
//     }

//     const duplicateDest = new Set<string>();
//     const seenDest = new Set<string>();
//     let unsupportedKinds = 0;

//     for (const row of rows) {
//       const sourceField = String(row.source_field ?? "").trim();
//       const destinationField = String(row.destination_field ?? "").trim();
//       const transformKind = String(
//         row.transform_kind ?? "direct",
//       ).trim() as MappingTransformKind;
//       const constantValue = row.constant_value;

//       if (!destinationField) {
//         errors.push(`Rule ${row.id}: destination field is required.`);
//       }

//       if (transformKind === "constant") {
//         if (!String(constantValue ?? "").trim()) {
//           errors.push(
//             `Rule ${row.id}: constant mappings require a constant value.`,
//           );
//         }
//       } else if (!sourceField) {
//         errors.push(
//           `Rule ${row.id}: source field is required for ${transformKind} mappings.`,
//         );
//       }

//       if (!connectorRules.supportedTransforms.includes(transformKind)) {
//         unsupportedKinds += 1;
//         errors.push(
//           `Rule ${row.id}: transform kind "${transformKind}" is not supported for ${targetType}.`,
//         );
//       }

//       if (
//         transformKind !== "constant" &&
//         sourceField &&
//         !CANONICAL_SOURCE_PREFIXES.some((prefix) =>
//           sourceField.startsWith(prefix),
//         )
//       ) {
//         warnings.push(
//           `Rule ${row.id}: source path "${sourceField}" is outside the canonical source document prefixes (${CANONICAL_SOURCE_PREFIXES.join(", ")}).`,
//         );
//       }

//       if (seenDest.has(destinationField)) {
//         duplicateDest.add(destinationField);
//       }
//       if (destinationField) {
//         seenDest.add(destinationField);
//       }

//       if (
//         destinationField &&
//         connectorRules.allowedDestinationPrefixes.length > 0 &&
//         !connectorRules.allowedDestinationPrefixes.some((prefix) =>
//           destinationField.startsWith(prefix),
//         )
//       ) {
//         warnings.push(
//           `Rule ${row.id}: destination "${destinationField}" does not match the usual ${targetType} path prefixes (${connectorRules.allowedDestinationPrefixes.join(", ")}).`,
//         );
//       }
//     }

//     if (duplicateDest.size > 0) {
//       errors.push(
//         `Duplicate destination fields: ${Array.from(duplicateDest).sort().join(", ")}`,
//       );
//     }

//     const mappedDestinations = new Set(
//       rows
//         .map((row) => String(row.destination_field ?? "").trim())
//         .filter(Boolean),
//     );

//     for (const requiredDestination of connectorRules.requiredDestinations) {
//       if (!mappedDestinations.has(requiredDestination)) {
//         warnings.push(
//           `Recommended destination "${requiredDestination}" is not currently mapped for ${targetType}.`,
//         );
//       }
//     }

//     return {
//       ok: errors.length === 0,
//       message:
//         errors.length === 0
//           ? warnings.length === 0
//             ? "Mappings look valid."
//             : "Mappings are usable but have warnings."
//           : "Mappings need review.",
//       targetType,
//       errors,
//       warnings,
//       recommendations,
//       summary: {
//         enabledRules: rows.length,
//         duplicateDestinations: duplicateDest.size,
//         unsupportedKinds,
//       },
//     };
//   }
// }




import { randomUUID } from "crypto";
import { getDb } from "../db/db";
import {
  OpenMrsLisMetadataRequest,
  OpenMrsLisMetadataService,
} from "./openmrs-lis-metadata.service";

const nowIso = () => new Date().toISOString();

export type MappingTargetType = "DHIS2" | "OPENMRS" | "LIS" | "CUSTOM_HTTP";
export type MappingTransformKind = "direct" | "constant" | "lookup";

export const SUPPORTED_TARGET_TYPES: MappingTargetType[] = [
  "DHIS2",
  "OPENMRS",
  "LIS",
  "CUSTOM_HTTP",
];

const CANONICAL_SOURCE_PREFIXES = [
  "meta.",
  "normalized.",
  "patient.",
  "sample.",
  "specimen.",
  "order.",
  "result.",
  "source.",
  "target.",
  "raw.",
];

const CONNECTOR_RULES: Record<
  MappingTargetType,
  {
    allowedDestinationPrefixes: string[];
    requiredDestinations: string[];
    supportedTransforms: MappingTransformKind[];
    helperText: string[];
  }
> = {
  DHIS2: {
    allowedDestinationPrefixes: [
      "events[",
      "trackedEntities[",
      "event.",
      "tei.",
      "enrollment.",
      "attribute.",
    ],
    requiredDestinations: [],
    supportedTransforms: ["direct", "constant", "lookup"],
    helperText: [
      "Use indexed array paths like events[0].dataValues[0].value for DHIS2 event payloads.",
      "Use trackedEntities[0].attributes[0].value and nested enrollment/event paths for tracker payloads.",
      "Source paths come from the canonical source document, such as patient.id, result.value, or raw.<path>.",
    ],
  },
  OPENMRS: {
    allowedDestinationPrefixes: [
      "patient.",
      "encounter.",
      "visit.",
      "obs.",
      "identifier.",
      "payload.",
    ],
    requiredDestinations: ["patient.identifier", "encounter.encounterDatetime"],
    supportedTransforms: ["direct", "constant", "lookup"],
    helperText: [
      "Use encounter.* and obs.* destinations for clinical payloads.",
      "Keep patient.* destinations focused on identifier and demographic keys.",
    ],
  },
  LIS: {
    allowedDestinationPrefixes: [
      "patient.",
      "order.",
      "sample.",
      "specimen.",
      "result.",
      "instrument.",
      "payload.",
      "lis.",
      "body[]",
      "body[",
      "endpoint",
      "status.",
      "testedBy",
    ],
    requiredDestinations: ["lis.parameter.conceptUuid", "lis.valueCoded.uuid"],
    supportedTransforms: ["direct", "constant", "lookup"],
    helperText: [
      "For OpenMRS-backed LIS delivery, configure analyzer code → concept UUID and analyzer result value → coded answer UUID. Test allocation UUIDs are resolved dynamically from the sample allocation at delivery time when the sample label/UUID is present.",
      "Static analyzer code → allocation UUID mappings remain supported as an optional fallback only. They should not be treated as required because allocations are sample-specific.",
      "For coded test parameters, configure analyzer result values such as HPV16=POS → OpenMRS coded answer UUID.",
      "Constant LIS defaults such as endpoint, instrument UUID, testedBy, and result remarks are supported through lis.* destinations.",
    ],
  },
  CUSTOM_HTTP: {
    allowedDestinationPrefixes: [],
    requiredDestinations: [],
    supportedTransforms: ["direct", "constant"],
    helperText: [
      "Custom HTTP accepts free-form destination paths.",
      "Prefer direct and constant rules unless you have implemented lookup semantics intentionally.",
    ],
  },
};

export type OpenMrsLisMappingSeedInput = {
  endpoint?: string | null;
  instrumentUuid?: string | null;
  testedBy?: string | null;
  statusCategory?: string | null;
  statusStatus?: string | null;
  statusRemarks?: string | null;
  parameters: Array<{
    analyzerCode: string;
    analyzerAliases?: string[];
    conceptUuid?: string | null;
    allocationUuid?: string | null;
    datatype?: string | null;
    codedAnswers?: Array<{
      sourceValue: string;
      sourceAliases?: string[];
      destinationUuid: string;
      note?: string | null;
    }>;
  }>;
};

export class MappingsService {
  private readonly openMrsLisMetadata = new OpenMrsLisMetadataService();
  list() {
    const db = getDb();
    return db
      .prepare(
        `
                    SELECT *
                    FROM target_mappings
                    ORDER BY target_type ASC, source_field ASC
                `,
      )
      .all();
  }

  create(dto: any) {
    const db = getDb();
    const id = randomUUID();
    const ts = nowIso();

    db.prepare(
      `
                INSERT INTO target_mappings (
                    id,
                    target_type,
                    source_field,
                    destination_field,
                    transform_kind,
                    constant_value,
                    enabled,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
    ).run(
      id,
      dto.target_type,
      (dto.source_field ?? "").trim(),
      (dto.destination_field ?? "").trim(),
      dto.transform_kind ?? "direct",
      dto.constant_value ?? null,
      dto.enabled ?? 1,
      ts,
      ts,
    );

    return { id };
  }

  update(id: string, dto: any) {
    const db = getDb();

    db.prepare(
      `
                UPDATE target_mappings
                SET target_type = ?,
                    source_field = ?,
                    destination_field = ?,
                    transform_kind = ?,
                    constant_value = ?,
                    enabled = ?,
                    updated_at = ?
                WHERE id = ?
            `,
    ).run(
      dto.target_type,
      (dto.source_field ?? "").trim(),
      (dto.destination_field ?? "").trim(),
      dto.transform_kind ?? "direct",
      dto.constant_value ?? null,
      dto.enabled ?? 1,
      nowIso(),
      id,
    );

    return true;
  }

  delete(id: string) {
    const db = getDb();
    db.prepare(`DELETE FROM target_mappings WHERE id = ?`).run(id);
    return true;
  }

  discoverOpenMrsLisMetadata(input: OpenMrsLisMetadataRequest) {
    return this.openMrsLisMetadata.discover(input);
  }

  seedOpenMrsLisMappings(input: OpenMrsLisMappingSeedInput) {
    const db = getDb();
    const ts = nowIso();
    const summary = {
      rulesCreated: 0,
      rulesUpdated: 0,
      translationsCreated: 0,
      translationsUpdated: 0,
      skippedParameters: 0,
    };

    const inTransaction = db.transaction(() => {
      const constants = [
        {
          destination: "lis.endpoint",
          value: input.endpoint || "/openmrs/ws/rest/v1/lab/multipleresults",
        },
        {
          destination: "lis.defaults.instrumentUuid",
          value: input.instrumentUuid ?? null,
        },
        { destination: "lis.defaults.testedBy", value: input.testedBy ?? null },
        {
          destination: "lis.defaults.status.category",
          value: input.statusCategory || "RESULT_REMARKS",
        },
        {
          destination: "lis.defaults.status.status",
          value: input.statusStatus || "REMARKS",
        },
        {
          destination: "lis.defaults.status.remarks",
          value:
            input.statusRemarks ||
            "Imported from analyzer via machine interfacing",
        },
      ];

      for (const item of constants) {
        if (item.value == null || String(item.value).trim() === "") continue;
        this.upsertMappingRule(
          db,
          {
            target_type: "LIS",
            source_field: "",
            destination_field: item.destination,
            transform_kind: "constant",
            constant_value: String(item.value),
            enabled: 1,
            value_mapping_enabled: 0,
            unmapped_behavior: "PASSTHROUGH",
            default_destination_value: null,
          },
          summary,
          ts,
        );
      }

      const conceptRuleId = this.upsertMappingRule(
        db,
        {
          target_type: "LIS",
          source_field: "result.observations[].code",
          destination_field: "lis.parameter.conceptUuid",
          transform_kind: "lookup",
          constant_value: null,
          enabled: 1,
          value_mapping_enabled: 1,
          unmapped_behavior: "ERROR",
          default_destination_value: null,
        },
        summary,
        ts,
      );
      const allocationRuleId = this.upsertMappingRule(
        db,
        {
          target_type: "LIS",
          source_field: "result.observations[].code",
          destination_field: "lis.parameter.allocationUuid",
          transform_kind: "lookup",
          constant_value: null,
          enabled: 1,
          value_mapping_enabled: 1,
          unmapped_behavior: "PASSTHROUGH",
          default_destination_value: null,
        },
        summary,
        ts,
      );
      const datatypeRuleId = this.upsertMappingRule(
        db,
        {
          target_type: "LIS",
          source_field: "result.observations[].code",
          destination_field: "lis.parameter.datatype",
          transform_kind: "lookup",
          constant_value: null,
          enabled: 1,
          value_mapping_enabled: 1,
          unmapped_behavior: "DEFAULT_VALUE",
          default_destination_value: "text",
        },
        summary,
        ts,
      );
      const codedAnswerRuleId = this.upsertMappingRule(
        db,
        {
          target_type: "LIS",
          source_field:
            "result.observations[].code + result.observations[].value",
          destination_field: "lis.valueCoded.uuid",
          transform_kind: "lookup",
          constant_value: null,
          enabled: 1,
          value_mapping_enabled: 1,
          unmapped_behavior: "ERROR",
          default_destination_value: null,
        },
        summary,
        ts,
      );

      for (const parameter of input.parameters ?? []) {
        const codes = this.aliasValues(parameter.analyzerCode, parameter.analyzerAliases);
        if (codes.length === 0) {
          summary.skippedParameters += 1;
          continue;
        }

        for (const code of codes) {
          if (parameter.conceptUuid) {
            this.upsertTranslation(
              db,
              conceptRuleId,
              code,
              parameter.conceptUuid,
              "Analyzer code or OpenMRS alias to OpenMRS concept UUID",
              summary,
              ts,
            );
          }
          if (parameter.allocationUuid) {
            this.upsertTranslation(
              db,
              allocationRuleId,
              code,
              parameter.allocationUuid,
              "Optional fallback: analyzer code or OpenMRS alias to test allocation UUID for the selected sample",
              summary,
              ts,
            );
          }
          if (parameter.datatype) {
            this.upsertTranslation(
              db,
              datatypeRuleId,
              code,
              parameter.datatype,
              "Analyzer code or OpenMRS alias to OpenMRS datatype",
              summary,
              ts,
            );
          }
        }

        for (const answer of parameter.codedAnswers ?? []) {
          const answerCodes = this.aliasValues(answer.sourceValue, answer.sourceAliases);
          const answerUuid = String(answer.destinationUuid ?? "").trim();
          if (answerCodes.length === 0 || !answerUuid) continue;
          for (const code of codes) {
            for (const answerCode of answerCodes) {
              this.upsertTranslation(
                db,
                codedAnswerRuleId,
                `${code}=${answerCode}`,
                answerUuid,
                answer.note ?? "Analyzer coded result to OpenMRS answer UUID",
                summary,
                ts,
              );
            }
          }
        }
      }
    });

    inTransaction();
    return {
      ok: true,
      message: `LIS mapping seed completed. ${summary.rulesCreated} rules created, ${summary.rulesUpdated} rules updated, ${summary.translationsCreated} value mappings created, ${summary.translationsUpdated} value mappings updated.`,
      summary,
    };
  }

  private aliasValues(primary: any, aliases: any): string[] {
    const seen = new Set<string>();
    const rows: string[] = [];
    const push = (value: any) => {
      if (Array.isArray(value)) {
        value.forEach(push);
        return;
      }
      const text = String(value ?? "").trim();
      if (!text) return;
      const normalized = text.replace(/\.+$/, "").trim();
      for (const candidate of [text, normalized, normalized.toUpperCase()]) {
        const valueToKeep = String(candidate ?? "").trim();
        if (!valueToKeep) continue;
        const key = valueToKeep.toUpperCase();
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(valueToKeep);
      }
    };
    push(primary);
    push(aliases);
    return rows;
  }

  private upsertMappingRule(
    db: ReturnType<typeof getDb>,
    dto: any,
    summary: any,
    ts: string,
  ): string {
    const existing = db
      .prepare(
        `
                    SELECT id
                    FROM target_mappings
                    WHERE target_type = ? AND destination_field = ?
                    LIMIT 1
                `,
      )
      .get(dto.target_type, dto.destination_field) as
      | { id: string }
      | undefined;

    if (existing?.id) {
      db.prepare(
        `
                    UPDATE target_mappings
                    SET source_field = ?,
                        transform_kind = ?,
                        constant_value = ?,
                        enabled = ?,
                        value_mapping_enabled = ?,
                        unmapped_behavior = ?,
                        default_destination_value = ?,
                        updated_at = ?
                    WHERE id = ?
                `,
      ).run(
        String(dto.source_field ?? "").trim(),
        dto.transform_kind ?? "direct",
        dto.constant_value ?? null,
        dto.enabled ?? 1,
        dto.value_mapping_enabled ?? 0,
        dto.unmapped_behavior ?? "PASSTHROUGH",
        dto.default_destination_value ?? null,
        ts,
        existing.id,
      );
      summary.rulesUpdated += 1;
      return existing.id;
    }

    const id = randomUUID();
    db.prepare(
      `
                INSERT INTO target_mappings (
                    id,
                    target_type,
                    source_field,
                    destination_field,
                    transform_kind,
                    constant_value,
                    enabled,
                    value_mapping_enabled,
                    unmapped_behavior,
                    default_destination_value,
                    created_at,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
    ).run(
      id,
      dto.target_type,
      String(dto.source_field ?? "").trim(),
      String(dto.destination_field ?? "").trim(),
      dto.transform_kind ?? "direct",
      dto.constant_value ?? null,
      dto.enabled ?? 1,
      dto.value_mapping_enabled ?? 0,
      dto.unmapped_behavior ?? "PASSTHROUGH",
      dto.default_destination_value ?? null,
      ts,
      ts,
    );
    summary.rulesCreated += 1;
    return id;
  }

  private upsertTranslation(
    db: ReturnType<typeof getDb>,
    mappingRuleId: string,
    sourceValue: string,
    destinationValue: string,
    note: string,
    summary: any,
    ts: string,
  ) {
    const source = String(sourceValue ?? "").trim();
    const destination = String(destinationValue ?? "").trim();
    if (!source || !destination) return;

    const existing = db
      .prepare(
        `
                    SELECT id
                    FROM target_mapping_value_translations
                    WHERE mapping_rule_id = ? AND source_value = ?
                    LIMIT 1
                `,
      )
      .get(mappingRuleId, source) as { id: string } | undefined;

    if (existing?.id) {
      db.prepare(
        `
                    UPDATE target_mapping_value_translations
                    SET destination_value = ?,
                        enabled = 1,
                        note = ?,
                        updated_at = ?
                    WHERE id = ?
                `,
      ).run(destination, note, ts, existing.id);
      summary.translationsUpdated += 1;
      return;
    }

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
                ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
            `,
    ).run(randomUUID(), mappingRuleId, source, destination, note, ts, ts);
    summary.translationsCreated += 1;
  }

  validate(targetType: string) {
    if (!SUPPORTED_TARGET_TYPES.includes(targetType as MappingTargetType)) {
      return {
        ok: false,
        message: `Unsupported target type: ${targetType}`,
        targetType,
        errors: [`Unsupported target type: ${targetType}`],
        warnings: [],
        recommendations: [],
        summary: {
          enabledRules: 0,
          duplicateDestinations: 0,
          unsupportedKinds: 0,
        },
      };
    }

    const typedTarget = targetType as MappingTargetType;
    const connectorRules = CONNECTOR_RULES[typedTarget];

    const db = getDb();
    const rows = db
      .prepare(
        `
                    SELECT *
                    FROM target_mappings
                    WHERE target_type = ? AND enabled = 1
                    ORDER BY created_at ASC
                `,
      )
      .all(targetType) as any[];

    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [...connectorRules.helperText];

    if (rows.length === 0) {
      warnings.push(`No enabled mappings found for ${targetType}.`);
    }

    const duplicateDest = new Set<string>();
    const seenDest = new Set<string>();
    let unsupportedKinds = 0;

    for (const row of rows) {
      const sourceField = String(row.source_field ?? "").trim();
      const destinationField = String(row.destination_field ?? "").trim();
      const transformKind = String(
        row.transform_kind ?? "direct",
      ).trim() as MappingTransformKind;
      const constantValue = row.constant_value;

      if (!destinationField) {
        errors.push(`Rule ${row.id}: destination field is required.`);
      }

      if (transformKind === "constant") {
        if (!String(constantValue ?? "").trim()) {
          errors.push(
            `Rule ${row.id}: constant mappings require a constant value.`,
          );
        }
      } else if (!sourceField) {
        errors.push(
          `Rule ${row.id}: source field is required for ${transformKind} mappings.`,
        );
      }

      if (!connectorRules.supportedTransforms.includes(transformKind)) {
        unsupportedKinds += 1;
        errors.push(
          `Rule ${row.id}: transform kind "${transformKind}" is not supported for ${targetType}.`,
        );
      }

      if (
        transformKind !== "constant" &&
        sourceField &&
        !CANONICAL_SOURCE_PREFIXES.some((prefix) =>
          sourceField.startsWith(prefix),
        )
      ) {
        warnings.push(
          `Rule ${row.id}: source path "${sourceField}" is outside the canonical source document prefixes (${CANONICAL_SOURCE_PREFIXES.join(", ")}).`,
        );
      }

      if (seenDest.has(destinationField)) {
        duplicateDest.add(destinationField);
      }
      if (destinationField) {
        seenDest.add(destinationField);
      }

      if (
        destinationField &&
        connectorRules.allowedDestinationPrefixes.length > 0 &&
        !connectorRules.allowedDestinationPrefixes.some((prefix) =>
          destinationField.startsWith(prefix),
        )
      ) {
        warnings.push(
          `Rule ${row.id}: destination "${destinationField}" does not match the usual ${targetType} path prefixes (${connectorRules.allowedDestinationPrefixes.join(", ")}).`,
        );
      }
    }

    if (duplicateDest.size > 0) {
      errors.push(
        `Duplicate destination fields: ${Array.from(duplicateDest).sort().join(", ")}`,
      );
    }

    const mappedDestinations = new Set(
      rows
        .map((row) => String(row.destination_field ?? "").trim())
        .filter(Boolean),
    );

    for (const requiredDestination of connectorRules.requiredDestinations) {
      if (!mappedDestinations.has(requiredDestination)) {
        warnings.push(
          `Recommended destination "${requiredDestination}" is not currently mapped for ${targetType}.`,
        );
      }
    }

    return {
      ok: errors.length === 0,
      message:
        errors.length === 0
          ? warnings.length === 0
            ? "Mappings look valid."
            : "Mappings are usable but have warnings."
          : "Mappings need review.",
      targetType,
      errors,
      warnings,
      recommendations,
      summary: {
        enabledRules: rows.length,
        duplicateDestinations: duplicateDest.size,
        unsupportedKinds,
      },
    };
  }
}

