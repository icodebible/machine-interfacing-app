"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAppMenu = buildAppMenu;
const electron_1 = require("electron");
const electron_updater_1 = require("electron-updater");
const about_window_1 = require("../../windows/about.window");
function buildAppMenu() {
    const isMac = process.platform === 'darwin';
    const template = [
        ...(isMac
            ? [
                {
                    label: electron_1.app.name,
                    submenu: [
                        { label: 'About', click: () => (0, about_window_1.showAboutDialog)() },
                        { type: 'separator' },
                        { role: 'hide' },
                        { role: 'hideOthers' },
                        { role: 'unhide' },
                        { type: 'separator' },
                        { role: 'quit' },
                    ],
                },
            ]
            : []),
        // ✅ Standard desktop editing (big UX win)
        // {
        //     label: 'Edit',
        //     submenu: [
        //         { role: 'undo' },
        //         { role: 'redo' },
        //         { type: 'separator' },
        //         { role: 'cut' },
        //         { role: 'copy' },
        //         { role: 'paste' },
        //         { role: 'selectAll' },
        //     ],
        // },
        // ✅ View controls (devtools only in dev)
        // {
        //     label: 'View',
        //     submenu: app.isPackaged
        //         ? [{ role: 'reload' }, { role: 'togglefullscreen' }]
        //         : [
        //             { role: 'reload' },
        //             { role: 'forcereload' },
        //             { role: 'toggledevtools' },
        //             { role: 'togglefullscreen' },
        //         ],
        // },
        // {
        //     label: 'File',
        //     submenu: [{ label: isMac ? 'Close' : 'Exit', role: isMac ? 'close' : 'quit' }],
        // },
        {
            label: 'Help',
            submenu: [
                // On macOS, About is usually in the app menu only
                ...(isMac ? [] : [{ label: 'About', click: () => (0, about_window_1.showAboutDialog)() }]),
                ...(isMac ? [] : [{ type: 'separator' }]),
                // {
                //     label: 'Documentation',
                //     click: async () => {
                //         await shell.openExternal('https://github.com/<your-org>/<your-repo>');
                //     },
                // },
                { type: 'separator' },
                {
                    label: 'Check for updates…',
                    enabled: electron_1.app.isPackaged,
                    click: async () => {
                        await electron_updater_1.autoUpdater.checkForUpdatesAndNotify();
                    },
                },
            ],
        },
    ];
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
}
