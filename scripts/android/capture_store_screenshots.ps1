#Requires -Version 5.1
<#
.SYNOPSIS
  Capture Play Store phone screenshots (non-SMOKE tabs) on Pixel_9a.

.DESCRIPTION
  Capture path never uses smoke tabs/auth deep-links for assets. Requires a
  demo/staging session already logged in (tabs visible).

  If smoke-mode-banner / SMOKE text is still up from verify:ui* (in-memory),
  clears once then retries:
    1) kinefit://smoke/clear (wipe smoke-* fixtures only — VERIFY.md)
    2) am force-stop (exits smoke React state; does NOT pm clear — keeps login)
    3) soft-launch MainActivity (MAIN/LAUNCHER, no smoke URL)
  Still aborts if SMOKE remains after that single clear. Never pm clear
  (would wipe demo session and block store shots).

  Writes clean assets to scripts/android/.store-shots/ (not .ui-shots QA).

  Slots (STORE_SUBMISSION §6):
    store-01-oggi.png
    store-02-storico.png
    store-03-analisi.png
    store-04-profilo.png
    store-05-impostazioni.png  (-IncludeSettings)
    store-06-log-set.png       (-IncludeLog when an exercise row is tappable)

.EXAMPLE
  # After sibling frees Pixel_9a and you logged in with a demo account:
  npm run store:screenshots
  npm run store:screenshots -- -IncludeSettings -IncludeLog -NoBoot
#>
[CmdletBinding()]
param(
    [string]$Package = "com.coemi.kinefit.elite",
    [string]$Serial = "",
    [switch]$NoBoot,
    [switch]$IncludeSettings,
    [switch]$IncludeLog,
    [int]$SettleMs = 900,
    [int]$ReadyTimeoutSec = 75,
    [string]$OutDir = ""
)

$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ShotsDir = if ($OutDir) { $OutDir } else { Join-Path $ScriptDir ".store-shots" }
$script:FailCount = 0
$script:adb = $null
$script:SerialArgs = @()
$script:Package = $Package
$script:SettleMs = $SettleMs
$script:Captured = @()
$script:SmokeClearAttempted = $false

. (Join-Path $ScriptDir "lib\android-env.ps1")
. (Join-Path $ScriptDir "lib\ui-shots.ps1")
. (Join-Path $ScriptDir "lib\ui-verify-common.ps1")

function Write-StoreFail([string]$Message, [string]$Step = "store") {
    Write-Host "FAIL: $Message" -ForegroundColor Red
    $script:FailCount++
    if (Get-Command Capture-FailArtifacts -ErrorAction SilentlyContinue) {
        Capture-FailArtifacts -StepOrTestId $Step -Reason $Message | Out-Null
    }
}

function Test-SmokeLeak([string]$Xml) {
    if (-not $Xml) { return $false }
    return ($Xml -match "smoke-mode-banner|smoke-seed-|resource-id=`"smoke-|text=`"SMOKE|content-desc=`"SMOKE")
}

function Test-LoggedInTabs([string]$Xml) {
    if (-not $Xml) { return $false }
    if ($Xml -match "auth-email-input|screen-auth|ELITE TRAINING") { return $false }
    return ($Xml -match "tab-oggi|tab-storico|tab-analisi|tab-profilo|screen-oggi|screen-history|screen-analytics|screen-profile")
}

function Start-MainActivitySoft {
    # Soft launch — no force-stop (keeps Metro / sibling session). Never smoke deep-link.
    $comp = "$script:Package/.MainActivity"
    $null = Invoke-Adb @("shell", "am", "start", "-n", $comp, "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER")
    Start-Sleep -Milliseconds ([Math]::Max($script:SettleMs, 1200))
    Dismiss-PermissionIfAny | Out-Null
    Ensure-AdbReverseMetro | Out-Null
}

function Clear-StoreSmokeOnce {
    <#
      Exit leftover verify smoke for store assets.
      - clear deep-link wipes smoke-* fixtures only (still smoke UI while running)
      - force-stop drops in-memory smokeMode (only reliable exit without App code)
      - MAIN/LAUNCHER relaunch — never leave a smoke VIEW as the next cold start
      Never pm clear: STORE_SUBMISSION needs demo login preserved.
    #>
    Write-Host "SMOKE leak — clear once: kinefit://smoke/clear → force-stop → MainActivity (no pm clear)" -ForegroundColor Yellow
    $shellCmd = "am start -a android.intent.action.VIEW -d 'kinefit://smoke/clear' $script:Package"
    $null = Invoke-Adb @("shell", $shellCmd)
    Start-Sleep -Milliseconds 2800
    $null = Invoke-Adb @("shell", "am", "force-stop", $script:Package)
    Start-Sleep -Milliseconds 1500
    Ensure-AdbReverseMetro | Out-Null
    Start-MainActivitySoft
    # Metro cold start after force-stop needs extra settle on Pixel_9a.
    Start-Sleep -Milliseconds 7000
    Dismiss-PermissionIfAny | Out-Null
    $script:SmokeClearAttempted = $true
}

function Wait-StoreReady {
    param([int]$TimeoutSec = 75)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        Dismiss-PermissionIfAny | Out-Null
        if (-not (Wait-PackageFocus -TimeoutSec 3)) {
            Start-Sleep -Milliseconds 400
            continue
        }
        $xml = Get-UiXml
        if (Test-SmokeLeak $xml) {
            if (-not $script:SmokeClearAttempted) {
                Clear-StoreSmokeOnce
                continue
            }
            Write-StoreFail "SMOKE UI remains after clear — refuse store assets (manual: force-stop + MainActivity without kinefit://smoke/*)" "smoke-leak"
            return $false
        }
        if ($xml -match "auth-email-input|screen-auth") {
            Write-StoreFail "Auth screen visible — log in with demo/staging account first, then re-run (smoke clear may have exited fake smoke tabs)" "need-login"
            return $false
        }
        if (Test-LoggedInTabs $xml) { return $true }
        Start-Sleep -Milliseconds 700
    }
    Write-StoreFail "tabs not ready within ${TimeoutSec}s (need logged-in session, no smoke)" "ready-timeout"
    return $false
}

function Capture-StoreNamedShot {
    param(
        [Parameter(Mandatory = $true)][string]$FileName,
        [Parameter(Mandatory = $true)][string]$ExpectPattern,
        [string]$Label = ""
    )
    Start-Sleep -Milliseconds $script:SettleMs
    Dismiss-PermissionIfAny | Out-Null
    $xml = Get-UiXml
    if (Test-SmokeLeak $xml) {
        Write-StoreFail "SMOKE leak before $FileName" ("pre-" + $FileName)
        return $false
    }
    if ($ExpectPattern -and ($xml -notmatch $ExpectPattern)) {
        Write-StoreFail ("pattern missing for {0}: /{1}/" -f $FileName, $ExpectPattern) ("assert-" + $FileName)
        return $false
    }
    $path = Join-Path $ShotsDir $FileName
    if (Save-AdbScreencap -LocalPath $path) {
        Write-Ok ("STORE: {0}{1}" -f $FileName, $(if ($Label) { " ($Label)" } else { "" }))
        $script:Captured += $path
        return $true
    }
    Write-StoreFail "empty screencap: $FileName" $FileName
    return $false
}

function Invoke-TapStoreTab {
    param(
        [Parameter(Mandatory = $true)][string]$TestId,
        [Parameter(Mandatory = $true)][string]$ExpectPattern
    )
    # Local tap without writing step-* noise into store dir session (still ok if it does).
    for ($i = 1; $i -le 5; $i++) {
        Dismiss-PermissionIfAny | Out-Null
        $xml = Get-UiXml
        if (Test-SmokeLeak $xml) {
            Write-StoreFail "SMOKE leak tapping $TestId" "tap-$TestId"
            return $false
        }
        $b = Find-NodeBounds -Xml $xml -TestId $TestId
        if ($null -ne $b) {
            $cx = [int](($b.X1 + $b.X2) / 2)
            $cy = [int](($b.Y1 + $b.Y2) / 2)
            $null = Invoke-Adb @("shell", "input", "tap", "$cx", "$cy")
            Start-Sleep -Milliseconds ([Math]::Max($script:SettleMs, 700))
            $xml2 = Get-UiXml
            if ($xml2 -match $ExpectPattern) { return $true }
        }
        Start-Sleep -Milliseconds (300 * $i)
    }
    Write-StoreFail "tap/nav failed: $TestId" "tap-$TestId"
    return $false
}

Write-Host "=== KineFit store screenshots ===" -ForegroundColor Cyan
Write-Host "Policy: no smoke assets; auto-clear smoke once if leaked; demo login required. Pixel_9a preferred." -ForegroundColor DarkGray
Write-Host "Output: $ShotsDir" -ForegroundColor DarkGray

try {
    $device = Ensure-AndroidUiDevice -Serial $Serial -NoBoot:$NoBoot
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    Write-Host "HINT: sibling may own the emulator — re-run with -NoBoot when Pixel_9a is free + logged in." -ForegroundColor Yellow
    exit 1
}
$script:adb = $device.Adb
if ($device.Serial) { $script:SerialArgs = @("-s", $device.Serial) }
Write-Ok "adb = $($script:adb)"
Write-Ok "device online: $($device.Serial)$(if ($device.AvdName) { " (AVD $($device.AvdName))" })"

$pkgCheck = Invoke-Adb @("shell", "pm", "path", $Package) 2>$null
if ("$pkgCheck" -notmatch "package:") {
    Write-Host "FAIL: package $Package not installed — npm run android:install first" -ForegroundColor Red
    exit 1
}
Write-Ok "package installed"

if (-not (Test-Path -LiteralPath $ShotsDir)) {
    New-Item -ItemType Directory -Force -Path $ShotsDir | Out-Null
}
Initialize-UiShotsSession -ShotsDir $ShotsDir

Start-MainActivitySoft
if (-not (Wait-StoreReady -TimeoutSec $ReadyTimeoutSec)) {
    Write-Host "Captured so far: $($script:Captured.Count)" -ForegroundColor DarkGray
    exit 1
}
Write-Ok "logged-in tabs ready (no SMOKE)"

$tabs = @(
    @{ File = "store-01-oggi.png"; Tab = "tab-oggi"; Expect = "screen-oggi|oggi-add-exercise|oggi-streak-chip|oggi-volume-chip|tab-oggi" },
    @{ File = "store-02-storico.png"; Tab = "tab-storico"; Expect = "screen-history|history-export-button|history-empty-state|history-session-|tab-storico" },
    @{ File = "store-03-analisi.png"; Tab = "tab-analisi"; Expect = "screen-analytics|analytics-week-|analytics-volume-total|analytics-empty-state|tab-analisi" },
    @{ File = "store-04-profilo.png"; Tab = "tab-profilo"; Expect = "screen-profile|profile-settings-row|profile-streak-chip|tab-profilo" }
)

foreach ($t in $tabs) {
    if (-not (Invoke-TapStoreTab -TestId $t.Tab -ExpectPattern $t.Expect)) { continue }
    Capture-StoreNamedShot -FileName $t.File -ExpectPattern $t.Expect | Out-Null
}

if ($IncludeSettings) {
    if (Invoke-TapStoreTab -TestId "tab-profilo" -ExpectPattern "profile-settings-row|screen-profile|tab-profilo") {
        if (Invoke-TapTestId -TestId "profile-settings-row") {
            Capture-StoreNamedShot -FileName "store-05-impostazioni.png" -ExpectPattern "modal-settings|settings-close-button|settings-section-" -Label "settings" | Out-Null
            # Close settings so later shots stay clean
            $null = Invoke-TapTestId -TestId "settings-close-button"
            Start-Sleep -Milliseconds 500
        }
    }
}

if ($IncludeLog) {
    if (Invoke-TapStoreTab -TestId "tab-oggi" -ExpectPattern "screen-oggi|oggi-add-exercise|tab-oggi") {
        $xml = Get-UiXml
        $exId = $null
        if ($xml -match 'resource-id="(oggi-exercise-[^"]+)"') { $exId = $Matches[1] }
        if ($exId -and ($exId -notmatch "smoke")) {
            if (Invoke-TapTestId -TestId $exId) {
                Capture-StoreNamedShot -FileName "store-06-log-set.png" -ExpectPattern "log-save-set-button|modal-log|log-rest-presets" -Label "log set" | Out-Null
                $null = Invoke-Adb @("shell", "input", "keyevent", "4")
            }
        } else {
            Write-Host "SKIP: store-06-log-set (no non-smoke exercise row — add a real set on demo account)" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
if ($script:FailCount -gt 0) {
    Write-Host "DONE with FAIL ($($script:FailCount)): $($script:Captured.Count) store PNG(s) in $ShotsDir" -ForegroundColor Red
    exit 1
}
if ($script:Captured.Count -lt 2) {
    Write-Host "FAIL: need at least 2 phone screenshots for Play; got $($script:Captured.Count)" -ForegroundColor Red
    exit 1
}
Write-Host "PASS: $($script:Captured.Count) store PNG(s) → $ShotsDir" -ForegroundColor Green
Write-Host "Upload candidates (no SMOKE):" -ForegroundColor DarkGray
$script:Captured | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
exit 0
