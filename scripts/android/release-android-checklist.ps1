#Requires -Version 5.1
<#
.SYNOPSIS
  Prints the bare Android Studio store-release checklist and runs version alignment.
  Does not build or upload — docs + gate only.
#>
param(
  [switch]$SkipVersionCheck
)

$ErrorActionPreference = 'Stop'
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')

Write-Host ''
Write-Host '=== KineFit release:android (bare RN + Android Studio) ===' -ForegroundColor Magenta
Write-Host 'No EAS / Expo. Build + sign via Gradle / Android Studio only.' -ForegroundColor DarkGray
Write-Host ''

$steps = @(
  '[ ] 1. npm run gate (A-E) ok',
  '[ ] 2. Supabase prod migrations applied',
  '[ ] 3. mobile/.env release: KINEFIT_SUPABASE_URL, KINEFIT_SUPABASE_ANON_KEY, KINEFIT_SENTRY_DSN',
  '[ ] 4. npm run android:check-version  (package.json == versionName; note versionCode)',
  '[ ] 5. Release signing keystore configured (NOT debug.keystore) in app/build.gradle / Studio',
  '[ ] 6. Review minify/ProGuard (default OFF — see docs/STORE_SUBMISSION.md)',
  '[ ] 7. Android Studio: open mobile/android → Generate Signed Bundle, or:',
  '       cd mobile\android; .\gradlew.bat :app:bundleRelease',
  '[ ] 8. Device smoke on release build (login, log set, offline sync, export, onboarding)',
  '[ ] 9. Upload AAB to Play Console + Data safety / screenshots',
  '[ ] 10. Tag git + watch Sentry 24-48h'
)

foreach ($s in $steps) { Write-Host $s }

Write-Host ''
Write-Host "Full checklist: $repoRoot\docs\STORE_SUBMISSION.md"
Write-Host "Bump versions:  npm --prefix mobile run bump"
Write-Host ''

if (-not $SkipVersionCheck) {
  & (Join-Path $PSScriptRoot 'check-version-align.ps1')
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ''
Write-Host 'Checklist printed. Complete the items above before Play upload.' -ForegroundColor Green
exit 0
