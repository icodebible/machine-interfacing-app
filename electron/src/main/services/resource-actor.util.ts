import { getDb } from '../db/db';

export type ResourceActorSnapshot = {
  id: string;
  username: string;
};

export function getCurrentActorSnapshot(): ResourceActorSnapshot | null {
  const db = getDb();
  const row = db.prepare(`SELECT value FROM meta WHERE key = ? LIMIT 1`).get('current_session_user') as any;
  if (!row?.value) return null;

  try {
    const parsed = JSON.parse(String(row.value));
    const id = typeof parsed?.id === 'string' ? parsed.id.trim() : '';
    const username = typeof parsed?.username === 'string' ? parsed.username.trim() : '';
    if (!id || !username) return null;
    return { id, username };
  } catch {
    return null;
  }
}
