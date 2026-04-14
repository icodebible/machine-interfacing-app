"use strict";
// import { ProtocolParser, MachineMessage, ParsedMessage } from './parser.interface';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ASTMParser = void 0;
class ASTMParser {
    parse(message) {
        const raw = message.raw?.trim();
        if (!raw)
            return null;
        const records = raw.split(/\r?\n|\r/).filter(Boolean);
        const parsed = {
            patient: [],
            order: [],
            result: [],
        };
        for (const record of records) {
            if (record.startsWith('H|'))
                parsed.header = record;
            else if (record.startsWith('P|'))
                parsed.patient?.push(record);
            else if (record.startsWith('O|'))
                parsed.order?.push(record);
            else if (record.startsWith('R|'))
                parsed.result?.push(record);
            else if (record.startsWith('L|'))
                parsed.terminator = record;
        }
        if (!parsed.header && !parsed.result?.length && !parsed.order?.length) {
            return null;
        }
        const firstOrder = parsed.order?.[0]?.split('|') ?? [];
        const firstResult = parsed.result?.[0]?.split('|') ?? [];
        const sampleId = firstOrder[2] ?? null;
        const testCode = firstResult[2] ?? firstOrder[4] ?? null;
        const resultValue = firstResult[3] ?? null;
        const units = firstResult[4] ?? null;
        return {
            machineId: message.machineId,
            protocol: 'ASTM',
            timestamp: message.timestamp,
            messageType: 'ASTM_MESSAGE',
            summary: `ASTM sample ${sampleId ?? 'Unknown'} result ${resultValue ?? 'N/A'}`,
            data: {
                sampleId,
                testCode,
                resultValue,
                units,
                records,
                parsed,
            },
            raw: message.raw,
        };
    }
}
exports.ASTMParser = ASTMParser;
