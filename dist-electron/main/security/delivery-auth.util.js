"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAuthHeaders = buildAuthHeaders;
function buildAuthHeaders(secret) {
    if (!secret || secret.authType === 'none')
        return {};
    switch (secret.authType) {
        case 'bearer':
            return secret.token ? { Authorization: `Bearer ${secret.token}` } : {};
        case 'basic': {
            const raw = `${secret.username ?? ''}:${secret.password ?? ''}`;
            return {
                Authorization: `Basic ${Buffer.from(raw).toString('base64')}`,
            };
        }
        case 'api_key':
            return secret.apiKeyName && secret.apiKeyValue
                ? { [secret.apiKeyName]: secret.apiKeyValue }
                : {};
        default:
            return {};
    }
}
