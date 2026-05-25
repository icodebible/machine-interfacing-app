// // import { ProtocolParser, MachineMessage, ParsedMessage } from './parser.interface';

// // export class ASTMParser implements ProtocolParser {
// //     parse(msg: MachineMessage): ParsedMessage | null {
// //         if (!msg.raw.startsWith('H|')) {
// //             return null;
// //         }

// //         const records = msg.raw.split('\r');

// //         return {
// //             machineId: msg.machineId,
// //             protocol: 'ASTM',
// //             timestamp: msg.timestamp,
// //             type: 'ASTM_MESSAGE',
// //             data: {
// //                 records,
// //                 raw: msg.raw,
// //             },
// //         };
// //     }
// // }

// // import {
// //     MachineMessage,
// //     ParsedMessage,
// //     ProtocolParser,
// // } from './parser.interface';

// // type AstmRecordMap = {
// //     header?: string;
// //     patient?: string[];
// //     order?: string[];
// //     result?: string[];
// //     terminator?: string;
// // };

// // export class ASTMParser implements ProtocolParser {
// //     parse(message: MachineMessage): ParsedMessage | null {
// //         const raw = message.raw?.trim();
// //         if (!raw) return null;

// //         const records = raw.split(/\r?\n|\r/).filter(Boolean);

// //         const parsed: AstmRecordMap = {
// //             patient: [],
// //             order: [],
// //             result: [],
// //         };

// //         for (const record of records) {
// //             if (record.startsWith('H|')) parsed.header = record;
// //             else if (record.startsWith('P|')) parsed.patient?.push(record);
// //             else if (record.startsWith('O|')) parsed.order?.push(record);
// //             else if (record.startsWith('R|')) parsed.result?.push(record);
// //             else if (record.startsWith('L|')) parsed.terminator = record;
// //         }

// //         if (!parsed.header && !parsed.result?.length && !parsed.order?.length) {
// //             return null;
// //         }

// //         const firstOrder = parsed.order?.[0]?.split('|') ?? [];
// //         const firstResult = parsed.result?.[0]?.split('|') ?? [];

// //         const sampleId = firstOrder[2] ?? null;
// //         const testCode = firstResult[2] ?? firstOrder[4] ?? null;
// //         const resultValue = firstResult[3] ?? null;
// //         const units = firstResult[4] ?? null;

// //         return {
// //             machineId: message.machineId,
// //             protocol: 'ASTM',
// //             timestamp: message.timestamp,
// //             messageType: 'ASTM_MESSAGE',
// //             summary: `ASTM sample ${sampleId ?? 'Unknown'} result ${resultValue ?? 'N/A'}`,
// //             data: {
// //                 sampleId,
// //                 testCode,
// //                 resultValue,
// //                 units,
// //                 records,
// //                 parsed,
// //             },
// //             raw: message.raw,
// //         };
// //     }
// // }

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

import { MachineMessage, ParsedMessage, ProtocolParser } from './parser.interface';

const cleanAstm = (raw: string) =>
    String(raw ?? '')
        .replace(/[\x02\x03\x04\x05\x06\x15\x17]/g, '')
        .trim();

const field = (fields: string[], index: number) => fields[index] ?? null;
const repeat = (value?: string | null) => String(value ?? '').split('^');

export class ASTMParser implements ProtocolParser {
    parse(message: MachineMessage): ParsedMessage | null {
        const raw = cleanAstm(message.raw ?? '');
        if (!raw) return null;

        const records = raw
            .split(/\r?\n|\r/)
            .map((record) => record.trim())
            .filter(Boolean);

        if (!records.length) return null;

        const header = records.find((record) => record.startsWith('H|'))?.split('|') ?? [];
        const patient = records.find((record) => record.startsWith('P|'))?.split('|') ?? [];
        const order = records.find((record) => record.startsWith('O|'))?.split('|') ?? [];

        const results = records
            .filter((record) => record.startsWith('R|'))
            .map((record) => {
                const fields = record.split('|');
                const codeParts = repeat(field(fields, 2));
                const value = field(fields, 3);
                return {
                    sequence: field(fields, 1),
                    code: codeParts[3] || codeParts[0] || field(fields, 2),
                    name: codeParts[4] || codeParts[3] || codeParts[0] || field(fields, 2),
                    rawCode: field(fields, 2),
                    value,
                    rawValue: value,
                    units: field(fields, 4),
                    referenceRange: field(fields, 5),
                    abnormalFlag: field(fields, 6),
                    resultStatus: field(fields, 8),
                    observedAt: field(fields, 12) ?? field(fields, 13),
                    segment: record,
                };
            });

        const orderParts = repeat(field(order, 2));
        const sampleId = orderParts[2] || orderParts[0] || field(order, 2);
        const testParts = repeat(field(order, 4));

        return {
            machineId: message.machineId,
            protocol: 'ASTM',
            timestamp: message.timestamp,
            messageType: 'ASTM_RESULT',
            summary: `ASTM result${sampleId ? ` · ${sampleId}` : ''} · ${results.length} row${results.length === 1 ? '' : 's'}`,
            data: {
                header: {
                    sender: field(header, 4),
                    processingId: field(header, 11),
                    version: field(header, 12),
                    messageDateTime: field(header, 13),
                },
                patient: {
                    id: field(patient, 3),
                    name: field(patient, 5),
                    birthDate: field(patient, 7),
                    sex: field(patient, 8),
                },
                specimen: {
                    id: sampleId,
                },
                order: {
                    placerOrderNumber: sampleId,
                    testCode: testParts[3] || testParts[0] || null,
                    testName: testParts[4] || testParts[3] || testParts[0] || null,
                    raw: field(order, 4),
                },
                observations: results,
                records,
            },
            raw: message.raw,
        };
    }
}
