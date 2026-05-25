"use strict";
// import { ASTMNormalizer } from './astm.normalizer';
// import { HL7Normalizer } from './hl7.normalizer';
// import { RawNormalizer } from './raw.normalizer';
// import { ResultNormalizer } from './normalizer.interface';
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizerRegistry = void 0;
// export class NormalizerRegistry {
//     private astm = new ASTMNormalizer();
//     private hl7 = new HL7Normalizer();
//     private raw = new RawNormalizer();
//     get(protocol: 'ASTM' | 'HL7' | 'RAW' | string): ResultNormalizer {
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
const astm_normalizer_1 = require("./astm.normalizer");
const hl7_normalizer_1 = require("./hl7.normalizer");
const raw_normalizer_1 = require("./raw.normalizer");
const normalizeProtocol = (protocol) => String(protocol ?? '')
    .trim()
    .toUpperCase();
class NormalizerRegistry {
    astm = new astm_normalizer_1.ASTMNormalizer();
    hl7 = new hl7_normalizer_1.HL7Normalizer();
    raw = new raw_normalizer_1.RawNormalizer();
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
exports.NormalizerRegistry = NormalizerRegistry;
