"""
Single source of truth for KineFit quality-check scopes and commands.

Stack: root ESLint/Prettier + mobile TypeScript/Vitest.
Official run path: Android Studio (mobile/android) — Gate F–H are local-only.

Path ownership (one primary tool per concern):
  repo root formatting  -> Prettier (Gate A)
  JS/TS lint            -> ESLint (Gate B)
  mobile types          -> tsc (Gate C)
  mobile unit tests     -> Vitest (Gate D)
  mobile coverage       -> Vitest --coverage (Gate E)

Local heavy gates (not in CI):
  F android project | G assembleDebug | H UI Pixel 9a
  -> npm run android:assemble / verify:ui[:full] / gate:all
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MOBILE = ROOT / "mobile"


def python() -> str:
    return sys.executable


def npm() -> str:
    return "npm.cmd" if sys.platform == "win32" else "npm"


def prettier_check_cmd() -> list[str]:
    return [npm(), "run", "format:check"]


def prettier_write_cmd() -> list[str]:
    return [npm(), "run", "format"]


def eslint_cmd() -> list[str]:
    # Align with Gate B / package.json "lint".
    return [npm(), "run", "lint"]


def eslint_fix_cmd() -> list[str]:
    return [npm(), "run", "lint"]


def mobile_typecheck_cmd() -> list[str]:
    return [npm(), "run", "mobile:typecheck"]


def mobile_test_cmd() -> list[str]:
    return [npm(), "run", "mobile:test"]


def mobile_coverage_cmd() -> list[str]:
    return [npm(), "run", "mobile:test:coverage"]


def depcheck_cmd() -> list[str]:
    return [npm(), "run", "maintenance:depcheck"]


def npm_audit_root_cmd() -> list[str]:
    # Advisory only — never --force.
    return [npm(), "audit", "--omit=dev"]


def npm_audit_mobile_cmd() -> list[str]:
    return [npm(), "audit", "--prefix", "mobile", "--omit=dev"]


def android_assemble_cmd() -> list[str]:
    """Gate G — assembleDebug via existing PowerShell wrapper."""
    return [npm(), "run", "android:assemble"]


def verify_ui_cmd(*, full: bool = False) -> list[str]:
    """Gate H — adb smoke on Pixel_9A (zero login / zero Garmin OAuth)."""
    return [npm(), "run", "verify:ui:full" if full else "verify:ui"]


def android_gradlew() -> Path | None:
    android = MOBILE / "android"
    unix = android / "gradlew"
    win = android / "gradlew.bat"
    if unix.is_file():
        return unix
    if win.is_file():
        return win
    return None
