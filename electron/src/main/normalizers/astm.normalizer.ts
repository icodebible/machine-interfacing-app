// import { NormalizedLabResult, ResultNormalizer } from './normalizer.interface';

// export class ASTMNormalizer implements ResultNormalizer {
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

//         return {
//             machineId: parsed.machineId,
//             protocol: 'ASTM',
//             sampleId: d.sampleId ?? null,
//             patientId: d.patientId ?? null,
//             patientName: d.patientName ?? null,
//             orderId: d.orderId ?? null,
//             testCode: d.testCode ?? null,
//             testName: d.testName ?? d.testCode ?? null,
//             value: d.resultValue ?? null,
//             units: d.units ?? null,
//             referenceRange: d.referenceRange ?? null,
//             abnormalFlag: d.abnormalFlag ?? null,
//             observedAt: parsed.timestamp,
//             sourceMessageType: parsed.messageType,
//             summary: parsed.summary,
//             raw: parsed.raw,
//             data: parsed.data ?? {},
//         };
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

const looksFinal = (status: any) => {
    const value = String(status ?? '').trim().toUpperCase();
    return !value || value === 'F' || value === 'C' || value === 'R';
};

export class ASTMNormalizer implements ResultNormalizer {
    normalize(parsed: ParsedLike): NormalizedLabResult | null {
        const d = parsed.data ?? {};
        const observations: any[] = Array.isArray(d.observations) ? d.observations : [];
        const normalizedResults = observations
            .filter((row) => looksFinal(row.resultStatus))
            .map((row) => ({
                code: row.code ?? null,
                name: row.name ?? row.code ?? null,
                value: row.value ?? row.rawValue ?? null,
                rawValue: row.rawValue ?? null,
                valueText: row.value == null ? null : String(row.value),
                valueType: inferValueType(row.value),
                units: row.units ?? null,
                referenceRange: row.referenceRange ?? null,
                abnormalFlag: row.abnormalFlag ?? null,
                resultStatus: row.resultStatus ?? null,
                observedAt: toOpenMrsDate(row.observedAt) ?? parsed.timestamp,
            }));

        if (!normalizedResults.length) return null;

        const first = normalizedResults[0];
        const sampleId = d.specimen?.id ?? d.order?.placerOrderNumber ?? null;
        const observedAt = first?.observedAt ?? parsed.timestamp;

        return {
            machineId: parsed.machineId,
            protocol: 'ASTM',
            sampleId,
            patientId: d.patient?.id ?? null,
            patientName: d.patient?.name ?? null,
            orderId: d.order?.placerOrderNumber ?? sampleId,
            testCode: d.order?.testCode ?? first?.code ?? null,
            testName: d.order?.testName ?? first?.name ?? null,
            value: normalizedResults.map((result) => `${result.code}=${result.value}`).join('; '),
            units: first?.units ?? null,
            referenceRange: first?.referenceRange ?? null,
            abnormalFlag: first?.abnormalFlag ?? null,
            observedAt,
            sourceMessageType: parsed.messageType,
            summary: `ASTM ${parsed.messageType} · ${sampleId ?? 'No sample'} · ${normalizedResults.length} final result${normalizedResults.length === 1 ? '' : 's'}`,
            raw: parsed.raw,
            data: {
                ...d,
                sample: {
                    label: sampleId,
                    uuid: null,
                },
                order: {
                    ...d.order,
                    id: d.order?.placerOrderNumber ?? sampleId,
                    uuid: null,
                },
                observations: normalizedResults,
                normalizedResults,
                resultCount: normalizedResults.length,
                lis: null,
            },
        };
    }
}

function inferValueType(value: any) {
    if (value == null) return 'ST';
    const text = String(value).trim();
    return /^-?\d+(\.\d+)?$/.test(text) ? 'NM' : 'ST';
}

function toOpenMrsDate(value: any) {
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
