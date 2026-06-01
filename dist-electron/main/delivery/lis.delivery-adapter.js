"use strict";
// // import { SecureHttpClient } from '../security/secure-http.client';
// // import { DeliveryAdapter } from './delivery-adapter.interface';
Object.defineProperty(exports, "__esModule", { value: true });
exports.LisDeliveryAdapter = void 0;
// // export class LisDeliveryAdapter implements DeliveryAdapter {
// //     private http = new SecureHttpClient();
// //     async send(args: {
// //         target: any;
// //         queueItem: any;
// //         headers: Record<string, string>;
// //         allowInsecureTls?: boolean;
// //         requestTimeoutMs?: number | null;
// //     }) {
// //         const payload = JSON.parse(args.queueItem.payload_json || '{}');
// //         const res = await this.http.postJson(
// //             `${args.target.base_url}/LIS`,
// //             payload,
// //             args.headers,
// //             !!args.allowInsecureTls,
// //             Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000),
// //         );
// //         if (!res.ok) {
// //             throw new Error(`LIS`);
// //         }
// //         return { status: res.status, body: res.body };
// //     }
// // }
// // import { SecureHttpClient } from '../security/secure-http.client';
// // import { DeliveryAdapter } from './delivery-adapter.interface';
// // const joinUrl = (baseUrl: string, path: string) => {
// //     const base = String(baseUrl ?? '').replace(/\/+$/, '');
// //     let suffix = String(path ?? '').startsWith('/') ? path : `/${path}`;
// //     // Some targets are configured as http://host/openmrs/ws/rest/v1 while others are
// //     // configured as http://host. Avoid duplicating the OpenMRS REST prefix.
// //     if (base.endsWith('/openmrs/ws/rest/v1') && suffix.startsWith('/openmrs/ws/rest/v1/')) {
// //         suffix = suffix.replace('/openmrs/ws/rest/v1', '');
// //     }
// //     return `${base}${suffix}`;
// // };
// // export class LisDeliveryAdapter implements DeliveryAdapter {
// //     private http = new SecureHttpClient();
// //     async send(args: {
// //         target: any;
// //         queueItem: any;
// //         headers: Record<string, string>;
// //         allowInsecureTls?: boolean;
// //         requestTimeoutMs?: number | null;
// //     }) {
// //         const payload = JSON.parse(args.queueItem.payload_json || '{}');
// //         const endpoint =
// //             payload?.endpoint ??
// //             args.target?.endpoint ??
// //             args.target?.path ??
// //             '/openmrs/ws/rest/v1/lab/multipleresults';
// //         const body = Array.isArray(payload) ? payload : (payload?.body ?? payload);
// //         const res = await this.http.postJson(
// //             joinUrl(args.target.base_url, endpoint),
// //             body,
// //             args.headers,
// //             !!args.allowInsecureTls,
// //             Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000),
// //         );
// //         if (!res.ok) {
// //             throw new Error(
// //                 `LIS delivery failed with HTTP ${res.status}: ${JSON.stringify(res.body ?? {})}`,
// //             );
// //         }
// //         return { status: res.status, body: res.body };
// //     }
// // }
// // import { SecureHttpClient } from '../security/secure-http.client';
// // import { DeliveryAdapter } from './delivery-adapter.interface';
// // type LisPreparedPayload = {
// //     endpoint: string;
// //     body: any;
// //     diagnostics: string[];
// // };
// // export class LisDeliveryAdapter implements DeliveryAdapter {
// //     private http = new SecureHttpClient();
// //     async send(args: {
// //         target: any;
// //         queueItem: any;
// //         headers: Record<string, string>;
// //         allowInsecureTls?: boolean;
// //         requestTimeoutMs?: number | null;
// //     }) {
// //         const storedPayload = JSON.parse(args.queueItem.payload_json || '{}');
// //         const prepared = this.preparePayload(storedPayload);
// //         const url = this.joinUrl(args.target.base_url, prepared.endpoint);
// //         const res = await this.http.postJson(
// //             url,
// //             prepared.body,
// //             args.headers,
// //             !!args.allowInsecureTls,
// //             Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000),
// //         );
// //         if (!res.ok) {
// //             throw new Error(`LIS delivery failed with status ${res.status}: ${res.body || 'No response body'}`);
// //         }
// //         return {
// //             status: res.status,
// //             body: res.body,
// //             diagnostics: prepared.diagnostics,
// //         };
// //     }
// //     private preparePayload(payload: any): LisPreparedPayload {
// //         if (Array.isArray(payload)) {
// //             return {
// //                 endpoint: '/openmrs/ws/rest/v1/lab/multipleresults',
// //                 body: payload,
// //                 diagnostics: ['Payload is already a LIS multiple-results array.'],
// //             };
// //         }
// //         if (payload?.resourceType === 'OpenMRSLabMultipleResultsRequest') {
// //             if (!Array.isArray(payload.body)) {
// //                 throw new Error('OpenMRS LIS payload wrapper is missing body[].');
// //             }
// //             return {
// //                 endpoint: payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
// //                 body: payload.body,
// //                 diagnostics: [
// //                     `Prepared ${payload.body.length} LIS multiple-results row${payload.body.length === 1 ? '' : 's'} from OpenMRS LIS wrapper.`,
// //                 ],
// //             };
// //         }
// //         if (Array.isArray(payload?.body)) {
// //             return {
// //                 endpoint: payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
// //                 body: payload.body,
// //                 diagnostics: ['Prepared LIS body[] from generic payload wrapper.'],
// //             };
// //         }
// //         if (Array.isArray(payload?.payload?.body)) {
// //             return {
// //                 endpoint: payload.payload.endpoint ?? payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
// //                 body: payload.payload.body,
// //                 diagnostics: ['Prepared LIS payload.body[] from nested payload wrapper.'],
// //             };
// //         }
// //         return {
// //             endpoint: payload?.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
// //             body: payload,
// //             diagnostics: [
// //                 'Payload did not use a known LIS wrapper. It was sent as-is to the LIS endpoint.',
// //             ],
// //         };
// //     }
// //     private joinUrl(baseUrl: string, path: string) {
// //         const base = String(baseUrl ?? '').replace(/\/+$/, '');
// //         const suffix = String(path ?? '').startsWith('/') ? path : `/${path}`;
// //         return `${base}${suffix}`;
// //     }
// // }
// // import { SecureHttpClient } from '../security/secure-http.client';
// // import { DeliveryAdapter } from './delivery-adapter.interface';
// // type LisPreparedPayload = {
// //     endpoint: string;
// //     body: any;
// //     diagnostics: string[];
// // };
// // export class LisDeliveryAdapter implements DeliveryAdapter {
// //     private http = new SecureHttpClient();
// //     async send(args: {
// //         target: any;
// //         queueItem: any;
// //         headers: Record<string, string>;
// //         allowInsecureTls?: boolean;
// //         requestTimeoutMs?: number | null;
// //     }) {
// //         const storedPayload = JSON.parse(args.queueItem.payload_json || '{}');
// //         const prepared = this.preparePayload(storedPayload);
// //         const url = this.joinUrl(args.target.base_url, prepared.endpoint);
// //         const res = await this.http.postJson(
// //             url,
// //             prepared.body,
// //             args.headers,
// //             !!args.allowInsecureTls,
// //             Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000),
// //         );
// //         if (!res.ok) {
// //             throw new Error(`LIS delivery failed with status ${res.status}: ${res.body || 'No response body'}`);
// //         }
// //         return {
// //             status: res.status,
// //             body: res.body,
// //             diagnostics: prepared.diagnostics,
// //         };
// //     }
// //     private preparePayload(payload: any): LisPreparedPayload {
// //         if (Array.isArray(payload)) {
// //             return {
// //                 endpoint: '/openmrs/ws/rest/v1/lab/multipleresults',
// //                 body: payload,
// //                 diagnostics: ['Payload is already a LIS multiple-results array.'],
// //             };
// //         }
// //         if (payload?.resourceType === 'OpenMRSLabMultipleResultsRequest') {
// //             if (!Array.isArray(payload.body)) {
// //                 throw new Error('OpenMRS LIS payload wrapper is missing body[].');
// //             }
// //             return {
// //                 endpoint: payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
// //                 body: payload.body,
// //                 diagnostics: [
// //                     `Prepared ${payload.body.length} LIS multiple-results row${payload.body.length === 1 ? '' : 's'} from OpenMRS LIS wrapper.`,
// //                 ],
// //             };
// //         }
// //         if (Array.isArray(payload?.body)) {
// //             return {
// //                 endpoint: payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
// //                 body: payload.body,
// //                 diagnostics: ['Prepared LIS body[] from generic payload wrapper.'],
// //             };
// //         }
// //         if (Array.isArray(payload?.payload?.body)) {
// //             return {
// //                 endpoint: payload.payload.endpoint ?? payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
// //                 body: payload.payload.body,
// //                 diagnostics: ['Prepared LIS payload.body[] from nested payload wrapper.'],
// //             };
// //         }
// //         return {
// //             endpoint: payload?.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
// //             body: payload,
// //             diagnostics: [
// //                 'Payload did not use a known LIS wrapper. It was sent as-is to the LIS endpoint.',
// //             ],
// //         };
// //     }
// //     private joinUrl(baseUrl: string, path: string) {
// //         const base = String(baseUrl ?? '').replace(/\/+$/, '');
// //         const suffix = String(path ?? '').startsWith('/') ? path : `/${path}`;
// //         return `${base}${suffix}`;
// //     }
// // }
// // import { SecureHttpClient } from "../security/secure-http.client";
// // import { DeliveryAdapter } from "./delivery-adapter.interface";
// // type LisPreparedPayload = {
// //   endpoint: string;
// //   body: any[] | any;
// //   diagnostics: string[];
// //   wrapper?: any;
// // };
// // export class LisDeliveryAdapter implements DeliveryAdapter {
// //   private http = new SecureHttpClient();
// //   async send(args: {
// //     target: any;
// //     queueItem: any;
// //     headers: Record<string, string>;
// //     allowInsecureTls?: boolean;
// //     requestTimeoutMs?: number | null;
// //   }) {
// //     const storedPayload = JSON.parse(args.queueItem.payload_json || "{}");
// //     const prepared = this.preparePayload(storedPayload);
// //     const body = await this.resolveDynamicAllocationsIfNeeded({
// //       target: args.target,
// //       prepared,
// //       headers: args.headers,
// //       allowInsecureTls: !!args.allowInsecureTls,
// //       requestTimeoutMs: Number(
// //         args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000,
// //       ),
// //     });
// //     const url = this.joinUrl(args.target.base_url, prepared.endpoint);
// //     const res = await this.http.postJson(
// //       url,
// //       body,
// //       args.headers,
// //       !!args.allowInsecureTls,
// //       Number(
// //         args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000,
// //       ),
// //     );
// //     if (!res.ok) {
// //       throw new Error(
// //         `LIS delivery failed with status ${res.status}: ${res.body || "No response body"}`,
// //       );
// //     }
// //     return {
// //       status: res.status,
// //       body: res.body,
// //       diagnostics: prepared.diagnostics,
// //     };
// //   }
// //   private preparePayload(payload: any): LisPreparedPayload {
// //     if (Array.isArray(payload)) {
// //       return {
// //         endpoint: "/openmrs/ws/rest/v1/lab/multipleresults",
// //         body: payload,
// //         diagnostics: ["Payload is already a LIS multiple-results array."],
// //       };
// //     }
// //     if (payload?.resourceType === "OpenMRSLabMultipleResultsRequest") {
// //       if (!Array.isArray(payload.body)) {
// //         throw new Error("OpenMRS LIS payload wrapper is missing body[].");
// //       }
// //       return {
// //         endpoint: payload.endpoint ?? "/openmrs/ws/rest/v1/lab/multipleresults",
// //         body: payload.body,
// //         wrapper: payload,
// //         diagnostics: [
// //           `Prepared ${payload.body.length} LIS multiple-results row${payload.body.length === 1 ? "" : "s"} from OpenMRS LIS wrapper.`,
// //         ],
// //       };
// //     }
// //     if (Array.isArray(payload?.body)) {
// //       return {
// //         endpoint: payload.endpoint ?? "/openmrs/ws/rest/v1/lab/multipleresults",
// //         body: payload.body,
// //         wrapper: payload,
// //         diagnostics: ["Prepared LIS body[] from generic payload wrapper."],
// //       };
// //     }
// //     if (Array.isArray(payload?.payload?.body)) {
// //       return {
// //         endpoint:
// //           payload.payload.endpoint ??
// //           payload.endpoint ??
// //           "/openmrs/ws/rest/v1/lab/multipleresults",
// //         body: payload.payload.body,
// //         wrapper: payload.payload,
// //         diagnostics: [
// //           "Prepared LIS payload.body[] from nested payload wrapper.",
// //         ],
// //       };
// //     }
// //     return {
// //       endpoint: payload?.endpoint ?? "/openmrs/ws/rest/v1/lab/multipleresults",
// //       body: payload,
// //       wrapper: payload,
// //       diagnostics: [
// //         "Payload did not use a known LIS wrapper. It was sent as-is to the LIS endpoint.",
// //       ],
// //     };
// //   }
// //   private async resolveDynamicAllocationsIfNeeded(args: {
// //     target: any;
// //     prepared: LisPreparedPayload;
// //     headers: Record<string, string>;
// //     allowInsecureTls: boolean;
// //     requestTimeoutMs: number;
// //   }) {
// //     const body = args.prepared.body;
// //     if (!Array.isArray(body) || body.length === 0) return body;
// //     const missingAllocationRows = body.filter(
// //       (row) => row?.concept?.uuid && !row?.testAllocation?.uuid,
// //     );
// //     if (missingAllocationRows.length === 0) return body;
// //     const sampleUuid = await this.resolveSampleUuid({
// //       target: args.target,
// //       wrapper: args.prepared.wrapper,
// //       headers: args.headers,
// //       allowInsecureTls: args.allowInsecureTls,
// //       requestTimeoutMs: args.requestTimeoutMs,
// //     });
// //     if (!sampleUuid) {
// //       throw new Error(
// //         "LIS delivery cannot resolve dynamic test allocations because the payload does not contain sample.uuid or sample.label/sample.id.",
// //       );
// //     }
// //     const allocations = await this.fetchAllocationsBySample({
// //       target: args.target,
// //       sampleUuid,
// //       headers: args.headers,
// //       allowInsecureTls: args.allowInsecureTls,
// //       requestTimeoutMs: args.requestTimeoutMs,
// //     });
// //     const allocationByConcept = this.indexAllocationsByConcept(allocations);
// //     const resolved = body.map((row) => {
// //       if (!row?.concept?.uuid || row?.testAllocation?.uuid) return row;
// //       const allocationUuid = allocationByConcept.get(String(row.concept.uuid));
// //       if (!allocationUuid) {
// //         throw new Error(
// //           `LIS delivery cannot resolve test allocation for concept ${row.concept.uuid} from sample ${sampleUuid}. Confirm the sample has an active allocation for this parameter.`,
// //         );
// //       }
// //       return {
// //         ...row,
// //         testAllocation: { uuid: allocationUuid },
// //       };
// //     });
// //     args.prepared.diagnostics.push(
// //       `Resolved ${missingAllocationRows.length} LIS test allocation${missingAllocationRows.length === 1 ? "" : "s"} from OpenMRS sample allocations.`,
// //     );
// //     return resolved;
// //   }
// //   private async resolveSampleUuid(args: {
// //     target: any;
// //     wrapper: any;
// //     headers: Record<string, string>;
// //     allowInsecureTls: boolean;
// //     requestTimeoutMs: number;
// //   }) {
// //     const sample = args.wrapper?.sample ?? {};
// //     const uuid = this.firstNonEmpty(sample?.uuid);
// //     if (uuid) return uuid;
// //     const label = this.firstNonEmpty(
// //       sample?.label,
// //       sample?.id,
// //       args.wrapper?.context?.sample?.label,
// //       args.wrapper?.context?.sample?.id,
// //     );
// //     if (!label) return null;
// //     const url = this.joinUrl(
// //       args.target.base_url,
// //       `/openmrs/ws/rest/v1/lab/samplelookup?sampleId=${encodeURIComponent(label)}`,
// //     );
// //     const res = await this.http.getJson(
// //       url,
// //       args.headers,
// //       args.allowInsecureTls,
// //       args.requestTimeoutMs,
// //     );
// //     if (!res.ok) {
// //       throw new Error(
// //         `LIS sample lookup failed with status ${res.status}: ${res.body || "No response body"}`,
// //       );
// //     }
// //     const body = this.parseBody(res.body);
// //     return this.firstNonEmpty(body?.sample?.uuid, body?.uuid);
// //   }
// //   private async fetchAllocationsBySample(args: {
// //     target: any;
// //     sampleUuid: string;
// //     headers: Record<string, string>;
// //     allowInsecureTls: boolean;
// //     requestTimeoutMs: number;
// //   }) {
// //     const url = this.joinUrl(
// //       args.target.base_url,
// //       `/openmrs/ws/rest/v1/lab/allocationsbysample?uuid=${encodeURIComponent(args.sampleUuid)}`,
// //     );
// //     const res = await this.http.getJson(
// //       url,
// //       args.headers,
// //       args.allowInsecureTls,
// //       args.requestTimeoutMs,
// //     );
// //     if (!res.ok) {
// //       throw new Error(
// //         `LIS sample allocations lookup failed with status ${res.status}: ${res.body || "No response body"}`,
// //       );
// //     }
// //     return this.parseBody(res.body);
// //   }
// //   private indexAllocationsByConcept(payload: any) {
// //     const rows = Array.isArray(payload)
// //       ? payload
// //       : Array.isArray(payload?.results)
// //         ? payload.results
// //         : [];
// //     const map = new Map<string, string>();
// //     for (const row of rows) {
// //       const allocationUuid = this.firstNonEmpty(
// //         row?.uuid,
// //         row?.testAllocation?.uuid,
// //       );
// //       const conceptUuid = this.firstNonEmpty(
// //         row?.concept?.uuid,
// //         row?.parameter?.uuid,
// //         row?.testParameter?.uuid,
// //       );
// //       if (allocationUuid && conceptUuid && !map.has(conceptUuid)) {
// //         map.set(conceptUuid, allocationUuid);
// //       }
// //     }
// //     return map;
// //   }
// //   private joinUrl(baseUrl: string, path: string) {
// //     const base = String(baseUrl ?? "").replace(/\/+$/, "");
// //     let suffix = String(path ?? "").startsWith("/")
// //       ? String(path ?? "")
// //       : `/${path}`;
// //     if (
// //       base.endsWith("/openmrs/ws/rest/v1") &&
// //       suffix.startsWith("/openmrs/ws/rest/v1/")
// //     ) {
// //       suffix = suffix.replace("/openmrs/ws/rest/v1", "");
// //     }
// //     return `${base}${suffix}`;
// //   }
// //   private parseBody(body: any) {
// //     if (typeof body !== "string") return body;
// //     try {
// //       return JSON.parse(body);
// //     } catch {
// //       return body;
// //     }
// //   }
// //   private firstNonEmpty(...values: any[]) {
// //     for (const value of values) {
// //       if (value !== undefined && value !== null && String(value).trim() !== "")
// //         return String(value).trim();
// //     }
// //     return null;
// //   }
// // }
// // import { SecureHttpClient } from '../security/secure-http.client';
// // import { DeliveryAdapter } from './delivery-adapter.interface';
// // type LisPreparedPayload = {
// //   endpoint: string;
// //   body: any;
// //   diagnostics: string[];
// //   context?: any;
// // };
// // type AllocationRow = {
// //   uuid?: string;
// //   concept?: any;
// //   parameter?: any;
// //   sample?: any;
// //   order?: any;
// // };
// // export class LisDeliveryAdapter implements DeliveryAdapter {
// //   private http = new SecureHttpClient();
// //   async send(args: {
// //     target: any;
// //     queueItem: any;
// //     headers: Record<string, string>;
// //     allowInsecureTls?: boolean;
// //     requestTimeoutMs?: number | null;
// //   }) {
// //     const storedPayload = JSON.parse(args.queueItem.payload_json || '{}');
// //     const prepared = this.preparePayload(storedPayload);
// //     const timeout = Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000);
// //     const resolved = await this.resolveDynamicOpenMrsLisPayload(
// //       args.target,
// //       prepared,
// //       args.headers,
// //       !!args.allowInsecureTls,
// //       timeout,
// //     );
// //     const url = this.joinUrl(args.target.base_url, resolved.endpoint);
// //     const res = await this.http.postJson(
// //       url,
// //       resolved.body,
// //       args.headers,
// //       !!args.allowInsecureTls,
// //       timeout,
// //     );
// //     if (!res.ok) {
// //       throw new Error(`LIS delivery failed with status ${res.status}: ${res.body || 'No response body'}`);
// //     }
// //     return {
// //       status: res.status,
// //       body: res.body,
// //       diagnostics: resolved.diagnostics,
// //     };
// //   }
// //   private preparePayload(payload: any): LisPreparedPayload {
// //     if (Array.isArray(payload)) {
// //       return {
// //         endpoint: '/lab/multipleresults',
// //         body: payload,
// //         diagnostics: ['Payload is already a LIS multiple-results array.'],
// //       };
// //     }
// //     if (payload?.resourceType === 'OpenMRSLabMultipleResultsRequest') {
// //       if (!Array.isArray(payload.body)) {
// //         throw new Error('OpenMRS LIS payload wrapper is missing body[].');
// //       }
// //       return {
// //         endpoint: payload.endpoint ?? '/lab/multipleresults',
// //         body: payload.body,
// //         context: payload.context ?? {},
// //         diagnostics: [
// //           `Prepared ${payload.body.length} LIS multiple-results row${payload.body.length === 1 ? '' : 's'} from OpenMRS LIS wrapper.`,
// //         ],
// //       };
// //     }
// //     if (Array.isArray(payload?.body)) {
// //       return {
// //         endpoint: payload.endpoint ?? '/lab/multipleresults',
// //         body: payload.body,
// //         context: payload.context ?? {},
// //         diagnostics: ['Prepared LIS body[] from generic payload wrapper.'],
// //       };
// //     }
// //     if (Array.isArray(payload?.payload?.body)) {
// //       return {
// //         endpoint: payload.payload.endpoint ?? payload.endpoint ?? '/lab/multipleresults',
// //         body: payload.payload.body,
// //         context: payload.payload.context ?? payload.context ?? {},
// //         diagnostics: ['Prepared LIS payload.body[] from nested payload wrapper.'],
// //       };
// //     }
// //     return {
// //       endpoint: payload?.endpoint ?? '/lab/multipleresults',
// //       body: payload,
// //       context: payload?.context ?? {},
// //       diagnostics: [
// //         'Payload did not use a known LIS wrapper. It was sent as-is to the LIS endpoint.',
// //       ],
// //     };
// //   }
// //   private async resolveDynamicOpenMrsLisPayload(
// //     target: any,
// //     prepared: LisPreparedPayload,
// //     headers: Record<string, string>,
// //     allowInsecureTls: boolean,
// //     timeout: number,
// //   ): Promise<LisPreparedPayload> {
// //     if (!this.isMultipleResultsEndpoint(prepared.endpoint) || !Array.isArray(prepared.body)) {
// //       return prepared;
// //     }
// //     const rows = prepared.body.map((row: any) => this.cloneRow(row));
// //     const missingAllocation = rows.some((row: any) => !row?.testAllocation?.uuid);
// //     if (!missingAllocation) {
// //       return { ...prepared, body: rows.map((row: any) => this.stripInternalFields(row)) };
// //     }
// //     const sampleUuid = this.extractSampleUuid(prepared.context, rows);
// //     const sampleLabel = this.extractSampleLabel(prepared.context, rows);
// //     let resolvedSampleUuid = sampleUuid;
// //     const diagnostics = [...prepared.diagnostics];
// //     if (!resolvedSampleUuid && sampleLabel) {
// //       const lookupUrl = this.joinUrl(
// //         target.base_url,
// //         `/lab/samplelookup?sampleId=${encodeURIComponent(sampleLabel)}`,
// //       );
// //       const lookup = await this.http.getJson(lookupUrl, headers, allowInsecureTls, timeout);
// //       if (!lookup?.found || !lookup?.sample?.uuid) {
// //         throw new Error(`Could not resolve OpenMRS sample for label/barcode "${sampleLabel}".`);
// //       }
// //       resolvedSampleUuid = String(lookup.sample.uuid);
// //       diagnostics.push(`Resolved sample "${sampleLabel}" to UUID ${resolvedSampleUuid}.`);
// //     }
// //     if (!resolvedSampleUuid) {
// //       throw new Error(
// //         'LIS payload has rows without testAllocation.uuid and no sample UUID/label is available for dynamic OpenMRS allocation resolution.',
// //       );
// //     }
// //     const allocationsUrl = this.joinUrl(
// //       target.base_url,
// //       `/lab/allocationsbysample?uuid=${encodeURIComponent(resolvedSampleUuid)}`,
// //     );
// //     const allocationsPayload = await this.http.getJson(allocationsUrl, headers, allowInsecureTls, timeout);
// //     const allocations = Array.isArray(allocationsPayload) ? allocationsPayload : allocationsPayload?.results;
// //     if (!Array.isArray(allocations) || allocations.length === 0) {
// //       throw new Error(`No OpenMRS LIS allocations were found for sample UUID ${resolvedSampleUuid}.`);
// //     }
// //     for (const row of rows) {
// //       if (row?.testAllocation?.uuid) continue;
// //       const allocation = this.findAllocationForRow(row, allocations);
// //       if (!allocation?.uuid) {
// //         const conceptUuid = row?.concept?.uuid ?? 'unknown concept';
// //         throw new Error(
// //           `Could not resolve OpenMRS LIS testAllocation.uuid for concept ${conceptUuid} on sample ${resolvedSampleUuid}.`,
// //         );
// //       }
// //       row.testAllocation = { uuid: allocation.uuid };
// //       if (!row.concept?.uuid) {
// //         const conceptUuid = this.extractConceptUuid(allocation);
// //         if (conceptUuid) row.concept = { uuid: conceptUuid };
// //       }
// //     }
// //     diagnostics.push(
// //       'Resolved missing LIS testAllocation.uuid values from /lab/samplelookup and /lab/allocationsbysample before delivery.',
// //     );
// //     return {
// //       ...prepared,
// //       body: rows.map((row: any) => this.stripInternalFields(row)),
// //       diagnostics,
// //     };
// //   }
// //   private findAllocationForRow(row: any, allocations: AllocationRow[]): AllocationRow | null {
// //     const conceptUuid = String(row?.concept?.uuid ?? '').trim();
// //     const analyzerCode = String(row?.analyzerCode ?? row?.code ?? row?.parameterCode ?? '').trim();
// //     if (conceptUuid) {
// //       const byConcept = allocations.find(
// //         (allocation) => this.extractConceptUuid(allocation) === conceptUuid,
// //       );
// //       if (byConcept) return byConcept;
// //     }
// //     if (analyzerCode) {
// //       const analyzerKey = this.normalizedKey(analyzerCode);
// //       const byCode = allocations.find((allocation) =>
// //         this.allocationCodes(allocation).some((code) => this.normalizedKey(code) === analyzerKey),
// //       );
// //       if (byCode) return byCode;
// //     }
// //     return null;
// //   }
// //   private allocationCodes(allocation: AllocationRow): string[] {
// //     const concept = allocation?.concept ?? allocation?.parameter ?? {};
// //     const values = [concept.display, concept.name, concept.uuid];
// //     const mappings = Array.isArray(concept.mappings) ? concept.mappings : [];
// //     for (const mapping of mappings) {
// //       values.push(
// //         mapping?.conceptReference?.code,
// //         mapping?.conceptReference?.display,
// //         mapping?.conceptReference?.name,
// //       );
// //     }
// //     return values.map((value) => String(value ?? '').trim()).filter(Boolean);
// //   }
// //   private extractConceptUuid(allocation: AllocationRow): string | null {
// //     return String(allocation?.concept?.uuid ?? allocation?.parameter?.uuid ?? '').trim() || null;
// //   }
// //   private extractSampleUuid(context: any, rows: any[]): string | null {
// //     return (
// //       String(context?.sample?.uuid ?? '').trim() ||
// //       String(rows.find((row) => row?.sample?.uuid)?.sample?.uuid ?? '').trim() ||
// //       null
// //     );
// //   }
// //   private extractSampleLabel(context: any, rows: any[]): string | null {
// //     return (
// //       String(context?.sample?.label ?? context?.sample?.id ?? '').trim() ||
// //       String(rows.find((row) => row?.sample?.label)?.sample?.label ?? '').trim() ||
// //       String(rows.find((row) => row?.sampleId)?.sampleId ?? '').trim() ||
// //       null
// //     );
// //   }
// //   private cloneRow(row: any) {
// //     return row && typeof row === 'object' ? JSON.parse(JSON.stringify(row)) : row;
// //   }
// //   private stripInternalFields(row: any) {
// //     if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
// //     const cleaned: any = {};
// //     for (const [key, value] of Object.entries(row)) {
// //       if (key.startsWith('_') || key === 'analyzerCode' || key === 'parameterCode' || key === 'code' || key === 'sampleId') {
// //         continue;
// //       }
// //       cleaned[key] = value;
// //     }
// //     return cleaned;
// //   }
// //   private isMultipleResultsEndpoint(endpoint: string) {
// //     return String(endpoint ?? '').toLowerCase().includes('/lab/multipleresults');
// //   }
// //   private normalizedKey(value: string) {
// //     return String(value ?? '').replace(/[^a-zA-Z0-9]+/g, '').toUpperCase();
// //   }
// //   private joinUrl(baseUrl: string, path: string) {
// //     const base = String(baseUrl ?? '').replace(/\/+$/, '');
// //     let suffix = String(path ?? '').startsWith('/') ? String(path) : `/${path}`;
// //     if (base.endsWith('/openmrs/ws/rest/v1') && suffix.startsWith('/openmrs/ws/rest/v1/')) {
// //       suffix = suffix.replace('/openmrs/ws/rest/v1', '');
// //     }
// //     if (base.endsWith('/ws/rest/v1') && suffix.startsWith('/openmrs/ws/rest/v1/')) {
// //       suffix = suffix.replace('/openmrs/ws/rest/v1', '');
// //     }
// //     return `${base}${suffix}`;
// //   }
// // }
// // import { SecureHttpClient } from '../security/secure-http.client';
// // import { DeliveryAdapter } from './delivery-adapter.interface';
// // type LisPreparedPayload = {
// //     endpoint: string;
// //     body: any[] | any;
// //     context: any;
// //     diagnostics: string[];
// // };
// // const REST_PREFIX = '/openmrs/ws/rest/v1';
// // const DEFAULT_MULTIPLE_RESULTS_ENDPOINT = '/lab/multipleresults';
// // export class LisDeliveryAdapter implements DeliveryAdapter {
// //     private http = new SecureHttpClient();
// //     async send(args: {
// //         target: any;
// //         queueItem: any;
// //         headers: Record<string, string>;
// //         allowInsecureTls?: boolean;
// //         requestTimeoutMs?: number | null;
// //     }) {
// //         const storedPayload = JSON.parse(args.queueItem.payload_json || '{}');
// //         const prepared = this.preparePayload(storedPayload);
// //         const timeout = Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000);
// //         const allowInsecureTls = !!args.allowInsecureTls;
// //         if (Array.isArray(prepared.body)) {
// //             await this.ensureSampleAllocations({
// //                 target: args.target,
// //                 body: prepared.body,
// //                 context: prepared.context,
// //                 headers: args.headers,
// //                 allowInsecureTls,
// //                 timeout,
// //                 diagnostics: prepared.diagnostics,
// //             });
// //         }
// //         const url = this.openMrsRestUrl(args.target.base_url, prepared.endpoint);
// //         const res = await this.http.postJson(
// //             url,
// //             prepared.body,
// //             args.headers,
// //             allowInsecureTls,
// //             timeout,
// //         );
// //         if (!res.ok) {
// //             throw new Error(`LIS delivery failed with status ${res.status}: ${res.body || 'No response body'}`);
// //         }
// //         return {
// //             status: res.status,
// //             body: res.body,
// //             diagnostics: prepared.diagnostics,
// //         };
// //     }
// //     private preparePayload(payload: any): LisPreparedPayload {
// //         if (Array.isArray(payload)) {
// //             return {
// //                 endpoint: DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
// //                 body: payload,
// //                 context: {},
// //                 diagnostics: ['Payload is already a LIS multiple-results array.'],
// //             };
// //         }
// //         if (payload?.resourceType === 'OpenMRSLabMultipleResultsRequest') {
// //             if (!Array.isArray(payload.body)) {
// //                 throw new Error('OpenMRS LIS payload wrapper is missing body[].');
// //             }
// //             return {
// //                 endpoint: payload.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
// //                 body: payload.body,
// //                 context: payload.context ?? {},
// //                 diagnostics: [
// //                     `Prepared ${payload.body.length} LIS multiple-results row${payload.body.length === 1 ? '' : 's'} from OpenMRS LIS wrapper.`,
// //                 ],
// //             };
// //         }
// //         if (Array.isArray(payload?.body)) {
// //             return {
// //                 endpoint: payload.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
// //                 body: payload.body,
// //                 context: payload.context ?? {},
// //                 diagnostics: ['Prepared LIS body[] from generic payload wrapper.'],
// //             };
// //         }
// //         if (Array.isArray(payload?.payload?.body)) {
// //             return {
// //                 endpoint: payload.payload.endpoint ?? payload.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
// //                 body: payload.payload.body,
// //                 context: payload.payload.context ?? payload.context ?? {},
// //                 diagnostics: ['Prepared LIS payload.body[] from nested payload wrapper.'],
// //             };
// //         }
// //         return {
// //             endpoint: payload?.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
// //             body: payload,
// //             context: payload?.context ?? {},
// //             diagnostics: [
// //                 'Payload did not use a known LIS wrapper. It was sent as-is to the LIS endpoint.',
// //             ],
// //         };
// //     }
// //     private async ensureSampleAllocations(args: {
// //         target: any;
// //         body: any[];
// //         context: any;
// //         headers: Record<string, string>;
// //         allowInsecureTls: boolean;
// //         timeout: number;
// //         diagnostics: string[];
// //     }) {
// //         const missingRows = args.body.filter((row) => row?.concept?.uuid && !row?.testAllocation?.uuid);
// //         if (!missingRows.length) return;
// //         const sampleUuid = await this.resolveSampleUuid(args);
// //         if (!sampleUuid) {
// //             throw new Error(
// //                 'LIS payload is missing testAllocation UUID and the sample could not be resolved. Rebuild the payload after selecting/configuring the correct sample label.',
// //             );
// //         }
// //         const allocations = await this.fetchAllocations(args.target, sampleUuid, args.headers, args.allowInsecureTls, args.timeout);
// //         const allocationByConceptUuid = this.indexAllocationsByConceptUuid(allocations);
// //         for (const row of missingRows) {
// //             const allocationUuid = allocationByConceptUuid.get(this.key(row.concept.uuid));
// //             if (allocationUuid) row.testAllocation = { uuid: allocationUuid };
// //         }
// //         const unresolved = args.body.filter((row) => row?.concept?.uuid && !row?.testAllocation?.uuid);
// //         if (unresolved.length) {
// //             const concepts = unresolved.map((row) => row.concept.uuid).join(', ');
// //             throw new Error(
// //                 `LIS payload is missing testAllocation UUID for concept(s): ${concepts}. Confirm the sample has active allocations for these test parameters in OpenMRS LIS.`,
// //             );
// //         }
// //         args.diagnostics.push(
// //             `Resolved ${missingRows.length} LIS test allocation${missingRows.length === 1 ? '' : 's'} from OpenMRS sample allocations before delivery.`,
// //         );
// //     }
// //     private async resolveSampleUuid(args: {
// //         target: any;
// //         context: any;
// //         headers: Record<string, string>;
// //         allowInsecureTls: boolean;
// //         timeout: number;
// //     }): Promise<string | null> {
// //         const directUuid = this.firstText(
// //             args.context?.sample?.uuid,
// //             args.context?.sampleUuid,
// //             args.context?.sample?.id,
// //         );
// //         if (directUuid) return directUuid;
// //         const label = this.firstText(
// //             args.context?.sample?.label,
// //             args.context?.sample?.display,
// //             args.context?.sampleLabel,
// //             args.context?.barcode,
// //         );
// //         if (!label) return null;
// //         const payload = await this.getJson(
// //             args.target,
// //             `/lab/samplelookup?sampleId=${encodeURIComponent(label)}`,
// //             args.headers,
// //             args.allowInsecureTls,
// //             args.timeout,
// //             'sample lookup',
// //         );
// //         return this.firstText(payload?.sample?.uuid, payload?.uuid);
// //     }
// //     private async fetchAllocations(
// //         target: any,
// //         sampleUuid: string,
// //         headers: Record<string, string>,
// //         allowInsecureTls: boolean,
// //         timeout: number,
// //     ) {
// //         return this.getJson(
// //             target,
// //             `/lab/allocationsbysample?uuid=${encodeURIComponent(sampleUuid)}`,
// //             headers,
// //             allowInsecureTls,
// //             timeout,
// //             'sample allocations',
// //         );
// //     }
// //     private async getJson(
// //         target: any,
// //         path: string,
// //         headers: Record<string, string>,
// //         allowInsecureTls: boolean,
// //         timeout: number,
// //         label: string,
// //     ) {
// //         const url = this.openMrsRestUrl(target.base_url, path);
// //         const res = await this.http.getJson(url, headers, allowInsecureTls, timeout);
// //         if (!res.ok) throw new Error(`Failed to fetch ${label}: HTTP ${res.status}.`);
// //         if (!res.json) throw new Error(`Failed to fetch ${label}: response was not valid JSON.`);
// //         return res.json;
// //     }
// //     private indexAllocationsByConceptUuid(payload: any): Map<string, string> {
// //         const index = new Map<string, string>();
// //         const visit = (node: any, parent: any = null) => {
// //             if (!node) return;
// //             if (Array.isArray(node)) {
// //                 for (const item of node) visit(item, parent);
// //                 return;
// //             }
// //             if (typeof node !== 'object') return;
// //             const conceptUuid = this.firstText(
// //                 node.concept?.uuid,
// //                 node.parameter?.uuid,
// //                 node.testParameter?.uuid,
// //                 node.parameterConcept?.uuid,
// //                 node.conceptUuid,
// //                 node.parameterUuid,
// //             );
// //             const allocationUuid = this.firstText(
// //                 node.testAllocation?.uuid,
// //                 node.allocation?.uuid,
// //                 node.uuid,
// //                 parent?.testAllocation?.uuid,
// //                 parent?.allocation?.uuid,
// //             );
// //             if (conceptUuid && allocationUuid) index.set(this.key(conceptUuid), allocationUuid);
// //             for (const value of Object.values(node)) visit(value, node);
// //         };
// //         visit(payload);
// //         return index;
// //     }
// //     private openMrsRestUrl(baseUrl: string, path: string) {
// //         const base = String(baseUrl ?? '').replace(/\/+$/, '');
// //         let suffix = String(path ?? '').trim() || DEFAULT_MULTIPLE_RESULTS_ENDPOINT;
// //         if (/^https?:\/\//i.test(suffix)) return suffix;
// //         if (!suffix.startsWith('/')) suffix = `/${suffix}`;
// //         if (suffix.startsWith(REST_PREFIX)) {
// //             if (base.endsWith(REST_PREFIX)) return `${base}${suffix.slice(REST_PREFIX.length)}`;
// //             if (base.endsWith('/openmrs')) return `${base}${suffix.slice('/openmrs'.length)}`;
// //             return `${base}${suffix}`;
// //         }
// //         if (suffix.startsWith('/ws/rest/v1')) {
// //             if (base.endsWith(REST_PREFIX)) return `${base}${suffix.slice('/ws/rest/v1'.length)}`;
// //             if (base.endsWith('/openmrs')) return `${base}${suffix}`;
// //             return `${base}/openmrs${suffix}`;
// //         }
// //         if (base.endsWith(REST_PREFIX)) return `${base}${suffix}`;
// //         if (base.endsWith('/openmrs')) return `${base}/ws/rest/v1${suffix}`;
// //         return `${base}${REST_PREFIX}${suffix}`;
// //     }
// //     private firstText(...values: any[]): string | null {
// //         for (const value of values) {
// //             const text = String(value ?? '').trim();
// //             if (text) return text;
// //         }
// //         return null;
// //     }
// //     private key(value: any): string {
// //         return String(value ?? '').trim().toUpperCase();
// //     }
// // }
// import { SecureHttpClient } from '../security/secure-http.client';
// import { DeliveryAdapter } from './delivery-adapter.interface';
// type LisPreparedPayload = {
//     endpoint: string;
//     body: any[] | any;
//     context: any;
//     diagnostics: string[];
// };
// const REST_PREFIX = '/openmrs/ws/rest/v1';
// const DEFAULT_MULTIPLE_RESULTS_ENDPOINT = '/openmrs/ws/rest/v1/lab/multipleresults';
// export class LisDeliveryAdapter implements DeliveryAdapter {
//     private http = new SecureHttpClient();
//     async send(args: {
//         target: any;
//         queueItem: any;
//         headers: Record<string, string>;
//         allowInsecureTls?: boolean;
//         requestTimeoutMs?: number | null;
//     }) {
//         const storedPayload = JSON.parse(args.queueItem.payload_json || '{}');
//         const prepared = this.preparePayload(storedPayload);
//         const timeout = Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000);
//         const allowInsecureTls = !!args.allowInsecureTls;
//         if (Array.isArray(prepared.body)) {
//             await this.ensureSampleAllocations({
//                 target: args.target,
//                 body: prepared.body,
//                 context: prepared.context,
//                 headers: args.headers,
//                 allowInsecureTls,
//                 timeout,
//                 diagnostics: prepared.diagnostics,
//             });
//         }
//         const url = this.openMrsRestUrl(args.target.base_url, prepared.endpoint);
//         const res = await this.http.postJson(
//             url,
//             prepared.body,
//             args.headers,
//             allowInsecureTls,
//             timeout,
//         );
//         if (!res.ok) {
//             throw new Error(`LIS delivery failed with status ${res.status}: ${res.body || 'No response body'}`);
//         }
//         return {
//             status: res.status,
//             body: res.body,
//             diagnostics: prepared.diagnostics,
//         };
//     }
//     private preparePayload(payload: any): LisPreparedPayload {
//         if (Array.isArray(payload)) {
//             return {
//                 endpoint: DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
//                 body: payload,
//                 context: {},
//                 diagnostics: ['Payload is already a LIS multiple-results array.'],
//             };
//         }
//         if (payload?.resourceType === 'OpenMRSLabMultipleResultsRequest') {
//             if (!Array.isArray(payload.body)) {
//                 throw new Error('OpenMRS LIS payload wrapper is missing body[].');
//             }
//             return {
//                 endpoint: payload.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
//                 body: payload.body,
//                 context: payload.context ?? {},
//                 diagnostics: [
//                     `Prepared ${payload.body.length} LIS multiple-results row${payload.body.length === 1 ? '' : 's'} from OpenMRS LIS wrapper.`,
//                 ],
//             };
//         }
//         if (Array.isArray(payload?.body)) {
//             return {
//                 endpoint: payload.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
//                 body: payload.body,
//                 context: payload.context ?? {},
//                 diagnostics: ['Prepared LIS body[] from generic payload wrapper.'],
//             };
//         }
//         if (Array.isArray(payload?.payload?.body)) {
//             return {
//                 endpoint: payload.payload.endpoint ?? payload.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
//                 body: payload.payload.body,
//                 context: payload.payload.context ?? payload.context ?? {},
//                 diagnostics: ['Prepared LIS payload.body[] from nested payload wrapper.'],
//             };
//         }
//         return {
//             endpoint: payload?.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
//             body: payload,
//             context: payload?.context ?? {},
//             diagnostics: [
//                 'Payload did not use a known LIS wrapper. It was sent as-is to the LIS endpoint.',
//             ],
//         };
//     }
//     private async ensureSampleAllocations(args: {
//         target: any;
//         body: any[];
//         context: any;
//         headers: Record<string, string>;
//         allowInsecureTls: boolean;
//         timeout: number;
//         diagnostics: string[];
//     }) {
//         const missingRows = args.body.filter((row) => row?.concept?.uuid && !row?.testAllocation?.uuid);
//         if (!missingRows.length) return;
//         const sampleUuid = await this.resolveSampleUuid(args);
//         if (!sampleUuid) {
//             throw new Error(
//                 'LIS payload is missing testAllocation UUID and the sample could not be resolved. Rebuild the payload after selecting/configuring the correct sample label.',
//             );
//         }
//         const allocations = await this.fetchAllocations(args.target, sampleUuid, args.headers, args.allowInsecureTls, args.timeout);
//         const allocationByConceptUuid = this.indexAllocationsByConceptUuid(allocations);
//         for (const row of missingRows) {
//             const allocationUuid = allocationByConceptUuid.get(this.key(row.concept.uuid));
//             if (allocationUuid) row.testAllocation = { uuid: allocationUuid };
//         }
//         const unresolved = args.body.filter((row) => row?.concept?.uuid && !row?.testAllocation?.uuid);
//         if (unresolved.length) {
//             const concepts = unresolved.map((row) => row.concept.uuid).join(', ');
//             throw new Error(
//                 `LIS payload is missing testAllocation UUID for concept(s): ${concepts}. Confirm the sample has active allocations for these test parameters in OpenMRS LIS.`,
//             );
//         }
//         args.diagnostics.push(
//             `Resolved ${missingRows.length} LIS test allocation${missingRows.length === 1 ? '' : 's'} from OpenMRS sample allocations before delivery.`,
//         );
//     }
//     private async resolveSampleUuid(args: {
//         target: any;
//         context: any;
//         headers: Record<string, string>;
//         allowInsecureTls: boolean;
//         timeout: number;
//     }): Promise<string | null> {
//         const directUuid = this.firstText(
//             args.context?.sample?.uuid,
//             args.context?.sampleUuid,
//             args.context?.sample?.id,
//         );
//         if (directUuid) return directUuid;
//         const label = this.firstText(
//             args.context?.sample?.label,
//             args.context?.sample?.display,
//             args.context?.sampleLabel,
//             args.context?.barcode,
//         );
//         if (!label) return null;
//         const payload = await this.getJson(
//             args.target,
//             `/lab/samplelookup?sampleId=${encodeURIComponent(label)}`,
//             args.headers,
//             args.allowInsecureTls,
//             args.timeout,
//             'sample lookup',
//         );
//         return this.firstText(payload?.sample?.uuid, payload?.uuid);
//     }
//     private async fetchAllocations(
//         target: any,
//         sampleUuid: string,
//         headers: Record<string, string>,
//         allowInsecureTls: boolean,
//         timeout: number,
//     ) {
//         return this.getJson(
//             target,
//             `/lab/allocationsbysample?uuid=${encodeURIComponent(sampleUuid)}`,
//             headers,
//             allowInsecureTls,
//             timeout,
//             'sample allocations',
//         );
//     }
//     private async getJson(
//         target: any,
//         path: string,
//         headers: Record<string, string>,
//         allowInsecureTls: boolean,
//         timeout: number,
//         label: string,
//     ) {
//         const url = this.openMrsRestUrl(target.base_url, path);
//         const res = await this.http.getJson(url, headers, allowInsecureTls, timeout);
//         if (!res.ok) throw new Error(`Failed to fetch ${label}: HTTP ${res.status}.`);
//         if (!res.json) throw new Error(`Failed to fetch ${label}: response was not valid JSON.`);
//         return res.json;
//     }
//     private indexAllocationsByConceptUuid(payload: any): Map<string, string> {
//         const index = new Map<string, string>();
//         const visit = (node: any, parent: any = null) => {
//             if (!node) return;
//             if (Array.isArray(node)) {
//                 for (const item of node) visit(item, parent);
//                 return;
//             }
//             if (typeof node !== 'object') return;
//             const conceptUuid = this.firstText(
//                 node.concept?.uuid,
//                 node.parameter?.uuid,
//                 node.testParameter?.uuid,
//                 node.parameterConcept?.uuid,
//                 node.conceptUuid,
//                 node.parameterUuid,
//             );
//             const allocationUuid = this.firstText(
//                 node.testAllocation?.uuid,
//                 node.allocation?.uuid,
//                 node.uuid,
//                 parent?.testAllocation?.uuid,
//                 parent?.allocation?.uuid,
//             );
//             if (conceptUuid && allocationUuid) index.set(this.key(conceptUuid), allocationUuid);
//             for (const value of Object.values(node)) visit(value, node);
//         };
//         visit(payload);
//         return index;
//     }
//     private openMrsRestUrl(baseUrl: string, path: string) {
//         const base = String(baseUrl ?? '').replace(/\/+$/, '');
//         let suffix = String(path ?? '').trim() || DEFAULT_MULTIPLE_RESULTS_ENDPOINT;
//         if (/^https?:\/\//i.test(suffix)) return suffix;
//         if (!suffix.startsWith('/')) suffix = `/${suffix}`;
//         if (suffix.startsWith(REST_PREFIX)) {
//             if (base.endsWith(REST_PREFIX)) return `${base}${suffix.slice(REST_PREFIX.length)}`;
//             if (base.endsWith('/openmrs')) return `${base}${suffix.slice('/openmrs'.length)}`;
//             return `${base}${suffix}`;
//         }
//         if (suffix.startsWith('/ws/rest/v1')) {
//             if (base.endsWith(REST_PREFIX)) return `${base}${suffix.slice('/ws/rest/v1'.length)}`;
//             if (base.endsWith('/openmrs')) return `${base}${suffix}`;
//             return `${base}/openmrs${suffix}`;
//         }
//         if (base.endsWith(REST_PREFIX)) return `${base}${suffix}`;
//         if (base.endsWith('/openmrs')) return `${base}/ws/rest/v1${suffix}`;
//         return `${base}${REST_PREFIX}${suffix}`;
//     }
//     private firstText(...values: any[]): string | null {
//         for (const value of values) {
//             const text = String(value ?? '').trim();
//             if (text) return text;
//         }
//         return null;
//     }
//     private key(value: any): string {
//         return String(value ?? '').trim().toUpperCase();
//     }
// }
// import { SecureHttpClient } from '../security/secure-http.client';
// import { DeliveryAdapter } from './delivery-adapter.interface';
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
// import { SecureHttpClient } from '../security/secure-http.client';
// import { DeliveryAdapter } from './delivery-adapter.interface';
// type LisPreparedPayload = {
//     endpoint: string;
//     body: any;
//     diagnostics: string[];
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
//         const storedPayload = JSON.parse(args.queueItem.payload_json || '{}');
//         const prepared = this.preparePayload(storedPayload);
//         const url = this.joinUrl(args.target.base_url, prepared.endpoint);
//         const res = await this.http.postJson(
//             url,
//             prepared.body,
//             args.headers,
//             !!args.allowInsecureTls,
//             Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000),
//         );
//         if (!res.ok) {
//             throw new Error(`LIS delivery failed with status ${res.status}: ${res.body || 'No response body'}`);
//         }
//         return {
//             status: res.status,
//             body: res.body,
//             diagnostics: prepared.diagnostics,
//         };
//     }
//     private preparePayload(payload: any): LisPreparedPayload {
//         if (Array.isArray(payload)) {
//             return {
//                 endpoint: '/openmrs/ws/rest/v1/lab/multipleresults',
//                 body: payload,
//                 diagnostics: ['Payload is already a LIS multiple-results array.'],
//             };
//         }
//         if (payload?.resourceType === 'OpenMRSLabMultipleResultsRequest') {
//             if (!Array.isArray(payload.body)) {
//                 throw new Error('OpenMRS LIS payload wrapper is missing body[].');
//             }
//             return {
//                 endpoint: payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
//                 body: payload.body,
//                 diagnostics: [
//                     `Prepared ${payload.body.length} LIS multiple-results row${payload.body.length === 1 ? '' : 's'} from OpenMRS LIS wrapper.`,
//                 ],
//             };
//         }
//         if (Array.isArray(payload?.body)) {
//             return {
//                 endpoint: payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
//                 body: payload.body,
//                 diagnostics: ['Prepared LIS body[] from generic payload wrapper.'],
//             };
//         }
//         if (Array.isArray(payload?.payload?.body)) {
//             return {
//                 endpoint: payload.payload.endpoint ?? payload.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
//                 body: payload.payload.body,
//                 diagnostics: ['Prepared LIS payload.body[] from nested payload wrapper.'],
//             };
//         }
//         return {
//             endpoint: payload?.endpoint ?? '/openmrs/ws/rest/v1/lab/multipleresults',
//             body: payload,
//             diagnostics: [
//                 'Payload did not use a known LIS wrapper. It was sent as-is to the LIS endpoint.',
//             ],
//         };
//     }
//     private joinUrl(baseUrl: string, path: string) {
//         const base = String(baseUrl ?? '').replace(/\/+$/, '');
//         const suffix = String(path ?? '').startsWith('/') ? path : `/${path}`;
//         return `${base}${suffix}`;
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
        let suffix = String(path ?? '').startsWith('/') ? String(path ?? '') : `/${path}`;
        const hasOpenMrsRestPrefix = /\/openmrs\/ws\/rest\/v1$/i.test(base);
        if (hasOpenMrsRestPrefix && suffix.startsWith('/openmrs/ws/rest/v1/')) {
            suffix = suffix.replace('/openmrs/ws/rest/v1', '');
        }
        if (!hasOpenMrsRestPrefix && suffix.startsWith('/lab/')) {
            suffix = `/openmrs/ws/rest/v1${suffix}`;
        }
        return `${base}${suffix}`;
    }
}
exports.LisDeliveryAdapter = LisDeliveryAdapter;
