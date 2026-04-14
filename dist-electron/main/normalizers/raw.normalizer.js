"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawNormalizer = void 0;
class RawNormalizer {
    normalize(parsed) {
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
exports.RawNormalizer = RawNormalizer;
