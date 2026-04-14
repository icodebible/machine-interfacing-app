export type TargetType = 'DHIS2' | 'OPENMRS' | 'LIS' | 'CUSTOM_HTTP';

export type NormalizedResultRecord = {
    id: string;
    machine_id: string;
    protocol: 'ASTM' | 'HL7' | 'RAW';
    sample_id?: string | null;
    patient_id?: string | null;
    patient_name?: string | null;
    order_id?: string | null;
    test_code?: string | null;
    test_name?: string | null;
    value?: string | null;
    units?: string | null;
    reference_range?: string | null;
    abnormal_flag?: string | null;
    observed_at?: string | null;
    source_message_type?: string | null;
    summary?: string | null;
    data_json: string;
    created_at: string;
};

export type TargetRecord = {
    id: string;
    type: TargetType;
    name: string;
    base_url: string;
    enabled: number;
};

export type TransformPreviewSummary = {
    ruleCount: number;
    appliedCount: number;
    skippedCount: number;
    translatedCount: number;
};

export type TransformPreviewResult = {
    targetId: string;
    targetType: TargetType;
    normalizedResultId: string;
    previewName: string;
    payload: Record<string, any>;
    sourceDocument?: Record<string, any>;
    warnings?: string[];
    errors?: string[];
    summary?: TransformPreviewSummary;
    payloadSource?: 'stored_queue' | 'stored_delivery' | 'regenerated';
};

export interface TargetTransformer {
    buildPreview(target: TargetRecord, result: NormalizedResultRecord): TransformPreviewResult;
}
