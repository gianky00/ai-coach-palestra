import { beforeEach, describe, expect, it, vi } from 'vitest';

const keychain = vi.hoisted(() => ({
  getGenericPassword: vi.fn(),
  setGenericPassword: vi.fn(),
  resetGenericPassword: vi.fn(),
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' },
}));

vi.mock('react-native-keychain', () => keychain);

import {
  assertStorageKey,
  assertStorageValue,
  deleteItemAsync,
  getItemAsync,
  setItemAsync,
} from '../../src/platform/secureStore';

describe('platform/secureStore', () => {
  beforeEach(() => vi.clearAllMocks());

  it('assertStorageKey rejects empty / oversized keys', () => {
    expect(() => assertStorageKey('')).toThrow(/key required/);
    expect(() => assertStorageKey('   ')).toThrow(/key required/);
    expect(() => assertStorageKey('x'.repeat(201))).toThrow(/too long/);
    expect(assertStorageKey(' tok ')).toBe('tok');
  });

  it('assertStorageValue rejects empty secrets', () => {
    expect(() => assertStorageValue('')).toThrow(/value required/);
    expect(assertStorageValue('secret')).toBe('secret');
  });

  it('setItemAsync does not leak secret values in errors', async () => {
    keychain.setGenericPassword.mockRejectedValueOnce(new Error('native boom'));
    let err: unknown;
    try {
      await setItemAsync('pkce', 'super-secret-token-value');
    } catch (e) {
      err = e;
    }
    expect(String(err)).toMatch(/failed to persist key "pkce"/);
    expect(String(err)).not.toMatch(/super-secret-token-value/);
  });

  it('setItemAsync rejects empty value before Keychain', async () => {
    await expect(setItemAsync('tok', '')).rejects.toThrow(/value required/);
    expect(keychain.setGenericPassword).not.toHaveBeenCalled();
  });

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
