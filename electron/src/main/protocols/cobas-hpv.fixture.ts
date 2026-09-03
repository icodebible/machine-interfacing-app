export const COBAS_HPV_SIMULATION_SAMPLE_ID = 'NPHL/26/0000058';

const inventorySegments = [
    'INV|HPV-GT|OK|MR|||||||||20261231030000||||M28647',
    'INV|Tip rack|OK|SC|||||||||20270831030000||||035',
    'INV|Processing plate|OK|SC|||||||||20260831030000||||065',
    'INV|Amplification plate|OK|SC|||||||||20270531030000||||032',
    'INV|Diluent|OK|DI|||||||||20270228030000||||N00932',
    'INV|Lysis reagent|OK|LI|||||||||20270228030000||||N00626',
    'INV|Wash reagent|OK|LI|||||||||20270131030000||||N00525',
    'INV|MGP cassette|OK|SC|||||||||20270131030000||||N00667',
];

const obx = (setId: number, code: string, result: string) =>
    `OBX|${setId}|ST|${code}^${code}^99ROC||ValueNotSet|||${result}|||F|||||DataManager-100340||C6800/8800^Roche^^~Unknown^Roche^^~ID_000000000012076380^IM300-001794^^|{{observedAt}}|||||||||10196_neg^^99ROC~10195_pos^^99ROC`;

const segments = [
    'MSH|^~\\&|COBAS6800/8800||LIS||{{messageDateTime}}||OUL^R22|{{messageControlId}}|P|2.5||||||ASCII|||LAB-23^ROCHE',
    'SPM||{{sampleId}}||RCCM^RocheCellCollectionMedia^99ROC|||||||P||||||||||||||||',
    'SAC|||||||||||||||||||||400|||uL^^UCUM',
    'OBR|1|||71432-9^HPV-GT^LN|||||||A',
    obx(1, 'Other HR HPV', '{{hrhpvResult}}'),
    'TCD|71432-9^HPV-GT^LN|^1^:^0',
    ...inventorySegments,
    obx(2, 'HPV 16', '{{hpv16Result}}'),
    'TCD|71432-9^HPV-GT^LN|^1^:^0',
    ...inventorySegments,
    obx(3, 'HPV 18', '{{hpv18Result}}'),
    'TCD|71432-9^HPV-GT^LN|^1^:^0',
    ...inventorySegments,
    'OBX|4|ST|71432-9^HPV-GT^LN|1/1|ValueNotSet|||NA|||F|||||DataManager-100340||C6800/8800^Roche^^~Unknown^Roche^^~ID_000000000012076380^IM300-001794^^|{{observedAt}}|||||||||10196_neg^^99ROC~10195_pos^^99ROC',
    'OBX|5|ST|71432-9^HPV-GT^LN|1/2|NA|||""|||F|||||DataManager-100340||C6800/8800^Roche^^~Unknown^Roche^^~ID_000000000012076380^IM300-001794^^|{{observedAt}}|||||||||10196_neg^^99ROC~10195_pos^^99ROC',
    'TCD|71432-9^HPV-GT^LN|^1^:^0',
];

/**
 * Captured-real COBAS 6800 HPV result structure used by simulation.
 * The only deliberate substitutions are runtime variables such as sample ID,
 * timestamps, and message-control ID. The segment order mirrors analyzer output.
 */
export const COBAS_HPV_ACTUAL_TEMPLATE = `\x0b${segments.join('\r')}\r\x1c\r`;

export function renderCobasHpvActualResult(input: {
    sampleId?: string | null;
    messageDateTime: string;
    observedAt?: string | null;
    messageControlId: string;
    hrhpvResult?: 'POS' | 'NEG' | 'NA' | string | null;
    hpv16Result?: 'POS' | 'NEG' | 'NA' | string | null;
    hpv18Result?: 'POS' | 'NEG' | 'NA' | string | null;
}) {
    const values: Record<string, string> = {
        sampleId: String(input.sampleId || COBAS_HPV_SIMULATION_SAMPLE_ID),
        messageDateTime: String(input.messageDateTime),
        observedAt: String(input.observedAt || input.messageDateTime),
        messageControlId: String(input.messageControlId),
        hrhpvResult: String(input.hrhpvResult || 'NEG').trim().toUpperCase(),
        hpv16Result: String(input.hpv16Result || 'NEG').trim().toUpperCase(),
        hpv18Result: String(input.hpv18Result || 'NEG').trim().toUpperCase(),
    };

    return COBAS_HPV_ACTUAL_TEMPLATE.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_match, key) => values[key] ?? '');
}
