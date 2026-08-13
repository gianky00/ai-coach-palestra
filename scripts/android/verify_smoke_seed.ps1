#Requires -Version 5.1
<#
.SYNOPSIS
  Focused Pixel_9a smoke seed verify (clear → seed → Oggi markers).
#>
[CmdletBinding()]
param(
    [string]$Package = "com.coemi.kinefit.elite",
    [string]$Serial = "",
    [int]$SettleSec = 4
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ShotsDir = Join-Path $ScriptDir ".ui-shots"
New-Item -ItemType Directory -Force -Path $ShotsDir | Out-Null

. (Join-Path $ScriptDir "lib\android-env.ps1")
. (Join-Path $ScriptDir "lib\ui-shots.ps1")
. (Join-Path $ScriptDir "lib\ui-verify-common.ps1")

$script:FailCount = 0
$script:Package = $Package
$script:SettleMs = $SettleSec * 1000

try {
    $device = Ensure-AndroidUiDevice -Serial $Serial -NoBoot:$false
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    Write-Host "HINT: npm run android:adb-reset then npm run android:emulator" -ForegroundColor Yellow
    exit 1
}
$script:adb = $device.Adb
$Serial = $device.Serial
$script:SerialArgs = @("-s", $Serial)
Initialize-UiShotsSession -ShotsDir $ShotsDir
if (Get-Command Ensure-AdbReverseMetro -ErrorAction SilentlyContinue) { Ensure-AdbReverseMetro }

Write-Host "=== smoke seed verify (Pixel_9a) ===" -ForegroundColor Cyan

function Invoke-SeedStep([string]$Url, [string]$Step, [string]$Expect) {
    if (Get-Command Start-SmokeUrl -ErrorAction SilentlyContinue) {
        Start-SmokeUrl -Url $Url -Step $Step
    } else {
        $quoted = "'" + ($Url -replace "'", "") + "'"
        $null = Invoke-Adb @("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", $quoted, $Package)
        Start-Sleep -Seconds 2
    }
    if (Get-Command Wait-UiPattern -ErrorAction SilentlyContinue) {
        if (-not (Wait-UiPattern -Pattern $Expect -TimeoutSec 60 -Step $Step)) {
            Write-Fail -Message "$Step pattern missing" -Step $Step
            return $false
        }
    }
    return $true
}

$okClear = Invoke-SeedStep "kinefit://smoke/clear" "seed-clear" "cleared|smoke-seed-status|seed:cleared|SMOKE"
$okSeed = Invoke-SeedStep "kinefit://smoke/seed?days=7&sets=3" "seed-insert" "seeded|smoke-seed-ready|SEED|smoke-seed-status|seed:seeded"

if ($script:FailCount -gt 0 -or -not $okClear -or -not $okSeed) {
    Write-Host "FAIL: smoke seed verify ($($script:FailCount) errors)" -ForegroundColor Red
    exit 1
}
Write-Host "OK: smoke seed verify" -ForegroundColor Green
exit 0
