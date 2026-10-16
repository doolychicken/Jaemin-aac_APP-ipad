"""Stable entry point; source lives in sticker_books/."""
from pathlib import Path
import runpy, sys
folder = Path(__file__).resolve().parent / "sticker_books"
sys.path.insert(0, str(folder))
runpy.run_path(str(folder / "bathroom.py"), run_name="__main__")
