#Requires -Version 5.1
<#
.SYNOPSIS
  Hardened Maestro e2e runner for KineFit (Windows-friendly).

.DESCRIPTION
  Resolves Maestro from PATH or common install locations, maps named suites to
  .maestro/flows, and prints a clear SKIP (exit 0) when the CLI is missing —
  unless -FailIfMissing (Gate H / explicit require).

.PARAMETER Suite
  Named suite: smoke | ops | max | all | login | navigation

.PARAMETER Flows
  Optional explicit flow paths (relative to repo root or absolute). Overrides Suite.

.PARAMETER FailIfMissing
  Exit 1 instead of SKIP when Maestro CLI is not found.

.EXAMPLE
  .\scripts\run-maestro.ps1 -Suite smoke
  npm run e2e:ops
#>
[CmdletBinding()]
param(
    [ValidateSet("smoke", "ops", "max", "all", "login", "navigation")]
    [string]$Suite = "smoke",

    [string[]]$Flows = @(),

    [switch]$FailIfMissing
)

$ErrorActionPreference = "Stop"

$RepoRoot = if ($PSScriptRoot) {
    (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
} else {
    (Get-Location).Path
}

function Resolve-MaestroCommand {
    $fromPath = Get-Command maestro -ErrorAction SilentlyContinue
    if ($fromPath) {
        return @{
            Ok      = $true
            Command = $fromPath.Source
            Detail  = "PATH: $($fromPath.Source)"
        }
    }

    $candidates = @(
        "C:\maestro\bin\maestro.bat",
        "C:\maestro\bin\maestro.cmd",
        "C:\maestro\bin\maestro.exe",
        (Join-Path $env:USERPROFILE ".maestro\bin\maestro.bat"),
        (Join-Path $env:USERPROFILE ".maestro\bin\maestro.cmd"),
        (Join-Path $env:USERPROFILE ".maestro\bin\maestro")
    )
    foreach ($c in $candidates) {
        if ($c -and (Test-Path -LiteralPath $c)) {
            $binDir = Split-Path -Parent $c
            if ($env:Path -notlike "*$binDir*") {
                $env:Path = "$binDir;$env:Path"
            }
            return @{
                Ok      = $true
                Command = $c
                Detail  = "disk (session PATH patched): $c"
            }
        }
    }

    return @{
        Ok      = $false
        Command = $null
        Detail  = "not on PATH and not under C:\maestro\bin or %USERPROFILE%\.maestro\bin"
    }
}

function Resolve-SuiteFlows {
    param(
        [string]$Name,
        [string[]]$Explicit
    )

    $flowsRoot = Join-Path $RepoRoot ".maestro\flows"
    if ($Explicit -and $Explicit.Count -gt 0) {
        $resolved = @()
        foreach ($f in $Explicit) {
            if ([System.IO.Path]::IsPathRooted($f)) {
                $resolved += $f
            } else {
                $candidate = Join-Path $RepoRoot $f
                if (Test-Path -LiteralPath $candidate) {
                    $resolved += $candidate
                } else {
                    $resolved += (Join-Path $flowsRoot $f)
                }
            }
        }
        return $resolved
    }

    switch ($Name) {
        "smoke" { return @(Join-Path $flowsRoot "smoke_all_views.yaml") }
        "ops" { return @(Join-Path $flowsRoot "smoke_ops.yaml") }
        "max" {
            return @(
                (Join-Path $flowsRoot "smoke_all_views.yaml"),
                (Join-Path $flowsRoot "smoke_ops.yaml")
            )
        }
        "login" { return @(Join-Path $flowsRoot "login.yaml") }
        "navigation" { return @(Join-Path $flowsRoot "navigation.yaml") }
        "all" { return @($flowsRoot) }
        default { throw "Unknown suite: $Name" }
    }
}

Write-Host "=== Maestro e2e (KineFit) ===" -ForegroundColor Cyan
Write-Host "Repo: $RepoRoot" -ForegroundColor DarkGray
Write-Host "Suite: $(if ($Flows.Count) { 'custom flows' } else { $Suite })" -ForegroundColor DarkGray
Write-Host "Target device (docs): Pixel_9a — prefer adb smoke if Maestro SKIP" -ForegroundColor DarkGray

$maestro = Resolve-MaestroCommand
if (-not $maestro.Ok) {
    Write-Host "SKIP: Maestro CLI missing — $($maestro.Detail)" -ForegroundColor Yellow
    Write-Host "  Install: see .maestro/README.md · npm run maestro:check" -ForegroundColor DarkYellow
    Write-Host "  Until then: npm run verify:ui / verify:ui:ops / verify:ui:full" -ForegroundColor DarkYellow
    if ($FailIfMissing) {
        Write-Host "FAIL: -FailIfMissing set (Gate H / explicit require)." -ForegroundColor Red
        exit 1
    }
    Write-Host "Exit 0 (SKIP — missing CLI is expected until installed)." -ForegroundColor DarkGray
    exit 0
}

Write-Host "OK: maestro — $($maestro.Detail)" -ForegroundColor Green

$flowArgs = Resolve-SuiteFlows -Name $Suite -Explicit $Flows
$missingFlows = @($flowArgs | Where-Object { -not (Test-Path -LiteralPath $_) })
if ($missingFlows.Count -gt 0) {
    Write-Host "FAIL: flow path(s) missing:" -ForegroundColor Red
    $missingFlows | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
    exit 1
}

Write-Host "Flows:" -ForegroundColor Cyan
$flowArgs | ForEach-Object { Write-Host "  $_" }

Push-Location $RepoRoot
try {
    & $maestro.Command test @flowArgs
    $code = $LASTEXITCODE
} finally {
    Pop-Location
}

if ($null -eq $code) { $code = 1 }
if ($code -ne 0) {
    Write-Host "FAIL: maestro test exit $code" -ForegroundColor Red
    exit $code
}

Write-Host "OK: Maestro suite passed" -ForegroundColor Green
exit 0
