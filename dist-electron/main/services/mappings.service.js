"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MappingsService = exports.SUPPORTED_TARGET_TYPES = void 0;
const crypto_1 = require("crypto");
const db_1 = require("../db/db");
const openmrs_lis_metadata_service_1 = require("./openmrs-lis-metadata.service");
const nowIso = () => new Date().toISOString();
exports.SUPPORTED_TARGET_TYPES = [
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
const CONNECTOR_RULES = {
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
class MappingsService {
    openMrsLisMetadata = new openmrs_lis_metadata_service_1.OpenMrsLisMetadataService();
    list() {
        const db = (0, db_1.getDb)();
        return db
            .prepare(`
                    SELECT *
                    FROM target_mappings
                    ORDER BY target_type ASC, source_field ASC
                `)
            .all();
    }
    create(dto) {
        const db = (0, db_1.getDb)();
        const id = (0, crypto_1.randomUUID)();
        const ts = nowIso();
        db.prepare(`
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
            `).run(id, dto.target_type, (dto.source_field ?? "").trim(), (dto.destination_field ?? "").trim(), dto.transform_kind ?? "direct", dto.constant_value ?? null, dto.enabled ?? 1, ts, ts);
        return { id };
    }
    update(id, dto) {
        const db = (0, db_1.getDb)();
        db.prepare(`
                UPDATE target_mappings
                SET target_type = ?,
                    source_field = ?,
                    destination_field = ?,
                    transform_kind = ?,
                    constant_value = ?,
                    enabled = ?,
                    updated_at = ?
                WHERE id = ?
            `).run(dto.target_type, (dto.source_field ?? "").trim(), (dto.destination_field ?? "").trim(), dto.transform_kind ?? "direct", dto.constant_value ?? null, dto.enabled ?? 1, nowIso(), id);
        return true;
    }
    delete(id) {
        const db = (0, db_1.getDb)();
        db.prepare(`DELETE FROM target_mappings WHERE id = ?`).run(id);
        return true;
    }
    discoverOpenMrsLisMetadata(input) {
        return this.openMrsLisMetadata.discover(input);
    }
    seedOpenMrsLisMappings(input) {
        const db = (0, db_1.getDb)();
        const ts = nowIso();
        const summary = {
            rulesCreated: 0,
            rulesUpdated: 0,
            translationsCreated: 0,
            translationsUpdated: 0,
            skippedParameters: 0,
            profilesUpdated: 0,
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
                    value: input.statusRemarks ||
                        "Imported from analyzer via machine interfacing",
                },
            ];
            for (const item of constants) {
                if (item.value == null || String(item.value).trim() === "")
                    continue;
                this.upsertMappingRule(db, {
                    target_type: "LIS",
                    source_field: "",
                    destination_field: item.destination,
                    transform_kind: "constant",
                    constant_value: String(item.value),
                    enabled: 1,
                    value_mapping_enabled: 0,
                    unmapped_behavior: "PASSTHROUGH",
                    default_destination_value: null,
                }, summary, ts);
            }
            const conceptRuleId = this.upsertMappingRule(db, {
                target_type: "LIS",
                source_field: "result.observations[].code",
                destination_field: "lis.parameter.conceptUuid",
                transform_kind: "lookup",
                constant_value: null,
                enabled: 1,
                value_mapping_enabled: 1,
                unmapped_behavior: "ERROR",
                default_destination_value: null,
            }, summary, ts);
            const allocationRuleId = this.upsertMappingRule(db, {
                target_type: "LIS",
                source_field: "result.observations[].code",
                destination_field: "lis.parameter.allocationUuid",
                transform_kind: "lookup",
                constant_value: null,
                enabled: 1,
                value_mapping_enabled: 1,
                unmapped_behavior: "PASSTHROUGH",
                default_destination_value: null,
            }, summary, ts);
            const datatypeRuleId = this.upsertMappingRule(db, {
                target_type: "LIS",
                source_field: "result.observations[].code",
                destination_field: "lis.parameter.datatype",
                transform_kind: "lookup",
                constant_value: null,
                enabled: 1,
                value_mapping_enabled: 1,
                unmapped_behavior: "DEFAULT_VALUE",
                default_destination_value: "text",
            }, summary, ts);
            const codedAnswerRuleId = this.upsertMappingRule(db, {
                target_type: "LIS",
                source_field: "result.observations[].code + result.observations[].value",
                destination_field: "lis.valueCoded.uuid",
                transform_kind: "lookup",
                constant_value: null,
                enabled: 1,
                value_mapping_enabled: 1,
                unmapped_behavior: "ERROR",
                default_destination_value: null,
            }, summary, ts);
            for (const parameter of input.parameters ?? []) {
                const codes = this.aliasValues(parameter.analyzerCode, parameter.analyzerAliases);
                if (codes.length === 0) {
                    summary.skippedParameters += 1;
                    continue;
                }
                for (const code of codes) {
                    if (parameter.conceptUuid) {
                        this.upsertTranslation(db, conceptRuleId, code, parameter.conceptUuid, "Analyzer code or OpenMRS alias to OpenMRS concept UUID", summary, ts);
                    }
                    if (parameter.allocationUuid) {
                        this.upsertTranslation(db, allocationRuleId, code, parameter.allocationUuid, "Optional fallback: analyzer code or OpenMRS alias to test allocation UUID for the selected sample", summary, ts);
                    }
                    if (parameter.datatype) {
                        this.upsertTranslation(db, datatypeRuleId, code, parameter.datatype, "Analyzer code or OpenMRS alias to OpenMRS datatype", summary, ts);
                    }
                }
                for (const answer of parameter.codedAnswers ?? []) {
                    const answerCodes = this.aliasValues(answer.sourceValue, answer.sourceAliases);
                    const answerUuid = String(answer.destinationUuid ?? "").trim();
                    if (answerCodes.length === 0 || !answerUuid)
                        continue;
                    for (const code of codes) {
                        for (const answerCode of answerCodes) {
                            this.upsertTranslation(db, codedAnswerRuleId, `${code}=${answerCode}`, answerUuid, answer.note ?? "Analyzer coded result to OpenMRS answer UUID", summary, ts);
                        }
                    }
                }
            }
        });
        inTransaction();
        return {
            ok: true,
            message: `LIS mapping seed completed. ${summary.rulesCreated} rules created, ${summary.rulesUpdated} rules updated, ${summary.translationsCreated} value mappings created, ${summary.translationsUpdated} value mappings updated${summary.profilesUpdated ? `, ${summary.profilesUpdated} test-order profile(s) saved` : ''}.`,
            summary,
        };
    }
    normalizeLisTestOrderProfiles(profiles) {
        const rows = [];
        for (const profile of profiles ?? []) {
            const code = String(profile?.code ?? '').trim();
            const name = String(profile?.name ?? '').trim();
            const analyzerCodes = this.aliasValues(null, profile?.analyzerCodes ?? []).filter(Boolean);
            if (!code || !name || analyzerCodes.length === 0)
                continue;
            const requiredAnalyzerCodes = this.aliasValues(null, profile?.requiredAnalyzerCodes ?? []).filter((codeValue) => analyzerCodes.map((item) => item.toUpperCase()).includes(String(codeValue).toUpperCase()));
            rows.push({
                code,
                name,
                orderConceptUuid: String(profile?.orderConceptUuid ?? '').trim() || null,
                orderNameIncludes: this.aliasValues(null, profile?.orderNameIncludes ?? []),
                analyzerCodes,
                requiredAnalyzerCodes,
                parameters: (profile?.parameters ?? [])
                    .map((parameter) => ({
                    analyzerCode: String(parameter?.analyzerCode ?? '').trim(),
                    label: String(parameter?.label ?? parameter?.analyzerCode ?? '').trim() || null,
                    valueType: String(parameter?.valueType ?? 'text').trim().toLowerCase(),
                    required: !!parameter?.required,
                    conceptUuid: String(parameter?.conceptUuid ?? '').trim() || null,
                }))
                    .filter((parameter) => !!parameter.analyzerCode),
            });
        }
        return rows;
    }
    aliasValues(primary, aliases) {
        const seen = new Set();
        const rows = [];
        const push = (value) => {
            if (Array.isArray(value)) {
                value.forEach(push);
                return;
            }
            const text = String(value ?? "").trim();
            if (!text)
                return;
            const normalized = text.replace(/\.+$/, "").trim();
            for (const candidate of [text, normalized, normalized.toUpperCase()]) {
                const valueToKeep = String(candidate ?? "").trim();
                if (!valueToKeep)
                    continue;
                const key = valueToKeep.toUpperCase();
                if (seen.has(key))
                    continue;
                seen.add(key);
                rows.push(valueToKeep);
            }
        };
        push(primary);
        push(aliases);
        return rows;
    }
    upsertMappingRule(db, dto, summary, ts) {
        const existing = db
            .prepare(`
                    SELECT id
                    FROM target_mappings
                    WHERE target_type = ? AND destination_field = ?
                    LIMIT 1
                `)
            .get(dto.target_type, dto.destination_field);
        if (existing?.id) {
            db.prepare(`
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
                `).run(String(dto.source_field ?? "").trim(), dto.transform_kind ?? "direct", dto.constant_value ?? null, dto.enabled ?? 1, dto.value_mapping_enabled ?? 0, dto.unmapped_behavior ?? "PASSTHROUGH", dto.default_destination_value ?? null, ts, existing.id);
            summary.rulesUpdated += 1;
            return existing.id;
        }
        const id = (0, crypto_1.randomUUID)();
        db.prepare(`
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
            `).run(id, dto.target_type, String(dto.source_field ?? "").trim(), String(dto.destination_field ?? "").trim(), dto.transform_kind ?? "direct", dto.constant_value ?? null, dto.enabled ?? 1, dto.value_mapping_enabled ?? 0, dto.unmapped_behavior ?? "PASSTHROUGH", dto.default_destination_value ?? null, ts, ts);
        summary.rulesCreated += 1;
        return id;
    }
    upsertTranslation(db, mappingRuleId, sourceValue, destinationValue, note, summary, ts) {
        const source = String(sourceValue ?? "").trim();
        const destination = String(destinationValue ?? "").trim();
        if (!source || !destination)
            return;
        const existing = db
            .prepare(`
                    SELECT id
                    FROM target_mapping_value_translations
                    WHERE mapping_rule_id = ? AND source_value = ?
                    LIMIT 1
                `)
            .get(mappingRuleId, source);
        if (existing?.id) {
            db.prepare(`
                    UPDATE target_mapping_value_translations
                    SET destination_value = ?,
                        enabled = 1,
                        note = ?,
                        updated_at = ?
                    WHERE id = ?
                `).run(destination, note, ts, existing.id);
            summary.translationsUpdated += 1;
            return;
        }
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
                ) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
            `).run((0, crypto_1.randomUUID)(), mappingRuleId, source, destination, note, ts, ts);
        summary.translationsCreated += 1;
    }
    validate(targetType) {
        if (!exports.SUPPORTED_TARGET_TYPES.includes(targetType)) {
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
        const typedTarget = targetType;
        const connectorRules = CONNECTOR_RULES[typedTarget];
        const db = (0, db_1.getDb)();
        const rows = db
            .prepare(`
                    SELECT *
                    FROM target_mappings
                    WHERE target_type = ? AND enabled = 1
                    ORDER BY created_at ASC
                `)
            .all(targetType);
        const errors = [];
        const warnings = [];
        const recommendations = [...connectorRules.helperText];
        if (rows.length === 0) {
            warnings.push(`No enabled mappings found for ${targetType}.`);
        }
        const duplicateDest = new Set();
        const seenDest = new Set();
        let unsupportedKinds = 0;
        for (const row of rows) {
            const sourceField = String(row.source_field ?? "").trim();
            const destinationField = String(row.destination_field ?? "").trim();
            const transformKind = String(row.transform_kind ?? "direct").trim();
            const constantValue = row.constant_value;
            if (!destinationField) {
                errors.push(`Rule ${row.id}: destination field is required.`);
            }
            if (transformKind === "constant") {
                if (!String(constantValue ?? "").trim()) {
                    errors.push(`Rule ${row.id}: constant mappings require a constant value.`);
                }
            }
            else if (!sourceField) {
                errors.push(`Rule ${row.id}: source field is required for ${transformKind} mappings.`);
            }
            if (!connectorRules.supportedTransforms.includes(transformKind)) {
                unsupportedKinds += 1;
                errors.push(`Rule ${row.id}: transform kind "${transformKind}" is not supported for ${targetType}.`);
            }
            if (transformKind !== "constant" &&
                sourceField &&
                !CANONICAL_SOURCE_PREFIXES.some((prefix) => sourceField.startsWith(prefix))) {
                warnings.push(`Rule ${row.id}: source path "${sourceField}" is outside the canonical source document prefixes (${CANONICAL_SOURCE_PREFIXES.join(", ")}).`);
            }
            if (seenDest.has(destinationField)) {
                duplicateDest.add(destinationField);
            }
            if (destinationField) {
                seenDest.add(destinationField);
            }
            if (destinationField &&
                connectorRules.allowedDestinationPrefixes.length > 0 &&
                !connectorRules.allowedDestinationPrefixes.some((prefix) => destinationField.startsWith(prefix))) {
                warnings.push(`Rule ${row.id}: destination "${destinationField}" does not match the usual ${targetType} path prefixes (${connectorRules.allowedDestinationPrefixes.join(", ")}).`);
            }
        }
        if (duplicateDest.size > 0) {
            errors.push(`Duplicate destination fields: ${Array.from(duplicateDest).sort().join(", ")}`);
        }
        const mappedDestinations = new Set(rows
            .map((row) => String(row.destination_field ?? "").trim())
            .filter(Boolean));
        for (const requiredDestination of connectorRules.requiredDestinations) {
            if (!mappedDestinations.has(requiredDestination)) {
                warnings.push(`Recommended destination "${requiredDestination}" is not currently mapped for ${targetType}.`);
            }
        }
        return {
            ok: errors.length === 0,
            message: errors.length === 0
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
exports.MappingsService = MappingsService;
