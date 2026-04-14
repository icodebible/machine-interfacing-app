"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HL7Normalizer = void 0;
class HL7Normalizer {
    normalize(parsed) {
        const d = parsed.data ?? {};
        const segments = Array.isArray(d.segments) ? d.segments : [];
        const pid = segments.find((s) => s.startsWith('PID|'))?.split('|') ?? [];
        const obr = segments.find((s) => s.startsWith('OBR|'))?.split('|') ?? [];
        const obx = segments.find((s) => s.startsWith('OBX|'))?.split('|') ?? [];
        const patientId = pid[3] ?? null;
        const patientName = pid[5]?.replace(/\^/g, ' ') ?? null;
        const orderId = obr[3] ?? null;
        const testCode = obx[3] ?? obr[4] ?? null;
        const value = obx[5] ?? null;
        const units = obx[6] ?? null;
        const referenceRange = obx[7] ?? null;
        const abnormalFlag = obx[8] ?? null;
        return {
            machineId: parsed.machineId,
            protocol: 'HL7',
            sampleId: orderId,
            patientId,
            patientName,
            orderId,
            testCode,
            testName: testCode,
            value,
            units,
            referenceRange,
            abnormalFlag,
            observedAt: d.messageDateTime ?? parsed.timestamp,
            sourceMessageType: parsed.messageType,
            summary: parsed.summary,
            raw: parsed.raw,
            data: parsed.data ?? {},
        };
    }
}
exports.HL7Normalizer = HL7Normalizer;
