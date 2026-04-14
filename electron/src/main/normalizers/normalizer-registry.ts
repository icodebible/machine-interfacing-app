import { ASTMNormalizer } from './astm.normalizer';
import { HL7Normalizer } from './hl7.normalizer';
import { RawNormalizer } from './raw.normalizer';
import { ResultNormalizer } from './normalizer.interface';

export class NormalizerRegistry {
    private astm = new ASTMNormalizer();
    private hl7 = new HL7Normalizer();
    private raw = new RawNormalizer();

    get(protocol: 'ASTM' | 'HL7' | 'RAW' | string): ResultNormalizer {
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
