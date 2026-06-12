"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppDataDir = getAppDataDir;
exports.getDbPath = getDbPath;
exports.getBackupDir = getBackupDir;
exports.getDb = getDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let db = null;
function getAppDataDir() {
    const dir = path_1.default.join(electron_1.app.getPath('userData'), 'data');
    fs_1.default.mkdirSync(dir, { recursive: true });
    return dir;
}
function getDbPath() {
    return path_1.default.join(getAppDataDir(), 'machine-interfacing.sqlite');
}
function getBackupDir() {
    const dir = path_1.default.join(electron_1.app.getPath('userData'), 'backups');
    fs_1.default.mkdirSync(dir, { recursive: true });
    return dir;
}
function getDb() {
    if (db)
        return db;
    const dbPath = getDbPath();
    db = new better_sqlite3_1.default(dbPath);
    // enterprise defaults
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');
    return db;
}
