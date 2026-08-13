# Checklist verifica UI — KineFit (Android Studio)

Stack: **bare React Native** (Metro + Gradle in `mobile/android`). Non usare Expo Go / EAS per la verifica UI.

Dopo **Run ▶** su `mobile/android` (con Metro attivo: `npm run metro`) oppure `npm run android:install`.

**Device UI ufficiale:** emulatore AVD **Pixel_9A** / **Pixel_9a** (Pixel 9a). Gli script `verify:ui`, `verify:ui:full`, `android:install` e Gate H lo selezionano o lo avviano se nessun device è online.

```powershell
npm run android:emulator   # crea (se possibile) + boot Pixel 9a
npm run metro              # bundler JS (serve per APK debug)
```

## Policy auto-verify

- Zero login reale di produzione
- Zero OAuth Garmin
- Deep-link smoke: `kinefit://smoke/auth`, `kinefit://smoke/tabs?tab=oggi|storico|analisi|profilo`
- Non usare Expo Go — solo adb + Gradle install + deep-link / Maestro

## Auth / Tab smoke

- [ ] Banner **SMOKE** + **KINEFIT** su `smoke/auth`
- [ ] Tab shell su `smoke/tabs?tab=…` (Cronologia / Analisi / Profilo)
- [ ] testID tab: `tab-oggi`, `tab-storico`, `tab-analisi`, `tab-profilo`

## Suite automatica

```powershell
npm run gate              # A–E
npm run mobile:test       # 100+ test incl. viewContracts + bugFinding
npm run verify:ui
npm run verify:ui:full
npm run gate:apk          # F + G assembleDebug
npm run gate:all          # + H UI

# Maestro smoke tutte le viste (device + APK)
cd mobile; npm run e2e:smoke
```

**Runner unico (Python):** dalla root del repo, `python run_quality_checks.py` (o `run_quality_checks.bat`) esegue i gate con report PASS/FAIL in `logs/quality_report.log`. Default/`--quick` = A–E + F light (come CI); `--full` aggiunge assembleDebug e UI Pixel 9A (`verify:ui:full`); `--skip-ui` / `--skip-apk` escludono H o G.

Shot in `scripts/android/.ui-shots/`.

### Maestro (account test)

```powershell
$env:MAESTRO_TEST_EMAIL = "test@example.com"
$env:MAESTRO_TEST_PASSWORD = "secret"
cd mobile; npm run e2e
```

## Solo manuale

- [ ] Login test → allenamento → offline/sync
- [ ] Garmin OAuth
- [ ] `bundleRelease` firmato + store

## Gate

| Gate | Cosa                                      |
| ---- | ----------------------------------------- |
| A–E  | format, lint, typecheck, vitest, coverage |
| F    | `mobile/android` versionato presente      |
| G    | `assembleDebug`                           |
| H    | verify_ui / Maestro su Pixel 9a           |

CI = A–F light (`npm run quality` / GitHub Actions). G–H locali (SDK / Pixel 9a).
