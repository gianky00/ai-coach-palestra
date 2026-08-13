# KineFit — progetto Android Studio

**Apri questa cartella** (`mobile/android`) in Android Studio — non la root del repo.

## Workflow quotidiano

1. Terminale (bundler JS), dalla root repo:

```powershell
npm run metro
```

2. Android Studio → device **Pixel 9a** (`Pixel_9A` / `Pixel_9a`) → **Run ▶**

Oppure tutto da CLI:

```powershell
npm run android:emulator  # boot Pixel 9a
npm run android:install   # assemble + install (preferisce Pixel 9a)
```

APK debug: `app/build/outputs/apk/debug/app-debug.apk`

## Cosa non fare

- Non cancellare questa cartella (è il progetto nativo versionato)
- Non editare a caso file generati da autolinking senza commit chiaro

## Regenerare nativi (raro)

Solo dopo aver aggiunto/rimosso moduli nativi:

```powershell
npm run android:prebuild
```

## Deep links

- Production: catch-all `kinefit://` (e.g. Garmin `kinefit://garmin-callback`)
- Smoke (explicit host+pathPrefix): `kinefit://smoke/auth|tabs|seed|clear`
- Warm VIEW intents: `MainActivity.onNewIntent` → `setIntent` + RN Linking

adb examples (quote for `?`/`&`): see [../VERIFY.md](../VERIFY.md).

## Verifica

Vedi [../VERIFY.md](../VERIFY.md) e [../SETUP_ANDROID.md](../SETUP_ANDROID.md).
