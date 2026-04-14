// import { ProtocolParser, MachineMessage, ParsedMessage } from './parser.interface';

// export class ASTMParser implements ProtocolParser {
//     parse(msg: MachineMessage): ParsedMessage | null {
//         if (!msg.raw.startsWith('H|')) {
//             return null;
//         }

//         const records = msg.raw.split('\r');

//         return {
//             machineId: msg.machineId,
//             protocol: 'ASTM',
//             timestamp: msg.timestamp,
//             type: 'ASTM_MESSAGE',
//             data: {
//                 records,
//                 raw: msg.raw,
//             },
//         };
//     }
// }

// import {
//     MachineMessage,
//     ParsedMessage,
//     ProtocolParser,
// } from './parser.interface';

// type AstmRecordMap = {
//     header?: string;
//     patient?: string[];
//     order?: string[];
//     result?: string[];
//     terminator?: string;
// };

// export class ASTMParser implements ProtocolParser {
//     parse(message: MachineMessage): ParsedMessage | null {
//         const raw = message.raw?.trim();
//         if (!raw) return null;

//         const records = raw.split(/\r?\n|\r/).filter(Boolean);

//         const parsed: AstmRecordMap = {
//             patient: [],
//             order: [],
//             result: [],
//         };

//         for (const record of records) {
//             if (record.startsWith('H|')) parsed.header = record;
//             else if (record.startsWith('P|')) parsed.patient?.push(record);
//             else if (record.startsWith('O|')) parsed.order?.push(record);
//             else if (record.startsWith('R|')) parsed.result?.push(record);
//             else if (record.startsWith('L|')) parsed.terminator = record;
//         }

//         if (!parsed.header && !parsed.result?.length && !parsed.order?.length) {
//             return null;
//         }

//         const firstOrder = parsed.order?.[0]?.split('|') ?? [];
//         const firstResult = parsed.result?.[0]?.split('|') ?? [];

//         const sampleId = firstOrder[2] ?? null;
//         const testCode = firstResult[2] ?? firstOrder[4] ?? null;
//         const resultValue = firstResult[3] ?? null;
//         const units = firstResult[4] ?? null;

//         return {
//             machineId: message.machineId,
//             protocol: 'ASTM',
//             timestamp: message.timestamp,
//             messageType: 'ASTM_MESSAGE',
//             summary: `ASTM sample ${sampleId ?? 'Unknown'} result ${resultValue ?? 'N/A'}`,
//             data: {
//                 sampleId,
//                 testCode,
//                 resultValue,
//                 units,
//                 records,
//                 parsed,
//             },
//             raw: message.raw,
//         };
//     }
// }

import {
    MachineMessage,
    ParsedMessage,
    ProtocolParser,
} from './parser.interface';

type AstmRecordMap = {
    header?: string;
    patient?: string[];
    order?: string[];
    result?: string[];
    terminator?: string;
};

export class ASTMParser implements ProtocolParser {
    parse(message: MachineMessage): ParsedMessage | null {
        const raw = message.raw?.trim();
        if (!raw) return null;

        const records = raw.split(/\r?\n|\r/).filter(Boolean);

        const parsed: AstmRecordMap = {
            patient: [],
            order: [],
            result: [],
        };

        for (const record of records) {
            if (record.startsWith('H|')) parsed.header = record;
            else if (record.startsWith('P|')) parsed.patient?.push(record);
            else if (record.startsWith('O|')) parsed.order?.push(record);
            else if (record.startsWith('R|')) parsed.result?.push(record);
            else if (record.startsWith('L|')) parsed.terminator = record;
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