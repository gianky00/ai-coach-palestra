import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sessionNotesService } from '../../src/services/sessionNotesService';

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: vi.fn(async (k: string) => store.get(k) ?? null),
      setItem: vi.fn(async (k: string, v: string) => {
        store.set(k, v);
      }),
      removeItem: vi.fn(async (k: string) => {
        store.delete(k);
      }),
      clear: vi.fn(async () => {
        store.clear();
      }),
      __store: store,
    },
  };
});

describe('sessionNotesService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    vi.clearAllMocks();
  });

  it('returns empty note when missing', async () => {
    expect(await sessionNotesService.getNote('s1')).toBe('');
  });

  it('persists and reads a note', async () => {
    await sessionNotesService.setNote('s1', '  buon pompaggio  ');
    expect(await sessionNotesService.getNote('s1')).toBe('buon pompaggio');
  });

  it('clears empty notes', async () => {
    await sessionNotesService.setNote('s1', 'x');
    await sessionNotesService.setNote('s1', '   ');
    expect(await sessionNotesService.getNote('s1')).toBe('');
  });

  it('ignores empty session id', async () => {
    await sessionNotesService.setNote('', 'nope');
    expect(await sessionNotesService.getNote('')).toBe('');
  });
});
