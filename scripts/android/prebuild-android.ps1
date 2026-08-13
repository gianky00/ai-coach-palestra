#Requires -Version 5.1
<#
.SYNOPSIS
  Rigenera mobile/android (operazione rara — il progetto nativo è versionato).

.DESCRIPTION
  Usare SOLO dopo aver aggiunto/rimosso dipendenze native.
  Di default NON usa --clean. Passa -Clean solo se vuoi ricreare da zero
  (poi rivedi il diff e committa).
#>
[CmdletBinding()]
param(
    [switch]$Clean,
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$MobileDir = Join-Path $RepoRoot "mobile"
$AndroidDir = Join-Path $MobileDir "android"

Write-Host "=== KineFit regenerate android (raro) ===" -ForegroundColor Yellow
Write-Host "Il flusso quotidiano e' Android Studio su mobile/android — NON questo script."

if ((Test-Path -LiteralPath $AndroidDir) -and -not $Force -and -not $Clean) {
    Write-Host "WARN: mobile/android esiste gia' (versionato)." -ForegroundColor Yellow
    Write-Host "Per rigenerare: .\prebuild-android.ps1 -Force   oppure   -Clean"
    Write-Host "OK: nessuna modifica" -ForegroundColor Green
    exit 0
}

if (-not $Force -and -not $Clean) {
    Write-Host "FAIL: passa -Force o -Clean per confermare la rigenerazione." -ForegroundColor Red
    exit 1
}

Push-Location $MobileDir
try {
    if (-not (Test-Path -LiteralPath "node_modules")) {
        npm.cmd install
        if ($LASTEXITCODE -ne 0) { throw "npm install fallito" }
    }

    $expoArgs = @("expo", "prebuild", "--platform", "android")
    if ($Clean) { $expoArgs += "--clean" }

    Write-Host "npx $($expoArgs -join ' ')"
    npx.cmd @expoArgs
    if ($LASTEXITCODE -ne 0) { throw "prebuild fallito" }

    if (-not (Test-Path -LiteralPath $AndroidDir)) {
        throw "mobile/android non creato"
    }
    Write-Host "OK: android rigenerato — revisiona e committa il diff" -ForegroundColor Green
}
finally {
    Pop-Location
}

exit 0
