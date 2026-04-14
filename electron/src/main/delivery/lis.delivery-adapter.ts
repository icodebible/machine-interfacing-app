import { SecureHttpClient } from '../security/secure-http.client';
import { DeliveryAdapter } from './delivery-adapter.interface';

export class LisDeliveryAdapter implements DeliveryAdapter {
    private http = new SecureHttpClient();

    async send(args: {
        target: any;
        queueItem: any;
        headers: Record<string, string>;
        allowInsecureTls?: boolean;
        requestTimeoutMs?: number | null;
    }) {
        const payload = JSON.parse(args.queueItem.payload_json || '{}');

        const res = await this.http.postJson(
            `${args.target.base_url}/LIS`,
            payload,
            args.headers,
            !!args.allowInsecureTls,
            Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000),
        );

        if (!res.ok) {
            throw new Error(`LIS`);
        }

        return { status: res.status, body: res.body };
    }
}
