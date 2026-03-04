import { BrowserWindow, app } from 'electron';
import path from 'path';
import { logger } from '../logging/logger';

export function createMainWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#0b1220',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            // preload: path.join(__dirname, '../../preload/preload.js'),
            // preload: path.join(__dirname, '../preload/preload.ts'),
            preload: path.join(app.getAppPath(), 'dist-electron', 'preload', 'preload.js'),
        },
    });

    // Prevent navigation to arbitrary URLs
    win.webContents.on('will-navigate', (event, url) => {
        const allowed = isDev ? url.startsWith('http://localhost:4200') : url.startsWith('file://');
        if (!allowed) event.preventDefault();
    });

    // Prevent new windows (popups)
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

    const isDev = !app.isPackaged;

    // Open DevTools only if explicitly enabled
    const devToolsEnabled =
        isDev && (process.env.ELECTRON_DEVTOOLS === '1' || process.argv.includes('--devtools'));

    if (isDev) {
        win.loadURL('http://localhost:4200');

        if (devToolsEnabled) {
            win.webContents.openDevTools({ mode: 'detach' });
        }
    } else {
        const indexHtml = path.join(
            app.getAppPath(),
            'dist',
            'machine-interfacing-app',
            'browser',
            'index.html',
        );

        logger.info(`Loading: ${indexHtml}`);
        win.loadFile(indexHtml);
    }

    return win;
}
