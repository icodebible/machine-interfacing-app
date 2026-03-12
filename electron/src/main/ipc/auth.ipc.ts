// import { ipcMain } from 'electron';
// import { IPC_CHANNELS } from '../../shared/channels';
// import { AuthService } from '../auth/auth.service';
// import { logger } from '../../logging/logger';

// const auth = new AuthService();

// let authQueue: Promise<any> = Promise.resolve();

// function enqueue<T>(fn: () => Promise<T>) {
//   authQueue = authQueue.then(fn, fn);
//   return authQueue;
// }

// export function registerAuthIpc() {
//   ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, (_e, username: string, password: string) =>
//     enqueue(async () => {
//       try {
//         await auth.ensureBootstrapAdmin();
//         return await auth.login(username, password);
//       } catch (e) {
//         logger.error('[AUTH_LOGIN] failed', e);
//         throw e;
//       }
//     }),
//   );

//   ipcMain.handle(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, (_e, userId: string, newPassword: string) =>
//     enqueue(async () => {
//       try {
//         return await auth.changePassword(userId, newPassword);
//       } catch (e) {
//         logger.error('[AUTH_CHANGE_PASSWORD] failed', e);
//         throw e;
//       }
//     }),
//   );
// }

import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { AuthService } from '../auth/auth.service';
import { logger } from '../../logging/logger';

const auth = new AuthService();

let authQueue: Promise<any> = Promise.resolve();
function enqueue<T>(fn: () => Promise<T>) {
  authQueue = authQueue.then(fn, fn);
  return authQueue;
}

export function registerAuthIpc() {
  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, (_e, username: string, password: string) =>
    enqueue(async () => {
      try {
        await auth.ensureBootstrapAdmin();
        return await auth.login(username, password);
      } catch (e) {
        logger.error('[AUTH_LOGIN] failed', e);
        throw e;
      }
    }),
  );

  ipcMain.handle(IPC_CHANNELS.AUTH_CHANGE_PASSWORD, (_e, userId: string, newPassword: string) =>
    enqueue(async () => {
      try {
        return await auth.changePassword(userId, newPassword);
      } catch (e) {
        logger.error('[AUTH_CHANGE_PASSWORD] failed', e);
        throw e;
      }
    }),
  );

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGOUT, () =>
    enqueue(async () => {
      try {
        // If your AuthService has a logout() method, call it.
        // If it doesn’t, just return true (renderer clears session).
        const anyAuth = auth as any;
        if (typeof anyAuth.logout === 'function') await anyAuth.logout();
        return true;
      } catch (e) {
        logger.error('[AUTH_LOGOUT] failed', e);
        throw e;
      }
    }),
  );
}
