import { app, BrowserWindow, dialog, clipboard } from 'electron';

export async function showAboutDialog() {
    const win = BrowserWindow.getFocusedWindow() ?? undefined;

    const detail = [
        `Version: ${app.getVersion()}`,
        `Platform: ${process.platform} (${process.arch})`,
        `Electron: ${process.versions.electron}`,
        `Chrome: ${process.versions.chrome}`,
        `Node: ${process.versions.node}`,
        '',
        'Machine Interfacing Desktop App',
        'University of Dar es Salaam (UDSM) | DHIS2 Lab',
    ].join('\n');

    const res = await dialog.showMessageBox(win as any, {
        type: 'info',
        title: `About ${app.name}`,
        message: app.name,
        detail,
        buttons: ['OK', 'Copy info'],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
    });

    if (res.response === 1) {
        clipboard.writeText(`${app.name}\n${detail}`);
    }
}