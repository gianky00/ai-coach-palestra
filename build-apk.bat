@echo off
setlocal
echo ========================================================
echo     KineFit Elite - Build APK Locale (Release)
echo     [WORKAROUND: Unita' Virtuale X: per percorsi lunghi]
echo ========================================================
echo.

echo [1/5] Configurazione variabili d'ambiente...
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
echo.

echo [2/5] Creazione unita' virtuale X: per accorciare i percorsi...
:: Rimuove X: se esiste gia'
subst X: /D >nul 2>&1
:: Mappa la cartella corrente al disco X:
subst X: "%CD%"
if %errorlevel% neq 0 (
    echo [ERRORE] Impossibile creare l'unita' virtuale X:.
    pause
    exit /b 1
)

echo [3/5] Preparazione ambiente e navigazione...
:: Passiamo al disco X:
X:
cd \mobile\android
if %errorlevel% neq 0 (
    echo [ERRORE] Impossibile trovare la cartella mobile\android sul disco X:.
    C:
    subst X: /D
    pause
    exit /b 1
)

echo.
echo [4/5] Avvio della compilazione con Gradle (assembleRelease)...
echo Questa operazione richiedera' la connessione a Internet e potrebbe impiegare diversi minuti.
echo I log completi della compilazione vengono salvati in: builds\build.log
if not exist "..\..\builds" mkdir "..\..\builds"

echo - Pulizia cache precedente in corso...
call gradlew.bat clean > "..\..\builds\build.log" 2>&1

echo - Compilazione APK in corso...
call gradlew.bat assembleRelease >> "..\..\builds\build.log" 2>&1

if %errorlevel% neq 0 (
    echo.
    echo [ERRORE FATALE] La compilazione e' fallita.
    echo Ho salvato il traceback dettagliato dell'errore nel file:
    echo -^> builds\build.log
    echo Fornisci il contenuto di questo file all'IA per analizzare il problema.
    C:
    subst X: /D
    pause
    exit /b 1
)

echo.
echo [5/5] Raccolta e spostamento dell'APK...
C:
cd "%~dp0"
if not exist "builds" mkdir builds
copy /y "X:\mobile\android\app\build\outputs\apk\release\app-release.apk" "builds\KineFit-Elite-Release.apk" >nul

:: Rimuove il drive virtuale
subst X: /D

if %errorlevel% neq 0 (
    echo.
    echo [ATTENZIONE] APK compilato, ma impossibile copiarlo nella cartella 'builds'.
) else (
    echo.
    echo ========================================================
    echo SUCCESS! 
    echo L'APK e' pronto e si trova in: builds\KineFit-Elite-Release.apk
    echo.
    echo Installazione sullo smartphone collegato...
    echo Verifica dispositivi ADB connessi...
    adb devices
    echo Installazione dell'APK in corso...
    adb install -r "builds\KineFit-Elite-Release.apk"
    if %errorlevel% neq 0 (
        echo.
        echo [ATTENZIONE] Installazione fallita. Assicurati che lo smartphone sia collegato e abbia il Debug USB attivo.
    ) else (
        echo.
        echo [SUCCESSO] App installata correttamente sul tuo smartphone!
    )
    echo ========================================================
)

echo.
pause
endlocal
