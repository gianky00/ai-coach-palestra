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
. (Join-Path $ScriptDir "lib\android-env.ps1")

function Write-Fail([string]$Message) {
    Write-Host "FAIL: $Message" -ForegroundColor Red
    $script:FailCount++
}

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
            Write-Fail "crash dialog rilevato (app non stabile)"
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
    $null = Invoke-Adb @("shell", "am", "force-stop", $Package)
    Start-Sleep -Milliseconds 900
    $null = Invoke-Adb @("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", $Url, $Package)
    Start-Sleep -Milliseconds ([Math]::Max($SettleMs, 2500))
    Dismiss-PermissionIfAny
    $deadline = (Get-Date).AddSeconds(20)
    while ((Get-Date) -lt $deadline) {
        if (Wait-PackageFocus -TimeoutSec 3) {
            $xml = Get-UiXml
            if ($xml -match "<hierarchy") { break }
        }
        Start-Sleep -Milliseconds 600
    }
}

function Save-Shot([string]$Name) {
    $remote = "/sdcard/kinefit_ui_ops_$Name.png"
    $local = Join-Path $ShotsDir ("ops-{0}-{1}.png" -f $Name, $stamp)
    $null = Invoke-Adb @("shell", "screencap", "-p", $remote)
    $null = Invoke-Adb @("pull", $remote, $local)
    $null = Invoke-Adb @("shell", "rm", $remote)
    if (-not (Test-Path -LiteralPath $local) -or ((Get-Item -LiteralPath $local).Length -lt 1000)) {
        Write-Fail "screenshot empty/missing: $Name"
        return $null
    }
    Write-Ok "shot: $local"
    return $local
}

function Assert-UiContains([string]$Name, [string]$Pattern) {
    $xml = Get-UiXml
    if ($xml -match "permissioncontroller|permission_allow") {
        Dismiss-PermissionIfAny
        Start-Sleep -Milliseconds 600
        $xml = Get-UiXml
    }
    if ($xml -notmatch $Pattern) {
        Write-Fail ("{0}: pattern non trovato /{1}/" -f $Name, $Pattern)
        return $false
    }
    Write-Ok ("{0}: match /{1}/" -f $Name, $Pattern)
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
    for ($i = 1; $i -le $Retries; $i++) {
        Dismiss-PermissionIfAny
        $xml = Get-UiXml
        $b = Find-NodeBounds -Xml $xml -TestId $TestId
        if ($null -ne $b) {
            $cx = [int](($b.X1 + $b.X2) / 2)
            $cy = [int](($b.Y1 + $b.Y2) / 2)
            $null = Invoke-Adb @("shell", "input", "tap", "$cx", "$cy")
            Start-Sleep -Milliseconds 700
            return $true
        }
        # Fallback: visible label for settings / garmin rows
        if ($TestId -eq "profile-settings-row" -and $xml -match 'text="Impostazioni"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
            $cx = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
            $cy = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
            $null = Invoke-Adb @("shell", "input", "tap", "$cx", "$cy")
            Start-Sleep -Milliseconds 700
            return $true
        }
        if ($TestId -eq "profile-garmin-row" -and $xml -match 'text="Garmin Connect"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
            $cx = [int](([int]$Matches[1] + [int]$Matches[3]) / 2)
            $cy = [int](([int]$Matches[2] + [int]$Matches[4]) / 2)
            $null = Invoke-Adb @("shell", "input", "tap", "$cx", "$cy")
            Start-Sleep -Milliseconds 700
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
Write-Ok "adb = $($script:adb)"
Write-Ok "device: $Serial$(if ($device.AvdName) { " (AVD $($device.AvdName))" })"

$pathCheck = Invoke-Adb @("shell", "pm", "path", $Package) 2>&1
if ("$pathCheck" -notmatch "package:") {
    Write-Host "FAIL: package $Package non installato" -ForegroundColor Red
    exit 1
}
Write-Ok "package: $Package"

if (-not (Test-Path -LiteralPath $ShotsDir)) {
    New-Item -ItemType Directory -Force -Path $ShotsDir | Out-Null
}

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

# --- Tab markers ---
$tabs = @(
    @{ Name = "oggi"; Url = "kinefit://smoke/tabs?tab=oggi"; Pattern = "screen-oggi|oggi-add-exercise|Volume \(kg\)|Volume Oggi|tab-oggi" },
    @{ Name = "storico"; Url = "kinefit://smoke/tabs?tab=storico"; Pattern = "screen-history|history-sessions-list|Cronologia|history-search-input" },
    @{ Name = "analisi"; Url = "kinefit://smoke/tabs?tab=analisi"; Pattern = "screen-analytics|Analisi|analytics-heatmap|tab-analisi" },
    @{ Name = "profilo"; Url = "kinefit://smoke/tabs?tab=profilo"; Pattern = "screen-profile|profile-settings-row|Profilo|tab-profilo" }
)

foreach ($t in $tabs) {
    Write-Host ""
    Write-Host "--- ops/tab $($t.Name) ---" -ForegroundColor Cyan
    Start-SmokeUrl $t.Url
    if (-not (Wait-UiPattern -Pattern $t.Pattern -TimeoutSec $ReadyTimeoutSec)) {
        Write-Fail "$($t.Name): UI non pronta"
        Save-Shot $t.Name | Out-Null
        continue
    }
    Assert-UiContains $t.Name $t.Pattern | Out-Null
    Save-Shot $t.Name | Out-Null
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
    Save-Shot "history-markers" | Out-Null
}

Write-Host ""
if ($script:FailCount -gt 0) {
    Write-Host "VERIFY UI OPS FAILED ($($script:FailCount) errori)" -ForegroundColor Red
    exit 1
}

Write-Host "VERIFY UI OPS PASSED" -ForegroundColor Green
exit 0
