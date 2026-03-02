"use strict";
// import { Menu, app, dialog, shell, BrowserWindow } from 'electron';
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildAppMenu = buildAppMenu;
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
const electron_1 = require("electron");
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
        {
            label: 'File',
            submenu: [{ label: isMac ? 'Close' : 'Exit', role: isMac ? 'close' : 'quit' }],
        },
        {
            label: 'Help',
            submenu: [
                { label: 'About', click: () => (0, about_window_1.showAboutDialog)() },
                { type: 'separator' },
                {
                    label: 'Documentation',
                    click: async () => {
                        await electron_1.shell.openExternal('https://example.com'); // replace later
                    },
                },
            ],
        },
    ];
    electron_1.Menu.setApplicationMenu(electron_1.Menu.buildFromTemplate(template));
}
