import { beforeEach, describe, expect, it, vi } from 'vitest';

const secureStore = vi.hoisted(() => ({
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

const saveSettings = vi.hoisted(() => vi.fn());
const functionsInvoke = vi.hoisted(() => vi.fn());
const openAuthSessionAsync = vi.hoisted(() => vi.fn());

vi.mock('../../src/platform/secureStore', () => ({
  getItemAsync: secureStore.getItemAsync,
  setItemAsync: secureStore.setItemAsync,
  deleteItemAsync: secureStore.deleteItemAsync,
}));

vi.mock('../../src/platform/constants', () => ({
  appConfig: { garminClientId: '' },
  Constants: { expoConfig: { extra: { garminClientId: '' } } },
}));

vi.mock('../../src/platform/crypto', () => ({
  getRandomBytesAsync: vi.fn(async (n: number) => new Uint8Array(n).fill(1)),
  digestStringAsync: vi.fn(async () => 'abcdef+/=='),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  CryptoEncoding: { BASE64: 'base64' },
}));

vi.mock('../../src/platform/webBrowser', () => ({
  maybeCompleteAuthSession: vi.fn(),
  openAuthSessionAsync,
}));

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
}));

vi.mock('../../src/services/profileService', () => ({
  profileService: { saveSettings },
}));

vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    functions: { invoke: functionsInvoke },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
  },
}));

import { garminService } from '../../src/services/garminService';

describe('garminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    secureStore.getItemAsync.mockResolvedValue(null);
    secureStore.setItemAsync.mockResolvedValue(undefined);
    secureStore.deleteItemAsync.mockResolvedValue(undefined);
    saveSettings.mockResolvedValue({ error: null });
    functionsInvoke.mockResolvedValue({ data: { ok: true }, error: null });
  });

  it('connect without client id stores demo token and sets DB flag', async () => {
    const result = await garminService.connect('user-1');

    expect(result.error).toBeNull();
    expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      'garmin_access_token:user-1',
      'kinefit_garmin_demo',
    );
    expect(saveSettings).toHaveBeenCalledWith('user-1', { garmin_connected: true });
  });

  it('connect with client id starts OAuth and exchanges code via edge function', async () => {
    secureStore.getItemAsync.mockImplementation(async (key: string) => {
      if (key === 'garmin_client_id:user-1') return 'real-client-id';
      if (key === 'garmin_pkce_state') return 'state123';
      return null;
    });
    openAuthSessionAsync.mockResolvedValue({
      type: 'success',
      url: 'kinefit://garmin-callback?code=abc&state=state123',
    });
    functionsInvoke.mockResolvedValue({
      data: { ok: true, garmin_user_id: 'g-1' },
      error: null,
    });

    const result = await garminService.connect('user-1');

    expect(result.error).toBeNull();
    expect(openAuthSessionAsync).toHaveBeenCalled();
    expect(functionsInvoke).toHaveBeenCalledWith(
      'garmin',
      expect.objectContaining({
        body: expect.objectContaining({
          action: 'exchange',
          code: 'abc',
        }),
      }),
    );
    expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      'garmin_access_token:user-1',
      'oauth:g-1',
    );
  });

  it('connect rolls back token when saveSettings fails in demo mode', async () => {
    saveSettings.mockResolvedValue({ error: { message: 'upsert failed' } });

    const result = await garminService.connect('user-1');

    expect(result.error?.message).toBe('upsert failed');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('garmin_access_token:user-1');
  });

  it('getLinkStatus distinguishes demo, connected, needs_reconnect', async () => {
    secureStore.getItemAsync.mockResolvedValue('kinefit_garmin_demo');
    expect(await garminService.getLinkStatus('user-1', true)).toBe('demo');

    secureStore.getItemAsync.mockResolvedValue('oauth:g-1');
    expect(await garminService.getLinkStatus('user-1', true)).toBe('connected');

    secureStore.getItemAsync.mockResolvedValue(null);
    expect(await garminService.getLinkStatus('user-1', true)).toBe('needs_reconnect');
    expect(await garminService.getLinkStatus('user-1', false)).toBe('disconnected');
  });

  it('disconnect updates DB before clearing token in demo mode', async () => {
    secureStore.getItemAsync.mockResolvedValue('kinefit_garmin_demo');
    const order: string[] = [];
    saveSettings.mockImplementation(async () => {
      order.push('db');
      return { error: null };
    });
    secureStore.deleteItemAsync.mockImplementation(async (key: string) => {
      if (key.startsWith('garmin_access_token')) order.push('token');
    });

    const result = await garminService.disconnect('user-1');

    expect(result.error).toBeNull();
    expect(order[0]).toBe('db');
    expect(order.slice(1).every((step) => step === 'token')).toBe(true);
  });

  it('clearLocalCredentials removes scoped and legacy keys', async () => {
    await garminService.clearLocalCredentials('user-1');

    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('garmin_access_token:user-1');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('garmin_client_id:user-1');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('garmin_access_token');
    expect(secureStore.deleteItemAsync).toHaveBeenCalledWith('garmin_client_id');
  });

  it('syncActivities reports demo honestly', async () => {
    secureStore.getItemAsync.mockResolvedValue('kinefit_garmin_demo');
    const result = await garminService.syncActivities('user-1');
    expect(result.synced).toBe(0);
    expect(result.message).toMatch(/demo/i);
  });
});
