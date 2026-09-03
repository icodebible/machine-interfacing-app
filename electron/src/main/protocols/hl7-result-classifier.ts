type ObservationLike = {
    code?: string | null;
    name?: string | null;
    rawValue?: string | null;
    value?: string | null;
    interpretation?: string | null;
    abnormalFlag?: string | null;
    resultStatus?: string | null;
    subId?: string | null;
};

export type Hl7ReportableObservation = ObservationLike & {
    canonicalCode: string;
    effectiveValue: 'POS' | 'NEG' | 'NA';
};

export type Hl7ResultClassification = {
    profile: 'COBAS_6800_HPV' | 'GENERIC_HL7';
    reportable: boolean;
    reason: string;
    testCode?: string | null;
    specimenRole?: string | null;
    observations: Hl7ReportableObservation[];
};

const normalizeToken = (value: any) =>
    String(value ?? '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '');

const normalizeValue = (value: any) => String(value ?? '').trim().toUpperCase();
const RESULT_VALUES = new Set(['POS', 'NEG', 'NA']);
const FINAL_STATUSES = new Set(['F', 'C', 'R']);

function canonicalCobasHpvCode(observation: ObservationLike): string | null {
    const candidates = [observation.code, observation.name].map(normalizeToken);
    for (const code of candidates) {
        if (code === 'HPV16') return 'HPV16';
        if (code === 'HPV18') return 'HPV18';
        if (code === 'OTHERHRHPV' || code === 'HRHPV') return 'HRHPV';
    }
    return null;
}

function cobasEffectiveValue(observation: ObservationLike): 'POS' | 'NEG' | 'NA' | null {
    const rawValue = normalizeValue(observation.rawValue ?? observation.value);
    const interpretation = normalizeValue(observation.interpretation ?? observation.abnormalFlag);

    if (RESULT_VALUES.has(rawValue)) return rawValue as 'POS' | 'NEG' | 'NA';
    if ((!rawValue || rawValue === 'VALUENOTSET') && RESULT_VALUES.has(interpretation)) {
        return interpretation as 'POS' | 'NEG' | 'NA';
    }
    return null;
}

export function classifyHl7Result(parsed: { messageType?: string | null; data?: Record<string, any> }): Hl7ResultClassification {
    const data = parsed?.data ?? {};
    const messageType = String(parsed?.messageType ?? '').trim().toUpperCase();
    const sendingApplication = normalizeToken(data?.sendingApplication);
    const testCode = String(data?.order?.testCode ?? '').trim() || null;
    const testName = String(data?.order?.testName ?? '').trim() || null;
    const specimenRole = String(data?.specimen?.role ?? '').trim().toUpperCase() || null;
    const observations: ObservationLike[] = Array.isArray(data?.observations) ? data.observations : [];

    const isCobas = sendingApplication.includes('COBAS6800') || sendingApplication.includes('COBAS8800');
    const isHpv = normalizeToken(testCode) === '714329' || normalizeToken(testName) === 'HPVGT';

    if (isCobas && (messageType.startsWith('QBP^') || messageType.startsWith('RSP^') || messageType.startsWith('ACK'))) {
        return {
            profile: 'COBAS_6800_HPV',
            reportable: false,
            reason: `Ignored COBAS ${messageType || 'non-result'} message: query/response/control traffic is log-only.`,
            testCode,
            specimenRole,
            observations: [],
        };
    }

    if (isCobas && isHpv) {
        if (!messageType.startsWith('OUL^R22')) {
            return { profile: 'COBAS_6800_HPV', reportable: false, reason: `Ignored ${messageType || 'unknown'}: not a COBAS result-family message.`, testCode, specimenRole, observations: [] };
        }
        if (specimenRole !== 'P') {
            return { profile: 'COBAS_6800_HPV', reportable: false, reason: `Ignored COBAS HPV message: specimen role is ${specimenRole || 'missing'}, not patient (P).`, testCode, specimenRole, observations: [] };
        }

        const reportable = observations
            .map((observation) => {
                const canonicalCode = canonicalCobasHpvCode(observation);
                if (!canonicalCode) return null;
                const status = normalizeValue(observation.resultStatus);
                if (status && !FINAL_STATUSES.has(status)) return null;
                const effectiveValue = cobasEffectiveValue(observation);
                if (!effectiveValue) return null;
                return { ...observation, canonicalCode, effectiveValue } as Hl7ReportableObservation;
            })
            .filter((row): row is Hl7ReportableObservation => !!row);

        if (!reportable.length) {
            return {
                profile: 'COBAS_6800_HPV',
                reportable: false,
                reason: 'Ignored COBAS HPV message: no patient HPV observation contains POS, NEG, or NA.',
                testCode,
                specimenRole,
                observations: [],
            };
        }

        return {
            profile: 'COBAS_6800_HPV',
            reportable: true,
            reason: `COBAS HPV result detected with ${reportable.length} reportable observation${reportable.length === 1 ? '' : 's'}.`,
            testCode,
            specimenRole,
            observations: reportable,
        };
    }

    // Preserve the established generic HL7 behavior for non-COBAS-HPV integrations.
    return {
        profile: 'GENERIC_HL7',
        reportable: true,
        reason: 'Generic HL7 message; existing normalizer rules apply.',
        testCode,
        specimenRole,
        observations: [],
    };
}
