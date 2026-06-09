@echo off
setlocal
echo ========================================================
echo     KineFit Elite - Build APK Cloud (EAS)
echo ========================================================
echo.
echo Dato che Windows blocca la compilazione locale a causa dei 
echo percorsi troppo lunghi, questo script avviera' la 
echo compilazione sui server cloud di Expo (gratuito).
echo.
echo Verra' generato un APK perfetto senza alcun limite di sistema!
echo.
echo [1/3] Navigazione nella cartella mobile...
cd mobile
if %errorlevel% neq 0 (
    echo [ERRORE] Impossibile trovare la cartella mobile.
    pause
    exit /b 1
)

echo.
echo [2/3] Avvio della Cloud Build (EAS)...
echo.
echo - Se e' la prima volta, ti verra' chiesto di accedere con la tua email (Expo).
echo - Il processo di build avverra' sui loro server.
echo - Al termine ti verra' fornito un LINK diretto per scaricare l'APK.
echo.
call npx.cmd eas build -p android --profile preview

echo.
echo [3/3] Fine Operazione.
echo ========================================================
echo Se la build e' andata a buon fine, usa il link qui sopra
echo per scaricare l'APK sul tuo PC o direttamente sul tuo
echo smartphone!
echo ========================================================
echo.
pause
endlocal


