import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureStore = vi.hoisted(() => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('../../src/platform/secureStore', () => secureStore);

vi.mock('../../src/platform/crypto', () => ({
  getRandomBytesAsync: vi.fn(async (n: number) => new Uint8Array(n).fill(7)),
  digestStringAsync: vi.fn(async () => 'abc+/=def'),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { BASE64: 'base64' },
}));

import {
  clearPkce,
  createPkce,
  parseRedirectParams,
  persistPkce,
  readPkceState,
  toBase64Url,
} from '../../src/services/garmin/garminPkce';

describe('garminPkce', () => {
  beforeEach(() => vi.clearAllMocks());

  it('toBase64Url sanitizza alphabet', () => {
    expect(toBase64Url('ab+cd/ef==')).toBe('ab-cd_ef');
  });

  it('parseRedirectParams legge query e hash', () => {
    expect(parseRedirectParams('kinefit://cb?code=c1&state=s1')).toEqual({
      code: 'c1',
      state: 's1',
      error: undefined,
    });
    expect(parseRedirectParams('kinefit://cb#error=access_denied&state=s2')).toEqual({
      code: undefined,
      state: 's2',
      error: 'access_denied',
    });
  });

  it('createPkce / persist / read / clear', async () => {
    const pkce = await createPkce();
    expect(pkce.verifier).toBeTruthy();
    expect(pkce.challenge).toBe('abc-_=def');
    expect(pkce.challenge).toMatch(/^abc/);
    expect(pkce.state).toBeTruthy();

    await persistPkce('v', 's');
    expect(secureStore.setItemAsync).toHaveBeenCalled();

    secureStore.getItemAsync.mockResolvedValue('s');
    expect(await readPkceState()).toBe('s');

    await clearPkce();
    expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
  });
});
