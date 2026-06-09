@echo off
setlocal
echo ========================================================
echo     KineFit - Health Check ^& Build APK Cloud (EAS)
echo ========================================================
echo.
echo Questo script verifica che il codice sia privo di errori,
echo applica il versioning automatico e avvia la compilazione
echo sui server cloud di Expo per generare l'APK.
echo.

echo [1/5] Verifica dipendenze (Installazione se necessario)...
call npm.cmd install >nul
cd mobile
call npm.cmd install >nul
cd ..

echo.
echo [2/5] Controllo Formattazione (Prettier)...
call npm.cmd run format
if %errorlevel% neq 0 (
    echo.
    echo [ERRORE] Formattazione fallita.
    pause
    exit /b 1
)

echo.
echo [3/5] Controllo Pulizia Codice (ESLint)...
call npm.cmd run lint
if %errorlevel% neq 0 (
    echo.
    echo [ERRORE] Linting fallito. Controlla gli errori nel codice qui sopra.
    pause
    exit /b 1
)

echo.
echo [4/5] Controllo Tipi (TypeScript)...
call npm.cmd run validate
if %errorlevel% neq 0 (
    echo.
    echo [ERRORE FATALE] Typecheck fallito. Ci sono errori TypeScript da sistemare.
    pause
    exit /b 1
)

echo.
echo [5/5] Simulazione Generazione Nativa (Expo Prebuild)...
cd mobile
call npx.cmd expo prebuild --clean --platform android
if %errorlevel% neq 0 (
    echo.
    echo [ERRORE FATALE] La simulazione del prebuild nativo e' fallita. 
    echo Questo significa che EAS Build fallirebbe sicuramente.
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================================
echo [SEMAFORO VERDE] TUTTI I CONTROLLI SUPERATI! 
echo ========================================================
echo L'app e' strutturalmente sana al 100%%. 
echo La compilazione in cloud andra' a buon fine.
echo ========================================================
echo.

CHOICE /C SN /M "Vuoi avviare la compilazione dell'APK in cloud ora?"
IF ERRORLEVEL 2 GOTO End
IF ERRORLEVEL 1 GOTO Build

:Build
echo.
cd mobile
echo [1/2] Esecuzione Versioning Automatico...
call npm run bump
if %errorlevel% neq 0 (
    echo [ERRORE] Impossibile aggiornare la versione in app.json.
    pause
    exit /b 1
)

echo.
echo [2/3] Pulizia cartelle native (Anti-CNG error)...
if exist android rmdir /s /q android
if exist ios rmdir /s /q ios

echo.
echo [3/3] Avvio della Cloud Build (EAS)...
echo.
echo - Se e' la prima volta, ti verra' chiesto di accedere con la tua email (Expo).
echo - Il processo di build avverra' sui loro server.
echo - Al termine ti verra' fornito un LINK diretto per scaricare l'APK.
echo.
call npx.cmd eas-cli build -p android --profile preview

echo.
echo ========================================================
echo Fine Operazione. Se la build e' andata a buon fine, 
echo usa il link qui sopra per scaricare l'APK sul tuo PC 
echo o direttamente sul tuo smartphone!
echo ========================================================
echo.

:End
pause
endlocal
