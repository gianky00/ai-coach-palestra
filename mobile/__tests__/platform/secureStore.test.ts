import { beforeEach, describe, expect, it, vi } from 'vitest';

const keychain = vi.hoisted(() => ({
  getGenericPassword: vi.fn(),
  setGenericPassword: vi.fn(),
  resetGenericPassword: vi.fn(),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' },
}));

vi.mock('react-native-keychain', () => keychain);

import { deleteItemAsync, getItemAsync, setItemAsync } from '../../src/platform/secureStore';

describe('platform/secureStore', () => {
  beforeEach(() => vi.clearAllMocks());

  it('getItemAsync restituisce password o null', async () => {
    keychain.getGenericPassword.mockResolvedValueOnce(false);
    expect(await getItemAsync('tok')).toBeNull();
    expect(keychain.getGenericPassword).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'kinefit.tok' }),
    );

    keychain.getGenericPassword.mockResolvedValueOnce({ username: 'tok', password: 'secret' });
    expect(await getItemAsync('tok')).toBe('secret');
  });

  it('setItemAsync e deleteItemAsync delegano a Keychain', async () => {
    await setItemAsync('pkce', 'abc');
    expect(keychain.setGenericPassword).toHaveBeenCalledWith(
      'pkce',
      'abc',
      expect.objectContaining({ service: 'kinefit.pkce' }),
    );

    await deleteItemAsync('pkce');
    expect(keychain.resetGenericPassword).toHaveBeenCalledWith(
      expect.objectContaining({ service: 'kinefit.pkce' }),
    );
  });
});
