#Requires -Version 5.1
<#
.SYNOPSIS
  Gate locali A–H per KineFit (qualità + Android Studio / UI).

.DESCRIPTION
  A format | B lint | C typecheck | D vitest | E coverage
  F android project present | G assembleDebug | H UI adb / Maestro

  Gate H non esegue login reale né Garmin OAuth.

.PARAMETER Gate
  A|B|C|D|E|F|G|H|All  (default All fino a E in CI-friendly; All include F–H)

.PARAMETER SkipHeavy
  Se impostato con All, esegue solo A–E (come GitHub Actions).

.PARAMETER UseMaestro
  Per Gate H usa Maestro invece di verify_ui.ps1 (richiede credenziali).

.EXAMPLE
  .\scripts\android\verify-gates.ps1 -Gate All -SkipHeavy
  .\scripts\android\verify-gates.ps1 -Gate G
  .\scripts\android\verify-gates.ps1 -Gate H
#>
[CmdletBinding()]
param(
    [ValidateSet("A", "B", "C", "D", "E", "F", "G", "H", "All")]
    [string]$Gate = "All",
    [switch]$SkipHeavy,
    [switch]$UseMaestro,
    [switch]$FullUi
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")

function Write-Gate([string]$Letter, [string]$Title) {
    Write-Host ""
    Write-Host "======== GATE $Letter — $Title ========" -ForegroundColor Cyan
}

function Invoke-GateStep([scriptblock]$Action) {
    Push-Location $RepoRoot
    try {
        & $Action
        if ($null -ne $LASTEXITCODE -and $LASTEXITCODE -ne 0) {
            throw "exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }
}

$order = switch ($Gate) {
    "All" {
        if ($SkipHeavy) { @("A", "B", "C", "D", "E") }
        else { @("A", "B", "C", "D", "E", "F", "G", "H") }
    }
    default { @($Gate) }
}

Write-Host "=== KineFit verify-gates ===" -ForegroundColor Cyan
Write-Host "Repo: $RepoRoot"
Write-Host "Gates: $($order -join ', ')"

foreach ($g in $order) {
    switch ($g) {
        "A" {
            Write-Gate "A" "Prettier format:check"
            Invoke-GateStep { npm.cmd run format:check }
            Write-Host "OK GATE A" -ForegroundColor Green
        }
        "B" {
            Write-Gate "B" "ESLint"
            Invoke-GateStep { npm.cmd run lint }
            Write-Host "OK GATE B" -ForegroundColor Green
        }
        "C" {
            Write-Gate "C" "Typecheck mobile"
            Invoke-GateStep { npm.cmd run mobile:typecheck }
            Write-Host "OK GATE C" -ForegroundColor Green
        }
        "D" {
            Write-Gate "D" "Vitest unit"
            Invoke-GateStep { npm.cmd run mobile:test }
            Write-Host "OK GATE D" -ForegroundColor Green
        }
        "E" {
            Write-Gate "E" "Vitest coverage"
            Invoke-GateStep { npm.cmd run mobile:test:coverage }
            Write-Host "OK GATE E" -ForegroundColor Green
        }
        "F" {
            Write-Gate "F" "Progetto Android versionato (mobile/android)"
            $gradlew = Join-Path $RepoRoot "mobile\android\gradlew.bat"
            if (-not (Test-Path -LiteralPath $gradlew)) {
                throw "Gate F fallito: manca mobile/android (progetto Studio versionato)"
            }
            Write-Host "OK: $gradlew"
            Write-Host "OK GATE F" -ForegroundColor Green
        }
        "G" {
            Write-Gate "G" "assembleDebug"
            & (Join-Path $ScriptDir "assemble-debug.ps1") -SkipPrebuild
            if ($LASTEXITCODE -ne 0) { throw "Gate G fallito" }
            Write-Host "OK GATE G" -ForegroundColor Green
        }
        "H" {
            Write-Gate "H" "UI device (adb smoke / Maestro)"
            if ($UseMaestro) {
                Push-Location $RepoRoot
                try {
                    npm.cmd --prefix mobile run e2e
                    if ($LASTEXITCODE -ne 0) { throw "Maestro e2e fallito" }
                }
                finally { Pop-Location }
            } elseif ($FullUi) {
                & (Join-Path $ScriptDir "verify_ui_full.ps1")
                if ($LASTEXITCODE -ne 0) { throw "verify_ui_full fallito" }
            } else {
                & (Join-Path $ScriptDir "verify_ui.ps1")
                if ($LASTEXITCODE -ne 0) { throw "verify_ui fallito" }
            }
            Write-Host "OK GATE H" -ForegroundColor Green
        }
    }
}

Write-Host ""
Write-Host "ALL SELECTED GATES PASSED" -ForegroundColor Green
exit 0
