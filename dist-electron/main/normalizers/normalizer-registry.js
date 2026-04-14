"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NormalizerRegistry = void 0;
const astm_normalizer_1 = require("./astm.normalizer");
const hl7_normalizer_1 = require("./hl7.normalizer");
const raw_normalizer_1 = require("./raw.normalizer");
class NormalizerRegistry {
    astm = new astm_normalizer_1.ASTMNormalizer();
    hl7 = new hl7_normalizer_1.HL7Normalizer();
    raw = new raw_normalizer_1.RawNormalizer();
    get(protocol) {
        switch (protocol) {
            case 'ASTM':
                return this.astm;
            case 'HL7':
                return this.hl7;
            default:
                return this.raw;
        }
    }
}
exports.NormalizerRegistry = NormalizerRegistry;
