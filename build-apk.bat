@echo off
setlocal
echo ========================================================
echo     KineFit - Health Check ^& Build APK (Android Studio)
echo ========================================================
echo.
echo Percorso ufficiale: Android Studio / Gradle (mobile\android)
echo.

echo [1/4] Dipendenze...
call npm.cmd install >nul
cd mobile
call npm.cmd install >nul
cd ..

echo.
echo [2/4] Formattazione...
call npm.cmd run format
if %errorlevel% neq 0 (
    echo [ERRORE] Formattazione fallita.
    pause
    exit /b 1
)

echo.
echo [3/4] Lint...
call npm.cmd run lint
if %errorlevel% neq 0 (
    echo [ERRORE] Linting fallito.
    pause
    exit /b 1
)

echo.
echo [4/4] Typecheck + test...
call npm.cmd run validate
if %errorlevel% neq 0 (
    echo [ERRORE] validate fallito.
    pause
    exit /b 1
)

echo.
echo Gate A-E OK.
CHOICE /C SN /M "Avviare assembleDebug locale ora?"
IF ERRORLEVEL 2 GOTO End
IF ERRORLEVEL 1 GOTO Local

:Local
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\android\assemble-debug.ps1 -SkipPrebuild
if %errorlevel% neq 0 (
    echo [ERRORE] assembleDebug fallito.
    pause
    exit /b 1
)
echo.
echo APK: mobile\android\app\build\outputs\apk\debug\app-debug.apk
echo Studio: npm run android:studio
echo Metro:  npm run metro
echo.

:End
echo Docs: mobile\SETUP_ANDROID.md
pause
endlocal
