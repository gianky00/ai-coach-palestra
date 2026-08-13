#!/usr/bin/env python3
"""Root entrypoint — delegates to scripts/run_quality_checks.py."""

from __future__ import annotations

import runpy
import sys
from pathlib import Path

_SCRIPT = Path(__file__).resolve().parent / "scripts" / "run_quality_checks.py"

if __name__ == "__main__":
    sys.argv[0] = str(_SCRIPT)
    runpy.run_path(str(_SCRIPT), run_name="__main__")
