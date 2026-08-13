#Requires -Version 5.1
<#
.SYNOPSIS
  gradlew :app:installDebug sul progetto Android versionato.
#>
[CmdletBinding()]
param(
    [switch]$SkipPrebuild
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
$AndroidDir = Join-Path $RepoRoot "mobile\android"
$Gradlew = Join-Path $AndroidDir "gradlew.bat"

function Test-JavaHome([string]$JdkPath) {
    $java = Join-Path $JdkPath "bin\java.exe"
    if (-not (Test-Path -LiteralPath $java)) { return $false }
    $verOut = & $java -version 2>&1 | Out-String
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

Set-StudioJavaHome
if (-not $env:JAVA_HOME -or -not (Test-JavaHome $env:JAVA_HOME)) {
    Write-Host "FAIL: serve JDK 17 (o 21)." -ForegroundColor Red
    exit 1
}

Push-Location $AndroidDir
try {
    Write-Host ".\gradlew.bat :app:installDebug"
    & .\gradlew.bat :app:installDebug
    if ($LASTEXITCODE -ne 0) { throw "installDebug fallito" }
    Write-Host "OK: installDebug (com.coemi.kinefit.elite)" -ForegroundColor Green
}
finally {
    Pop-Location
}

exit 0
