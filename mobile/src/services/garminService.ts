import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { Alert } from 'react-native';

import { profileService } from './profileService';

const GARMIN_TOKEN_KEY = 'garmin_access_token';
const GARMIN_DEMO_TOKEN = 'kinefit_garmin_demo';

WebBrowser.maybeCompleteAuthSession();

const getGarminClientId = () =>
  (Constants.expoConfig?.extra?.garminClientId as string | undefined) || '';

export const garminService = {
  async isConnected(): Promise<boolean> {
    const token = await SecureStore.getItemAsync(GARMIN_TOKEN_KEY);
    return !!token;
  },

  async connect(userId: string): Promise<{ error: Error | null }> {
    const clientId = getGarminClientId();

    if (!clientId) {
      await SecureStore.setItemAsync(GARMIN_TOKEN_KEY, GARMIN_DEMO_TOKEN);
      const { error } = await profileService.saveSettings(userId, { garmin_connected: true });
      return { error: error ? new Error(error.message) : null };
    }

    const redirectUri = 'kinefit://garmin-callback';
    const authUrl =
      `https://connect.garmin.com/oauthConfirm?` +
      `oauth_callback=${encodeURIComponent(redirectUri)}&` +
      `client_id=${encodeURIComponent(clientId)}`;

    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        const tokenMatch = result.url.match(/[?&]oauth_token=([^&]+)/);
        const token = tokenMatch?.[1] ?? GARMIN_DEMO_TOKEN;
        await SecureStore.setItemAsync(GARMIN_TOKEN_KEY, token);
        const { error } = await profileService.saveSettings(userId, { garmin_connected: true });
        return { error: error ? new Error(error.message) : null };
      }

      return { error: new Error('Connessione Garmin annullata') };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Errore connessione Garmin') };
    }
  },

  async disconnect(userId: string): Promise<{ error: Error | null }> {
    await SecureStore.deleteItemAsync(GARMIN_TOKEN_KEY);
    const { error } = await profileService.saveSettings(userId, { garmin_connected: false });
    return { error: error ? new Error(error.message) : null };
  },

  async syncActivities(): Promise<{ synced: number; message: string }> {
    const token = await SecureStore.getItemAsync(GARMIN_TOKEN_KEY);
    if (!token) {
      return { synced: 0, message: 'Garmin non connesso' };
    }

    if (token === GARMIN_DEMO_TOKEN || !getGarminClientId()) {
      return {
        synced: 0,
        message:
          'Modalità demo attiva. Configura EXPO_PUBLIC_GARMIN_CLIENT_ID per sincronizzare attività reali.',
      };
    }

    // Endpoint Garmin Health API — richiede token OAuth valido e approvazione developer
    return {
      synced: 0,
      message:
        'Sincronizzazione Garmin configurata. Implementare fetch su Health API con token salvato.',
    };
  },

  async showSyncResult(): Promise<void> {
    const result = await this.syncActivities();
    Alert.alert('Garmin Connect', result.message);
  },
};
