@echo off
setlocal
echo ========================================================
echo     KineFit - Avvio Expo Go (Ambiente di Sviluppo)
echo ========================================================
echo.
echo Questo script avvia il server di sviluppo locale.
echo Utilizza l'app Expo Go sul tuo smartphone per
echo scansionare il QR Code e testare l'app in tempo reale.
echo.
echo Il versioning automatico (Build number) verra'
echo incrementato ad ogni avvio!
echo ========================================================
echo.

cd mobile
call npm.cmd start

echo.
pause
endlocal
