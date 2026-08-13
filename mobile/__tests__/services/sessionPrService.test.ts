import AsyncStorage from '@react-native-async-storage/async-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { sessionPrService } from '../../src/services/sessionPrService';

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

describe('sessionPrService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    vi.clearAllMocks();
  });

  it('returns 0 when missing', async () => {
    expect(await sessionPrService.getCount('s1')).toBe(0);
  });

  it('increments and reads counts', async () => {
    expect(await sessionPrService.increment('s1')).toBe(1);
    expect(await sessionPrService.increment('s1')).toBe(2);
    expect(await sessionPrService.getCount('s1')).toBe(2);
    expect(await sessionPrService.getAll()).toEqual({ s1: 2 });
  });

  it('setCount clears non-positive', async () => {
    await sessionPrService.setCount('s1', 3);
    await sessionPrService.setCount('s1', 0);
    expect(await sessionPrService.getCount('s1')).toBe(0);
    expect(await sessionPrService.getAll()).toEqual({});
  });

  it('ignores empty session id', async () => {
    await sessionPrService.increment('');
    await sessionPrService.setCount('', 2);
    expect(await sessionPrService.getAll()).toEqual({});
  });

  it('clearSession removes entry', async () => {
    await sessionPrService.setCount('s1', 2);
    await sessionPrService.clearSession('s1');
    expect(await sessionPrService.getCount('s1')).toBe(0);
  });
});
