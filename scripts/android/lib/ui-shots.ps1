#Requires -Version 5.1
<#
.SYNOPSIS
  Screenshot / hierarchy dump helpers for UI verify scripts.
#>

$script:UiShotsDir = $null
$script:UiShotStamp = $null
$script:UiShotIndex = 0

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

function Capture-UiShot {
    param([Parameter(Mandatory = $true)][string]$Label)
    if (-not $script:UiShotsDir) { return $null }
    $script:UiShotIndex++
    $safe = Get-SafeShotLabel $Label
    $name = "step-{0}-{1}-{2:D3}.png" -f $safe, $script:UiShotStamp, $script:UiShotIndex
    $local = Join-Path $script:UiShotsDir $name
    $remote = "/sdcard/kinefit_ui_step.png"
    try {
        $null = Invoke-Adb @("shell", "screencap", "-p", $remote)
        $null = Invoke-Adb @("pull", $remote, $local)
        $null = Invoke-Adb @("shell", "rm", $remote)
    } catch { }
    if ((Test-Path -LiteralPath $local) -and ((Get-Item -LiteralPath $local).Length -gt 1000)) {
        Write-Host "SHOT: $local" -ForegroundColor DarkGray
        return $local
    }
    Write-Host "WARN: screenshot empty: $name" -ForegroundColor Yellow
    return $null
}

function Get-UiXmlDumpText {
    $probe = "/data/local/tmp/kinefit_ui_probe.xml"
    for ($attempt = 1; $attempt -le 8; $attempt++) {
        try {
            $stream = Invoke-Adb @("exec-out", "uiautomator", "dump", "/dev/tty") 2>$null
            $text = if ($null -eq $stream) { "" } elseif ($stream -is [array]) { ($stream -join "`n") } else { [string]$stream }
            if ($text -match "<hierarchy") { return $text }
        } catch { }

        $null = Invoke-Adb @("shell", "uiautomator", "dump", $probe) 2>$null
        $xml = Invoke-Adb @("shell", "cat", $probe) 2>$null
        $null = Invoke-Adb @("shell", "rm", $probe) 2>$null
        $text = if ($null -eq $xml) { "" } elseif ($xml -is [array]) { ($xml -join "`n") } else { [string]$xml }
        if ($text -match "<hierarchy" -and $text -notmatch "No such file|null root node") {
            return $text
        }
        Start-Sleep -Milliseconds (400 * $attempt)
    }
    return ""
}

function Write-UiFail {
    param(
        [Parameter(Mandatory = $true)][string]$Message,
        [string]$StepOrTestId = "fail"
    )
    Write-Host "FAIL: $Message" -ForegroundColor Red
    $script:FailCount++
    if (-not $script:UiShotsDir) { return }

    $safe = Get-SafeShotLabel $StepOrTestId
    $base = "fail-{0}-{1}" -f $safe, (Get-Date -Format "yyyyMMdd-HHmmss")
    $png = Join-Path $script:UiShotsDir ($base + ".png")
    $xmlPath = Join-Path $script:UiShotsDir ($base + ".xml")
    $logPath = Join-Path $script:UiShotsDir ($base + ".log")

    $remote = "/sdcard/kinefit_ui_fail.png"
    try {
        $null = Invoke-Adb @("shell", "screencap", "-p", $remote)
        $null = Invoke-Adb @("pull", $remote, $png)
        $null = Invoke-Adb @("shell", "rm", $remote)
    } catch { }
    Write-Host "FAIL-SHOT: $png" -ForegroundColor DarkYellow

    $xml = Get-UiXmlDumpText
    if ($xml) {
        Set-Content -LiteralPath $xmlPath -Value $xml -Encoding UTF8
        Write-Host "FAIL-XML: $xmlPath" -ForegroundColor DarkYellow
    } else {
        Set-Content -LiteralPath $xmlPath -Value "empty dump" -Encoding UTF8
        Write-Host "FAIL-XML: empty dump → $xmlPath" -ForegroundColor DarkYellow
    }

    @(
        "step=$StepOrTestId"
        "reason=$Message"
        "time=$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        "package=$($script:Package)"
    ) | Set-Content -LiteralPath $logPath -Encoding UTF8
    Write-Host "FAIL-LOG: $logPath" -ForegroundColor DarkYellow
}
