@echo off
setlocal enabledelayedexpansion

:: KineFit — UNICO controllore qualità (niente GitHub Actions CI)
::
:: Uso:
::   run_quality_checks.bat                 --quick (A–E + F: android/Maestro/wiki/MCP/version)
::   run_quality_checks.bat --full          + assemble (G) + Pixel 9A UI (H)
::   run_quality_checks.bat --full --skip-ui
::   run_quality_checks.bat --full --skip-apk
::   run_quality_checks.bat --fix           prettier + eslint, poi report
::   run_quality_checks.bat --skip-tests    salta Vitest D/E
::   run_quality_checks.bat --no-advisory   salta depcheck / npm audit
::
:: Report: logs\quality_report.log
:: Boot agenti: AGENTS.md → wiki/INDEX.md → wiki/kinefit/INDEX.md

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
echo  KineFit — Quality Checks (locale)
echo  Entrypoint: run_quality_checks.bat
echo  Report: logs\quality_report.log
echo  --quick = A-E + F (wiki/MCP/version)
echo  --full  = + G assemble + H Pixel 9A UI
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
    echo Wiki: npm run wiki:check  ^|  MCP: npm run mcp:check
)

exit /b %EXIT_CODE%
