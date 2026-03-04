"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showAboutDialog = showAboutDialog;
const electron_1 = require("electron");
async function showAboutDialog() {
    const win = electron_1.BrowserWindow.getFocusedWindow() ?? undefined;
    const detail = [
        `Version: ${electron_1.app.getVersion()}`,
        `Platform: ${process.platform} (${process.arch})`,
        `Electron: ${process.versions.electron}`,
        `Chrome: ${process.versions.chrome}`,
        `Node: ${process.versions.node}`,
        '',
        'Machine Interfacing Desktop App',
        'University of Dar es Salaam (UDSM) | DHIS2 Lab',
    ].join('\n');
    const res = await electron_1.dialog.showMessageBox(win, {
        type: 'info',
        title: `About ${electron_1.app.name}`,
        message: electron_1.app.name,
        detail,
        buttons: ['OK', 'Copy info'],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
    });
    if (res.response === 1) {
        electron_1.clipboard.writeText(`${electron_1.app.name}\n${detail}`);
    }
}
