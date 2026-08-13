import * as Sentry from '@sentry/react-native';

import { appConfig } from '../platform/constants';

const sentryDsn = appConfig.sentryDsn;
const appVersion = appConfig.version;
const buildNumber = appConfig.androidVersionCode?.toString() ?? appConfig.iosBuildNumber ?? '0';

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
