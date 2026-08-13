import { describe, expect, it } from 'vitest';

import {
  CryptoDigestAlgorithm,
  CryptoEncoding,
  digestStringAsync,
  getRandomBytesAsync,
} from '../../src/platform/crypto';

describe('platform/crypto', () => {
  it('getRandomBytesAsync restituisce N byte', async () => {
    const bytes = await getRandomBytesAsync(16);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(16);
  });

  it('digestStringAsync SHA-256 base64 è deterministico', async () => {
    const a = await digestStringAsync(CryptoDigestAlgorithm.SHA256, 'kinefit', {
      encoding: CryptoEncoding.BASE64,
    });
    const b = await digestStringAsync('SHA-256', 'kinefit', { encoding: 'base64' });
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(10);
    expect(a).toMatch(/^[A-Za-z0-9+/=]+$/);
  });

  it('rifiuta algorithm/encoding non supportati', async () => {
    await expect(digestStringAsync('MD5', 'x')).rejects.toThrow(/non supportato/i);
    await expect(
      digestStringAsync(CryptoDigestAlgorithm.SHA256, 'x', { encoding: 'hex' }),
    ).rejects.toThrow(/encoding/i);
  });
});
