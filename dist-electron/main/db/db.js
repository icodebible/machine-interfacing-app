"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppDataDir = getAppDataDir;
exports.getDbPath = getDbPath;
exports.getBackupDir = getBackupDir;
exports.getDb = getDb;
exports.getOpenedDbPath = getOpenedDbPath;
exports.closeDb = closeDb;
exports.getDbStorageInfo = getDbStorageInfo;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const logger_1 = require("../../logging/logger");
let db = null;
let openedDatabasePath = null;
const DATABASE_FILE_NAME = 'machine-interfacing.sqlite';
function getAppDataDir() {
    const dir = path_1.default.join(electron_1.app.getPath('userData'), 'data');
    fs_1.default.mkdirSync(dir, { recursive: true });
    return dir;
}
function getDbPath() {
    return path_1.default.join(getAppDataDir(), DATABASE_FILE_NAME);
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
    fs_1.default.mkdirSync(path_1.default.dirname(dbPath), { recursive: true });
    db = new better_sqlite3_1.default(dbPath);
    openedDatabasePath = dbPath;
    // enterprise defaults
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');
    logger_1.logger.info('[DB] SQLite database opened', {
        databasePath: dbPath,
        userDataPath: electron_1.app.getPath('userData'),
        dataPath: getAppDataDir(),
        isPackaged: electron_1.app.isPackaged,
        platform: process.platform,
        arch: process.arch,
    });
    return db;
}
function getOpenedDbPath() {
    return openedDatabasePath;
}
function closeDb() {
    if (!db)
        return;
    try {
        db.close();
    }
    finally {
        db = null;
        openedDatabasePath = null;
    }
}
function getDbStorageInfo() {
    const databasePath = getDbPath();
    const walPath = `${databasePath}-wal`;
    const shmPath = `${databasePath}-shm`;
    return {
        userDataPath: electron_1.app.getPath('userData'),
        dataPath: getAppDataDir(),
        backupPath: getBackupDir(),
        databasePath,
        openedDatabasePath,
        exists: fs_1.default.existsSync(databasePath),
        sizeBytes: safeFileSize(databasePath),
        walSizeBytes: safeFileSize(walPath),
        shmSizeBytes: safeFileSize(shmPath),
    };
}
function safeFileSize(filePath) {
    try {
        return fs_1.default.existsSync(filePath) ? fs_1.default.statSync(filePath).size : 0;
    }
    catch {
        return 0;
    }
}
