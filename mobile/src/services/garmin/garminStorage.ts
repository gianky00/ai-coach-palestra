import { appConfig } from '../../platform/constants';
import * as SecureStore from '../../platform/secureStore';
import { clientIdKey, LEGACY_CLIENT_ID_KEY, LEGACY_TOKEN_KEY, tokenKey } from './constants';
import { clearPkce } from './garminPkce';

const getEnvGarminClientId = () => appConfig.garminClientId || '';

export async function readToken(userId: string): Promise<string | null> {
  const scoped = await SecureStore.getItemAsync(tokenKey(userId));
  if (scoped) return scoped;

  const legacy = await SecureStore.getItemAsync(LEGACY_TOKEN_KEY);
  if (legacy) {
    await SecureStore.setItemAsync(tokenKey(userId), legacy);
    await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
    return legacy;
  }
  return null;
}

export async function writeToken(userId: string, token: string): Promise<void> {
  await SecureStore.setItemAsync(tokenKey(userId), token);
  await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
}

export async function deleteToken(userId: string): Promise<void> {
  await SecureStore.deleteItemAsync(tokenKey(userId));
  await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
}

export async function getClientId(userId?: string): Promise<string> {
  if (userId) {
    const scoped = await SecureStore.getItemAsync(clientIdKey(userId));
    if (scoped?.trim()) return scoped.trim();
  }

  const legacy = await SecureStore.getItemAsync(LEGACY_CLIENT_ID_KEY);
  if (legacy?.trim()) {
    if (userId) {
      await SecureStore.setItemAsync(clientIdKey(userId), legacy.trim());
      await SecureStore.deleteItemAsync(LEGACY_CLIENT_ID_KEY);
    }
    return legacy.trim();
  }

  return getEnvGarminClientId().trim();
}

export async function setClientId(clientId: string, userId?: string): Promise<void> {
  const trimmed = clientId.trim();
  if (trimmed) {
    if (userId) {
      await SecureStore.setItemAsync(clientIdKey(userId), trimmed);
      await SecureStore.deleteItemAsync(LEGACY_CLIENT_ID_KEY);
    } else {
      await SecureStore.setItemAsync(LEGACY_CLIENT_ID_KEY, trimmed);
    }
  } else if (userId) {
    await SecureStore.deleteItemAsync(clientIdKey(userId));
    await SecureStore.deleteItemAsync(LEGACY_CLIENT_ID_KEY);
  } else {
    await SecureStore.deleteItemAsync(LEGACY_CLIENT_ID_KEY);
  }
}

export async function clearLocalCredentials(userId: string): Promise<void> {
  await deleteToken(userId);
  await SecureStore.deleteItemAsync(clientIdKey(userId));
  await SecureStore.deleteItemAsync(LEGACY_TOKEN_KEY);
  await SecureStore.deleteItemAsync(LEGACY_CLIENT_ID_KEY);
  await clearPkce();
}
