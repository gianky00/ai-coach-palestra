# Android Studio — percorso ufficiale KineFit

Il prodotto si **sviluppa, builda e installa da Android Studio**.  
La cartella versionata è [`android/`](android/) (accanto a questo file).

> Nota: il codice UI resta React Native e usa ancora alcuni moduli della famiglia Expo (SQLite, SecureStore, notifiche, …). **Non** si usa Expo Go né EAS Build come flusso principale.

## 1) Prerequisiti

| Cosa                                                   | Nota                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------- |
| [Android Studio](https://developer.android.com/studio) | Ladybug / Meerkat+                                                      |
| JDK                                                    | **17** (obbligatorio per Gradle CLI; non usare JBR Java 25 di Studio)   |
| Android SDK                                            | API 35+ come richiesto dal progetto Gradle                              |
| Node.js                                                | ≥ 22.13                                                                 |
| Emulatore UI test                                      | AVD **Pixel_9A** / **Pixel_9a** (Pixel 9a) — `npm run android:emulator` |
| Telefono (opzionale)                                   | USB debugging ON                                                        |

## 2) Setup una tantum

```powershell
# Root repo
npm install
npm run mobile:install
Copy-Item mobile\.env.example mobile\.env   # poi valorizza Supabase
```

Apri Android Studio → **File → Open** →

`C:\Users\gianc\Desktop\SCRIPT\ai-coach-palestra\mobile\android`

Attendi Gradle Sync. Imposta **Settings → Build → Gradle → Gradle JDK = 17** (non il JBR 25).  
`local.properties` viene creato in locale (gitignored).

Se manca JDK 17 sul PC:

```powershell
winget install Microsoft.OpenJDK.17
```

## 3) Ogni sessione di lavoro

```powershell
# Terminale 1 — Metro bundler (JS)
npm run metro
```

Poi in Studio: seleziona **Pixel 9a** (`Pixel_9A` / `Pixel_9a`) → **Run ▶**.

CLI equivalente:

```powershell
npm run android:emulator  # boot AVD Pixel 9a se serve
npm run android:assemble
npm run android:install   # preferisce/avvia Pixel 9a
```

## 4) Verifica qualità

Device UI: **Pixel 9a** (non Expo Go). Smoke via deep-link `kinefit://smoke/...` — zero login / zero Garmin OAuth.

```powershell
npm run gate              # A–E (format/lint/typecheck/test/coverage)
npm run android:emulator  # AVD Pixel_9A / Pixel_9a
npm run verify:ui         # smoke adb (zero login; auto-boot Pixel 9a)
npm run verify:ui:full
npm run gate:all          # include assemble + UI (Gate H → Pixel 9a)
```

Dettagli: [VERIFY.md](VERIFY.md).

## 5) Store / release

Build release firmata da Android Studio / `bundleRelease` (non EAS).  
Checklist: [../docs/STORE_SUBMISSION.md](../docs/STORE_SUBMISSION.md).

## Troubleshooting

| Sintomo                              | Fix                                                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| App bianca / “Unable to load script” | Avvia `npm run metro`                                                                                       |
| Gradle sync fail / Java 25           | Settings → Gradle JDK = **17**; `winget install Microsoft.OpenJDK.17`                                       |
| CMake/NDK path errors su Windows     | `reactNativeArchitectures=arm64-v8a` (già impostato); abilita long paths Windows                            |
| Emulatore x86                        | `.\gradlew.bat :app:assembleDebug -PreactNativeArchitectures=x86_64`                                        |
| AVD Pixel 9a mancante                | Studio Device Manager → Pixel 9a → nome `Pixel_9A`, oppure `npm run android:emulator` (serve cmdline-tools) |
