"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RuntimeEventBus = exports.RUNTIME_EVENT_CHANNEL = void 0;
const electron_1 = require("electron");
exports.RUNTIME_EVENT_CHANNEL = 'machines:runtime:event';
class RuntimeEventBus {
    emit(event) {
        for (const win of electron_1.BrowserWindow.getAllWindows()) {
            win.webContents.send(exports.RUNTIME_EVENT_CHANNEL, event);
        }
    }
}
exports.RuntimeEventBus = RuntimeEventBus;
