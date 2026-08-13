# KineFit — Checklist pubblicazione Store (Android)

> Build e firma da **Android Studio / Gradle** su `mobile/android`.  
> Percorso primario: locale (`bundleRelease` / Signed Bundle). **Niente EAS Build** come flusso store.

## 1. Prerequisiti

- [ ] `npm run gate` (A–E) ok
- [ ] Migrazioni Supabase produzione applicate
- [ ] `mobile/.env` / CI secrets: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_SENTRY_DSN` (naming env client; non Expo Go)
- [ ] `version` / `versionCode` allineati in `app.config.ts` e nel progetto Gradle `mobile/android`

## 2. Build release locale

1. Apri `mobile/android` in Android Studio (vedi [SETUP_ANDROID.md](../mobile/SETUP_ANDROID.md))
2. Configura **signing** (keystore) in `app/build.gradle` / Studio Signing
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

## 3. Sicurezza

- [ ] RLS con secondo utente di test
- [ ] Nessuna chiave hardcoded
- [ ] `console.log` solo sotto `__DEV__`

## 4. Sentry

- [ ] DSN impostato in env di release
- [ ] Crash di test visibile su Sentry

## 5. Test automatizzati

| Livello  | Comando                  | Dove            |
| -------- | ------------------------ | --------------- |
| Gate A–E | `npm run gate`           | CI + locale     |
| UI smoke | `npm run verify:ui:full` | Locale + device |
| Maestro  | `cd mobile; npm run e2e` | Locale          |

## 6. Play Store

- [ ] AAB firmato caricato su Play Console
- [ ] Privacy policy / Data safety
- [ ] Screenshot e scheda store

## 7. Post-release

- [ ] Tag git / changelog
- [ ] Monitoraggio Sentry 24–48h
