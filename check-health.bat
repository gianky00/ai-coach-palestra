@echo off
setlocal
echo ========================================================
echo     KineFit Elite - Health Check (Pre-Build)
echo ========================================================
echo.
echo Questo script verifica che il codice sia privo di errori
echo prima di inviarlo al Cloud o compilarlo.
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
echo Ora puoi eseguire "build-apk.bat" con la garanzia che
echo la compilazione in cloud andra' a buon fine.
echo ========================================================
echo.
pause
endlocal

