from __future__ import annotations

import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent

cmd = [sys.executable, "tools/export_chapters.py"]
print("Rebuilding local chapter content from chapters.json...")
result = subprocess.run(cmd, cwd=root)
if result.returncode != 0:
    raise SystemExit(result.returncode)

print("Done. Chapters rebuilt successfully.")
