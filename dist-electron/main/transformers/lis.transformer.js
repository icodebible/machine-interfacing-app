"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LisTransformer = void 0;
class LisTransformer {
    buildPreview(target, result) {
        const warnings = [];
        if (!result.sample_id)
            warnings.push('Sample identifier is missing.');
        if (!result.test_code)
            warnings.push('Test code is missing.');
        return {
            targetId: target.id,
            targetType: 'LIS',
            normalizedResultId: result.id,
            previewName: 'LIS Result Preview',
            warnings,
            payload: {
                accessionNumber: result.order_id ?? null,
                sampleId: result.sample_id ?? null,
                patient: {
                    id: result.patient_id ?? null,
                    name: result.patient_name ?? null,
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
                },
            },
        };
    }
}
exports.LisTransformer = LisTransformer;
