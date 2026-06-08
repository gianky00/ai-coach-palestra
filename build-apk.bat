@echo off
echo ========================================================
echo     KineFit Elite - Build APK Locale (Release)
echo ========================================================
echo.

echo [1/4] Configurazione variabili d'ambiente...
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

echo JAVA_HOME: %JAVA_HOME%
echo ANDROID_HOME: %ANDROID_HOME%
echo.

echo [2/4] Preparazione ambiente e navigazione...
cd mobile\android
if %errorlevel% neq 0 (
    echo [ERRORE] Impossibile trovare la cartella mobile\android.
    pause
    exit /b 1
)

echo.
echo [3/4] Avvio della compilazione con Gradle (assembleRelease)...
echo Questa operazione richiedera' la connessione a Internet e potrebbe impiegare diversi minuti.
echo I log completi della compilazione vengono salvati in: builds\build.log
if not exist "..\..\builds" mkdir "..\..\builds"
call gradlew.bat assembleRelease > "..\..\builds\build.log" 2>&1

if %errorlevel% neq 0 (
    echo.
    echo [ERRORE FATALE] La compilazione e' fallita.
    echo Ho salvato il traceback dettagliato dell'errore nel file:
    echo -^> builds\build.log
    echo Fornisci il contenuto di questo file all'IA per analizzare il problema.
    cd ..\..
    pause
    exit /b 1
)

echo.
echo [4/4] Raccolta e spostamento dell'APK...
cd ..\..
if not exist "builds" mkdir builds
copy /y "mobile\android\app\build\outputs\apk\release\app-release.apk" "builds\KineFit-Elite-Release.apk" >nul

if %errorlevel% neq 0 (
    echo.
    echo [ATTENZIONE] APK compilato, ma impossibile copiarlo nella cartella 'builds'.
    echo Lo trovi in: mobile\android\app\build\outputs\apk\release\app-release.apk
) else (
    echo.
    echo ========================================================
    echo SUCCESS! 
    echo L'APK e' pronto e si trova in: builds\KineFit-Elite-Release.apk
    echo.
    echo [5/5] Installazione sullo smartphone collegato...
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
