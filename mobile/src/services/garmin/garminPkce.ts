import * as Crypto from '../../platform/crypto';
import * as SecureStore from '../../platform/secureStore';
import { PKCE_STATE_KEY, PKCE_VERIFIER_KEY } from './constants';

export function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function randomBase64Url(bytes = 32): Promise<string> {
  const random = await Crypto.getRandomBytesAsync(bytes);
  let binary = '';
  for (let i = 0; i < random.length; i += 1) {
    binary += String.fromCharCode(random[i]);
  }
  return toBase64Url(btoa(binary));
}

export async function createPkce(): Promise<{
  verifier: string;
  challenge: string;
  state: string;
}> {
  const verifier = await randomBase64Url(32);
  const challengeHash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    verifier,
    { encoding: Crypto.CryptoEncoding.BASE64 },
  );
  return {
    verifier,
    challenge: toBase64Url(challengeHash),
    state: await randomBase64Url(16),
  };
}

export async function persistPkce(verifier: string, state: string): Promise<void> {
  await SecureStore.setItemAsync(PKCE_VERIFIER_KEY, verifier);
  await SecureStore.setItemAsync(PKCE_STATE_KEY, state);
}

export async function readPkceState(): Promise<string | null> {
  return SecureStore.getItemAsync(PKCE_STATE_KEY);
}

export async function clearPkce(): Promise<void> {
  await SecureStore.deleteItemAsync(PKCE_VERIFIER_KEY);
  await SecureStore.deleteItemAsync(PKCE_STATE_KEY);
}

export function parseRedirectParams(url: string): {
  code?: string;
  state?: string;
  error?: string;
} {
  const query = url.includes('?') ? url.split('?')[1] : (url.split('#')[1] ?? '');
  const params = new URLSearchParams(query);
  return {
    code: params.get('code') ?? undefined,
    state: params.get('state') ?? undefined,
    error: params.get('error') ?? undefined,
  };
}
