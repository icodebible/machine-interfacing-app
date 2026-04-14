export type NormalizedLabResult = {
    machineId: string;
    protocol: 'ASTM' | 'HL7' | 'RAW';

    sampleId?: string | null;
    patientId?: string | null;
    patientName?: string | null;
    orderId?: string | null;

    testCode?: string | null;
    testName?: string | null;
    value?: string | null;
    units?: string | null;
    referenceRange?: string | null;
    abnormalFlag?: string | null;

    observedAt?: string | null;
    sourceMessageType?: string | null;
    summary?: string | null;

    raw: string;
    data: Record<string, any>;
};

export interface ResultNormalizer {
    normalize(parsed: {
        machineId: string;
        protocol: 'ASTM' | 'HL7' | 'RAW';
        messageType: string;
        summary: string;
        data: Record<string, any>;
        raw: string;
        timestamp: string;
    }): NormalizedLabResult | null;
}
