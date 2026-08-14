#Requires -Version 5.1
<#
.SYNOPSIS
  Static lint for .maestro/flows (no Maestro CLI, no emulator).

.DESCRIPTION
  Ensures smoke/ops YAML stay aligned with current testIDs and do not hard-require
  seed-only UI (e.g. analytics-heatmap) without a seed step. Safe for CI Gate F.

.EXAMPLE
  .\scripts\check-maestro-flows.ps1
  npm run maestro:flows-check
#>
[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"

$RepoRoot = if ($PSScriptRoot) {
    (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
} else {
    (Get-Location).Path
}

$flowsRoot = Join-Path $RepoRoot ".maestro\flows"
$fail = 0

function Write-Ok([string]$msg) { Write-Host "OK: $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) {
    Write-Host "FAIL: $msg" -ForegroundColor Red
    $script:fail++
}

Write-Host "=== Maestro flows static check ===" -ForegroundColor Cyan
Write-Host "Flows: $flowsRoot" -ForegroundColor DarkGray

$requiredFlows = @(
    "smoke_all_views.yaml",
    "smoke_ops.yaml",
    "login.yaml",
    "navigation.yaml"
)

foreach ($name in $requiredFlows) {
    $path = Join-Path $flowsRoot $name
    if (-not (Test-Path -LiteralPath $path)) {
        Write-Fail "missing $name"
        continue
    }
    $text = Get-Content -LiteralPath $path -Raw -Encoding UTF8
    if ($text -notmatch '(?m)^appId:\s*com\.coemi\.kinefit\.elite\s*$') {
        Write-Fail "$name — appId must be com.coemi.kinefit.elite"
    } else {
        Write-Ok "$name — appId"
    }
}

$smokeAll = Join-Path $flowsRoot "smoke_all_views.yaml"
if (Test-Path -LiteralPath $smokeAll) {
    $t = Get-Content -LiteralPath $smokeAll -Raw -Encoding UTF8

    $requiredIds = @(
        "screen-auth",
        "auth-email-input",
        "smoke-mode-banner",
        "screen-oggi",
        "oggi-streak-chip",
        "oggi-exercise-search",
        "screen-history",
        "history-session-hint",
        "analytics-week-selector",
        "analytics-week-label",
        "profile-streak-chip",
        "screen-profile"
    )
    $missing = @($requiredIds | Where-Object { $t -notmatch [regex]::Escape("id: $_") })
    if ($missing.Count -gt 0) {
        foreach ($id in $missing) {
            Write-Fail "smoke_all_views.yaml — missing assert/wait id: $id"
        }
    } else {
        Write-Ok "smoke_all_views.yaml — core smoke testIDs"
    }

    # Hard-require heatmap without seed is a flake (empty week shows analytics-empty-state)
    if ($t -match '(?m)^-\s*assertVisible:\s*\r?\n\s+id:\s*analytics-heatmap\s*$') {
        Write-Fail "smoke_all_views.yaml — hard assertVisible analytics-heatmap (use when: + seed or empty branch)"
    } else {
        Write-Ok "smoke_all_views.yaml — no hard analytics-heatmap assert"
    }

    if ($t -notmatch 'analytics-empty-state' -or $t -notmatch 'when:') {
        Write-Fail "smoke_all_views.yaml — expect when: branch for analytics-empty-state (seed-less)"
    } else {
        Write-Ok "smoke_all_views.yaml — empty analytics branch"
    }
}

$smokeOps = Join-Path $flowsRoot "smoke_ops.yaml"
if (Test-Path -LiteralPath $smokeOps) {
    $t = Get-Content -LiteralPath $smokeOps -Raw -Encoding UTF8
    $opsIds = @(
        "modal-settings",
        "settings-section-allenamento",
        "settings-section-sistema",
        "settings-close-button",
        "modal-garmin",
        "garmin-close-button",
        "modal-add-exercise",
        "add-exercise-close-button",
        "floating-timer",
        "timer-rest-presets",
        "timer-rest-preset-90",
        "timer-close"
    )
    $missingOps = @($opsIds | Where-Object { $t -notmatch [regex]::Escape("id: $_") })
    if ($missingOps.Count -gt 0) {
        foreach ($id in $missingOps) {
            Write-Fail "smoke_ops.yaml — missing id: $id"
        }
    } else {
        Write-Ok "smoke_ops.yaml — settings/garmin/add-exercise/timer ids"
    }

    if ($t -notmatch 'timer=90') {
        Write-Fail "smoke_ops.yaml — missing smoke timer deep-link (?timer=90)"
    } else {
        Write-Ok "smoke_ops.yaml — timer=90 deep-link"
    }
}

$nav = Join-Path $flowsRoot "navigation.yaml"
if (Test-Path -LiteralPath $nav) {
    $t = Get-Content -LiteralPath $nav -Raw -Encoding UTF8
    foreach ($id in @("screen-oggi", "screen-history", "screen-analytics", "screen-profile", "analytics-week-selector")) {
        if ($t -notmatch [regex]::Escape("id: $id")) {
            Write-Fail "navigation.yaml — missing id: $id"
        }
    }
    $navMissing = @(@("screen-oggi", "screen-history", "screen-analytics", "screen-profile", "analytics-week-selector") |
        Where-Object { $t -notmatch [regex]::Escape("id: $_") })
    if ($navMissing.Count -eq 0) {
        Write-Ok "navigation.yaml — screen ids + week selector"
    }
}

$login = Join-Path $flowsRoot "login.yaml"
if (Test-Path -LiteralPath $login) {
    $t = Get-Content -LiteralPath $login -Raw -Encoding UTF8
    if ($t -notmatch 'MAESTRO_TEST_EMAIL' -or $t -notmatch 'MAESTRO_TEST_PASSWORD') {
        Write-Fail "login.yaml — must use MAESTRO_TEST_EMAIL / MAESTRO_TEST_PASSWORD env"
    } else {
        Write-Ok "login.yaml — env credentials"
    }
}

Write-Host ""
if ($fail -gt 0) {
    Write-Host "FAIL: $fail check(s) — fix .maestro/flows before e2e" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Maestro flows static check passed" -ForegroundColor Green
exit 0
