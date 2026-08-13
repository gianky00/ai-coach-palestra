@echo off
setlocal enabledelayedexpansion

:: KineFit — Quality checks (Gate A–H)
::
:: Uso:
::   run_quality_checks.bat                 --quick (A–E + F light)
::   run_quality_checks.bat --full          + assemble + Pixel 9A UI
::   run_quality_checks.bat --full --skip-ui
::   run_quality_checks.bat --full --skip-apk
::   run_quality_checks.bat --fix           prettier + eslint, poi report
::   run_quality_checks.bat --skip-tests
::
:: Report: logs\quality_report.log

chcp 65001 > nul
set PYTHONUTF8=1
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    set "PY=.venv\Scripts\python.exe"
) else (
    set "PY=python"
)

echo.
echo ============================================================
echo  KineFit — Quality Checks
echo  Report: logs\quality_report.log
echo  --quick = Gate A-E  ^|  --full = + assemble + Pixel 9A UI
echo ============================================================
echo.

"%PY%" "%~dp0run_quality_checks.py" %*
set EXIT_CODE=%ERRORLEVEL%

if %EXIT_CODE% EQU 0 (
    echo.
    echo OK: tutti i check BLOCKING sono passati.
) else (
    echo.
    echo ATTENZIONE: almeno un check BLOCKING e' fallito.
    echo Leggere logs\quality_report.log ^(sezione GUARDRAILS^) prima di correggere con IA.
)

exit /b %EXIT_CODE%
