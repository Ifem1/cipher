"""Root conftest: patch os.unlink for Windows compatibility with gltest."""
import os
import sys

if sys.platform == "win32":
    _orig_unlink = os.unlink

    def _win_safe_unlink(path):
        try:
            _orig_unlink(path)
        except PermissionError:
            # Windows: file is still open via dup2 to stdin; safe to skip
            pass

    os.unlink = _win_safe_unlink
