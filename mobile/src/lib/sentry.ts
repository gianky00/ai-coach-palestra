import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const sentryDsn = Constants.expoConfig?.extra?.sentryDsn as string | undefined;
const appVersion = Constants.expoConfig?.version ?? '0.0.0';
const buildNumber =
  Constants.expoConfig?.android?.versionCode?.toString() ??
  Constants.expoConfig?.ios?.buildNumber ??
  '0';

export const initSentry = () => {
  if (!sentryDsn) return;

  Sentry.init({
    dsn: sentryDsn,
    enabled: !__DEV__,
    environment: __DEV__ ? 'development' : 'production',
    release: `kinefit@${appVersion}+${buildNumber}`,
    dist: buildNumber,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
    attachStacktrace: true,
  });
};

export const setSentryUser = (user: { id: string; email?: string } | null) => {
  if (!sentryDsn) return;

  if (user) {
    Sentry.setUser({ id: user.id, email: user.email });
  } else {
    Sentry.setUser(null);
  }
};

export { Sentry };
