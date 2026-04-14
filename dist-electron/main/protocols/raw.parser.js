"use strict";
// import { ProtocolParser, MachineMessage, ParsedMessage } from './parser.interface';
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawParser = void 0;
class RawParser {
    parse(message) {
        const raw = message.raw ?? '';
        return {
            machineId: message.machineId,
            protocol: 'RAW',
            timestamp: message.timestamp,
            messageType: 'RAW',
            summary: raw.slice(0, 120),
            data: {
                length: raw.length,
            },
            raw,
        };
    }
}
exports.RawParser = RawParser;
