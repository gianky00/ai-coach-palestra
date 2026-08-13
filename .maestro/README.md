# Maestro E2E — KineFit

I flow girano sull’APK installato da **Gradle** (Android Studio / `npm run android:install`).

## Prerequisiti

1. [Maestro CLI](https://maestro.mobile.dev/) installato
2. App installata su emulatore/device (`com.coemi.kinefit.elite`) — tipicamente emulatore **Pixel 9A** + `npm run android:install` (Metro attivo se serve il bundle debug)
3. Credenziali di **test** Supabase (non produzione)

Per smoke **senza** login usa invece gli script adb:

```powershell
npm run verify:ui
npm run verify:ui:full
npm run verify:ui:ops
npm run verify:ui:max
```

Vedi [mobile/VERIFY.md](../mobile/VERIFY.md) · setup Studio: [mobile/SETUP_ANDROID.md](../mobile/SETUP_ANDROID.md).

## Variabili ambiente (PowerShell)

```powershell
$env:MAESTRO_TEST_EMAIL = "test@example.com"
$env:MAESTRO_TEST_PASSWORD = "your-test-password"
```

## Eseguire i flow

```powershell
# Dalla cartella mobile (path corretto verso root .maestro)
cd mobile
npm run e2e

# Singolo flow (dalla root repo)
maestro test .maestro/flows/login.yaml
maestro test .maestro/flows/navigation.yaml
```

## Flow disponibili

| Flow                   | Descrizione                                       |
| ---------------------- | ------------------------------------------------- |
| `smoke_all_views.yaml` | Deep-link smoke Auth + 4 tab (zero login)         |
| `smoke_ops.yaml`       | Settings / Garmin shell / Add-exercise open+close |
| `login.yaml`           | Login email/password → tab Oggi visibile          |
| `navigation.yaml`      | Navigazione tra le 4 tab principali               |

```powershell
cd mobile
npm run e2e:smoke
npm run e2e:ops
npm run e2e:max
```

## testID usati

| testID                 | Schermata          |
| ---------------------- | ------------------ |
| `auth-email-input`     | AuthView           |
| `auth-password-input`  | AuthView           |
| `auth-submit-button`   | AuthView           |
| `tab-oggi`             | Bottom tab         |
| `tab-storico`          | Bottom tab         |
| `tab-analisi`          | Bottom tab         |
| `tab-profilo`          | Bottom tab         |
| `workout-start-button` | OggiView           |
| `oggi-add-exercise`    | OggiView           |
| `modal-add-exercise`   | AddExerciseModal   |
| `profile-settings-row` | ProfileView        |
| `modal-settings`       | SettingsModal      |
| `profile-garmin-row`   | ProfileView        |
| `modal-garmin`         | GarminConnectModal |
| `log-save-set-button`  | LogExerciseModal   |
| `smoke-mode-banner`    | App (smoke only)   |

## CI / cloud (opzionale)

I flow E2E non girano in CI GitHub (richiedono emulatore). Se serve una pipeline esterna: caricare l’APK/AAB prodotto da Gradle (`assembleDebug` / `assembleRelease` / `bundleRelease`) — non da EAS.

Gate H locale può usare Maestro con:

```powershell
.\scripts\android\verify-gates.ps1 -Gate H -UseMaestro
```
