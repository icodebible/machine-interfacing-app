// import { ipcMain } from 'electron';

// import { IPC_CHANNELS } from '../../shared/channels';
// import { RoutingRuleService } from '../services/routing-rule.service';

// const svc = new RoutingRuleService();

// const safeHandle = (channel: string, handler: any) => {
//   ipcMain.removeHandler(channel);
//   ipcMain.handle(channel, handler);
// };

// export function registerRoutingRulesIpc() {
//   safeHandle(IPC_CHANNELS.ROUTING_RULES_LIST, () => svc.list());
//   safeHandle(IPC_CHANNELS.ROUTING_RULES_CREATE, (_event: any, payload: any) => svc.create(payload));
//   safeHandle(IPC_CHANNELS.ROUTING_RULES_UPDATE, (_event: any, id: string, payload: any) =>
//     svc.update(id, payload),
//   );
//   safeHandle(IPC_CHANNELS.ROUTING_RULES_DELETE, (_event: any, id: string) => svc.remove(id));
//   safeHandle(
//     IPC_CHANNELS.ROUTING_RULES_PREVIEW_RESULT,
//     (_event: any, normalizedResultId: string, fallbackTargetIds?: string[]) =>
//       svc.previewForResult(normalizedResultId, fallbackTargetIds ?? []),
//   );
// }


import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/channels';
import { RoutingRuleService } from '../services/routing-rule.service';

const service = new RoutingRuleService();

const safeHandle = (channel: string, handler: any) => {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
};

export function registerRoutingRulesIpc() {
    safeHandle(IPC_CHANNELS.ROUTING_RULES_LIST, () => service.list());
    safeHandle(IPC_CHANNELS.ROUTING_RULES_CREATE, (_event: any, payload: any) => service.create(payload));
    safeHandle(IPC_CHANNELS.ROUTING_RULES_UPDATE, (_event: any, id: string, patch: any) => service.update(id, patch));
    safeHandle(IPC_CHANNELS.ROUTING_RULES_DELETE, (_event: any, id: string) => service.delete(id));
    safeHandle(
        IPC_CHANNELS.ROUTING_RULES_PREVIEW_RESULT,
        (_event: any, normalizedResultId: string, fallbackTargetIds?: string[]) =>
            service.previewForResult(normalizedResultId, fallbackTargetIds ?? []),
    );
}
