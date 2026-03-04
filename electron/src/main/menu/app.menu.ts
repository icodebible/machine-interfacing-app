import { Menu, app, shell } from 'electron';
import { autoUpdater } from 'electron-updater';
import { showAboutDialog } from '../../windows/about.window';

export function buildAppMenu() {
    const isMac = process.platform === 'darwin';

    const template: Electron.MenuItemConstructorOptions[] = [
        ...((isMac
            ? [
                {
                    label: app.name,
                    submenu: [
                        { label: 'About', click: () => showAboutDialog() },
                        { type: 'separator' },
                        { role: 'hide' },
                        { role: 'hideOthers' },
                        { role: 'unhide' },
                        { type: 'separator' },
                        { role: 'quit' },
                    ],
                },
            ]
            : []) as any),

        // ✅ Standard desktop editing (big UX win)
        {
            label: 'Edit',
            submenu: [
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { role: 'selectAll' },
            ],
        },

        // ✅ View controls (devtools only in dev)
        {
            label: 'View',
            submenu: app.isPackaged
                ? [{ role: 'reload' }, { role: 'togglefullscreen' }]
                : [
                    { role: 'reload' },
                    { role: 'forcereload' },
                    { role: 'toggledevtools' },
                    { role: 'togglefullscreen' },
                ],
        },

        {
            label: 'File',
            submenu: [{ label: isMac ? 'Close' : 'Exit', role: isMac ? 'close' : 'quit' }],
        },

        {
            label: 'Help',
            submenu: [
                // On macOS, About is usually in the app menu only
                ...(isMac ? [] : [{ label: 'About', click: () => showAboutDialog() }]),
                ...(isMac ? [] : [{ type: 'separator' }]),

                {
                    label: 'Documentation',
                    click: async () => {
                        await shell.openExternal('https://github.com/<your-org>/<your-repo>');
                    },
                },

                { type: 'separator' },

                {
                    label: 'Check for updates…',
                    enabled: app.isPackaged,
                    click: async () => {
                        await autoUpdater.checkForUpdatesAndNotify();
                    },
                },
            ],
        },
    ];

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
