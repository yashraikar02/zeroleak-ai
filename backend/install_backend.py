#!/usr/bin/env python3
"""
install_backend.py  –  One-shot setup for ZeroLeak AI backend.
Run:  python install_backend.py
"""
import subprocess
import sys

def run(cmd):
    print(f"\n>>> {cmd}")
    subprocess.check_call(cmd, shell=True)

if __name__ == "__main__":
    # Install Python deps
    run(f"{sys.executable} -m pip install -r requirements.txt")

    # Download spacy model (small English NER, used by Presidio)
    try:
        run(f"{sys.executable} -m spacy download en_core_web_sm")
    except Exception as e:
        print(f"[warn] spacy model download failed (non-fatal): {e}")

    print("\n✅ ZeroLeak AI backend ready.")
    print("   Start with:  uvicorn main:app --reload --port 8000")
