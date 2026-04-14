"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomHttpTransformer = void 0;
class CustomHttpTransformer {
    buildPreview(target, result) {
        return {
            targetId: target.id,
            targetType: 'CUSTOM_HTTP',
            normalizedResultId: result.id,
            previewName: 'Custom HTTP Payload Preview',
            warnings: [],
            payload: {
                normalizedResultId: result.id,
                targetName: target.name,
                patientId: result.patient_id ?? null,
                patientName: result.patient_name ?? null,
                sampleId: result.sample_id ?? null,
                orderId: result.order_id ?? null,
                testCode: result.test_code ?? null,
                testName: result.test_name ?? null,
                value: result.value ?? null,
                units: result.units ?? null,
                referenceRange: result.reference_range ?? null,
                abnormalFlag: result.abnormal_flag ?? null,
                observedAt: result.observed_at ?? result.created_at,
                source: {
                    protocol: result.protocol,
                    machineId: result.machine_id,
                    sourceMessageType: result.source_message_type ?? null,
                    summary: result.summary ?? null,
                },
            },
        };
    }
}
exports.CustomHttpTransformer = CustomHttpTransformer;
