# -*- coding: utf-8 -*-
"""Sprawdza, czy adresy źródeł w lekcjach „Zrozumienie” działają (HTTP 200 po przekierowaniach).

Użycie: python3 -I tools/nauka/check_links.py data/nauka/zrozum.json
"""
import json, sys, urllib.request

content = json.load(open(sys.argv[1]))
urls = sorted({s["u"] for c in content.values() for s in c["sources"]})
bad = 0
for u in urls:
    req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0 (link check)"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            code = r.status
    except Exception as ex:  # noqa: BLE001
        code = getattr(ex, "code", type(ex).__name__)
    if code != 200:
        bad += 1
        print(f"{code}  {u}")
print(f"sprawdzono {len(urls)} adresów, błędnych: {bad}")
sys.exit(1 if bad else 0)
