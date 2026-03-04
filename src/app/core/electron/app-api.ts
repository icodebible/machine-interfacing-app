import { AppAPI } from "../../../../electron/src/preload/api/types";

declare global {
    interface Window {
        appAPI: AppAPI;
    }
}

export { };