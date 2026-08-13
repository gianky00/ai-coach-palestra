#Requires -Version 5.1
<#
.SYNOPSIS
  Screenshot / hierarchy dump helpers for UI verify scripts.

.DESCRIPTION
  Capture-UiShot → step-*.png (before/after)
  Capture-FailArtifacts / Write-UiFail → fail-*.{png,xml,log}
#>

$script:UiShotsDir = $null
$script:UiShotStamp = $null
$script:UiShotIndex = 0
$script:UiDumpLock = $false

function Initialize-UiShotsSession {
    param([Parameter(Mandatory = $true)][string]$ShotsDir)
    $script:UiShotsDir = $ShotsDir
    $script:UiShotStamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $script:UiShotIndex = 0
    if (-not (Test-Path -LiteralPath $ShotsDir)) {
        New-Item -ItemType Directory -Force -Path $ShotsDir | Out-Null
    }
}

function Get-SafeShotLabel([string]$Label) {
    $safe = ($Label -replace '[^a-zA-Z0-9_\-]+', '-').Trim('-')
    if (-not $safe) { $safe = "shot" }
    return $safe
}

function Save-AdbScreencap([string]$LocalPath) {
    # Prefer /data/local/tmp — app often lacks WRITE_EXTERNAL_STORAGE on API 34+
    $remote = "/data/local/tmp/kinefit_ui_cap.png"
    try {
        $null = Invoke-Adb @("shell", "screencap", "-p", $remote)
        $null = Invoke-Adb @("pull", $remote, $LocalPath)
        $null = Invoke-Adb @("shell", "rm", $remote)
    } catch { }
    if (-not ((Test-Path -LiteralPath $LocalPath) -and ((Get-Item -LiteralPath $LocalPath).Length -gt 1000))) {
        try {
            $adbBin = $script:adb
            if (-not $adbBin) { $adbBin = "adb" }
            $serialArgs = if ($script:SerialArgs) { ($script:SerialArgs -join " ") } else { "" }
            cmd /c "`"$adbBin`" $serialArgs exec-out screencap -p > `"$LocalPath`"" | Out-Null
        } catch { }
    }
    return ((Test-Path -LiteralPath $LocalPath) -and ((Get-Item -LiteralPath $LocalPath).Length -gt 1000))
}

function Capture-UiShot {
    param([Parameter(Mandatory = $true)][string]$Label)
    if (-not $script:UiShotsDir) { return $null }
    $script:UiShotIndex++
    $safe = Get-SafeShotLabel $Label
    $name = "step-{0}-{1}-{2:D3}.png" -f $safe, $script:UiShotStamp, $script:UiShotIndex
    $local = Join-Path $script:UiShotsDir $name
    if (Save-AdbScreencap -LocalPath $local) {
        Write-Host "SHOT: $local" -ForegroundColor DarkGray
        return $local
    }
    Write-Host "WARN: screenshot empty: $name" -ForegroundColor Yellow
    return $null
}

function Get-UiXmlDumpText {
    $probe = "/data/local/tmp/kinefit_ui_probe.xml"
    for ($attempt = 1; $attempt -le 12; $attempt++) {
        # Serialize dumps: concurrent uiautomator → "UiAutomationService already registered"
        if ($script:UiDumpLock) {
            Start-Sleep -Milliseconds (250 * $attempt)
        }
        $script:UiDumpLock = $true
        try {
            # Always drop prior probe — failed "could not get idle state" dumps leave stale XML
            # (e.g. app-boot-placeholder) that false-matches Wait/Assert.
            $null = Invoke-Adb @("shell", "rm", "-f", $probe) 2>$null
            try {
                $stream = Invoke-Adb @("exec-out", "uiautomator", "dump", "/dev/tty") 2>$null
                $text = if ($null -eq $stream) { "" } elseif ($stream -is [array]) { ($stream -join "`n") } else { [string]$stream }
                if ($text -match "already registered|could not get idle state") {
                    Start-Sleep -Milliseconds (700 * $attempt)
                    continue
                }
                if ($text -match "<hierarchy" -and $text -match "com\.coemi\.kinefit\.elite") { return $text }
                if ($text -match "<hierarchy" -and $text -notmatch "nexuslauncher") { return $text }
            } catch { }

            $dumpOut = Invoke-Adb @("shell", "uiautomator", "dump", $probe) 2>&1 | Out-String
            if ($dumpOut -match "already registered|could not get idle state") {
                Start-Sleep -Milliseconds (700 * $attempt)
                continue
            }
            $xml = Invoke-Adb @("shell", "cat", $probe) 2>$null
            $null = Invoke-Adb @("shell", "rm", "-f", $probe) 2>$null
            $text = if ($null -eq $xml) { "" } elseif ($xml -is [array]) { ($xml -join "`n") } else { [string]$xml }
            if ($text -match "<hierarchy" -and $text -notmatch "No such file|null root node|already registered") {
                return $text
            }
        } finally {
            $script:UiDumpLock = $false
        }
        Start-Sleep -Milliseconds (500 * $attempt)
    }
    return ""
}

function Get-UiFailLogcatSnippet {
    $lines = @()
    try {
        $raw = Invoke-Adb @("logcat", "-d", "-t", "250") 2>$null
        if ($null -eq $raw) { $raw = @() }
        elseif ($raw -isnot [array]) { $raw = @([string]$raw) }
        $filtered = @(
            $raw | Where-Object {
                $_ -match "AndroidRuntime|ReactNativeJS|ReactNative|FATAL EXCEPTION|Error:|Exception|keeps stopping|KineFit|kinefit"
            }
        )
        if ($filtered.Count -eq 0) {
            $filtered = @($raw | Select-Object -Last 80)
        } else {
            $filtered = @($filtered | Select-Object -Last 80)
        }
        $lines = $filtered
    } catch {
        $lines = @("logcat capture failed: $($_.Exception.Message)")
    }
    return ($lines -join "`n")
}

function Capture-FailArtifacts {
    param(
        [Parameter(Mandatory = $true)][string]$StepOrTestId,
        [string]$Reason = ""
    )
    if (-not $script:UiShotsDir) { return $null }

    $safe = Get-SafeShotLabel $StepOrTestId
    $base = "fail-{0}-{1}" -f $safe, (Get-Date -Format "yyyyMMdd-HHmmss")
    $png = Join-Path $script:UiShotsDir ($base + ".png")
    $xmlPath = Join-Path $script:UiShotsDir ($base + ".xml")
    $logPath = Join-Path $script:UiShotsDir ($base + ".log")

    if (Save-AdbScreencap -LocalPath $png) {
        Write-Host "FAIL-SHOT: $png" -ForegroundColor DarkYellow
    } else {
        Write-Host "FAIL-SHOT: empty → $png" -ForegroundColor DarkYellow
    }

    $xml = Get-UiXmlDumpText
    if ($xml) {
        Set-Content -LiteralPath $xmlPath -Value $xml -Encoding UTF8
        Write-Host "FAIL-XML: $xmlPath" -ForegroundColor DarkYellow
    } else {
        Set-Content -LiteralPath $xmlPath -Value "empty dump" -Encoding UTF8
        Write-Host "FAIL-XML: empty dump → $xmlPath" -ForegroundColor DarkYellow
    }

    $logcat = Get-UiFailLogcatSnippet
    @(
        "step=$StepOrTestId"
        "reason=$Reason"
        "time=$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        "package=$($script:Package)"
        "--- logcat (AndroidRuntime / ReactNativeJS / last 80) ---"
        $logcat
    ) | Set-Content -LiteralPath $logPath -Encoding UTF8
    Write-Host "FAIL-LOG: $logPath" -ForegroundColor DarkYellow

    return @{
        Png = $png
        Xml = $xmlPath
        Log = $logPath
    }
}

function Write-UiFail {
    param(
        [Parameter(Mandatory = $true)][string]$Message,
        [string]$StepOrTestId = "fail"
    )
    Write-Host "FAIL: $Message" -ForegroundColor Red
    $script:FailCount++
    Capture-FailArtifacts -StepOrTestId $StepOrTestId -Reason $Message | Out-Null
}
