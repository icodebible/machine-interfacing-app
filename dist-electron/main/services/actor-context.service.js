"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentActorStamp = getCurrentActorStamp;
const db_1 = require("../db/db");
function getCurrentActorStamp(fallbackUsername = 'SYSTEM') {
    const db = (0, db_1.getDb)();
    const row = db
        .prepare(`SELECT value FROM meta WHERE key = ? LIMIT 1`)
        .get('current_session_user');
    if (!row?.value) {
        return { userId: null, username: fallbackUsername };
    }
    try {
        const parsed = JSON.parse(String(row.value));
        return {
            userId: typeof parsed?.id === 'string' && parsed.id.trim() ? parsed.id : null,
            username: typeof parsed?.username === 'string' && parsed.username.trim()
                ? parsed.username.trim()
                : fallbackUsername,
        };
    }
    catch {
        return { userId: null, username: fallbackUsername };
    }
}
