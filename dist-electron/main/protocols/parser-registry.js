"use strict";
// import { HL7Parser } from './hl7.parser';
// import { ASTMParser } from './astm.parser';
// import { RawParser } from './raw.parser';
// import { ProtocolParser } from './parser.interface';
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParserRegistry = void 0;
// export class ParserRegistry {
//     private hl7 = new HL7Parser();
//     private astm = new ASTMParser();
//     private raw = new RawParser();
//     get(protocol: string): ProtocolParser {
//         switch (protocol) {
//             case 'HL7':
//                 return this.hl7;
//             case 'ASTM':
//                 return this.astm;
//             default:
//                 return this.raw;
//         }
//     }
// }
// import { ASTMParser } from './astm.parser';
// import { HL7Parser } from './hl7.parser';
// import { RawParser } from './raw.parser';
// import { ProtocolParser, SupportedProtocol } from './parser.interface';
// export class ParserRegistry {
//     private astm = new ASTMParser();
//     private hl7 = new HL7Parser();
//     private raw = new RawParser();
//     get(protocol: SupportedProtocol | string): ProtocolParser {
//         switch (protocol) {
//             case 'ASTM':
//                 return this.astm;
//             case 'HL7':
//                 return this.hl7;
//             default:
//                 return this.raw;
//         }
//     }
// }
// import { ASTMParser } from './astm.parser';
// import { HL7Parser } from './hl7.parser';
// import { RawParser } from './raw.parser';
// import { ProtocolParser, SupportedProtocol } from './parser.interface';
// export class ParserRegistry {
//     private astm = new ASTMParser();
//     private hl7 = new HL7Parser();
//     private raw = new RawParser();
//     get(protocol: SupportedProtocol | string): ProtocolParser {
//         switch (protocol) {
//             case 'ASTM':
//                 return this.astm;
//             case 'HL7':
//                 return this.hl7;
//             default:
//                 return this.raw;
//         }
//     }
// }
const astm_parser_1 = require("./astm.parser");
const hl7_parser_1 = require("./hl7.parser");
const raw_parser_1 = require("./raw.parser");
const normalizeProtocol = (protocol) => String(protocol ?? '')
    .trim()
    .toUpperCase();
class ParserRegistry {
    astm = new astm_parser_1.ASTMParser();
    hl7 = new hl7_parser_1.HL7Parser();
    raw = new raw_parser_1.RawParser();
    get(protocol) {
        const normalized = normalizeProtocol(protocol);
        switch (normalized) {
            case 'ASTM':
                return this.astm;
            case 'HL7':
            case 'HL7_MLLP':
            case 'MLLP':
                return this.hl7;
            case 'RAW':
                return this.raw;
            default:
                return this.raw;
        }
    }
}
exports.ParserRegistry = ParserRegistry;
