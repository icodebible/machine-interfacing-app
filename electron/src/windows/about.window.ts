// import { BrowserWindow, app } from 'electron';
import path from 'path';

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

import { app, BrowserWindow, dialog } from 'electron';

export function showAboutDialog() {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;

    dialog.showMessageBox(win as any, {
        type: 'info',
        title: `About ${app.name}`,
        message: `${app.name}`,
        detail: [
            `Version: ${app.getVersion()}`,
            '',
            'Machine Interfacing Desktop App',
            'University of Dar es Salaam (UDSM) | DHIS2 Lab',
        ].join('\n'),
        buttons: ['OK'],
    });
}
