import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { AuthService } from '../auth/auth.service';
import { logger } from '../../logging/logger';

const auth = new AuthService();

export function registerAuthIpc() {
  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, async (_e, username: string, password: string) => {
    // await auth.ensureBootstrapAdmin();
    try {
      await auth.ensureBootstrapAdmin();
    } catch (e) {
      logger.error('[BOOTSTRAP]: App Bootstrap Failed', e);
      throw e;
    }
    return auth.login(username, password);
  });

  ipcMain.handle(
    IPC_CHANNELS.AUTH_CHANGE_PASSWORD,
    async (_e, userId: string, newPassword: string) => {
      return auth.changePassword(userId, newPassword);
    },
  );
}
