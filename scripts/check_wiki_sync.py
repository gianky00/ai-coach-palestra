#!/usr/bin/env python3
"""
Guardrail wiki KineFit: layout entrypoint, wikilink resolution, contract drift.

Exit:
  0 — OK
  1 — layout / wikilink / drift failure
  2 — git unavailable or unexpected I/O error
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WIKI = ROOT / "wiki"
MAP_PATH = ROOT / ".cursor" / "kinefit-domain-map.json"

WIKILINK_RE = re.compile(r"\[\[(kinefit/[^\]]+?)\]\]")

REQUIRED_PATHS = (
    ROOT / "AGENTS.md",
    ROOT / "GEMINI.md",
    ROOT / "docs" / "GEMINI.md",
    ROOT / "mobile" / "GEMINI.md",
    WIKI / "INDEX.md",
    WIKI / "README.md",
    WIKI / "kinefit" / "INDEX.md",
    WIKI / "kinefit" / "workflows" / "pre_commit_wiki_protocol.md",
    WIKI / "kinefit" / "workflows" / "docs_vs_wiki.md",
    WIKI / "kinefit" / "workflows" / "cursor_rules.md",
    WIKI / "kinefit" / "workflows" / "quality_gates.md",
    MAP_PATH,
)


def fail(msg: str, code: int = 1) -> int:
    print(f"FAIL: {msg}", file=sys.stderr)
    return code


def check_layout() -> list[str]:
    errors: list[str] = []
    for p in REQUIRED_PATHS:
        if not p.is_file():
            errors.append(f"manca {p.relative_to(ROOT).as_posix()}")

    root_gemini = (ROOT / "GEMINI.md").read_text(encoding="utf-8")
    if "wiki/kinefit/INDEX.md" not in root_gemini:
        errors.append("GEMINI.md root deve puntare a wiki/kinefit/INDEX.md")
    if "Flusso ufficiale:" in root_gemini:
        errors.append(
            "GEMINI.md root non deve contenere 'Flusso ufficiale:' "
            "(stack vive in wiki/kinefit/architecture/overview.md)"
        )

    docs_gemini = (ROOT / "docs" / "GEMINI.md").read_text(encoding="utf-8")
    if "wiki/kinefit/INDEX.md" not in docs_gemini:
        errors.append("docs/GEMINI.md deve puntare a wiki/kinefit/INDEX.md")
    lower = docs_gemini.lower()
    if "non** è la knowledge base" not in lower and "non è la knowledge base" not in lower:
        if "knowledge base architetturale" not in lower:
            errors.append("docs/GEMINI.md deve dichiarare di non essere la knowledge base")

    return errors


def resolve_wikilink(raw: str) -> Path:
    target = raw.split("|", 1)[0].strip()
    target = target.split("#", 1)[0].strip()
    if not target.endswith(".md"):
        target = f"{target}.md"
    return WIKI / target


def check_wikilinks() -> list[str]:
    errors: list[str] = []
    for md in WIKI.rglob("*.md"):
        text = md.read_text(encoding="utf-8")
        for m in WIKILINK_RE.finditer(text):
            dest = resolve_wikilink(m.group(1))
            if not dest.is_file():
                rel = md.relative_to(ROOT).as_posix()
                errors.append(f"wikilink rotto in {rel}: [[{m.group(1)}]] → {dest.relative_to(ROOT).as_posix()}")
    return errors


def check_domain_map() -> list[str]:
    errors: list[str] = []
    if not MAP_PATH.is_file():
        return [f"manca {MAP_PATH.relative_to(ROOT).as_posix()}"]
    data = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    domains = data.get("domains") or []
    ids: set[str] = set()
    for d in domains:
        did = d.get("id")
        if not did:
            errors.append("domain senza id")
            continue
        if did in ids:
            errors.append(f"domain id duplicato: {did}")
        ids.add(did)
        for w in d.get("wiki") or []:
            p = ROOT / w
            if not p.is_file():
                errors.append(f"domain {did}: wiki mancante {w}")
        for g in d.get("gemini") or []:
            p = ROOT / g
            if not p.is_file():
                errors.append(f"domain {did}: gemini mancante {g}")
    return errors


def git_changed_files() -> tuple[list[str] | None, str | None]:
    try:
        unstaged = subprocess.run(
            ["git", "diff", "--name-only", "HEAD"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        staged = subprocess.run(
            ["git", "diff", "--name-only", "--cached"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        # Untracked (nuovi nodi wiki) devono contare come "toccati" nel working tree.
        untracked = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
    except FileNotFoundError:
        return None, "git non trovato nel PATH"
    except subprocess.CalledProcessError as exc:
        return None, f"git diff fallito: {exc.stderr or exc}"

    files = set()
    for out in (unstaged.stdout, staged.stdout, untracked.stdout):
        for line in out.splitlines():
            line = line.strip().replace("\\", "/")
            if line:
                files.add(line)
    return sorted(files), None


def matches_glob(path: str, glob: str) -> bool:
    path = path.replace("\\", "/")
    glob = glob.replace("\\", "/")
    if glob.endswith("/"):
        return path.startswith(glob) or path.startswith(glob.rstrip("/"))
    if glob.endswith("/**"):
        prefix = glob[:-3]
        return path == prefix.rstrip("/") or path.startswith(prefix if prefix.endswith("/") else prefix + "/")
    return path == glob or path.startswith(glob.rstrip("/") + "/")


def check_contract_drift(changed: list[str]) -> list[str]:
    if not changed:
        return []
    data = json.loads(MAP_PATH.read_text(encoding="utf-8"))
    domains = data.get("domains") or []
    errors: list[str] = []
    changed_set = set(changed)
    for d in domains:
        globs = d.get("contract_globs") or []
        if not globs:
            continue
        hit = any(matches_glob(c, g) for c in changed for g in globs)
        if not hit:
            continue
        wiki_paths = d.get("wiki") or []
        if any(w in changed_set for w in wiki_paths):
            continue
        first = wiki_paths[0] if wiki_paths else "(nessun wiki path)"
        errors.append(
            f"wiki-sync: {d.get('id')} richiede aggiornare {first} "
            f"(contract toccato senza wiki)"
        )
    return errors


def main() -> int:
    errors: list[str] = []
    errors.extend(check_layout())
    errors.extend(check_domain_map())
    errors.extend(check_wikilinks())

    changed, git_err = git_changed_files()
    if git_err:
        return fail(git_err, 2)
    assert changed is not None
    errors.extend(check_contract_drift(changed))

    if errors:
        for e in errors:
            print(f"FAIL: {e}", file=sys.stderr)
        return 1

    print(
        f"OK: wiki layout + wikilink + domain map"
        f" ({len(changed)} file dirty, nessun drift contratto)"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
