"use strict";
// import { MachineMessage, ParsedMessage, ProtocolParser } from './parser.interface';
Object.defineProperty(exports, "__esModule", { value: true });
exports.HL7Parser = void 0;
const cleanHl7Envelope = (raw) => String(raw ?? '')
    .replace(/^\x0b/, '')
    .replace(/\x1c\r?$/g, '')
    .trim();
const component = (value) => {
    const parts = String(value ?? '').split('^');
    return {
        identifier: parts[0] || null,
        text: parts[1] || null,
        codingSystem: parts[2] || null,
    };
};
const field = (fields, index) => fields[index] ?? null;
const splitSegments = (raw) => {
    const normalized = raw
        .replace(/\\r/g, '\r')
        .replace(/\\n/g, '\n')
        .replace(/\\(?=(MSH|PID|PV1|ORC|OBR|OBX|SPM|TQ1|NTE)\|)/g, '\r');
    return normalized
        .split(/\r?\n|\r/)
        .map((segment) => segment.trim())
        .filter(Boolean);
};
class HL7Parser {
    parse(message) {
        const raw = cleanHl7Envelope(message.raw ?? '');
        if (!raw)
            return null;
        const segments = splitSegments(raw);
        const msh = segments.find((s) => s.startsWith('MSH|'));
        if (!msh)
            return null;
        const mshFields = msh.split('|');
        const pidFields = segments.find((s) => s.startsWith('PID|'))?.split('|') ?? [];
        const spmFields = segments.find((s) => s.startsWith('SPM|'))?.split('|') ?? [];
        const orcFields = segments.find((s) => s.startsWith('ORC|'))?.split('|') ?? [];
        const obrFields = segments.find((s) => s.startsWith('OBR|'))?.split('|') ?? [];
        const sendingApplication = field(mshFields, 2);
        const sendingFacility = field(mshFields, 3);
        const receivingApplication = field(mshFields, 4);
        const receivingFacility = field(mshFields, 5);
        const messageDateTime = field(mshFields, 6);
        const messageType = field(mshFields, 8) ?? 'UNKNOWN';
        const messageControlId = field(mshFields, 9);
        const specimen = component(field(spmFields, 2));
        const placerOrder = component(field(orcFields, 2) ?? field(obrFields, 2));
        const fillerOrder = component(field(orcFields, 3) ?? field(obrFields, 3));
        const universalService = component(field(obrFields, 4));
        const observations = segments
            .filter((s) => s.startsWith('OBX|'))
            .map((segment) => {
            const fields = segment.split('|');
            const code = component(field(fields, 3));
            const value = component(field(fields, 5));
            const equipmentRaw = field(fields, 18);
            const equipment = String(equipmentRaw ?? '')
                .split('~')
                .filter(Boolean)
                .map((item) => component(item));
            return {
                setId: field(fields, 1),
                valueType: field(fields, 2),
                code: code.identifier,
                name: code.text ?? code.identifier,
                codingSystem: code.codingSystem,
                rawValue: field(fields, 5),
                value: value.identifier ?? field(fields, 5),
                valueText: value.text,
                valueCodingSystem: value.codingSystem,
                units: field(fields, 6),
                referenceRange: field(fields, 7),
                abnormalFlag: field(fields, 8),
                resultStatus: field(fields, 11),
                responsibleObserver: field(fields, 16),
                instrumentRaw: equipmentRaw,
                equipment,
                observedAt: field(fields, 19) ?? messageDateTime,
                segment,
            };
        });
        const patientName = field(pidFields, 5)?.replace(/\^/g, ' ').replace(/\s+/g, ' ').trim();
        return {
            machineId: message.machineId,
            protocol: 'HL7',
            timestamp: message.timestamp,
            messageType,
            summary: `HL7 ${messageType} from ${sendingApplication ?? 'Unknown App'}${specimen.identifier ? ` · ${specimen.identifier}` : ''}`,
            data: {
                sendingApplication,
                sendingFacility,
                receivingApplication,
                receivingFacility,
                messageDateTime,
                messageControlId,
                patient: {
                    id: component(field(pidFields, 3)).identifier ?? field(pidFields, 3),
                    name: patientName || null,
                    sex: field(pidFields, 8),
                    birthDate: field(pidFields, 7),
                },
                specimen: {
                    id: specimen.identifier,
                    text: specimen.text,
                    raw: field(spmFields, 2),
                    type: component(field(spmFields, 4)),
                    collectedAt: field(spmFields, 17) ?? field(spmFields, 26),
                },
                order: {
                    placerOrderNumber: placerOrder.identifier,
                    fillerOrderNumber: fillerOrder.identifier,
                    testCode: universalService.identifier,
                    testName: universalService.text ?? universalService.identifier,
                    codingSystem: universalService.codingSystem,
                    status: field(obrFields, 25),
                },
                observations,
                segments,
            },
            raw: message.raw,
        };
    }
}
exports.HL7Parser = HL7Parser;
