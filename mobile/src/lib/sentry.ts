import * as Sentry from '@sentry/react-native';

import { appConfig } from '../platform/constants';
import {
  buildSmokeModeBreadcrumb,
  buildSyncFailureBreadcrumb,
  buildSyncSummaryBreadcrumb,
  smokeModeTagValue,
  type SyncFailureBreadcrumbInput,
} from './sentryBreadcrumbs';
import { redactBreadcrumb, redactSentryEvent } from './sentryRedact';
import { setSyncTelemetrySink } from './syncTelemetry';

/** DSN + release from react-native-config / package.json (no Expo Constants). */
const sentryDsn = appConfig.sentryDsn;
const appVersion = appConfig.version;
const buildNumber = appConfig.androidVersionCode?.toString() ?? appConfig.iosBuildNumber ?? '0';

const hasDsn = () => !!sentryDsn;

export const initSentry = () => {
  if (!sentryDsn) return;

  Sentry.init({
    dsn: sentryDsn,
    enabled: !(globalThis as { __DEV__?: boolean }).__DEV__,
    environment: (globalThis as { __DEV__?: boolean }).__DEV__ ? 'development' : 'production',
    release: `kinefit@${appVersion}+${buildNumber}`,
    dist: buildNumber,
    tracesSampleRate: 0.2,
    enableAutoSessionTracking: true,
    attachStacktrace: true,
    sendDefaultPii: false,
    beforeSend(event) {
      return redactSentryEvent(event);
    },
    beforeBreadcrumb(breadcrumb) {
      return redactBreadcrumb(breadcrumb);
    },
  });

  // offlineSync uses syncTelemetry (no static native import); wire the sink here.
  setSyncTelemetrySink((crumb) => {
    Sentry.addBreadcrumb(crumb);
  });
};

/** Attach triage id only — never email / tokens. */
export const setSentryUser = (user: { id: string; email?: string } | null) => {
  if (!hasDsn()) return;

  if (user?.id) {
    Sentry.setUser({ id: user.id });
  } else {
    Sentry.setUser(null);
  }
};

/** Tag + breadcrumb when local smoke deep-links are active (no URLs / PII). */
export const setSmokeModeFlag = (active: boolean) => {
  if (!hasDsn()) return;
  Sentry.setTag('smoke_mode', smokeModeTagValue(active));
  Sentry.addBreadcrumb(buildSmokeModeBreadcrumb(active));
};

export const addSyncFailureBreadcrumb = (input: SyncFailureBreadcrumbInput) => {
  if (!hasDsn()) return;
  Sentry.addBreadcrumb(buildSyncFailureBreadcrumb(input));
};

export const addSyncSummaryBreadcrumb = (result: { synced: number; failed: number }) => {
  if (!hasDsn()) return;
  const crumb = buildSyncSummaryBreadcrumb(result);
  if (crumb) Sentry.addBreadcrumb(crumb);
};

export { Sentry };
export {
  buildSmokeModeBreadcrumb,
  buildSyncFailureBreadcrumb,
  buildSyncSummaryBreadcrumb,
  smokeModeTagValue,
} from './sentryBreadcrumbs';
