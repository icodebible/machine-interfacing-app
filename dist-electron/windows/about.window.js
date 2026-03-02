"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.openAboutWindow = openAboutWindow;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
function openAboutWindow() {
    const win = new electron_1.BrowserWindow({
        width: 420,
        height: 360,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: `About ${electron_1.app.name}`,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
        },
    });
    // simplest: load a local html shipped with app resources
    const aboutHtml = path_1.default.join(electron_1.app.getAppPath(), 'electron', 'resources', 'about.html');
    win.loadFile(aboutHtml);
    return win;
}
