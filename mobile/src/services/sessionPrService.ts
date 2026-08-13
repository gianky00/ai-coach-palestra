import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'kinefit-session-prs-v1';

type PrMap = Record<string, number>;

function normalizeCount(n: unknown): number {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.round(v);
}

async function readAll(): Promise<PrMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    const out: PrMap = {};
    for (const [id, count] of Object.entries(parsed as Record<string, unknown>)) {
      const n = normalizeCount(count);
      if (n > 0 && id) out[id] = n;
    }
    return out;
  } catch {
    return {};
  }
}

async function writeAll(map: PrMap): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

/** Contatori PR per sessione (AsyncStorage), senza colonna Supabase. */
export const sessionPrService = {
  async getAll(): Promise<PrMap> {
    return readAll();
  },

  async getCount(sessionId: string): Promise<number> {
    if (!sessionId) return 0;
    const all = await readAll();
    return all[sessionId] ?? 0;
  },

  async setCount(sessionId: string, count: number): Promise<void> {
    if (!sessionId) return;
    const all = await readAll();
    const n = normalizeCount(count);
    if (n <= 0) {
      delete all[sessionId];
    } else {
      all[sessionId] = n;
    }
    await writeAll(all);
  },

  async increment(sessionId: string): Promise<number> {
    if (!sessionId) return 0;
    const all = await readAll();
    const next = (all[sessionId] ?? 0) + 1;
    all[sessionId] = next;
    await writeAll(all);
    return next;
  },

  async clearSession(sessionId: string): Promise<void> {
    await this.setCount(sessionId, 0);
  },
};
