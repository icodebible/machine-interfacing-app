// import {
//     NormalizedResultRecord,
//     TargetRecord,
//     TargetTransformer,
//     TransformPreviewResult,
// } from './target-transformer.interface';

// export class LisTransformer implements TargetTransformer {
//     buildPreview(target: TargetRecord, result: NormalizedResultRecord): TransformPreviewResult {
//         const warnings: string[] = [];
//         if (!result.sample_id) warnings.push('Sample identifier is missing.');
//         if (!result.test_code) warnings.push('Test code is missing.');

//         return {
//             targetId: target.id,
//             targetType: 'LIS',
//             normalizedResultId: result.id,
//             previewName: 'LIS Result Preview',
//             warnings,
//             payload: {
//                 accessionNumber: result.order_id ?? null,
//                 sampleId: result.sample_id ?? null,
//                 patient: {
//                     id: result.patient_id ?? null,
//                     name: result.patient_name ?? null,
//                 },
//                 result: {
//                     code: result.test_code ?? null,
//                     name: result.test_name ?? null,
//                     value: result.value ?? null,
//                     units: result.units ?? null,
//                     referenceRange: result.reference_range ?? null,
//                     abnormalFlag: result.abnormal_flag ?? null,
//                     observedAt: result.observed_at ?? result.created_at,
//                 },
//                 source: {
//                     machineId: result.machine_id,
//                     protocol: result.protocol,
//                 },
//             },
//         };
//     }
// }

import {
    NormalizedResultRecord,
    TargetRecord,
    TargetTransformer,
    TransformPreviewResult,
} from './target-transformer.interface';

export class LisTransformer implements TargetTransformer {
    buildPreview(target: TargetRecord, result: NormalizedResultRecord): TransformPreviewResult {
        const warnings: string[] = [];
        if (!result.sample_id) warnings.push('Sample identifier is missing.');
        if (!result.test_code) warnings.push('Test code is missing.');

        const rawData = this.tryParse(result.data_json) ?? {};
        const lisBody = Array.isArray(rawData?.lis?.body) ? rawData.lis.body : null;

        if (!lisBody?.length) {
            warnings.push(
                'No LIS multiple-results payload was generated from the normalized result. Review parser, normalizer, and mapping configuration.',
            );
        }

        return {
            targetId: target.id,
            targetType: 'LIS',
            normalizedResultId: result.id,
            previewName: 'OpenMRS LIS Multiple Results Preview',
            warnings,
            payload: lisBody?.length
                ? {
                    method: rawData.lis.method ?? 'POST',
                    endpoint: rawData.lis.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
                    body: lisBody,
                }
                : {
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

    private tryParse(value: string | null | undefined) {
        if (!value) return null;
        try {
            return JSON.parse(value);
        } catch {
            return null;
        }
    }
}
