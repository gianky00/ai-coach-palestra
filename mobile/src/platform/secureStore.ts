/**
 * Platform facade: secure key/value storage.
 * Backend: react-native-keychain (service-scoped generic password).
 */
import * as Keychain from 'react-native-keychain';

const serviceOptions = (key: string) => ({
  service: `kinefit.${key}`,
  accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
});

export async function getItemAsync(key: string): Promise<string | null> {
  try {
    const credentials = await Keychain.getGenericPassword(serviceOptions(key));
    if (!credentials) return null;
    return credentials.password;
  } catch {
    // Missing entry / keychain unavailable — treat as absent (not a hard crash).
    return null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, serviceOptions(key));
}

export async function deleteItemAsync(key: string): Promise<void> {
  try {
    await Keychain.resetGenericPassword(serviceOptions(key));
  } catch {
    // Already absent — ok
  }
}
