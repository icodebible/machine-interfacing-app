// import { HL7Parser } from './hl7.parser';
// import { ASTMParser } from './astm.parser';
// import { RawParser } from './raw.parser';
// import { ProtocolParser } from './parser.interface';

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

import { ASTMParser } from './astm.parser';
import { HL7Parser } from './hl7.parser';
import { RawParser } from './raw.parser';
import { ProtocolParser, SupportedProtocol } from './parser.interface';

const normalizeProtocol = (protocol: SupportedProtocol | string) =>
    String(protocol ?? '')
        .trim()
        .toUpperCase();

export class ParserRegistry {
    private astm = new ASTMParser();
    private hl7 = new HL7Parser();
    private raw = new RawParser();

    get(protocol: SupportedProtocol | string): ProtocolParser {
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
