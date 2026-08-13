# Checklist verifica UI — KineFit (Android Studio)

Stack: **bare React Native** (Metro + Gradle in `mobile/android`).

Dopo **Run ▶** su `mobile/android` (con Metro attivo: `npm run metro`) oppure `npm run android:install`.

**Device UI ufficiale:** emulatore AVD **Pixel_9A** / **Pixel_9a** (Pixel 9a). Gli script `verify:ui`, `verify:ui:full`, `verify:ui:ops`, `android:install` e Gate H lo selezionano o lo avviano se nessun device è online.

```powershell
npm run android:emulator   # crea (se possibile) + boot Pixel 9a
npm run metro              # bundler JS (serve per APK debug)
adb reverse tcp:8081 tcp:8081
npm run android:install
```

## Policy auto-verify

- Zero login reale di produzione
- Zero OAuth Garmin (solo shell modal UI)
- Deep-link smoke:
  - `kinefit://smoke/auth`
  - `kinefit://smoke/tabs?tab=oggi|storico|analisi|profilo`
  - `kinefit://smoke/seed?days=7&sets=3` → insert fixture workouts in local SQLite (`smoke-*` / `smoke-seed-*` ids only)
  - `kinefit://smoke/clear` → wipe smoke fixtures only (never real user rows)
  - opzionale `&timer=90` → FloatingTimer (±15 + rest presets)
  - opzionale `&modal=log|weight|profile-edit|settings|garmin|add-exercise|session|notes`
- Solo adb + Gradle install + deep-link / Maestro
- **No Expo**
- Env: `KINEFIT_*` only

### Smoke seed status testIDs

| testID                              | When                                                                                                       |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `smoke-mode-banner`                 | Any smoke deep-link                                                                                        |
| `smoke-seed-status`                 | During/after seed or clear (`accessibilityLabel`: `seeding` / `seeded` / `clearing` / `cleared` / `error`) |
| `smoke-seed-ready`                  | After successful seed (`accessibilityLabel`: `SEED`)                                                       |
| `oggi-exercise-smoke-*`             | Exercise cards from seed catalog                                                                           |
| `history-session-smoke-seed-sess-*` | History rows from seed                                                                                     |
| `analytics-volume-total`            | Analytics volume block (non-empty after seed)                                                              |
| `analytics-week-selector`           | Analytics week prev/next control                                                                           |
| `analytics-week-label`              | Selected week label (`Questa settimana` / date range)                                                      |
| `analytics-week-prev` / `-next`     | Step calendar week (Mon–Sun); next disabled on current                                                     |

### adb deep-link commands (Pixel_9a)

Package: `com.coemi.kinefit.elite`. Intent-filters: catch-all `kinefit://` (production Garmin OAuth) **plus** explicit host `smoke` pathPrefixes `/auth` `/tabs` `/seed` `/clear`.

**Quote the whole `am start` for the device shell** so `?` / `&` in seed/tabs query strings are not interpreted by `sh`.

```powershell
# Cold start (matches verify_ui_*): stop then VIEW
adb shell am force-stop com.coemi.kinefit.elite

adb shell "am start -a android.intent.action.VIEW -d 'kinefit://smoke/auth' com.coemi.kinefit.elite"
adb shell "am start -a android.intent.action.VIEW -d 'kinefit://smoke/tabs?tab=oggi' com.coemi.kinefit.elite"
adb shell "am start -a android.intent.action.VIEW -d 'kinefit://smoke/tabs?tab=storico' com.coemi.kinefit.elite"
adb shell "am start -a android.intent.action.VIEW -d 'kinefit://smoke/tabs?tab=analisi' com.coemi.kinefit.elite"
adb shell "am start -a android.intent.action.VIEW -d 'kinefit://smoke/tabs?tab=profilo' com.coemi.kinefit.elite"
adb shell "am start -a android.intent.action.VIEW -d 'kinefit://smoke/seed?days=7&sets=3' com.coemi.kinefit.elite"
adb shell "am start -a android.intent.action.VIEW -d 'kinefit://smoke/clear' com.coemi.kinefit.elite"

# Warm start (app already running): same VIEW lines — MainActivity.onNewIntent + setIntent
# delivers Linking 'url' without losing query params.

# Production scheme still works (do not remove catch-all filter):
adb shell "am start -a android.intent.action.VIEW -d 'kinefit://garmin-callback?code=test&state=test' com.coemi.kinefit.elite"
```

Seed/clear JS lives in `smokeSeed.ts` (sibling) — native only routes the URL.

## Screenshots & fail artifacts

Directory: `scripts/android/.ui-shots/` (gitignored salvo `.gitkeep` — **non cancellare** helper `lib/ui-shots.ps1` / `lib/ui-verify-common.ps1`).

| Pattern                               | Quando                                                   |
| ------------------------------------- | -------------------------------------------------------- |
| `step-<label>-<runStamp>-<seq>.png`   | Prima e dopo ogni deep-link / tap / assert               |
| `fail-<stepOrTestId>-<timestamp>.png` | Subito su qualsiasi FAIL                                 |
| `fail-<stepOrTestId>-<timestamp>.xml` | Dump `uiautomator` accanto al fail shot                  |
| `fail-<stepOrTestId>-<timestamp>.log` | Ultime ~80 righe logcat (AndroidRuntime / ReactNativeJS) |

Helper: `Capture-UiShot` / `Capture-FailArtifacts` in `scripts/android/lib/ui-shots.ps1` (adb `exec-out screencap`, fallback pull).

## Checklist esaustiva (smoke, zero credenziali)

### Auth (`smoke/auth`)

- [ ] Banner **SMOKE** + **KINEFIT**
- [ ] `auth-tab-login` / `auth-tab-register` (tap, no submit)
- [ ] `auth-email-input`, `auth-password-input`, `auth-submit-button` (visibili)
- [ ] `auth-forgot-button` → forgot mode → `auth-back-to-login-button`

### Tab shell (`smoke/tabs`)

- [ ] `tab-oggi`, `tab-storico`, `tab-analisi`, `tab-profilo`
- [ ] Oggi: `oggi-streak-chip`, `oggi-exercise-search`, `oggi-add-exercise`, `workout-start-button`, `oggi-empty-state` (se lista vuota)
- [ ] Storico: `history-search-input`, `history-export-button`, `history-sessions-list` / `history-empty-state`
- [ ] Analisi: `analytics-week-selector` / `analytics-week-prev` / `analytics-week-next` / `analytics-week-label`; con dati `analytics-heatmap` / `analytics-volume-total`; senza volume `analytics-empty-state` + `analytics-empty-goto-hint`
- [ ] Profilo: `profile-streak-chip`, `profile-weight-badge`, `profile-edit-card`, `profile-settings-row`, `profile-garmin-row`, `profile-logout`

### Modali open/close

- [ ] Settings: `profile-settings-row` → `modal-settings` → `settings-close-button` (+ switches visibili)
- [ ] Garmin shell: `profile-garmin-row` → `modal-garmin` → `garmin-close-button` (**no** OAuth / no Connect)
- [ ] Add exercise: `oggi-add-exercise` → `modal-add-exercise` → close
- [ ] Weight: `?modal=weight` o badge → `modal-weight-update` → cancel
- [ ] Profile edit: `?modal=profile-edit` → `modal-profile-edit` → cancel
- [ ] Log smoke: `?modal=log` → `modal-log-exercise` + `log-rest-presets` / `log-rest-preset-*` → close
- [ ] Session: `?modal=session` → `modal-session-details` → close

### Timer

- [ ] `?timer=90` → `floating-timer`, `timer-minus-15`, `timer-plus-15`, `timer-close`
- [ ] `timer-rest-presets` / `timer-rest-preset-60|90|120|180`

### Solo manuale / credenziali

- [ ] Login reale → allenamento → offline/sync
- [ ] Session notes save (`oggi-session-note-*`) con sessione attiva
- [ ] PR toast (`log-pr-toast`) dopo set
- [ ] Garmin OAuth completo
- [ ] `bundleRelease` firmato + store

## Suite automatica (max)

```powershell
# Una install + Metro caldo, poi max UI
npm run metro              # terminale 1
adb reverse tcp:8081 tcp:8081
npm run android:install    # una volta
npm run mobile:test        # Vitest (parallelo di default)
npm run verify:ui:max      # full + ops (shot before/after + fail-*)

# Maestro
cd mobile
npm run e2e:max
```

Shot in `scripts/android/.ui-shots/`. Su FAIL apri `fail-*.png` + `.xml` + `.log`.

### Maestro (account test — solo login.yaml / navigation.yaml)

```powershell
$env:MAESTRO_TEST_EMAIL = "test@example.com"
$env:MAESTRO_TEST_PASSWORD = "secret"
cd mobile; npm run e2e
```

Smoke/ops Maestro **non** richiedono credenziali.

## Gate

| Gate | Cosa                                      |
| ---- | ----------------------------------------- |
| A–E  | format, lint, typecheck, vitest, coverage |
| F    | `mobile/android` versionato presente      |
| G    | `assembleDebug`                           |
| H    | verify_ui / Maestro su Pixel 9a           |

CI = A–F light (`npm run quality` / GitHub Actions). G–H locali (SDK / Pixel 9a).

## Libs tooling (PowerShell)

- `scripts/android/lib/android-env.ps1` — SDK / Pixel_9a device
- `scripts/android/lib/ui-shots.ps1` — Capture-UiShot / Capture-FailArtifacts
- `scripts/android/lib/ui-verify-common.ps1` — deep-link, tap testID, assert + shot hooks

Nessuna nuova dipendenza npm nativa richiesta per gli shot (solo adb).
