#Requires -Version 5.1
<#
.SYNOPSIS
  Ops UI coverage — tab smoke + modali apribili senza login/Garmin OAuth.

.DESCRIPTION
  Deep-link smoke + tap su testID (content-desc RN):
  - Auth markers
  - Tutte le tab
  - Profilo → Impostazioni (apri/chiudi)
  - Profilo → Garmin modal shell (solo UI, zero OAuth)
  - Oggi → Nuovo esercizio (apri/chiudi)
  - History export / search markers

.EXAMPLE
  .\scripts\android\verify_ui_ops.ps1
#>
[CmdletBinding()]
param(
    [string]$Package = "com.coemi.kinefit.elite",
    [string]$Serial = "",
    [switch]$NoBoot,
    [int]$SettleMs = 1500,
    [int]$ReadyTimeoutSec = 60
)

$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ShotsDir = Join-Path $ScriptDir ".ui-shots"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$script:FailCount = 0
$script:adb = $null
$script:SerialArgs = @()
$script:Package = $Package
. (Join-Path $ScriptDir "lib\android-env.ps1")
. (Join-Path $ScriptDir "lib\ui-shots.ps1")

function Write-Ok([string]$Message) {
    Write-Host "OK: $Message" -ForegroundColor Green
}

function Invoke-Adb([string[]]$Cmd) {
    if ($script:SerialArgs.Count -gt 0) {
        & $script:adb @script:SerialArgs @Cmd
    } else {
        & $script:adb @Cmd
    }
}

function Write-Fail {
    param(
        [Parameter(Mandatory = $true, Position = 0)][string]$Message,
        [string]$Step = ""
    )
    if (-not $Step) {
        if ($Message -match '^([a-zA-Z0-9_\-]+)') { $Step = $Matches[1] }
        else { $Step = "ops" }
    }
    Write-UiFail -Message $Message -StepOrTestId $Step
}

function Get-SmokeStepLabel([string]$Url) {
    if ($Url -match 'smoke/([^?]+)') {
        $path = ($Matches[1] -replace '/', '-')
        if ($Url -match 'tab=([a-z]+)') { return "ops-$path-$($Matches[1])" }
        if ($Url -match 'modal=([a-z\-]+)') { return "ops-$path-modal-$($Matches[1])" }
        if ($Url -match 'timer=') { return "ops-$path-timer" }
        return "ops-$path"
    }
    return "ops-deeplink"
}

function Get-UiXml {
    $probe = "/data/local/tmp/kinefit_ops_probe.xml"
    for ($attempt = 1; $attempt -le 8; $attempt++) {
        try {
            $stream = Invoke-Adb @("exec-out", "uiautomator", "dump", "/dev/tty") 2>$null
            $text = if ($null -eq $stream) { "" } elseif ($stream -is [array]) { ($stream -join "`n") } else { [string]$stream }
            if ($text -match "<hierarchy") {
                return $text
            }
        } catch { }

        $null = Invoke-Adb @("shell", "uiautomator", "dump", $probe) 2>$null
        $xml = Invoke-Adb @("shell", "cat", $probe) 2>$null
        $null = Invoke-Adb @("shell", "rm", $probe) 2>$null
        $text = if ($null -eq $xml) { "" } elseif ($xml -is [array]) { ($xml -join "`n") } else { [string]$xml }
        if ($text -match "<hierarchy" -and $text -notmatch "No such file|null root node") {
            return $text
        }
        Start-Sleep -Milliseconds (500 * $attempt)
    }
    return ""
}

function Dismiss-PermissionIfAny {
    $xml = Get-UiXml
    $ridPatterns = @(
        'resource-id="com\.android\.permissioncontroller:id/permission_allow_foreground_only_button"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
        'resource-id="com\.android\.permissioncontroller:id/permission_allow_button"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
        'text="While using the app"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
        'text="Allow"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"',
        'text="Consenti"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"'
    )
    foreach ($pat in $ridPatterns) {
        if ($xml -match $pat) {
            $cx = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
            $cy = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
            $null = Invoke-Adb @("shell", "input", "tap", "$cx", "$cy")
            return
        }
    }
}

function Wait-PackageFocus([int]$TimeoutSec) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $focus = Invoke-Adb @("shell", "dumpsys", "window") | Select-String -Pattern "mCurrentFocus|mFocusedApp" | Select-Object -First 3
        $focusText = ($focus | ForEach-Object { $_.Line }) -join " "
        if ($focusText -match [regex]::Escape($Package)) {
            return $true
        }
        Start-Sleep -Milliseconds 700
    }
    return $false
}

function Wait-UiPattern([string]$Pattern, [int]$TimeoutSec) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (-not (Wait-PackageFocus -TimeoutSec 5)) {
            Start-Sleep -Milliseconds 500
            continue
        }
        Dismiss-PermissionIfAny
        $xml = Get-UiXml
        if ($xml -match "keeps stopping|has stopped|non risponde|si è interrotta") {
            Write-Fail -Message "crash dialog rilevato (app non stabile)" -Step "ops-crash"
            return $false
        }
        if ($xml -match $Pattern) {
            return $true
        }
        Start-Sleep -Milliseconds 800
    }
    return $false
}

function Start-SmokeUrl([string]$Url) {
    $step = Get-SmokeStepLabel $Url
    Capture-UiShot -Label ("pre-" + $step) | Out-Null
    $null = Invoke-Adb @("shell", "am", "force-stop", $Package)
    Start-Sleep -Milliseconds 1200
    # Match ui-verify-common / c72cbdb: quote -d so query params survive device sh.
    $shellCmd = "am start -a android.intent.action.VIEW -d '$Url' $Package"
    $null = Invoke-Adb @("shell", $shellCmd)
    Start-Sleep -Milliseconds ([Math]::Max($SettleMs, 8000))
    Dismiss-PermissionIfAny
    $deadline = (Get-Date).AddSeconds(90)
    while ((Get-Date) -lt $deadline) {
        if (Wait-PackageFocus -TimeoutSec 4) {
            $xml = Get-UiXml
            # Avoid false-ready on package name "kinefit" / empty splash shell
            if ($xml -match "<hierarchy" -and $xml -match "SMOKE|screen-|auth-|tab-|modal-|smoke-seed|ELITE TRAINING|auth-email|oggi-|analytics-") {
                break
            }
        }
        Start-Sleep -Milliseconds 800
    }
    Capture-UiShot -Label ("post-" + $step) | Out-Null
}

function Save-Shot([string]$Name) {
    # Prefer shared Capture-UiShot (/data/local/tmp + exec-out fallback)
    $shot = Capture-UiShot -Label ("ops-" + $Name)
    if ($shot) {
        Write-Ok "shot: $shot"
        return $shot
    }
    Write-Host "WARN: screenshot empty/missing: $Name" -ForegroundColor Yellow
    return $null
}

function Assert-UiContains([string]$Name, [string]$Pattern) {
    Capture-UiShot -Label ("pre-assert-$Name") | Out-Null
    $xml = Get-UiXml
    if ($xml -match "permissioncontroller|permission_allow") {
        Dismiss-PermissionIfAny
        Start-Sleep -Milliseconds 600
        $xml = Get-UiXml
    }
    if ($xml -notmatch $Pattern) {
        Write-Fail -Message ("{0}: pattern non trovato /{1}/" -f $Name, $Pattern) -Step "assert-$Name"
        return $false
    }
    Write-Ok ("{0}: match /{1}/" -f $Name, $Pattern)
    Capture-UiShot -Label ("post-assert-$Name") | Out-Null
    return $true
}

function Find-NodeBounds([string]$Xml, [string]$TestId) {
    # RN 0.81 maps testID → resource-id (preferred) and sometimes content-desc
    $escaped = [regex]::Escape($TestId)
    $patterns = @(
        "resource-id=`"$escaped`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"",
        "bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"[^>]*resource-id=`"$escaped`"",
        "content-desc=`"$escaped`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"",
        "bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`"[^>]*content-desc=`"$escaped`"",
        "text=`"$escaped`"[^>]*bounds=`"\[(\d+),(\d+)\]\[(\d+),(\d+)\]`""
    )
    foreach ($pat in $patterns) {
        if ($Xml -match $pat) {
            return @{
                X1 = [int]$Matches[1]
                Y1 = [int]$Matches[2]
                X2 = [int]$Matches[3]
                Y2 = [int]$Matches[4]
            }
        }
    }
    return $null
}

function Invoke-TapTestId([string]$TestId, [int]$Retries = 4) {
    Capture-UiShot -Label ("pre-tap-$TestId") | Out-Null
    for ($i = 1; $i -le $Retries; $i++) {
        Dismiss-PermissionIfAny
        $xml = Get-UiXml
        $b = Find-NodeBounds -Xml $xml -TestId $TestId
        if ($null -ne $b) {
            $cx = [int](($b.X1 + $b.X2) / 2)
            $cy = [int](($b.Y1 + $b.Y2) / 2)
            $null = Invoke-Adb @("shell", "input", "tap", "$cx", "$cy")
            Start-Sleep -Milliseconds 700
            Capture-UiShot -Label ("post-tap-$TestId") | Out-Null
            return $true
        }
        # Fallback: visible label for settings / garmin rows
        if ($TestId -eq "profile-settings-row" -and $xml -match 'text="Impostazioni"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
            $cx = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
            $cy = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
            $null = Invoke-Adb @("shell", "input", "tap", "$cx", "$cy")
            Start-Sleep -Milliseconds 700
            Capture-UiShot -Label ("post-tap-$TestId") | Out-Null
            return $true
        }
        if ($TestId -eq "profile-garmin-row" -and $xml -match 'text="Garmin Connect"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
            $cx = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
            $cy = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
            $null = Invoke-Adb @("shell", "input", "tap", "$cx", "$cy")
            Start-Sleep -Milliseconds 700
            Capture-UiShot -Label ("post-tap-$TestId") | Out-Null
            return $true
        }
        Start-Sleep -Milliseconds (400 * $i)
    }
    return $false
}

Write-Host "=== KineFit verify_ui_ops ===" -ForegroundColor Cyan
Write-Host "Policy: zero login reale / zero Garmin OAuth. Solo deep-link + tap UI." -ForegroundColor DarkGray
Write-Host "Device target: AVD Pixel_9A / Pixel_9a" -ForegroundColor DarkGray

try {
    $device = Ensure-AndroidUiDevice -Serial $Serial -NoBoot:$NoBoot
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    exit 1
}
$script:adb = $device.Adb
$Serial = $device.Serial
$script:SerialArgs = @("-s", $Serial)
$script:Package = $Package
Initialize-UiShotsSession -ShotsDir $ShotsDir
Write-Ok "adb = $($script:adb)"
Write-Ok "device: $Serial$(if ($device.AvdName) { " (AVD $($device.AvdName))" })"
Write-Ok "shots: $ShotsDir (fail-* + step-*)"

$pathCheck = Invoke-Adb @("shell", "pm", "path", $Package) 2>&1
if ("$pathCheck" -notmatch "package:") {
    Write-Host "FAIL: package $Package non installato" -ForegroundColor Red
    exit 1
}
Write-Ok "package: $Package"
# Avoid notification permission dialog blocking dumps/taps (API 33+)
Invoke-Adb @('shell','pm','grant',$Package,'android.permission.POST_NOTIFICATIONS') 2>$null | Out-Null

# --- Auth ---
Write-Host ""
Write-Host "--- ops/auth ---" -ForegroundColor Cyan
Start-SmokeUrl "kinefit://smoke/auth"
if (-not (Wait-UiPattern -Pattern "SMOKE|auth-email-input|screen-auth|KINEFIT" -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "auth: UI non pronta"
    Save-Shot "auth" | Out-Null
} else {
    Assert-UiContains "auth" "auth-email-input|screen-auth|KINEFIT|ACCEDI" | Out-Null
    Assert-UiContains "auth-submit" "auth-submit-button|ACCEDI|Registrati|REGISTRATI" | Out-Null
    Save-Shot "auth" | Out-Null
}

# --- Seed fixtures BEFORE tab assertions (simulated workouts) ---
Write-Host ""
Write-Host "--- ops/seed ---" -ForegroundColor Cyan
Save-Shot "pre-seed" | Out-Null
Start-SmokeUrl "kinefit://smoke/clear"
Start-Sleep -Milliseconds 800
Start-SmokeUrl "kinefit://smoke/seed?days=7&sets=3"
if (-not (Wait-UiPattern -Pattern "smoke-seed-ready|seed:seeded" -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "seed: smoke-seed-ready non visibile"
    Save-Shot "seed-fail" | Out-Null
} else {
    Assert-UiContains "seed-ready" "smoke-seed-ready|seed:seeded|SEED" | Out-Null
    Save-Shot "post-seed" | Out-Null
    Write-Ok "seed: fixtures ready"
}

# --- Tab markers (prefer non-empty after seed) ---
$tabs = @(
    @{ Name = "oggi"; Url = "kinefit://smoke/tabs?tab=oggi"; Pattern = "screen-oggi|oggi-add-exercise|oggi-volume-chip|oggi-streak-chip|Volume \(kg\)|kg|tab-oggi" },
    @{ Name = "storico"; Url = "kinefit://smoke/tabs?tab=storico"; Pattern = "screen-history|history-sessions-list|Cronologia|history-search-input|history-session-hint|history-session-duration-|history-session-pr-|Smoke|Allenamento" },
    @{ Name = "analisi"; Url = "kinefit://smoke/tabs?tab=analisi"; Pattern = "screen-analytics|Analisi|analytics-heatmap|tab-analisi" },
    @{ Name = "profilo"; Url = "kinefit://smoke/tabs?tab=profilo"; Pattern = "screen-profile|profile-settings-row|profile-streak-chip|Profilo|tab-profilo" }
)

foreach ($t in $tabs) {
    Write-Host ""
    Write-Host "--- ops/tab $($t.Name) ---" -ForegroundColor Cyan
    Start-SmokeUrl "$($t.Url)"
    if (-not (Wait-UiPattern -Pattern $t.Pattern -TimeoutSec $ReadyTimeoutSec)) {
        Write-Fail "$($t.Name): UI non pronta"
        Save-Shot $t.Name | Out-Null
        continue
    }
    Assert-UiContains $t.Name $t.Pattern | Out-Null
    Save-Shot $t.Name | Out-Null

    # b6b0a12: volume + streak chips after seed
    if ($t.Name -eq "oggi") {
        if (-not (Wait-UiPattern -Pattern "oggi-volume-chip" -TimeoutSec 20)) {
            Write-Fail "oggi: oggi-volume-chip assente dopo seed"
            Save-Shot "oggi-volume-chip-fail" | Out-Null
        } else {
            Assert-UiContains "oggi-volume-chip" "oggi-volume-chip" | Out-Null
            Assert-UiContains "oggi-volume-kg" "kg|KG|Volume" | Out-Null
            Save-Shot "oggi-volume-chip-seeded" | Out-Null
            Write-Ok "oggi: volume chip after seed"
        }
        if (-not (Wait-UiPattern -Pattern "oggi-streak-chip" -TimeoutSec 15)) {
            Write-Fail "oggi: oggi-streak-chip assente dopo seed"
            Save-Shot "oggi-streak-chip-fail" | Out-Null
        } else {
            Assert-UiContains "oggi-streak-chip" "oggi-streak-chip|Sett\.|giorni di fila|streak" | Out-Null
            Save-Shot "oggi-streak-chip-seeded" | Out-Null
            Write-Ok "oggi: streak chip after seed"
        }
        # Soft cover: sync banners only if visible
        if (Wait-UiPattern -Pattern "oggi-sync-fail-banner|oggi-offline-banner|oggi-sync-toast" -TimeoutSec 3) {
            Assert-UiContains "oggi-sync-banner" "oggi-sync-fail-banner|oggi-offline-banner|oggi-sync-toast" | Out-Null
            Save-Shot "oggi-sync-banner-visible" | Out-Null
            Write-Ok "oggi: sync banner visible"
        }
    }
    # 5927ad7 / aa0405c: History hint + duration (+ volume) after seed
    if ($t.Name -eq "storico") {
        if (-not (Wait-UiPattern -Pattern "history-session-hint" -TimeoutSec 20)) {
            Write-Fail "storico: history-session-hint assente dopo seed"
            Save-Shot "history-session-hint-fail" | Out-Null
        } else {
            Assert-UiContains "history-session-hint" "history-session-hint|Tocca una sessione|dettagli" | Out-Null
            Save-Shot "history-session-hint-seeded" | Out-Null
            Write-Ok "storico: history-session-hint after seed"
        }
        if (-not (Wait-UiPattern -Pattern "history-session-duration-" -TimeoutSec 20)) {
            Write-Fail "storico: history-session-duration-* assente dopo seed"
            Save-Shot "history-session-duration-fail" | Out-Null
        } else {
            Assert-UiContains "history-session-duration" "history-session-duration-|min|h " | Out-Null
            Save-Shot "history-session-duration-seeded" | Out-Null
            Write-Ok "storico: history-session-duration-* after seed"
        }
        if (-not (Wait-UiPattern -Pattern "history-session-pr-" -TimeoutSec 20)) {
            Write-Fail "storico: history-session-pr-* assente dopo seed"
            Save-Shot "history-session-pr-fail" | Out-Null
        } else {
            Assert-UiContains "history-session-pr" "history-session-pr-|PR|record" | Out-Null
            Save-Shot "history-session-pr-seeded" | Out-Null
            Write-Ok "storico: history-session-pr-* after seed"
        }
        if (Wait-UiPattern -Pattern "history-session-volume-" -TimeoutSec 10) {
            Assert-UiContains "history-session-volume" "history-session-volume-|kg|KG" | Out-Null
            Save-Shot "history-session-volume-seeded" | Out-Null
            Write-Ok "storico: history-session-volume-* after seed"
        }
    }
    # 1873867 / 3024eb5: week selector + heatmap when seeded
    if ($t.Name -eq "analisi") {
        if (-not (Wait-UiPattern -Pattern "analytics-week-selector|analytics-week-label|analytics-week-prev|analytics-week-next" -TimeoutSec 25)) {
            Write-Fail "analisi: analytics-week-* assente"
            Save-Shot "analytics-week-fail" | Out-Null
        } else {
            Assert-UiContains "analytics-week-selector" "analytics-week-selector" | Out-Null
            Assert-UiContains "analytics-week-label" "analytics-week-label|Questa settimana|settimana" | Out-Null
            Assert-UiContains "analytics-week-prev" "analytics-week-prev|Settimana precedente" | Out-Null
            Assert-UiContains "analytics-week-next" "analytics-week-next|Settimana successiva" | Out-Null
            Save-Shot "analytics-week-selector-seeded" | Out-Null
            Write-Ok "analisi: analytics-week-* after seed"
            if (Invoke-TapTestId "analytics-week-prev") {
                if (Wait-UiPattern -Pattern "analytics-week-label|analytics-heatmap|analytics-empty-state|analytics-week-loading" -TimeoutSec 15) {
                    Save-Shot "analytics-week-prev-tapped" | Out-Null
                    Write-Ok "analisi: week prev tap"
                }
            }
        }
        if (-not (Wait-UiPattern -Pattern "analytics-heatmap" -TimeoutSec 20)) {
            Write-Fail "analisi: analytics-heatmap assente dopo seed"
            Save-Shot "analisi-heatmap-fail" | Out-Null
        } else {
            Assert-UiContains "analisi-heatmap" "analytics-heatmap" | Out-Null
            Save-Shot "analisi-heatmap-seeded" | Out-Null
            Write-Ok "analisi: heatmap after seed"
        }
    }
}

# --- Settings modal (profilo) ---
Write-Host ""
Write-Host "--- ops/modal settings ---" -ForegroundColor Cyan
Start-SmokeUrl "kinefit://smoke/tabs?tab=profilo"
if (-not (Wait-UiPattern -Pattern "profile-settings-row|Impostazioni|screen-profile" -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "settings: profilo non pronto"
    Save-Shot "settings-fail" | Out-Null
} else {
    if (-not (Invoke-TapTestId "profile-settings-row")) {
        Write-Fail "settings: tap profile-settings-row fallito"
        Save-Shot "settings-tap-fail" | Out-Null
    } else {
        if (-not (Wait-UiPattern -Pattern "modal-settings|Impostazioni|Vibrazione|Timer Automatico" -TimeoutSec 20)) {
            Write-Fail "settings: modal non visibile"
            Save-Shot "settings-missing" | Out-Null
        } else {
            Assert-UiContains "settings-modal" "modal-settings|Impostazioni|Vibrazione" | Out-Null
            Save-Shot "settings-open" | Out-Null
            if (-not (Invoke-TapTestId "settings-close-button")) {
                # fallback: back
                $null = Invoke-Adb @("shell", "input", "keyevent", "4")
                Start-Sleep -Milliseconds 600
            }
            if (-not (Wait-UiPattern -Pattern "screen-profile|profile-settings-row" -TimeoutSec 15)) {
                Write-Fail "settings: chiusura non tornata a profilo"
            } else {
                Write-Ok "settings: open+close"
            }
        }
    }
}

# --- Garmin modal shell only (no OAuth) ---
Write-Host ""
Write-Host "--- ops/modal garmin-shell ---" -ForegroundColor Cyan
Start-SmokeUrl "kinefit://smoke/tabs?tab=profilo"
if (-not (Wait-UiPattern -Pattern "profile-garmin-row|Garmin Connect|screen-profile" -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "garmin-shell: profilo non pronto"
    Save-Shot "garmin-fail" | Out-Null
} else {
    if (-not (Invoke-TapTestId "profile-garmin-row")) {
        Write-Fail "garmin-shell: tap profile-garmin-row fallito"
        Save-Shot "garmin-tap-fail" | Out-Null
    } else {
        if (-not (Wait-UiPattern -Pattern "modal-garmin|Garmin Connect|Client ID" -TimeoutSec 20)) {
            Write-Fail "garmin-shell: modal non visibile"
            Save-Shot "garmin-missing" | Out-Null
        } else {
            Assert-UiContains "garmin-modal" "modal-garmin|Garmin Connect|demo|Client ID" | Out-Null
            Save-Shot "garmin-open" | Out-Null
            if (-not (Invoke-TapTestId "garmin-close-button")) {
                $null = Invoke-Adb @("shell", "input", "keyevent", "4")
                Start-Sleep -Milliseconds 600
            }
            Write-Ok "garmin-shell: open+close (no OAuth)"
        }
    }
}

# --- Add exercise modal (oggi) ---
Write-Host ""
Write-Host "--- ops/modal add-exercise ---" -ForegroundColor Cyan
Start-SmokeUrl "kinefit://smoke/tabs?tab=oggi"
if (-not (Wait-UiPattern -Pattern "oggi-add-exercise|screen-oggi" -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "add-exercise: oggi non pronto"
    Save-Shot "add-ex-fail" | Out-Null
} else {
    if (-not (Invoke-TapTestId "oggi-add-exercise")) {
        Write-Fail "add-exercise: tap oggi-add-exercise fallito"
        Save-Shot "add-ex-tap-fail" | Out-Null
    } else {
        if (-not (Wait-UiPattern -Pattern "modal-add-exercise|Nuovo Esercizio|add-exercise-name-input|Nome Esercizio" -TimeoutSec 20)) {
            Write-Fail "add-exercise: modal non visibile"
            Save-Shot "add-ex-missing" | Out-Null
        } else {
            Assert-UiContains "add-exercise-modal" "modal-add-exercise|Nuovo Esercizio|add-exercise-name-input|Nome Esercizio" | Out-Null
            Save-Shot "add-exercise-open" | Out-Null
            if (-not (Invoke-TapTestId "add-exercise-close-button")) {
                $null = Invoke-Adb @("shell", "input", "keyevent", "4")
                Start-Sleep -Milliseconds 600
            }
            if (-not (Wait-UiPattern -Pattern "screen-oggi|oggi-add-exercise" -TimeoutSec 15)) {
                Write-Fail "add-exercise: chiusura non tornata a oggi"
            } else {
                Write-Ok "add-exercise: open+close"
            }
        }
    }
}

# --- Rest presets: log modal chips + floating timer (8507530) ---
Write-Host ""
Write-Host "--- ops/rest-presets log ---" -ForegroundColor Cyan
Start-SmokeUrl "kinefit://smoke/tabs?tab=oggi&modal=log"
if (-not (Wait-UiPattern -Pattern "log-rest-presets|log-rest-preset-|modal-log|Recupero" -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "rest-presets-log: log modal / chips non visibili"
    Save-Shot "log-rest-presets-fail" | Out-Null
} else {
    Assert-UiContains "log-rest-presets" "log-rest-presets" | Out-Null
    Assert-UiContains "log-rest-preset-60" "log-rest-preset-60" | Out-Null
    Assert-UiContains "log-rest-preset-90" "log-rest-preset-90" | Out-Null
    Assert-UiContains "log-rest-preset-120" "log-rest-preset-120" | Out-Null
    Assert-UiContains "log-rest-preset-180" "log-rest-preset-180" | Out-Null
    Save-Shot "log-rest-presets" | Out-Null
    Write-Ok "rest-presets: log-rest-preset-* visible"
}

Write-Host ""
Write-Host "--- ops/rest-presets timer ---" -ForegroundColor Cyan
Start-SmokeUrl "kinefit://smoke/tabs?tab=oggi&timer=90"
if (-not (Wait-UiPattern -Pattern "timer-rest-presets|timer-rest-preset-|timer-display|FloatingTimer|Recupero" -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "rest-presets-timer: timer / chips non visibili"
    Save-Shot "timer-rest-presets-fail" | Out-Null
} else {
    Assert-UiContains "timer-rest-presets" "timer-rest-presets" | Out-Null
    Assert-UiContains "timer-rest-preset-90" "timer-rest-preset-90" | Out-Null
    Assert-UiContains "timer-rest-preset-row" "timer-rest-preset-60|timer-rest-preset-120|timer-rest-preset-180" | Out-Null
    Save-Shot "timer-rest-presets" | Out-Null
    Write-Ok "rest-presets: timer-rest-presets + preset-90 after timer=90"
}

# --- History markers (export/search present, no network action) ---
Write-Host ""
Write-Host "--- ops/history markers ---" -ForegroundColor Cyan
Start-SmokeUrl "kinefit://smoke/tabs?tab=storico"
if (-not (Wait-UiPattern -Pattern "screen-history|Cronologia" -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "history: UI non pronta"
    Save-Shot "history-fail" | Out-Null
} else {
    Assert-UiContains "history-list" "history-sessions-list|Cronologia" | Out-Null
    Assert-UiContains "history-search" "history-search-input|Cerca|search" | Out-Null
    Assert-UiContains "history-export" "history-export-button|Esporta|export|share" | Out-Null
    Assert-UiContains "history-session-hint" "history-session-hint|Tocca una sessione|dettagli" | Out-Null
    Assert-UiContains "history-session-duration" "history-session-duration-|min|h " | Out-Null
    Assert-UiContains "history-session-pr" "history-session-pr-|PR|record" | Out-Null
    Save-Shot "history-markers" | Out-Null
    Write-Ok "history: markers + hint + duration + PR"
}

# --- Analytics empty after clear (268f619) ---
Write-Host ""
Write-Host "--- ops/analytics-empty ---" -ForegroundColor Cyan
Save-Shot "pre-analytics-clear" | Out-Null
Start-SmokeUrl "kinefit://smoke/clear"
Start-Sleep -Milliseconds 800
Start-SmokeUrl "kinefit://smoke/tabs?tab=analisi"
if (-not (Wait-UiPattern -Pattern "screen-analytics|Analisi|tab-analisi" -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "analytics-empty: analisi non pronta dopo clear"
    Save-Shot "analytics-empty-fail" | Out-Null
} elseif (-not (Wait-UiPattern -Pattern "analytics-empty-state|analytics-empty-goto-hint" -TimeoutSec 25)) {
    Write-Fail "analytics-empty: empty state non visibile dopo clear"
    Save-Shot "analytics-empty-missing" | Out-Null
} else {
    Assert-UiContains "analytics-empty-state" "analytics-empty-state" | Out-Null
    Assert-UiContains "analytics-empty-goto-hint" "analytics-empty-goto-hint|Vai a Oggi" | Out-Null
    Save-Shot "analytics-empty-after-clear" | Out-Null
    Write-Ok "analisi: empty state after clear"
}

Write-Host ""
if ($script:FailCount -gt 0) {
    Write-Host "VERIFY UI OPS FAILED ($($script:FailCount) errori)" -ForegroundColor Red
    exit 1
}

Write-Host "VERIFY UI OPS PASSED" -ForegroundColor Green
exit 0


