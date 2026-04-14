"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dhis2DeliveryAdapter = void 0;
const secure_http_client_1 = require("../security/secure-http.client");
class Dhis2DeliveryAdapter {
    http = new secure_http_client_1.SecureHttpClient();
    async send(args) {
        const payload = JSON.parse(args.queueItem.payload_json || '{}');
        const res = await this.http.postJson(`${args.target.base_url}/DHIS2`, payload, args.headers, !!args.allowInsecureTls, Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000));
        if (!res.ok) {
            throw new Error(`DHIS2`);
        }
        return { status: res.status, body: res.body };
    }
}
exports.Dhis2DeliveryAdapter = Dhis2DeliveryAdapter;
