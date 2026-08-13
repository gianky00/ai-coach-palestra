import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'kinefit-session-notes-v1';

type NotesMap = Record<string, string>;

async function readAll(): Promise<NotesMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as NotesMap;
  } catch {
    return {};
  }
}

async function writeAll(map: NotesMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Note sessione offline-first (AsyncStorage), senza colonna Supabase. */
export const sessionNotesService = {
  async getNote(sessionId: string): Promise<string> {
    if (!sessionId) return '';
    const all = await readAll();
    return all[sessionId] ?? '';
  },

  async setNote(sessionId: string, note: string): Promise<void> {
    if (!sessionId) return;
    const all = await readAll();
    const trimmed = note.trim();
    if (!trimmed) {
      delete all[sessionId];
    } else {
      all[sessionId] = trimmed.slice(0, 500);
    }
    await writeAll(all);
  },

  async clearNote(sessionId: string): Promise<void> {
    await this.setNote(sessionId, '');
  },
};
