import { getDb } from '../db/db';

export type ActorStamp = {
  userId: string | null;
  username: string | null;
};

export function getCurrentActorStamp(fallbackUsername = 'SYSTEM'): ActorStamp {
  const db = getDb();
  const row = db
    .prepare(`SELECT value FROM meta WHERE key = ? LIMIT 1`)
    .get('current_session_user') as { value?: string } | undefined;

  if (!row?.value) {
    return { userId: null, username: fallbackUsername };
  }

  try {
    const parsed = JSON.parse(String(row.value));
    return {
      userId: typeof parsed?.id === 'string' && parsed.id.trim() ? parsed.id : null,
      username:
        typeof parsed?.username === 'string' && parsed.username.trim()
          ? parsed.username.trim()
          : fallbackUsername,
    };
  } catch {
    return { userId: null, username: fallbackUsername };
  }
}
