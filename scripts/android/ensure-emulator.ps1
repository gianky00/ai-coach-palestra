#Requires -Version 5.1
<#
.SYNOPSIS
  Ensure / create / boot the KineFit UI test AVD (Pixel_9A / Pixel_9a).

.DESCRIPTION
  - Rileva AVD Pixel_9A o Pixel_9a (Device Manager Studio).
  - Se manca e ci sono cmdline-tools, prova a creare Pixel_9A (device pixel_9a).
  - Reset adb server, avvia l'emulatore e attende boot completed (default 300s).
  - Preferisce %ANDROID_HOME%\platform-tools\adb.exe.
  - Zero login / zero Garmin OAuth.

.NOTES
  Recovery one-liner (emulator offline / adb daemon fights; does not kill emulator UI):
    $adb="$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"; & $adb kill-server; Start-Sleep 2; Get-Process adb -ea 0 | Stop-Process -Force -ea 0; & $adb start-server; & $adb devices -l

  If still offline with qemu running, soft-restart guest via emulator console (port 5554), then re-poll boot.
  Then: npm run android:install && npm run verify:ui

.EXAMPLE
  npm run android:emulator
  .\scripts\android\ensure-emulator.ps1 -CreateIfMissing
#>
[CmdletBinding()]
param(
    [switch]$CreateIfMissing,
    [switch]$NoStart,
    [int]$BootTimeoutSec = 300
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir "lib\android-env.ps1")

Write-Host "=== KineFit ensure-emulator (Pixel 9a) ===" -ForegroundColor Cyan

$sdk = Get-AndroidSdkRoot
if ($sdk) {
    Write-Host "SDK: $sdk"
} else {
    Write-Host "FAIL: Android SDK non trovato (ANDROID_HOME / LOCALAPPDATA\Android\Sdk)." -ForegroundColor Red
    exit 1
}

# Prefer SDK adb; set ANDROID_HOME for child tools when unset.
if (-not $env:ANDROID_HOME) { $env:ANDROID_HOME = $sdk }
if (-not $env:ANDROID_SDK_ROOT) { $env:ANDROID_SDK_ROOT = $sdk }

$listed = @(Get-ListedAvds)
Write-Host "AVD presenti: $(if ($listed.Count) { $listed -join ', ' } else { '(nessuno)' })"

try {
    $avd = Ensure-PreferredAvd -CreateIfMissing:$CreateIfMissing
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    exit 1
}

if (-not $avd) {
    Write-Host "FAIL: AVD Pixel_9A / Pixel_9a assente. Usa -CreateIfMissing oppure Device Manager (Pixel 9a)." -ForegroundColor Red
    exit 1
}
Write-Host "OK: AVD target = $avd" -ForegroundColor Green

if ($NoStart) {
    exit 0
}

$adb = Find-Adb
if (-not $adb) {
    Write-Host "FAIL: adb non trovato." -ForegroundColor Red
    exit 1
}
Write-Host "adb: $adb"

Reset-AdbServer -AdbPath $adb

$online = @(Get-AdbOnlineSerials -AdbPath $adb)
foreach ($s in $online) {
    if ($s -notmatch "^emulator-") { continue }
    $name = Get-EmulatorAvdNameForSerial -AdbPath $adb -Serial $s
    if ($name -and $name.Equals($avd, [System.StringComparison]::OrdinalIgnoreCase)) {
        if (Wait-AdbBootCompleted -AdbPath $adb -Serial $s -TimeoutSec ([Math]::Min(120, $BootTimeoutSec))) {
            $env:ANDROID_SERIAL = $s
            Write-Host "OK: gia online $s (AVD $avd)" -ForegroundColor Green
            Write-Host "ANDROID_SERIAL=$s"
            exit 0
        }
    }
}

try {
    $serial = Start-PreferredEmulator -AvdName $avd -BootTimeoutSec $BootTimeoutSec
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    exit 1
}

$env:ANDROID_SERIAL = $serial
Write-Host "ANDROID_SERIAL=$serial"
Write-Host "Emulatore pronto per: npm run android:install && npm run verify:ui" -ForegroundColor Green
exit 0
