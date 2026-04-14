import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { MappingValueTranslationsService } from '../services/mapping-value-translations.service';

const svc = new MappingValueTranslationsService();

const safeHandle = (channel: string, handler: any) => {
  ipcMain.removeHandler(channel);
  ipcMain.handle(channel, handler);
};

export function registerMappingValueTranslationsIpc() {
  safeHandle(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_LIST, (_e: any, mappingRuleId: string) =>
    svc.listByRule(mappingRuleId),
  );

  safeHandle(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_CREATE, (_e: any, dto: any) =>
    svc.create(dto),
  );

  safeHandle(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_UPDATE, (_e: any, id: string, dto: any) =>
    svc.update(id, dto),
  );

  safeHandle(IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_DELETE, (_e: any, id: string) =>
    svc.delete(id),
  );

  safeHandle(
    IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_SAVE_CONFIG,
    (_e: any, mappingRuleId: string, dto: any) => svc.saveConfig(mappingRuleId, dto),
  );
}
