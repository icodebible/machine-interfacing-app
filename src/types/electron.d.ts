import type { AppAPI } from '../../electron/src/preload/api/types'; // adjust if needed

// ../../electron/src/preload/api/types

declare global {
    interface Window {
        appAPI: AppAPI;
    }
}

export { };