# KineFit — Checklist pubblicazione Store (Android)

> **Bare React Native + Android Studio / Gradle** su `mobile/android`.  
> **No EAS, no Expo, no managed workflow.** Build e firma solo locale (`bundleRelease` / Signed Bundle).

## 1. Prerequisiti

- [ ] `npm run gate` (A–E) ok
- [ ] Migrazioni Supabase produzione applicate
- [ ] `mobile/.env` / secrets di release: `KINEFIT_SUPABASE_URL`, `KINEFIT_SUPABASE_ANON_KEY`, `KINEFIT_SENTRY_DSN`
- [ ] Versioni allineate (vedi § Versioning)

```powershell
npm run release:android          # stampa checklist + check versioni
# oppure solo:
npm run android:check-version
```

## 2. Versioning (`versionName` / `versionCode`)

| Campo         | Dove                              | Ruolo                                             |
| ------------- | --------------------------------- | ------------------------------------------------- |
| `versionName` | `mobile/android/app/build.gradle` | Stringa utente / Play Store (es. `1.0.11`)        |
| `versionCode` | stesso file                       | Intero monotono obbligatorio per ogni upload Play |
| `version`     | `mobile/package.json`             | Deve essere **uguale** a `versionName`            |

- Source of truth per Play: **Gradle** (`versionName` + `versionCode`).
- Bump coordinato (patch +1 su name, +1 su code):

```powershell
npm --prefix mobile run bump
```

- Se solo `package.json` è driftato rispetto a Gradle:

```powershell
npm run android:check-version -- -SyncPackage
```

## 3. Build release locale

1. Apri **`mobile/android`** in Android Studio (vedi [SETUP_ANDROID.md](../mobile/SETUP_ANDROID.md)) — non la root del repo
2. Configura **signing release** con keystore di produzione (non lasciare `signingConfigs.debug` sulla build store)
3. **Build → Generate Signed Bundle / APK** oppure:

```powershell
cd mobile\android
.\gradlew.bat :app:bundleRelease
# oppure
.\gradlew.bat :app:assembleRelease
```

Artefatti tipici:

- AAB: `mobile/android/app/build/outputs/bundle/release/`
- APK: `mobile/android/app/build/outputs/apk/release/`

Verifica su device fisico (install release o internal testing):

- [ ] Login / registrazione
- [ ] Log set + timer
- [ ] Offline → online sync
- [ ] Export CSV
- [ ] Onboarding first-run

## 4. Minify / ProGuard / R8

Config attuale (`mobile/android/app/build.gradle` + `gradle.properties`):

| Opzione           | Default                  | Note                                                                              |
| ----------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `minifyEnabled`   | **OFF**                  | Controllato da `android.enableMinifyInReleaseBuilds` (default `false` se assente) |
| `shrinkResources` | **OFF**                  | Controllato da `android.enableShrinkResourcesInReleaseBuilds`                     |
| ProGuard rules    | `app/proguard-rules.pro` | Keep per Reanimated / TurboModules già presenti                                   |

Per abilitare minify in release (opzionale, testa a fondo prima dello store):

```properties
# mobile/android/gradle.properties
android.enableMinifyInReleaseBuilds=true
# opzionale, solo con minify on:
android.enableShrinkResourcesInReleaseBuilds=true
```

Poi `bundleRelease` + smoke device. Se crashano librerie native/JS bridge, aggiungi keep in `proguard-rules.pro` — non abilitare minify il giorno dell’upload senza prova release.

## 5. Sicurezza

- [ ] RLS con secondo utente di test
- [ ] Nessuna chiave hardcoded
- [ ] `console.log` solo sotto `__DEV__`
- [ ] Keystore release e password **non** in git

## 6. Sentry

- [ ] DSN impostato in env di release (`KINEFIT_SENTRY_DSN`)
- [ ] Crash di test visibile su Sentry

## 7. Test automatizzati

| Livello  | Comando                  | Dove            |
| -------- | ------------------------ | --------------- |
| Gate A–E | `npm run gate`           | CI + locale     |
| UI smoke | `npm run verify:ui:full` | Locale + device |
| Maestro  | `cd mobile; npm run e2e` | Locale          |

## 8. Play Store

- [ ] AAB firmato (keystore produzione) caricato su Play Console
- [ ] Privacy policy / Data safety
- [ ] Screenshot e scheda store

## 9. Post-release

- [ ] Tag git / changelog
- [ ] Monitoraggio Sentry 24–48h
