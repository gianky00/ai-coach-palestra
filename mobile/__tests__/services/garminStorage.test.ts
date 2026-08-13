import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureStore = vi.hoisted(() => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('../../src/platform/secureStore', () => secureStore);
vi.mock('../../src/platform/constants', () => ({
  appConfig: { garminClientId: 'env-client' },
}));
vi.mock('../../src/services/garmin/garminPkce', () => ({
  clearPkce: vi.fn(),
}));

import { LEGACY_TOKEN_KEY, tokenKey } from '../../src/services/garmin/constants';
import {
  clearLocalCredentials,
  getClientId,
  readToken,
  writeToken,
} from '../../src/services/garmin/garminStorage';

describe('garminStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    secureStore.getItemAsync.mockResolvedValue(null);
    secureStore.setItemAsync.mockResolvedValue(undefined);
    secureStore.deleteItemAsync.mockResolvedValue(undefined);
  });

  it('writeToken rejects empty token / userId', async () => {
    await expect(writeToken('u1', '')).rejects.toThrow(/empty token/);
    await expect(writeToken('u1', '   ')).rejects.toThrow(/empty token/);
    await expect(writeToken('', 'tok')).rejects.toThrow(/userId required/);
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();
  });

  it('writeToken trims and clears legacy key', async () => {
    await writeToken('u1', '  abc  ');
    expect(secureStore.setItemAsync).toHaveBeenCalledWith(tokenKey('u1'), 'abc');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(LEGACY_TOKEN_KEY);
  });

  it('readToken migrates legacy token', async () => {
    secureStore.getItemAsync.mockImplementation(async (key: string) => {
      if (key === tokenKey('u1')) return null;
      if (key === LEGACY_TOKEN_KEY) return ' legacy ';
      return null;
    });
    await expect(readToken('u1')).resolves.toBe('legacy');
    expect(secureStore.setItemAsync).toHaveBeenCalledWith(tokenKey('u1'), 'legacy');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith(LEGACY_TOKEN_KEY);
  });

  it('getClientId falls back to env', async () => {
    await expect(getClientId('u1')).resolves.toBe('env-client');
  });

  it('clearLocalCredentials wipes scoped + legacy', async () => {
    await clearLocalCredentials('u1');
    expect(secureStore.deleteItemAsync).toHaveBeenCalled();
  });
});
