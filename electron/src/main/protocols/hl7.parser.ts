import { MachineMessage, ParsedMessage, ProtocolParser } from './parser.interface';

export class HL7Parser implements ProtocolParser {
    parse(message: MachineMessage): ParsedMessage | null {
        const raw = message.raw?.trim();
        if (!raw) return null;

        const segments = raw.split(/\r?\n|\r/).filter(Boolean);
        const msh = segments.find((s) => s.startsWith('MSH'));
        if (!msh) return null;

        const fields = msh.split('|');

        const sendingApplication = fields[2] ?? null;
        const sendingFacility = fields[3] ?? null;
        const receivingApplication = fields[4] ?? null;
        const receivingFacility = fields[5] ?? null;
        const messageDateTime = fields[6] ?? null;
        const messageType = fields[8] ?? 'UNKNOWN';

        return {
            machineId: message.machineId,
            protocol: 'HL7',
            timestamp: message.timestamp,
            messageType,
            summary: `HL7 ${messageType} from ${sendingApplication ?? 'Unknown App'}`,
            data: {
                sendingApplication,
                sendingFacility,
                receivingApplication,
                receivingFacility,
                messageDateTime,
                segments,
            },
            raw: message.raw,
        };
    }
}
