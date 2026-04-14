"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomHttpDeliveryAdapter = void 0;
const secure_http_client_1 = require("../security/secure-http.client");
class CustomHttpDeliveryAdapter {
    http = new secure_http_client_1.SecureHttpClient();
    async send(args) {
        const payload = JSON.parse(args.queueItem.payload_json || '{}');
        const res = await this.http.postJson(args.target.base_url, payload, args.headers, !!args.allowInsecureTls, Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000));
        if (!res.ok) {
            throw new Error(`Custom HTTP delivery failed with status ${res.status}`);
        }
        return { status: res.status, body: res.body };
    }
}
exports.CustomHttpDeliveryAdapter = CustomHttpDeliveryAdapter;
