// // import { getDb } from '../db/db';
// // import { SecureHttpClient } from '../security/secure-http.client';
// // import { TargetSecretsService } from './target-secrets.service';
// // import { buildAuthHeaders } from '../security/delivery-auth.util';

// // type TargetRow = {
// //     id: string;
// //     type: string;
// //     name: string;
// //     base_url: string;
// //     request_timeout_ms?: number | null;
// // };

// // export type OpenMrsLisMetadataRequest = {
// //     targetId: string;
// //     sampleId?: string | null;
// //     sampleUuid?: string | null;
// //     includeConceptDetails?: boolean;
// //     userQuery?: string | null;
// // };

// // export type OpenMrsLisAnswerOption = {
// //     uuid: string;
// //     display: string;
// //     shortName?: string | null;
// //     analyzerCodes: string[];
// //     sourceValues?: string[];
// // };

// // export type OpenMrsLisUserOption = {
// //     uuid: string;
// //     username: string | null;
// //     display: string;
// //     personUuid?: string | null;
// // };

// // export type OpenMrsLisParameterMetadata = {
// //     analyzerCode: string;
// //     analyzerAliases: string[];
// //     display: string;
// //     conceptUuid: string | null;
// //     allocationUuid: string | null;
// //     datatype: string | null;
// //     answers: OpenMrsLisAnswerOption[];
// //     raw?: any;
// // };

// // export type OpenMrsLisMetadataResponse = {
// //     target: { id: string; name: string; type: string; baseUrl: string };
// //     lookup: any | null;
// //     sample: { uuid: string | null; label: string | null; found: boolean };
// //     settings: Record<string, string | null>;
// //     allocations: any | null;
// //     parameters: OpenMrsLisParameterMetadata[];
// //     instruments: Array<{ uuid: string; display: string; mappings?: any[] }>;
// //     testOrders: Array<{ uuid: string; display: string; mappings?: any[] }>;
// //     users: OpenMrsLisUserOption[];
// //     warnings: string[];
// // };

// // const REST_PREFIX = '/openmrs/ws/rest/v1';

// // const SETTINGS = [
// //     'iCare.laboratory.resultApprovalConfiguration',
// //     'iCare.lis.testParameterRelationship.conceptSourceUuid',
// //     'iCare.laboratory.settings.testParameters.attributes.multipleResultsAttributeTypeUuid',
// //     'iCare.laboratory.settings.testParameters.calculateValueExpressionAttributeTypeUuid',
// // ];

// // export class OpenMrsLisMetadataService {
// //     private readonly http = new SecureHttpClient();
// //     private readonly secrets = new TargetSecretsService();

// //     async discover(input: OpenMrsLisMetadataRequest): Promise<OpenMrsLisMetadataResponse> {
// //         const target = this.getTarget(input.targetId);
// //         if (!target) throw new Error('Target not found.');
// //         if (!['LIS', 'OPENMRS'].includes(target.type)) {
// //             throw new Error('OpenMRS LIS discovery can only run against LIS or OPENMRS targets.');
// //         }

// //         const targetBaseUrl = this.normalizedBaseUrl(target);
// //         const secret = this.secrets.get(target.id);
// //         const headers = buildAuthHeaders(secret as any);
// //         const allowInsecureTls = !!secret?.allowInsecureTls;
// //         const timeout = Number(target.request_timeout_ms ?? 15_000);
// //         const warnings: string[] = [];

// //         const lookup = await this.fetchOptional<any>(
// //             target,
// //             `/lab/samplelookup?sampleId=${encodeURIComponent(String(input.sampleId ?? '').trim())}`,
// //             headers,
// //             allowInsecureTls,
// //             timeout,
// //             !!String(input.sampleId ?? '').trim(),
// //             warnings,
// //             'sample lookup',
// //         );

// //         const sampleUuid =
// //             String(input.sampleUuid ?? '').trim() ||
// //             lookup?.sample?.uuid ||
// //             lookup?.uuid ||
// //             null;
// //         const sampleLabel = lookup?.sample?.label || lookup?.label || String(input.sampleId ?? '').trim() || null;

// //         const allocations = await this.fetchOptional<any>(
// //             target,
// //             sampleUuid ? `/lab/allocationsbysample?uuid=${encodeURIComponent(sampleUuid)}` : '',
// //             headers,
// //             allowInsecureTls,
// //             timeout,
// //             !!sampleUuid,
// //             warnings,
// //             'sample allocations',
// //         );

// //         const settings: Record<string, string | null> = {};
// //         for (const property of SETTINGS) {
// //             const payload = await this.fetchOptional<any>(
// //                 target,
// //                 `/systemsetting?q=${encodeURIComponent(property)}&v=full`,
// //                 headers,
// //                 allowInsecureTls,
// //                 timeout,
// //                 true,
// //                 warnings,
// //                 property,
// //             );
// //             settings[property] = payload?.results?.[0]?.value ?? null;
// //         }

// //         const instrumentsPayload = await this.fetchOptional<any>(
// //             target,
// //             '/concept?q=LIS_INSTRUMENT&limit=50&tag=LIS_INSTRUMENT&class=LIS%20instrument&v=custom:(uuid,display,datatype,conceptClass,mappings)',
// //             headers,
// //             allowInsecureTls,
// //             timeout,
// //             true,
// //             warnings,
// //             'LIS instruments',
// //         );

// //         const testOrdersPayload = await this.fetchOptional<any>(
// //             target,
// //             '/concept?q=TEST_ORDERS&limit=50&tag=TEST_ORDERS&class=Test&v=custom:(uuid,display,datatype,conceptClass,mappings)',
// //             headers,
// //             allowInsecureTls,
// //             timeout,
// //             true,
// //             warnings,
// //             'test orders',
// //         );

// //         const usersPayload = await this.fetchOpenMrsUsers(
// //             target,
// //             String(input.userQuery ?? '').trim(),
// //             headers,
// //             allowInsecureTls,
// //             timeout,
// //             warnings,
// //         );

// //         let parameters = this.extractParameters(allocations);
// //         if (input.includeConceptDetails !== false && parameters.length > 0) {
// //             parameters = await this.attachConceptDetails(target, parameters, headers, allowInsecureTls, timeout, warnings);
// //         }

// //         return {
// //             target: { id: target.id, name: target.name, type: target.type, baseUrl: targetBaseUrl },
// //             lookup: lookup ?? null,
// //             sample: { uuid: sampleUuid, label: sampleLabel, found: !!sampleUuid },
// //             settings,
// //             allocations: allocations ?? null,
// //             parameters,
// //             instruments: this.toConceptList(instrumentsPayload),
// //             testOrders: this.toConceptList(testOrdersPayload),
// //             users: this.toUserList(usersPayload),
// //             warnings,
// //         };
// //     }

// //     private getTarget(targetId: string): TargetRow | null {
// //         const db = getDb();
// //         return (db
// //             .prepare(
// //                 `
// //                     SELECT id, type, name, base_url, request_timeout_ms
// //                     FROM targets
// //                     WHERE id = ?
// //                     LIMIT 1
// //                 `,
// //             )
// //             .get(targetId) ?? null) as TargetRow | null;
// //     }

// //     private async fetchOptional<T>(
// //         target: TargetRow,
// //         path: string,
// //         headers: Record<string, string>,
// //         allowInsecureTls: boolean,
// //         timeout: number,
// //         shouldFetch: boolean,
// //         warnings: string[],
// //         label: string,
// //     ): Promise<T | null> {
// //         if (!shouldFetch || !path) return null;
// //         const url = this.restUrl(target, path);
// //         try {
// //             const res = (await this.http.getJson(url, headers, allowInsecureTls, timeout)) as any;
// //             if (!res.ok) {
// //                 this.pushWarning(warnings, `Failed to fetch ${label}: HTTP ${res.status}.`);
// //                 return null;
// //             }
// //             const json = this.responseJson(res);
// //             if (json === null || json === undefined) {
// //                 this.pushWarning(warnings, `Fetched ${label}, but the response was not valid JSON.`);
// //                 return null;
// //             }
// //             return json as T;
// //         } catch (error: any) {
// //             this.pushWarning(warnings, `Failed to fetch ${label}: ${error?.message ?? error}.`);
// //             return null;
// //         }
// //     }

// //     private normalizedBaseUrl(target: TargetRow): string {
// //         const base = String(target?.base_url ?? '').trim().replace(/\/+$/, '');
// //         if (!base) {
// //             throw new Error(`Base URL is not configured for target "${target?.name ?? target?.id ?? 'unknown'}".`);
// //         }
// //         return base;
// //     }

// //     private restUrl(target: TargetRow, path: string) {
// //         const base = this.normalizedBaseUrl(target);
// //         let suffix = String(path ?? '').trim();
// //         if (/^https?:\/\//i.test(suffix)) return suffix;
// //         if (!suffix.startsWith('/')) suffix = `/${suffix}`;

// //         if (base.endsWith(REST_PREFIX)) return `${base}${suffix}`;
// //         if (base.endsWith('/openmrs')) return `${base}/ws/rest/v1${suffix}`;
// //         return `${base}${REST_PREFIX}${suffix}`;
// //     }

// //     private toConceptList(payload: any): Array<{ uuid: string; display: string; mappings?: any[] }> {
// //         const rows = Array.isArray(payload?.results) ? payload.results : [];
// //         return rows
// //             .filter((row: any) => row?.uuid)
// //             .map((row: any) => ({
// //                 uuid: row.uuid,
// //                 display: row.display ?? row.name ?? row.uuid,
// //                 mappings: Array.isArray(row.mappings) ? row.mappings : [],
// //             }));
// //     }

// //     private async fetchOpenMrsUsers(
// //         target: TargetRow,
// //         query: string,
// //         headers: Record<string, string>,
// //         allowInsecureTls: boolean,
// //         timeout: number,
// //         warnings: string[],
// //     ): Promise<{ results: any[]; links: any[] }> {
// //         const limit = 25;
// //         const maxUsers = 5000;
// //         const userView = 'custom:(uuid,display,username,person:(uuid,display),retired)';
// //         const results: any[] = [];
// //         const seen = new Set<string>();
// //         const links: any[] = [];

// //         let startIndex = 0;
// //         let pageCount = 0;

// //         while (results.length < maxUsers && pageCount < 250) {
// //             const path =
// //                 `/user?startIndex=${startIndex}` +
// //                 `&limit=${limit}` +
// //                 `&v=${encodeURIComponent(userView)}` +
// //                 `&q=${encodeURIComponent(query)}`;

// //             const page = await this.fetchOptional<any>(
// //                 target,
// //                 path,
// //                 headers,
// //                 allowInsecureTls,
// //                 timeout,
// //                 true,
// //                 warnings,
// //                 `OpenMRS users page starting at ${startIndex}`,
// //             );

// //             if (!page) break;

// //             const rows = Array.isArray(page?.results) ? page.results : [];
// //             const pageLinks = Array.isArray(page?.links) ? page.links : [];
// //             links.push(...pageLinks);

// //             for (const row of rows) {
// //                 const uuid = String(row?.uuid ?? '').trim();
// //                 if (!uuid || seen.has(uuid)) continue;
// //                 seen.add(uuid);
// //                 results.push(row);
// //             }

// //             pageCount += 1;
// //             if (rows.length < limit) break;

// //             const nextStartIndex = this.nextStartIndex(page);
// //             startIndex = nextStartIndex != null && nextStartIndex > startIndex ? nextStartIndex : startIndex + limit;
// //         }

// //         if (results.length >= maxUsers) {
// //             warnings.push(`OpenMRS user fetch stopped after ${maxUsers} users to protect the app from an unexpectedly large response.`);
// //         }

// //         if (pageCount >= 250) {
// //             warnings.push('OpenMRS user fetch stopped after 250 pages. Check the user API paging response.');
// //         }

// //         return { results, links };
// //     }

// //     private nextStartIndex(payload: any): number | null {
// //         const links = Array.isArray(payload?.links) ? payload.links : [];
// //         const next = links.find((link: any) => String(link?.rel ?? '').toLowerCase() === 'next');
// //         const uri = String(next?.uri ?? '').trim();
// //         if (!uri) return null;

// //         const match = uri.match(/[?&]startIndex=(\d+)/);
// //         if (match) {
// //             const value = Number(match[1]);
// //             return Number.isFinite(value) && value >= 0 ? value : null;
// //         }

// //         try {
// //             const url = new URL(uri);
// //             const value = Number(url.searchParams.get('startIndex'));
// //             return Number.isFinite(value) && value >= 0 ? value : null;
// //         } catch {
// //             return null;
// //         }
// //     }

// //     private toUserList(payload: any): OpenMrsLisUserOption[] {
// //         const rows = Array.isArray(payload?.results) ? payload.results : [];
// //         const seen = new Set<string>();

// //         return rows
// //             .filter((row: any) => row?.uuid && !this.isRetired(row))
// //             .map((row: any) => ({
// //                 uuid: String(row.uuid),
// //                 username: row.username ? String(row.username) : null,
// //                 display: String(row.person?.display ?? row.display ?? row.username ?? row.uuid),
// //                 personUuid: row.person?.uuid ? String(row.person.uuid) : null,
// //             }))
// //             .filter((user: OpenMrsLisUserOption) => {
// //                 if (seen.has(user.uuid)) return false;
// //                 seen.add(user.uuid);
// //                 return true;
// //             })
// //             .sort((a: OpenMrsLisUserOption, b: OpenMrsLisUserOption) => a.display.localeCompare(b.display));
// //     }

// //     private isRetired(row: any): boolean {
// //         const value = row?.retired;
// //         return value === true || value === 1 || String(value ?? '').toLowerCase() === 'true';
// //     }

// //     private extractParameters(payload: any): OpenMrsLisParameterMetadata[] {
// //         const found = new Map<string, OpenMrsLisParameterMetadata>();
// //         const visit = (node: any, parent: any = null) => {
// //             if (!node) return;
// //             if (Array.isArray(node)) {
// //                 for (const item of node) visit(item, parent);
// //                 return;
// //             }
// //             if (typeof node !== 'object') return;

// //             const concept = this.firstObject(
// //                 node.concept,
// //                 node.testParameter,
// //                 node.parameter,
// //                 node.parameterConcept,
// //                 node.testParameterConcept,
// //                 node.test?.concept,
// //             );
// //             const isAllocationCandidate = this.isAllocationCandidate(node, concept);
// //             const allocationUuid = isAllocationCandidate
// //                 ? this.firstText(
// //                     node.testAllocation?.uuid,
// //                     node.allocation?.uuid,
// //                     node.uuid,
// //                     parent?.testAllocation?.uuid,
// //                     parent?.allocation?.uuid,
// //                 )
// //                 : null;
// //             const conceptUuid = this.firstText(concept?.uuid, node.conceptUuid, node.testParameterUuid);

// //             if (isAllocationCandidate && conceptUuid && allocationUuid) {
// //                 const analyzerAliases = this.parameterAliases(concept, node);
// //                 const analyzerCode = this.bestAnalyzerCode(concept, analyzerAliases);
// //                 const key = `${conceptUuid}|${allocationUuid}`;
// //                 if (!found.has(key)) {
// //                     found.set(key, {
// //                         analyzerCode,
// //                         analyzerAliases,
// //                         display: this.safeDisplay(concept?.display, concept?.name, analyzerCode, conceptUuid),
// //                         conceptUuid,
// //                         allocationUuid,
// //                         datatype: concept?.datatype?.display ?? concept?.datatype?.name ?? node.datatype ?? null,
// //                         answers: [],
// //                         raw: node,
// //                     });
// //                 }
// //             }

// //             for (const value of Object.values(node)) visit(value, node);
// //         };
// //         visit(payload);
// //         return Array.from(found.values()).sort((a, b) => a.display.localeCompare(b.display));
// //     }

// //     private async attachConceptDetails(
// //         target: TargetRow,
// //         parameters: OpenMrsLisParameterMetadata[],
// //         headers: Record<string, string>,
// //         allowInsecureTls: boolean,
// //         timeout: number,
// //         warnings: string[],
// //     ) {
// //         const detailed: OpenMrsLisParameterMetadata[] = [];
// //         for (const parameter of parameters.slice(0, 60)) {
// //             if (!parameter.conceptUuid) {
// //                 detailed.push(parameter);
// //                 continue;
// //             }
// //             const concept = await this.fetchConceptDetail(
// //                 target,
// //                 parameter.conceptUuid,
// //                 headers,
// //                 allowInsecureTls,
// //                 timeout,
// //                 warnings,
// //             );
// //             if (!concept) {
// //                 detailed.push(parameter);
// //                 continue;
// //             }
// //             detailed.push({
// //                 ...parameter,
// //                 analyzerCode: this.bestAnalyzerCode(concept, parameter.analyzerAliases) || parameter.analyzerCode,
// //                 analyzerAliases: this.unique([
// //                     ...(parameter.analyzerAliases ?? []),
// //                     ...this.parameterAliases(concept, parameter.raw),
// //                 ]),
// //                 display: this.safeDisplay(concept.display, concept.name, parameter.display, parameter.analyzerCode, parameter.conceptUuid),
// //                 datatype: concept?.datatype?.display ?? concept?.datatype?.name ?? parameter.datatype,
// //                 answers: this.extractAnswers(concept),
// //             });
// //         }
// //         return detailed;
// //     }

// //     private async fetchConceptDetail(
// //         target: TargetRow,
// //         conceptUuid: string,
// //         headers: Record<string, string>,
// //         allowInsecureTls: boolean,
// //         timeout: number,
// //         warnings: string[],
// //     ): Promise<any | null> {
// //         const safeView = 'custom:(uuid,display,datatype,names,answers:(uuid,display,names),attributes:(uuid,display,voided,value,attributeType:(uuid,display)))';
// //         const paths = [
// //             `/concept/${encodeURIComponent(conceptUuid)}?v=${encodeURIComponent(safeView)}`,
// //             `/concept/${encodeURIComponent(conceptUuid)}?v=full`,
// //         ];

// //         let lastStatus: number | string | null = null;
// //         for (const path of paths) {
// //             try {
// //                 const res = (await this.http.getJson(this.restUrl(target, path), headers, allowInsecureTls, timeout)) as any;
// //                 lastStatus = res.status;
// //                 if (res.ok) {
// //                     const json = this.responseJson(res);
// //                     if (json !== null && json !== undefined) return json;
// //                 }
// //             } catch (error: any) {
// //                 lastStatus = error?.message ?? 'request failed';
// //             }
// //         }

// //         this.pushWarning(warnings, `Failed to fetch concept ${conceptUuid}: HTTP ${lastStatus ?? 'unknown'}.`);
// //         return null;
// //     }

// //     private isAllocationCandidate(node: any, concept: any): boolean {
// //         if (!node || typeof node !== 'object' || !concept?.uuid) return false;
// //         const hasAllocationIdentity = !!this.firstText(node.uuid, node.testAllocation?.uuid, node.allocation?.uuid);
// //         const hasAllocationShape = !!(
// //             node.sample ||
// //             node.order ||
// //             node.container ||
// //             node.statuses ||
// //             node.results ||
// //             node.testAllocationAssociatedFields ||
// //             node.isSetMember !== undefined ||
// //             node.label
// //         );
// //         const directParameter = !!(
// //             node.concept ||
// //             node.testParameter ||
// //             node.parameter ||
// //             node.parameterConcept ||
// //             node.testParameterConcept ||
// //             node.test?.concept
// //         );
// //         return hasAllocationIdentity && hasAllocationShape && directParameter;
// //     }

// //     private extractAnswers(concept: any): OpenMrsLisAnswerOption[] {
// //         const answers = Array.isArray(concept?.answers) ? concept.answers : [];
// //         return answers
// //             .filter((answer: any) => answer?.uuid)
// //             .map((answer: any) => {
// //                 const names = Array.isArray(answer.names) ? answer.names : [];
// //                 const shortName = names.find((name: any) => name?.conceptNameType === 'SHORT')?.name ?? null;
// //                 const analyzerCodes = this.answerAliases(answer, names);
// //                 return {
// //                     uuid: answer.uuid,
// //                     display: answer.display ?? shortName ?? answer.uuid,
// //                     shortName,
// //                     analyzerCodes,
// //                     sourceValues: analyzerCodes,
// //                 };
// //             });
// //     }

// //     private bestAnalyzerCode(concept: any, knownAliases: string[] = []): string {
// //         const aliases = this.unique([...knownAliases, ...this.parameterAliases(concept)])
// //             .filter((alias) => !this.isUuidLike(alias));
// //         const mappedAlias = aliases.find((alias) => /[A-Z]/i.test(alias) && /[0-9]/.test(alias));
// //         const alphaAlias = aliases.find((alias) => /[A-Z]/i.test(alias));
// //         const numericCode = aliases.find((alias) => /^\d{2,7}-\d$/.test(alias));
// //         const anyAlias = aliases[0];
// //         return String(mappedAlias ?? alphaAlias ?? numericCode ?? anyAlias ?? '').trim();
// //     }

// //     private parameterAliases(concept: any, node: any = null): string[] {
// //         const aliases = [
// //             ...this.mappingCodeAliases(concept),
// //             ...this.mappingCodeAliases(node?.concept),
// //             ...this.mappingCodeAliases(node?.parameter),
// //             ...this.mappingCodeAliases(node),
// //             ...this.conceptNameAliases(concept),
// //             ...this.conceptNameAliases(node?.concept),
// //             ...this.conceptNameAliases(node?.parameter),
// //             concept?.display,
// //             concept?.name,
// //             node?.display,
// //             node?.name,
// //         ];
// //         return this.unique(aliases.flatMap((value) => this.codeVariants(value)).filter(Boolean))
// //             .filter((alias) => !this.isUuidLike(alias));
// //     }

// //     private answerAliases(answer: any, names: any[]): string[] {
// //         const rawAliases = [
// //             ...this.mappingCodeAliases(answer),
// //             answer?.display,
// //             answer?.name,
// //             ...names
// //                 .map((name: any) => name?.name)
// //                 .filter((name: any) => !!name && name !== 'LIS_CODED_ANSWERS'),
// //         ];
// //         return this.unique(rawAliases.flatMap((value) => this.valueVariants(value)).filter(Boolean));
// //     }

// //     private conceptNameAliases(concept: any): string[] {
// //         const names = Array.isArray(concept?.names) ? concept.names : [];
// //         return names.map((name: any) => name?.name).filter(Boolean);
// //     }

// //     private mappingCodeAliases(node: any): string[] {
// //         const mappings = Array.isArray(node?.mappings) ? node.mappings : [];
// //         return mappings
// //             .flatMap((mapping: any) => [
// //                 mapping?.conceptReference?.code,
// //                 mapping?.conceptReference?.display,
// //                 mapping?.conceptReference?.name,
// //                 mapping?.display,
// //                 mapping?.code,
// //             ])
// //             .filter(Boolean)
// //             .map((value: any) => String(value).trim())
// //             .filter(Boolean);
// //     }

// //     private codeVariants(raw: any): string[] {
// //         const text = String(raw ?? '').trim();
// //         if (!text) return [];
// //         const upper = text.toUpperCase();
// //         const withoutPrefix = upper.includes(':') ? upper.split(':').pop()!.trim() : upper;
// //         const compact = withoutPrefix.replace(/[^A-Z0-9]/g, '');
// //         const dashed = withoutPrefix.replace(/[\s_]+/g, '-');
// //         const variants = [text, upper, withoutPrefix, compact, dashed];
// //         if (compact === 'HRHPV' || compact === 'HRHPVRESULT') variants.push('HRHPV', 'Hr-HPV');
// //         return this.unique(variants.filter(Boolean));
// //     }

// //     private valueVariants(raw: any): string[] {
// //         const text = String(raw ?? '').trim();
// //         if (!text) return [];
// //         const upper = text.toUpperCase();
// //         const noDot = upper.replace(/\.+$/, '').trim();
// //         const compact = noDot.replace(/[^A-Z0-9]/g, '');
// //         const variants = [text, upper, noDot, compact];
// //         if (noDot === 'POSITIVE') variants.push('POS');
// //         if (noDot === 'NEGATIVE') variants.push('NEG');
// //         if (noDot === 'INVALID') variants.push('INV');
// //         if (noDot === 'POS') variants.push('POSITIVE', 'Positive');
// //         if (noDot === 'NEG') variants.push('NEGATIVE', 'Negative');
// //         if (noDot === 'INV') variants.push('INVALID', 'Invalid', 'Invalid.');
// //         return this.unique(variants.filter(Boolean));
// //     }

// //     private unique(values: any[]): string[] {
// //         const seen = new Set<string>();
// //         const rows: string[] = [];
// //         for (const value of values) {
// //             const text = String(value ?? '').trim();
// //             if (!text) continue;
// //             const key = text.toUpperCase();
// //             if (seen.has(key)) continue;
// //             seen.add(key);
// //             rows.push(text);
// //         }
// //         return rows;
// //     }

// //     private responseJson(response: any): any | null {
// //         if (response?.json !== undefined && response?.json !== null) return response.json;
// //         const body = String(response?.body ?? '').trim();
// //         if (!body) return null;
// //         try {
// //             return JSON.parse(body);
// //         } catch {
// //             return null;
// //         }
// //     }

// //     private safeDisplay(...values: any[]): string {
// //         for (const value of values) {
// //             const text = String(value ?? '').trim();
// //             if (!text || this.isUuidLike(text)) continue;
// //             return text;
// //         }
// //         const fallback = values.map((value) => String(value ?? '').trim()).find(Boolean);
// //         return fallback ? `OpenMRS concept ${fallback.slice(0, 8)}` : 'OpenMRS LIS parameter';
// //     }

// //     private isUuidLike(value: any): boolean {
// //         return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
// //             String(value ?? '').trim(),
// //         );
// //     }

// //     private pushWarning(warnings: string[], message: string) {
// //         if (!warnings.includes(message)) warnings.push(message);
// //     }

// //     private firstObject(...values: any[]) {
// //         return values.find((value) => value && typeof value === 'object') ?? null;
// //     }

// //     private firstText(...values: any[]) {
// //         for (const value of values) {
// //             const text = String(value ?? '').trim();
// //             if (text) return text;
// //         }
// //         return null;
// //     }
// // }

// import { getDb } from '../db/db';
// import { SecureHttpClient } from '../security/secure-http.client';
// import { TargetSecretsService } from './target-secrets.service';
// import { buildAuthHeaders } from '../security/delivery-auth.util';

// type TargetRow = {
//     id: string;
//     type: string;
//     name: string;
//     base_url: string;
//     request_timeout_ms?: number | null;
// };

// export type OpenMrsLisMetadataRequest = {
//     targetId: string;
//     sampleId?: string | null;
//     sampleUuid?: string | null;
//     includeConceptDetails?: boolean;
//     userQuery?: string | null;
// };

// export type OpenMrsLisAnswerOption = {
//     uuid: string;
//     display: string;
//     shortName?: string | null;
//     analyzerCodes: string[];
//     aliases?: string[];
// };

// export type OpenMrsLisUserOption = {
//     uuid: string;
//     username: string | null;
//     display: string;
//     personUuid?: string | null;
// };

// export type OpenMrsLisParameterMetadata = {
//     analyzerCode: string;
//     display: string;
//     conceptUuid: string | null;
//     allocationUuid: string | null;
//     datatype: string | null;
//     answers: OpenMrsLisAnswerOption[];
//     aliases: string[];
//     isCalculated?: boolean;
//     raw?: any;
// };

// export type OpenMrsLisMetadataResponse = {
//     target: { id: string; name: string; type: string; baseUrl: string };
//     lookup: any | null;
//     sample: { uuid: string | null; label: string | null; found: boolean };
//     settings: Record<string, string | null>;
//     allocations: any | null;
//     parameters: OpenMrsLisParameterMetadata[];
//     instruments: Array<{ uuid: string; display: string; mappings?: any[] }>;
//     testOrders: Array<{ uuid: string; display: string; mappings?: any[] }>;
//     users: OpenMrsLisUserOption[];
//     warnings: string[];
// };

// const REST_PREFIX = '/openmrs/ws/rest/v1';

// const SETTINGS = [
//     'iCare.laboratory.resultApprovalConfiguration',
//     'iCare.lis.testParameterRelationship.conceptSourceUuid',
//     'iCare.laboratory.settings.testParameters.attributes.multipleResultsAttributeTypeUuid',
//     'iCare.laboratory.settings.testParameters.calculateValueExpressionAttributeTypeUuid',
// ];

// export class OpenMrsLisMetadataService {
//     private readonly http = new SecureHttpClient();
//     private readonly secrets = new TargetSecretsService();

//     async discover(input: OpenMrsLisMetadataRequest): Promise<OpenMrsLisMetadataResponse> {
//         const target = this.getTarget(input.targetId);
//         if (!target) throw new Error('Target not found.');
//         if (!['LIS', 'OPENMRS'].includes(target.type)) {
//             throw new Error('OpenMRS LIS discovery can only run against LIS or OPENMRS targets.');
//         }

//         const targetBaseUrl = this.normalizedBaseUrl(target);
//         const secret = this.secrets.get(target.id);
//         const headers = buildAuthHeaders(secret as any);
//         const allowInsecureTls = !!secret?.allowInsecureTls;
//         const timeout = Number(target.request_timeout_ms ?? 15_000);
//         const warnings: string[] = [];

//         const lookup = await this.fetchOptional<any>(
//             target,
//             `/lab/samplelookup?sampleId=${encodeURIComponent(String(input.sampleId ?? '').trim())}`,
//             headers,
//             allowInsecureTls,
//             timeout,
//             !!String(input.sampleId ?? '').trim(),
//             warnings,
//             'sample lookup',
//         );

//         const sampleUuid =
//             String(input.sampleUuid ?? '').trim() || lookup?.sample?.uuid || lookup?.uuid || null;
//         const sampleLabel =
//             lookup?.sample?.label || lookup?.label || String(input.sampleId ?? '').trim() || null;

//         const allocations = await this.fetchOptional<any>(
//             target,
//             sampleUuid ? `/lab/allocationsbysample?uuid=${encodeURIComponent(sampleUuid)}` : '',
//             headers,
//             allowInsecureTls,
//             timeout,
//             !!sampleUuid,
//             warnings,
//             'sample allocations',
//         );

//         const settings: Record<string, string | null> = {};
//         for (const property of SETTINGS) {
//             const payload = await this.fetchOptional<any>(
//                 target,
//                 `/systemsetting?q=${encodeURIComponent(property)}&v=full`,
//                 headers,
//                 allowInsecureTls,
//                 timeout,
//                 true,
//                 warnings,
//                 property,
//             );
//             settings[property] = payload?.results?.[0]?.value ?? null;
//         }

//         const instrumentsPayload = await this.fetchOptional<any>(
//             target,
//             '/concept?q=LIS_INSTRUMENT&limit=50&tag=LIS_INSTRUMENT&class=LIS%20instrument&v=custom:(uuid,display,datatype,conceptClass,mappings)',
//             headers,
//             allowInsecureTls,
//             timeout,
//             true,
//             warnings,
//             'LIS instruments',
//         );

//         const testOrdersPayload = await this.fetchOptional<any>(
//             target,
//             '/concept?q=TEST_ORDERS&limit=50&tag=TEST_ORDERS&class=Test&v=custom:(uuid,display,datatype,conceptClass,mappings)',
//             headers,
//             allowInsecureTls,
//             timeout,
//             true,
//             warnings,
//             'test orders',
//         );

//         const usersPayload = await this.fetchOpenMrsUsers(
//             target,
//             String(input.userQuery ?? '').trim(),
//             headers,
//             allowInsecureTls,
//             timeout,
//             warnings,
//         );

//         let parameters = this.extractParameters(allocations);
//         if (input.includeConceptDetails !== false && parameters.length > 0) {
//             parameters = await this.attachConceptDetails(
//                 target,
//                 parameters,
//                 headers,
//                 allowInsecureTls,
//                 timeout,
//                 warnings,
//             );
//         }

//         return {
//             target: { id: target.id, name: target.name, type: target.type, baseUrl: targetBaseUrl },
//             lookup: lookup ?? null,
//             sample: { uuid: sampleUuid, label: sampleLabel, found: !!sampleUuid },
//             settings,
//             allocations: allocations ?? null,
//             parameters,
//             instruments: this.toConceptList(instrumentsPayload),
//             testOrders: this.toConceptList(testOrdersPayload),
//             users: this.toUserList(usersPayload),
//             warnings,
//         };
//     }

//     private getTarget(targetId: string): TargetRow | null {
//         const db = getDb();
//         return (db
//             .prepare(
//                 `
//                     SELECT id, type, name, base_url, request_timeout_ms
//                     FROM targets
//                     WHERE id = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(targetId) ?? null) as TargetRow | null;
//     }

//     private async fetchOptional<T>(
//         target: TargetRow,
//         path: string,
//         headers: Record<string, string>,
//         allowInsecureTls: boolean,
//         timeout: number,
//         shouldFetch: boolean,
//         warnings: string[],
//         label: string,
//     ): Promise<T | null> {
//         if (!shouldFetch || !path) return null;

//         const url = this.restUrl(target, path);

//         try {
//             const res = await this.http.getJson(url, headers, allowInsecureTls, timeout);

//             if (!res.ok) {
//                 warnings.push(`Failed to fetch ${label}: HTTP ${res.status}.`);
//                 return null;
//             }

//             const body = String(res.body ?? '').trim();

//             if (!body) {
//                 warnings.push(`Fetched ${label}, but the response body was empty.`);
//                 return null;
//             }

//             try {
//                 return JSON.parse(body) as T;
//             } catch {
//                 warnings.push(`Fetched ${label}, but the response was not valid JSON.`);
//                 return null;
//             }
//         } catch (error: any) {
//             warnings.push(`Failed to fetch ${label}: ${error?.message ?? error}.`);
//             return null;
//         }
//     }

//     private normalizedBaseUrl(target: TargetRow): string {
//         const base = String(target?.base_url ?? '')
//             .trim()
//             .replace(/\/+$/, '');
//         if (!base) {
//             throw new Error(
//                 `Base URL is not configured for target "${target?.name ?? target?.id ?? 'unknown'}".`,
//             );
//         }
//         return base;
//     }

//     private restUrl(target: TargetRow, path: string) {
//         const base = this.normalizedBaseUrl(target);
//         let suffix = String(path ?? '').trim();
//         if (/^https?:\/\//i.test(suffix)) return suffix;
//         if (!suffix.startsWith('/')) suffix = `/${suffix}`;

//         if (base.endsWith(REST_PREFIX)) return `${base}${suffix}`;
//         if (base.endsWith('/openmrs')) return `${base}/ws/rest/v1${suffix}`;
//         return `${base}${REST_PREFIX}${suffix}`;
//     }

//     private toConceptList(payload: any): Array<{ uuid: string; display: string; mappings?: any[] }> {
//         const rows = Array.isArray(payload?.results) ? payload.results : [];
//         return rows
//             .filter((row: any) => row?.uuid)
//             .map((row: any) => ({
//                 uuid: row.uuid,
//                 display: row.display ?? row.name ?? row.uuid,
//                 mappings: Array.isArray(row.mappings) ? row.mappings : [],
//             }));
//     }

//     private async fetchOpenMrsUsers(
//         target: TargetRow,
//         query: string,
//         headers: Record<string, string>,
//         allowInsecureTls: boolean,
//         timeout: number,
//         warnings: string[],
//     ): Promise<{ results: any[]; links: any[] }> {
//         const limit = 25;
//         const maxUsers = 5000;
//         const userView = 'custom:(uuid,display,username,person:(uuid,display),retired)';
//         const results: any[] = [];
//         const seen = new Set<string>();
//         const links: any[] = [];

//         let startIndex = 0;
//         let pageCount = 0;

//         while (results.length < maxUsers && pageCount < 250) {
//             const path =
//                 `/user?startIndex=${startIndex}` +
//                 `&limit=${limit}` +
//                 `&v=${encodeURIComponent(userView)}` +
//                 `&q=${encodeURIComponent(query)}`;

//             const page = await this.fetchOptional<any>(
//                 target,
//                 path,
//                 headers,
//                 allowInsecureTls,
//                 timeout,
//                 true,
//                 warnings,
//                 `OpenMRS users page starting at ${startIndex}`,
//             );

//             if (!page) break;

//             const rows = Array.isArray(page?.results) ? page.results : [];
//             const pageLinks = Array.isArray(page?.links) ? page.links : [];
//             links.push(...pageLinks);

//             for (const row of rows) {
//                 const uuid = String(row?.uuid ?? '').trim();
//                 if (!uuid || seen.has(uuid)) continue;
//                 seen.add(uuid);
//                 results.push(row);
//             }

//             pageCount += 1;
//             if (rows.length < limit) break;

//             const nextStartIndex = this.nextStartIndex(page);
//             startIndex =
//                 nextStartIndex != null && nextStartIndex > startIndex ? nextStartIndex : startIndex + limit;
//         }

//         if (results.length >= maxUsers) {
//             warnings.push(
//                 `OpenMRS user fetch stopped after ${maxUsers} users to protect the app from an unexpectedly large response.`,
//             );
//         }

//         if (pageCount >= 250) {
//             warnings.push(
//                 'OpenMRS user fetch stopped after 250 pages. Check the user API paging response.',
//             );
//         }

//         return { results, links };
//     }

//     private nextStartIndex(payload: any): number | null {
//         const links = Array.isArray(payload?.links) ? payload.links : [];
//         const next = links.find((link: any) => String(link?.rel ?? '').toLowerCase() === 'next');
//         const uri = String(next?.uri ?? '').trim();
//         if (!uri) return null;

//         const match = uri.match(/[?&]startIndex=(\d+)/);
//         if (match) {
//             const value = Number(match[1]);
//             return Number.isFinite(value) && value >= 0 ? value : null;
//         }

//         try {
//             const url = new URL(uri);
//             const value = Number(url.searchParams.get('startIndex'));
//             return Number.isFinite(value) && value >= 0 ? value : null;
//         } catch {
//             return null;
//         }
//     }

//     private toUserList(payload: any): OpenMrsLisUserOption[] {
//         const rows = Array.isArray(payload?.results) ? payload.results : [];
//         const seen = new Set<string>();

//         return rows
//             .filter((row: any) => row?.uuid && !this.isRetired(row))
//             .map((row: any) => ({
//                 uuid: String(row.uuid),
//                 username: row.username ? String(row.username) : null,
//                 display: String(row.person?.display ?? row.display ?? row.username ?? row.uuid),
//                 personUuid: row.person?.uuid ? String(row.person.uuid) : null,
//             }))
//             .filter((user: OpenMrsLisUserOption) => {
//                 if (seen.has(user.uuid)) return false;
//                 seen.add(user.uuid);
//                 return true;
//             })
//             .sort((a: OpenMrsLisUserOption, b: OpenMrsLisUserOption) =>
//                 a.display.localeCompare(b.display),
//             );
//     }

//     private isRetired(row: any): boolean {
//         const value = row?.retired;
//         return value === true || value === 1 || String(value ?? '').toLowerCase() === 'true';
//     }

//     private extractParameters(payload: any): OpenMrsLisParameterMetadata[] {
//         const found = new Map<string, OpenMrsLisParameterMetadata>();
//         const visit = (node: any, parent: any = null) => {
//             if (!node) return;
//             if (Array.isArray(node)) {
//                 for (const item of node) visit(item, parent);
//                 return;
//             }
//             if (typeof node !== 'object') return;

//             const concept = this.firstObject(
//                 node.concept,
//                 node.testParameter,
//                 node.parameter,
//                 node.parameterConcept,
//                 node.testParameterConcept,
//                 node.test?.concept,
//                 node.order?.concept,
//             );
//             const allocationUuid = this.firstText(
//                 node.testAllocation?.uuid,
//                 node.allocation?.uuid,
//                 node.uuid,
//                 parent?.testAllocation?.uuid,
//                 parent?.allocation?.uuid,
//             );
//             const conceptUuid = this.firstText(concept?.uuid, node.conceptUuid, node.testParameterUuid);

//             if (conceptUuid && allocationUuid) {
//                 const analyzerCode = this.bestAnalyzerCode(concept);
//                 const key = `${conceptUuid}|${allocationUuid}`;
//                 if (!found.has(key)) {
//                     found.set(key, {
//                         analyzerCode,
//                         display: concept?.display ?? concept?.name ?? analyzerCode,
//                         conceptUuid,
//                         allocationUuid,
//                         datatype:
//                             concept?.datatype?.display ?? concept?.datatype?.name ?? node.datatype ?? null,
//                         answers: [],
//                         aliases: this.extractConceptAliases(concept),
//                         isCalculated: this.isCalculatedConcept(concept),
//                         raw: node,
//                     });
//                 }
//             }

//             for (const value of Object.values(node)) visit(value, node);
//         };
//         visit(payload);
//         return Array.from(found.values()).sort((a, b) => a.display.localeCompare(b.display));
//     }

//     private async attachConceptDetails(
//         target: TargetRow,
//         parameters: OpenMrsLisParameterMetadata[],
//         headers: Record<string, string>,
//         allowInsecureTls: boolean,
//         timeout: number,
//         warnings: string[],
//     ) {
//         const detailed: OpenMrsLisParameterMetadata[] = [];
//         for (const parameter of parameters.slice(0, 60)) {
//             if (!parameter.conceptUuid) {
//                 detailed.push(parameter);
//                 continue;
//             }
//             const concept = await this.fetchOptional<any>(
//                 target,
//                 `/concept/${encodeURIComponent(parameter.conceptUuid)}?v=custom:(uuid,display,datatype,names,answers:(uuid,display,names),attributes:(uuid,display,voided,value,attributeType:(uuid,display)))`,
//                 headers,
//                 allowInsecureTls,
//                 timeout,
//                 true,
//                 warnings,
//                 `concept ${parameter.conceptUuid}`,
//             );
//             if (!concept) {
//                 detailed.push(parameter);
//                 continue;
//             }
//             detailed.push({
//                 ...parameter,
//                 analyzerCode: this.bestAnalyzerCode(concept) || parameter.analyzerCode,
//                 display: concept.display ?? parameter.display,
//                 datatype: concept?.datatype?.display ?? concept?.datatype?.name ?? parameter.datatype,
//                 answers: this.extractAnswers(concept),
//                 aliases: this.mergeAliases(parameter.aliases, this.extractConceptAliases(concept)),
//                 isCalculated: parameter.isCalculated || this.isCalculatedConcept(concept),
//             });
//         }
//         return detailed;
//     }

//     private extractAnswers(concept: any): OpenMrsLisAnswerOption[] {
//         const answers = Array.isArray(concept?.answers) ? concept.answers : [];
//         return answers
//             .filter((answer: any) => answer?.uuid)
//             .map((answer: any) => {
//                 const aliases = this.extractConceptAliases(answer).filter(
//                     (alias) => alias !== 'LIS_CODED_ANSWERS',
//                 );
//                 const names = Array.isArray(answer.names) ? answer.names : [];
//                 const shortName =
//                     names.find((name: any) => name?.conceptNameType === 'SHORT')?.name ?? null;
//                 const analyzerCodes = aliases.filter((alias) => this.isUsefulAnalyzerAlias(alias));
//                 return {
//                     uuid: answer.uuid,
//                     display: answer.display ?? shortName ?? answer.uuid,
//                     shortName,
//                     analyzerCodes: this.mergeAliases(analyzerCodes, shortName ? [shortName] : []),
//                     aliases,
//                 };
//             });
//     }

//     private bestAnalyzerCode(concept: any): string {
//         const aliases = this.extractConceptAliases(concept);
//         const display = String(concept?.display ?? concept?.name ?? '').trim();
//         const displayToken = this.normalizeToken(display);
//         const preferredMappedAlias = aliases.find((alias) => {
//             const token = this.normalizeToken(alias);
//             return this.isUsefulAnalyzerAlias(alias) && token === displayToken;
//         });
//         if (preferredMappedAlias) return preferredMappedAlias;

//         const nonLoincAlias = aliases.find(
//             (alias) => this.isUsefulAnalyzerAlias(alias) && !/^\d{1,7}-\d$/.test(alias),
//         );
//         if (nonLoincAlias) return nonLoincAlias;

//         const usefulAlias = aliases.find((alias) => this.isUsefulAnalyzerAlias(alias));
//         if (usefulAlias) return usefulAlias;

//         return String(display || concept?.uuid || '').trim();
//     }

//     private extractConceptAliases(concept: any): string[] {
//         const aliases: string[] = [];
//         const add = (...values: any[]) => {
//             for (const value of values) {
//                 const text = String(value ?? '').trim();
//                 if (!text || this.isUuid(text)) continue;
//                 aliases.push(text);
//             }
//         };

//         add(concept?.display, concept?.name);
//         const names = Array.isArray(concept?.names) ? concept.names : [];
//         for (const name of names) add(name?.name, name?.display);

//         const mappings = Array.isArray(concept?.mappings) ? concept.mappings : [];
//         for (const mapping of mappings) {
//             const reference =
//                 mapping?.conceptReference ??
//                 mapping?.conceptReferenceTerm ??
//                 mapping?.referenceTerm ??
//                 mapping;
//             add(reference?.code, reference?.display, reference?.name);
//         }

//         return this.mergeAliases(aliases);
//     }

//     private isCalculatedConcept(concept: any): boolean {
//         const attributes = Array.isArray(concept?.attributes) ? concept.attributes : [];
//         return attributes.some((attribute: any) => {
//             if (attribute?.voided) return false;
//             const label =
//                 `${attribute?.display ?? ''} ${attribute?.attributeType?.display ?? ''} ${attribute?.value ?? ''}`.toLowerCase();
//             return (
//                 label.includes('calculate') ||
//                 label.includes('formula') ||
//                 label.includes('expression') ||
//                 label.includes('log10')
//             );
//         });
//     }

//     private mergeAliases(
//         ...groups: Array<Array<string | null | undefined> | string | null | undefined>
//     ): string[] {
//         const seen = new Set<string>();
//         const output: string[] = [];
//         for (const group of groups) {
//             const values = Array.isArray(group) ? group : [group];
//             for (const value of values) {
//                 const text = String(value ?? '').trim();
//                 if (!text || this.isUuid(text)) continue;
//                 const key = this.normalizeToken(text);
//                 if (!key || seen.has(key)) continue;
//                 seen.add(key);
//                 output.push(text);
//             }
//         }
//         return output;
//     }

//     private isUsefulAnalyzerAlias(value: string): boolean {
//         const text = String(value ?? '').trim();
//         if (!text || this.isUuid(text)) return false;
//         const token = this.normalizeToken(text);
//         return !!token && /[A-Z]/.test(token);
//     }

//     private normalizeToken(value: any): string {
//         return String(value ?? '')
//             .trim()
//             .toUpperCase()
//             .replace(/[^A-Z0-9]+/g, '_')
//             .replace(/^_+|_+$/g, '');
//     }

//     private isUuid(value: string): boolean {
//         return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
//             String(value ?? '').trim(),
//         );
//     }

//     private firstObject(...values: any[]) {
//         return values.find((value) => value && typeof value === 'object') ?? null;
//     }

//     private firstText(...values: any[]) {
//         for (const value of values) {
//             const text = String(value ?? '').trim();
//             if (text) return text;
//         }
//         return null;
//     }
// }


// import { getDb } from '../db/db';
// import { buildAuthHeaders } from '../security/delivery-auth.util';
// import { SecureHttpClient } from '../security/secure-http.client';
// import { TargetSecretsService } from './target-secrets.service';

// type TargetRow = {
//     id: string;
//     type: string;
//     name: string;
//     base_url: string;
//     request_timeout_ms?: number | null;
// };

// export type OpenMrsLisMetadataRequest = {
//     targetId: string;
//     sampleId?: string | null;
//     sampleUuid?: string | null;
//     includeConceptDetails?: boolean;
// };

// export type OpenMrsLisAnswerOption = {
//     uuid: string;
//     display: string;
//     shortName?: string | null;
//     analyzerCodes: string[];
// };

// export type OpenMrsLisParameterMetadata = {
//     analyzerCode: string;
//     display: string;
//     conceptUuid: string | null;
//     allocationUuid: string | null;
//     datatype: string | null;
//     answers: OpenMrsLisAnswerOption[];
//     raw?: any;
// };

// export type OpenMrsLisMetadataResponse = {
//     target: { id: string; name: string; type: string; baseUrl: string };
//     lookup: any | null;
//     sample: { uuid: string | null; label: string | null; found: boolean };
//     settings: Record<string, string | null>;
//     allocations: any | null;
//     parameters: OpenMrsLisParameterMetadata[];
//     instruments: Array<{ uuid: string; display: string; mappings?: any[] }>;
//     testOrders: Array<{ uuid: string; display: string; mappings?: any[] }>;
//     warnings: string[];
// };

// const REST_PREFIX = '/openmrs/ws/rest/v1';

// const SETTINGS = [
//     'iCare.laboratory.resultApprovalConfiguration',
//     'iCare.lis.testParameterRelationship.conceptSourceUuid',
//     'iCare.laboratory.settings.testParameters.attributes.multipleResultsAttributeTypeUuid',
//     'iCare.laboratory.settings.testParameters.calculateValueExpressionAttributeTypeUuid',
// ];

// export class OpenMrsLisMetadataService {
//     private readonly http = new SecureHttpClient();
//     private readonly secrets = new TargetSecretsService();

//     async discover(input: OpenMrsLisMetadataRequest): Promise<OpenMrsLisMetadataResponse> {
//         const target = this.getTarget(input.targetId);
//         if (!target) throw new Error('Target not found.');
//         if (!['LIS', 'OPENMRS'].includes(target.type)) {
//             throw new Error('OpenMRS LIS discovery can only run against LIS or OPENMRS targets.');
//         }

//         const secret = this.secrets.get(target.id);
//         const headers = buildAuthHeaders(secret as any);
//         const allowInsecureTls = !!secret?.allowInsecureTls;
//         const timeout = Number(target.request_timeout_ms ?? 15_000);
//         const warnings: string[] = [];

//         const lookup = await this.fetchOptional<any>(
//             target,
//             `/lab/samplelookup?sampleId=${encodeURIComponent(String(input.sampleId ?? '').trim())}`,
//             headers,
//             allowInsecureTls,
//             timeout,
//             !!String(input.sampleId ?? '').trim(),
//             warnings,
//             'sample lookup',
//         );

//         const sampleUuid =
//             String(input.sampleUuid ?? '').trim() ||
//             lookup?.sample?.uuid ||
//             lookup?.uuid ||
//             null;
//         const sampleLabel = lookup?.sample?.label || lookup?.label || String(input.sampleId ?? '').trim() || null;

//         const allocations = await this.fetchOptional<any>(
//             target,
//             sampleUuid ? `/lab/allocationsbysample?uuid=${encodeURIComponent(sampleUuid)}` : '',
//             headers,
//             allowInsecureTls,
//             timeout,
//             !!sampleUuid,
//             warnings,
//             'sample allocations',
//         );

//         const settings: Record<string, string | null> = {};
//         for (const property of SETTINGS) {
//             const payload = await this.fetchOptional<any>(
//                 target,
//                 `/systemsetting?q=${encodeURIComponent(property)}&v=full`,
//                 headers,
//                 allowInsecureTls,
//                 timeout,
//                 true,
//                 warnings,
//                 property,
//             );
//             settings[property] = payload?.results?.[0]?.value ?? null;
//         }

//         const instrumentsPayload = await this.fetchOptional<any>(
//             target,
//             '/concept?q=LIS_INSTRUMENT&limit=50&tag=LIS_INSTRUMENT&class=LIS%20instrument&v=custom:(uuid,display,datatype,conceptClass,mappings)',
//             headers,
//             allowInsecureTls,
//             timeout,
//             true,
//             warnings,
//             'LIS instruments',
//         );

//         const testOrdersPayload = await this.fetchOptional<any>(
//             target,
//             '/concept?q=TEST_ORDERS&limit=50&tag=TEST_ORDERS&class=Test&v=custom:(uuid,display,datatype,conceptClass,mappings)',
//             headers,
//             allowInsecureTls,
//             timeout,
//             true,
//             warnings,
//             'test orders',
//         );

//         let parameters = this.extractParameters(allocations);
//         if (input.includeConceptDetails !== false && parameters.length > 0) {
//             parameters = await this.attachConceptDetails(target, parameters, headers, allowInsecureTls, timeout, warnings);
//         }

//         return {
//             target: { id: target.id, name: target.name, type: target.type, baseUrl: target.base_url },
//             lookup: lookup ?? null,
//             sample: { uuid: sampleUuid, label: sampleLabel, found: !!sampleUuid },
//             settings,
//             allocations: allocations ?? null,
//             parameters,
//             instruments: this.toConceptList(instrumentsPayload),
//             testOrders: this.toConceptList(testOrdersPayload),
//             warnings,
//         };
//     }

//     private getTarget(targetId: string): TargetRow | null {
//         const db = getDb();
//         return (db
//             .prepare(
//                 `
//                     SELECT id, type, name, base_url, request_timeout_ms
//                     FROM targets
//                     WHERE id = ?
//                     LIMIT 1
//                 `,
//             )
//             .get(targetId) ?? null) as TargetRow | null;
//     }

//     private async fetchOptional<T>(
//         target: TargetRow,
//         path: string,
//         headers: Record<string, string>,
//         allowInsecureTls: boolean,
//         timeout: number,
//         shouldFetch: boolean,
//         warnings: string[],
//         label: string,
//     ): Promise<T | null> {
//         if (!shouldFetch || !path) return null;
//         const url = this.restUrl(target.base_url, path);
//         const res = await this.http.getJson<T>(url, headers, allowInsecureTls, timeout);
//         if (!res.ok) {
//             warnings.push(`Failed to fetch ${label}: HTTP ${res.status}.`);
//             return null;
//         }
//         if (!res.json) {
//             warnings.push(`Fetched ${label}, but the response was not valid JSON.`);
//             return null;
//         }
//         return res.json;
//     }

//     private restUrl(baseUrl: string, path: string) {
//         const base = String(baseUrl ?? '').replace(/\/+$/, '');
//         let suffix = String(path ?? '').trim();
//         if (!suffix.startsWith('/')) suffix = `/${suffix}`;

//         if (base.endsWith(REST_PREFIX)) return `${base}${suffix}`;
//         if (base.endsWith('/openmrs')) return `${base}/ws/rest/v1${suffix}`;
//         return `${base}${REST_PREFIX}${suffix}`;
//     }

//     private toConceptList(payload: any): Array<{ uuid: string; display: string; mappings?: any[] }> {
//         const rows = Array.isArray(payload?.results) ? payload.results : [];
//         return rows
//             .filter((row: any) => row?.uuid)
//             .map((row: any) => ({
//                 uuid: row.uuid,
//                 display: row.display ?? row.name ?? row.uuid,
//                 mappings: Array.isArray(row.mappings) ? row.mappings : [],
//             }));
//     }

//     private extractParameters(payload: any): OpenMrsLisParameterMetadata[] {
//         const found = new Map<string, OpenMrsLisParameterMetadata>();
//         const visit = (node: any, parent: any = null) => {
//             if (!node) return;
//             if (Array.isArray(node)) {
//                 for (const item of node) visit(item, parent);
//                 return;
//             }
//             if (typeof node !== 'object') return;

//             const concept = this.firstObject(
//                 node.concept,
//                 node.testParameter,
//                 node.parameter,
//                 node.parameterConcept,
//                 node.testParameterConcept,
//                 node.test?.concept,
//                 node.order?.concept,
//             );
//             const allocationUuid = this.firstText(
//                 node.testAllocation?.uuid,
//                 node.allocation?.uuid,
//                 node.uuid,
//                 parent?.testAllocation?.uuid,
//                 parent?.allocation?.uuid,
//             );
//             const conceptUuid = this.firstText(concept?.uuid, node.conceptUuid, node.testParameterUuid);

//             if (conceptUuid && allocationUuid) {
//                 const analyzerCode = this.bestAnalyzerCode(concept);
//                 const key = `${conceptUuid}|${allocationUuid}`;
//                 if (!found.has(key)) {
//                     found.set(key, {
//                         analyzerCode,
//                         display: concept?.display ?? concept?.name ?? analyzerCode,
//                         conceptUuid,
//                         allocationUuid,
//                         datatype: concept?.datatype?.display ?? concept?.datatype?.name ?? node.datatype ?? null,
//                         answers: [],
//                         raw: node,
//                     });
//                 }
//             }

//             for (const value of Object.values(node)) visit(value, node);
//         };
//         visit(payload);
//         return Array.from(found.values()).sort((a, b) => a.display.localeCompare(b.display));
//     }

//     private async attachConceptDetails(
//         target: TargetRow,
//         parameters: OpenMrsLisParameterMetadata[],
//         headers: Record<string, string>,
//         allowInsecureTls: boolean,
//         timeout: number,
//         warnings: string[],
//     ) {
//         const detailed: OpenMrsLisParameterMetadata[] = [];
//         for (const parameter of parameters.slice(0, 60)) {
//             if (!parameter.conceptUuid) {
//                 detailed.push(parameter);
//                 continue;
//             }
//             const concept = await this.fetchOptional<any>(
//                 target,
//                 `/concept/${encodeURIComponent(parameter.conceptUuid)}?v=custom:(uuid,display,datatype,names,answers:(uuid,display,names),attributes:(uuid,display,voided,value,attributeType:(uuid,display)))`,
//                 headers,
//                 allowInsecureTls,
//                 timeout,
//                 true,
//                 warnings,
//                 `concept ${parameter.conceptUuid}`,
//             );
//             if (!concept) {
//                 detailed.push(parameter);
//                 continue;
//             }
//             detailed.push({
//                 ...parameter,
//                 analyzerCode: this.bestAnalyzerCode(concept) || parameter.analyzerCode,
//                 display: concept.display ?? parameter.display,
//                 datatype: concept?.datatype?.display ?? concept?.datatype?.name ?? parameter.datatype,
//                 answers: this.extractAnswers(concept),
//             });
//         }
//         return detailed;
//     }

//     private extractAnswers(concept: any): OpenMrsLisAnswerOption[] {
//         const answers = Array.isArray(concept?.answers) ? concept.answers : [];
//         return answers
//             .filter((answer: any) => answer?.uuid)
//             .map((answer: any) => {
//                 const names = Array.isArray(answer.names) ? answer.names : [];
//                 const shortName = names.find((name: any) => name?.conceptNameType === 'SHORT')?.name ?? null;
//                 const analyzerCodes = names
//                     .map((name: any) => name?.name)
//                     .filter((name: any) => !!name && name !== 'LIS_CODED_ANSWERS')
//                     .map((name: string) => String(name).trim())
//                     .filter(Boolean);
//                 return {
//                     uuid: answer.uuid,
//                     display: answer.display ?? shortName ?? answer.uuid,
//                     shortName,
//                     analyzerCodes: Array.from(new Set(analyzerCodes)),
//                 };
//             });
//     }

//     private bestAnalyzerCode(concept: any): string {
//         const names = Array.isArray(concept?.names) ? concept.names : [];
//         const shortName = names.find((name: any) => name?.conceptNameType === 'SHORT')?.name;
//         const fullName = names.find((name: any) => name?.localePreferred)?.name;
//         return String(shortName ?? fullName ?? concept?.display ?? concept?.name ?? concept?.uuid ?? '').trim();
//     }

//     private firstObject(...values: any[]) {
//         return values.find((value) => value && typeof value === 'object') ?? null;
//     }

//     private firstText(...values: any[]) {
//         for (const value of values) {
//             const text = String(value ?? '').trim();
//             if (text) return text;
//         }
//         return null;
//     }
// }


import { getDb } from '../db/db';
import { SecureHttpClient } from '../security/secure-http.client';
import { TargetSecretsService } from './target-secrets.service';
import { buildAuthHeaders } from '../security/delivery-auth.util';

type TargetRow = {
    id: string;
    type: string;
    name: string;
    base_url: string;
    request_timeout_ms?: number | null;
};

export type OpenMrsLisMetadataRequest = {
    targetId: string;
    sampleId?: string | null;
    sampleUuid?: string | null;
    includeConceptDetails?: boolean;
    userQuery?: string | null;
};

export type OpenMrsLisAnswerOption = {
    uuid: string;
    display: string;
    shortName?: string | null;
    analyzerCodes: string[];
};

export type OpenMrsLisUserOption = {
    uuid: string;
    username: string | null;
    display: string;
    personUuid?: string | null;
};

export type OpenMrsLisParameterMetadata = {
    analyzerCode: string;
    display: string;
    conceptUuid: string | null;
    allocationUuid: string | null;
    datatype: string | null;
    answers: OpenMrsLisAnswerOption[];
    raw?: any;
};

export type OpenMrsLisMetadataResponse = {
    target: { id: string; name: string; type: string; baseUrl: string };
    lookup: any | null;
    sample: { uuid: string | null; label: string | null; found: boolean };
    settings: Record<string, string | null>;
    allocations: any | null;
    parameters: OpenMrsLisParameterMetadata[];
    instruments: Array<{ uuid: string; display: string; mappings?: any[] }>;
    testOrders: Array<{ uuid: string; display: string; mappings?: any[] }>;
    users: OpenMrsLisUserOption[];
    warnings: string[];
};

const REST_PREFIX = '/openmrs/ws/rest/v1';

const SETTINGS = [
    'iCare.laboratory.resultApprovalConfiguration',
    'iCare.lis.testParameterRelationship.conceptSourceUuid',
    'iCare.laboratory.settings.testParameters.attributes.multipleResultsAttributeTypeUuid',
    'iCare.laboratory.settings.testParameters.calculateValueExpressionAttributeTypeUuid',
];

export class OpenMrsLisMetadataService {
    private readonly http = new SecureHttpClient();
    private readonly secrets = new TargetSecretsService();

    async discover(input: OpenMrsLisMetadataRequest): Promise<OpenMrsLisMetadataResponse> {
        const target = this.getTarget(input.targetId);
        if (!target) throw new Error('Target not found.');
        if (!['LIS', 'OPENMRS'].includes(target.type)) {
            throw new Error('OpenMRS LIS discovery can only run against LIS or OPENMRS targets.');
        }

        const targetBaseUrl = this.normalizedBaseUrl(target);
        const secret = this.secrets.get(target.id);
        const headers = buildAuthHeaders(secret as any);
        const allowInsecureTls = !!secret?.allowInsecureTls;
        const timeout = Number(target.request_timeout_ms ?? 15_000);
        const warnings: string[] = [];

        const lookup = await this.fetchOptional<any>(
            target,
            `/lab/samplelookup?sampleId=${encodeURIComponent(String(input.sampleId ?? '').trim())}`,
            headers,
            allowInsecureTls,
            timeout,
            !!String(input.sampleId ?? '').trim(),
            warnings,
            'sample lookup',
        );

        const sampleUuid =
            String(input.sampleUuid ?? '').trim() ||
            lookup?.sample?.uuid ||
            lookup?.uuid ||
            null;
        const sampleLabel = lookup?.sample?.label || lookup?.label || String(input.sampleId ?? '').trim() || null;

        const allocations = await this.fetchOptional<any>(
            target,
            sampleUuid ? `/lab/allocationsbysample?uuid=${encodeURIComponent(sampleUuid)}` : '',
            headers,
            allowInsecureTls,
            timeout,
            !!sampleUuid,
            warnings,
            'sample allocations',
        );

        const settings: Record<string, string | null> = {};
        for (const property of SETTINGS) {
            const payload = await this.fetchOptional<any>(
                target,
                `/systemsetting?q=${encodeURIComponent(property)}&v=full`,
                headers,
                allowInsecureTls,
                timeout,
                true,
                warnings,
                property,
            );
            settings[property] = payload?.results?.[0]?.value ?? null;
        }

        const instrumentsPayload = await this.fetchOptional<any>(
            target,
            '/concept?q=LIS_INSTRUMENT&limit=50&tag=LIS_INSTRUMENT&class=LIS%20instrument&v=custom:(uuid,display,datatype,conceptClass,mappings)',
            headers,
            allowInsecureTls,
            timeout,
            true,
            warnings,
            'LIS instruments',
        );

        const testOrdersPayload = await this.fetchOptional<any>(
            target,
            '/concept?q=TEST_ORDERS&limit=50&tag=TEST_ORDERS&class=Test&v=custom:(uuid,display,datatype,conceptClass,mappings)',
            headers,
            allowInsecureTls,
            timeout,
            true,
            warnings,
            'test orders',
        );

        const usersPayload = await this.fetchOpenMrsUsers(
            target,
            String(input.userQuery ?? '').trim(),
            headers,
            allowInsecureTls,
            timeout,
            warnings,
        );

        let parameters = this.extractParameters(allocations);
        if (input.includeConceptDetails !== false && parameters.length > 0) {
            parameters = await this.attachConceptDetails(target, parameters, headers, allowInsecureTls, timeout, warnings);
        }

        return {
            target: { id: target.id, name: target.name, type: target.type, baseUrl: targetBaseUrl },
            lookup: lookup ?? null,
            sample: { uuid: sampleUuid, label: sampleLabel, found: !!sampleUuid },
            settings,
            allocations: allocations ?? null,
            parameters,
            instruments: this.toConceptList(instrumentsPayload),
            testOrders: this.toConceptList(testOrdersPayload),
            users: this.toUserList(usersPayload),
            warnings,
        };
    }

    private getTarget(targetId: string): TargetRow | null {
        const db = getDb();
        return (db
            .prepare(
                `
                    SELECT id, type, name, base_url, request_timeout_ms
                    FROM targets
                    WHERE id = ?
                    LIMIT 1
                `,
            )
            .get(targetId) ?? null) as TargetRow | null;
    }

    private async fetchOptional<T>(
        target: TargetRow,
        path: string,
        headers: Record<string, string>,
        allowInsecureTls: boolean,
        timeout: number,
        shouldFetch: boolean,
        warnings: string[],
        label: string,
    ): Promise<T | null> {
        if (!shouldFetch || !path) return null;
        const url = this.restUrl(target, path);
        const res = await this.http.getJson<T>(url, headers, allowInsecureTls, timeout);
        if (!res.ok) {
            warnings.push(`Failed to fetch ${label}: HTTP ${res.status}.`);
            return null;
        }
        if (!res.json) {
            warnings.push(`Fetched ${label}, but the response was not valid JSON.`);
            return null;
        }
        return res.json;
    }

    private normalizedBaseUrl(target: TargetRow): string {
        const base = String(target?.base_url ?? '').trim().replace(/\/+$/, '');
        if (!base) {
            throw new Error(`Base URL is not configured for target "${target?.name ?? target?.id ?? 'unknown'}".`);
        }
        return base;
    }

    private restUrl(target: TargetRow, path: string) {
        const base = this.normalizedBaseUrl(target);
        let suffix = String(path ?? '').trim();
        if (/^https?:\/\//i.test(suffix)) return suffix;
        if (!suffix.startsWith('/')) suffix = `/${suffix}`;

        if (base.endsWith(REST_PREFIX)) return `${base}${suffix}`;
        if (base.endsWith('/openmrs')) return `${base}/ws/rest/v1${suffix}`;
        return `${base}${REST_PREFIX}${suffix}`;
    }

    private toConceptList(payload: any): Array<{ uuid: string; display: string; mappings?: any[] }> {
        const rows = Array.isArray(payload?.results) ? payload.results : [];
        return rows
            .filter((row: any) => row?.uuid)
            .map((row: any) => ({
                uuid: row.uuid,
                display: row.display ?? row.name ?? row.uuid,
                mappings: Array.isArray(row.mappings) ? row.mappings : [],
            }));
    }

    private async fetchOpenMrsUsers(
        target: TargetRow,
        query: string,
        headers: Record<string, string>,
        allowInsecureTls: boolean,
        timeout: number,
        warnings: string[],
    ): Promise<{ results: any[]; links: any[] }> {
        const limit = 25;
        const maxUsers = 5000;
        const userView = 'custom:(uuid,display,username,person:(uuid,display),retired)';
        const results: any[] = [];
        const seen = new Set<string>();
        const links: any[] = [];

        let startIndex = 0;
        let pageCount = 0;

        while (results.length < maxUsers && pageCount < 250) {
            const path =
                `/user?startIndex=${startIndex}` +
                `&limit=${limit}` +
                `&v=${encodeURIComponent(userView)}` +
                `&q=${encodeURIComponent(query)}`;

            const page = await this.fetchOptional<any>(
                target,
                path,
                headers,
                allowInsecureTls,
                timeout,
                true,
                warnings,
                `OpenMRS users page starting at ${startIndex}`,
            );

            if (!page) break;

            const rows = Array.isArray(page?.results) ? page.results : [];
            const pageLinks = Array.isArray(page?.links) ? page.links : [];
            links.push(...pageLinks);

            for (const row of rows) {
                const uuid = String(row?.uuid ?? '').trim();
                if (!uuid || seen.has(uuid)) continue;
                seen.add(uuid);
                results.push(row);
            }

            pageCount += 1;
            if (rows.length < limit) break;

            const nextStartIndex = this.nextStartIndex(page);
            startIndex = nextStartIndex != null && nextStartIndex > startIndex ? nextStartIndex : startIndex + limit;
        }

        if (results.length >= maxUsers) {
            warnings.push(`OpenMRS user fetch stopped after ${maxUsers} users to protect the app from an unexpectedly large response.`);
        }

        if (pageCount >= 250) {
            warnings.push('OpenMRS user fetch stopped after 250 pages. Check the user API paging response.');
        }

        return { results, links };
    }

    private nextStartIndex(payload: any): number | null {
        const links = Array.isArray(payload?.links) ? payload.links : [];
        const next = links.find((link: any) => String(link?.rel ?? '').toLowerCase() === 'next');
        const uri = String(next?.uri ?? '').trim();
        if (!uri) return null;

        const match = uri.match(/[?&]startIndex=(\d+)/);
        if (match) {
            const value = Number(match[1]);
            return Number.isFinite(value) && value >= 0 ? value : null;
        }

        try {
            const url = new URL(uri);
            const value = Number(url.searchParams.get('startIndex'));
            return Number.isFinite(value) && value >= 0 ? value : null;
        } catch {
            return null;
        }
    }

    private toUserList(payload: any): OpenMrsLisUserOption[] {
        const rows = Array.isArray(payload?.results) ? payload.results : [];
        const seen = new Set<string>();

        return rows
            .filter((row: any) => row?.uuid && !this.isRetired(row))
            .map((row: any) => ({
                uuid: String(row.uuid),
                username: row.username ? String(row.username) : null,
                display: String(row.person?.display ?? row.display ?? row.username ?? row.uuid),
                personUuid: row.person?.uuid ? String(row.person.uuid) : null,
            }))
            .filter((user: OpenMrsLisUserOption) => {
                if (seen.has(user.uuid)) return false;
                seen.add(user.uuid);
                return true;
            })
            .sort((a: OpenMrsLisUserOption, b: OpenMrsLisUserOption) => a.display.localeCompare(b.display));
    }

    private isRetired(row: any): boolean {
        const value = row?.retired;
        return value === true || value === 1 || String(value ?? '').toLowerCase() === 'true';
    }

    private extractParameters(payload: any): OpenMrsLisParameterMetadata[] {
        const found = new Map<string, OpenMrsLisParameterMetadata>();
        const visit = (node: any, parent: any = null) => {
            if (!node) return;
            if (Array.isArray(node)) {
                for (const item of node) visit(item, parent);
                return;
            }
            if (typeof node !== 'object') return;

            const concept = this.firstObject(
                node.concept,
                node.testParameter,
                node.parameter,
                node.parameterConcept,
                node.testParameterConcept,
                node.test?.concept,
                node.order?.concept,
            );
            const allocationUuid = this.firstText(
                node.testAllocation?.uuid,
                node.allocation?.uuid,
                node.uuid,
                parent?.testAllocation?.uuid,
                parent?.allocation?.uuid,
            );
            const conceptUuid = this.firstText(concept?.uuid, node.conceptUuid, node.testParameterUuid);

            if (conceptUuid && allocationUuid) {
                const analyzerCode = this.bestAnalyzerCode(concept);
                const key = `${conceptUuid}|${allocationUuid}`;
                if (!found.has(key)) {
                    found.set(key, {
                        analyzerCode,
                        display: concept?.display ?? concept?.name ?? analyzerCode,
                        conceptUuid,
                        allocationUuid,
                        datatype: concept?.datatype?.display ?? concept?.datatype?.name ?? node.datatype ?? null,
                        answers: [],
                        raw: node,
                    });
                }
            }

            for (const value of Object.values(node)) visit(value, node);
        };
        visit(payload);
        return Array.from(found.values()).sort((a, b) => a.display.localeCompare(b.display));
    }

    private async attachConceptDetails(
        target: TargetRow,
        parameters: OpenMrsLisParameterMetadata[],
        headers: Record<string, string>,
        allowInsecureTls: boolean,
        timeout: number,
        warnings: string[],
    ) {
        const detailed: OpenMrsLisParameterMetadata[] = [];
        for (const parameter of parameters.slice(0, 60)) {
            if (!parameter.conceptUuid) {
                detailed.push(parameter);
                continue;
            }
            const concept = await this.fetchOptional<any>(
                target,
                `/concept/${encodeURIComponent(parameter.conceptUuid)}?v=custom:(uuid,display,datatype,names,answers:(uuid,display,names),attributes:(uuid,display,voided,value,attributeType:(uuid,display)))`,
                headers,
                allowInsecureTls,
                timeout,
                true,
                warnings,
                `concept ${parameter.conceptUuid}`,
            );
            if (!concept) {
                detailed.push(parameter);
                continue;
            }
            detailed.push({
                ...parameter,
                analyzerCode: this.bestAnalyzerCode(concept) || parameter.analyzerCode,
                display: concept.display ?? parameter.display,
                datatype: concept?.datatype?.display ?? concept?.datatype?.name ?? parameter.datatype,
                answers: this.extractAnswers(concept),
            });
        }
        return detailed;
    }

    private extractAnswers(concept: any): OpenMrsLisAnswerOption[] {
        const answers = Array.isArray(concept?.answers) ? concept.answers : [];
        return answers
            .filter((answer: any) => answer?.uuid)
            .map((answer: any) => {
                const names = Array.isArray(answer.names) ? answer.names : [];
                const shortName = names.find((name: any) => name?.conceptNameType === 'SHORT')?.name ?? null;
                const analyzerCodes = names
                    .map((name: any) => name?.name)
                    .filter((name: any) => !!name && name !== 'LIS_CODED_ANSWERS')
                    .map((name: string) => String(name).trim())
                    .filter(Boolean);
                return {
                    uuid: answer.uuid,
                    display: answer.display ?? shortName ?? answer.uuid,
                    shortName,
                    analyzerCodes: Array.from(new Set(analyzerCodes)),
                };
            });
    }

    private bestAnalyzerCode(concept: any): string {
        const names = Array.isArray(concept?.names) ? concept.names : [];
        const shortName = names.find((name: any) => name?.conceptNameType === 'SHORT')?.name;
        const fullName = names.find((name: any) => name?.localePreferred)?.name;
        return String(shortName ?? fullName ?? concept?.display ?? concept?.name ?? concept?.uuid ?? '').trim();
    }

    private firstObject(...values: any[]) {
        return values.find((value) => value && typeof value === 'object') ?? null;
    }

    private firstText(...values: any[]) {
        for (const value of values) {
            const text = String(value ?? '').trim();
            if (text) return text;
        }
        return null;
    }
}

