import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Gate di regressione UI: ogni schermata/modale critica deve esporre testID stabili
 * per Maestro / verify_ui adb. Se rimuovi un testID, questo test fallisce.
 */
const REQUIRED_TEST_IDS: { id: string; hint: string }[] = [
  { id: 'screen-auth', hint: 'AuthView' },
  { id: 'screen-oggi', hint: 'OggiView' },
  { id: 'screen-history', hint: 'HistoryView' },
  { id: 'screen-analytics', hint: 'AnalyticsView' },
  { id: 'screen-profile', hint: 'ProfileView' },
  { id: 'auth-email-input', hint: 'Auth' },
  { id: 'auth-password-input', hint: 'Auth' },
  { id: 'auth-submit-button', hint: 'Auth' },
  { id: 'auth-tab-login', hint: 'Auth' },
  { id: 'auth-tab-register', hint: 'Auth' },
  { id: 'auth-forgot-button', hint: 'Auth' },
  { id: 'auth-back-to-login-button', hint: 'Auth' },
  { id: 'tab-oggi', hint: 'App tabs' },
  { id: 'tab-storico', hint: 'App tabs' },
  { id: 'tab-analisi', hint: 'App tabs' },
  { id: 'tab-profilo', hint: 'App tabs' },
  { id: 'workout-start-button', hint: 'Oggi' },
  { id: 'workout-end-button', hint: 'Oggi' },
  { id: 'oggi-add-exercise', hint: 'Oggi' },
  { id: 'oggi-streak-chip', hint: 'Oggi streak' },
  { id: 'oggi-exercise-search', hint: 'Oggi filter' },
  { id: 'oggi-exercise-search-clear', hint: 'Oggi filter' },
  { id: 'oggi-empty-state', hint: 'Oggi empty' },
  { id: 'oggi-empty-clear-filter', hint: 'Oggi empty' },
  { id: 'oggi-empty-add-cta', hint: 'Oggi empty' },
  { id: 'oggi-session-notes', hint: 'Oggi notes' },
  { id: 'oggi-session-note-input', hint: 'Oggi notes' },
  { id: 'oggi-session-note-save', hint: 'Oggi notes' },
  { id: 'history-sessions-list', hint: 'History' },
  { id: 'history-search-input', hint: 'History' },
  { id: 'history-export-button', hint: 'History' },
  { id: 'history-clear-search', hint: 'History' },
  { id: 'history-empty-state', hint: 'History empty' },
  { id: 'history-empty-clear-search', hint: 'History empty' },
  { id: 'history-empty-goto-hint', hint: 'History empty' },
  { id: 'analytics-heatmap', hint: 'Analytics' },
  { id: 'analytics-empty-state', hint: 'Analytics empty' },
  { id: 'analytics-empty-goto-hint', hint: 'Analytics empty' },
  { id: 'profile-weight-badge', hint: 'Profile' },
  { id: 'profile-edit-card', hint: 'Profile' },
  { id: 'profile-garmin-row', hint: 'Profile' },
  { id: 'profile-settings-row', hint: 'Profile' },
  { id: 'profile-logout', hint: 'Profile' },
  { id: 'profile-streak-chip', hint: 'Profile streak' },
  { id: 'profile-sync-fail-banner', hint: 'Profile sync fail' },
  { id: 'oggi-offline-banner', hint: 'Oggi offline queue' },
  { id: 'oggi-sync-fail-banner', hint: 'Oggi sync fail' },
  { id: 'oggi-sync-toast', hint: 'Oggi sync toast' },
  { id: 'log-save-set-button', hint: 'LogExerciseModal' },
  { id: 'log-close-button', hint: 'LogExerciseModal' },
  { id: 'log-plates-toggle', hint: 'LogExerciseModal' },
  { id: 'log-rest-presets', hint: 'LogExerciseModal' },
  { id: 'log-fast-repeat-button', hint: 'LogExerciseModal' },
  { id: 'log-pr-toast', hint: 'LogExerciseModal' },
  { id: 'modal-log-exercise', hint: 'LogExerciseModal' },
  { id: 'timer-rest-presets', hint: 'FloatingTimer' },
  { id: 'modal-settings', hint: 'SettingsModal' },
  { id: 'settings-close-button', hint: 'SettingsModal' },
  { id: 'settings-haptics-switch', hint: 'SettingsModal' },
  { id: 'settings-timer-auto-switch', hint: 'SettingsModal' },
  { id: 'settings-timer-sound-switch', hint: 'SettingsModal' },
  { id: 'settings-notifications-switch', hint: 'SettingsModal' },
  { id: 'modal-add-exercise', hint: 'AddExerciseModal' },
  { id: 'add-exercise-close-button', hint: 'AddExerciseModal' },
  { id: 'add-exercise-name-input', hint: 'AddExerciseModal' },
  { id: 'add-exercise-save-button', hint: 'AddExerciseModal' },
  { id: 'modal-garmin', hint: 'GarminConnectModal' },
  { id: 'garmin-close-button', hint: 'GarminConnectModal' },
  { id: 'garmin-save-client-id-button', hint: 'GarminConnectModal' },
  { id: 'modal-onboarding', hint: 'OnboardingModal' },
  { id: 'onboarding-next-button', hint: 'OnboardingModal' },
  { id: 'onboarding-back-button', hint: 'OnboardingModal' },
  { id: 'modal-workout-summary', hint: 'WorkoutSummaryModal' },
  { id: 'workout-summary-close-button', hint: 'WorkoutSummaryModal' },
  { id: 'modal-session-details', hint: 'SessionDetailsModal' },
  { id: 'session-details-close-button', hint: 'SessionDetailsModal' },
  { id: 'modal-profile-edit', hint: 'ProfileEditModal' },
  { id: 'profile-edit-cancel-button', hint: 'ProfileEditModal' },
  { id: 'profile-edit-save-button', hint: 'ProfileEditModal' },
  { id: 'modal-weight-update', hint: 'WeightUpdateModal' },
  { id: 'weight-update-input', hint: 'WeightUpdateModal' },
  { id: 'weight-update-cancel-button', hint: 'WeightUpdateModal' },
  { id: 'weight-update-save-button', hint: 'WeightUpdateModal' },
  { id: 'plate-calculator', hint: 'PlateCalculator' },
  { id: 'floating-timer', hint: 'FloatingTimer' },
  { id: 'timer-minus-15', hint: 'FloatingTimer' },
  { id: 'timer-plus-15', hint: 'FloatingTimer' },
  { id: 'timer-close', hint: 'FloatingTimer' },
  { id: 'timer-display', hint: 'FloatingTimer' },
  { id: 'db-error-retry-button', hint: 'App' },
  { id: 'smoke-mode-banner', hint: 'App smoke' },
  { id: 'smoke-seed-status', hint: 'App smoke seed' },
  { id: 'smoke-seed-ready', hint: 'App smoke seed ready' },
  { id: 'analytics-volume-total', hint: 'Analytics smoke seed volume' },
];

function walkTsx(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) walkTsx(full, acc);
    else if (/\.(tsx|ts)$/.test(name)) acc.push(full);
  }
  return acc;
}

describe('viewContracts — testID su ogni vista', () => {
  const srcRoot = join(process.cwd(), 'src');
  const appFile = join(process.cwd(), 'App.tsx');
  const files = [...walkTsx(srcRoot), appFile];
  const corpus = files.map((f) => readFileSync(f, 'utf8')).join('\n');

  it.each(REQUIRED_TEST_IDS)('espone testID "$id" ($hint)', ({ id }) => {
    const pattern = new RegExp(`testID=["'\`]${id}["'\`]|tabBarButtonTestID:\\s*['\`]${id}['\`]`);
    expect(corpus, `Manca testID ${id} nel sorgente UI`).toMatch(pattern);
  });

  it('espone rest preset chips dinamici (log-rest-preset-* / timer-rest-preset-*)', () => {
    expect(corpus).toMatch(/log-rest-preset-\$\{secs\}|log-rest-preset-/);
    expect(corpus).toMatch(/timer-rest-preset-\$\{secs\}|timer-rest-preset-/);
  });

  it('espone day chips dinamici (oggi-day-*)', () => {
    expect(corpus).toMatch(/oggi-day-\$\{day\}|oggi-day-/);
  });

  it('History e Analytics usano enabled: !!user (no fetch anonimi)', () => {
    const history = readFileSync(join(srcRoot, 'components/views/HistoryView.tsx'), 'utf8');
    const analytics = readFileSync(join(srcRoot, 'components/views/AnalyticsView.tsx'), 'utf8');
    expect(history).toMatch(/enabled:\s*!!user/);
    expect(analytics).toMatch(/enabled:\s*!!user/);
  });

  it('non usa user!.id in AuthenticatedApp (crash risk)', () => {
    const app = readFileSync(appFile, 'utf8');
    expect(app).not.toMatch(/user!\.id/);
  });

  it('smoke deep-link tabs e auth sono documentati in smokeMode', () => {
    const smoke = readFileSync(join(srcRoot, 'lib/smokeMode.ts'), 'utf8');
    expect(smoke).toMatch(/kinefit:\/\/smoke\/auth/);
    expect(smoke).toMatch(/tab=oggi\|storico\|analisi\|profilo/);
    expect(smoke).toMatch(/timer=/);
    expect(smoke).toMatch(/modal=/);
  });
});
