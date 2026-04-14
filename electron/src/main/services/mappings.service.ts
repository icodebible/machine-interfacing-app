import { randomUUID } from 'crypto';
import { getDb } from '../db/db';

const nowIso = () => new Date().toISOString();

export type MappingTargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';
export type MappingTransformKind = 'direct' | 'constant' | 'lookup';

export const SUPPORTED_TARGET_TYPES: MappingTargetType[] = [
    'DHIS2',
    'OPENMRS',
    'LIS',
    'CUSTOM_HTTP',
];

const CANONICAL_SOURCE_PREFIXES = [
    'meta.',
    'normalized.',
    'patient.',
    'sample.',
    'specimen.',
    'order.',
    'result.',
    'source.',
    'target.',
    'raw.',
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
        allowedDestinationPrefixes: ['events[', 'trackedEntities[', 'event.', 'tei.', 'enrollment.', 'attribute.'],
        requiredDestinations: [],
        supportedTransforms: ['direct', 'constant', 'lookup'],
        helperText: [
            'Use indexed array paths like events[0].dataValues[0].value for DHIS2 event payloads.',
            'Use trackedEntities[0].attributes[0].value and nested enrollment/event paths for tracker payloads.',
            'Source paths come from the canonical source document, such as patient.id, result.value, or raw.<path>.',
        ],
    },
    OPENMRS: {
        allowedDestinationPrefixes: ['patient.', 'encounter.', 'visit.', 'obs.', 'identifier.', 'payload.'],
        requiredDestinations: ['patient.identifier', 'encounter.encounterDatetime'],
        supportedTransforms: ['direct', 'constant', 'lookup'],
        helperText: [
            'Use encounter.* and obs.* destinations for clinical payloads.',
            'Keep patient.* destinations focused on identifier and demographic keys.',
        ],
    },
    LIS: {
        allowedDestinationPrefixes: ['patient.', 'order.', 'specimen.', 'result.', 'instrument.', 'payload.'],
        requiredDestinations: ['result.testCode', 'result.value'],
        supportedTransforms: ['direct', 'constant', 'lookup'],
        helperText: [
            'Model LIS payloads around specimen, order, and result groupings.',
            'Keep test code and result value explicitly mapped.',
        ],
    },
    CUSTOM_HTTP: {
        allowedDestinationPrefixes: [],
        requiredDestinations: [],
        supportedTransforms: ['direct', 'constant'],
        helperText: [
            'Custom HTTP accepts free-form destination paths.',
            'Prefer direct and constant rules unless you have implemented lookup semantics intentionally.',
        ],
    },
};

export class MappingsService {
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
            (dto.source_field ?? '').trim(),
            (dto.destination_field ?? '').trim(),
            dto.transform_kind ?? 'direct',
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
            (dto.source_field ?? '').trim(),
            (dto.destination_field ?? '').trim(),
            dto.transform_kind ?? 'direct',
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
            const sourceField = String(row.source_field ?? '').trim();
            const destinationField = String(row.destination_field ?? '').trim();
            const transformKind = String(row.transform_kind ?? 'direct').trim() as MappingTransformKind;
            const constantValue = row.constant_value;

            if (!destinationField) {
                errors.push(`Rule ${row.id}: destination field is required.`);
            }

            if (transformKind === 'constant') {
                if (!String(constantValue ?? '').trim()) {
                    errors.push(`Rule ${row.id}: constant mappings require a constant value.`);
                }
            } else if (!sourceField) {
                errors.push(`Rule ${row.id}: source field is required for ${transformKind} mappings.`);
            }

            if (!connectorRules.supportedTransforms.includes(transformKind)) {
                unsupportedKinds += 1;
                errors.push(
                    `Rule ${row.id}: transform kind "${transformKind}" is not supported for ${targetType}.`,
                );
            }

            if (
                transformKind !== 'constant' &&
                sourceField &&
                !CANONICAL_SOURCE_PREFIXES.some((prefix) => sourceField.startsWith(prefix))
            ) {
                warnings.push(
                    `Rule ${row.id}: source path "${sourceField}" is outside the canonical source document prefixes (${CANONICAL_SOURCE_PREFIXES.join(', ')}).`,
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
                !connectorRules.allowedDestinationPrefixes.some((prefix) => destinationField.startsWith(prefix))
            ) {
                warnings.push(
                    `Rule ${row.id}: destination "${destinationField}" does not match the usual ${targetType} path prefixes (${connectorRules.allowedDestinationPrefixes.join(', ')}).`,
                );
            }
        }

        if (duplicateDest.size > 0) {
            errors.push(`Duplicate destination fields: ${Array.from(duplicateDest).sort().join(', ')}`);
        }

        const mappedDestinations = new Set(
            rows.map((row) => String(row.destination_field ?? '').trim()).filter(Boolean),
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
                        ? 'Mappings look valid.'
                        : 'Mappings are usable but have warnings.'
                    : 'Mappings need review.',
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
