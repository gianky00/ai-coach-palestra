# Modulo: `mobile` (KineFit)

Note agente per manutenzione. Inventario sotto i marcatori auto (rigenerato da `npm run wiki:inventory`).

## Note agente (preservate)

### Boot

- Grafo: [`wiki/kinefit/INDEX.md`](../wiki/kinefit/INDEX.md)
- Ops: [`docs/GEMINI.md`](../docs/GEMINI.md)
- Prima di editare un dominio: MCP `resolve_domain` o domain map `.cursor/kinefit-domain-map.json`

### Freeze / non cancellare

- `lib/syncFeedback.ts`, `components/ui/SyncFailBanner.tsx`, test `syncFeedback`, store `lastSyncFeedback` / `setLastSyncFeedback`
- TestID usati da Maestro / `verify:ui` (vedi wiki smoke / oggi)
- Niente restore Expo; env preferire `KINEFIT_*` (`platform/constants.ts` dual-read legacy `EXPO_PUBLIC_*`)

### Smoke

- Emulator default: **Pixel_9a**
- Deep-link: `kinefit://smoke/...` (`lib/smokeMode.ts`)
- Offline entry: `saveLogSafely` / `startWorkoutSafely` in `lib/offlineSync.ts`

### Facade stabili

- `services/garminService.ts` → `services/garmin/*`
- `lib/offlineSync.ts` — API sync pubblica

<!-- gemini:auto:start -->
<!-- Generato da scripts/generate_module_maps.mjs — non editare a mano -->

## Inventario auto — `mobile/src`

| Path | Righe | Export |
|------|-------|--------|
| `mobile/src/components/modals/AddExerciseModal.tsx` | 436 | AddExerciseModal |
| `mobile/src/components/modals/GarminConnectModal.tsx` | 399 | GarminConnectModal |
| `mobile/src/components/modals/LogExerciseModal.tsx` | 733 | LogExerciseModal |
| `mobile/src/components/modals/OnboardingModal.tsx` | 319 | OnboardingModal |
| `mobile/src/components/modals/ProfileEditModal.tsx` | 237 | ProfileEditModal |
| `mobile/src/components/modals/SessionDetailsModal.tsx` | 231 | SessionDetailsModal |
| `mobile/src/components/modals/SettingsModal.tsx` | 255 | SettingsModal |
| `mobile/src/components/modals/WeightUpdateModal.tsx` | 161 | WeightUpdateModal |
| `mobile/src/components/modals/WorkoutSummaryModal.tsx` | 139 | WorkoutSummaryModal |
| `mobile/src/components/ui/Button.tsx` | 146 | Button |
| `mobile/src/components/ui/ErrorBoundary.tsx` | 74 | ErrorBoundary |
| `mobile/src/components/ui/FloatingTimer.tsx` | 214 | FloatingTimer |
| `mobile/src/components/ui/KineFitLogo.tsx` | 26 | KineFitLogo |
| `mobile/src/components/ui/MuscleHeatmap.tsx` | 82 | MuscleHeatmap |
| `mobile/src/components/ui/PlateCalculator.tsx` | 74 | PlateCalculator |
| `mobile/src/components/ui/Screen.tsx` | 50 | Screen |
| `mobile/src/components/ui/Skeleton.tsx` | 46 | Skeleton |
| `mobile/src/components/ui/StreakChip.tsx` | 58 | StreakChip |
| `mobile/src/components/ui/SyncFailBanner.tsx` | 82 | SyncFailBanner |
| `mobile/src/components/ui/VolumeChip.tsx` | 44 | VolumeChip |
| `mobile/src/components/views/AnalyticsView.tsx` | 519 | AnalyticsView |
| `mobile/src/components/views/AuthView.tsx` | 292 | AuthView |
| `mobile/src/components/views/HistoryView.tsx` | 460 | HistoryView |
| `mobile/src/components/views/OggiView.tsx` | 999 | OggiView |
| `mobile/src/components/views/ProfileView.tsx` | 357 | ProfileView |
| `mobile/src/hooks/useAuth.ts` | 6 | useAuth |
| `mobile/src/hooks/useGarminLinkStatus.ts` | 33 | useGarminLinkStatus |
| `mobile/src/hooks/useHabitStreak.ts` | 42 | loadHabitStreak, useHabitStreak |
| `mobile/src/hooks/useLogExercise.ts` | 257 | useLogExercise |
| `mobile/src/hooks/useScrollGestureGuard.ts` | 37 | useScrollGestureGuard |
| `mobile/src/hooks/useWorkoutData.ts` | 273 | useWorkoutData |
| `mobile/src/lib/analyticsWeek.ts` | 216 | ANALYTICS_MAX_WEEK_OFFSET, AnalyticsWeekRange, clampAnalyticsWeekOffset, formatAnalyticsWeekLabel, formatAnalyticsWeekA11yLabel, resolveAnalyticsWeekRange, analyticsWeekDayKeys, AnalyticsEmptyCopy, buildAnalyticsEmptyCopy, AnalyticsWeekNavHints, analyticsWeekNavHints |
| `mobile/src/lib/AuthContext.ts` | 17 | AuthContext |
| `mobile/src/lib/AuthProvider.tsx` | 75 | AuthProvider |
| `mobile/src/lib/csv.ts` | 9 | escapeCsv |
| `mobile/src/lib/exerciseAssets.ts` | 352 | getExerciseAsset, getMuscleGroupFallback, getExerciseGuide |
| `mobile/src/lib/exerciseFilter.ts` | 45 | normalizeSearchText, searchTokens, filterExercisesByQuery |
| `mobile/src/lib/exerciseMeta.ts` | 65 | ExerciseMeta, UNKNOWN_EXERCISE_META, smokeExerciseMetaCatalog, buildExerciseMetaCatalog, resolveExerciseMeta, mergeExerciseMetaCatalogs |
| `mobile/src/lib/garminBadges.ts` | 15 | garminBadgeLabel |
| `mobile/src/lib/heatmap.ts` | 43 | getHeatmapIntensity, getHeatmapLevelLabel, formatHeatmapA11yLabel, normalizeMuscleGroup |
| `mobile/src/lib/historySessions.ts` | 142 | HistoryTrainingLog, HistorySessionRow, BuildOfflineHistoryOptions, buildOfflineHistorySessions, MergeHistoryOptions, mergeHistorySessions, collectMissingExerciseIds, enrichHistorySessionsWithExercises |
| `mobile/src/lib/offlineSessionDetails.ts` | 31 | offlineLogsAsSessionDetails |
| `mobile/src/lib/offlineSync.ts` | 371 | isDuplicateConflict, isSyncWriteOk, __resetSyncStateForTests, SyncResult, syncOfflineLogs, startWorkoutSafely, endWorkoutSafely, saveLogSafely, deleteLogSafely |
| `mobile/src/lib/profileMappers.ts` | 70 | UserSettings, UserSettingsRow, mapUserSettingsRow, mapUserSettingsToRow |
| `mobile/src/lib/queryClient.ts` | 17 | queryClient |
| `mobile/src/lib/restPresets.ts` | 49 | REST_PRESETS_SECONDS, RestPresetSeconds, formatRestPresetLabel, formatRestDurationA11y, formatRestPresetA11yLabel, isRestPreset, matchRestPreset |
| `mobile/src/lib/sentry.ts` | 84 | initSentry, setSentryUser, setSmokeModeFlag, addSyncFailureBreadcrumb, addSyncSummaryBreadcrumb |
| `mobile/src/lib/sentryBreadcrumbs.ts` | 75 | SyncFailureKind, SyncFailureBreadcrumbInput, BreadcrumbPayload, stripEmails, smokeModeTagValue, buildSmokeModeBreadcrumb, buildSyncFailureBreadcrumb, buildSyncSummaryBreadcrumb |
| `mobile/src/lib/sentryRedact.ts` | 111 | isSensitiveKey, redactString, redactSensitive, redactBreadcrumb, redactSentryEvent |
| `mobile/src/lib/sessionDuration.ts` | 40 | computeSessionDurationMins, formatSessionDurationLabel, formatSessionDurationA11y |
| `mobile/src/lib/sessionPr.ts` | 58 | PrLogLike, countSessionPrs, sessionHadPr, shouldShowSessionPrBadge, formatSessionPrLabel, formatSessionPrA11y, formatPrToastLabel, formatPrToastA11y |
| `mobile/src/lib/SmokeContext.tsx` | 15 | SmokeProvider, useSmokeMode |
| `mobile/src/lib/smokeMode.ts` | 144 | SmokeTab, SmokeModal, SmokeSeedStatus, SmokeMode, SMOKE_TAB_ROUTES, SMOKE_USER_ID, SMOKE_FIXTURE_SESSION_ID, SMOKE_FIXTURE_EXERCISE, parseSeedParams, parseSmokeUrl, isSmokeActive, isSmokeFixtureExercise, isSmokeDataMode, smokeSeedStatusFromMode |
| `mobile/src/lib/smokeSeed.ts` | 159 | (re-export), SMOKE_SEED_FLAG_KEY, SMOKE_EXERCISES_KEY, SMOKE_SEED_READY_ID, SmokeHistorySession, isSmokeSeeded, loadSmokeSeedExercises, clearSmokeSeed, seedSmokeWorkouts, fetchSmokeHistorySessions, seedSmokeFixtures, clearSmokeFixtures |
| `mobile/src/lib/smokeSeedPlan.ts` | 322 | SMOKE_ID_PREFIX, SEED_SESSION_PREFIX, SEED_LOG_PREFIX, DEFAULT_SEED_DAYS, DEFAULT_SEED_SETS, MIN_SEED_DAYS, MAX_SEED_DAYS, MIN_SEED_SETS, MAX_SEED_SETS, SmokeSeedParams, SmokeSeedOptions, SmokeSeedLogPlan, SmokeSeedSessionPlan, SmokeSeedPlan, SMOKE_EXERCISE_CATALOG, isSmokeFixtureId, clampSeedDays, clampSeedSets, parseSeedParams, getSmokeExercisesForDay, muscleGroupForSmokeExercise, buildSmokeSeedExercises, buildSmokeSeedPlan |
| `mobile/src/lib/SmokeSeedRuntime.tsx` | 89 | SmokeSeedStatusBar, useSmokeSeedEffect, smokeSeedStatusFromMode |
| `mobile/src/lib/sqlite.ts` | 178 | initDb, sqliteService |
| `mobile/src/lib/sqliteSchema.ts` | 53 | SQLITE_DB_NAME, SQLITE_PRAGMA_STATEMENTS, SQLITE_TABLE_STATEMENTS, SQLITE_INDEX_STATEMENTS, buildSqliteInitStatements, buildSqliteInitSql |
| `mobile/src/lib/streak.ts` | 135 | HabitStreak, EMPTY_HABIT_STREAK, normalizeHabitStreak, sessionDatesToKeys, startOfWeekMondayKey, computeHabitStreak, formatStreakLabel, formatStreakA11yLabel |
| `mobile/src/lib/supabase.ts` | 54 | getSupabase, supabase |
| `mobile/src/lib/syncFeedback.ts` | 138 | SyncFeedbackKind, SyncFeedback, SyncFeedbackInput, OfflineQueueCopy, SYNCING_BANNER_TEXT, SYNC_RETRY_HINT, SYNC_DISMISS_LABEL, SYNC_DISMISS_HINT, buildOfflineQueueCopy, buildSyncFeedback, mapSyncFeedback, SyncFailureFeedback, isSyncFailureFeedback |
| `mobile/src/lib/syncTelemetry.ts` | 44 | setSyncTelemetrySink, addSyncFailureBreadcrumb, addSyncSummaryBreadcrumb |
| `mobile/src/lib/utils.ts` | 111 | calculateE1RM, isPersonalRecord, DAYS, getPlatesPerSide, calculatePlates, getStartOfDay, toLocalDateKey, mergeLogsWithoutDuplicates, getDateForSelectedDay, isValidEmail |
| `mobile/src/lib/volumeFormat.ts` | 49 | VolumeLogLike, VolumeA11yContext, computeSessionVolumeKg, formatItInt, formatVolumeKg, formatVolumeA11yLabel |
| `mobile/src/platform/audio.ts` | 64 | AudioPlayer, setAudioModeAsync, createAudioPlayer |
| `mobile/src/platform/constants.ts` | 64 | PUBLIC_ENV_PREFIX, getPublicEnv, appConfig |
| `mobile/src/platform/crypto.ts` | 140 | CryptoDigestAlgorithm, CryptoEncoding, DigestAlgorithm, DigestEncoding, CryptoDigestOptions, getRandomBytesAsync, digestStringAsync |
| `mobile/src/platform/filesystem.ts` | 27 | cacheDirectory, EncodingType, EncodingTypeValue, writeAsStringAsync |
| `mobile/src/platform/haptics.ts` | 54 | ImpactFeedbackStyle, NotificationFeedbackType, impactAsync, notificationAsync |
| `mobile/src/platform/icons.tsx` | 6 | (re-export) |
| `mobile/src/platform/index.ts` | 29 | (re-export), (re-export), (re-export) |
| `mobile/src/platform/notifications.ts` | 126 | NotificationBehavior, NotificationPermissionsStatus, AndroidImportance, SchedulableTriggerInputTypes, setNotificationHandler, getNotificationHandler, getPermissionsAsync, requestPermissionsAsync, setNotificationChannelAsync, scheduleNotificationAsync, cancelScheduledNotificationAsync |
| `mobile/src/platform/secureStore.ts` | 79 | assertStorageKey, assertStorageValue, getItemAsync, setItemAsync, deleteItemAsync |
| `mobile/src/platform/sharing.ts` | 25 | SharingOptions, isAvailableAsync, shareAsync |
| `mobile/src/platform/splash.ts` | 22 | preventAutoHideAsync, hideAsync |
| `mobile/src/platform/sqlite.ts` | 45 | SQLiteDatabase, openDatabaseAsync |
| `mobile/src/platform/statusBar.tsx` | 50 | StatusBarStyle, StatusBarProps, StatusBar |
| `mobile/src/platform/webBrowser.ts` | 48 | WebBrowserAuthSessionResult, WebBrowserCompleteAuthSessionResult, maybeCompleteAuthSession, openAuthSessionAsync |
| `mobile/src/services/analyticsService.ts` | 55 | PersonalRecord, DailyVolume, SessionSummary, analyticsService |
| `mobile/src/services/exerciseService.ts` | 110 | exerciseService |
| `mobile/src/services/exportService.ts` | 162 | exportService |
| `mobile/src/services/garmin/constants.ts` | 13 | LEGACY_TOKEN_KEY, LEGACY_CLIENT_ID_KEY, GARMIN_DEMO_TOKEN, PKCE_VERIFIER_KEY, PKCE_STATE_KEY, REDIRECT_URI, AUTHORIZE_URL, GarminLinkStatus, tokenKey, clientIdKey |
| `mobile/src/services/garmin/garminApi.ts` | 74 | exchangeOAuthCode, disconnectRemote, syncRemote, fetchRecentActivities |
| `mobile/src/services/garmin/garminPkce.ts` | 63 | toBase64Url, randomBase64Url, createPkce, persistPkce, readPkceState, clearPkce, parseRedirectParams |
| `mobile/src/services/garmin/garminStorage.ts` | 122 | readToken, writeToken, deleteToken, getClientId, setClientId, clearLocalCredentials |
| `mobile/src/services/garmin/index.ts` | 146 | garminService |
| `mobile/src/services/garminService.ts` | 6 | (re-export) |
| `mobile/src/services/logService.ts` | 101 | logService |
| `mobile/src/services/notificationService.ts` | 73 | notificationService |
| `mobile/src/services/profileService.ts` | 65 | profileService |
| `mobile/src/services/sessionNotesService.ts` | 47 | sessionNotesService |
| `mobile/src/services/sessionPrService.ts` | 71 | sessionPrService |
| `mobile/src/services/sessionService.ts` | 54 | sessionService |
| `mobile/src/services/soundService.ts` | 67 | hapticService, soundService |
| `mobile/src/store/useStore.ts` | 74 | useStore |
| `mobile/src/store/useTimerStore.ts` | 75 | useTimerStore |
| `mobile/src/theme.ts` | 70 | colors, space, radius, typography, hitSlop, theme, Theme |
| `mobile/src/types/database.types.ts` | 444 | Json, Database, Tables, TablesInsert, TablesUpdate, Enums, CompositeTypes, Constants |
| `mobile/src/types/index.ts` | 97 | Exercise, TrainingLog, WorkoutSession, WorkoutSummary, SessionData, ExerciseOption, ProgressionData, SessionLogDetail, WeeklyMuscleVolumeLog, OfflineLog |

## Inventario auto — `supabase/functions`

| Path | Righe | Export |
|------|-------|--------|
| `supabase/functions/garmin/actions/disconnect.ts` | 27 | handleDisconnect |
| `supabase/functions/garmin/actions/exchange.ts` | 34 | handleExchange |
| `supabase/functions/garmin/actions/sync.ts` | 91 | mapGarminActivityRow, handleSync |
| `supabase/functions/garmin/garminClient.ts` | 55 | GARMIN_TOKEN_URL, GARMIN_USER_ID_URL, GARMIN_DEREGISTER_URL, GARMIN_ACTIVITIES_URL, GarminTokenResponse, garminTokenRequest, fetchGarminUserId |
| `supabase/functions/garmin/http.ts` | 18 | corsHeaders, json, requireEnv |
| `supabase/functions/garmin/index.ts` | 47 | — |
| `supabase/functions/garmin/tokens.ts` | 57 | upsertTokens, getValidAccessToken |

---
Knowledge graph: [`wiki/kinefit/INDEX.md`](../wiki/kinefit/INDEX.md). Ops: [`docs/GEMINI.md`](../docs/GEMINI.md).
<!-- gemini:auto:end -->

