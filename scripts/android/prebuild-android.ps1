#Requires -Version 5.1
<#
.SYNOPSIS
  Legacy Expo prebuild entrypoint — no longer used.

.DESCRIPTION
  mobile/android is a hand-maintained bare React Native project.
#>
[CmdletBinding()]
param(
    [switch]$Clean,
    [switch]$Force
)

Write-Host "=== KineFit native android ===" -ForegroundColor Yellow
Write-Host "Expo prebuild is disabled. mobile/android is versioned and bare RN."
Write-Host "Daily flow: Android Studio on mobile/android, or npm run android:assemble"
Write-Host "OK: nessuna modifica" -ForegroundColor Green
exit 0
