#Requires -Version 5.1
<#
.SYNOPSIS
  Verifies mobile/package.json version matches Android versionName,
  and reports versionCode from app/build.gradle.

.PARAMETER SyncPackage
  If set, writes package.json version = versionName (Gradle is source of truth for Play).
#>
param(
  [switch]$SyncPackage
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$packageJsonPath = Join-Path $repoRoot 'mobile\package.json'
$gradlePath = Join-Path $repoRoot 'mobile\android\app\build.gradle'

if (-not (Test-Path $packageJsonPath)) { throw "Missing $packageJsonPath" }
if (-not (Test-Path $gradlePath)) { throw "Missing $gradlePath" }

$pkg = Get-Content -Raw -Path $packageJsonPath | ConvertFrom-Json
$pkgVersion = [string]$pkg.version

$gradle = Get-Content -Raw -Path $gradlePath
if ($gradle -notmatch 'versionCode\s+(\d+)') {
  throw 'versionCode not found in mobile/android/app/build.gradle'
}
$versionCode = [int]$Matches[1]
if ($gradle -notmatch 'versionName\s+"([^"]+)"') {
  throw 'versionName not found in mobile/android/app/build.gradle'
}
$versionName = [string]$Matches[1]

Write-Host "package.json version : $pkgVersion"
Write-Host "Gradle versionName   : $versionName"
Write-Host "Gradle versionCode   : $versionCode"

if ($pkgVersion -ne $versionName) {
  if ($SyncPackage) {
    $raw = Get-Content -Raw -Path $packageJsonPath
    $updated = $raw -replace '("version"\s*:\s*")[^"]+(")', "`${1}${versionName}`${2}"
    if ($updated -eq $raw) {
      throw 'Failed to rewrite package.json version (pattern not found).'
    }
    Set-Content -Path $packageJsonPath -Value $updated -NoNewline
    # Ensure trailing newline
    Add-Content -Path $packageJsonPath -Value ''
    Write-Host "Synced package.json version -> $versionName (Gradle is source of truth)."
    exit 0
  }

  Write-Host ''
  Write-Host 'MISMATCH: mobile/package.json version must equal Android versionName.' -ForegroundColor Red
  Write-Host 'Fix with:  npm run android:check-version -- -SyncPackage' -ForegroundColor Yellow
  Write-Host 'Or bump:   npm --prefix mobile run bump' -ForegroundColor Yellow
  exit 1
}

Write-Host 'OK: versionName aligns with package.json.' -ForegroundColor Green
exit 0
