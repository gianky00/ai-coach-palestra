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
  { id: 'tab-oggi', hint: 'App tabs' },
  { id: 'tab-storico', hint: 'App tabs' },
  { id: 'tab-analisi', hint: 'App tabs' },
  { id: 'tab-profilo', hint: 'App tabs' },
  { id: 'workout-start-button', hint: 'Oggi' },
  { id: 'workout-end-button', hint: 'Oggi' },
  { id: 'oggi-add-exercise', hint: 'Oggi' },
  { id: 'history-sessions-list', hint: 'History' },
  { id: 'history-search-input', hint: 'History' },
  { id: 'history-export-button', hint: 'History' },
  { id: 'analytics-heatmap', hint: 'Analytics' },
  { id: 'profile-weight-badge', hint: 'Profile' },
  { id: 'profile-edit-card', hint: 'Profile' },
  { id: 'profile-garmin-row', hint: 'Profile' },
  { id: 'profile-settings-row', hint: 'Profile' },
  { id: 'profile-logout', hint: 'Profile' },
  { id: 'log-save-set-button', hint: 'LogExerciseModal' },
  { id: 'modal-log-exercise', hint: 'LogExerciseModal' },
  { id: 'modal-settings', hint: 'SettingsModal' },
  { id: 'settings-close-button', hint: 'SettingsModal' },
  { id: 'modal-add-exercise', hint: 'AddExerciseModal' },
  { id: 'add-exercise-close-button', hint: 'AddExerciseModal' },
  { id: 'add-exercise-name-input', hint: 'AddExerciseModal' },
  { id: 'add-exercise-save-button', hint: 'AddExerciseModal' },
  { id: 'modal-garmin', hint: 'GarminConnectModal' },
  { id: 'garmin-close-button', hint: 'GarminConnectModal' },
  { id: 'modal-onboarding', hint: 'OnboardingModal' },
  { id: 'modal-workout-summary', hint: 'WorkoutSummaryModal' },
  { id: 'modal-session-details', hint: 'SessionDetailsModal' },
  { id: 'session-details-close-button', hint: 'SessionDetailsModal' },
  { id: 'modal-profile-edit', hint: 'ProfileEditModal' },
  { id: 'modal-weight-update', hint: 'WeightUpdateModal' },
  { id: 'plate-calculator', hint: 'PlateCalculator' },
  { id: 'smoke-mode-banner', hint: 'App smoke' },
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
  });
});
