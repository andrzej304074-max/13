# -*- coding: utf-8 -*-
"""Sprawdza, czy nowe pytania ręczne (z plików m20+) nie pokrywają się z bazą OWE, starszymi pytaniami
ręcznymi, automatycznymi ani ze sobą nawzajem.
Użycie: python3 -I tools/slownik/check_overlap.py . """
import difflib, glob, hashlib, importlib.util, json, os, re, sys

ROOT = os.path.abspath(sys.argv[1])
norm = lambda t: re.sub(r"\s+", " ", re.sub(r"[^a-ząćęłńóśźż ]", " ", t.lower())).strip()
words = lambda t: {w for w in norm(t).split() if len(w) > 3}

base = []
for f in glob.glob(os.path.join(ROOT, "data/questions/*.json")):
    base += [("OWE", q) for q in json.load(open(f))]
base += [("AUTO", q) for q in json.load(open(os.path.join(ROOT, "data/slownik/auto.json")))]
manual = json.load(open(os.path.join(ROOT, "data/slownik/manual.json")))
new = []
for p in sorted(glob.glob(os.path.join(ROOT, "tools/slownik/manual/m*.py"))):
    if int(os.path.basename(p)[1:3]) < 20:
        continue
    spec = importlib.util.spec_from_file_location(os.path.basename(p)[:-3], p)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    new += [{"id": "sl-M-" + hashlib.md5(t[2].encode()).hexdigest()[:10], "question": t[2], "options": t[3]} for t in m.M]
old_ids = {q["id"] for q in new}
base += [("RĘCZNE", q) for q in manual if q["id"] not in old_ids]

def sig(q):
    return norm(q["question"]), words(q["question"] + " " + " ".join(q["options"]))

base_sig = [(src, q, *sig(q)) for src, q in base]
flags = 0
seen = []
for q in new:
    t, w = sig(q)
    for src, b, bt, bw in base_sig + seen:
        common = len(w & bw)
        if common < 4:
            continue
        r = difflib.SequenceMatcher(None, t, bt).ratio()
        j = len(w & bw) / max(1, len(w | bw))
        # krótkie, ogólne treści („Które stwierdzenia … są prawdziwe?”) porównujemy po treści z opcjami
        if j >= 0.5 or (r >= 0.85 and len(t) > 60):
            flags += 1
            print(f"[{src}] {r:.2f}/{j:.2f}\n  NOWE: {q['question'][:150]}\n  BYŁO: {b['question'][:150]}")
    seen.append(("NOWE", q, t, w))
print(f"sprawdzono {len(new)} nowych pytań, flag: {flags}")
