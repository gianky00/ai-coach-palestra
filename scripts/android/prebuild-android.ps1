#Requires -Version 5.1
<#
.SYNOPSIS
  No-op stub — mobile/android is the versioned bare RN project.

.DESCRIPTION
  Kept so `npm run android:prebuild` exits cleanly without mutating natives.
#>
[CmdletBinding()]
param(
    [switch]$Clean,
    [switch]$Force
)

Write-Host "=== KineFit native android ===" -ForegroundColor Yellow
Write-Host "mobile/android is versioned bare React Native (no codegen step)."
Write-Host "Daily flow: Android Studio on mobile/android, or npm run android:assemble"
Write-Host "OK: nessuna modifica" -ForegroundColor Green
exit 0
