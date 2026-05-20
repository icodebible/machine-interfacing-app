import { Injectable, signal } from '@angular/core';

type MachineMessage = {
    timestamp: string;
    // direction: 'in' | 'out';
    direction: 'in' | 'out' | 'system';
    payload: string;
};

@Injectable({ providedIn: 'root' })
export class ElectronBridgeService {
    readonly isElectron = signal<boolean>(typeof window !== 'undefined' && !!window.appAPI);

    // One shared stream of machine messages for the UI
    readonly messages = signal<MachineMessage[]>([]);

    private unsubscribeMachine?: () => void;

    initMachineListener() {
        if (!this.isElectron()) return;

        // Avoid double-registering on hot reload / navigation
        if (this.unsubscribeMachine) return;

        this.unsubscribeMachine = window.appAPI.onMachineMessage((msg: MachineMessage) => {
            this.messages.update((prev) => [msg, ...prev].slice(0, 500)); // keep last 500
        });
    }

    disposeMachineListener() {
        try {
            this.unsubscribeMachine?.();
        } finally {
            this.unsubscribeMachine = undefined;
        }
    }

    // --- TCP ---
    tcpConnect(host: string, port: number) {
        if (!this.isElectron()) throw new Error('Not running in Electron');
        return window.appAPI.tcpConnect(host, port);
    }

    tcpSend(payload: string) {
        if (!this.isElectron()) throw new Error('Not running in Electron');
        return window.appAPI.tcpSend(payload);
    }

    tcpDisconnect() {
        if (!this.isElectron()) throw new Error('Not running in Electron');
        return window.appAPI.tcpDisconnect();
    }

    // --- Serial ---
    serialList() {
        if (!this.isElectron()) throw new Error('Not running in Electron');
        return window.appAPI.serialList();
    }

    serialConnect(path: string, baudRate: number) {
        if (!this.isElectron()) throw new Error('Not running in Electron');
        return window.appAPI.serialConnect(path, baudRate);
    }

    serialSend(payload: string) {
        if (!this.isElectron()) throw new Error('Not running in Electron');
        return window.appAPI.serialSend(payload);
    }

    serialDisconnect() {
        if (!this.isElectron()) throw new Error('Not running in Electron');
        return window.appAPI.serialDisconnect();
    }

    clearMessages() {
        this.messages.set([]);
    }
}
