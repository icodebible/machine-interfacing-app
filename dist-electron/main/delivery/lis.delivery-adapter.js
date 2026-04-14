"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LisDeliveryAdapter = void 0;
const secure_http_client_1 = require("../security/secure-http.client");
class LisDeliveryAdapter {
    http = new secure_http_client_1.SecureHttpClient();
    async send(args) {
        const payload = JSON.parse(args.queueItem.payload_json || '{}');
        const res = await this.http.postJson(`${args.target.base_url}/LIS`, payload, args.headers, !!args.allowInsecureTls, Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000));
        if (!res.ok) {
            throw new Error(`LIS`);
        }
        return { status: res.status, body: res.body };
    }
}
exports.LisDeliveryAdapter = LisDeliveryAdapter;
