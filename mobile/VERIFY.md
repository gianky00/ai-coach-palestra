# Checklist verifica UI — KineFit (Android Studio)

Stack: **bare React Native** (Metro + Gradle in `mobile/android`). Non usare Expo Go / EAS per la verifica UI.

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
- Deep-link smoke: `kinefit://smoke/auth`, `kinefit://smoke/tabs?tab=oggi|storico|analisi|profilo`
- Non usare Expo Go — solo adb + Gradle install + deep-link / Maestro

## Auth / Tab / Ops smoke

- [ ] Banner **SMOKE** + **KINEFIT** su `smoke/auth`
- [ ] Tab shell su `smoke/tabs?tab=…` (Oggi / Cronologia / Analisi / Profilo)
- [ ] testID tab: `tab-oggi`, `tab-storico`, `tab-analisi`, `tab-profilo`
- [ ] Settings modal open/close da `profile-settings-row` → `modal-settings`
- [ ] Garmin modal shell open/close (no OAuth) da `profile-garmin-row` → `modal-garmin`
- [ ] Add-exercise modal open/close da `oggi-add-exercise` → `modal-add-exercise`
- [ ] History markers: `history-search-input`, `history-export-button`

## Suite automatica (max)

```powershell
# Gate codice
npm run gate              # A–E
npm run mobile:test       # Vitest incl. viewContracts + platform facades
npm run mobile:test:coverage

# UI adb (Pixel 9a)
npm run verify:ui
npm run verify:ui:full    # Auth + 4 tab
npm run verify:ui:ops     # tab + modali settings/garmin-shell/add-exercise + history markers
npm run verify:ui:max     # full + ops

# APK / gate pesanti
npm run gate:apk          # F + G assembleDebug
npm run gate:all          # + H UI

# Maestro (device + APK)
cd mobile
npm run e2e:smoke         # tutte le viste
npm run e2e:ops           # ops modali
npm run e2e:max           # smoke + ops
```

**Runner unico (Python):** dalla root del repo, `python run_quality_checks.py` (o `run_quality_checks.bat`) esegue i gate con report PASS/FAIL in `logs/quality_report.log`. Default/`--quick` = A–E + F light (come CI); `--full` aggiunge assembleDebug e UI Pixel 9A (`verify:ui:full`); `--skip-ui` / `--skip-apk` escludono H o G.

Dopo UI max locale:

```powershell
python run_quality_checks.py --quick --no-advisory
npm run verify:ui:max
```

Shot in `scripts/android/.ui-shots/`.

### Maestro (account test — solo login.yaml / navigation.yaml)

```powershell
$env:MAESTRO_TEST_EMAIL = "test@example.com"
$env:MAESTRO_TEST_PASSWORD = "secret"
cd mobile; npm run e2e
```

Smoke/ops Maestro **non** richiedono credenziali.

## Solo manuale

- [ ] Login test → allenamento → offline/sync
- [ ] Garmin OAuth completo
- [ ] `bundleRelease` firmato + store

## Gate

| Gate | Cosa                                      |
| ---- | ----------------------------------------- |
| A–E  | format, lint, typecheck, vitest, coverage |
| F    | `mobile/android` versionato presente      |
| G    | `assembleDebug`                           |
| H    | verify_ui / Maestro su Pixel 9a           |

CI = A–F light (`npm run quality` / GitHub Actions). G–H locali (SDK / Pixel 9a).
