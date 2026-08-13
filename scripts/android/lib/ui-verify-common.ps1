#Requires -Version 5.1
<#
.SYNOPSIS
  Shared adb UI verify helpers (Pixel_9a) with before/after screenshots.

.DESCRIPTION
  Dot-source AFTER android-env.ps1 + ui-shots.ps1.
  Requires: $script:adb, $script:SerialArgs, $script:Package, $script:SettleMs,
            Initialize-UiShotsSession already called.
#>

function Invoke-Adb {
    param([Parameter(Mandatory = $true)][string[]]$Cmd)
    if ($script:SerialArgs -and $script:SerialArgs.Count -gt 0) {
        & $script:adb @script:SerialArgs @Cmd
    } else {
        & $script:adb @Cmd
    }
}

function Write-Ok([string]$Message) {
    Write-Host "OK: $Message" -ForegroundColor Green
}

function Write-Fail {
    param([Parameter(Mandatory = $true)][string]$Message, [string]$Step = "")
    if (Get-Command Write-UiFail -ErrorAction SilentlyContinue) {
        Write-UiFail -Message $Message -StepOrTestId $(if ($Step) { $Step } else { "fail" })
    } else {
        Write-Host "FAIL: $Message" -ForegroundColor Red
        $script:FailCount++
    }
}

function Get-UiXml {
    if (Get-Command Get-UiXmlDumpText -ErrorAction SilentlyContinue) {
        return Get-UiXmlDumpText
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
            Start-Sleep -Milliseconds 400
            return $true
        }
    }
    return $false
}

function Wait-PackageFocus([int]$TimeoutSec = 10) {
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        $focus = Invoke-Adb @("shell", "dumpsys", "window") | Select-String -Pattern "mCurrentFocus|mFocusedApp" | Select-Object -First 3
        $focusText = ($focus | ForEach-Object { $_.Line }) -join " "
        if ($focusText -match [regex]::Escape($script:Package)) {
            return $true
        }
        Start-Sleep -Milliseconds 600
    }
    return $false
}

function Test-UiReadyXml([string]$Xml) {
    if (-not $Xml -or $Xml -notmatch "<hierarchy") { return $false }
    # Still bundling / splash-like empty shell
    if ($Xml -match "Loading from|Unable to load|UnableToResolve") { return $false }
    # Empty content root (no smoke/auth/tab markers yet)
    if ($Xml -notmatch "SMOKE|screen-|auth-|tab-|KINEFIT|modal-") { return $false }
    return $true
}

function Wait-UiPattern {
    param(
        [Parameter(Mandatory = $true)][string]$Pattern,
        [int]$TimeoutSec = 60,
        [string]$Step = "wait"
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        if (-not (Wait-PackageFocus -TimeoutSec 4)) {
            Start-Sleep -Milliseconds 400
            continue
        }
        Dismiss-PermissionIfAny | Out-Null
        $xml = Get-UiXml
        if ($xml -match "keeps stopping|has stopped|non risponde|si è interrotta") {
            Write-Fail -Message "crash dialog rilevato" -Step "$Step-crash"
            return $false
        }
        if ((Test-UiReadyXml $xml) -and ($xml -match $Pattern)) {
            # Require two consecutive matches to avoid Metro reload races
            Start-Sleep -Milliseconds 500
            $xml2 = Get-UiXml
            if ((Test-UiReadyXml $xml2) -and ($xml2 -match $Pattern)) {
                return $true
            }
        }
        Start-Sleep -Milliseconds 700
    }
    return $false
}

function Start-SmokeUrl {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [string]$Step = "deeplink"
    )
    $label = Get-SafeShotLabel ("pre-" + $Step)
    Capture-UiShot -Label $label | Out-Null

    $null = Invoke-Adb @("shell", "am", "force-stop", $script:Package)
    Start-Sleep -Milliseconds 700
    # Single shell string + single-quoted -d so device sh does not treat ? / & as special
    # (seed: kinefit://smoke/seed?days=7&sets=3).
    $shellCmd = "am start -a android.intent.action.VIEW -d '$Url' $script:Package"
    $null = Invoke-Adb @("shell", $shellCmd)
    $settle = 2500
    if ($script:SettleMs -and $script:SettleMs -gt 0) {
        $settle = [Math]::Max([int]$script:SettleMs, 2000)
    }
    Start-Sleep -Milliseconds $settle
    Dismiss-PermissionIfAny | Out-Null

    $deadline = (Get-Date).AddSeconds(45)
    while ((Get-Date) -lt $deadline) {
        if (Wait-PackageFocus -TimeoutSec 3) {
            $xml = Get-UiXml
            if (Test-UiReadyXml $xml) { break }
        }
        Start-Sleep -Milliseconds 600
    }

    Capture-UiShot -Label ("post-" + $Step) | Out-Null
}

function Find-NodeBounds {
    param([string]$Xml, [string]$TestId)
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
                X1 = [int]$Matches[1]; Y1 = [int]$Matches[2]
                X2 = [int]$Matches[3]; Y2 = [int]$Matches[4]
            }
        }
    }
    return $null
}

function Invoke-TapTestId {
    param(
        [Parameter(Mandatory = $true)][string]$TestId,
        [int]$Retries = 4
    )
    Capture-UiShot -Label ("pre-tap-$TestId") | Out-Null
    for ($i = 1; $i -le $Retries; $i++) {
        Dismiss-PermissionIfAny | Out-Null
        $xml = Get-UiXml
        $b = Find-NodeBounds -Xml $xml -TestId $TestId
        if ($null -eq $b) {
            # Label fallbacks for common rows
            if ($TestId -eq "profile-settings-row" -and $xml -match 'text="Impostazioni"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
                $b = @{ X1 = [int]$Matches[1]; Y1 = [int]$Matches[2]; X2 = [int]$Matches[3]; Y2 = [int]$Matches[4] }
            }
            if ($TestId -eq "profile-garmin-row" -and $xml -match 'text="Garmin Connect"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"') {
                $b = @{ X1 = [int]$Matches[1]; Y1 = [int]$Matches[2]; X2 = [int]$Matches[3]; Y2 = [int]$Matches[4] }
            }
        }
        if ($null -ne $b) {
            $cx = [int](($b.X1 + $b.X2) / 2)
            $cy = [int](($b.Y1 + $b.Y2) / 2)
            $null = Invoke-Adb @("shell", "input", "tap", "$cx", "$cy")
            Start-Sleep -Milliseconds 650
            Capture-UiShot -Label ("post-tap-$TestId") | Out-Null
            return $true
        }
        Start-Sleep -Milliseconds (350 * $i)
    }
    Write-Fail -Message "tap fallito: $TestId" -Step "tap-$TestId"
    return $false
}

function Assert-UiContains {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Pattern
    )
    Capture-UiShot -Label ("pre-assert-$Name") | Out-Null
    for ($attempt = 1; $attempt -le 6; $attempt++) {
        $xml = Get-UiXml
        if ($xml -match "permissioncontroller|permission_allow") {
            Dismiss-PermissionIfAny | Out-Null
            Start-Sleep -Milliseconds 500
            $xml = Get-UiXml
        }
        if ((Test-UiReadyXml $xml) -and ($xml -match $Pattern)) {
            Write-Ok ("{0}: match /{1}/" -f $Name, $Pattern)
            Capture-UiShot -Label ("post-assert-$Name") | Out-Null
            return $true
        }
        Start-Sleep -Milliseconds (400 * $attempt)
    }
    Write-Fail -Message ("{0}: pattern non trovato /{1}/" -f $Name, $Pattern) -Step "assert-$Name"
    return $false
}

function Ensure-AdbReverseMetro {
    $null = Invoke-Adb @("reverse", "tcp:8081", "tcp:8081")
    Write-Ok "adb reverse tcp:8081"
}
