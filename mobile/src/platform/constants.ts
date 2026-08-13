/**
 * Platform facade: app constants / public env.
 * Backend: react-native-config + process.env, prefix KINEFIT_.
 */
import { Platform } from 'react-native';
import Config from 'react-native-config';

import packageJson from '../../package.json';

/** Prefix for public client env vars. */
export const PUBLIC_ENV_PREFIX = 'KINEFIT_' as const;

/** Temporary fallback while migrating from EXPO_PUBLIC_*. */
const LEGACY_ENV_PREFIX = 'EXPO_PUBLIC_' as const;

/** Keep in sync with android/app/build.gradle defaultConfig.versionCode. */
const ANDROID_VERSION_CODE = 12;

function readEnv(name: string): string | undefined {
  const fromConfig = (Config as Record<string, string | undefined> | undefined)?.[name];
  if (typeof fromConfig === 'string' && fromConfig.length > 0) return fromConfig;

  const fromProcess = process.env[name];
  return typeof fromProcess === 'string' && fromProcess.length > 0 ? fromProcess : undefined;
}

/**
 * Read a public env var by logical key (without prefix), e.g. `SUPABASE_URL`.
 * Prefers KINEFIT_* then EXPO_PUBLIC_* (legacy).
 */
export function getPublicEnv(logicalKey: string): string | undefined {
  return (
    readEnv(`${PUBLIC_ENV_PREFIX}${logicalKey}`) ?? readEnv(`${LEGACY_ENV_PREFIX}${logicalKey}`)
  );
}

export const appConfig = {
  get version(): string {
    return packageJson.version ?? '1.0.0';
  },
  get androidVersionCode(): string | number | undefined {
    return Platform.OS === 'android' ? ANDROID_VERSION_CODE : undefined;
  },
  get iosBuildNumber(): string | undefined {
    return Platform.OS === 'ios' ? String(ANDROID_VERSION_CODE) : undefined;
  },
  get supabaseUrl(): string | undefined {
    return getPublicEnv('SUPABASE_URL');
  },
  get supabaseAnonKey(): string | undefined {
    return getPublicEnv('SUPABASE_ANON_KEY');
  },
  get sentryDsn(): string | undefined {
    return getPublicEnv('SENTRY_DSN');
  },
  get garminClientId(): string | undefined {
    return getPublicEnv('GARMIN_CLIENT_ID');
  },
};
