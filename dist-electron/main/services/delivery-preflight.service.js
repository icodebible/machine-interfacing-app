"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeliveryPreflightService = void 0;
const delivery_auth_util_1 = require("../security/delivery-auth.util");
class DeliveryPreflightService {
    validate(args) {
        const errors = [];
        const warnings = [];
        if (!args.target) {
            errors.push('Target is missing.');
        }
        if (args.target?.enabled !== 1) {
            errors.push('Target is disabled.');
        }
        try {
            new URL(args.target.base_url);
        }
        catch {
            errors.push('Target base URL is invalid.');
        }
        if (!args.payload ||
            typeof args.payload !== 'object' ||
            Object.keys(args.payload).length === 0) {
            errors.push('Preview payload is empty.');
        }
        if (!args.mappingValidation?.ok) {
            for (const warning of args.mappingValidation?.warnings ?? []) {
                errors.push(warning);
            }
        }
        const secret = args.secret;
        if (secret?.authType === 'bearer' && !secret.token) {
            errors.push('Bearer auth is selected but no token is stored.');
        }
        if (secret?.authType === 'basic' && (!secret.username || !secret.password)) {
            errors.push('Basic auth is selected but username or password is missing.');
        }
        if (secret?.authType === 'api_key' && (!secret.apiKeyName || !secret.apiKeyValue)) {
            errors.push('API key auth is selected but key name or value is missing.');
        }
        if (secret?.allowInsecureTls) {
            warnings.push('Insecure TLS is enabled for this target.');
        }
        const authHeaders = (0, delivery_auth_util_1.buildAuthHeaders)(secret);
        if (secret?.authType && secret.authType !== 'none' && Object.keys(authHeaders).length === 0) {
            errors.push('Authentication headers could not be built from the stored secret configuration.');
        }
        switch (args.target.type) {
            case 'DHIS2':
                if (!args.payload.eventDate)
                    errors.push('DHIS2 payload is missing eventDate.');
                if (!Array.isArray(args.payload.dataValues) || args.payload.dataValues.length === 0) {
                    errors.push('DHIS2 payload is missing dataValues.');
                }
                break;
            case 'OPENMRS':
                if (!args.payload.patient?.identifier) {
                    errors.push('OpenMRS payload is missing patient.identifier.');
                }
                if (!args.payload.observation?.concept) {
                    errors.push('OpenMRS payload is missing observation.concept.');
                }
                if (args.payload.observation?.value === undefined ||
                    args.payload.observation?.value === null ||
                    args.payload.observation?.value === '') {
                    errors.push('OpenMRS payload is missing observation.value.');
                }
                break;
            case 'LIS':
                if (!args.payload.sampleId &&
                    !args.payload.specimen?.sampleId &&
                    !args.payload.orderId &&
                    !args.payload.testCode) {
                    warnings.push('LIS payload does not include sample/order/test identifiers.');
                }
                break;
            case 'CUSTOM_HTTP':
                if (Array.isArray(args.payload)) {
                    warnings.push('Custom HTTP payload is an array. Confirm the remote endpoint expects a collection.');
                }
                break;
            default:
                warnings.push(`No connector-specific preflight validator is defined for ${args.target.type}.`);
                break;
        }
        return {
            ok: errors.length === 0,
            message: errors.length === 0 ? 'Pre-send validation passed.' : 'Pre-send validation failed.',
            errors,
            warnings,
            targetType: args.target.type,
        };
    }
}
exports.DeliveryPreflightService = DeliveryPreflightService;
