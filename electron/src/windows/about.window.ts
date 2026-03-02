import { BrowserWindow, app } from 'electron';
import path from 'path';

export function openAboutWindow() {
    const win = new BrowserWindow({
        width: 420,
        height: 360,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: `About ${app.name}`,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });

    // simplest: load a local html shipped with app resources
    const aboutHtml = path.join(app.getAppPath(), 'electron', 'resources', 'about.html');
    win.loadFile(aboutHtml);

    return win;
}
