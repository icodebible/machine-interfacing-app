// import { NormalizedLabResult, ResultNormalizer } from './normalizer.interface';

// export class HL7Normalizer implements ResultNormalizer {
//     normalize(parsed: {
//         machineId: string;
//         protocol: 'ASTM' | 'HL7' | 'RAW';
//         messageType: string;
//         summary: string;
//         data: Record<string, any>;
//         raw: string;
//         timestamp: string;
//     }): NormalizedLabResult | null {
//         const d = parsed.data ?? {};
//         const segments: string[] = Array.isArray(d.segments) ? d.segments : [];

//         const pid = segments.find((s) => s.startsWith('PID|'))?.split('|') ?? [];
//         const obr = segments.find((s) => s.startsWith('OBR|'))?.split('|') ?? [];
//         const obx = segments.find((s) => s.startsWith('OBX|'))?.split('|') ?? [];

//         const patientId = pid[3] ?? null;
//         const patientName = pid[5]?.replace(/\^/g, ' ') ?? null;
//         const orderId = obr[3] ?? null;
//         const testCode = obx[3] ?? obr[4] ?? null;
//         const value = obx[5] ?? null;
//         const units = obx[6] ?? null;
//         const referenceRange = obx[7] ?? null;
//         const abnormalFlag = obx[8] ?? null;

//         return {
//             machineId: parsed.machineId,
//             protocol: 'HL7',
//             sampleId: orderId,
//             patientId,
//             patientName,
//             orderId,
//             testCode,
//             testName: testCode,
//             value,
//             units,
//             referenceRange,
//             abnormalFlag,
//             observedAt: d.messageDateTime ?? parsed.timestamp,
//             sourceMessageType: parsed.messageType,
//             summary: parsed.summary,
//             raw: parsed.raw,
//             data: parsed.data ?? {},
//         };
//     }
// }



// import { NormalizedLabResult, ResultNormalizer } from './normalizer.interface';

// type ParsedLike = {
//     machineId: string;
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     messageType: string;
//     summary: string;
//     data: Record<string, any>;
//     raw: string;
//     timestamp: string;
// };

// type ParsedObservation = {
//     setId?: string | null;
//     valueType?: string | null;
//     code?: string | null;
//     name?: string | null;
//     codingSystem?: string | null;
//     rawValue?: string | null;
//     value?: string | null;
//     valueText?: string | null;
//     valueCodingSystem?: string | null;
//     units?: string | null;
//     referenceRange?: string | null;
//     abnormalFlag?: string | null;
//     resultStatus?: string | null;
//     responsibleObserver?: string | null;
//     instrumentRaw?: string | null;
//     observedAt?: string | null;
//     segment?: string | null;
// };

// type HpvParameterProfile = {
//     conceptUuid: string;
//     allocationUuid: string;
//     display: string;
//     allowed: Record<string, string>;
// };

// const LIS_CODED_ANSWERS = {
//     positive: '661d5907-1baf-4ac9-9db6-a3c4a3f09459',
//     negative: 'ba78d08f-0fe3-4634-80a3-8d0a13bc1ddd',
//     invalid: '58179ed1-68d8-4fc0-ab09-1baba1bc054b',
// };

// const HPV_PARAMETER_PROFILE: Record<string, HpvParameterProfile> = {
//     HPV16: {
//         conceptUuid: 'b82c8c16-842b-4450-ad78-659e224500d4',
//         allocationUuid: '1b76a53a-e874-4ccf-ae47-69668a648b2f',
//         display: 'HPV16',
//         allowed: {
//             POS: LIS_CODED_ANSWERS.positive,
//             POSITIVE: LIS_CODED_ANSWERS.positive,
//             DET: LIS_CODED_ANSWERS.positive,
//             DETECTED: LIS_CODED_ANSWERS.positive,
//             NEG: LIS_CODED_ANSWERS.negative,
//             NEGATIVE: LIS_CODED_ANSWERS.negative,
//             ND: LIS_CODED_ANSWERS.negative,
//             NOTDETECTED: LIS_CODED_ANSWERS.negative,
//         },
//     },
//     HPV18: {
//         conceptUuid: 'dd9881f8-bb87-4ce1-b8b2-3144f47f3e81',
//         allocationUuid: '30eaca8a-8638-4aa9-9cbd-965bdc816414',
//         display: 'HPV18',
//         allowed: {
//             POS: LIS_CODED_ANSWERS.positive,
//             POSITIVE: LIS_CODED_ANSWERS.positive,
//             DET: LIS_CODED_ANSWERS.positive,
//             DETECTED: LIS_CODED_ANSWERS.positive,
//             NEG: LIS_CODED_ANSWERS.negative,
//             NEGATIVE: LIS_CODED_ANSWERS.negative,
//             ND: LIS_CODED_ANSWERS.negative,
//             NOTDETECTED: LIS_CODED_ANSWERS.negative,
//         },
//     },
//     HRHPV: {
//         conceptUuid: '733bfe2b-aeee-4a83-b762-eaf175135491',
//         allocationUuid: 'e512c08a-104a-4ef9-96cb-000d1883d30a',
//         display: 'Hr-HPV',
//         allowed: {
//             POS: LIS_CODED_ANSWERS.positive,
//             POSITIVE: LIS_CODED_ANSWERS.positive,
//             DET: LIS_CODED_ANSWERS.positive,
//             DETECTED: LIS_CODED_ANSWERS.positive,
//             NEG: LIS_CODED_ANSWERS.negative,
//             NEGATIVE: LIS_CODED_ANSWERS.negative,
//             ND: LIS_CODED_ANSWERS.negative,
//             NOTDETECTED: LIS_CODED_ANSWERS.negative,
//             IN: LIS_CODED_ANSWERS.invalid,
//             INVALID: LIS_CODED_ANSWERS.invalid,
//             INVALIDRESULT: LIS_CODED_ANSWERS.invalid,
//         },
//     },
//     HPVHR: {
//         conceptUuid: '733bfe2b-aeee-4a83-b762-eaf175135491',
//         allocationUuid: 'e512c08a-104a-4ef9-96cb-000d1883d30a',
//         display: 'Hr-HPV',
//         allowed: {
//             POS: LIS_CODED_ANSWERS.positive,
//             POSITIVE: LIS_CODED_ANSWERS.positive,
//             DET: LIS_CODED_ANSWERS.positive,
//             DETECTED: LIS_CODED_ANSWERS.positive,
//             NEG: LIS_CODED_ANSWERS.negative,
//             NEGATIVE: LIS_CODED_ANSWERS.negative,
//             ND: LIS_CODED_ANSWERS.negative,
//             NOTDETECTED: LIS_CODED_ANSWERS.negative,
//             IN: LIS_CODED_ANSWERS.invalid,
//             INVALID: LIS_CODED_ANSWERS.invalid,
//             INVALIDRESULT: LIS_CODED_ANSWERS.invalid,
//         },
//     },
//     OTHERHIGHRISKHPV: {
//         conceptUuid: '733bfe2b-aeee-4a83-b762-eaf175135491',
//         allocationUuid: 'e512c08a-104a-4ef9-96cb-000d1883d30a',
//         display: 'Hr-HPV',
//         allowed: {
//             POS: LIS_CODED_ANSWERS.positive,
//             POSITIVE: LIS_CODED_ANSWERS.positive,
//             DET: LIS_CODED_ANSWERS.positive,
//             DETECTED: LIS_CODED_ANSWERS.positive,
//             NEG: LIS_CODED_ANSWERS.negative,
//             NEGATIVE: LIS_CODED_ANSWERS.negative,
//             ND: LIS_CODED_ANSWERS.negative,
//             NOTDETECTED: LIS_CODED_ANSWERS.negative,
//             IN: LIS_CODED_ANSWERS.invalid,
//             INVALID: LIS_CODED_ANSWERS.invalid,
//             INVALIDRESULT: LIS_CODED_ANSWERS.invalid,
//         },
//     },
// };

// const normalizeCode = (value: any) =>
//     String(value ?? '')
//         .trim()
//         .toUpperCase()
//         .replace(/[^A-Z0-9]/g, '');

// const field = (fields: string[], index: number) => fields[index] ?? null;

// const component = (value?: string | null) => {
//     const parts = String(value ?? '').split('^');
//     return {
//         identifier: parts[0] || null,
//         text: parts[1] || null,
//         codingSystem: parts[2] || null,
//     };
// };

// const looksFinal = (status: any) => {
//     const s = String(status ?? '')
//         .trim()
//         .toUpperCase();
//     return !s || s === 'F' || s === 'C' || s === 'R';
// };

// export class HL7Normalizer implements ResultNormalizer {
//     normalize(parsed: ParsedLike): NormalizedLabResult | null {
//         const d = parsed.data ?? {};
//         const segments: string[] = Array.isArray(d.segments) ? d.segments : [];
//         const observations = this.extractObservations(d, segments);

//         const patient = this.extractPatient(d, segments);
//         const specimen = this.extractSpecimen(d, segments);
//         const order = this.extractOrder(d, segments);

//         const sampleId = specimen.id ?? order.placerOrderNumber ?? order.fillerOrderNumber ?? null;
//         const orderId = order.placerOrderNumber ?? order.fillerOrderNumber ?? sampleId;
//         const observedAt = this.toIsoDate(d.messageDateTime) ?? parsed.timestamp;

//         const resultObservations = observations.filter((obx) => {
//             const code = normalizeCode(obx.code);
//             const hasValue = String(obx.value ?? obx.rawValue ?? '').trim().length > 0;
//             if (!code || code === 'PROCESSSTEP' || !hasValue) return false;
//             return looksFinal(obx.resultStatus);
//         });

//         if (!resultObservations.length) {
//             return null;
//         }

//         const normalizedResults = resultObservations.map((obx) => ({
//             code: obx.code ?? null,
//             name: obx.name ?? obx.code ?? null,
//             value: obx.value ?? obx.rawValue ?? null,
//             valueText: obx.valueText ?? null,
//             valueType: obx.valueType ?? null,
//             units: obx.units ?? null,
//             referenceRange: obx.referenceRange ?? null,
//             abnormalFlag: obx.abnormalFlag ?? null,
//             resultStatus: obx.resultStatus ?? null,
//             observedAt: this.toIsoDate(obx.observedAt) ?? observedAt,
//             instrumentRaw: obx.instrumentRaw ?? null,
//         }));

//         const lisPayload = this.buildHpvLisPayload(normalizedResults, observedAt);
//         const first = normalizedResults[0];

//         return {
//             machineId: parsed.machineId,
//             protocol: 'HL7',
//             sampleId,
//             patientId: patient.id,
//             patientName: patient.name,
//             orderId,
//             testCode: order.testCode ?? first?.code ?? null,
//             testName: order.testName ?? first?.name ?? null,
//             value: normalizedResults.map((r) => `${r.code}=${r.value}`).join('; '),
//             units: first?.units ?? null,
//             referenceRange: first?.referenceRange ?? null,
//             abnormalFlag: first?.abnormalFlag ?? null,
//             observedAt,
//             sourceMessageType: parsed.messageType,
//             summary: `HL7 ${parsed.messageType} · ${sampleId ?? 'No sample'} · ${normalizedResults.length} result${normalizedResults.length === 1 ? '' : 's'}`,
//             raw: parsed.raw,
//             data: {
//                 ...d,
//                 patient,
//                 specimen,
//                 order,
//                 observations,
//                 normalizedResults,
//                 resultCount: normalizedResults.length,
//                 lis: lisPayload
//                     ? {
//                         method: 'POST',
//                         endpoint: '/openmrs/ws/rest/v1/lab/multipleresults',
//                         sampleUuid: 'ec2c9ec1-e742-4f89-979a-01560a607d01',
//                         sampleLabel: sampleId,
//                         orderNumber: orderId,
//                         orderUuid: '14274d15-3e8f-48e8-a649-1d6ddd1d6914',
//                         testOrderConceptUuid: '3b370167-83de-4590-b35e-88dd3b6f2f22',
//                         body: lisPayload,
//                     }
//                     : null,
//             },
//         };
//     }

//     private extractObservations(data: Record<string, any>, segments: string[]): ParsedObservation[] {
//         const structured = Array.isArray(data.observations) ? data.observations : [];
//         if (structured.length > 0) return structured as ParsedObservation[];

//         const messageDateTime = data.messageDateTime ?? this.extractMshDateTime(segments);

//         return segments
//             .filter((segment) => segment.startsWith('OBX|'))
//             .map((segment) => {
//                 const fields = segment.split('|');
//                 const code = component(field(fields, 3));
//                 const value = component(field(fields, 5));
//                 const equipmentRaw = field(fields, 18);

//                 return {
//                     setId: field(fields, 1),
//                     valueType: field(fields, 2),
//                     code: code.identifier,
//                     name: code.text ?? code.identifier,
//                     codingSystem: code.codingSystem,
//                     rawValue: field(fields, 5),
//                     value: value.identifier ?? field(fields, 5),
//                     valueText: value.text,
//                     valueCodingSystem: value.codingSystem,
//                     units: field(fields, 6),
//                     referenceRange: field(fields, 7),
//                     abnormalFlag: field(fields, 8),
//                     resultStatus: field(fields, 11),
//                     responsibleObserver: field(fields, 16),
//                     instrumentRaw: equipmentRaw,
//                     observedAt: field(fields, 19) ?? messageDateTime,
//                     segment,
//                 };
//             });
//     }

//     private extractPatient(data: Record<string, any>, segments: string[]) {
//         if (data.patient && typeof data.patient === 'object') {
//             return {
//                 id: data.patient.id ?? null,
//                 name: data.patient.name ?? null,
//                 sex: data.patient.sex ?? null,
//                 birthDate: data.patient.birthDate ?? null,
//             };
//         }

//         const pid = segments.find((s) => s.startsWith('PID|'))?.split('|') ?? [];
//         return {
//             id: component(field(pid, 3)).identifier ?? field(pid, 3),
//             name: field(pid, 5)?.replace(/\^/g, ' ').replace(/\s+/g, ' ').trim() || null,
//             sex: field(pid, 8),
//             birthDate: field(pid, 7),
//         };
//     }

//     private extractSpecimen(data: Record<string, any>, segments: string[]) {
//         if (data.specimen && typeof data.specimen === 'object') {
//             return {
//                 id: data.specimen.id ?? null,
//                 text: data.specimen.text ?? null,
//                 raw: data.specimen.raw ?? null,
//                 type: data.specimen.type ?? null,
//                 collectedAt: data.specimen.collectedAt ?? null,
//             };
//         }

//         const spm = segments.find((s) => s.startsWith('SPM|'))?.split('|') ?? [];
//         const specimen = component(field(spm, 2));
//         return {
//             id: specimen.identifier,
//             text: specimen.text,
//             raw: field(spm, 2),
//             type: component(field(spm, 4)),
//             collectedAt: field(spm, 17) ?? field(spm, 26),
//         };
//     }

//     private extractOrder(data: Record<string, any>, segments: string[]) {
//         if (data.order && typeof data.order === 'object') {
//             return {
//                 placerOrderNumber: data.order.placerOrderNumber ?? null,
//                 fillerOrderNumber: data.order.fillerOrderNumber ?? null,
//                 testCode: data.order.testCode ?? null,
//                 testName: data.order.testName ?? null,
//                 codingSystem: data.order.codingSystem ?? null,
//                 status: data.order.status ?? null,
//             };
//         }

//         const orc = segments.find((s) => s.startsWith('ORC|'))?.split('|') ?? [];
//         const obr = segments.find((s) => s.startsWith('OBR|'))?.split('|') ?? [];
//         const placerOrder = component(field(orc, 2) ?? field(obr, 2));
//         const fillerOrder = component(field(orc, 3) ?? field(obr, 3));
//         const universalService = component(field(obr, 4));

//         return {
//             placerOrderNumber: placerOrder.identifier,
//             fillerOrderNumber: fillerOrder.identifier,
//             testCode: universalService.identifier,
//             testName: universalService.text ?? universalService.identifier,
//             codingSystem: universalService.codingSystem,
//             status: field(obr, 25),
//         };
//     }

//     private extractMshDateTime(segments: string[]) {
//         const msh = segments.find((s) => s.startsWith('MSH|'))?.split('|') ?? [];
//         return field(msh, 6);
//     }

//     private buildHpvLisPayload(results: any[], fallbackObservedAt: string | null) {
//         const rows = results
//             .map((result) => {
//                 const profile = HPV_PARAMETER_PROFILE[normalizeCode(result.code)];
//                 if (!profile) return null;

//                 const answerUuid = profile.allowed[normalizeCode(result.value ?? result.valueText)];
//                 if (!answerUuid) return null;

//                 return {
//                     concept: { uuid: profile.conceptUuid },
//                     testAllocation: { uuid: profile.allocationUuid },
//                     valueNumeric: null,
//                     valueText: null,
//                     valueCoded: { uuid: answerUuid },
//                     abnormal: false,
//                     instrument: { uuid: 'd1217680-41ab-4e5e-bf50-10d780006cf4' },
//                     status: {
//                         category: 'RESULT_REMARKS',
//                         status: 'REMARKS',
//                         remarks: 'Imported from COBAS6800/8800 via machine interfacing',
//                     },
//                     testedDate: result.observedAt ?? fallbackObservedAt,
//                     testedBy: '2b54ca73-3e07-487f-a935-d5dfea854f92',
//                 };
//             })
//             .filter(Boolean);

//         return rows.length ? rows : null;
//     }

//     private toIsoDate(value: any): string | null {
//         const raw = String(value ?? '').trim();
//         if (!raw) return null;

//         if (/^\d{14}$/.test(raw)) {
//             const y = raw.slice(0, 4);
//             const mo = raw.slice(4, 6);
//             const d = raw.slice(6, 8);
//             const h = raw.slice(8, 10);
//             const mi = raw.slice(10, 12);
//             const s = raw.slice(12, 14);
//             return `${y}-${mo}-${d}T${h}:${mi}:${s}.000+0000`;
//         }

//         if (/^\d{8}$/.test(raw)) {
//             return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000+0000`;
//         }

//         return raw;
//     }
// }

import { NormalizedLabResult, ResultNormalizer } from './normalizer.interface';

type ParsedLike = {
    machineId: string;
    protocol: 'ASTM' | 'HL7' | 'RAW';
    messageType: string;
    summary: string;
    data: Record<string, any>;
    raw: string;
    timestamp: string;
};

const normalizeCode = (value: any) =>
    String(value ?? '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

const looksFinal = (status: any) => {
    const value = String(status ?? '').trim().toUpperCase();
    return !value || value === 'F' || value === 'C' || value === 'R';
};

const isOperationalObservation = (code: any) => {
    const normalized = normalizeCode(code);
    return ['PROCESSSTEP', 'PROCESSSTATUS', 'SYSTEMSTATUS', 'RUNSTATUS'].includes(normalized);
};

export class HL7Normalizer implements ResultNormalizer {
    normalize(parsed: ParsedLike): NormalizedLabResult | null {
        const d = parsed.data ?? {};
        const observations: any[] = Array.isArray(d.observations) ? d.observations : [];

        const patientId = d.patient?.id ?? null;
        const patientName = d.patient?.name ?? null;
        const sampleId = d.specimen?.id ?? d.order?.placerOrderNumber ?? null;
        const orderId = d.order?.placerOrderNumber ?? d.order?.fillerOrderNumber ?? sampleId;
        const observedAt = this.toOpenMrsDate(d.messageDateTime) ?? parsed.timestamp;

        const normalizedResults = observations
            .filter((obx) => {
                const code = normalizeCode(obx.code);
                if (!code || isOperationalObservation(code)) return false;
                return looksFinal(obx.resultStatus);
            })
            .map((obx) => ({
                code: obx.code ?? null,
                name: obx.name ?? obx.code ?? null,
                value: obx.value ?? obx.rawValue ?? null,
                rawValue: obx.rawValue ?? null,
                valueText: obx.valueText ?? null,
                valueType: obx.valueType ?? null,
                valueCodingSystem: obx.valueCodingSystem ?? null,
                codingSystem: obx.codingSystem ?? null,
                units: obx.units ?? null,
                referenceRange: obx.referenceRange ?? null,
                abnormalFlag: obx.abnormalFlag ?? null,
                resultStatus: obx.resultStatus ?? null,
                observedAt: this.toOpenMrsDate(obx.observedAt) ?? observedAt,
                instrumentRaw: obx.instrumentRaw ?? null,
                equipment: Array.isArray(obx.equipment) ? obx.equipment : [],
            }));

        if (!normalizedResults.length) return null;

        const first = normalizedResults[0];

        return {
            machineId: parsed.machineId,
            protocol: 'HL7',
            sampleId,
            patientId,
            patientName,
            orderId,
            testCode: d.order?.testCode ?? first?.code ?? null,
            testName: d.order?.testName ?? first?.name ?? null,
            value: normalizedResults.map((result) => `${result.code}=${result.value}`).join('; '),
            units: first?.units ?? null,
            referenceRange: first?.referenceRange ?? null,
            abnormalFlag: first?.abnormalFlag ?? null,
            observedAt,
            sourceMessageType: parsed.messageType,
            summary: `HL7 ${parsed.messageType} · ${sampleId ?? 'No sample'} · ${normalizedResults.length} final result${normalizedResults.length === 1 ? '' : 's'}`,
            raw: parsed.raw,
            data: {
                ...d,
                sample: {
                    label: sampleId,
                    uuid: null,
                },
                order: {
                    ...d.order,
                    id: orderId,
                    uuid: null,
                },
                observations: normalizedResults,
                normalizedResults,
                resultCount: normalizedResults.length,
                lis: null,
            },
        };
    }

    private toOpenMrsDate(value: any): string | null {
        const raw = String(value ?? '').trim();
        if (!raw) return null;

        if (/^\d{14}$/.test(raw)) {
            return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}.000+0000`;
        }

        if (/^\d{8}$/.test(raw)) {
            return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000+0000`;
        }

        return raw;
    }
}

