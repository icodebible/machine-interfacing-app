export function buildAuthHeaders(
    secret:
        | {
            authType: 'none' | 'bearer' | 'basic' | 'api_key';
            username?: string | null;
            password?: string | null;
            token?: string | null;
            apiKeyName?: string | null;
            apiKeyValue?: string | null;
        }
        | null
        | undefined,
): Record<string, string> {
    if (!secret || secret.authType === 'none') return {};

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
