"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showAboutDialog = showAboutDialog;
// export function openAboutWindow() {
//     const win = new BrowserWindow({
//         width: 420,
//         height: 360,
//         resizable: false,
//         minimizable: false,
//         maximizable: false,
//         title: `About ${app.name}`,
//         webPreferences: {
//             contextIsolation: true,
//             nodeIntegration: false,
//             sandbox: true,
//         },
//     });
//     // simplest: load a local html shipped with app resources
//     const aboutHtml = path.join(app.getAppPath(), 'electron', 'resources', 'about.html');
//     win.loadFile(aboutHtml);
//     return win;
// }
const electron_1 = require("electron");
function showAboutDialog() {
    const win = electron_1.BrowserWindow.getFocusedWindow() ?? undefined;
    electron_1.dialog.showMessageBox(win, {
        type: 'info',
        title: `About ${electron_1.app.name}`,
        message: `${electron_1.app.name}`,
        detail: [
            `Version: ${electron_1.app.getVersion()}`,
            '',
            'Machine Interfacing Desktop App',
            'University of Dar es Salaam (UDSM) | DHIS2 Lab',
        ].join('\n'),
        buttons: ['OK'],
    });
}
