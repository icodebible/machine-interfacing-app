"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenMrsTransformer = void 0;
class OpenMrsTransformer {
    buildPreview(target, result) {
        const warnings = [];
        if (!result.patient_id)
            warnings.push('Patient identifier is missing.');
        if (!result.test_code)
            warnings.push('Test code is missing.');
        if (!result.value)
            warnings.push('Result value is missing.');
        return {
            targetId: target.id,
            targetType: 'OPENMRS',
            normalizedResultId: result.id,
            previewName: 'OpenMRS Lab Result Preview',
            warnings,
            payload: {
                patient: {
                    identifier: result.patient_id ?? null,
                    name: result.patient_name ?? null,
                },
                specimen: {
                    sampleId: result.sample_id ?? null,
                    orderId: result.order_id ?? null,
                },
                observation: {
                    concept: result.test_code ?? null,
                    conceptName: result.test_name ?? null,
                    value: result.value ?? null,
                    units: result.units ?? null,
                    referenceRange: result.reference_range ?? null,
                    abnormalFlag: result.abnormal_flag ?? null,
                    observedAt: result.observed_at ?? result.created_at,
                },
                source: {
                    protocol: result.protocol,
                    sourceMessageType: result.source_message_type ?? null,
                    machineId: result.machine_id,
                    summary: result.summary ?? null,
                },
            },
        };
    }
}
exports.OpenMrsTransformer = OpenMrsTransformer;
