"use strict";
// import { BrowserWindow, app } from 'electron';
// import path from 'path';
// import { logger } from '../logging/logger';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMainWindow = createMainWindow;
// export function createMainWindow() {
//     const win = new BrowserWindow({
//         width: 1200,
//         height: 800,
//         backgroundColor: '#0b1220',
//         webPreferences: {
//             contextIsolation: true,
//             nodeIntegration: false,
//             sandbox: false,
//             preload: path.join(app.getAppPath(), 'dist-electron', 'preload', 'preload.js'),
//         },
//     });
//     // Prevent navigation to arbitrary URLs
//     win.webContents.on('will-navigate', (event, url) => {
//         const allowed = isDev ? url.startsWith('http://localhost:4200') : url.startsWith('file://');
//         if (!allowed) event.preventDefault();
//     });
//     // Prevent new windows (popups)
//     win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
//     const isDev = !app.isPackaged;
//     // Open DevTools only if explicitly enabled
//     const devToolsEnabled =
//         isDev && (process.env.ELECTRON_DEVTOOLS === '1' || process.argv.includes('--devtools'));
//     if (isDev) {
//         win.loadURL('http://localhost:4200');
//         if (devToolsEnabled) {
//             win.webContents.openDevTools({ mode: 'detach' });
//         }
//     } else {
//         const indexHtml = path.join(
//             app.getAppPath(),
//             'dist',
//             'machine-interfacing-app',
//             'browser',
//             'index.html',
//         );
//         logger.info(`Loading: ${indexHtml}`);
//         win.loadFile(indexHtml);
//     }
//     return win;
// }
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const logger_1 = require("../logging/logger");
const LINUX_RUNTIME_SWITCHES = [
    '--no-sandbox',
    '--disable-gpu',
    '--disable-gpu-compositing',
    '--disable-gpu-rasterization',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu-sandbox',
    '--ozone-platform=x11',
];
const LINUX_RUNTIME_RELAUNCH_MARKER = '--mi-linux-runtime-flags-applied';
function hasArgSwitch(args, requiredSwitch) {
    const [requiredName] = requiredSwitch.split('=');
    return args.some((arg) => arg === requiredSwitch || arg === requiredName || arg.startsWith(`${requiredName}=`));
}
function ensureLinuxPackagedRuntimeFlagsBeforeWindow() {
    if (process.platform !== 'linux' || !electron_1.app.isPackaged) {
        return;
    }
    const args = process.argv.slice(1);
    const missingSwitches = LINUX_RUNTIME_SWITCHES.filter((requiredSwitch) => !hasArgSwitch(args, requiredSwitch));
    if (missingSwitches.length === 0) {
        return;
    }
    const alreadyRelaunched = args.includes(LINUX_RUNTIME_RELAUNCH_MARKER);
    if (alreadyRelaunched) {
        logger_1.logger.error(`Packaged Linux runtime flags are still missing after relaunch: ${missingSwitches.join(' ')}`);
        return;
    }
    const nextArgs = [
        ...args.filter((arg) => arg !== LINUX_RUNTIME_RELAUNCH_MARKER),
        ...missingSwitches,
        LINUX_RUNTIME_RELAUNCH_MARKER,
    ];
    logger_1.logger.warn(`Relaunching packaged Linux app with Chromium stability flags before BrowserWindow creation: ${missingSwitches.join(' ')}`);
    electron_1.app.relaunch({ args: nextArgs });
    electron_1.app.exit(0);
    process.exit(0);
}
function resolvePreloadPath() {
    return path_1.default.join(electron_1.app.getAppPath(), 'dist-electron', 'preload', 'preload.js');
}
function resolvePackagedIndexHtml() {
    return path_1.default.join(electron_1.app.getAppPath(), 'dist', 'machine-interfacing-app', 'browser', 'index.html');
}
function createMainWindow() {
    ensureLinuxPackagedRuntimeFlagsBeforeWindow();
    const isDev = !electron_1.app.isPackaged;
    const preload = resolvePreloadPath();
    logger_1.logger.info(`Creating BrowserWindow. packaged=${electron_1.app.isPackaged} platform=${process.platform}`);
    logger_1.logger.info(`Using preload: ${preload}`);
    const win = new electron_1.BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1024,
        minHeight: 680,
        backgroundColor: '#ffffff',
        show: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
            webSecurity: true,
            allowRunningInsecureContent: false,
            spellcheck: false,
            preload,
        },
    });
    win.once('ready-to-show', () => {
        logger_1.logger.info('Main window ready to show');
        win.show();
    });
    win.webContents.on('did-finish-load', () => {
        logger_1.logger.info('Main window renderer finished loading');
    });
    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl) => {
        logger_1.logger.error(`Main window failed to load ${validatedUrl}: ${errorCode} ${errorDescription}`);
    });
    win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        logger_1.logger.info(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    });
    win.webContents.on('preload-error', (_event, preloadPath, error) => {
        logger_1.logger.error(`Preload failed: ${preloadPath}`, error);
    });
    // Prevent navigation to arbitrary URLs.
    win.webContents.on('will-navigate', (event, url) => {
        const allowed = isDev ? url.startsWith('http://localhost:4200') : url.startsWith('file://');
        if (!allowed) {
            logger_1.logger.warn(`Blocked renderer navigation to: ${url}`);
            event.preventDefault();
        }
    });
    // Prevent new windows/popups.
    win.webContents.setWindowOpenHandler(({ url }) => {
        logger_1.logger.warn(`Blocked renderer popup/new-window request to: ${url}`);
        return { action: 'deny' };
    });
    const devToolsEnabled = process.env.ELECTRON_DEVTOOLS === '1' || process.argv.includes('--devtools');
    if (isDev) {
        logger_1.logger.info('Loading development renderer: http://localhost:4200');
        win.loadURL('http://localhost:4200');
    }
    else {
        const indexHtml = resolvePackagedIndexHtml();
        logger_1.logger.info(`Loading packaged renderer: ${indexHtml}`);
        win.loadFile(indexHtml);
    }
    if (devToolsEnabled) {
        win.webContents.openDevTools({ mode: 'detach' });
    }
    return win;
}
