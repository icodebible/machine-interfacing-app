"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMappingValueTranslationsIpc = registerMappingValueTranslationsIpc;
const electron_1 = require("electron");
const channels_1 = require("../../shared/channels");
const mapping_value_translations_service_1 = require("../services/mapping-value-translations.service");
const svc = new mapping_value_translations_service_1.MappingValueTranslationsService();
const safeHandle = (channel, handler) => {
    electron_1.ipcMain.removeHandler(channel);
    electron_1.ipcMain.handle(channel, handler);
};
function registerMappingValueTranslationsIpc() {
    safeHandle(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_LIST, (_e, mappingRuleId) => svc.listByRule(mappingRuleId));
    safeHandle(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_CREATE, (_e, dto) => svc.create(dto));
    safeHandle(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_UPDATE, (_e, id, dto) => svc.update(id, dto));
    safeHandle(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_DELETE, (_e, id) => svc.delete(id));
    safeHandle(channels_1.IPC_CHANNELS.MAPPING_VALUE_TRANSLATIONS_SAVE_CONFIG, (_e, mappingRuleId, dto) => svc.saveConfig(mappingRuleId, dto));
}
