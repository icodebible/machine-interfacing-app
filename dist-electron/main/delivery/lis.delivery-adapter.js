"use strict";
// import { SecureHttpClient } from '../security/secure-http.client';
// import { DeliveryAdapter } from './delivery-adapter.interface';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LisDeliveryAdapter = void 0;
// export class LisDeliveryAdapter implements DeliveryAdapter {
//     private http = new SecureHttpClient();
//     async send(args: {
//         target: any;
//         queueItem: any;
//         headers: Record<string, string>;
//         allowInsecureTls?: boolean;
//         requestTimeoutMs?: number | null;
//     }) {
//         const payload = JSON.parse(args.queueItem.payload_json || '{}');
//         const res = await this.http.postJson(
//             `${args.target.base_url}/LIS`,
//             payload,
//             args.headers,
//             !!args.allowInsecureTls,
//             Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000),
//         );
//         if (!res.ok) {
//             throw new Error(`LIS`);
//         }
//         return { status: res.status, body: res.body };
//     }
// }
// import { SecureHttpClient } from '../security/secure-http.client';
// import { DeliveryAdapter } from './delivery-adapter.interface';
// const joinUrl = (baseUrl: string, path: string) => {
//     const base = String(baseUrl ?? '').replace(/\/+$/, '');
//     let suffix = String(path ?? '').startsWith('/') ? path : `/${path}`;
//     // Some targets are configured as http://host/openmrs/ws/rest/v1 while others are
//     // configured as http://host. Avoid duplicating the OpenMRS REST prefix.
//     if (base.endsWith('/openmrs/ws/rest/v1') && suffix.startsWith('/openmrs/ws/rest/v1/')) {
//         suffix = suffix.replace('/openmrs/ws/rest/v1', '');
//     }
//     return `${base}${suffix}`;
// };
// export class LisDeliveryAdapter implements DeliveryAdapter {
//     private http = new SecureHttpClient();
//     async send(args: {
//         target: any;
//         queueItem: any;
//         headers: Record<string, string>;
//         allowInsecureTls?: boolean;
//         requestTimeoutMs?: number | null;
//     }) {
//         const payload = JSON.parse(args.queueItem.payload_json || '{}');
//         const endpoint =
//             payload?.endpoint ??
//             args.target?.endpoint ??
//             args.target?.path ??
//             '/openmrs/ws/rest/v1/lab/multipleresults';
//         const body = Array.isArray(payload) ? payload : (payload?.body ?? payload);
//         const res = await this.http.postJson(
//             joinUrl(args.target.base_url, endpoint),
//             body,
//             args.headers,
//             !!args.allowInsecureTls,
//             Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000),
//         );
//         if (!res.ok) {
//             throw new Error(
//                 `LIS delivery failed with HTTP ${res.status}: ${JSON.stringify(res.body ?? {})}`,
//             );
//         }
//         return { status: res.status, body: res.body };
//     }
// }
const secure_http_client_1 = require("../security/secure-http.client");
class LisDeliveryAdapter {
    http = new secure_http_client_1.SecureHttpClient();
    async send(args) {
        const storedPayload = JSON.parse(args.queueItem.payload_json || '{}');
        const prepared = this.preparePayload(storedPayload);
        const url = this.joinUrl(args.target.base_url, prepared.endpoint);
        const res = await this.http.postJson(url, prepared.body, args.headers, !!args.allowInsecureTls, Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000));
        if (!res.ok) {
            throw new Error(`LIS delivery failed with status ${res.status}: ${res.body || 'No response body'}`);
        }
        return {
            status: res.status,
            body: res.body,
            diagnostics: prepared.diagnostics,
        };
    }
    preparePayload(payload) {
        if (Array.isArray(payload)) {
            return {
                endpoint: '/openmrs/ws/rest/v1/lab/multipleresults',
                body: payload,
                diagnostics: ['Payload is already a LIS multiple-results array.'],
            };
        }
        if (payload?.resourceType === 'OpenMRSLabMultipleResultsRequest') {
            if (!Array.isArray(payload.body)) {
                throw new Error('OpenMRS LIS payload wrapper is missing body[].');
            }
            return {
                endpoint: payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
                body: payload.body,
                diagnostics: [
                    `Prepared ${payload.body.length} LIS multiple-results row${payload.body.length === 1 ? '' : 's'} from OpenMRS LIS wrapper.`,
                ],
            };
        }
        if (Array.isArray(payload?.body)) {
            return {
                endpoint: payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
                body: payload.body,
                diagnostics: ['Prepared LIS body[] from generic payload wrapper.'],
            };
        }
        if (Array.isArray(payload?.payload?.body)) {
            return {
                endpoint: payload.payload.endpoint ?? payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
                body: payload.payload.body,
                diagnostics: ['Prepared LIS payload.body[] from nested payload wrapper.'],
            };
        }
        return {
            endpoint: payload?.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
            body: payload,
            diagnostics: [
                'Payload did not use a known LIS wrapper. It was sent as-is to the LIS endpoint.',
            ],
        };
    }
    joinUrl(baseUrl, path) {
        const base = String(baseUrl ?? '').replace(/\/+$/, '');
        const suffix = String(path ?? '').startsWith('/') ? path : `/${path}`;
        return `${base}${suffix}`;
    }
}
exports.LisDeliveryAdapter = LisDeliveryAdapter;
