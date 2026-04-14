// export type MachineMessage = {
//     machineId: string;
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     raw: string;
//     timestamp: string;
// };

// export type ParsedMessage = {
//     machineId: string;
//     protocol: 'ASTM' | 'HL7' | 'RAW';
//     timestamp: string;
//     type: string;
//     data: any;
// };

// export interface ProtocolParser {
//     parse(message: MachineMessage): ParsedMessage | null;
// }

// export type SupportedProtocol = 'ASTM' | 'HL7' | 'RAW';

// export type MachineMessage = {
//     machineId: string;
//     protocol: SupportedProtocol;
//     raw: string;
//     timestamp: string;
// };

// export type ParsedMessage = {
//     machineId: string;
//     protocol: SupportedProtocol;
//     timestamp: string;
//     messageType: string;
//     summary: string;
//     data: Record<string, any>;
//     raw: string;
// };

// export interface ProtocolParser {
//     parse(message: MachineMessage): ParsedMessage | null;
// }
export type SupportedProtocol = 'ASTM' | 'HL7' | 'RAW';

export type MachineMessage = {
    machineId: string;
    protocol: SupportedProtocol;
    raw: string;
    timestamp: string;
};

export type ParsedMessage = {
    machineId: string;
    protocol: SupportedProtocol;
    timestamp: string;
    messageType: string;
    summary: string;
    data: Record<string, any>;
    raw: string;
};

export interface ProtocolParser {
    parse(message: MachineMessage): ParsedMessage | null;
}
