import * as WebBrowser from 'expo-web-browser';

import { profileService } from '../profileService';
import { AUTHORIZE_URL, GARMIN_DEMO_TOKEN, type GarminLinkStatus, REDIRECT_URI } from './constants';
import {
  disconnectRemote,
  exchangeOAuthCode,
  fetchRecentActivities,
  syncRemote,
} from './garminApi';
import {
  clearPkce,
  createPkce,
  parseRedirectParams,
  persistPkce,
  readPkceState,
} from './garminPkce';
import {
  clearLocalCredentials,
  deleteToken,
  getClientId,
  readToken,
  setClientId,
  writeToken,
} from './garminStorage';

WebBrowser.maybeCompleteAuthSession();

export type { GarminLinkStatus } from './constants';

export const garminService = {
  getClientId,
  setClientId,
  clearLocalCredentials,

  async isConnected(userId: string): Promise<boolean> {
    return !!(await readToken(userId));
  },

  async getLinkStatus(userId: string, dbFlag?: boolean | null): Promise<GarminLinkStatus> {
    const token = await readToken(userId);
    if (token === GARMIN_DEMO_TOKEN) return 'demo';
    if (token) return 'connected';
    if (dbFlag) return 'needs_reconnect';
    return 'disconnected';
  },

  async connect(userId: string): Promise<{ error: Error | null }> {
    const clientId = await getClientId(userId);

    if (!clientId) {
      try {
        await writeToken(userId, GARMIN_DEMO_TOKEN);
        const { error } = await profileService.saveSettings(userId, { garmin_connected: true });
        if (error) {
          await deleteToken(userId);
          return { error: new Error(error.message) };
        }
        return { error: null };
      } catch (err) {
        await deleteToken(userId).catch(() => undefined);
        return { error: err instanceof Error ? err : new Error('Errore connessione Garmin') };
      }
    }

    try {
      const { verifier, challenge, state } = await createPkce();
      await persistPkce(verifier, state);

      const authUrl =
        `${AUTHORIZE_URL}?` +
        `client_id=${encodeURIComponent(clientId)}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
        `&code_challenge=${encodeURIComponent(challenge)}` +
        `&code_challenge_method=S256` +
        `&state=${encodeURIComponent(state)}`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
      if (result.type !== 'success' || !result.url) {
        await clearPkce();
        return { error: new Error('Connessione Garmin annullata') };
      }

      const { code, state: returnedState, error: oauthError } = parseRedirectParams(result.url);
      const expectedState = await readPkceState();
      await clearPkce();

      if (oauthError) return { error: new Error(`Garmin OAuth: ${oauthError}`) };
      if (!code) return { error: new Error('Codice OAuth mancante nella risposta Garmin') };
      if (!returnedState || returnedState !== expectedState) {
        return { error: new Error('State OAuth non valido (possibile CSRF)') };
      }

      const exchanged = await exchangeOAuthCode({
        code,
        codeVerifier: verifier,
        state: returnedState,
      });
      if (exchanged.error) return { error: exchanged.error };

      await writeToken(userId, `oauth:${exchanged.garminUserId ?? 'linked'}`);
      return { error: null };
    } catch (err) {
      await clearPkce();
      return { error: err instanceof Error ? err : new Error('Errore connessione Garmin') };
    }
  },

  async disconnect(userId: string): Promise<{ error: Error | null }> {
    try {
      const token = await readToken(userId);
      const isDemo = token === GARMIN_DEMO_TOKEN;

      if (!isDemo && token) {
        const remote = await disconnectRemote();
        if (remote.error) return remote;
      } else {
        const { error } = await profileService.saveSettings(userId, { garmin_connected: false });
        if (error) return { error: new Error(error.message) };
      }

      await deleteToken(userId);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err : new Error('Errore disconnessione Garmin') };
    }
  },

  async syncActivities(userId: string): Promise<{ synced: number; message: string }> {
    const token = await readToken(userId);
    if (!token) {
      return { synced: 0, message: 'Garmin non connesso su questo dispositivo.' };
    }
    if (token === GARMIN_DEMO_TOKEN) {
      return {
        synced: 0,
        message:
          'Modalità demo attiva: nessun dato reale. Imposta il Client ID e collega OAuth per sincronizzare.',
      };
    }
    return syncRemote(7);
  },

  fetchRecentActivities,
};
