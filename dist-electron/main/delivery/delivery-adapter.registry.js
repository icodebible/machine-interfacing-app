"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryAdapterRegistry = void 0;
const custom_http_delivery_adapter_1 = require("./custom-http.delivery-adapter");
const dhis2_delivery_adapter_1 = require("./dhis2.delivery-adapter");
const lis_delivery_adapter_1 = require("./lis.delivery-adapter");
const openmrs_delivery_adapter_1 = require("./openmrs.delivery-adapter");
class DeliveryAdapterRegistry {
    dhis2 = new dhis2_delivery_adapter_1.Dhis2DeliveryAdapter();
    openmrs = new openmrs_delivery_adapter_1.OpenMrsDeliveryAdapter();
    lis = new lis_delivery_adapter_1.LisDeliveryAdapter();
    customHttp = new custom_http_delivery_adapter_1.CustomHttpDeliveryAdapter();
    get(target) {
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
exports.DeliveryAdapterRegistry = DeliveryAdapterRegistry;
