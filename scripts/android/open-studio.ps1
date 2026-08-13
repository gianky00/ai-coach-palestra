#Requires -Version 5.1
<#
.SYNOPSIS
  Apre mobile/android in Android Studio (progetto versionato).
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$AndroidDir = Join-Path $RepoRoot "mobile\android"

if (-not (Test-Path -LiteralPath $AndroidDir)) {
    Write-Host "FAIL: manca $AndroidDir" -ForegroundColor Red
    Write-Host "Ripristina da git oppure: npm run android:prebuild -- -Force"
    exit 1
}

$studioCandidates = @(
    (Join-Path $env:LOCALAPPDATA "Programs\Android Studio\bin\studio64.exe"),
    "C:\Program Files\Android\Android Studio\bin\studio64.exe",
    "C:\Program Files\Android\Android Studio\bin\studio.exe"
)

$studio = $null
foreach ($c in $studioCandidates) {
    if ($c -and (Test-Path -LiteralPath $c)) {
        $studio = $c
        break
    }
}

Write-Host "=== KineFit open-studio ===" -ForegroundColor Cyan
Write-Host "Progetto: $AndroidDir"
Write-Host "Avvia anche Metro in un altro terminale: npm run metro"

if ($studio) {
    Start-Process -FilePath $studio -ArgumentList "`"$AndroidDir`""
    Write-Host "OK: avviato $studio" -ForegroundColor Green
} else {
    Write-Host "WARN: studio64.exe non trovato. Apri a mano: $AndroidDir" -ForegroundColor Yellow
    if (Get-Command explorer.exe -ErrorAction SilentlyContinue) {
        Start-Process explorer.exe -ArgumentList $AndroidDir
    }
}

exit 0
