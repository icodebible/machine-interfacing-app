"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentActorSnapshot = getCurrentActorSnapshot;
const db_1 = require("../db/db");
function getCurrentActorSnapshot() {
    const db = (0, db_1.getDb)();
    const row = db.prepare(`SELECT value FROM meta WHERE key = ? LIMIT 1`).get('current_session_user');
    if (!row?.value)
        return null;
    try {
        const parsed = JSON.parse(String(row.value));
        const id = typeof parsed?.id === 'string' ? parsed.id.trim() : '';
        const username = typeof parsed?.username === 'string' ? parsed.username.trim() : '';
        if (!id || !username)
            return null;
        return { id, username };
    }
    catch {
        return null;
    }
}
