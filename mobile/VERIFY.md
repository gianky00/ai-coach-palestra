# Checklist verifica UI — KineFit (Android Studio)

Dopo **Run ▶** su `mobile/android` (con Metro attivo: `npm run metro`) oppure `npm run android:install`.

## Policy auto-verify

- Zero login reale di produzione
- Zero OAuth Garmin
- Deep-link smoke: `kinefit://smoke/auth`, `kinefit://smoke/tabs?tab=oggi|storico|analisi|profilo`

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
| H    | verify_ui / Maestro                       |

CI = A–E. F–H locali.
