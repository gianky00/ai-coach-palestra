@echo off
setlocal
echo ========================================================
echo     KineFit - Metro bundler (per Android Studio)
echo ========================================================
echo.
echo 1) Lascia questo terminale aperto
echo 2) In Android Studio apri mobile\android e premi Run
echo.
echo Oppure: npm run android:studio
echo ========================================================
echo.

cd /d "%~dp0"
call npm.cmd run metro

echo.
pause
endlocal
