#!/usr/bin/env python3
"""
Quality checks for KineFit (ai-coach-palestra).

Named PASS/FAIL report for humans and AI. Prefer existing npm / ps1 scripts.

Modes:
  --quick     Gate A–E (+ light F). Skip assemble + emulator UI. Default.
  --full      A–E + F + assembleDebug (G) + Pixel 9A UI (H via verify:ui:full)
  --skip-ui   With --full, skip Gate H
  --skip-apk  With --full, skip Gate G (assemble)
  --skip-tests  Skip Vitest D/E
  --fix      Prettier + ESLint auto-fix, then run checks
  --no-advisory  Skip depcheck / npm audit

Exit: non-zero if any BLOCKING check fails. Advisory never fails the process.
"""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import quality_config as qc
from quality_failure_report import format_failure_output, truncate_prefer_tail

REPORT_FILE = qc.ROOT / "logs" / "quality_report.log"

AI_GUARDRAILS = """
=== AI GUARDRAILS — LEGGERE PRIMA DI MODIFICARE IL CODICE ===

KineFit è Mobile-first (bare React Native + Android Studio / Gradle in mobile/android).
Percorso ufficiale: Android Studio + Metro.

Ruoli (vedi scripts/quality_config.py):
  repo           -> Prettier (Gate A) + ESLint (Gate B)
  mobile/        -> tsc (Gate C) + Vitest (Gate D) + coverage (Gate E)
  locale heavy   -> Gate F–H (assemble + Pixel 9a UI / Maestro)

NON FARE:
  - npm audit fix --force
  - upgrade forzati RN solo per far passare advisory
  - spegnere soglie coverage in vitest.config.ts senza accordo
  - refactor massivo per warning ADVISORY (depcheck, npm audit)

SICURO DA FARE quando un check BLOCKING fallisce:
  - npm run format / eslint --fix mirato
  - fix test Vitest falliti
  - ripristinare coverage sulle aree in include
  - python run_quality_checks.py --fix

CI Ubuntu = --quick (A–E + F file-presence). Gate G–H / Maestro solo locale (--full).
================================================================
"""


@dataclass
class CheckResult:
    name: str
    tier: str  # BLOCKING | ADVISORY
    ok: bool
    command: str
    output: str = ""
    hint: str = ""


@dataclass
class Report:
    results: list[CheckResult] = field(default_factory=list)

    def add(self, result: CheckResult) -> None:
        self.results.append(result)

    @property
    def blocking_failed(self) -> list[CheckResult]:
        return [r for r in self.results if r.tier == "BLOCKING" and not r.ok]

    @property
    def advisory_failed(self) -> list[CheckResult]:
        return [r for r in self.results if r.tier == "ADVISORY" and not r.ok]


def run_cmd(
    command: list[str],
    *,
    cwd: Path | None = None,
    timeout: int = 300,
    extra_env: dict[str, str] | None = None,
) -> tuple[int, str]:
    env = os.environ.copy()
    env.setdefault("PYTHONUTF8", "1")
    env.setdefault("PYTHONIOENCODING", "utf-8")
    env.setdefault("TZ", "Europe/Rome")
    if extra_env:
        env.update(extra_env)
    proc = subprocess.run(
        command,
        cwd=str(cwd or qc.ROOT),
        capture_output=True,
        text=True,
        encoding="utf-8",
        errors="replace",
        check=False,
        timeout=timeout,
        env=env,
    )
    out = "\n".join(part for part in (proc.stdout, proc.stderr) if part).strip()
    return proc.returncode, out


def truncate(text: str, max_lines: int = 80) -> str:
    return truncate_prefer_tail(text, max_lines=max_lines)


def _timeout_output(exc: subprocess.TimeoutExpired, timeout: int) -> str:
    parts: list[str] = [f"Timeout dopo {timeout}s"]
    for raw in (exc.stdout, exc.stderr):
        if not raw:
            continue
        text = raw if isinstance(raw, str) else raw.decode("utf-8", "replace")
        text = text.strip()
        if text:
            parts.append("--- output parziale ---")
            parts.append(format_failure_output("generic", text, max_lines=120))
    return "\n".join(parts)


def run_check(
    report: Report,
    result: CheckResult,
    command: list[str],
    *,
    timeout: int = 300,
    extra_env: dict[str, str] | None = None,
) -> None:
    print(f"  -> {result.name}...", flush=True)
    try:
        code, out = run_cmd(command, timeout=timeout, extra_env=extra_env)
        result.ok = code == 0
        result.output = out
    except subprocess.TimeoutExpired as exc:
        result.ok = False
        result.output = _timeout_output(exc, timeout)
    except FileNotFoundError as exc:
        result.ok = result.tier == "ADVISORY"
        result.output = f"Tool non disponibile: {exc}"
    status = "PASS" if result.ok else "FAIL"
    print(f"     [{status}]", flush=True)
    report.add(result)


def _lint_maestro_flows() -> list[str]:
    """Static .maestro/flows checks (no CLI / no emulator). Mirrors check-maestro-flows.ps1."""
    issues: list[str] = []
    flows = qc.ROOT / ".maestro" / "flows"
    app_id_line = "appId: com.coemi.kinefit.elite"

    required = {
        "smoke_all_views.yaml": [
            "id: screen-auth",
            "id: auth-email-input",
            "id: smoke-mode-banner",
            "id: screen-oggi",
            "id: oggi-streak-chip",
            "id: oggi-exercise-search",
            "id: screen-history",
            "id: history-session-hint",
            "id: analytics-week-selector",
            "id: analytics-week-label",
            "id: profile-streak-chip",
            "id: screen-profile",
            "analytics-empty-state",
            "when:",
        ],
        "smoke_ops.yaml": [
            "id: modal-settings",
            "id: settings-section-allenamento",
            "id: settings-section-sistema",
            "id: settings-close-button",
            "id: modal-garmin",
            "id: garmin-close-button",
            "id: modal-add-exercise",
            "id: floating-timer",
            "id: timer-rest-presets",
            "id: timer-rest-preset-90",
            "id: timer-close",
            "timer=90",
        ],
        "navigation.yaml": [
            "id: screen-oggi",
            "id: screen-history",
            "id: screen-analytics",
            "id: screen-profile",
            "id: analytics-week-selector",
        ],
        "login.yaml": [
            "MAESTRO_TEST_EMAIL",
            "MAESTRO_TEST_PASSWORD",
            "id: auth-email-input",
            "id: tab-oggi",
        ],
    }

    for name, needles in required.items():
        path = flows / name
        if not path.is_file():
            issues.append(f"missing {name}")
            continue
        text = path.read_text(encoding="utf-8")
        if app_id_line not in text.splitlines()[0:3] and not text.startswith(app_id_line):
            # allow BOM / blank; still require exact appId somewhere near top
            if app_id_line not in text[:200]:
                issues.append(f"{name}: bad/missing appId")
        for needle in needles:
            if needle not in text:
                issues.append(f"{name}: missing {needle}")

    smoke_all = flows / "smoke_all_views.yaml"
    if smoke_all.is_file():
        text = smoke_all.read_text(encoding="utf-8")
        # Hard assertVisible of heatmap without seed flakes on empty week
        lines = text.splitlines()
        for i, line in enumerate(lines):
            if line.strip() == "- assertVisible:" and i + 1 < len(lines):
                nxt = lines[i + 1].strip()
                if nxt == "id: analytics-heatmap":
                    issues.append(
                        "smoke_all_views.yaml: hard assertVisible analytics-heatmap "
                        "(use when: empty/heatmap branch)"
                    )
                    break

    return issues


def check_gate_f(report: Report) -> None:
    print("  -> Gate F — Android project present...", flush=True)
    found = qc.android_gradlew()
    ok = found is not None
    detail = f"OK: {found}" if ok else "Manca wrapper Gradle in mobile/android (Gate F)"
    report.add(
        CheckResult(
            name="Gate F — Android project present",
            tier="BLOCKING",
            ok=ok,
            command="test -f mobile/android/gradlew[.bat]",
            output=detail,
            hint="Il progetto Studio versionato deve restare in mobile/android",
        )
    )
    print(f"     [{'PASS' if ok else 'FAIL'}]", flush=True)

    print("  -> Gate F — UI shot helpers present...", flush=True)
    android_scripts = qc.ROOT / "scripts" / "android"
    required = [
        android_scripts / "lib" / "ui-shots.ps1",
        android_scripts / "lib" / "ui-verify-common.ps1",
        android_scripts / "lib" / "android-env.ps1",
        android_scripts / "reset-adb.ps1",
        android_scripts / ".ui-shots" / ".gitkeep",
        android_scripts / "verify_ui.ps1",
        android_scripts / "verify_ui_full.ps1",
        android_scripts / "verify_ui_ops.ps1",
    ]
    missing = [str(p.relative_to(qc.ROOT)) for p in required if not p.is_file()]
    shots_ok = len(missing) == 0
    shots_detail = (
        "OK: ui-shots + reset-adb + verify_ui*.ps1 + .ui-shots/.gitkeep"
        if shots_ok
        else f"Mancano: {', '.join(missing)}"
    )
    report.add(
        CheckResult(
            name="Gate F — UI shot helpers present",
            tier="BLOCKING",
            ok=shots_ok,
            command="test -f scripts/android/lib/ui-shots.ps1 (+ reset-adb)",
            output=shots_detail,
            hint="Non eliminare ui-shots / ui-verify-common / reset-adb.ps1 / .ui-shots/.gitkeep",
        )
    )
    print(f"     [{'PASS' if shots_ok else 'FAIL'}]", flush=True)

    print("  -> Gate F — Maestro e2e wrappers + flow lint...", flush=True)
    maestro_required = [
        qc.ROOT / "scripts" / "check-maestro.ps1",
        qc.ROOT / "scripts" / "check-maestro-flows.ps1",
        qc.ROOT / "scripts" / "run-maestro.ps1",
        qc.ROOT / ".maestro" / "README.md",
        qc.ROOT / ".maestro" / "flows" / "smoke_all_views.yaml",
        qc.ROOT / ".maestro" / "flows" / "smoke_ops.yaml",
        qc.ROOT / ".maestro" / "flows" / "login.yaml",
        qc.ROOT / ".maestro" / "flows" / "navigation.yaml",
    ]
    maestro_missing = [
        str(p.relative_to(qc.ROOT)) for p in maestro_required if not p.is_file()
    ]
    lint_issues = _lint_maestro_flows()
    maestro_ok = len(maestro_missing) == 0 and len(lint_issues) == 0
    if maestro_missing:
        maestro_detail = f"Mancano: {', '.join(maestro_missing)}"
    elif lint_issues:
        maestro_detail = "Flow lint: " + "; ".join(lint_issues[:8])
    else:
        maestro_detail = (
            "OK: check-maestro(+flows) + run-maestro + linted .maestro/flows "
            "(smoke/ops/login/navigation)"
        )
    report.add(
        CheckResult(
            name="Gate F — Maestro e2e wrappers + flow lint",
            tier="BLOCKING",
            ok=maestro_ok,
            command="lint .maestro/flows (+ scripts/check-maestro*.ps1)",
            output=maestro_detail,
            hint="Non eliminare run-maestro / check-maestro-flows / .maestro/flows; no hard analytics-heatmap",
        )
    )
    print(f"     [{'PASS' if maestro_ok else 'FAIL'}]", flush=True)


def check_blocking(
    report: Report,
    *,
    skip_tests: bool = False,
    include_apk: bool = False,
    include_ui: bool = False,
) -> None:
    run_check(
        report,
        CheckResult(
            name="Gate A — Prettier format:check",
            tier="BLOCKING",
            ok=False,
            command=" ".join(qc.prettier_check_cmd()),
            hint="npm run format",
        ),
        qc.prettier_check_cmd(),
        timeout=180,
    )
    run_check(
        report,
        CheckResult(
            name="Gate B — ESLint",
            tier="BLOCKING",
            ok=False,
            command=" ".join(qc.eslint_cmd()),
            hint="npm run lint",
        ),
        qc.eslint_cmd(),
        timeout=300,
    )
    run_check(
        report,
        CheckResult(
            name="Gate C — Mobile typecheck",
            tier="BLOCKING",
            ok=False,
            command=" ".join(qc.mobile_typecheck_cmd()),
            hint="Correggere errori TypeScript in mobile/",
        ),
        qc.mobile_typecheck_cmd(),
        timeout=300,
    )

    if not skip_tests:
        run_check(
            report,
            CheckResult(
                name="Gate D — Vitest unit",
                tier="BLOCKING",
                ok=False,
                command=" ".join(qc.mobile_test_cmd()),
                hint="Fix mirati ai test; non disabilitare senza motivo",
            ),
            qc.mobile_test_cmd(),
            timeout=600,
        )
        run_check(
            report,
            CheckResult(
                name="Gate E — Vitest coverage",
                tier="BLOCKING",
                ok=False,
                command=" ".join(qc.mobile_coverage_cmd()),
                hint="Soglie in mobile/vitest.config.ts (95/95/95/85)",
            ),
            qc.mobile_coverage_cmd(),
            timeout=600,
        )

    check_gate_f(report)

    if include_apk:
        run_check(
            report,
            CheckResult(
                name="Gate G — assembleDebug",
                tier="BLOCKING",
                ok=False,
                command=" ".join(qc.android_assemble_cmd()),
                hint="npm run android:assemble (richiede Android SDK)",
            ),
            qc.android_assemble_cmd(),
            timeout=1800,
        )

    if include_ui:
        run_check(
            report,
            CheckResult(
                name="Gate H — UI verify (Pixel 9A)",
                tier="BLOCKING",
                ok=False,
                command=" ".join(qc.verify_ui_cmd(full=True)),
                hint="npm run android:emulator poi verify:ui:full — zero login / zero Garmin",
            ),
            qc.verify_ui_cmd(full=True),
            timeout=1800,
        )


def check_advisory(report: Report) -> None:
    advisory: list[tuple[str, list[str], str, int]] = [
        (
            "Depcheck (root)",
            qc.depcheck_cmd(),
            "Informativo: non rimuovere husky/commitlint solo per depcheck.",
            180,
        ),
        (
            "npm audit (root, omit=dev)",
            qc.npm_audit_root_cmd(),
            "Solo advisory. Vietato npm audit fix --force.",
            180,
        ),
        (
            "npm audit (mobile, omit=dev)",
            qc.npm_audit_mobile_cmd(),
            "Solo advisory. Vietato npm audit fix --force / RN major forzati.",
            180,
        ),
    ]
    for name, cmd, hint, timeout in advisory:
        run_check(
            report,
            CheckResult(name=name, tier="ADVISORY", ok=False, command=" ".join(cmd), hint=hint),
            cmd,
            timeout=timeout,
        )


def format_section(title: str, results: list[CheckResult]) -> list[str]:
    lines = [f"--- {title} ---", ""]
    for r in results:
        status = "PASS" if r.ok else "FAIL"
        lines.append(f"[{status}] {r.name}")
        lines.append(f"  cmd: {r.command}")
        if r.hint:
            lines.append(f"  hint: {r.hint}")
        if not r.ok and r.output:
            lines.append(format_failure_output(r.name, r.output, max_lines=120))
        lines.append("")
    return lines


def write_report(report: Report, *, mode: str) -> None:
    blocking = [r for r in report.results if r.tier == "BLOCKING"]
    advisory = [r for r in report.results if r.tier == "ADVISORY"]

    lines = [
        "=" * 64,
        f"QUALITY CHECK REPORT — KineFit — {datetime.now():%Y-%m-%d %H:%M:%S}",
        f"Mode: {mode}",
        "=" * 64,
        AI_GUARDRAILS.strip(),
        "",
        f"BLOCKING failed: {len(report.blocking_failed)} / {len(blocking)}",
        f"ADVISORY failed:  {len(report.advisory_failed)} / {len(advisory)} (non bloccano)",
        "",
        *format_section("BLOCKING CHECKS", blocking),
        *format_section("ADVISORY ONLY — non usare per refactoring massivo", advisory),
        "=" * 64,
    ]

    if report.blocking_failed:
        lines.append("ESITO: FAIL — correggere i check BLOCKING sopra.")
    else:
        lines.append("ESITO: PASS — check bloccanti OK.")
        if report.advisory_failed:
            lines.append(
                f"Nota: {len(report.advisory_failed)} check advisory con warning "
                "(ignorabili per merge se non pertinenti).",
            )
    lines.append("=" * 64)

    text = "\n".join(lines)
    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    REPORT_FILE.write_text(text, encoding="utf-8")
    print(text)


def apply_autofix() -> None:
    fixers: list[tuple[str, list[str]]] = [
        ("Prettier --write", qc.prettier_write_cmd()),
        ("ESLint --fix", qc.eslint_fix_cmd()),
    ]
    print("Applicazione auto-fix sicuri...")
    for name, cmd in fixers:
        print(f"  -> {name}...", flush=True)
        try:
            _, out = run_cmd(cmd, timeout=300)
        except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
            print(f"     saltato: {exc}")
            continue
        if out:
            print(truncate(out, 15))
    print("Auto-fix completati. Rivedere `git diff` / `git status` prima di committare.\n")


def parse_args(argv: list[str] | None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="KineFit quality checks (Gate A–H via npm / ps1).",
    )
    mode = p.add_mutually_exclusive_group()
    mode.add_argument(
        "--quick",
        action="store_true",
        help="Gate A–E + F light (default). Skip assemble + UI.",
    )
    mode.add_argument(
        "--full",
        action="store_true",
        help="Include assembleDebug (G) + Pixel 9A UI verify (H).",
    )
    p.add_argument("--skip-ui", action="store_true", help="With --full, skip Gate H.")
    p.add_argument("--skip-apk", action="store_true", help="With --full, skip Gate G.")
    p.add_argument("--skip-tests", action="store_true", help="Skip Vitest D/E.")
    p.add_argument("--fix", action="store_true", help="Prettier + ESLint fix, then checks.")
    p.add_argument("--no-advisory", action="store_true", help="Skip depcheck / npm audit.")
    return p.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)

    if args.fix:
        apply_autofix()

    full = bool(args.full)
    include_apk = full and not args.skip_apk
    include_ui = full and not args.skip_ui
    mode = "full" if full else "quick"
    if full and args.skip_apk:
        mode += "+skip-apk"
    if full and args.skip_ui:
        mode += "+skip-ui"

    report = Report()
    print(f"KineFit quality checks [{mode}]")
    print("Esecuzione check BLOCKING..." + (" (test saltati)" if args.skip_tests else ""))
    check_blocking(
        report,
        skip_tests=args.skip_tests,
        include_apk=include_apk,
        include_ui=include_ui,
    )
    if not args.no_advisory:
        print("Esecuzione check ADVISORY...")
        check_advisory(report)
    write_report(report, mode=mode)
    return 1 if report.blocking_failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
