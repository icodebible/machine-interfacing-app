-- Optional seed for testing the configurable OpenMRS LIS HPV mapping flow.
-- Update UUID values from your live LIS metadata when sample allocations or coded answers differ.
-- This seed uses the example metadata shared for NPHL/22/0000099.

INSERT OR REPLACE INTO target_mappings (
  id, target_type, source_field, destination_field, transform_kind, constant_value,
  enabled, created_at, updated_at, value_mapping_enabled, unmapped_behavior, default_destination_value
) VALUES
('lis-endpoint', 'LIS', 'meta.sourceDocumentVersion', 'lis.endpoint', 'constant', '/openmrs/ws/rest/v1/lab/multipleresults', 1, datetime('now'), datetime('now'), 0, 'PASSTHROUGH', NULL),
('lis-instrument', 'LIS', 'source.machineId', 'lis.defaults.instrumentUuid', 'constant', 'd1217680-41ab-4e5e-bf50-10d780006cf4', 1, datetime('now'), datetime('now'), 0, 'PASSTHROUGH', NULL),
('lis-tested-by', 'LIS', 'source.machineId', 'lis.defaults.testedBy', 'constant', '2b54ca73-3e07-487f-a935-d5dfea854f92', 1, datetime('now'), datetime('now'), 0, 'PASSTHROUGH', NULL),
('lis-status-category', 'LIS', 'source.messageType', 'lis.defaults.status.category', 'constant', 'RESULT_REMARKS', 1, datetime('now'), datetime('now'), 0, 'PASSTHROUGH', NULL),
('lis-status-status', 'LIS', 'source.messageType', 'lis.defaults.status.status', 'constant', 'REMARKS', 1, datetime('now'), datetime('now'), 0, 'PASSTHROUGH', NULL),
('lis-status-remarks', 'LIS', 'source.messageType', 'lis.defaults.status.remarks', 'constant', 'Imported from COBAS 6800 through machine interfacing simulation', 1, datetime('now'), datetime('now'), 0, 'PASSTHROUGH', NULL),
('lis-hpv-concepts', 'LIS', 'result.observations[].code', 'lis.parameter.conceptUuid', 'lookup', NULL, 1, datetime('now'), datetime('now'), 1, 'ERROR', NULL),
('lis-hpv-allocations', 'LIS', 'result.observations[].code', 'lis.parameter.allocationUuid', 'lookup', NULL, 1, datetime('now'), datetime('now'), 1, 'ERROR', NULL),
('lis-hpv-datatypes', 'LIS', 'result.observations[].code', 'lis.parameter.datatype', 'lookup', NULL, 1, datetime('now'), datetime('now'), 1, 'ERROR', NULL),
('lis-hpv-coded-values', 'LIS', 'result.observations[].value', 'lis.valueCoded.uuid', 'lookup', NULL, 1, datetime('now'), datetime('now'), 1, 'ERROR', NULL);

INSERT OR REPLACE INTO target_mapping_value_translations (
  id, mapping_rule_id, source_value, destination_value, enabled, note, created_at, updated_at
) VALUES
('lis-hpv-concept-hpv16', 'lis-hpv-concepts', 'HPV16', 'b82c8c16-842b-4450-ad78-659e224500d4', 1, 'HPV16 concept UUID', datetime('now'), datetime('now')),
('lis-hpv-concept-hpv18', 'lis-hpv-concepts', 'HPV18', 'dd9881f8-bb87-4ce1-b8b2-3144f47f3e81', 1, 'HPV18 concept UUID', datetime('now'), datetime('now')),
('lis-hpv-concept-hrhpv', 'lis-hpv-concepts', 'HRHPV', '733bfe2b-aeee-4a83-b762-eaf175135491', 1, 'Hr-HPV concept UUID', datetime('now'), datetime('now')),

('lis-hpv-allocation-hpv16', 'lis-hpv-allocations', 'HPV16', '1b76a53a-e874-4ccf-ae47-69668a648b2f', 1, 'Allocation from allocationsbysample for HPV16', datetime('now'), datetime('now')),
('lis-hpv-allocation-hpv18', 'lis-hpv-allocations', 'HPV18', '30eaca8a-8638-4aa9-9cbd-965bdc816414', 1, 'Allocation from allocationsbysample for HPV18', datetime('now'), datetime('now')),
('lis-hpv-allocation-hrhpv', 'lis-hpv-allocations', 'HRHPV', 'e512c08a-104a-4ef9-96cb-000d1883d30a', 1, 'Allocation from allocationsbysample for Hr-HPV', datetime('now'), datetime('now')),

('lis-hpv-datatype-hpv16', 'lis-hpv-datatypes', 'HPV16', 'coded', 1, 'Coded OpenMRS concept', datetime('now'), datetime('now')),
('lis-hpv-datatype-hpv18', 'lis-hpv-datatypes', 'HPV18', 'coded', 1, 'Coded OpenMRS concept', datetime('now'), datetime('now')),
('lis-hpv-datatype-hrhpv', 'lis-hpv-datatypes', 'HRHPV', 'coded', 1, 'Coded OpenMRS concept', datetime('now'), datetime('now')),

('lis-hpv-value-hpv16-pos', 'lis-hpv-coded-values', 'HPV16=POS', '661d5907-1baf-4ac9-9db6-a3c4a3f09459', 1, 'HPV16 Positive', datetime('now'), datetime('now')),
('lis-hpv-value-hpv18-neg', 'lis-hpv-coded-values', 'HPV18=NEG', 'ba78d08f-0fe3-4634-80a3-8d0a13bc1ddd', 1, 'HPV18 Negative', datetime('now'), datetime('now')),
('lis-hpv-value-hrhpv-invalid', 'lis-hpv-coded-values', 'HRHPV=INVALID', '58179ed1-68d8-4fc0-ab09-1baba1bc054b', 1, 'Hr-HPV Invalid', datetime('now'), datetime('now')),
('lis-hpv-value-pos', 'lis-hpv-coded-values', 'POS', '661d5907-1baf-4ac9-9db6-a3c4a3f09459', 1, 'Generic positive fallback', datetime('now'), datetime('now')),
('lis-hpv-value-neg', 'lis-hpv-coded-values', 'NEG', 'ba78d08f-0fe3-4634-80a3-8d0a13bc1ddd', 1, 'Generic negative fallback', datetime('now'), datetime('now')),
('lis-hpv-value-invalid', 'lis-hpv-coded-values', 'INVALID', '58179ed1-68d8-4fc0-ab09-1baba1bc054b', 1, 'Generic invalid fallback', datetime('now'), datetime('now'));
