import { BrowserWindow } from 'electron';

export const RUNTIME_EVENT_CHANNEL = 'machines:runtime:event';

export type RuntimeEvent =
    | {
        type: 'state';
        machineId: string;
        status: string;
        message?: string | null;
        updatedAt: string;
    }
    | {
        type: 'traffic';
        machineId: string;
        direction: 'inbound' | 'outbound' | 'system';
        payloadPreview: string;
        updatedAt: string;
    };

export class RuntimeEventBus {
    emit(event: RuntimeEvent) {
        for (const win of BrowserWindow.getAllWindows()) {
            win.webContents.send(RUNTIME_EVENT_CHANNEL, event);
        }
    }
}
