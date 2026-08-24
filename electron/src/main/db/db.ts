import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

import { logger } from '../../logging/logger';

let db: Database.Database | null = null;
let openedDatabasePath: string | null = null;

const DATABASE_FILE_NAME = 'machine-interfacing.sqlite';

export function getAppDataDir() {
    const dir = path.join(app.getPath('userData'), 'data');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function getDbPath() {
    return path.join(getAppDataDir(), DATABASE_FILE_NAME);
}

export function getBackupDir() {
    const dir = path.join(app.getPath('userData'), 'backups');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function getDb() {
    if (db) return db;

    const dbPath = getDbPath();
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });

    db = new Database(dbPath);
    openedDatabasePath = dbPath;

    // enterprise defaults
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');

    logger.info('[DB] SQLite database opened', {
        databasePath: dbPath,
        userDataPath: app.getPath('userData'),
        dataPath: getAppDataDir(),
        isPackaged: app.isPackaged,
        platform: process.platform,
        arch: process.arch,
    });

    return db;
}

export function getOpenedDbPath() {
    return openedDatabasePath;
}

export function closeDb() {
    if (!db) return;

    try {
        db.close();
    } finally {
        db = null;
        openedDatabasePath = null;
    }
}

export function getDbStorageInfo() {
    const databasePath = getDbPath();
    const walPath = `${databasePath}-wal`;
    const shmPath = `${databasePath}-shm`;

    return {
        userDataPath: app.getPath('userData'),
        dataPath: getAppDataDir(),
        backupPath: getBackupDir(),
        databasePath,
        openedDatabasePath,
        exists: fs.existsSync(databasePath),
        sizeBytes: safeFileSize(databasePath),
        walSizeBytes: safeFileSize(walPath),
        shmSizeBytes: safeFileSize(shmPath),
    };
}

function safeFileSize(filePath: string) {
    try {
        return fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
    } catch {
        return 0;
    }
}
