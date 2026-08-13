"""Estrazione output fallimenti per quality report (solo errori, no progress bar)."""

from __future__ import annotations

import re

_ANSI_RE = re.compile(r"\x1b\[[0-9;]*[A-Za-z]")
_PROGRESS_DOTS_RE = re.compile(r"^[\.FsxE]+(?:\s*\[\s*\d+%\])?\s*$")
_VITEST_FAIL_BANNER = re.compile(r"Failed Tests\s+\d+", re.IGNORECASE)


def strip_ansi(text: str) -> str:
    """Rimuove sequenze ANSI (Vitest/ESLint) dal testo."""
    return _ANSI_RE.sub("", text)


def truncate_prefer_tail(text: str, max_lines: int = 80) -> str:
    """Se troppo lungo, tiene la coda (dove di solito c'è lo summary)."""
    lines = text.splitlines()
    if len(lines) <= max_lines:
        return text
    omitted = len(lines) - max_lines
    tail = "\n".join(lines[-max_lines:])
    return f"... ({omitted} righe precedenti omesse)\n{tail}"


def _is_progress_line(line: str) -> bool:
    raw = line.strip()
    if not raw:
        return False
    if _PROGRESS_DOTS_RE.match(raw):
        return True
    return bool(re.fullmatch(r"\[\s*\d+%\]", raw))


def extract_vitest_failures(text: str, *, max_lines: int = 120) -> str:
    """Tiene il blocco Failed Tests di Vitest (o coda se assente)."""
    cleaned = strip_ansi(text)
    lines = cleaned.splitlines()
    for i, line in enumerate(lines):
        if _VITEST_FAIL_BANNER.search(line) or " FAIL " in line or line.strip().startswith("FAIL "):
            start = i
            for j in range(i, -1, -1):
                if _VITEST_FAIL_BANNER.search(lines[j]):
                    start = j
                    break
            block = "\n".join(lines[start:])
            return truncate_prefer_tail(block, max_lines)
    filtered = [ln for ln in lines if not ln.strip().startswith("·") and ln.strip() != "."]
    return truncate_prefer_tail("\n".join(filtered).strip() or cleaned.strip(), max_lines)


def extract_eslint_failures(text: str, *, max_lines: int = 120) -> str:
    cleaned = strip_ansi(text)
    lines = [ln for ln in cleaned.splitlines() if not _is_progress_line(ln)]
    return truncate_prefer_tail("\n".join(lines).strip() or cleaned.strip(), max_lines)


def format_failure_output(check_name: str, text: str, *, max_lines: int = 120) -> str:
    """Seleziona l'estrattore in base al check fallito."""
    name = check_name.lower()
    if "vitest" in name or "coverage" in name:
        return extract_vitest_failures(text, max_lines=max_lines)
    if "eslint" in name or "lint" in name:
        return extract_eslint_failures(text, max_lines=max_lines)
    return truncate_prefer_tail(strip_ansi(text), max_lines=max_lines)
