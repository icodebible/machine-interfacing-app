import Database from 'better-sqlite3';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

export function getDb() {
    if (db) return db;

    const dir = path.join(app.getPath('userData'), 'data');
    fs.mkdirSync(dir, { recursive: true });

    const dbPath = path.join(dir, 'machine-interfacing.sqlite');
    db = new Database(dbPath);

    console.log('DB PATH:', dbPath);

    // enterprise defaults
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    return db;
}