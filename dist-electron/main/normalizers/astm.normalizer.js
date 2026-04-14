"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTMNormalizer = void 0;
class ASTMNormalizer {
    normalize(parsed) {
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
exports.ASTMNormalizer = ASTMNormalizer;
