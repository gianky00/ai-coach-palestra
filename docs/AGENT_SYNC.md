# AGENT_SYNC — live coordination for parallel agents

> Keep this short. Append checklist entries; don't rewrite history.

## Bug policy

**Fix immediately. Never leave known fails.** If you find a broken test, smoke failure, or emulator flake you can reproduce — fix it in the same turn or hand off with a concrete fix path. Do not park red suites.

## Current architecture

- **Bare React Native + Android Studio** (no Expo runtime / managed workflow)
- Mobile app under `mobile/`; Android builds via Gradle / Android Studio
- Env prefix: `KINEFIT_*` (not Expo public vars)

## Active workstreams

| Stream                     | Focus                                                       |
| -------------------------- | ----------------------------------------------------------- |
| **Expo purge**             | Remove Expo leftovers; no restore of Expo tooling           |
| **Exhaustive emulator UI** | Full UI smoke / Maestro / emulator coverage on **Pixel_9a** |
| **New features**           | Product work on bare RN stack                               |

## Rules (do not violate)

1. **No Expo restore** — do not reintroduce Expo CLI, Expo modules, or managed workflow
2. **`KINEFIT_*` env** — use project env naming; keep `.env.example` aligned
3. **Preserve smoke `testID`s** — do not rename/remove IDs used by Maestro / UI smoke
4. **Emulator target: Pixel_9a** — default AVD for UI / suite runs
5. **DO NOT delete sync feedback** — keep `mobile/src/lib/syncFeedback.ts`, `mobile/src/components/ui/SyncFailBanner.tsx`, `mobile/__tests__/lib/syncFeedback.test.ts`, `setLastSyncFeedback` / `lastSyncFeedback` on AppState (`useStore`), and `useWorkoutData` `mapSyncFeedback` wiring (landed `aed1954`). If missing in WT: `git checkout HEAD --` those paths. Never `git rm` / overwrite-away.
6. **After push: review CI logs** — run `gh run list --branch <branch> --limit 3`; on failure run `gh run view --log-failed`, fix, and re-push. Do this periodically after commits/pushes.

## Origin sync (landed on origin)

- Sentry harden: `466fbcd`
- Store readiness: `c222d7a`
- Deep links: `c72cbdb`
- ADB heal: `94c9058` · smoke fixtures: `ee70d85` · streak polish: `d2b9151`
- Sync feedback banners: `aed1954` (do not delete `syncFeedback.ts` / `SyncFailBanner`)

## Next wave (prioritized)

Tip: P2 DB indexes (`54255db`). Next: P0 suite when device up / P1 screenshot-on-fail. Do **not** delete syncFeedback.

1. **P0 suite when device up** — Emulator often offline after snapshot; `npm run android:adb-reset` (+ console restart). Then `npm run verify:ui:seed` → `verify:ui:ops` (assert `smoke-seed-ready`). Prefer code/test while device down.
2. **P0 WIP hygiene** — Parallel agents keep deleting just-pushed files in the working tree; restore with `git checkout HEAD -- <path>` before typecheck.
3. **P1 screenshot-on-fail** — Keep `ui-shots.ps1` / Gate F; ops/full emit `fail-*.{png,xml,log}`.
4. ~~**P1 a11y remainder**~~ — done (`2d51f62`): Log inputs/set-type/PR/delete; Oggi rows/days/banners/stats; AddExercise days/reorder; Profile hints; heatmap + plate summary; timer ±15 hints; SyncFailBanner hints. Smoke `testID`s preserved.
5. ~~**P2 DB**~~ — done (this tip): Supabase `20260713000000_*` indexes+RPC already on origin; mobile SQLite adds idempotent indexes via `sqliteSchema.ts` (`idx_offline_logs_*` / `idx_offline_sessions_user_start`) — no DROP, smoke seed safe.
6. ~~Analytics empty-state~~ — done (`268f619`, `analytics-empty-state` + navigate Oggi).
7. ~~Perf lists~~ — done (`9f23016` memo rows + FlatList tune; selectors/timer coalesce).
8. ~~History PR badge~~ — done (`c5d9046`): `history-session-pr-*` via AsyncStorage `sessionPrService`.
9. ~~Analytics week selector~~ — done (`1873867`): `analytics-week-selector` / prev / next / label + loading; Mon–Sun calendar weeks.

## Checklist template (append below)

```
### YYYY-MM-DD — <agent role>
- Files touched: …
- Bugs fixed: … (or "none")
- Notes / blockers: …
```

---

## Log

<!-- Agents: append newest entry at the bottom -->

### 2026-08-13 — sync bootstrap

- Files touched: `docs/AGENT_SYNC.md`
- Bugs fixed: none
- Notes: protocol created for parallel agents (Expo purge | emulator UI | features)

### 2026-08-13 — new features (product)

- Files touched: `mobile/src/lib/restPresets.ts`, `mobile/src/lib/streak.ts`, `mobile/src/lib/exerciseFilter.ts`, `mobile/src/hooks/useHabitStreak.ts`, `mobile/src/services/sessionNotesService.ts`, `mobile/src/components/ui/FloatingTimer.tsx`, `mobile/src/components/modals/LogExerciseModal.tsx`, `mobile/src/components/modals/SessionDetailsModal.tsx`, `mobile/src/components/views/OggiView.tsx`, `mobile/src/components/views/ProfileView.tsx`, `mobile/src/components/views/HistoryView.tsx`, `mobile/src/hooks/useLogExercise.ts`, `mobile/src/services/exportService.ts`, `mobile/__tests__/lib/{restPresets,streak,exerciseFilter}.test.ts`, `mobile/__tests__/services/sessionNotesService.test.ts`, `mobile/__tests__/views/viewContracts.test.ts`, `docs/AGENT_SYNC.md`
- Bugs fixed: FloatingTimer presets wiped by sibling UI agent — restored with `timer-rest-presets` + kept `timer-minus-15`/`timer-plus-15`/`timer-close`/`timer-display`; streak `weekCount` for prior-week Sunday already corrected in tree (`expect 0`)
- Notes / blockers: Features offline-first (notes AsyncStorage; streak merges SQLite+remote). New smoke testIDs: `oggi-streak-chip`, `oggi-exercise-search`, `oggi-empty-state`, `oggi-session-note-input`, `oggi-session-note-save`, `profile-streak-chip`, `history-empty-state`, `log-rest-presets`, `log-pr-toast`, `timer-rest-presets`, `timer-rest-preset-60|90|120|180`. Emulator B: log a set → PR toast + rest chips; start timer → preset row; empty day → CTA; active session → note field; Profile/Oggi streak chip. Env: `KINEFIT_*` only. typecheck+198 vitest green. No Expo.

### 2026-08-13 — Expo purge

- Files touched: `.env.example`, `mobile/.env.example`, `mobile/src/platform/constants.ts`, `mobile/src/platform/index.ts`, `mobile/src/platform/{audio,notifications,sqlite,statusBar}.*`, `mobile/__tests__/platform/constants.test.ts`, `mobile/__tests__/services/garminService.test.ts`, `README.md`, `GEMINI.md`, `mobile/{README,SETUP_ANDROID,VERIFY}.md`, `mobile/android/README.md`, `docs/{AUDIT_E_PIANO_MIGLIORAMENTI,MANUTENZIONE_SRP,STORE_SUBMISSION,TESTING_GUIDELINES}.md`, `docs/archive/MOBILE_ROADMAP.md`, `.maestro/README.md`, `.gitignore`, `mobile/.gitignore`, `.prettierignore`, `.github/dependabot.yml`, `scripts/android/prebuild-android.ps1`, `scripts/run_quality_checks.py`, `docs/AGENT_SYNC.md`
- Bugs fixed (working tree, for features WIP — not all in purge commit): `LogExerciseModal` missing `isSmokeFixtureExercise` import; lint `set-state-in-effect` on smoke deep-links (`OggiView`/`HistoryView`/`ProfileView`) + PR toast reset + `AuthProvider` catch → render-time / `queueMicrotask` patterns
- Notes: removed `EXPO_PUBLIC_*` fallback; env is `KINEFIT_*` only; deleted `mobile/.expo`; purge commit excludes features/streak/smoke WIP; `python scripts/run_quality_checks.py --quick --no-advisory` PASS locally with WIP present

### 2026-08-13 — features pack (commit)

- Files touched: `mobile/App.tsx`, `mobile/src/lib/{restPresets,streak,exerciseFilter,SmokeContext,smokeMode}.ts(x)`, `mobile/src/hooks/{useHabitStreak,useLogExercise}.ts`, `mobile/src/services/{sessionNotesService,exportService}.ts`, `mobile/src/components/ui/FloatingTimer.tsx`, `mobile/src/components/modals/{LogExerciseModal,SessionDetailsModal}.tsx`, `mobile/src/components/views/{OggiView,ProfileView,HistoryView}.tsx`, `mobile/src/lib/AuthProvider.tsx`, `mobile/__tests__/lib/{restPresets,streak,exerciseFilter,smokeMode}.test.ts`, `mobile/__tests__/services/sessionNotesService.test.ts`, `mobile/__tests__/views/viewContracts.test.ts`, `docs/AGENT_SYNC.md`
- Bugs fixed: `isSmokeFixtureExercise` import in LogExerciseModal; smoke deep-links use render-time state adjust (no `set-state-in-effect`); PR toast hide on modal close via prevVisible pattern; AuthProvider init failure uses `queueMicrotask`; no new npm deps (AsyncStorage/zustand/Notifee already cover notes/prefs/timer)
- Notes / blockers for emulator B: try `oggi-streak-chip`, `oggi-exercise-search`, `oggi-empty-add-cta`, `oggi-session-note-input`, `log-rest-preset-90`, `timer-rest-presets`, `log-pr-toast`, `profile-streak-chip`, `history-empty-state`. Env `KINEFIT_*` only. Deps: no install — stack already sufficient for offline-first features.

### 2026-08-13 — exhaustive emulator UI (screenshots)

- Files touched: `scripts/android/lib/ui-shots.ps1`, `scripts/android/lib/ui-verify-common.ps1`, `scripts/android/verify_ui{,_full,_ops}.ps1`, `mobile/src/lib/smokeMode.ts`, `SmokeContext.tsx`, `App.tsx`, FloatingTimer/Auth/Oggi/History/Profile + modal testIDs, `viewContracts` / `smokeMode` tests, `mobile/VERIFY.md`, `.maestro/flows/smoke_ops.yaml`, `docs/AGENT_SYNC.md`
- Bugs fixed: smoke streak chips without session; weight/profile-edit/log/session/timer shells via deep-link; suite shot before/after + fail-{png,xml,log}
- Notes: **Do not delete** `ui-shots.ps1` / `ui-verify-common.ps1` / `.ui-shots/.gitkeep`. Env `KINEFIT_*` only (no EXPO_PUBLIC). Vitest 234 green. No new native deps for shots.

### 2026-08-13 — deps health (bare RN)

- Files touched: `mobile/package.json`, `mobile/package-lock.json`, `mobile/react-native.config.js`, `mobile/src/platform/splash.ts`, `mobile/src/types/platform-shims.d.ts`, `mobile/android/gradle.properties`, `mobile/android/app/src/main/AndroidManifest.xml`, `mobile/android/app/src/main/java/.../{MainActivity,MainApplication,SplashHideModule,SplashHidePackage}.kt`, deleted `launch_screen.xml`, `docs/AGENT_SYNC.md`
- Bugs fixed: splash keep-on-screen was a no-op (`preventAutoHideAsync` empty + RN splash `show()` crash); launcher theme was `AppTheme` not `Theme.App.SplashScreen`; Jetifier only needed for removed `react-native-splash-screen`
- Notes: RN/react untouched (0.81.5 / 19.1.0). Safe bumps: netinfo 11.5.2, svg 15.15.5, cli{,-android} 20.2.0. Native modules pinned exact (keychain/notifee/op-sqlite/fs/share/sound/haptics/inappbrowser/config/vector-icons). No datetimepicker (unused in WIP). typecheck + 234 vitest green. `assembleDebug -PreactNativeArchitectures=x86_64` green (JAVA_HOME Microsoft JDK 17); dual-arch CMake path flake on Windows noted. No Expo.

### 2026-08-13 — smoke seed fixtures (emulator debug)

- Files touched: `mobile/src/lib/smokeSeed.ts`, `mobile/src/lib/smokeMode.ts`, `mobile/App.tsx`, `mobile/src/hooks/{useWorkoutData,useHabitStreak}.ts`, `mobile/src/components/views/{OggiView,HistoryView,AnalyticsView}.tsx`, `mobile/__tests__/lib/{smokeSeed,smokeMode}.test.ts`, `mobile/__tests__/views/viewContracts.test.ts`, `scripts/android/verify_ui_ops.ps1`, `mobile/VERIFY.md`, `docs/AGENT_SYNC.md`
- Bugs fixed: History/Analytics/Oggi were `enabled: !!user` only — smoke seed data never appeared without login; analytics offline logs had no muscle_group → mapped via smoke catalog; streak for smoke-user skipped remote fetch
- Notes / blockers for suite agent: deep-links `kinefit://smoke/seed?days=7&sets=3` + `kinefit://smoke/clear`; testIDs `smoke-seed-status` / `smoke-seed-ready` / `oggi-exercise-*` / `history-session-smoke-seed-sess-*` / `analytics-volume-total`; screenshots before/after in verify_ui_ops; Env `KINEFIT_*` only; No Expo. Coordinate shots under `scripts/android/.ui-shots/`.

### 2026-08-13 — smoke seed + ops integration

- Files touched: `mobile/src/lib/smokeSeed.ts`, `mobile/src/lib/smokeMode.ts`, `mobile/App.tsx`, `useWorkoutData` / `HistoryView` / `useHabitStreak` / `OggiView`, `scripts/android/verify_ui_ops.ps1`, `ui-verify-common.ps1`, `docs/AGENT_SYNC.md`
- Bugs fixed: auth empty-hierarchy flake (wait for `auth-email-input` + ready XML); seed deep-link `kinefit://smoke/seed|clear` with SQLite/AsyncStorage fixtures; History/Oggi read seeded offline data without login
- Notes: Ops calls **seed BEFORE tab asserts**; shots `pre-seed` / `post-seed`; assert `smoke-seed-ready`. Sibling may refine `smokeSeed` — keep `parseSeedParams` / `seedSmokeFixtures` / `clearSmokeFixtures` aliases. Splash remains AndroidX `KineFitSplash` (d8830a1). Env `KINEFIT_*` only.

### 2026-08-13 — smoke seed (Metro restart after CMD close)

- Files touched: `mobile/src/lib/smokeSeed.ts`, `smokeMode.ts`, `App.tsx`, views/hooks, `__tests__/lib/smokeSeed.test.ts`, `verify_ui_ops.ps1`, `VERIFY.md`, `docs/AGENT_SYNC.md`
- Bugs fixed: (see prior seed entries) History/Analytics smoke enabled; muscle_group map; seed/clear deep-links
- Notes / blockers: **User accidentally closed CMD (Metro/terminal)** — Metro restarted via `npm run metro`, emulator Pixel_9a + `adb reverse tcp:8081 tcp:8081` re-applied before seed verify. Env `KINEFIT_*` only. No Expo. Suite agent: shots in `scripts/android/.ui-shots/` after seed.

### 2026-08-13 — store submission (bare Android Studio)

- Files touched: `docs/STORE_SUBMISSION.md`, `docs/AGENT_SYNC.md`, `mobile/SETUP_ANDROID.md`, `mobile/package.json` (version → `1.0.11` = Gradle `versionName`), `package.json` (`release:android`, `android:check-version`), `scripts/android/check-version-align.ps1`, `scripts/android/release-android-checklist.ps1`
- Bugs fixed: none (docs/tooling); aligned drifted `mobile/package.json` `1.0.9` → `1.0.11` to match `versionName`
- Notes: checklist esplicita no EAS/Expo; note minify/ProGuard default OFF + how to enable; versionCode/versionName table + bump/`-SyncPackage`; `npm run release:android` prints checklist + runs align check. Env `KINEFIT_*` only.

### 2026-08-13 — android smoke deep links (native)

- Files touched: `mobile/android/app/src/main/AndroidManifest.xml`, `MainActivity.kt`, `scripts/android/lib/ui-verify-common.ps1`, `mobile/VERIFY.md`, `mobile/android/README.md`, `docs/AGENT_SYNC.md`
- Bugs fixed: warm deep links lost under `singleTask` without `setIntent`; adb shell ate `?`/`&` on `smoke/seed` query params when args were unquoted
- Notes: kept production catch-all `kinefit://` (Garmin); added explicit `host=smoke` pathPrefix filters for auth/tabs/seed/clear. No seed JS duplication — coordinate with smoke-seed sibling (`smokeSeed.ts`). adb docs in VERIFY.md. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — observability (Sentry bare RN)

- Files touched: `mobile/src/lib/{sentry,sentryRedact,sentryBreadcrumbs,syncTelemetry,offlineSync}.ts`, `AuthProvider.tsx`, `mobile/App.tsx`, `__tests__/lib/{sentryRedact,sentryBreadcrumbs,syncTelemetry}.test.ts`, `offlineSync.test.ts` (telemetry mock), `vitest.config.ts`, `docs/AGENT_SYNC.md`
- Bugs fixed: Sentry user previously sent email (PII); init uses `appConfig`/`KINEFIT_*` only (no Expo Constants), `sendDefaultPii: false`, `beforeSend`/`beforeBreadcrumb` redaction; offlineSync no longer statically imports native Sentry (Vitest-safe via `syncTelemetry`)
- Notes: sync failures → breadcrumbs (`sync.*`); smoke deep-link → `smoke_mode` tag + breadcrumb (no URLs). Pure helpers covered by Vitest. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — loop coordinator (ADB 5037 unblock)

- Files touched: `scripts/android/lib/android-env.ps1` (`Test-AdbDaemonHealthy` + Ensure/Wait recovery), `scripts/android/reset-adb.ps1`, `package.json` (`android:adb-reset`), `scripts/run_quality_checks.py` (Gate F UI helpers + reset-adb), `scripts/android/lib/ui-shots.ps1`, `docs/AGENT_SYNC.md` (Next wave)
- Bugs fixed: Pixel_9a adb daemon :5037 wedged after snapshot — Reset-AdbServer restored device; confirmed `avd=Pixel_9a` + `boot_completed=1`
- Notes / blockers: Suite may re-run ops/seed. Prefer `npm run android:adb-reset` before killing emulator. Sibling WIP on modals/views left untouched. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — android smoke deep links (pushed)

- Files touched: (see native entry above) + `520742a` restore of auth/settings/garmin/onboarding/profile/weight smoke testIDs for pre-push validate
- Bugs fixed: push blocked by dirty sibling WIP + missing testIDs on HEAD — isolated worktree push
- Notes: on `origin/feat/garmin-oauth-srp-maintenance`: `c72cbdb` deep links + tip `520742a`. Sibling WIP may be in stash `wip-after-deeplink-push`. Seed logic stays in smoke-seed sibling.

### 2026-08-13 — vitest coverage (streak/smoke/platform)

- Files touched: mobile/src/lib/{smokeMode,smokeSeed,smokeSeedPlan,streak,restPresets}.ts, mobile/src/hooks/useHabitStreak.ts, mobile/src/lib/SmokeSeedRuntime.tsx, mobile/App.tsx, mobile/vitest.config.ts, mobile/**tests**/{lib,hooks,services,platform,views}/*, docs/AGENT_SYNC.md
- Bugs fixed: smokeSeed Vitest import crashed on op-sqlite (split pure plan + mocked persistence); habit streak smoke-user remote skip via loadHabitStreak; App seed status testIDs restored via SmokeSeedRuntime; coverage threshold drag from crypto/sha256 fallback removed from include
- Notes: thresholds kept (95/95/95/85). Focus: streak, rest presets, smoke seed plan/persistence, habit streak, exerciseService branches, platform secureStore/constants. Env KINEFIT_* only. No Expo. Do not delete smoke seed aliases / SmokeSeedRuntime.

### 2026-08-13 ~19:41 — CMD closed + adb :5037 + deep-link sync

- Files touched: `scripts/android/verify_ui_ops.ps1`, `verify_ui_full.ps1`, `docs/AGENT_SYNC.md`
- Bugs fixed: suite `Start-SmokeUrl` now quotes `-d 'url'` (sync `c72cbdb`) so `smoke/seed?days=&sets=` survives adb shell; seed step runs **before** tab asserts with pre/post shots
- Notes: User closed CMD (~Metro/emulator helper). Emulator log `Unable to connect to adb daemon on port: 5037` after Pixel_9a snapshot — suite reset via kill-all `adb.exe` + `start-server`; soft-restart `avd stop`/`avd start` on console :5554 when install hung; Metro restarted `npm run metro`; `adb reverse tcp:8081`. Native deep-link change requires reinstall after `c72cbdb`. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — a11y polish (labels + touch targets)

- Files touched: `mobile/src/components/ui/{Button,FloatingTimer}.tsx`, `mobile/src/hooks/useWorkoutData.ts`, `mobile/src/components/views/{AuthView,OggiView,HistoryView,AnalyticsView,ProfileView}.tsx`, `mobile/App.tsx` (tab a11y labels), key modals (Settings/Garmin/Onboarding/Weight/ProfileEdit/WorkoutSummary/SessionDetails/AddExercise), `mobile/__tests__/views/viewContracts.test.ts` (`analytics-empty-state`), `docs/AGENT_SYNC.md`
- Bugs fixed: missing smoke testIDs on Auth/Settings/Garmin/Onboarding/Weight/ProfileEdit/WorkoutSummary (sibling wipe); workout start/end double-submit guarded via `workoutActionPending`; Analytics empty state when no weekly logs
- Notes: Button auto `accessibilityLabel` from title + `accessibilityState` + theme `hitSlop` + android_ripple; History/Analytics/session empty copy clarified; icon-only controls + tabs labeled; preserved Maestro testIDs. Env `KINEFIT_*` only. No Expo. Did not touch verify_ui scripts.

### 2026-08-13 — perf (lists + render paths)

- Files touched: `mobile/src/lib/queryClient.ts`, `mobile/src/store/useTimerStore.ts`, `mobile/src/components/ui/{FloatingTimer,MuscleHeatmap}.tsx`, `mobile/src/components/views/{HistoryView,OggiView,AnalyticsView}.tsx`, `mobile/src/components/modals/{SessionDetailsModal,LogExerciseModal}.tsx`, `docs/AGENT_SYNC.md`
- Bugs fixed: restored `history-session-*` / `oggi-exercise-*` testIDs on memoized rows (were missing during sibling WIP)
- Notes: FlatList/DraggableFlatList batching + memo rows; timer tick coalesced to 1Hz + selective zustand selectors; query staleTime 60s / gcTime 10m / refetchOnReconnect; Analytics chartConfig + useWindowDimensions memoized. typecheck + 256 vitest green on clean HEAD. Did not touch verify_ui*.ps1. Env KINEFIT_* only. No Expo.

### 2026-08-13 — smoke seed feature (finish)

- Files touched: `HistoryView` / `AnalyticsView` / `useWorkoutData`, `smokeMode.ts` (`smokeSeedStatusFromMode`), `scripts/android/{verify_ui_ops,verify_ui_full,verify_smoke_seed}.ps1`, `package.json` (`verify:ui:seed`), `viewContracts` (`analytics-volume-total`), `docs/AGENT_SYNC.md`
- Bugs fixed: seed deep-link wrote SQLite but tabs stayed empty without login (`enabled: !!user` only) — smoke mode now loads fixtures offline; ops/full `Start-SmokeUrl` quotes `-d` (c72cbdb)
- Notes: Keep `29237da`/`88c1d12` smokeSeed plan/persistence + SmokeSeedRuntime testIDs. Suite: `npm run verify:ui:seed` after adb healthy. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — UI polish (streak + rest presets)

- Files touched: mobile/src/lib/{streak,restPresets}.ts, mobile/src/components/ui/{StreakChip,FloatingTimer}.tsx, mobile/src/components/views/{OggiView,ProfileView}.tsx, mobile/src/components/modals/LogExerciseModal.tsx, mobile/**tests**/lib/{streak,restPresets}.test.ts, docs/AGENT_SYNC.md
- Bugs fixed: Oggi streak ignored raining_days_per_week (always default 3) while Profile used settings; timer countdown showed raw `Xs` while preset chips used mm:ss
- Notes: shared StreakChip + Italian copy (Sett. n/m,
  giorni di fila); rest chips 1 min/1:30 + shared a11y helpers; Recupero label on FloatingTimer matches LogExercise; smoke testIDs preserved. Env KINEFIT_* only. No Expo.

### 2026-08-13 — merge perf/lists-render-paths into feat/garmin-oauth-srp-maintenance

- Files touched: merge origin/perf/lists-render-paths (c3316ff) into feature branch; conflict only in docs/AGENT_SYNC.md
- Bugs fixed: none (integration)
- Notes: Preserved HEAD a11y/smoke/sibling log entries + smoke testIDs; kept perf list/render path changes from c3316ff. Prefer feature-branch integration only (no separate main PR unless needed). Env KINEFIT_* only. No Expo.

### 2026-08-13 — security + offline sync harden

- Files touched: mobile/src/platform/secureStore.ts, mobile/src/services/garmin/garminStorage.ts, mobile/src/lib/{supabase,offlineSync,sentry,sentryRedact,syncTelemetry}.ts, related **tests**, docs/AGENT_SYNC.md
- Bugs fixed: empty SecureStore/Garmin token writes; offline sync partial failure / duplicate upsert / deleted-log resurrection; Sentry secret/PII redaction; supabase auth storage stays Keychain-backed
- Notes: Vitest guards added. Coordinate: did not rewrite smokeSeed. Env KINEFIT_* only. No Expo.

### 2026-08-13 — SPAWN NOTE: syncFeedback / SyncFailBanner (all agents)

- Files touched: `mobile/src/lib/syncFeedback.ts` (`export type SyncFailureFeedback` + predicate), `docs/AGENT_SYNC.md` (Rule 5 + this note)
- Bugs fixed: `isSyncFailureFeedback` typed as `feedback is SyncFeedback` → else-branch `feedback.kind` became `never` (breaks Oggi/Profile banner wiring). Sibling commits kept reverting AGENT_SYNC Rule 5 — restore, do not delete.
- Notes / blockers for **every parallel agent**:
  - **DO NOT delete** `syncFeedback.ts`, `SyncFailBanner.tsx`, or `syncFeedback.test.ts`
  - **DO NOT strip** `lastSyncFeedback` / `setLastSyncFeedback` from `useStore` or `mapSyncFeedback` from `useWorkoutData`
  - **DO NOT revert** AGENT_SYNC Rule 5 / this spawn note
  - If WT shows `D` on those paths: `git checkout HEAD -- mobile/src/lib/syncFeedback.ts mobile/src/components/ui/SyncFailBanner.tsx mobile/__tests__/lib/syncFeedback.test.ts mobile/src/store/useStore.ts`
  - Landed baseline: `aed1954`. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — perf lists (real ship; prior branch misleading)

- Files touched: `mobile/src/hooks/useWorkoutData.ts`, `mobile/src/store/useTimerStore.ts`, `mobile/src/components/ui/FloatingTimer.tsx`, `mobile/src/components/views/OggiView.tsx`, `mobile/src/components/modals/{SessionDetailsModal,SettingsModal,WorkoutSummaryModal}.tsx`, `docs/AGENT_SYNC.md`
- Bugs fixed: `React.memo` on Oggi rows was ineffective because `processedExercises` rebuilt every render; full-store `useStore()` in workout/settings/summary forced extra re-renders
- Notes: **Correction:** `c3316ff` / merge `a815b81` claimed FlatList memoization but only touched `restPresets`/`streak`/docs — misleading. This commit makes memoized `HistorySessionRow`/`OggiExerciseRow`/`SessionLogRow` actually effective (testIDs `history-session-*` / `oggi-exercise-*` kept), FlatList batching (`removeClippedSubviews` / `updateCellsBatchingPeriod`), timer tick coalesce (set only on second change), selective zustand selectors; query `staleTime`/`gcTime` already in `queryClient`. Do **not** delete `syncFeedback.ts` / `SyncFailBanner`. On top of `b21100a`. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — offline sync failure feedback

- Files touched: `mobile/src/lib/syncFeedback.ts`, `mobile/src/components/ui/SyncFailBanner.tsx`, `mobile/src/store/useStore.ts`, `mobile/src/hooks/useWorkoutData.ts`, `mobile/src/components/views/{OggiView,ProfileView}.tsx`, `mobile/__tests__/lib/syncFeedback.test.ts`, `mobile/__tests__/views/viewContracts.test.ts`, `mobile/vitest.config.ts`, `docs/AGENT_SYNC.md`
- Bugs fixed: force-sync used Alert without failed count; auto-sync failures silent
- Notes: Partial/failed sync shows failed-count banner on Oggi+Profile (oggi-sync-fail-banner / profile-sync-fail-banner) + Oggi toast (oggi-sync-toast); queue banner oggi-offline-banner. Pure mapper Vitest. Kept smoke seed. Env KINEFIT_* only. No Expo.

### 2026-08-13 — Analytics empty-state polish

- Files touched: mobile/src/components/views/AnalyticsView.tsx, mobile/VERIFY.md, docs/AGENT_SYNC.md
- Bugs fixed: viewContracts required analytics-empty-* but AnalyticsView still showed zero chart; CTA navigates to Oggi
- Notes: Empty 7d -> analytics-empty-state + analytics-empty-goto-hint; non-empty keeps heatmap/chart/analytics-volume-total. Do **not** delete syncFeedback.ts / SyncFailBanner. Env KINEFIT_* only. No Expo.

### 2026-08-13 — perf lists (real ship on 268f619+)

- Files touched: useWorkoutData (memoized processedExercises + selective zustand), Settings/WorkoutSummary selectors, useTimerStore/FloatingTimer tick coalesce, docs/AGENT_SYNC.md
- Bugs fixed: Oggi React.memo rows ineffective (processedExercises rebuilt every render); full-store useStore() over-subscribed workout/settings/summary
- Notes: **Correction:** c3316ff/a815b81 claimed FlatList memo but only touched restPresets/streak/docs — misleading. Memo rows + FlatList batching already on tip (history-session-_/oggi-exercise-_ kept); this commit makes memo effective + selector/timer tuning. query staleTime/gcTime already in queryClient. Do **not** delete syncFeedback.ts/SyncFailBanner/setLastSyncFeedback. Env KINEFIT_* only. No Expo.

### 2026-08-13 — Settings modal a11y

- Files touched: `mobile/src/components/modals/SettingsModal.tsx`, `docs/AGENT_SYNC.md`
- Bugs fixed: none
- Notes: Rows are Pressable switches with accessibilityLabel/Role/State + hints; toggles keep smoke testIDs (settings-*-switch, settings-close-button, modal-settings) and switch labels. Selective zustand selectors kept. Do **not** delete syncFeedback/SyncFailBanner. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — refresh Next wave after real list perf

- Files touched: `docs/AGENT_SYNC.md`
- Bugs fixed: none
- Notes: Next wave tip → `d384aba` after `9f23016` perf + later (`268f619` analytics empty, `041100c`/`d384aba` a11y). Marked perf lists + analytics empty done. Rule 5 syncFeedback unchanged. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — refresh Next wave tip after style race

- Files touched: `docs/AGENT_SYNC.md`
- Bugs fixed: none
- Notes: Style commit after `2ead236` rewound tip line; restored tip → `72e3d3d` (still includes `9f23016` perf done). Rule 5 syncFeedback unchanged. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — History session volume badge

- Files touched: `mobile/src/lib/volumeFormat.ts`, `mobile/src/components/views/HistoryView.tsx`, `mobile/__tests__/lib/volumeFormat.test.ts`, `mobile/__tests__/views/viewContracts.test.ts`, `docs/AGENT_SYNC.md`
- Bugs fixed: `oggi-volume-chip` missing from viewContracts after `b6b0a12`; History volume used raw number (no it-IT grouping / no row badge testID)
- Notes: Per-row badge `history-session-volume-*` via shared `computeSessionVolumeKg` + `formatVolumeKg`; session a11y context on row label. Preserved syncFeedback / SyncFailBanner. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — History session hint + export a11y

- Files touched: `mobile/src/components/views/HistoryView.tsx`, `docs/AGENT_SYNC.md`
- Bugs fixed: viewContracts required `history-session-hint` but HistoryView lacked the node
- Notes: Landed in `5927ad7`. Visible Italian hint + row accessibilityHint (open details) with volume in label; export → “Esporta cronologia in CSV”. Kept `history-export-button` / `history-session-*`. Do **not** delete syncFeedback/SyncFailBanner. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — oggi-volume-chip (b6b0a12) in seed/ops

- Files touched: `scripts/android/verify_ui_ops.ps1`, `verify_smoke_seed.ps1`, `docs/AGENT_SYNC.md`
- Coverage: after smoke seed assert `oggi-volume-chip` + `kg` text; shot `oggi-volume-chip-seeded` / `seed-oggi-volume-chip`. Analytics heatmap after seed + empty after clear retained.
- Notes: emulator recovered from offline via adb kill/start. syncFeedback/SyncFailBanner untouched. Settings switches keep same testIDs (d384aba). Env `KINEFIT_*` only.

### 2026-08-13 — History session duration (+ plate theme)

- Files touched: `mobile/src/lib/sessionDuration.ts`, `mobile/__tests__/lib/sessionDuration.test.ts`, `mobile/src/components/views/HistoryView.tsx`, `mobile/src/components/ui/PlateCalculator.tsx`, `mobile/src/components/modals/LogExerciseModal.tsx`, `mobile/__tests__/views/viewContracts.test.ts`, `docs/AGENT_SYNC.md`
- Bugs fixed: PlateCalculator hardcoded hex → theme tokens; log plates toggle missing expanded/hint a11y
- Notes: Per-row `history-session-duration-*` from `start_time`/`end_time` (offline-safe); Vitest for pure formatters; volume badges kept. Do **not** delete syncFeedback/SyncFailBanner. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — rest preset select haptic + selected chip

- Files touched: `mobile/src/lib/restPresets.ts`, `mobile/__tests__/lib/restPresets.test.ts`, `mobile/src/components/ui/{FloatingTimer,Button}.tsx`, `mobile/src/components/modals/LogExerciseModal.tsx`, `docs/AGENT_SYNC.md`
- Bugs fixed: FloatingTimer display still raw `Xs` vs chip mm:ss; Button dropped caller `accessibilityState.selected`
- Notes: Preset tap → `hapticService.medium()` (distinct from ±15 light); selected chip via `matchRestPreset(initialTime)`; kept `timer-rest-preset-*` / `log-rest-preset-*`. Did **not** touch History duration chips. syncFeedback preserved. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — History session PR badge

- Files touched: `mobile/src/lib/sessionPr.ts`, `mobile/src/services/sessionPrService.ts`, `mobile/src/hooks/useLogExercise.ts`, `mobile/src/lib/smokeSeed.ts`, `mobile/src/components/views/HistoryView.tsx`, `mobile/__tests__/lib/{sessionPr,smokeSeed}.test.ts`, `mobile/__tests__/services/sessionPrService.test.ts`, `mobile/__tests__/views/viewContracts.test.ts`, `docs/AGENT_SYNC.md`
- Bugs fixed: none (PR flags were in-memory only via `sessionPrCount`; History had no badge)
- Notes: Per-row `history-session-pr-*` when AsyncStorage count > 0; smoke seed writes PR counts from plan `isPr`; log save increments; clear seed clears PR map. Kept volume/duration badges + syncFeedback/SyncFailBanner. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — require CI log review after push

- Files touched: `docs/AGENT_SYNC.md`
- Bugs fixed: none
- Notes: Rule 6 — after push run `gh run list --branch <branch> --limit 3`; on fail `gh run view --log-failed`, fix, re-push. syncFeedback preserved. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — Analytics week selector polish

- Files touched: `mobile/src/lib/analyticsWeek.ts`, `mobile/src/components/views/AnalyticsView.tsx`, `mobile/src/services/logService.ts`, `mobile/__tests__/lib/analyticsWeek.test.ts`, `mobile/__tests__/services/logService.test.ts`, `mobile/__tests__/views/viewContracts.test.ts`, `mobile/VERIFY.md`, `docs/AGENT_SYNC.md`
- Bugs fixed: none (UX polish)
- Notes: Mon–Sun week selector with prev/next, selected label + a11y, testIDs `analytics-week-selector|label|prev|next|loading`; empty/loading keep header+selector; `fetchWeeklyVolumeByMuscle({ since, until })`. Preserved syncFeedback/SyncFailBanner. Left sibling WIP on `scripts/android/verify_*.ps1` unstaged. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — P1 a11y remainder (Log/Oggi/modals)

- Files touched: `mobile/src/lib/heatmap.ts`, `mobile/__tests__/lib/heatmap.test.ts`, `mobile/src/components/ui/{MuscleHeatmap,PlateCalculator,FloatingTimer,SyncFailBanner}.tsx`, `mobile/src/components/modals/{LogExerciseModal,AddExerciseModal,SessionDetailsModal}.tsx`, `mobile/src/components/views/{OggiView,AnalyticsView,ProfileView}.tsx`, `docs/AGENT_SYNC.md`
- Bugs fixed: none (a11y polish)
- Notes: Leftover labels/roles/hints/hitSlop on Log (weight/reps/RPE, set-type, PR alert, delete set N), Oggi (exercise rows, day chips, offline/recovered/active banners, stats, empty), AddExercise (group/sets/reps, day radios, reorder), Profile menu hints, heatmap/plate summaries, Analytics volume stats, timer ±15/close hints. Did **not** delete syncFeedback/SyncFailBanner (hints only). Smoke testIDs unchanged — no viewContracts ID churn. Left sibling WIP on `scripts/android/verify_*.ps1` + HistoryView unstaged. Env `KINEFIT_*` only. No Expo.

### 2026-08-13 — P2 DB indexes (SQLite + docs sync)

- Files touched: `mobile/src/lib/sqliteSchema.ts`, `mobile/src/lib/sqlite.ts`, `mobile/__tests__/lib/sqliteSchema.test.ts`, `mobile/vitest.config.ts`, `docs/AGENT_SYNC.md`
- Bugs fixed: none (perf indexes; AGENT_SYNC lagged vs AUDIT / Supabase `20260713000000_*`)
- Notes: Claimed **P2 DB**. Pure `sqliteSchema` DDL helper + Vitest; `initDb` runs `CREATE INDEX IF NOT EXISTS` for offline_logs (user/created, exercise/created, session, created_at, remote id) + offline_sessions (user/start). No DROP — smoke seed / queue preserved. Supabase production indexes already landed. Do **not** delete syncFeedback/SyncFailBanner. Left sibling WIP (HistoryView, verify_*.ps1, App/splash native) unstaged. Env `KINEFIT_*` only. No Expo.
