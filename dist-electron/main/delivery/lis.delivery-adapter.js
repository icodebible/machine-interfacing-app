"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LisDeliveryAdapter = void 0;
const secure_http_client_1 = require("../security/secure-http.client");
const db_1 = require("../db/db");
const REST_PREFIX = '/openmrs/ws/rest/v1';
const DEFAULT_MULTIPLE_RESULTS_ENDPOINT = '/lab/multipleresults';
class LisDeliveryAdapter {
    http = new secure_http_client_1.SecureHttpClient();
    async send(args) {
        const storedPayload = JSON.parse(args.queueItem.payload_json || '{}');
        const prepared = this.preparePayload(storedPayload);
        prepared.context = this.contextWithQueueFallback(prepared.context, args.queueItem);
        const timeout = Number(args.requestTimeoutMs ?? args.target?.request_timeout_ms ?? 15_000);
        const allowInsecureTls = !!args.allowInsecureTls;
        if (prepared.strictSampleBinding) {
            if (!Array.isArray(prepared.body) || prepared.body.length === 0) {
                throw new Error('OpenMRS LIS result delivery requires at least one result row.');
            }
            prepared.body = await this.bindCurrentSampleAllocations({
                target: args.target,
                body: prepared.body,
                context: prepared.context,
                headers: args.headers,
                allowInsecureTls,
                timeout,
                diagnostics: prepared.diagnostics,
            });
            if (!prepared.body.length) {
                prepared.diagnostics.push('All result rows already exist with the same value in LIS; no duplicate POST was sent.');
                return {
                    status: 200,
                    body: JSON.stringify({ ok: true, duplicate: true, message: 'No new LIS result rows to submit.' }),
                    diagnostics: prepared.diagnostics,
                    resolvedPayload: prepared.body,
                };
            }
            this.validateRequiredResultMetadata({
                body: prepared.body,
                context: prepared.context,
                diagnostics: prepared.diagnostics,
            });
        }
        const url = this.openMrsRestUrl(args.target.base_url, prepared.endpoint);
        const res = await this.http.postJson(url, prepared.body, args.headers, allowInsecureTls, timeout);
        if (!res.ok) {
            throw new Error(`LIS delivery failed with status ${res.status}: ${res.body || 'No response body'}`);
        }
        prepared.diagnostics.push(`Delivered ${Array.isArray(prepared.body) ? prepared.body.length : 1} LIS result row(s) to ${prepared.endpoint}.`);
        return {
            status: res.status,
            body: res.body,
            diagnostics: prepared.diagnostics,
            resolvedPayload: prepared.body,
        };
    }
    preparePayload(payload) {
        if (Array.isArray(payload)) {
            return {
                endpoint: DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
                body: payload,
                context: {},
                diagnostics: ["Legacy LIS multiple-results array detected. Any stored allocation UUID will be replaced using the queue item's current analyzer sample before delivery."],
                strictSampleBinding: true,
            };
        }
        if (payload?.resourceType === 'OpenMRSLabMultipleResultsRequest') {
            if (!Array.isArray(payload.body)) {
                throw new Error('OpenMRS LIS payload wrapper is missing body[].');
            }
            return {
                endpoint: payload.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
                body: payload.body.map((row) => ({ ...row })),
                context: payload.context ?? {},
                diagnostics: [`Prepared ${payload.body.length} LIS multiple-results row${payload.body.length === 1 ? '' : 's'} from OpenMRS LIS wrapper.`],
                strictSampleBinding: true,
            };
        }
        if (Array.isArray(payload?.body)) {
            return {
                endpoint: payload.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
                body: payload.body.map((row) => ({ ...row })),
                context: payload.context ?? {},
                diagnostics: ['Prepared LIS body[] from generic payload wrapper.'],
                strictSampleBinding: true,
            };
        }
        if (Array.isArray(payload?.payload?.body)) {
            return {
                endpoint: payload.payload.endpoint ?? payload.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
                body: payload.payload.body.map((row) => ({ ...row })),
                context: payload.payload.context ?? payload.context ?? {},
                diagnostics: ['Prepared LIS payload.body[] from nested payload wrapper.'],
                strictSampleBinding: true,
            };
        }
        return {
            endpoint: payload?.endpoint ?? DEFAULT_MULTIPLE_RESULTS_ENDPOINT,
            body: payload,
            context: payload?.context ?? {},
            diagnostics: ['Payload did not use a known LIS wrapper. It was sent as-is to the LIS endpoint.'],
            strictSampleBinding: false,
        };
    }
    contextWithQueueFallback(context, queueItem) {
        const base = context && typeof context === 'object' ? { ...context } : {};
        const normalizedResultId = this.firstText(queueItem?.normalized_result_id, queueItem?.normalizedResultId);
        if (!normalizedResultId)
            return base;
        try {
            const row = (0, db_1.getDb)().prepare(`
                SELECT sample_id, data_json
                FROM normalized_lab_results
                WHERE id = ?
                LIMIT 1
            `).get(normalizedResultId);
            if (!row)
                return base;
            let data = null;
            try {
                data = row.data_json ? JSON.parse(row.data_json) : null;
            }
            catch {
                data = null;
            }
            const sampleLabel = this.firstText(base?.sample?.label, base?.sample?.sampleId, base?.sample?.id, row.sample_id, data?.sample?.label, data?.sample?.sampleId, data?.specimen?.id);
            if (sampleLabel) {
                base.sample = {
                    ...(base.sample && typeof base.sample === 'object' ? base.sample : {}),
                    label: sampleLabel,
                    sampleId: sampleLabel,
                };
            }
            if (!base.resultHandling && data?.resultHandling)
                base.resultHandling = data.resultHandling;
            return base;
        }
        catch {
            return base;
        }
    }
    async bindCurrentSampleAllocations(args) {
        const sampleLabel = this.firstText(args.context?.sample?.label, args.context?.sample?.sampleId, args.context?.sample?.id, args.context?.sample?.display, args.context?.sampleLabel, args.context?.barcode);
        if (!sampleLabel) {
            throw new Error('LIS delivery blocked: analyzer sample/barcode is missing from the payload context.');
        }
        const lookup = await this.getJson(args.target, `/lab/samplelookup?sampleId=${encodeURIComponent(sampleLabel)}`, args.headers, args.allowInsecureTls, args.timeout, `sample lookup for ${sampleLabel}`);
        const sampleUuid = this.firstText(lookup?.sample?.uuid, lookup?.uuid);
        if (!sampleUuid) {
            throw new Error(`LIS delivery blocked: sample "${sampleLabel}" was not found in OpenMRS LIS.`);
        }
        const returnedLabel = this.firstText(lookup?.sample?.label, lookup?.sample?.sampleId, lookup?.sample?.display, lookup?.label, lookup?.sampleId);
        if (returnedLabel && this.sampleKey(returnedLabel) !== this.sampleKey(sampleLabel)) {
            throw new Error(`LIS delivery blocked: analyzer sample "${sampleLabel}" resolved to a different LIS sample "${returnedLabel}".`);
        }
        const allocationsPayload = await this.getJson(args.target, `/lab/allocationsbysample?uuid=${encodeURIComponent(sampleUuid)}`, args.headers, args.allowInsecureTls, args.timeout, `allocations for ${sampleLabel}`);
        const allocationIndex = this.indexAllocationsByConceptUuid(allocationsPayload);
        const mode = String(args.context?.resultHandling?.mode ?? 'INITIAL').trim().toUpperCase();
        const resolvedRows = [];
        for (const originalRow of args.body) {
            const conceptUuid = this.firstText(originalRow?.concept?.uuid);
            if (!conceptUuid)
                throw new Error('LIS delivery blocked: result row is missing concept.uuid.');
            const matches = allocationIndex.get(this.key(conceptUuid)) ?? [];
            const uniqueMatches = this.uniqueAllocations(matches);
            if (uniqueMatches.length === 0) {
                throw new Error(`LIS delivery blocked: sample "${sampleLabel}" has no allocation for concept ${conceptUuid}.`);
            }
            const allocation = this.resolveAllocationForCurrentOrder({
                sampleLabel,
                conceptUuid,
                matches: uniqueMatches,
                orderContext: args.context?.order ?? null,
                targetId: this.firstText(args.target?.id),
                diagnostics: args.diagnostics,
            });
            const row = {
                ...originalRow,
                concept: { ...(originalRow?.concept ?? {}), uuid: conceptUuid },
                // Always overwrite any stored/static allocation with the current sample allocation.
                testAllocation: { uuid: allocation.uuid },
            };
            const existingResults = this.existingResults(allocation.node, conceptUuid);
            const sameValue = existingResults.some((existing) => this.valueSignature(existing) === this.valueSignature(row));
            if (sameValue && mode === 'INITIAL') {
                args.diagnostics.push(`Skipped duplicate LIS row for concept ${conceptUuid}; the same value already exists for sample ${sampleLabel}.`);
                continue;
            }
            if (existingResults.length && !sameValue && mode === 'INITIAL') {
                throw new Error(`LIS delivery blocked: sample "${sampleLabel}" already has a different result for concept ${conceptUuid}. Mark the analyzer result as repeat/rerun or correction before resubmission.`);
            }
            args.diagnostics.push(`Resolved sample ${sampleLabel} (${sampleUuid}) concept ${conceptUuid} to allocation ${allocation.uuid}.`);
            resolvedRows.push(row);
        }
        args.diagnostics.push(`Verified current LIS sample binding for ${sampleLabel}; ${resolvedRows.length} row(s) remain eligible for delivery.`);
        return resolvedRows;
    }
    validateRequiredResultMetadata(args) {
        const sampleLabel = this.firstText(args.context?.sample?.label, args.context?.sample?.sampleId, args.context?.sample?.id, args.context?.sampleLabel, args.context?.barcode) ?? 'unknown';
        const missing = [];
        const metadataSummaries = [];
        args.body.forEach((row, index) => {
            const rowNumber = index + 1;
            const conceptUuid = this.firstText(row?.concept?.uuid);
            const allocationUuid = this.firstText(row?.testAllocation?.uuid);
            const instrumentUuid = this.firstText(row?.instrument?.uuid, typeof row?.instrument === 'string' ? row.instrument : null, row?.instrumentUuid, row?.instrument_uuid);
            const testedBy = this.firstText(typeof row?.testedBy === 'string' ? row.testedBy : null, row?.testedBy?.uuid, row?.testedByUuid, row?.tested_by_uuid);
            const testedDate = this.firstText(row?.testedDate, row?.resultDate, row?.observedAt);
            // Normalize legacy wrapper shapes into the exact OpenMRS multiple-results contract
            // before the final POST. This keeps old queued rows usable while guaranteeing the
            // final payload contains the canonical instrument/testedBy/testedDate fields.
            if (instrumentUuid)
                row.instrument = { uuid: instrumentUuid };
            if (testedBy)
                row.testedBy = testedBy;
            if (testedDate)
                row.testedDate = testedDate;
            if (!conceptUuid)
                missing.push(`row ${rowNumber}: concept.uuid`);
            if (!allocationUuid)
                missing.push(`row ${rowNumber}: testAllocation.uuid`);
            if (!instrumentUuid)
                missing.push(`row ${rowNumber}: instrument.uuid`);
            if (!testedBy)
                missing.push(`row ${rowNumber}: testedBy`);
            if (!testedDate)
                missing.push(`row ${rowNumber}: testedDate`);
            metadataSummaries.push(`row ${rowNumber} concept=${conceptUuid ?? 'missing'} allocation=${allocationUuid ?? 'missing'} ` +
                `instrument=${instrumentUuid ?? 'missing'} testedBy=${testedBy ?? 'missing'} testedDate=${testedDate ?? 'missing'}`);
        });
        const diagnostic = `Final LIS result metadata for sample ${sampleLabel}: ${metadataSummaries.join(' | ')}.`;
        args.diagnostics.push(diagnostic);
        console.info(`[OpenMRS LIS delivery] ${diagnostic}`);
        if (missing.length) {
            const errorMessage = `LIS delivery blocked: required result metadata is missing for sample "${sampleLabel}": ${missing.join(', ')}. ` +
                'Configure the OpenMRS instrument and tested-by user in the LIS Mapping Assistant; ' +
                'sample-specific testAllocation UUIDs are resolved automatically at delivery time.';
            console.warn(`[OpenMRS LIS delivery] ${errorMessage}`);
            throw new Error(errorMessage);
        }
    }
    indexAllocationsByConceptUuid(payload) {
        const index = new Map();
        const visit = (node, parent = null, inheritedOrder = null) => {
            if (!node)
                return;
            if (Array.isArray(node)) {
                for (const item of node)
                    visit(item, parent, inheritedOrder);
                return;
            }
            if (typeof node !== 'object')
                return;
            const embeddedOrder = this.extractAllocationOrderNode(node) ?? inheritedOrder;
            const conceptUuid = this.firstText(node.concept?.uuid, node.parameter?.uuid, node.testParameter?.uuid, node.parameterConcept?.uuid, node.testParameterConcept?.uuid, node.conceptUuid, node.parameterUuid);
            const explicitAllocationUuid = this.firstText(node.testAllocation?.uuid, node.allocation?.uuid);
            const parentAllocationUuid = this.firstText(parent?.testAllocation?.uuid, parent?.allocation?.uuid);
            const resultLike = this.looksLikeResultNode(node);
            const ownAllocationUuid = conceptUuid && !resultLike ? this.firstText(node.uuid) : null;
            const allocationUuid = explicitAllocationUuid ?? parentAllocationUuid ?? ownAllocationUuid;
            if (conceptUuid && allocationUuid) {
                const orderNode = this.extractAllocationOrderNode(node)
                    ?? this.extractAllocationOrderNode(parent)
                    ?? embeddedOrder
                    ?? inheritedOrder;
                const orderMetadata = this.allocationOrderMetadata(orderNode, node, parent);
                const key = this.key(conceptUuid);
                const rows = index.get(key) ?? [];
                rows.push({
                    uuid: allocationUuid,
                    conceptUuid,
                    node: explicitAllocationUuid || ownAllocationUuid ? node : parent ?? node,
                    orderNode,
                    ...orderMetadata,
                });
                index.set(key, rows);
            }
            for (const value of Object.values(node))
                visit(value, node, embeddedOrder);
        };
        visit(payload);
        return index;
    }
    resolveAllocationForCurrentOrder(args) {
        const eligible = args.matches.filter((row) => !this.isInactiveAllocation(row));
        const candidates = eligible.length ? eligible : args.matches;
        if (candidates.length === 1)
            return candidates[0];
        const orderContext = this.deliveryOrderContext(args.orderContext);
        const profileHint = this.resolveProfileOrderHint(args.targetId, args.conceptUuid, orderContext);
        if (profileHint) {
            orderContext.profileOrderConceptUuid = profileHint.orderConceptUuid;
            orderContext.profileLabel = profileHint.label;
        }
        const scored = candidates.map((candidate) => ({
            candidate,
            score: this.allocationOrderScore(candidate, orderContext),
        }));
        const bestScore = Math.max(...scored.map((row) => row.score));
        const best = bestScore > 0 ? scored.filter((row) => row.score === bestScore) : [];
        const candidateDiagnostic = `Allocation candidates for sample ${args.sampleLabel}, concept ${args.conceptUuid}: ` +
            candidates.map((row) => this.allocationCandidateSummary(row)).join(' | ') +
            `. Analyzer order context: ${this.orderContextSummary(orderContext)}.`;
        args.diagnostics.push(candidateDiagnostic);
        console.info(`[OpenMRS LIS delivery] ${candidateDiagnostic}`);
        if (best.length === 1) {
            const selected = best[0].candidate;
            const resolutionDiagnostic = `Resolved ambiguous concept ${args.conceptUuid} using current test-order context to allocation ${selected.uuid}` +
                `${selected.orderDisplay ? ` (${selected.orderDisplay})` : ''}.`;
            args.diagnostics.push(resolutionDiagnostic);
            console.info(`[OpenMRS LIS delivery] ${resolutionDiagnostic}`);
            return selected;
        }
        const candidateText = candidates.map((row) => this.allocationCandidateSummary(row)).join('; ');
        const orderText = this.orderContextSummary(orderContext);
        const errorMessage = `LIS delivery blocked: sample "${args.sampleLabel}" has multiple allocations for concept ${args.conceptUuid}` +
            ` and the current test order could not resolve them safely. Analyzer order: ${orderText}. Candidates: ${candidateText}.`;
        console.warn(`[OpenMRS LIS delivery] ${errorMessage}`);
        throw new Error(errorMessage);
    }
    extractAllocationOrderNode(node) {
        if (!node || typeof node !== 'object')
            return null;
        return node.order
            ?? node.testOrder
            ?? node.test_order
            ?? node.labTestOrder
            ?? node.lab_test_order
            ?? null;
    }
    allocationOrderMetadata(orderNode, node, parent) {
        const order = orderNode && typeof orderNode === 'object' ? orderNode : {};
        const concept = order?.concept && typeof order.concept === 'object'
            ? order.concept
            : order?.testConcept && typeof order.testConcept === 'object'
                ? order.testConcept
                : {};
        const mappings = [
            ...(Array.isArray(order?.mappings) ? order.mappings : []),
            ...(Array.isArray(concept?.mappings) ? concept.mappings : []),
        ];
        const orderCodes = this.uniqueStrings([
            this.firstText(order?.code),
            this.firstText(order?.testCode),
            this.firstText(order?.orderCode),
            this.firstText(concept?.code),
            ...mappings.flatMap((mapping) => [
                this.firstText(mapping?.code),
                this.firstText(mapping?.display),
                this.firstText(mapping?.conceptReference?.code),
                this.firstText(mapping?.conceptReferenceTerm?.code),
            ]),
        ].filter(Boolean));
        return {
            orderConceptUuid: this.firstText(concept?.uuid, order?.orderConceptUuid, order?.conceptUuid, order?.testConceptUuid),
            orderDisplay: this.firstText(order?.display, order?.name, order?.testName, order?.orderDisplay, concept?.display, concept?.name),
            orderCodes,
            orderNumber: this.firstText(order?.orderNumber, order?.accessionNumber, order?.placerOrderNumber, order?.fillerOrderNumber, parent?.orderNumber, node?.orderNumber),
            status: this.firstText(node?.status, node?.allocationStatus, node?.testAllocationStatus, parent?.status),
        };
    }
    deliveryOrderContext(order) {
        const source = order && typeof order === 'object' ? order : {};
        const uuid = this.firstText(source?.uuid, source?.orderConceptUuid, source?.conceptUuid);
        return {
            uuid: uuid && this.looksLikeUuid(uuid) ? uuid : null,
            testCode: this.firstText(source?.testCode, source?.code, source?.serviceCode),
            testName: this.firstText(source?.testName, source?.name, source?.display),
            orderNumber: this.firstText(source?.orderNumber, source?.placerOrderNumber, source?.fillerOrderNumber),
            profileOrderConceptUuid: null,
            profileLabel: null,
        };
    }
    resolveProfileOrderHint(targetId, conceptUuid, order) {
        if (!targetId || !conceptUuid)
            return null;
        try {
            const rows = (0, db_1.getDb)().prepare(`
                SELECT DISTINCT
                    p.order_concept_uuid,
                    p.profile_code,
                    p.profile_name,
                    p.order_display,
                    p.order_name_includes_json
                FROM lis_test_order_profiles p
                INNER JOIN lis_test_order_profile_parameters pp ON pp.profile_id = p.id
                WHERE p.target_id = ?
                  AND p.enabled = 1
                  AND UPPER(TRIM(COALESCE(pp.concept_uuid, ''))) = UPPER(TRIM(?))
                  AND p.order_concept_uuid IS NOT NULL
                  AND TRIM(p.order_concept_uuid) <> ''
            `).all(targetId, conceptUuid);
            if (!rows.length)
                return null;
            const analyzerKeys = [order.testCode, order.testName]
                .map((value) => this.semanticKey(value))
                .filter(Boolean);
            const scored = rows.map((row) => {
                let includes = [];
                try {
                    const parsed = JSON.parse(String(row?.order_name_includes_json ?? '[]'));
                    if (Array.isArray(parsed))
                        includes = parsed;
                }
                catch {
                    includes = [];
                }
                const profileValues = [
                    row?.profile_code,
                    row?.profile_name,
                    row?.order_display,
                    ...includes,
                ].map((value) => this.semanticKey(value)).filter(Boolean);
                let score = 0;
                for (const analyzerKey of analyzerKeys) {
                    for (const profileValue of profileValues) {
                        if (analyzerKey === profileValue)
                            score = Math.max(score, 80);
                        else if (profileValue.includes(analyzerKey) || analyzerKey.includes(profileValue))
                            score = Math.max(score, 50);
                    }
                }
                return { row, score };
            });
            const bestScore = Math.max(...scored.map((item) => item.score));
            const best = bestScore > 0 ? scored.filter((item) => item.score === bestScore) : scored;
            const uniqueOrderConcepts = this.uniqueStrings(best.map((item) => this.firstText(item.row?.order_concept_uuid)).filter(Boolean));
            if (uniqueOrderConcepts.length !== 1)
                return null;
            const selected = best.find((item) => this.key(item.row?.order_concept_uuid) === this.key(uniqueOrderConcepts[0]))?.row ?? best[0]?.row;
            return {
                orderConceptUuid: uniqueOrderConcepts[0],
                label: this.firstText(selected?.profile_name, selected?.profile_code, selected?.order_display) ?? uniqueOrderConcepts[0],
            };
        }
        catch {
            return null;
        }
    }
    allocationOrderScore(candidate, order) {
        let score = 0;
        if (order.profileOrderConceptUuid && candidate.orderConceptUuid && this.key(order.profileOrderConceptUuid) === this.key(candidate.orderConceptUuid))
            score += 120;
        if (order.uuid && candidate.orderConceptUuid && this.key(order.uuid) === this.key(candidate.orderConceptUuid))
            score += 100;
        if (order.orderNumber && candidate.orderNumber && this.key(order.orderNumber) === this.key(candidate.orderNumber))
            score += 80;
        const testCode = this.semanticKey(order.testCode);
        if (testCode) {
            const codeKeys = (candidate.orderCodes ?? []).map((value) => this.semanticKey(value));
            if (codeKeys.some((value) => value && value === testCode))
                score += 70;
            else if (this.semanticKey(candidate.orderDisplay) === testCode)
                score += 45;
        }
        const testName = this.semanticKey(order.testName);
        if (testName) {
            const display = this.semanticKey(candidate.orderDisplay);
            const codeKeys = (candidate.orderCodes ?? []).map((value) => this.semanticKey(value));
            if (display && display === testName)
                score += 50;
            else if (display && (display.includes(testName) || testName.includes(display)))
                score += 30;
            if (codeKeys.some((value) => value && value === testName))
                score += 35;
        }
        return score;
    }
    isInactiveAllocation(candidate) {
        const node = candidate.node ?? {};
        if (node?.voided === true || node?.retired === true || node?.active === false || node?.enabled === false)
            return true;
        const status = this.semanticKey(candidate.status);
        return ['VOIDED', 'CANCELLED', 'CANCELED', 'RETIRED', 'INACTIVE', 'DISCONTINUED'].includes(status);
    }
    allocationCandidateSummary(candidate) {
        const bits = [
            candidate.uuid,
            candidate.orderDisplay ? `order=${candidate.orderDisplay}` : null,
            candidate.orderConceptUuid ? `orderConcept=${candidate.orderConceptUuid}` : null,
            candidate.orderCodes?.length ? `codes=${candidate.orderCodes.join(',')}` : null,
            candidate.orderNumber ? `orderNumber=${candidate.orderNumber}` : null,
            candidate.status ? `status=${candidate.status}` : null,
        ].filter(Boolean);
        return bits.join(' ');
    }
    orderContextSummary(order) {
        const bits = [
            order.testCode ? `code=${order.testCode}` : null,
            order.testName ? `name=${order.testName}` : null,
            order.uuid ? `concept=${order.uuid}` : null,
            order.orderNumber ? `orderNumber=${order.orderNumber}` : null,
            order.profileOrderConceptUuid ? `profileOrderConcept=${order.profileOrderConceptUuid}` : null,
            order.profileLabel ? `profile=${order.profileLabel}` : null,
        ].filter(Boolean);
        return bits.length ? bits.join(', ') : 'not available';
    }
    semanticKey(value) {
        return String(value ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    }
    looksLikeUuid(value) {
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value ?? '').trim());
    }
    uniqueStrings(values) {
        return Array.from(new Set(values.map((value) => String(value ?? '').trim()).filter(Boolean)));
    }
    looksLikeResultNode(node) {
        if (!node || typeof node !== 'object')
            return false;
        return [
            'value', 'valueText', 'valueNumeric', 'valueCoded', 'valueBoolean', 'valueDateTime',
            'testedDate', 'testedBy', 'resultDate', 'resultStatus', 'remarks',
        ].some((key) => Object.prototype.hasOwnProperty.call(node, key));
    }
    uniqueAllocations(matches) {
        const seen = new Set();
        return matches.filter((row) => {
            const key = this.key(row.uuid);
            if (!key || seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    }
    existingResults(allocationNode, conceptUuid) {
        const candidates = [allocationNode?.results, allocationNode?.testResults, allocationNode?.result];
        const rows = [];
        for (const candidate of candidates) {
            if (Array.isArray(candidate))
                rows.push(...candidate);
            else if (candidate && typeof candidate === 'object')
                rows.push(candidate);
        }
        return rows.filter((row) => {
            if (row?.voided === true)
                return false;
            const rowConcept = this.firstText(row?.concept?.uuid, row?.parameter?.uuid);
            return !rowConcept || this.key(rowConcept) === this.key(conceptUuid);
        });
    }
    valueSignature(row) {
        const coded = this.firstText(row?.valueCoded?.uuid, row?.value_coded?.uuid);
        if (coded)
            return `coded:${this.key(coded)}`;
        if (row?.valueNumeric !== undefined && row?.valueNumeric !== null && row?.valueNumeric !== '')
            return `numeric:${Number(row.valueNumeric)}`;
        const text = row?.valueText ?? row?.value ?? row?.result;
        if (text !== undefined && text !== null && String(text).trim() !== '')
            return `text:${String(text).trim().toUpperCase()}`;
        const booleanValue = row?.valueBoolean;
        if (booleanValue !== undefined && booleanValue !== null && booleanValue !== '')
            return `boolean:${String(booleanValue)}`;
        return '';
    }
    async getJson(target, path, headers, allowInsecureTls, timeout, label) {
        const url = this.openMrsRestUrl(target.base_url, path);
        const res = await this.http.getJson(url, headers, allowInsecureTls, timeout);
        if (!res.ok)
            throw new Error(`Failed to fetch ${label}: HTTP ${res.status}${res.body ? `: ${res.body.slice(0, 300)}` : ''}.`);
        if (!res.json)
            throw new Error(`Failed to fetch ${label}: response was not valid JSON.`);
        return res.json;
    }
    openMrsRestUrl(baseUrl, path) {
        const base = String(baseUrl ?? '').trim().replace(/\/+$/, '');
        let suffix = String(path ?? '').trim() || DEFAULT_MULTIPLE_RESULTS_ENDPOINT;
        if (/^https?:\/\//i.test(suffix))
            return suffix;
        if (!suffix.startsWith('/'))
            suffix = `/${suffix}`;
        if (suffix.startsWith(REST_PREFIX)) {
            if (base.endsWith(REST_PREFIX))
                return `${base}${suffix.slice(REST_PREFIX.length)}`;
            if (base.endsWith('/openmrs'))
                return `${base}${suffix.slice('/openmrs'.length)}`;
            return `${base}${suffix}`;
        }
        if (suffix.startsWith('/ws/rest/v1')) {
            if (base.endsWith(REST_PREFIX))
                return `${base}${suffix.slice('/ws/rest/v1'.length)}`;
            if (base.endsWith('/openmrs'))
                return `${base}${suffix}`;
            return `${base}/openmrs${suffix}`;
        }
        if (base.endsWith(REST_PREFIX))
            return `${base}${suffix}`;
        if (base.endsWith('/openmrs'))
            return `${base}/ws/rest/v1${suffix}`;
        return `${base}${REST_PREFIX}${suffix}`;
    }
    firstText(...values) {
        for (const value of values) {
            const text = String(value ?? '').trim();
            if (text)
                return text;
        }
        return null;
    }
    key(value) {
        return String(value ?? '').trim().toUpperCase();
    }
    sampleKey(value) {
        return String(value ?? '').trim().replace(/\s+/g, '').toUpperCase();
    }
}
exports.LisDeliveryAdapter = LisDeliveryAdapter;
