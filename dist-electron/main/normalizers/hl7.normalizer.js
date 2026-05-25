"use strict";
// import { NormalizedLabResult, ResultNormalizer } from './normalizer.interface';
Object.defineProperty(exports, "__esModule", { value: true });
exports.HL7Normalizer = void 0;
const normalizeCode = (value) => String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
const looksFinal = (status) => {
    const value = String(status ?? '').trim().toUpperCase();
    return !value || value === 'F' || value === 'C' || value === 'R';
};
const isOperationalObservation = (code) => {
    const normalized = normalizeCode(code);
    return ['PROCESSSTEP', 'PROCESSSTATUS', 'SYSTEMSTATUS', 'RUNSTATUS'].includes(normalized);
};
class HL7Normalizer {
    normalize(parsed) {
        const d = parsed.data ?? {};
        const observations = Array.isArray(d.observations) ? d.observations : [];
        const patientId = d.patient?.id ?? null;
        const patientName = d.patient?.name ?? null;
        const sampleId = d.specimen?.id ?? d.order?.placerOrderNumber ?? null;
        const orderId = d.order?.placerOrderNumber ?? d.order?.fillerOrderNumber ?? sampleId;
        const observedAt = this.toOpenMrsDate(d.messageDateTime) ?? parsed.timestamp;
        const normalizedResults = observations
            .filter((obx) => {
            const code = normalizeCode(obx.code);
            if (!code || isOperationalObservation(code))
                return false;
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
        if (!normalizedResults.length)
            return null;
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
    toOpenMrsDate(value) {
        const raw = String(value ?? '').trim();
        if (!raw)
            return null;
        if (/^\d{14}$/.test(raw)) {
            return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}.000+0000`;
        }
        if (/^\d{8}$/.test(raw)) {
            return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000+0000`;
        }
        return raw;
    }
}
exports.HL7Normalizer = HL7Normalizer;
