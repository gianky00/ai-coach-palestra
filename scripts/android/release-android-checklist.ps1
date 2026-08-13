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
  '[ ] 5. Release signing: keystore.properties / Studio — NOT debug.keystore (STORE_SUBMISSION §3)',
  '[ ] 6. Review minify/ProGuard (default OFF — STORE_SUBMISSION §4)',
  '[ ] 7. Android Studio: open mobile/android → Generate Signed Bundle, or:',
  '       cd mobile\android; .\gradlew.bat :app:bundleRelease',
  '[ ] 8. Device smoke on release build (login, log set, offline sync, export, onboarding)',
  '[ ] 9. Privacy: host template (docs/PRIVACY_POLICY_TEMPLATE.md) + Play URL + KINEFIT_PRIVACY_POLICY_URL (STORE_SUBMISSION §5)',
  '[ ] 10. Phone screenshots: npm run store:screenshots (demo login; no SMOKE; .store-shots/) + store listing (STORE_SUBMISSION §6)',
  '[ ] 11. Upload AAB to Play Console (versionCode > last published)',
  '[ ] 12. Tag git + watch Sentry 24-48h'
)

foreach ($s in $steps) { Write-Host $s }

Write-Host ''
Write-Host "Full checklist: $repoRoot\docs\STORE_SUBMISSION.md"
Write-Host 'Sections: versioning §2 · signing §3 · privacy §5 · screenshots §6'
Write-Host "Bump versions:  npm --prefix mobile run bump"
Write-Host 'No EAS / Expo. Do not commit keystore.properties or release *.keystore / *.jks.'
Write-Host ''

if (-not $SkipVersionCheck) {
  & (Join-Path $PSScriptRoot 'check-version-align.ps1')
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host ''
Write-Host 'Checklist printed. Complete the items above before Play upload.' -ForegroundColor Green
exit 0
