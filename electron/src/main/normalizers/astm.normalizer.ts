import { NormalizedLabResult, ResultNormalizer } from './normalizer.interface';

export class ASTMNormalizer implements ResultNormalizer {
    normalize(parsed: {
        machineId: string;
        protocol: 'ASTM' | 'HL7' | 'RAW';
        messageType: string;
        summary: string;
        data: Record<string, any>;
        raw: string;
        timestamp: string;
    }): NormalizedLabResult | null {
        const d = parsed.data ?? {};

        return {
            machineId: parsed.machineId,
            protocol: 'ASTM',
            sampleId: d.sampleId ?? null,
            patientId: d.patientId ?? null,
            patientName: d.patientName ?? null,
            orderId: d.orderId ?? null,
            testCode: d.testCode ?? null,
            testName: d.testName ?? d.testCode ?? null,
            value: d.resultValue ?? null,
            units: d.units ?? null,
            referenceRange: d.referenceRange ?? null,
            abnormalFlag: d.abnormalFlag ?? null,
            observedAt: parsed.timestamp,
            sourceMessageType: parsed.messageType,
            summary: parsed.summary,
            raw: parsed.raw,
            data: parsed.data ?? {},
        };
    }
}