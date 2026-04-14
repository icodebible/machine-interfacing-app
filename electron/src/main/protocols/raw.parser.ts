// import { ProtocolParser, MachineMessage, ParsedMessage } from './parser.interface';

// export class RawParser implements ProtocolParser {
//     parse(msg: MachineMessage): ParsedMessage {
//         return {
//             machineId: msg.machineId,
//             protocol: 'RAW',
//             timestamp: msg.timestamp,
//             type: 'RAW',
//             data: {
//                 raw: msg.raw,
//             },
//         };
//     }
// }

// import { MachineMessage, ParsedMessage, ProtocolParser } from './parser.interface';

// export class RawParser implements ProtocolParser {
//     parse(message: MachineMessage): ParsedMessage {
//         const raw = message.raw ?? '';

//         return {
//             machineId: message.machineId,
//             protocol: 'RAW',
//             timestamp: message.timestamp,
//             messageType: 'RAW',
//             summary: raw.slice(0, 120),
//             data: {
//                 length: raw.length,
//             },
//             raw,
//         };
//     }
// }

import { MachineMessage, ParsedMessage, ProtocolParser } from './parser.interface';

export class RawParser implements ProtocolParser {
    parse(message: MachineMessage): ParsedMessage {
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
