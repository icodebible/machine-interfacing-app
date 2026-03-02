"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMainWindow = createMainWindow;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../logging/logger");
function createMainWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#0b1220',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            preload: path_1.default.join(__dirname, '../../preload/preload.js'),
        },
    });
    // Prevent navigation to arbitrary URLs
    win.webContents.on('will-navigate', (event, url) => {
        const allowed = isDev ? url.startsWith('http://localhost:4200') : url.startsWith('file://');
        if (!allowed)
            event.preventDefault();
    });
    // Prevent new windows (popups)
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    const isDev = !electron_1.app.isPackaged;
    // Open DevTools only if explicitly enabled
    const devToolsEnabled = isDev && (process.env.ELECTRON_DEVTOOLS === '1' || process.argv.includes('--devtools'));
    if (isDev) {
        win.loadURL('http://localhost:4200');
        if (devToolsEnabled) {
            win.webContents.openDevTools({ mode: 'detach' });
        }
    }
    else {
        const indexHtml = path_1.default.join(electron_1.app.getAppPath(), 'dist', 'machine-interfacing-app', 'browser', 'index.html');
        logger_1.logger.info(`Loading: ${indexHtml}`);
        win.loadFile(indexHtml);
    }
    return win;
}
