// import { Menu, app, dialog, shell, BrowserWindow } from 'electron';

// export function buildAppMenu() {
//   const isMac = process.platform === 'darwin';

//   const template: Electron.MenuItemConstructorOptions[] = [
//     ...(isMac
//       ? [
//           {
//             label: app.name,
//             submenu: [
//               { role: 'about' },
//               { type: 'separator' },
//               { role: 'services' },
//               { type: 'separator' },
//               { role: 'hide' },
//               { role: 'hideOthers' },
//               { role: 'unhide' },
//               { type: 'separator' },
//               { role: 'quit' },
//             ],
//           },
//         ]
//       : []),

//     {
//       label: 'File',
//       submenu: [
//         {
//           label: 'Close',
//           role: isMac ? 'close' : 'quit',
//         },
//       ],
//     },

//     {
//       label: 'Help',
//       submenu: [
//         {
//           label: 'About',
//           click: () => showAboutDialog(),
//         },
//         { type: 'separator' },
//         {
//           label: 'Documentation',
//           click: async () => {
//             // replace with your docs page later
//             await shell.openExternal('https://example.com');
//           },
//         },
//       ],
//     },
//   ];

//   const menu = Menu.buildFromTemplate(template);
//   Menu.setApplicationMenu(menu);
// }

// export function showAboutDialog() {
//   const win = BrowserWindow.getFocusedWindow();
//   dialog.showMessageBox(win ?? undefined, {
//     type: 'info',
//     title: `About ${app.name}`,
//     message: app.name,
//     detail: `Version: ${app.getVersion()}\n\nMachine Interfacing Desktop App\nUniversity of Dar es Salaam (UDSM)`,
//     buttons: ['OK'],
//   });
// }

import { Menu, app, shell } from 'electron';
import { showAboutDialog } from '../../windows/about.window';

export function buildAppMenu() {
    const isMac = process.platform === 'darwin';

    const template: Electron.MenuItemConstructorOptions[] = [
        ...(isMac
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
            : []),

        {
            label: 'File',
            submenu: [{ label: isMac ? 'Close' : 'Exit', role: isMac ? 'close' : 'quit' }],
        },

        {
            label: 'Help',
            submenu: [
                { label: 'About', click: () => showAboutDialog() },
                { type: 'separator' },
                {
                    label: 'Documentation',
                    click: async () => {
                        await shell.openExternal('https://example.com'); // replace later
                    },
                },
            ],
        },
    ] as any;

    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
