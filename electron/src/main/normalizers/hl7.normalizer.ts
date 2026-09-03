import { NormalizedLabResult, ResultNormalizer } from './normalizer.interface';
import { classifyHl7Result } from '../protocols/hl7-result-classifier';

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
        const classification = classifyHl7Result(parsed);

        if (!classification.reportable) return null;

        const patientId = d.patient?.id ?? null;
        const patientName = d.patient?.name ?? null;
        const sampleId = d.specimen?.id ?? d.order?.placerOrderNumber ?? null;
        const orderId = d.order?.placerOrderNumber ?? d.order?.fillerOrderNumber ?? sampleId;
        const observedAt = this.toOpenMrsDate(d.messageDateTime) ?? parsed.timestamp;

        const sourceObservations = classification.profile === 'COBAS_6800_HPV'
            ? classification.observations
            : observations;

        const normalizedResults = sourceObservations
            .filter((obx: any) => {
                if (classification.profile === 'COBAS_6800_HPV') return true;
                const code = normalizeCode(obx.code);
                if (!code || isOperationalObservation(code)) return false;
                return looksFinal(obx.resultStatus);
            })
            .map((obx: any) => {
                const isCobasHpv = classification.profile === 'COBAS_6800_HPV';
                const value = isCobasHpv ? obx.effectiveValue : (obx.value ?? obx.rawValue ?? null);
                const code = isCobasHpv ? obx.canonicalCode : (obx.code ?? null);
                return {
                    code,
                    sourceCode: obx.code ?? null,
                    name: obx.name ?? obx.code ?? code ?? null,
                    value,
                    rawValue: obx.rawValue ?? null,
                    interpretation: obx.interpretation ?? obx.abnormalFlag ?? null,
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
                };
            });

        if (!normalizedResults.length) return null;

        const first = normalizedResults[0];
        const resultObservedAt = normalizedResults
            .map((row) => row.observedAt)
            .find(Boolean) ?? observedAt;

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
            observedAt: resultObservedAt,
            sourceMessageType: parsed.messageType,
            summary: `HL7 ${parsed.messageType} · ${sampleId ?? 'No sample'} · ${normalizedResults.length} reportable result${normalizedResults.length === 1 ? '' : 's'}`,
            raw: parsed.raw,
            data: {
                ...d,
                resultClassification: classification,
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
