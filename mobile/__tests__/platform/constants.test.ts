import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Platform: { OS: 'android' },
}));

vi.mock('react-native-config', () => ({
  default: {
    KINEFIT_SUPABASE_URL: 'https://example.supabase.co',
    KINEFIT_SUPABASE_ANON_KEY: 'anon-key',
    EXPO_PUBLIC_SENTRY_DSN: 'https://sentry.example/1',
  },
}));

vi.mock('../../package.json', () => ({
  default: { version: '9.9.9' },
}));

import {
  appConfig,
  Constants,
  getPublicEnv,
  PUBLIC_ENV_PREFIX,
} from '../../src/platform/constants';

describe('platform/constants', () => {
  beforeEach(() => {
    delete process.env.KINEFIT_GARMIN_CLIENT_ID;
    delete process.env.EXPO_PUBLIC_GARMIN_CLIENT_ID;
  });

  it('espone prefix pubblico', () => {
    expect(PUBLIC_ENV_PREFIX).toBe('KINEFIT_');
  });

  it('getPublicEnv preferisce KINEFIT_ e cade su EXPO_PUBLIC_', () => {
    expect(getPublicEnv('SUPABASE_URL')).toBe('https://example.supabase.co');
    expect(getPublicEnv('SENTRY_DSN')).toBe('https://sentry.example/1');
  });

  it('appConfig espone version e supabase', () => {
    expect(appConfig.version).toBe('9.9.9');
    expect(appConfig.supabaseUrl).toBe('https://example.supabase.co');
    expect(appConfig.supabaseAnonKey).toBe('anon-key');
    expect(appConfig.sentryDsn).toBe('https://sentry.example/1');
    expect(appConfig.androidVersionCode).toBe(12);
  });

  it('Constants.expoConfig shim mantiene shape legacy', () => {
    expect(Constants.expoConfig.version).toBe('9.9.9');
    expect(Constants.expoConfig.extra.supabaseUrl).toBe('https://example.supabase.co');
    expect(Constants.expoConfig.android.versionCode).toBe(12);
  });
});
