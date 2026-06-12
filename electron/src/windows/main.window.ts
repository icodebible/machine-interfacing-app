// import { BrowserWindow, app } from 'electron';
// import path from 'path';
// import { logger } from '../logging/logger';

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


import { BrowserWindow, app } from 'electron';
import path from 'path';
import { logger } from '../logging/logger';

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

function hasArgSwitch(args: string[], requiredSwitch: string): boolean {
    const [requiredName] = requiredSwitch.split('=');

    return args.some((arg) => arg === requiredSwitch || arg === requiredName || arg.startsWith(`${requiredName}=`));
}

function ensureLinuxPackagedRuntimeFlagsBeforeWindow(): void {
    if (process.platform !== 'linux' || !app.isPackaged) {
        return;
    }

    const args = process.argv.slice(1);
    const missingSwitches = LINUX_RUNTIME_SWITCHES.filter((requiredSwitch) => !hasArgSwitch(args, requiredSwitch));

    if (missingSwitches.length === 0) {
        return;
    }

    const alreadyRelaunched = args.includes(LINUX_RUNTIME_RELAUNCH_MARKER);

    if (alreadyRelaunched) {
        logger.error(
            `Packaged Linux runtime flags are still missing after relaunch: ${missingSwitches.join(' ')}`,
        );
        return;
    }

    const nextArgs = [
        ...args.filter((arg) => arg !== LINUX_RUNTIME_RELAUNCH_MARKER),
        ...missingSwitches,
        LINUX_RUNTIME_RELAUNCH_MARKER,
    ];

    logger.warn(
        `Relaunching packaged Linux app with Chromium stability flags before BrowserWindow creation: ${missingSwitches.join(' ')}`,
    );

    app.relaunch({ args: nextArgs });
    app.exit(0);
    process.exit(0);
}

function resolvePreloadPath(): string {
    return path.join(app.getAppPath(), 'dist-electron', 'preload', 'preload.js');
}

function resolvePackagedIndexHtml(): string {
    return path.join(
        app.getAppPath(),
        'dist',
        'machine-interfacing-app',
        'browser',
        'index.html',
    );
}

export function createMainWindow() {
    ensureLinuxPackagedRuntimeFlagsBeforeWindow();

    const isDev = !app.isPackaged;
    const preload = resolvePreloadPath();

    logger.info(`Creating BrowserWindow. packaged=${app.isPackaged} platform=${process.platform}`);
    logger.info(`Using preload: ${preload}`);

    const win = new BrowserWindow({
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
        logger.info('Main window ready to show');
        win.show();
    });

    win.webContents.on('did-finish-load', () => {
        logger.info('Main window renderer finished loading');
    });

    win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedUrl) => {
        logger.error(`Main window failed to load ${validatedUrl}: ${errorCode} ${errorDescription}`);
    });

    win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
        logger.info(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    });

    win.webContents.on('preload-error', (_event, preloadPath, error) => {
        logger.error(`Preload failed: ${preloadPath}`, error);
    });

    // Prevent navigation to arbitrary URLs.
    win.webContents.on('will-navigate', (event, url) => {
        const allowed = isDev ? url.startsWith('http://localhost:4200') : url.startsWith('file://');
        if (!allowed) {
            logger.warn(`Blocked renderer navigation to: ${url}`);
            event.preventDefault();
        }
    });

    // Prevent new windows/popups.
    win.webContents.setWindowOpenHandler(({ url }) => {
        logger.warn(`Blocked renderer popup/new-window request to: ${url}`);
        return { action: 'deny' };
    });

    const devToolsEnabled =
        process.env.ELECTRON_DEVTOOLS === '1' || process.argv.includes('--devtools');

    if (isDev) {
        logger.info('Loading development renderer: http://localhost:4200');
        win.loadURL('http://localhost:4200');
    } else {
        const indexHtml = resolvePackagedIndexHtml();
        logger.info(`Loading packaged renderer: ${indexHtml}`);
        win.loadFile(indexHtml);
    }

    if (devToolsEnabled) {
        win.webContents.openDevTools({ mode: 'detach' });
    }

    return win;
}
