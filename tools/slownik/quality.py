# -*- coding: utf-8 -*-
"""Raport jakości haseł słownika (tools/slownik/JAKOSC.md): krótkie definicje, definicje powtarzające nazwę hasła,
pojęcia bez przykładu. Użycie: python3 -I tools/slownik/quality.py"""
import glob, importlib.util, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
rows, flagged = [], []
for p in sorted(glob.glob(os.path.join(HERE, "glossary", "s*.py"))):
    spec = importlib.util.spec_from_file_location(os.path.basename(p)[:-3], p)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    sec = os.path.basename(p)[1:3]
    n = short = echo = no_ex = 0
    for t, d, x in m.E:
        n += 1
        base = re.sub(r"\s*\(.*?\)", "", t).strip().lower()
        if len(d) < 90:
            short += 1
            flagged.append((sec, t, "krótka definicja", len(d)))
        if d.lower().startswith(base) and len(base) > 4:
            echo += 1
            flagged.append((sec, t, "definicja zaczyna się od nazwy hasła", len(d)))
        if not x.get("p") and not x.get("w") and sec in ("01", "02", "03", "04", "05", "06", "07", "08", "15"):
            no_ex += 1
    rows.append((sec, m.TITLE.split(" – ")[0], n, short, echo, no_ex))
out = ["# Jakość haseł słownika", "", "Raport `tools/slownik/quality.py` (definicje i przykłady w `tools/slownik/glossary/s*.py`).", "",
       "| dział | tytuł | haseł | krótkie (<90 zn.) | powtarzają nazwę | pojęcia bez przykładu i wzoru |", "|---|---|---:|---:|---:|---:|"]
out += [f"| {s} | {t} | {n} | {a} | {b} | {c} |" for s, t, n, a, b, c in rows]
out += ["", "## Do poprawy", "", "| dział | hasło | problem | długość |", "|---|---|---|---:|"]
out += [f"| {s} | {t} | {why} | {ln} |" for s, t, why, ln in flagged]
open(os.path.join(HERE, "JAKOSC.md"), "w", encoding="utf-8").write("\n".join(out) + "\n")
print("\n".join(out[:22]))
print("do poprawy:", len(flagged))
