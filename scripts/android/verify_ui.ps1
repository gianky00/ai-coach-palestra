#Requires -Version 5.1
<#
.SYNOPSIS
  Smoke UI verify via adb (KineFit) — zero login reale / zero Garmin OAuth.

.DESCRIPTION
  1) Trova adb + preferisce AVD Pixel_9A / Pixel_9a (avvia se nessun device)
  2) Device/emulator online
  3) Package com.coemi.kinefit.elite installato
  4) Deep-link kinefit://smoke/auth
  5) Attende UI Auth (KINEFIT / auth fields)
  6) Screencap in scripts/android/.ui-shots/

.PARAMETER DumpHierarchy
  Salva anche dump uiautomator XML.

.EXAMPLE
  .\scripts\android\verify_ui.ps1
  .\scripts\android\verify_ui.ps1 -DumpHierarchy
#>
[CmdletBinding()]
param(
    [switch]$DumpHierarchy,
    [string]$ShotName = "verify",
    [string]$Package = "com.coemi.kinefit.elite",
    [string]$SmokeUrl = "kinefit://smoke/auth",
    [string]$Serial = "",
    [switch]$NoBoot,
    [int]$SettleMs = 2500,
    [int]$ReadyTimeoutSec = 60
)

$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ShotsDir = Join-Path $ScriptDir ".ui-shots"
. (Join-Path $ScriptDir "lib\android-env.ps1")

function Write-Fail([string]$Message) {
    Write-Host "FAIL: $Message" -ForegroundColor Red
    exit 1
}

function Write-Ok([string]$Message) {
    Write-Host "OK: $Message" -ForegroundColor Green
}

function Invoke-Adb([string]$AdbPath, [string]$Serial, [string[]]$Cmd) {
    if ($Serial) {
        & $AdbPath -s $Serial @Cmd
    } else {
        & $AdbPath @Cmd
    }
}

function Wait-UiReady([string]$AdbPath, [string]$Serial, [string]$Pkg, [int]$TimeoutSec) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    $probe = "/data/local/tmp/kinefit_ready_probe.xml"
    while ((Get-Date) -lt $deadline) {
        $focus = Invoke-Adb $AdbPath $Serial @("shell", "dumpsys", "window") 2>$null | Select-String -Pattern "mCurrentFocus|mFocusedApp" | Select-Object -First 3
        $focusText = ($focus | ForEach-Object { $_.Line }) -join " "
        if ($focusText -notmatch [regex]::Escape($Pkg)) {
            Start-Sleep -Milliseconds 700
            continue
        }
        try {
            $null = Invoke-Adb $AdbPath $Serial @("shell", "uiautomator", "dump", $probe) 2>&1
            $xml = Invoke-Adb $AdbPath $Serial @("shell", "cat", $probe) 2>$null
            $xmlText = "$xml"
            if ($xmlText -match "keeps stopping|has stopped|non risponde|si è interrotta") {
                Start-Sleep -Milliseconds 900
                continue
            }
            # Require smoke/auth markers; avoid matching "KineFit" in crash dialogs alone.
            if ($xmlText -match "SMOKE|auth-email-input|ELITE TRAINING|screen-auth" -or
                ($xmlText -match "KINEFIT" -and $xmlText -match "Email|ACCEDI|auth-email")) {
                Invoke-Adb $AdbPath $Serial @("shell", "rm", $probe) 2>$null | Out-Null
                return $true
            }
        } catch { }
        Start-Sleep -Milliseconds 900
    }
    Invoke-Adb $AdbPath $Serial @("shell", "rm", $probe) 2>$null | Out-Null
    return $false
}

Write-Host "=== KineFit verify_ui ===" -ForegroundColor Cyan
Write-Host "Policy: zero login reale / zero Garmin OAuth in auto-verify." -ForegroundColor DarkGray
Write-Host "Device target: AVD Pixel_9A / Pixel_9a" -ForegroundColor DarkGray

try {
    $device = Ensure-AndroidUiDevice -Serial $Serial -NoBoot:$NoBoot
} catch {
    Write-Fail "$_"
}
$adb = $device.Adb
$serial = $device.Serial
Write-Ok "adb = $adb"
Write-Ok "device online: $serial$(if ($device.AvdName) { " (AVD $($device.AvdName))" })"

$pathCheck = Invoke-Adb $adb $serial @("shell", "pm", "path", $Package) 2>&1
if ($LASTEXITCODE -ne 0 -or ("$pathCheck" -notmatch "package:")) {
    Write-Fail "Package $Package non installato. Usa: npm run android:install  oppure Run ▶ in Android Studio (Pixel 9a)."
}
Write-Ok "package installato: $Package"

Invoke-Adb $adb $serial @("shell", "am", "force-stop", $Package) | Out-Null
Invoke-Adb $adb $serial @("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", $SmokeUrl, $Package) | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Impossibile avviare deep-link $SmokeUrl"
}
Write-Ok "avviato $SmokeUrl"
Start-Sleep -Milliseconds $SettleMs

if (-not (Wait-UiReady -AdbPath $adb -Serial $serial -Pkg $Package -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "UI non pronta entro ${ReadyTimeoutSec}s (splash ancora attiva o crash). Aumenta -ReadyTimeoutSec."
}
Write-Ok "UI pronta (Auth smoke)"

if (-not (Test-Path -LiteralPath $ShotsDir)) {
    New-Item -ItemType Directory -Force -Path $ShotsDir | Out-Null
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$remotePng = "/sdcard/kinefit_ui_verify.png"
$localPng = Join-Path $ShotsDir ("{0}-{1}.png" -f $ShotName, $stamp)

Invoke-Adb $adb $serial @("shell", "screencap", "-p", $remotePng)
if ($LASTEXITCODE -ne 0) {
    Write-Fail "screencap fallito"
}
Invoke-Adb $adb $serial @("pull", $remotePng, $localPng) | Out-Null
if ($LASTEXITCODE -ne 0 -or -not (Test-Path -LiteralPath $localPng)) {
    Write-Fail "pull screencap fallito: $localPng"
}
Invoke-Adb $adb $serial @("shell", "rm", $remotePng) 2>$null | Out-Null
Write-Ok "screencap: $localPng"

if ($DumpHierarchy) {
    $remoteXml = "/data/local/tmp/kinefit_ui_dump.xml"
    $localXml = Join-Path $ShotsDir ("{0}-{1}.xml" -f $ShotName, $stamp)
    $dumped = $false
    for ($attempt = 1; $attempt -le 4; $attempt++) {
        Start-Sleep -Milliseconds (800 * $attempt)
        try {
            $dumpOut = Invoke-Adb $adb $serial @("shell", "uiautomator", "dump", $remoteXml) 2>&1 | Out-String
            if ($dumpOut -match "UI hierchary dumped|UI hierarchy dumped|dumped to") {
                Invoke-Adb $adb $serial @("pull", $remoteXml, $localXml) 2>&1 | Out-Null
                if ((Test-Path -LiteralPath $localXml) -and ((Get-Item -LiteralPath $localXml).Length -gt 0)) {
                    $dumped = $true
                    break
                }
            }
        } catch { }
        try {
            if ($serial) {
                $stream = & $adb -s $serial exec-out uiautomator dump /dev/tty 2>$null
            } else {
                $stream = & $adb exec-out uiautomator dump /dev/tty 2>$null
            }
            $text = if ($null -eq $stream) { "" } elseif ($stream -is [array]) { $stream -join "`n" } else { [string]$stream }
            if ($text -match "<hierarchy") {
                Set-Content -LiteralPath $localXml -Value $text -Encoding UTF8
                if ((Test-Path -LiteralPath $localXml) -and ((Get-Item -LiteralPath $localXml).Length -gt 0)) {
                    $dumped = $true
                    break
                }
            }
        } catch { }
        Write-Host "WARN: hierarchy dump tentativo $attempt fallito, riprovo..." -ForegroundColor Yellow
    }
    try { Invoke-Adb $adb $serial @("shell", "rm", $remoteXml) 2>$null | Out-Null } catch { }
    if (-not $dumped) {
        Write-Fail "uiautomator dump fallito dopo retry."
    }
    Write-Ok "hierarchy: $localXml"
}

Write-Host ""
Write-Host "VERIFY UI PASSED" -ForegroundColor Green
exit 0
