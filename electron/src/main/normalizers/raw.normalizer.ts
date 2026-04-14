import { NormalizedLabResult, ResultNormalizer } from './normalizer.interface';

export class RawNormalizer implements ResultNormalizer {
    normalize(parsed: {
        machineId: string;
        protocol: 'ASTM' | 'HL7' | 'RAW';
        messageType: string;
        summary: string;
        data: Record<string, any>;
        raw: string;
        timestamp: string;
    }): NormalizedLabResult {
        return {
            machineId: parsed.machineId,
            protocol: 'RAW',
            observedAt: parsed.timestamp,
            sourceMessageType: parsed.messageType,
            summary: parsed.summary,
            raw: parsed.raw,
            data: parsed.data ?? {},
        };
    }
}
