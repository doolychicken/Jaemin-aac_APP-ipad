"""Rebuild all sticker catalogs through the stable public entry points."""
from pathlib import Path
import subprocess, sys
ROOT=Path(__file__).resolve().parents[1]
for name in ['build-sticker-catalog.py','build-home-sticker-catalog.py','build-storage-dress-catalog.py']:
    subprocess.run([sys.executable,str(ROOT/'scripts'/name)],cwd=ROOT,check=True)
print('All sticker catalogs rebuilt. See docs/sticker-books/README.md for validation and audio.')
