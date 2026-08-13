import { appConfig } from '../../platform/constants';
import * as SecureStore from '../../platform/secureStore';
import { clientIdKey, LEGACY_CLIENT_ID_KEY, LEGACY_TOKEN_KEY, tokenKey } from './constants';
import { clearPkce } from './garminPkce';

const getEnvGarminClientId = () => appConfig.garminClientId || '';

function assertUserId(userId: string): string {
  const trimmed = typeof userId === 'string' ? userId.trim() : '';
  if (!trimmed) {
    throw new Error('Garmin storage: userId required');
  }
  return trimmed;
}

export async function readToken(userId: string): Promise<string | null> {
  let scopedUser: string;
  try {
    scopedUser = assertUserId(userId);
  } catch {
    return null;
  }

  const scoped = await SecureStore.getItemAsync(tokenKey(scopedUser));
  if (scoped?.trim()) return scoped.trim();

  const legacy = await SecureStore.getItemAsync(LEGACY_TOKEN_KEY);
  if (legacy?.trim()) {
    const trimmed = legacy.trim();
    await SecureStore.setItemAsync(tokenKey(scopedUser), trimmed);
    await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
    return trimmed;
  }
  return null;
}

export async function writeToken(userId: string, token: string): Promise<void> {
  const scopedUser = assertUserId(userId);
  const trimmed = typeof token === 'string' ? token.trim() : '';
  if (!trimmed) {
    throw new Error('Garmin storage: empty token');
  }
  await SecureStore.setItemAsync(tokenKey(scopedUser), trimmed);
  await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
}

export async function deleteToken(userId: string): Promise<void> {
  let scopedUser: string;
  try {
    scopedUser = assertUserId(userId);
  } catch {
    await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(tokenKey(scopedUser));
  await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
}

export async function getClientId(userId?: string): Promise<string> {
  if (userId) {
    try {
      const scopedUser = assertUserId(userId);
      const scoped = await SecureStore.getItemAsync(clientIdKey(scopedUser));
      if (scoped?.trim()) return scoped.trim();
    } catch {
      // fall through
    }
  }

  const legacy = await SecureStore.getItemAsync(LEGACY_CLIENT_ID_KEY);
  if (legacy?.trim()) {
    if (userId) {
      try {
        const scopedUser = assertUserId(userId);
        await SecureStore.setItemAsync(clientIdKey(scopedUser), legacy.trim());
        await SecureStore.deleteItemAsync(LEGACY_CLIENT_ID_KEY);
      } catch {
        // keep legacy readable
      }
    }
    return legacy.trim();
  }

  return getEnvGarminClientId().trim();
}

export async function setClientId(clientId: string, userId?: string): Promise<void> {
  const trimmed = clientId.trim();
  if (trimmed) {
    if (userId) {
      const scopedUser = assertUserId(userId);
      await SecureStore.setItemAsync(clientIdKey(scopedUser), trimmed);
      await SecureStore.deleteItemAsync(LEGACY_CLIENT_ID_KEY);
    } else {
      await SecureStore.setItemAsync(LEGACY_CLIENT_ID_KEY, trimmed);
    }
  } else if (userId) {
    try {
      const scopedUser = assertUserId(userId);
      await SecureStore.deleteItemAsync(clientIdKey(scopedUser));
    } catch {
      // ignore
    }
    await SecureStore.deleteItemAsync(LEGACY_CLIENT_ID_KEY);
  } else {
    await SecureStore.deleteItemAsync(LEGACY_CLIENT_ID_KEY);
  }
}

export async function clearLocalCredentials(userId: string): Promise<void> {
  await deleteToken(userId);
  try {
    const scopedUser = assertUserId(userId);
    await SecureStore.deleteItemAsync(clientIdKey(scopedUser));
  } catch {
    // still wipe legacy + pkce
  }
  await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
  await SecureStore.deleteItemAsync(LEGACY_CLIENT_ID_KEY);
  await clearPkce();
}
