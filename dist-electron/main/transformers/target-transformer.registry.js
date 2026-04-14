"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetTransformerRegistry = void 0;
const custom_http_transformer_1 = require("./custom-http.transformer");
const dhis2_transformer_1 = require("./dhis2.transformer");
const lis_transformer_1 = require("./lis.transformer");
const openmrs_transformer_1 = require("./openmrs.transformer");
class TargetTransformerRegistry {
    openmrs = new openmrs_transformer_1.OpenMrsTransformer();
    dhis2 = new dhis2_transformer_1.Dhis2Transformer();
    lis = new lis_transformer_1.LisTransformer();
    customHttp = new custom_http_transformer_1.CustomHttpTransformer();
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
exports.TargetTransformerRegistry = TargetTransformerRegistry;
