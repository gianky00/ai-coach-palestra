#Requires -Version 5.1
<#
.SYNOPSIS
  gradlew :app:installDebug sul progetto Android versionato.
  Preferisce / avvia AVD Pixel_9A (o Pixel_9a) se nessun device e' online.
#>
[CmdletBinding()]
param(
    [switch]$SkipPrebuild,
    [string]$Serial = "",
    [switch]$NoBoot
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$AndroidDir = Join-Path $RepoRoot "mobile\android"
$Gradlew = Join-Path $AndroidDir "gradlew.bat"
. (Join-Path $ScriptDir "lib\android-env.ps1")

function Test-JavaHome([string]$JdkPath) {
    $java = Join-Path $JdkPath "bin\java.exe"
    if (-not (Test-Path -LiteralPath $java)) { return $false }
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $verOut = & $java -version 2>&1 | ForEach-Object { "$_" } | Out-String
    } finally {
        $ErrorActionPreference = $prev
    }
    if ($verOut -match 'version "1[7-9]\.|version "2[01]\.') { return $true }
    return $false
}

function Set-StudioJavaHome {
    $candidates = @()
    if ($env:JAVA_HOME) { $candidates += $env:JAVA_HOME }
    $candidates += @(
        "C:\Program Files\Microsoft\jdk-17*",
        "C:\Program Files\Eclipse Adoptium\jdk-17*",
        "C:\Program Files\Java\jdk-17*",
        (Join-Path $env:LOCALAPPDATA "Programs\Android Studio\jbr"),
        "C:\Program Files\Android\Android Studio\jbr"
    )
    foreach ($pattern in $candidates) {
        $resolved = @(Get-Item -Path $pattern -ErrorAction SilentlyContinue)
        foreach ($item in $resolved) {
            $jdkHome = $item.FullName
            if (Test-JavaHome $jdkHome) {
                $env:JAVA_HOME = $jdkHome
                Write-Host "JAVA_HOME = $jdkHome"
                return
            }
        }
    }
}

Write-Host "=== KineFit install-debug ===" -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $Gradlew)) {
    Write-Host "FAIL: manca $Gradlew — progetto nativo assente." -ForegroundColor Red
    exit 1
}

try {
    $device = Ensure-AndroidUiDevice -Serial $Serial -NoBoot:$NoBoot
    Write-Host "OK: device $($device.Serial)$(if ($device.AvdName) { " (AVD $($device.AvdName))" })" -ForegroundColor Green
} catch {
    Write-Host "FAIL: $_" -ForegroundColor Red
    exit 1
}

Set-StudioJavaHome
if (-not $env:JAVA_HOME -or -not (Test-JavaHome $env:JAVA_HOME)) {
    Write-Host "FAIL: serve JDK 17 (o 21)." -ForegroundColor Red
    exit 1
}

$gradleArgs = @(":app:installDebug")
$arch = Get-ReactNativeArchitecturesForDevice -AdbPath $device.Adb -Serial $device.Serial
if ($arch) {
    $gradleArgs += "-PreactNativeArchitectures=$arch"
    Write-Host "ABI device=$arch → -PreactNativeArchitectures=$arch"
}

Push-Location $AndroidDir
try {
    Write-Host ".\gradlew.bat $($gradleArgs -join ' ') (ANDROID_SERIAL=$($env:ANDROID_SERIAL))"
    & .\gradlew.bat @gradleArgs
    if ($LASTEXITCODE -ne 0) { throw "installDebug fallito" }
    Write-Host "OK: installDebug (com.coemi.kinefit.elite)" -ForegroundColor Green
}
finally {
    Pop-Location
}

exit 0
