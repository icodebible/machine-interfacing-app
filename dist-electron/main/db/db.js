"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let db = null;
function getDb() {
    if (db)
        return db;
    const dir = path_1.default.join(electron_1.app.getPath('userData'), 'data');
    fs_1.default.mkdirSync(dir, { recursive: true });
    const dbPath = path_1.default.join(dir, 'machine-interfacing.sqlite');
    db = new better_sqlite3_1.default(dbPath);
    console.log('DB PATH:', dbPath);
    // enterprise defaults
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    return db;
}
