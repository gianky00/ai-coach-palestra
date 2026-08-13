#Requires -Version 5.1
<#
.SYNOPSIS
  Report whether Maestro CLI is on PATH (and Java 17+ hints).
  Always exits 0 — missing CLI is informational so agents/humans can SKIP e2e:* cleanly.

.NOTES
  Install (Windows native): https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli
  Repo guide: .maestro/README.md · mobile/VERIFY.md
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Continue"

function Test-Java17Plus {
    $javaCmd = Get-Command java -ErrorAction SilentlyContinue
    if (-not $javaCmd) {
        if ($env:JAVA_HOME -and (Test-Path (Join-Path $env:JAVA_HOME "bin\java.exe"))) {
            $javaExe = Join-Path $env:JAVA_HOME "bin\java.exe"
        }
        else {
            return @{ Ok = $false; Detail = "java not on PATH and JAVA_HOME unset/invalid" }
        }
    }
    else {
        $javaExe = $javaCmd.Source
    }

    $verOut = & $javaExe -version 2>&1 | Out-String
    if ($verOut -match 'version\s+"?(1[7-9]|[2-9]\d)') {
        return @{ Ok = $true; Detail = ($verOut -split "`n")[0].Trim() }
    }
    return @{ Ok = $false; Detail = "need Java 17+; got: $(($verOut -split "`n")[0].Trim())" }
}

Write-Host "=== Maestro CLI check (KineFit) ===" -ForegroundColor Cyan

$maestro = Get-Command maestro -ErrorAction SilentlyContinue
$commonBins = @(
    "C:\maestro\bin\maestro.bat",
    "C:\maestro\bin\maestro.cmd",
    "C:\maestro\bin\maestro.exe",
    (Join-Path $env:USERPROFILE ".maestro\bin\maestro.bat"),
    (Join-Path $env:USERPROFILE ".maestro\bin\maestro")
)
$foundDisk = $commonBins | Where-Object { Test-Path $_ } | Select-Object -First 1

$java = Test-Java17Plus
if ($java.Ok) {
    Write-Host "OK: Java — $($java.Detail)" -ForegroundColor Green
}
else {
    Write-Host "WARN: Java — $($java.Detail)" -ForegroundColor Yellow
    Write-Host "  Maestro requires Java 17+. Set JAVA_HOME (e.g. Microsoft JDK 17) then reopen the terminal." -ForegroundColor DarkYellow
}

if ($maestro) {
    Write-Host "OK: maestro on PATH — $($maestro.Source)" -ForegroundColor Green
    try {
        $help = & maestro --help 2>&1 | Select-Object -First 3
        $help | ForEach-Object { Write-Host "  $_" }
    }
    catch {
        Write-Host "WARN: maestro found but --help failed: $_" -ForegroundColor Yellow
    }
    Write-Host ""
    Write-Host "Next (Pixel_9a + APK installed):" -ForegroundColor Cyan
    Write-Host "  cd mobile; npm run e2e:smoke"
    Write-Host "  cd mobile; npm run e2e:ops"
    Write-Host "Docs: .maestro/README.md · mobile/VERIFY.md"
    exit 0
}

Write-Host "SKIP: Maestro CLI not on PATH — e2e:smoke / e2e:ops / e2e:max will fail until installed." -ForegroundColor Yellow
if ($foundDisk) {
    Write-Host "  Found on disk (not on PATH): $foundDisk" -ForegroundColor DarkYellow
    Write-Host "  Add that folder's parent bin dir to User PATH, then restart the terminal." -ForegroundColor DarkYellow
}
else {
    Write-Host "  Install (Windows native — official docs):" -ForegroundColor DarkYellow
    Write-Host "    1. Download https://github.com/mobile-dev-inc/maestro/releases/latest/download/maestro.zip"
    Write-Host "    2. Extract to C:\maestro"
    Write-Host "    3. Add C:\maestro\bin to User PATH (see .maestro/README.md)"
    Write-Host "    4. Restart terminal; run: maestro --help"
}
Write-Host "  Full guide: .maestro/README.md"
Write-Host "  Until then use adb smoke: npm run verify:ui / verify:ui:ops / verify:ui:full"
Write-Host ""
Write-Host "Exit 0 (informational — missing CLI is expected SKIP, not a gate failure)." -ForegroundColor DarkGray
exit 0
