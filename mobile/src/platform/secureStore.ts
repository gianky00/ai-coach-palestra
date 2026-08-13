/**
 * Platform facade: secure key/value storage.
 * Backend: react-native-keychain (service-scoped generic password).
 */
import * as Keychain from 'react-native-keychain';

const MAX_KEY_LENGTH = 200;

/** Validate storage key — never log or echo secret values. */
export function assertStorageKey(key: string): string {
  if (typeof key !== 'string') {
    throw new Error('SecureStore: key required');
  }
  const trimmed = key.trim();
  if (!trimmed) {
    throw new Error('SecureStore: key required');
  }
  if (trimmed.length > MAX_KEY_LENGTH) {
    throw new Error('SecureStore: key too long');
  }
  return trimmed;
}

/** Reject empty secrets so callers cannot persist blank tokens by mistake. */
export function assertStorageValue(value: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error('SecureStore: value required');
  }
  return value;
}

const serviceOptions = (key: string) => ({
  service: `kinefit.${key}`,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

export async function getItemAsync(key: string): Promise<string | null> {
  let safeKey: string;
  try {
    safeKey = assertStorageKey(key);
  } catch {
    return null;
  }

  try {
    const credentials = await Keychain.getGenericPassword(serviceOptions(safeKey));
    if (!credentials) return null;
    const password = credentials.password;
    return typeof password === 'string' && password.length > 0 ? password : null;
  } catch {
    return null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  const safeKey = assertStorageKey(key);
  const safeValue = assertStorageValue(value);
  try {
    await Keychain.setGenericPassword(safeKey, safeValue, serviceOptions(safeKey));
  } catch {
    throw new Error(`SecureStore: failed to persist key "${safeKey}"`);
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  let safeKey: string;
  try {
    safeKey = assertStorageKey(key);
  } catch {
    return;
  }

  try {
    await Keychain.resetGenericPassword(serviceOptions(safeKey));
  } catch {
    // Already absent — ok
  }
}
