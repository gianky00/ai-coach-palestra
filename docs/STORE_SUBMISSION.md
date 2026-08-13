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

In `mobile/android/app/build.gradle`, `release` punta ancora a `signingConfigs.debug` (`debug.keystore`).  
Questo va bene per smoke locale; **non** per Play Store / internal testing “production-like”.

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

3. In `app/build.gradle`, aggiungi un `signingConfigs.release` che legge quel file **solo se esiste**, e falla puntare `buildTypes.release.signingConfig` a release (non debug). Non committare password. Pattern tipico:

```gradle
// Illustrative — wire locally; do not commit real passwords
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }
    }
    buildTypes {
        release {
            // Prefer release when properties exist; otherwise keep debug for local-only
            if (keystorePropertiesFile.exists()) {
                signingConfig signingConfigs.release
            }
        }
    }
}
```

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

Compila il questionario **Data safety** in modo coerente con ciò che l’app fa davvero. Non inventare URL o policy: publica una privacy policy reale prima dell’upload.

### Dati tipici trattati da KineFit

| Categoria (orientativa) | Esempi in app                              | Note                                                                |
| ----------------------- | ------------------------------------------ | ------------------------------------------------------------------- |
| Account                 | email (Supabase Auth)                      | Login / registrazione                                               |
| Fitness / health-ish    | sessioni, set, peso, streak, note sessione | Sync cloud + coda offline SQLite                                    |
| App activity / crash    | Sentry                                     | `KINEFIT_SENTRY_DSN`; `sendDefaultPii: false` + redaction in codice |
| Device / altri          | token Garmin (se collegato)                | SecureStore / edge; OAuth `kinefit://garmin-callback`               |

### Permessi dichiarati (`AndroidManifest.xml`) — da dichiarare / giustificare

| Permission                                                                 | Uso tipico in app                                                                                                           |
| -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `INTERNET`                                                                 | Supabase, Sentry, Garmin                                                                                                    |
| `POST_NOTIFICATIONS`                                                       | Timer / reminder (Notifee)                                                                                                  |
| `VIBRATE`                                                                  | Haptic / timer                                                                                                              |
| `SCHEDULE_EXACT_ALARM`                                                     | Timer rest                                                                                                                  |
| `RECORD_AUDIO` / storage / `SYSTEM_ALERT_WINDOW` / `MODIFY_AUDIO_SETTINGS` | Presenti in manifest — **verificare** se ancora necessari prima dello store; rimuovere se unused riduce domande Data safety |

### Checklist privacy

- [ ] URL privacy policy pubblica (hosting tuo) inserita in Play Console + scheda store
- [ ] Data safety: account, workout/fitness data, crash diagnostics, eventuale Garmin
- [ ] Indicare se i dati sono criptati in transito (HTTPS) e se l’utente può richiedere cancellazione account
- [ ] Nessuna chiave hardcoded; anon key Supabase ok lato client; service role **mai** nell’app
- [ ] Sentry: no email come user id (harden già in codice); DSN solo da env

---

## 6. Screenshot e scheda store

Play richiede screenshot phone (e tablet se supportato). Orientamento app: **portrait**.

### Cosa catturare (contenuto reale, non smoke banner)

Preferisci account di **demo / staging**, non deep-link `kinefit://smoke/*` (banner SMOKE non va in store).

| Slot | Schermata                                  |
| ---- | ------------------------------------------ |
| 1    | Oggi — lista esercizi / workout attivo     |
| 2    | Log set (peso, reps, RPE, rest presets)    |
| 3    | Storico — sessioni + export hint           |
| 4    | Analisi — heatmap / volume settimana       |
| 5    | Profilo — streak / settings / Garmin shell |

### Come scattare (locale)

- Device fisico o emulator **Pixel_9a** (stesso AVD di VERIFY), UI reale loggata
- Oppure Android Studio **Device Manager → screenshot**
- Directory smoke UI (`scripts/android/.ui-shots/`) è per **fail artifacts** di verify — **non** riusarla come asset store se mostra banner SMOKE / seed

### Scheda store (checklist)

- [ ] Titolo / descrizione breve / descrizione completa (IT; EN se pubblichi multi-lingua)
- [ ] Icona launcher (`@mipmap/ic_launcher`) coerente con branding
- [ ] Feature graphic se richiesto dal percorso pubblicazione
- [ ] Categoria Fitness / Health & fitness (o equivalente)
- [ ] Contatto sviluppatore + privacy URL
- [ ] Rating contenuti (questionario IARC)

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

| Script / npm                                    | Ruolo                                     |
| ----------------------------------------------- | ----------------------------------------- |
| `npm run release:android`                       | Stampa checklist + chiama version align   |
| `scripts/android/release-android-checklist.ps1` | Implementazione di `release:android`      |
| `npm run android:check-version`                 | Confronta `package.json` ↔ `versionName`  |
| `scripts/android/check-version-align.ps1`       | `-SyncPackage` riscrive package da Gradle |
| `npm --prefix mobile run bump`                  | `mobile/version-bump.js`                  |
| `mobile/VERIFY.md`                              | Smoke UI / deep-link (non store assets)   |

**Non toccare** per questa checklist: `verify_*.ps1` (suite emulator — altro workstream).
