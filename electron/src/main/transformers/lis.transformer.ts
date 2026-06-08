// // import {
// //     NormalizedResultRecord,
// //     TargetRecord,
// //     TargetTransformer,
// //     TransformPreviewResult,
// // } from './target-transformer.interface';

// // export class LisTransformer implements TargetTransformer {
// //     buildPreview(target: TargetRecord, result: NormalizedResultRecord): TransformPreviewResult {
// //         const warnings: string[] = [];
// //         if (!result.sample_id) warnings.push('Sample identifier is missing.');
// //         if (!result.test_code) warnings.push('Test code is missing.');

// //         return {
// //             targetId: target.id,
// //             targetType: 'LIS',
// //             normalizedResultId: result.id,
// //             previewName: 'LIS Result Preview',
// //             warnings,
// //             payload: {
// //                 accessionNumber: result.order_id ?? null,
// //                 sampleId: result.sample_id ?? null,
// //                 patient: {
// //                     id: result.patient_id ?? null,
// //                     name: result.patient_name ?? null,
// //                 },
// //                 result: {
// //                     code: result.test_code ?? null,
// //                     name: result.test_name ?? null,
// //                     value: result.value ?? null,
// //                     units: result.units ?? null,
// //                     referenceRange: result.reference_range ?? null,
// //                     abnormalFlag: result.abnormal_flag ?? null,
// //                     observedAt: result.observed_at ?? result.created_at,
// //                 },
// //                 source: {
// //                     machineId: result.machine_id,
// //                     protocol: result.protocol,
// //                 },
// //             },
// //         };
// //     }
// // }

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

//         const rawData = this.tryParse(result.data_json) ?? {};
//         const lisBody = Array.isArray(rawData?.lis?.body) ? rawData.lis.body : null;

//         if (!lisBody?.length) {
//             warnings.push(
//                 'No LIS multiple-results payload was generated from the normalized result. Review parser, normalizer, and mapping configuration.',
//             );
//         }

//         return {
//             targetId: target.id,
//             targetType: 'LIS',
//             normalizedResultId: result.id,
//             previewName: 'OpenMRS LIS Multiple Results Preview',
//             warnings,
//             payload: lisBody?.length
//                 ? {
//                     method: rawData.lis.method ?? 'POST',
//                     endpoint: rawData.lis.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
//                     body: lisBody,
//                 }
//                 : {
//                     accessionNumber: result.order_id ?? null,
//                     sampleId: result.sample_id ?? null,
//                     patient: {
//                         id: result.patient_id ?? null,
//                         name: result.patient_name ?? null,
//                     },
//                     result: {
//                         code: result.test_code ?? null,
//                         name: result.test_name ?? null,
//                         value: result.value ?? null,
//                         units: result.units ?? null,
//                         referenceRange: result.reference_range ?? null,
//                         abnormalFlag: result.abnormal_flag ?? null,
//                         observedAt: result.observed_at ?? result.created_at,
//                     },
//                     source: {
//                         machineId: result.machine_id,
//                         protocol: result.protocol,
//                     },
//                 },
//         };
//     }

//     private tryParse(value: string | null | undefined) {
//         if (!value) return null;
//         try {
//             return JSON.parse(value);
//         } catch {
//             return null;
//         }
//     }
// }


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
        const lisBodySource = Array.isArray(rawData?.lis?.body)
            ? rawData.lis.body
            : Array.isArray(rawData?.lis?.multipleResultsPayload)
              ? rawData.lis.multipleResultsPayload
              : null;
        const lisBody = lisBodySource?.length ? this.enrichRows(lisBodySource, rawData, result) : null;

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
                    context: {
                        instrument: rawData?.lis?.instrument ?? rawData?.instrument ?? null,
                        testedBy: rawData?.lis?.defaults?.testedBy ?? rawData?.lis?.testedBy ?? rawData?.testedBy ?? null,
                    },
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

    private enrichRows(rows: any[], rawData: any, result: NormalizedResultRecord) {
        const lis = rawData?.lis ?? {};
        const instrumentUuid = this.firstText(
            lis?.defaults?.instrumentUuid,
            lis?.instrument?.uuid,
            rawData?.instrument?.uuid,
            rawData?.instrumentUuid,
            rawData?.instrument_uuid,
        );
        const testedBy = this.firstText(lis?.defaults?.testedBy, lis?.testedBy, rawData?.testedBy, rawData?.tested_by);
        const testedDate = this.firstText(lis?.defaults?.testedDate, lis?.testedDate, rawData?.testedDate, result.observed_at, result.created_at);

        return rows.map((row) => ({
            ...row,
            instrument: row?.instrument ?? (instrumentUuid ? { uuid: instrumentUuid } : undefined),
            testedDate: this.firstText(row?.testedDate, row?.observedAt, testedDate),
            testedBy: this.firstText(row?.testedBy, testedBy),
        }));
    }

    private firstText(...values: any[]): string | null {
        for (const value of values) {
            const text = String(value ?? '').trim();
            if (text) return text;
        }
        return null;
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
