# -*- coding: utf-8 -*-
"""Algorytmiczne pytania do hasła przewodniego bieżącej edycji OWE (Słownik, dział hasła) – data/slownik/theme_auto.json.

Użycie: python3 -I tools/slownik/gen_theme.py data/nauka/course.json data/slownik
Hasło ustawia stała THEME (temat kursu „Nauka”, dział słownika, edycja). Przy zmianie hasła wystarczy zmienić THEME
(i dopisać hasła tematu do słownika) – pytania wygenerują się dla nowego tematu.

Pytania dotyczą wszystkich haseł tematu, także tych z innych działów słownika (osoby, instytucje, daty), a dystraktory
pochodzą z tego samego tematu – w odróżnieniu od gen_questions.py, który dobiera je z działu słownika:
  T1 (single) – opis → które hasło tematu (pojęcia, osoby, instytucje; dystraktory – hasła tematu tego samego rodzaju);
  T2 (single) – hasło → który opis (opisy innych haseł tematu tego samego rodzaju);
  T3 (single) – które hasło NIE należy do tematu (3 hasła tematu, 1 spoza – podobne słownictwo);
  T4 (multi)  – które z haseł należą do tematu (0–4 hasła tematu, reszta spoza).
Pytania mają pochodzenie „auto”, pole `pojecia` (tytuły haseł) i id `xl-T-…` (T1, T2) albo `xl-TC-…` (T3, T4) – źródło „Hasło XL”.
"""
import difflib, hashlib, json, os, random, re, sys

THEME = {"topic": "demografia", "section": 15, "edition": "XL", "title": "Gospodarka wobec wyzwań demograficznych"}

COURSE, OUT = (os.path.abspath(a) for a in sys.argv[1:3])
course = json.load(open(COURSE, encoding="utf-8"))
items = [i for i in course["items"].values() if i["kind"] != "zrozumienie" and i.get("d")]
theme = [i for i in items if i["topic"] == THEME["topic"]]
other = [i for i in items if i["topic"] != THEME["topic"]]
rnd = random.Random(f"theme-{THEME['edition']}")
LETTERS = "ABCD"
KIND_NAME = {"pojecie": "pojęcie", "osoba": "osoba", "instytucja": "instytucja", "data": "data", "przepis": "przepis", "wzor": "wzór"}
questions, ids = [], set()


def clip(t, n=240):
    t = re.sub(r"\s+", " ", t).strip()
    return t if len(t) <= n else t[: n - 1].rsplit(" ", 1)[0] + "…"


def masked(i):
    """Opis bez nazwy hasła (pole `m` z build_course.py, a gdy go brak – usunięcie słów tytułu)."""
    m = i.get("m") or i["d"]
    for w in re.findall(r"\w{4,}", i["t"]):
        m = re.sub(rf"\b{re.escape(w[:-1])}\w*", "…", m, flags=re.I)
    return clip(m)


def similar(i, pool, k=3):
    pool = [p for p in pool if p["t"] != i["t"]]
    pool.sort(key=lambda p: -difflib.SequenceMatcher(None, i["t"].lower(), p["t"].lower()).ratio())
    head = pool[: k * 3]
    return rnd.sample(head, k) if len(head) >= k else []


def add(kind, qtype, question, options, correct, explanation, pojecia):
    h = hashlib.md5((kind + question + "|".join(options)).encode()).hexdigest()[:10]
    # xl-TC-: pytanie o kilka haseł naraz (T3, T4) – w statystykach liczy się dla wszystkich; xl-T-: o pierwsze z `pojecia`
    qid = f"xl-TC-{h}" if kind in ("T3", "T4") else f"xl-T-{h}"
    if qid in ids:
        return
    ids.add(qid)
    questions.append({
        "id": qid, "type": qtype,
        "edition": f"Słownik · hasło {THEME['edition']} OWE · pytanie automatyczne",
        "question": question, "options": options, "correct": correct, "explanation": explanation,
        "section": THEME["section"], "origin": "auto", "pojecia": pojecia,
    })


def shuffled(right, wrong):
    opts = [right] + wrong
    order = list(range(4))
    rnd.shuffle(order)
    return [opts[k] for k in order], [order.index(0)]


same_kind = lambda i: [p for p in theme if p["kind"] == i["kind"]]

# T1: opis → hasło
for i in theme:
    d = masked(i)
    if len(re.sub(r"[…\W]", "", d)) < 35 or d.count("…") > 5:
        continue
    wrong = similar(i, same_kind(i))
    if not wrong:
        continue
    opts, corr = shuffled(i["t"], [p["t"] for p in wrong])
    q = f"Kogo dotyczy opis (hasło {THEME['edition']} OWE): „{d}”?" if i["kind"] == "osoba" else \
        f"Które hasło („{THEME['title']}”) opisuje: „{d}”?"
    expl = f"{i['t']}: {clip(i['d'], 300)} Pozostałe: " + "; ".join(f"{p['t']} – {clip(p['d'], 110)}" for p in wrong)
    add("T1", "single", q, opts, corr, expl, [i["t"]] + [p["t"] for p in wrong])

# T2: hasło → opis
for i in theme:
    if not 40 <= len(i["d"]) <= 280:
        continue
    pool = [p for p in same_kind(i) if 40 <= len(p["d"]) <= 320]
    wrong = similar(i, pool)
    if not wrong:
        continue
    right, wr = masked(i), [masked(p) for p in wrong]
    if len({right, *wr}) < 4:
        continue
    opts, corr = shuffled(right, wr)
    q = f"Który opis dotyczy osoby: {i['t']}?" if i["kind"] == "osoba" else f"Który opis dotyczy hasła: {i['t']}?"
    expl = f"{i['t']}: {clip(i['d'], 300)} Błędne odpowiedzi opisują: " + "; ".join(p["t"] for p in wrong) + "."
    add("T2", "single", q, opts, corr, expl, [i["t"]] + [p["t"] for p in wrong])

# T3: które hasło NIE należy do tematu
concepts = [i for i in theme if i["kind"] == "pojecie"]
outside = [i for i in other if i["kind"] == "pojecie" and i["topic"] in ("makro", "polityka", "finanse", "mikro")]
for n in range(min(60, len(concepts) // 3 * 3)):
    three = rnd.sample(concepts, 3)
    odd = similar(three[0], outside, 1)
    if not odd:
        continue
    odd = odd[0]
    opts, corr = shuffled(odd["t"], [t["t"] for t in three])
    expl = (f"{odd['t']} należy do innego działu: {clip(odd['d'], 160)} Pozostałe hasła dotyczą demografii: "
            + "; ".join(f"{t['t']} – {clip(t['d'], 90)}" for t in three))
    add("T3", "single", f"Które hasło NIE dotyczy tematu „{THEME['title']}”?", opts, corr, expl, [odd["t"]] + [t["t"] for t in three])

# T4: wielokrotny – które hasła należą do tematu
for n in range(50):
    k = rnd.choice([1, 2, 2, 3, 3, 4, 0])
    picks = [(i, True) for i in rnd.sample(concepts, k)] + [(i, False) for i in rnd.sample(outside, 4 - k)]
    rnd.shuffle(picks)
    opts = [p[0]["t"] for p in picks]
    if len(set(opts)) < 4:
        continue
    correct = [j for j, (_, ok) in enumerate(picks) if ok]
    parts = [f"{LETTERS[j]} – {'tak' if ok else 'nie'}: {clip(i['d'], 110)}" for j, (i, ok) in enumerate(picks)]
    add("T4", "multi", f"Które z wymienionych haseł należą do tematu „{THEME['title']}” (hasło {THEME['edition']} OWE)?",
        opts, correct, " ".join(parts), [p[0]["t"] for p in picks])

json.dump(questions, open(os.path.join(OUT, "theme_auto.json"), "w"), ensure_ascii=False, separators=(",", ":"))
from collections import Counter
print(len(questions), Counter(q["id"] for q in []) or Counter(q["question"][:12] for q in questions).most_common(4),
      Counter(q["type"] for q in questions), "hasła tematu:", len(theme))
