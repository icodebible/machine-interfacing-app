import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getAppDataDir() {
    const dir = path.join(app.getPath('userData'), 'data');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function getDbPath() {
    return path.join(getAppDataDir(), 'machine-interfacing.sqlite');
}

export function getBackupDir() {
    const dir = path.join(app.getPath('userData'), 'backups');
    fs.mkdirSync(dir, { recursive: true });
    return dir;
}

export function getDb() {
    if (db) return db;

    const dbPath = getDbPath();
    db = new Database(dbPath);

    // enterprise defaults
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('busy_timeout = 5000');
    db.pragma('synchronous = NORMAL');

    return db;
}
