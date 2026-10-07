# -*- coding: utf-8 -*-
"""Składa ręcznie pisane pytania (tools/slownik/manual/m*.py) do data/slownik/manual.json.

Każdy plik m*.py definiuje listę M krotek: (dział, typ, pytanie, [A, B, C, D], "litery poprawnych", wyjaśnienie),
gdzie typ to "s" (jednokrotny) albo "m" (wielokrotny; poprawnych może być 0–4, wtedy litery "" oznaczają brak).
Użycie: python3 -I tools/slownik/build_manual.py tools/slownik/manual data/slownik
"""
import glob, hashlib, importlib.util, json, os, sys

SRC, OUT = (os.path.abspath(a) for a in sys.argv[1:3])
sections = {s["no"]: s["title"] for s in json.load(open(os.path.join(OUT, "sections.json")))}
out, seen = [], set()
for p in sorted(glob.glob(os.path.join(SRC, "m*.py"))):
    spec = importlib.util.spec_from_file_location(os.path.basename(p)[:-3], p)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    for i, (sec, typ, q, opts, corr, expl) in enumerate(m.M):
        where = f"{os.path.basename(p)}#{i + 1}"
        assert sec in sections, where
        assert typ in ("s", "m"), where
        assert len(opts) == 4 and len(set(opts)) == 4, where
        idx = sorted("ABCD".index(c) for c in corr)
        assert typ == "m" or len(idx) == 1, where
        h = hashlib.md5(q.encode()).hexdigest()[:10]
        qid = f"sl-M-{h}"
        assert qid not in seen, f"powtórzone pytanie {where}"
        seen.add(qid)
        out.append({
            "id": qid,
            "type": "single" if typ == "s" else "multi",
            "edition": f"Słownik · dz. {sec}. {sections[sec].split(' – ')[0]} · pytanie ręczne",
            "question": q,
            "options": opts,
            "correct": idx,
            "explanation": expl,
            "section": sec,
            "origin": "manual",
        })
json.dump(out, open(os.path.join(OUT, "manual.json"), "w"), ensure_ascii=False, separators=(",", ":"))
from collections import Counter
print(len(out), Counter(q["type"] for q in out), sorted(Counter(q["section"] for q in out).items()))
