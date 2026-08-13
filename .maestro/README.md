# Maestro E2E — KineFit

I flow girano sull’APK installato da **Gradle** (Android Studio / `npm run android:install`).

Device UI ufficiale: emulatore AVD **Pixel_9a** (vedi [mobile/VERIFY.md](../mobile/VERIFY.md)).

## Prerequisiti

1. **Java 17+** con `JAVA_HOME` impostato (`java -version`)
2. **Maestro CLI** sul PATH — [install docs ufficiali](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli)
3. App installata su emulatore/device (`com.coemi.kinefit.elite`) — tipicamente **Pixel_9a** + `npm run android:install` (Metro attivo per debug bundle)
4. Credenziali di **test** Supabase solo per `login.yaml` / `navigation.yaml` (non produzione)

Check rapido (sempre exit 0; stampa SKIP se manca CLI):

```powershell
npm run maestro:check
# oppure
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/check-maestro.ps1
```

`npm run e2e:*` (root o `mobile/`) passa da `scripts/run-maestro.ps1`: risolve Maestro da PATH o `C:\maestro\bin` / `%USERPROFILE%\.maestro\bin`, e se manca stampa **SKIP** (exit 0). Gate H con `-UseMaestro` usa `-FailIfMissing`. Smoke **senza** login resta sugli script adb:

```powershell
npm run verify:ui
npm run verify:ui:full
npm run verify:ui:ops
npm run verify:ui:max
```

Vedi [mobile/VERIFY.md](../mobile/VERIFY.md) · setup Studio: [mobile/SETUP_ANDROID.md](../mobile/SETUP_ANDROID.md) · sync: [docs/AGENT_SYNC.md](../docs/AGENT_SYNC.md).

## Install Windows (native) — PATH

Fonte: [How to install Maestro CLI](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli) (tab **Windows**). Non usare il one-liner `curl | bash` su PowerShell nativo (è per macOS/Linux/WSL).

1. Scarica l’ultimo [maestro.zip](https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip).
2. Estrai in una cartella stabile, es. `C:\maestro` (il binario sta in `C:\maestro\bin`).
3. Aggiungi `C:\maestro\bin` al **User PATH**. In PowerShell (consigliato — evita `%PATH%` non espanso / truncate di `setx`):

```powershell
$maestroBin = 'C:\maestro\bin'
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath -notlike "*$maestroBin*") {
  [Environment]::SetEnvironmentVariable('Path', "$userPath;$maestroBin", 'User')
}
$env:Path = "$env:Path;$maestroBin"   # sessione corrente
```

Alternativa documentata da Maestro (CMD-style; dopo `setx` **riavvia** il terminale):

```powershell
# Come da docs Maestro — preferisci il blocco Environment sopra se sei in PowerShell
cmd /c 'setx PATH "%PATH%;C:\maestro\bin"'
```

4. Riavvia il terminale / IDE, poi verifica:

```powershell
maestro --help
npm run maestro:check
```

**WSL:** solo se strettamente necessario — Maestro lo sconsiglia rispetto a Windows nativo. Setup lungo (ADB bridge + `--host`) in [stessa pagina docs](https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli) tab **Windows (WSL)**.

## npm scripts `e2e:*` (root o `mobile/`)

Wrapper: `scripts/run-maestro.ps1` (suite → flow paths; SKIP exit 0 se CLI assente).

| Script      | Suite wrapper     | Login?                  |
| ----------- | ----------------- | ----------------------- |
| `e2e`       | `all` (dir flows) | Sì per login/navigation |
| `e2e:smoke` | `smoke`           | No (deep-link smoke)    |
| `e2e:ops`   | `ops`             | No                      |
| `e2e:max`   | `max`             | No                      |

Helpers: `npm run maestro:check` → `scripts/check-maestro.ps1` · runner → `scripts/run-maestro.ps1`.

## Run contro Pixel_9a

```powershell
# Terminale 1 — Metro (debug APK)
npm run metro

# Terminale 2 — device + install + Maestro
npm run android:emulator          # avvia / crea Pixel_9a se serve
adb reverse tcp:8081 tcp:8081
npm run android:install
npm run maestro:check             # OK o SKIP (install guide)
npm run e2e:smoke                 # Auth + 4 tab via deep-link (root)
npm run e2e:ops                   # Settings / Garmin shell / add-exercise
# oppure
npm run e2e:max
```

Credenziali solo per flow login / navigation (suite `all`):

```powershell
$env:MAESTRO_TEST_EMAIL = "test@example.com"
$env:MAESTRO_TEST_PASSWORD = "your-test-password"
npm run e2e
```

Singolo flow / suite esplicita:

```powershell
.\scripts\run-maestro.ps1 -Suite login
.\scripts\run-maestro.ps1 -Suite navigation
.\scripts\run-maestro.ps1 -Flows .maestro/flows/smoke_all_views.yaml
# oppure raw (se maestro è sul PATH):
maestro test .maestro/flows/smoke_all_views.yaml
```

## Flow disponibili

| Flow                   | Descrizione                                       |
| ---------------------- | ------------------------------------------------- |
| `smoke_all_views.yaml` | Deep-link smoke Auth + 4 tab (zero login)         |
| `smoke_ops.yaml`       | Settings / Garmin shell / Add-exercise open+close |
| `login.yaml`           | Login email/password → tab Oggi visibile          |
| `navigation.yaml`      | Navigazione tra le 4 tab principali               |

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
