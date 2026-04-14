import { CustomHttpTransformer } from './custom-http.transformer';
import { Dhis2Transformer } from './dhis2.transformer';
import { LisTransformer } from './lis.transformer';
import { OpenMrsTransformer } from './openmrs.transformer';
import { TargetRecord, TargetTransformer } from './target-transformer.interface';

export class TargetTransformerRegistry {
    private readonly openmrs = new OpenMrsTransformer();
    private readonly dhis2 = new Dhis2Transformer();
    private readonly lis = new LisTransformer();
    private readonly customHttp = new CustomHttpTransformer();

    get(target: TargetRecord): TargetTransformer {
        switch (target.type) {
            case 'OPENMRS':
                return this.openmrs;
            case 'LIS':
                return this.lis;
            case 'CUSTOM_HTTP':
                return this.customHttp;
            case 'DHIS2':
            default:
                return this.dhis2;
        }
    }
}
