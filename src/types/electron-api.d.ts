// export {};

// declare global {
//   interface Window {
//     appAPI: {
//       getAppVersion: () => Promise<string>;
//       ping: (msg: string) => Promise<string>;
//     };
//   }
// }

// import type { AppAPI } from '../../electron/src/preload/api/types';

import type { AppAPI } from "../../electron/src/preload/api/types";

export {};

declare global {
  interface Window {
    appAPI: AppAPI;
  }
}
