#Requires -Version 5.1
<#
.SYNOPSIS
  gradlew :app:assembleDebug sul progetto Android versionato.
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
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $verOut = & $java -version 2>&1 | ForEach-Object { "$_" } | Out-String
    } finally {
        $ErrorActionPreference = $prev
    }
    # Prefer JDK 17–21 for AGP/Gradle (reject 22+)
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

Write-Host "=== KineFit assemble-debug ===" -ForegroundColor Cyan

if (-not (Test-Path -LiteralPath $Gradlew)) {
    Write-Host "FAIL: manca $Gradlew" -ForegroundColor Red
    Write-Host "Il progetto nativo deve essere in mobile/android (versionato)."
    exit 1
}

Set-StudioJavaHome
if (-not $env:JAVA_HOME -or -not (Test-JavaHome $env:JAVA_HOME)) {
    Write-Host "FAIL: serve JDK 17 (o 21). Il JBR di Studio recente (Java 25) non va bene per Gradle CLI." -ForegroundColor Red
    Write-Host "Installa Microsoft OpenJDK 17 oppure in Android Studio: Settings → Gradle → Gradle JDK = 17."
    exit 1
}

$localProps = Join-Path $AndroidDir "local.properties"
if (-not (Test-Path -LiteralPath $localProps)) {
    $sdkDir = $null
    if ($env:ANDROID_HOME -and (Test-Path -LiteralPath $env:ANDROID_HOME)) { $sdkDir = $env:ANDROID_HOME }
    elseif ($env:ANDROID_SDK_ROOT -and (Test-Path -LiteralPath $env:ANDROID_SDK_ROOT)) { $sdkDir = $env:ANDROID_SDK_ROOT }
    else {
        $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
        if (Test-Path -LiteralPath $defaultSdk) { $sdkDir = $defaultSdk }
    }
    if (-not $sdkDir) {
        Write-Host "FAIL: Android SDK non trovato. Apri Android Studio una volta o imposta ANDROID_HOME." -ForegroundColor Red
        exit 1
    }
    $sdkEscaped = ($sdkDir -replace '\\', '/')
    Set-Content -LiteralPath $localProps -Value "sdk.dir=$sdkEscaped" -Encoding ASCII
    Write-Host "Creato local.properties → sdk.dir=$sdkEscaped"
}

Push-Location $AndroidDir
try {
    Write-Host ".\gradlew.bat :app:assembleDebug"
    & .\gradlew.bat :app:assembleDebug
    if ($LASTEXITCODE -ne 0) { throw "assembleDebug fallito" }

    $apk = Join-Path $AndroidDir "app\build\outputs\apk\debug\app-debug.apk"
    if (-not (Test-Path -LiteralPath $apk)) {
        throw "APK non trovato: $apk"
    }
    Write-Host "OK: APK = $apk" -ForegroundColor Green
}
finally {
    Pop-Location
}

exit 0
