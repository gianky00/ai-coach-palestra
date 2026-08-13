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
  const credentials = await Keychain.getGenericPassword(serviceOptions(key));
  if (!credentials) return null;
  return credentials.password;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, serviceOptions(key));
}

export async function deleteItemAsync(key: string): Promise<void> {
  await Keychain.resetGenericPassword(serviceOptions(key));
}
