# KineFit — Play Store readiness (Android)

Stack: **bare React Native + Android Studio / Gradle** under `mobile/android`.

**Policy**

- **No EAS / Expo / managed workflow** — build and sign only via Gradle or Android Studio Signed Bundle
- Env: `KINEFIT_*` only (see `mobile/.env.example`)
- **Never commit secrets** — release keystore, passwords, `SENTRY_AUTH_TOKEN`, real `.env` values stay local / CI secrets
- Printable gate: `npm run release:android` (does **not** upload; prints checklist + version align)

```powershell
npm run release:android          # checklist + android:check-version
npm run android:check-version    # package.json == versionName; prints versionCode
npm --prefix mobile run bump     # patch +1 versionName/package + versionCode +1
```

Related: [mobile/SETUP_ANDROID.md](../mobile/SETUP_ANDROID.md) · [mobile/VERIFY.md](../mobile/VERIFY.md) · [mobile/android/README.md](../mobile/android/README.md)

---

## 1. Prerequisiti

- [ ] `npm run gate` (A–E) ok
- [ ] Migrazioni Supabase produzione applicate
- [ ] `mobile/.env` release con almeno: `KINEFIT_SUPABASE_URL`, `KINEFIT_SUPABASE_ANON_KEY`, `KINEFIT_SENTRY_DSN`
- [ ] Opzionale Garmin: `KINEFIT_GARMIN_CLIENT_ID` + secrets edge `GARMIN_CLIENT_ID` / `GARMIN_CLIENT_SECRET` (non in git)
- [ ] Versioni allineate (§ 2)
- [ ] Release **non** firmata con `debug.keystore` (§ 3)

---

## 2. Versioning (`versionName` / `versionCode`)

| Campo         | Dove                              | Ruolo                                             |
| ------------- | --------------------------------- | ------------------------------------------------- |
| `versionName` | `mobile/android/app/build.gradle` | Stringa utente / Play Store (es. `1.0.11`)        |
| `versionCode` | stesso file                       | Intero monotono obbligatorio per ogni upload Play |
| `version`     | `mobile/package.json`             | Deve essere **uguale** a `versionName`            |

- Source of truth per Play: **Gradle** (`versionName` + `versionCode`).
- Script: `scripts/android/check-version-align.ps1` (via `npm run android:check-version`).
- Bump coordinato (patch +1 su name, +1 su code):

```powershell
npm --prefix mobile run bump
# → mobile/version-bump.js aggiorna package.json + build.gradle
```

- Se solo `package.json` è driftato rispetto a Gradle:

```powershell
npm run android:check-version -- -SyncPackage
```

**Snapshot tipico (verificare prima dell’upload — i numeri cambiano dopo ogni bump):**

```powershell
npm run android:check-version
# atteso allineato: package.json version == Gradle versionName; annotare versionCode
```

Play rifiuta un upload se `versionCode` non è **maggiore** dell’ultimo pubblicato.

---

## 3. Signing (release keystore)

### Stato repo (importante)

In `mobile/android/app/build.gradle`, `signingConfigs.release` legge **opzionale** `mobile/android/keystore.properties` (gitignored).  
Se il file **esiste**, `buildTypes.release` usa quella firma; se **manca**, release cade su `debug.keystore` (smoke locale only — **non** per Play).

`debug.keystore` è tracciato in git (solo debug). Keystore di **produzione** e password **non** vanno in git.

### Opzione A — Android Studio (consigliata la prima volta)

1. Apri **`mobile/android`** in Android Studio (non la root del repo)
2. **Build → Generate Signed Bundle / APK**
3. Crea o seleziona un keystore di produzione (percorso **fuori** dal repo, o file locale gitignored)
4. Genera **Android App Bundle** (`.aab`)
5. Conserva keystore + alias + password in un password manager — perdita = impossibile aggiornare l’app con la stessa firma

### Opzione B — Gradle CLI + `keystore.properties` (no secrets in git)

1. Crea un keystore locale (esempio — **scegli path/password tuoi**, non copiare valori inventati in commit):

```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore $env:USERPROFILE\kinefit-release.keystore -alias kinefit -keyalg RSA -keysize 2048 -validity 10000
```

2. Crea `mobile/android/keystore.properties` (gitignored) con placeholder reali solo sulla macchina:

```properties
storeFile=C:\\Users\\<you>\\kinefit-release.keystore
storePassword=<from password manager>
keyAlias=kinefit
keyPassword=<from password manager>
```

3. `app/build.gradle` already wires this: loads `rootProject.file("keystore.properties")` when present, sets `signingConfigs.release` (`storeFile` via `rootProject.file(...)` — absolute path or path relative to `mobile/android/`), and points `buildTypes.release` at release (else debug). Do not commit passwords.

4. Build:

```powershell
cd mobile\android
.\gradlew.bat :app:bundleRelease
```

Artefatti tipici:

| Tipo | Path                                               |
| ---- | -------------------------------------------------- |
| AAB  | `mobile/android/app/build/outputs/bundle/release/` |
| APK  | `mobile/android/app/build/outputs/apk/release/`    |

### Checklist signing

- [ ] Keystore produzione creato e backuppato fuori dal repo
- [ ] `keystore.properties` / password **non** in git (`mobile/android/.gitignore`)
- [ ] `release` non usa `debug.keystore` per l’AAB da caricare
- [ ] Stesso keystore per tutti gli aggiornamenti futuri (o Play App Signing già accettato)

---

## 4. Minify / ProGuard / R8

Config attuale (`mobile/android/app/build.gradle` + `gradle.properties`):

| Opzione           | Default                  | Note                                                                              |
| ----------------- | ------------------------ | --------------------------------------------------------------------------------- |
| `minifyEnabled`   | **OFF**                  | Controllato da `android.enableMinifyInReleaseBuilds` (default `false` se assente) |
| `shrinkResources` | **OFF**                  | Controllato da `android.enableShrinkResourcesInReleaseBuilds`                     |
| ProGuard rules    | `app/proguard-rules.pro` | Keep per Reanimated / TurboModules già presenti                                   |

Per abilitare minify in release (opzionale — testa a fondo prima dello store):

```properties
# mobile/android/gradle.properties
android.enableMinifyInReleaseBuilds=true
# opzionale, solo con minify on:
android.enableShrinkResourcesInReleaseBuilds=true
```

Poi `bundleRelease` + smoke device. Se crashano librerie native/JS bridge, aggiungi keep in `proguard-rules.pro` — non abilitare minify il giorno dell’upload senza prova release.

---

## 5. Privacy / Data safety (Play Console)

Compila il questionario **Data safety** in modo coerente con ciò che l’app fa davvero. **Non inventare un URL live** in commit o in Console: pubblica una policy reale, poi collega lo stesso URL in Play + env.

### Privacy policy URL — hosting + Play fields

> **Repo status:** nessun URL di produzione. Template da compilare: [`docs/PRIVACY_POLICY_TEMPLATE.md`](./PRIVACY_POLICY_TEMPLATE.md).  
> Placeholder env (vuoto finché non hai una pagina HTTPS pubblica): `KINEFIT_PRIVACY_POLICY_URL=` in `mobile/.env.example`.

| Dove                                            | Campo / azione                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Play Console → **App content** → Privacy policy | URL HTTPS pubblico (obbligatorio per pubblicare)                                                                   |
| Play Console → **Store listing**                | Stesso privacy policy URL                                                                                          |
| Play Console → **Data safety**                  | Questionario allineato a dati + permessi sotto (non alla policy inventata)                                         |
| Release `mobile/.env`                           | `KINEFIT_PRIVACY_POLICY_URL=https://YOUR_DOMAIN/privacy` — abilita la riga **Informativa privacy** in Impostazioni |
| In-app                                          | `SettingsModal` → riga `settings-privacy-row` (solo se env valorizzato; apre il browser)                           |

**Dove hostare (scegline uno):** GitHub Pages / sito statico sul tuo dominio / pagina pubblica Notion / file HTML su Supabase Storage pubblico. Requisiti: HTTPS, senza login, URL stabile.

**TODO prima dell’upload:**

1. Copia il template → pubblica HTML
2. Imposta `KINEFIT_PRIVACY_POLICY_URL` solo in `.env` release (non committare valori reali se contengono altro)
3. Incolla lo **stesso** URL in App content + Store listing
4. Completa Data safety (sotto)

### Dati tipici trattati da KineFit

| Categoria (orientativa) | Esempi in app                              | Note                                                                |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Account                 | email (Supabase Auth)                      | Login / registrazione                                               |
| Fitness / health-ish    | sessioni, set, peso, streak, note sessione | Sync cloud + coda offline SQLite                                    |
| App activity / crash    | Sentry                                     | `KINEFIT_SENTRY_DSN`; `sendDefaultPii: false` + redaction in codice |
| Device / altri          | token Garmin (se collegato)                | SecureStore / edge; OAuth `kinefit://garmin-callback`               |

### Permessi (`AndroidManifest.xml`) — da dichiarare / giustificare

Audit 2026-08-13 (app code + library merges). Source of truth: `mobile/android/app/src/main/AndroidManifest.xml`.

| Permission                                   | Stato                               | Evidenza                                                           |
| -------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| `INTERNET`                                   | **kept** (app)                      | Supabase, Sentry, Garmin OAuth / InAppBrowser                      |
| `POST_NOTIFICATIONS`                         | **kept** (app)                      | Notifee rest-timer channel + `requestPermission`                   |
| `VIBRATE`                                    | **kept** (app + haptic lib)         | `react-native-haptic-feedback` + timer feedback                    |
| `ACCESS_NETWORK_STATE` / `ACCESS_WIFI_STATE` | **kept** (netinfo merge)            | `@react-native-community/netinfo` offline/online                   |
| `RECORD_AUDIO`                               | **removed**                         | Nessun mic / MediaRecorder / voice path                            |
| `READ_EXTERNAL_STORAGE`                      | **removed**                         | Export solo `CachesDirectoryPath` + Share FileProvider             |
| `WRITE_EXTERNAL_STORAGE`                     | **removed** (`tools:node="remove"`) | Strip anche merge `react-native-fs`; cache-only                    |
| `MODIFY_AUDIO_SETTINGS`                      | **removed**                         | `react-native-sound` playback only; `setCategory` iOS-only         |
| `SYSTEM_ALERT_WINDOW`                        | **removed from main**               | Nessun overlay di sistema; resta in `src/debug*` per RN            |
| `SCHEDULE_EXACT_ALARM`                       | **removed**                         | Timer Notifee = `TIMESTAMP` **senza** `alarmManager` → WorkManager |
| `USE_BIOMETRIC` / `USE_FINGERPRINT`          | **removed** (`tools:node="remove"`) | Keychain merge; SecureStore = `WHEN_UNLOCKED` senza biometric gate |

**Play Console tip:** non dichiarare microfono, file/photo library, “display over other apps”, exact alarms, o biometric unlock se il questionario chiede giustificazioni per permessi assenti dal merge release.

### Checklist privacy

- [ ] Template compilato e **pubblicato** (HTTPS) — non usare il path del repo come URL Play
- [ ] URL privacy policy pubblica inserita in Play Console (App content + scheda store)
- [ ] `KINEFIT_PRIVACY_POLICY_URL` in `.env` release → riga Impostazioni verificata a mano
- [ ] Data safety: account, workout/fitness data, crash diagnostics, eventuale Garmin — **allineato ai permessi sopra** (no mic / no external storage / no overlay)
- [ ] Indicare se i dati sono criptati in transito (HTTPS) e se l’utente può richiedere cancellazione account
- [ ] Nessuna chiave hardcoded; anon key Supabase ok lato client; service role **mai** nell’app
- [ ] Sentry: no email come user id (harden già in codice); DSN solo da env

---

## 6. Screenshot e scheda store

Play richiede screenshot **phone** (e tablet solo se dichiari supporto tablet). Orientamento app: **portrait**.

Form factor consigliato: **Pixel 9a / Pixel_9a** (stesso AVD di VERIFY) oppure device fisico ~6″ portrait — evita tablet/fold per lo slot phone.

### Cosa catturare (contenuto reale, **no** banner SMOKE)

Usa account **demo / staging** loggato. **Non** usare deep-link `kinefit://smoke/*` per asset store: il banner **SMOKE** / seed status non deve comparire.

| Slot | Tab / schermata                            | Note capture                                           |
| ---- | ------------------------------------------ | ------------------------------------------------------ |
| 1    | **Oggi** — lista esercizi / workout attivo | Tab `tab-oggi`; UI reale, streak/volume ok se presenti |
| 2    | **Log set** (peso, reps, RPE, rest)        | Apri log da esercizio reale (non `?modal=log` smoke)   |
| 3    | **Storico** — sessioni + export            | Tab `tab-storico`; sessioni demo, hint export visibile |
| 4    | **Analisi** — heatmap / volume settimana   | Tab `tab-analisi`; settimana con dati (no empty-only)  |
| 5    | **Profilo** — streak / settings            | Tab `tab-profilo`; opz. apri Impostazioni (no SMOKE)   |

### Checklist capture (store assets)

- [ ] Phone portrait, status bar pulita (no debug overlays)
- [ ] **Nessun** banner `smoke-mode-banner` / testo SMOKE / `smoke-seed-*`
- [ ] Almeno 2 screenshot phone (Play); mira a 4–8 che coprano la tabella sopra
- [ ] Stessa lingua della scheda store (IT di default)
- [ ] Non croppare in modo da tagliare tab bar o CTA principali

### Capture automatico (asset Play — **no** SMOKE)

Quando Pixel_9a è libero e sei loggato con account **demo/staging** (non deep-link smoke):

```powershell
npm run store:screenshots
# opzionale: Impostazioni + Log set se c’è un esercizio reale
npm run store:screenshots -- -IncludeSettings -IncludeLog -NoBoot
```

| Output                                           | Note                                                  |
| ------------------------------------------------ | ----------------------------------------------------- |
| `scripts/android/.store-shots/store-01-oggi.png` | Tab reali; abort se `smoke-mode-banner` / testo SMOKE |
| `store-02-storico` … `store-04-profilo`          | Tap `tab-*` — **zero** `kinefit://smoke/*`            |
| `store-05-impostazioni` / `store-06-log-set`     | Solo con `-IncludeSettings` / `-IncludeLog`           |

Script: `scripts/android/capture_store_screenshots.ps1`. PNG gitignored (resta `.gitkeep`).

### Flussi verify / ui-shots (riferimento — **non** asset store)

Gli script sotto servono a QA e fail artifacts; **non** caricarli su Play se mostrano SMOKE/seed. Non serve rieseguire l’emulatore solo per aggiornare questa checklist.

| Comando / path                                                              | Uso                                                |
| --------------------------------------------------------------------------- | -------------------------------------------------- |
| `npm run store:screenshots`                                                 | Asset Play tab reali → `.store-shots/` (no smoke)  |
| `npm run verify:ui` / `verify:ui:full` / `verify:ui:ops` / `verify:ui:seed` | Smoke UI su Pixel_9a (suite agent)                 |
| `scripts/android/lib/ui-shots.ps1`                                          | `Capture-UiShot` / `Capture-FailArtifacts`         |
| `scripts/android/.ui-shots/`                                                | `step-*.png`, `fail-*.{png,xml,log}` — **QA only** |
| [mobile/VERIFY.md](../mobile/VERIFY.md)                                     | Tab/modali/testID + deep-link smoke documentati    |

**Alternativa manuale:** Android Studio **Device Manager → screenshot**, o `adb exec-out screencap -p > store-oggi.png` su sessione loggata (stesso form factor phone).

### Scheda store (checklist)

- [ ] Titolo / descrizione breve / descrizione completa (IT; EN se pubblichi multi-lingua)
- [ ] Icona launcher (`@mipmap/ic_launcher`) coerente con branding
- [ ] Feature graphic se richiesto dal percorso pubblicazione
- [ ] Categoria Fitness / Health & fitness (o equivalente)
- [ ] Contatto sviluppatore + privacy URL (§ 5 — stesso URL pubblico)
- [ ] Rating contenuti (questionario IARC)
- [ ] Screenshot phone (§ 6) senza SMOKE

---

## 7. Build release + smoke device

```powershell
cd mobile\android
.\gradlew.bat :app:bundleRelease
# oppure
.\gradlew.bat :app:assembleRelease
```

Verifica su device fisico (install release o internal testing track):

- [ ] Login / registrazione
- [ ] Log set + timer (±15, rest presets)
- [ ] Offline → online sync (coda + eventuale fail banner)
- [ ] Export CSV
- [ ] Onboarding first-run
- [ ] Deep link produzione Garmin (`kinefit://garmin-callback`) se usi Garmin — **non** smoke host

Gate UI automatici (debug + smoke, zero login reale): vedi [VERIFY.md](../mobile/VERIFY.md) — utili pre-release ma **non** sostituiscono smoke su build firmata.

| Livello     | Comando                   | Dove            |
| ----------- | ------------------------- | --------------- |
| Gate A–E    | `npm run gate`            | CI + locale     |
| UI smoke    | `npm run verify:ui:full`  | Locale + device |
| Maestro     | `cd mobile; npm run e2e`  | Locale (CLI)    |
| Store print | `npm run release:android` | Locale          |

---

## 8. Sicurezza

- [ ] RLS con secondo utente di test
- [ ] Nessuna chiave hardcoded / service role
- [ ] `console.log` solo sotto `__DEV__`
- [ ] Keystore release e password **non** in git
- [ ] `SENTRY_AUTH_TOKEN` solo locale/CI per upload source map (vedi `mobile/.env.example`) — non committare

---

## 9. Sentry

- [ ] DSN impostato in env di release (`KINEFIT_SENTRY_DSN`)
- [ ] Crash di test visibile su Sentry (progetto da `SENTRY_ORG` / `SENTRY_PROJECT` in `.env.example`)
- [ ] Opzionale: source maps via `sentry.gradle` + `SENTRY_AUTH_TOKEN` in build release

---

## 10. Play Console upload

- [ ] AAB firmato (keystore produzione) caricato
- [ ] `versionCode` > ultimo pubblicato
- [ ] Data safety + privacy URL (§ 5)
- [ ] Screenshot e scheda (§ 6)
- [ ] Track: internal → closed → production (consigliato)
- [ ] Testing: install da Play sul device fisico prima del 100% rollout

---

## 11. Post-release

- [ ] Tag git / changelog (`v` + `versionName`)
- [ ] Monitoraggio Sentry 24–48h
- [ ] Se crash-rate alto: halt rollout / hotfix + nuovo `versionCode`

---

## Script pointers (repo)

| Script / npm                                    | Ruolo                                      |
| ----------------------------------------------- | ------------------------------------------ |
| `npm run release:android`                       | Stampa checklist + chiama version align    |
| `scripts/android/release-android-checklist.ps1` | Implementazione di `release:android`       |
| `npm run android:check-version`                 | Confronta `package.json` ↔ `versionName`   |
| `scripts/android/check-version-align.ps1`       | `-SyncPackage` riscrive package da Gradle  |
| `npm --prefix mobile run bump`                  | `mobile/version-bump.js`                   |
| `docs/PRIVACY_POLICY_TEMPLATE.md`               | Bozza policy (TODO — non URL Play)         |
| `KINEFIT_PRIVACY_POLICY_URL`                    | Env → riga Impostazioni (vuoto = nascosta) |
| `npm run store:screenshots`                     | Play PNGs → `.store-shots/` (no smoke)     |
| `scripts/android/capture_store_screenshots.ps1` | Implementazione store screenshots          |
| `mobile/VERIFY.md` + `verify:ui*`               | Smoke UI / deep-link (non store assets)    |
| `scripts/android/lib/ui-shots.ps1`              | Screencap QA / fail artifacts              |

**Non toccare** per questa checklist: logica di `verify_*.ps1` / timer App (suite emulator — altro workstream).
