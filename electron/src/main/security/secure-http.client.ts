export class SecureHttpClient {
    private validateUrl(url: string, allowInsecureTls = false) {
        const parsed = new URL(url);
        const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

        if (parsed.protocol !== 'https:' && !isLocalhost) {
            throw new Error('Only HTTPS endpoints are allowed outside localhost');
        }

        if (allowInsecureTls && process.env.NODE_ENV === 'production') {
            throw new Error('Insecure TLS is not allowed in production');
        }
    }

    async postJson(
        url: string,
        payload: any,
        headers: Record<string, string> = {},
        allowInsecureTls = false,
        requestTimeoutMs = 15_000,
    ) {
        this.validateUrl(url, allowInsecureTls);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers,
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            const body = await res.text();

            return {
                ok: res.ok,
                status: res.status,
                body,
            };
        } catch (e: any) {
            if (e?.name === 'AbortError') {
                throw new Error(`Request timed out after ${requestTimeoutMs} ms`);
            }
            throw e;
        } finally {
            clearTimeout(timeout);
        }
    }
}
