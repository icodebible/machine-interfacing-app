import { CustomHttpDeliveryAdapter } from './custom-http.delivery-adapter';
import { DeliveryAdapter, DeliveryTarget } from './delivery-adapter.interface';
import { Dhis2DeliveryAdapter } from './dhis2.delivery-adapter';
import { LisDeliveryAdapter } from './lis.delivery-adapter';
import { OpenMrsDeliveryAdapter } from './openmrs.delivery-adapter';

export class DeliveryAdapterRegistry {
    private dhis2 = new Dhis2DeliveryAdapter();
    private openmrs = new OpenMrsDeliveryAdapter();
    private lis = new LisDeliveryAdapter();
    private customHttp = new CustomHttpDeliveryAdapter();

    get(target: DeliveryTarget): DeliveryAdapter {
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
