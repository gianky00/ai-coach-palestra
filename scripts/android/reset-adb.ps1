#Requires -Version 5.1
<#
.SYNOPSIS
  Heal wedged adb daemon (port 5037) after Pixel_9a snapshot resume.
  Does NOT kill the emulator / qemu process.
#>
[CmdletBinding()]
param(
    [int]$BootTimeoutSec = 90
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
. (Join-Path $ScriptDir "lib\android-env.ps1")

$adb = Find-Adb
if (-not $adb) {
    Write-Host "FAIL: adb non trovato (ANDROID_HOME / platform-tools)" -ForegroundColor Red
    exit 1
}

Write-Host "=== Reset-AdbServer (Pixel_9a recovery) ===" -ForegroundColor Cyan
Reset-AdbServer -AdbPath $adb

if (-not (Test-AdbDaemonHealthy -AdbPath $adb)) {
    Write-Host "FAIL: adb daemon still unhealthy on :5037" -ForegroundColor Red
    exit 1
}

$online = @(Get-AdbOnlineSerials -AdbPath $adb)
Write-Host "OK: adb daemon healthy; online=$($online -join ', ')" -ForegroundColor Green

foreach ($serial in $online) {
    if ($serial -notmatch '^emulator-') { continue }
    $bootLines = Invoke-AndroidNative -FilePath $adb -ArgumentList @("-s", $serial, "shell", "getprop", "sys.boot_completed")
    $bootText = (($bootLines | Where-Object { $_ -notmatch '(?i)daemon' } | Select-Object -First 1) | ForEach-Object { "$_" }).Trim()
    $avd = Get-EmulatorAvdNameForSerial -AdbPath $adb -Serial $serial
    Write-Host "  $serial avd=$avd boot_completed=$bootText"
    if ($bootText -ne "1") {
        Write-Host "WARN: waiting for boot_completed=1 on $serial (timeout ${BootTimeoutSec}s)..." -ForegroundColor Yellow
        $ok = Wait-AdbBootCompleted -AdbPath $adb -Serial $serial -TimeoutSec $BootTimeoutSec
        if (-not $ok) {
            Write-Host "FAIL: boot_completed != 1 on $serial — restart emulator console" -ForegroundColor Red
            exit 1
        }
        Write-Host "OK: boot_completed=1 on $serial" -ForegroundColor Green
    }
}

if ($online.Count -eq 0) {
    Write-Host "WARN: no device online — run npm run android:emulator" -ForegroundColor Yellow
}

exit 0
