"""Buduje bank „Pytania AI (sprawdzone)” – data/ai/questions.json – z surowe.json (extract.py) i klucz.txt.

Użycie: python3 -I tools/pytania_ai/build.py
Każde pytanie ma ręcznie ustaloną poprawną odpowiedź i wyjaśnienie (klucz.txt); poprawki treści i odpowiedzi
(q=…, o<k>=…) zastępują surowy tekst, a pytania oznaczone x=… (duplikaty, wadliwe) są pomijane.
Raport: tools/pytania_ai/RAPORT.md.
"""
import hashlib, json, os, re
from collections import Counter, defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
raw = json.load(open(os.path.join(HERE, "surowe.json"), encoding="utf-8"))

# błędy kodowania z eksportu (ń → o, ć → d na końcu wyrazu)
TYPO = [(r"\bstopieo\b", "stopień"), (r"ośd\b", "ość"), (r"\bkoocow", "końcow"), (r"ograniczeo\b", "ograniczeń"),
        (r"zobowiązao\b", "zobowiązań"), (r"\bjednie\b", "jedynie"), (r"\bdopiera\b", "dopiero")]


def fix(s: str) -> str:
    for a, b in TYPO:
        s = re.sub(a, b, s)
    return s.strip()


key = defaultdict(dict)
for line in open(os.path.join(HERE, "klucz.txt"), encoding="utf-8"):
    line = line.rstrip("\n")
    if not line.strip() or line.startswith("#"):
        continue
    n, rest = line.split("|", 1)
    n = int(n)
    if rest.startswith("x="):
        key[n]["drop"] = rest[2:]
    elif rest.startswith("q="):
        key[n]["q"] = rest[2:]
    elif m := re.match(r"o(\d)=(.*)", rest):
        key[n].setdefault("o", {})[int(m.group(1))] = m.group(2)
    else:
        c, expl = rest.split("|", 1)
        key[n]["c"] = [int(x) for x in c.split(",")]
        key[n]["e"] = expl

out, dropped, edited = [], [], 0
for n, r in enumerate(raw):
    k = key[n]
    if "drop" in k:
        dropped.append((n, r["question"], k["drop"]))
        continue
    assert "c" in k, f"brak klucza dla {n}"
    opts = [fix(k.get("o", {}).get(i, o)) for i, o in enumerate(r["options"])]
    q = fix(k.get("q", r["question"]))
    edited += bool(k.get("q") or k.get("o"))
    assert len(opts) == 4 and all(opts), n
    out.append({
        "id": "ai-" + hashlib.sha1(re.sub(r"\W+", " ", r["question"].lower()).encode()).hexdigest()[:8],
        "type": "single" if len(k["c"]) == 1 else "multi",
        "edition": "Pytania AI",
        "question": q, "options": opts, "correct": k["c"], "explanation": k["e"],
        "dzial": r["dzial"], "origin": "ai",
    })
assert len({q["id"] for q in out}) == len(out), "kolizja id"
json.dump(out, open(os.path.join(ROOT, "data/ai/questions.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

dz = Counter(q["dzial"] for q in out)
dup = sum(1 for _, _, why in dropped if why.startswith("duplikat"))
rep = [
    "# Pytania AI (sprawdzone) – raport importu", "",
    "Źródło: pytania oznaczone „🤖 AI” wklejone przez użytkownika (eksport z innej aplikacji, 22.10.2026).",
    "Pytania „📜 OWE” z tego samego wklejenia pominięto – są w Archiwum OWE.", "",
    f"- bloków z oznaczeniem AI: 659, po scaleniu identycznych: {len(raw)}",
    f"- odrzucone jako powtórzenia tego samego pytania innymi słowami: {dup}",
    f"- odrzucone z innych powodów: {len(dropped) - dup}",
    f"- **w banku: {len(out)}** (jednokrotnego wyboru: {sum(q['type'] == 'single' for q in out)})",
    f"- z poprawioną treścią lub odpowiedziami (bełkot, literówki, doklejony tekst): {edited}", "",
    "Poprawne odpowiedzi nie były zaznaczone – każdą ustalono ręcznie i opisano w wyjaśnieniu (tools/pytania_ai/klucz.txt).", "",
    "## Działy", "", "| dział | pytań |", "|---|---:|", *[f"| {d} | {n} |" for d, n in dz.most_common()], "",
    "## Odrzucone", "", "| nr | pytanie | powód |", "|---:|---|---|",
    *[f"| {n} | {q[:90].replace('|', '/')}… | {why} |" for n, q, why in dropped],
]
open(os.path.join(HERE, "RAPORT.md"), "w", encoding="utf-8").write("\n".join(rep) + "\n")
print(f"w banku {len(out)}, odrzucone {len(dropped)} (duplikaty {dup}), poprawione {edited}", dict(dz))
