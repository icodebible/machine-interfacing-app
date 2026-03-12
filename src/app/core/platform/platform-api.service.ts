import { Injectable } from '@angular/core';
import { AppAPI } from '../../../../electron/src/preload/api/types';

declare global {
    interface Window {
        appAPI: AppAPI;
        platform: {
            copyToClipboard: (text: string) => Promise<void>;
        };
    }
}

@Injectable({ providedIn: 'root' })
export class PlatformApiService {
    get api() {
        if (!window.appAPI) throw new Error('window.appAPI not available (preload not loaded)');
        return window.appAPI;
    }

    // ✅ Clipboard helper
    copy(text: string) {
        return window.platform.copyToClipboard(text);
    }

    // Labs
    labsList() {
        return this.api.labsList();
    }
    labsCreate(dto: any) {
        return this.api.labsCreate(dto);
    }
    labsUpdate(id: string, dto: any) {
        return this.api.labsUpdate(id, dto);
    }
    labsDelete(id: string) {
        return this.api.labsDelete(id);
    }

    // Machines
    machinesList() {
        return this.api.machinesList();
    }
    machinesCreate(dto: any) {
        return this.api.machinesCreate(dto);
    }
    machinesUpdate(id: string, dto: any) {
        return this.api.machinesUpdate(id, dto);
    }
    machinesDelete(id: string) {
        return this.api.machinesDelete(id);
    }
    machinesConnect(id: string) {
        return this.api.machinesConnect(id);
    }
    machinesDisconnect(id: string) {
        return this.api.machinesDisconnect(id);
    }

    machinesTest(machine: any) {
        return this.api.machinesTest(machine);
    }

    // Targets
    targetsList() {
        return this.api.targetsList();
    }
    targetsCreate(dto: any) {
        return this.api.targetsCreate(dto);
    }
    targetsUpdate(id: string, dto: any) {
        return this.api.targetsUpdate(id, dto);
    }
    targetsDelete(id: string) {
        return this.api.targetsDelete(id);
    }
    targetsTest(id: string) {
        return this.api.targetsTest(id);
    }

    // Logs
    logsQuery(q: any) {
        return this.api.logsQuery(q);
    }
}
