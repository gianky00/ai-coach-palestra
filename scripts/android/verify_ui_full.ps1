#Requires -Version 5.1
<#
.SYNOPSIS
  Deep UI coverage — Auth smoke + tutte le tab via deep-link (zero login / Garmin).

.EXAMPLE
  .\scripts\android\verify_ui_full.ps1
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
    $probe = "/data/local/tmp/kinefit_full_probe.xml"
    for ($attempt = 1; $attempt -le 5; $attempt++) {
        $null = Invoke-Adb @("shell", "uiautomator", "dump", $probe)
        $xml = Invoke-Adb @("shell", "cat", $probe)
        $null = Invoke-Adb @("shell", "rm", $probe)
        $text = if ($null -eq $xml) { "" } elseif ($xml -is [array]) { ($xml -join "`n") } else { [string]$xml }
        if ($text -match "<hierarchy" -and $text -notmatch "No such file") {
            return $text
        }
        Start-Sleep -Milliseconds (400 * $attempt)
    }
    return ""
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

function Start-SmokeUrl([string]$Url) {
    $null = Invoke-Adb @("shell", "am", "force-stop", $Package)
    Start-Sleep -Milliseconds 400
    $null = Invoke-Adb @("shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", $Url, $Package)
    Start-Sleep -Milliseconds $SettleMs
    Dismiss-PermissionIfAny
}

function Save-Shot([string]$Name) {
    $remote = "/sdcard/kinefit_ui_$Name.png"
    $local = Join-Path $ShotsDir ("full-{0}-{1}.png" -f $Name, $stamp)
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

Write-Host "=== KineFit verify_ui_full ===" -ForegroundColor Cyan
Write-Host "Policy: zero login reale / zero Garmin OAuth. Solo deep-link smoke." -ForegroundColor DarkGray
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

# --- Auth smoke ---
Write-Host ""
Write-Host "--- smoke/auth ---" -ForegroundColor Cyan
Start-SmokeUrl "kinefit://smoke/auth"
if (-not (Wait-UiPattern -Pattern "SMOKE|auth-email-input|ELITE TRAINING|screen-auth|(KINEFIT.*Email)|(Email.*ACCEDI)" -TimeoutSec $ReadyTimeoutSec)) {
    Write-Fail "auth: UI non pronta / pattern mancante"
    Save-Shot "auth" | Out-Null
} else {
    Assert-UiContains "auth" "SMOKE|auth-email-input|ELITE TRAINING|screen-auth|KINEFIT|Email|ACCEDI" | Out-Null
    Save-Shot "auth" | Out-Null
}

# --- Tabs smoke (no session required) ---
$tabs = @(
    @{ Name = "oggi"; Url = "kinefit://smoke/tabs?tab=oggi"; Pattern = "SMOKE|screen-oggi|Volume Oggi|tab-oggi|oggi-add-exercise" },
    @{ Name = "storico"; Url = "kinefit://smoke/tabs?tab=storico"; Pattern = "SMOKE|screen-history|Cronologia|history-sessions-list|tab-storico" },
    @{ Name = "analisi"; Url = "kinefit://smoke/tabs?tab=analisi"; Pattern = "SMOKE|screen-analytics|Analisi|analytics-heatmap|tab-analisi" },
    @{ Name = "profilo"; Url = "kinefit://smoke/tabs?tab=profilo"; Pattern = "SMOKE|screen-profile|Profilo|profile-settings-row|tab-profilo|Membro Premium" }
)

foreach ($t in $tabs) {
    Write-Host ""
    Write-Host "--- smoke/tabs $($t.Name) ---" -ForegroundColor Cyan
    Start-SmokeUrl $t.Url
    if (-not (Wait-UiPattern -Pattern $t.Pattern -TimeoutSec $ReadyTimeoutSec)) {
        Write-Fail "$($t.Name): UI non pronta / pattern mancante"
        Save-Shot $t.Name | Out-Null
        continue
    }
    Assert-UiContains $t.Name $t.Pattern | Out-Null
    Save-Shot $t.Name | Out-Null
}

Write-Host ""
if ($script:FailCount -gt 0) {
    Write-Host "VERIFY UI FULL FAILED ($($script:FailCount) errori)" -ForegroundColor Red
    exit 1
}

Write-Host "VERIFY UI FULL PASSED" -ForegroundColor Green
exit 0
