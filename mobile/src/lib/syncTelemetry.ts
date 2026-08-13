/**
 * Sync → Sentry telemetry without a static native import.
 * Keeps offlineSync Vitest-friendly (no react-native parse in node).
 */
import {
  buildSyncFailureBreadcrumb,
  buildSyncSummaryBreadcrumb,
  type SyncFailureBreadcrumbInput,
} from './sentryBreadcrumbs';

type AddBreadcrumb = (crumb: Record<string, unknown>) => void;

let sink: AddBreadcrumb | null | undefined;

/** Wire from initSentry; tests can inject a mock sink. */
export function setSyncTelemetrySink(next: AddBreadcrumb | null) {
  sink = next;
}

function resolveAddBreadcrumb(): AddBreadcrumb | null {
  if (sink !== undefined) return sink;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@sentry/react-native') as { addBreadcrumb?: AddBreadcrumb };
    sink = typeof mod.addBreadcrumb === 'function' ? mod.addBreadcrumb.bind(mod) : null;
  } catch {
    sink = null;
  }
  return sink;
}

export function addSyncFailureBreadcrumb(input: SyncFailureBreadcrumbInput) {
  const add = resolveAddBreadcrumb();
  if (!add) return;
  add(buildSyncFailureBreadcrumb(input));
}

export function addSyncSummaryBreadcrumb(result: { synced: number; failed: number }) {
  const add = resolveAddBreadcrumb();
  if (!add) return;
  const crumb = buildSyncSummaryBreadcrumb(result);
  if (crumb) add(crumb);
}
