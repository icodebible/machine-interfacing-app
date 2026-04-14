"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dhis2Transformer = void 0;
class Dhis2Transformer {
    buildPreview(target, result) {
        const warnings = [];
        if (!result.test_code)
            warnings.push('Test code is missing.');
        if (!result.value)
            warnings.push('Result value is missing.');
        return {
            targetId: target.id,
            targetType: 'DHIS2',
            normalizedResultId: result.id,
            previewName: 'DHIS2 Result Preview',
            warnings,
            payload: {
                eventDate: result.observed_at ?? result.created_at,
                trackedEntityInstance: result.patient_id ?? null,
                notes: result.summary ?? null,
                dataValues: [
                    { dataElement: result.test_code ?? null, value: result.value ?? null },
                    { dataElement: 'UNITS', value: result.units ?? null },
                    { dataElement: 'REFERENCE_RANGE', value: result.reference_range ?? null },
                    { dataElement: 'ABNORMAL_FLAG', value: result.abnormal_flag ?? null },
                    { dataElement: 'SAMPLE_ID', value: result.sample_id ?? null },
                ],
                source: {
                    protocol: result.protocol,
                    sourceMessageType: result.source_message_type ?? null,
                    machineId: result.machine_id,
                },
            },
        };
    }
}
exports.Dhis2Transformer = Dhis2Transformer;
