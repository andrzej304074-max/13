# -*- coding: utf-8 -*-
"""Generuje automatyczne pytania testowe z haseł słownika (tools/slownik/glossary/s*.py).

Użycie: python3 -I tools/slownik/gen_questions.py tools/slownik/glossary data/slownik [data/nauka/course.json]
Wynik: <out>/auto.json (pytania) i <out>/sections.json (numery i tytuły działów).

Dystraktory pochodzą tylko z haseł tego samego tematu kursu „Nauka”, omawianych w tej samej lub we wcześniejszej
lekcji (kolejność działów i lekcji z course.json), żeby w Sprawdzianie nie pojawiały się pojęcia jeszcze nieomówione.

Szablony:
  A (single) – definicja → które pojęcie (3 dystraktory z tego samego działu, o podobnych nazwach);
               dla osób „kogo dotyczy opis”, dla dat „w którym roku”;
  B (single) – pojęcie → która definicja;
  C (multi)  – 4 pary „pojęcie – definicja”, część z zamienionymi definicjami;
  D (single) – pojęcie → który wzór.
"""
import difflib, glob, hashlib, importlib.util, json, os, random, re, sys

G, OUT = (os.path.abspath(a) for a in sys.argv[1:3])
COURSE = os.path.abspath(sys.argv[3]) if len(sys.argv) > 3 else os.path.join(OUT, "..", "nauka", "course.json")
rnd = random.Random(2026)


def load(p):
    s = importlib.util.spec_from_file_location(os.path.basename(p)[:-3], p)
    m = importlib.util.module_from_spec(s)
    s.loader.exec_module(m)
    return m


sections = [load(p) for p in sorted(glob.glob(os.path.join(G, "s[0-9]*_*.py")))]
SEC_PERSONS, SEC_DATES, SEC_FORMULAS = 10, 12, 9

STOP = {"teoria", "model", "wskaźnik", "wskaźniki", "zasada", "zasady", "prawo", "metoda", "metody", "rodzaje",
        "funkcje", "polityka", "efekt", "krzywa", "koszt", "koszty", "wzory", "wzór", "obliczanie", "pojęcie"}

entries = []  # (sec_no, sec_title, title, definition, extra)
for n, s in enumerate(sections, 1):
    for t, d, x in s.E:
        entries.append({"sec": n, "secTitle": s.TITLE, "title": t, "d": d, "x": x})
by_sec = {}
for e in entries:
    by_sec.setdefault(e["sec"], []).append(e)

# kolejność nauki: (temat, pozycja hasła w kolejnych działach i lekcjach tematu); hasło z kilku działów – pierwsze wystąpienie
ORDER = {}
if os.path.exists(COURSE):
    _c = json.load(open(COURSE, encoding="utf-8"))
    _pos = {}
    for u in _c["units"]:
        for lid in u["lessons"]:
            for iid in _c["lessons"][lid].get("items", []):
                it = _c["items"].get(iid)
                if it and it["t"] not in ORDER:
                    _pos[u["topic"]] = _pos.get(u["topic"], 0) + 1
                    ORDER[it["t"]] = (u["topic"], _pos[u["topic"]])


def known(e, pool, upto=None):
    """Hasła z puli znane uczniowi najpóźniej w lekcji hasła e (ten sam temat, ta sama lub wcześniejsza pozycja)."""
    if not ORDER:
        return pool
    te, ne = ORDER.get(e["title"], (None, 10 ** 9)) if upto is None else upto
    return [p for p in pool if ORDER.get(p["title"], (None, 10 ** 9))[0] == te and ORDER[p["title"]][1] <= ne]


def short_title(t):
    return re.sub(r"\s*\(.*?\)", "", t).strip()


def mask_terms(e):
    t = e["title"]
    terms = set()
    terms.add(short_title(t))
    for par in re.findall(r"\((.*?)\)", t):
        for p in re.split(r"[,;]", par):
            if len(p.strip()) >= 2:
                terms.add(p.strip())
    for w in re.split(r"[\s/–\-,]+", short_title(t)):
        w = w.strip("„”\"'.")
        if len(w) >= 5 and w.lower() not in STOP:
            terms.add(w[: max(4, len(w) - 2)])
        elif w.isupper() and len(w) >= 2:
            terms.add(w)
    for k in e["x"].get("k", []):
        if len(k) >= 4 or k.isupper():
            terms.add(k)
    return sorted(terms, key=len, reverse=True)


def mask(text, e):
    out = text
    for term in mask_terms(e):
        pat = re.compile(r"(?<![\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ])" + re.escape(term) + r"[\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ’'-]*", re.I)
        out = pat.sub("…", out)
    out = re.sub(r"…(\s*…)+", "…", out)
    return out


def first_sentence(text, limit=180):
    parts = re.split(r"(?<=\.)\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ0-9„(])", text)
    s = parts[0]
    for p in parts[1:]:
        if len(s) >= 60:
            break
        s += " " + p
    return s if len(s) <= limit else s[:limit].rsplit(" ", 1)[0] + "…"


def clip(text, limit=240):
    if len(text) <= limit:
        return text
    parts = re.split(r"(?<=[.;])\s+", text)
    out = ""
    for p in parts:
        if len(out) + len(p) + 1 > limit:
            break
        out = (out + " " + p).strip()
    return out or text[:limit].rsplit(" ", 1)[0] + "…"


def full_entry(e):
    s = f"„{e['title']}” – {e['d']}"
    if e["x"].get("w"):
        s += f" Wzór: {e['x']['w']}."
    if e["x"].get("p"):
        s += f" Przykład: {e['x']['p']}"
    if e["x"].get("u"):
        s += f" Uwaga: {e['x']['u']}."
    return s


def label(e):
    return f"Słownik · dz. {e['sec']}. {short_title(e['secTitle'].split(' – ')[0])}"


def similar(e, pool, k=3, key=lambda x: x["title"]):
    """Dystraktory: losowo spośród ~12 najbardziej podobnych nazw z tego samego działu."""
    cands = [p for p in pool if p is not e and short_title(p["title"]).lower() != short_title(e["title"]).lower()]
    if len(cands) < k:
        return None
    scored = sorted(cands, key=lambda p: -difflib.SequenceMatcher(None, key(e).lower(), key(p).lower()).ratio())
    top = scored[:12]
    return rnd.sample(top, k)


def qid(kind, e, extra=""):
    h = hashlib.md5((kind + e["title"] + extra).encode()).hexdigest()[:10]
    return f"sl-{kind}-{h}"


def shuffle_options(correct_opt, wrong_opts):
    opts = [correct_opt] + wrong_opts
    order = list(range(4))
    rnd.shuffle(order)
    shuffled = [opts[i] for i in order]
    return shuffled, [order.index(0)]


LETTERS = "ABCD"
questions = []


_ids = set()


def add(kind, e, qtype, question, options, correct, explanation, others=()):
    i, n = qid(kind, e, question[:40]), 2
    while i in _ids:
        i, n = qid(kind, e, question[:40] + str(n)), n + 1
    _ids.add(i)
    questions.append({
        "id": i,
        "type": qtype,
        "edition": label(e) + " · pytanie automatyczne",
        "question": question,
        "options": options,
        "correct": correct,
        "explanation": explanation,
        "section": e["sec"],
        "origin": "auto",
        # pojęcia w pytaniu (tytuły haseł): pierwsze – hasło, którego dotyczy pytanie, dalej dystraktory
        "pojecia": [e["title"]] + [o["title"] for o in others if o["title"] != e["title"]],
    })


def year_of(t):
    m = re.match(r"^(\d{4}(?:[–-]\d{4})?)\s*–\s*(.+)$", t)
    return (m.group(1), m.group(2)) if m else (None, None)


# --- A: definicja → pojęcie ---
for e in entries:
    pool = by_sec[e["sec"]]
    if e["sec"] == SEC_DATES:
        yr, event = year_of(e["title"])
        if not yr:
            continue
        others = [p for p in known(e, pool) if year_of(p["title"])[0] and year_of(p["title"])[0] != yr]
        if len(others) < 3:
            continue
        others.sort(key=lambda p: abs(int(year_of(p["title"])[0][:4]) - int(yr[:4])))
        wrong = rnd.sample(others[:8], 3)
        details = re.sub(r"\b1[5-9]\d\d\b|\b20\d\d\b", "…", e["d"])
        opts, corr = shuffle_options(yr, [year_of(p["title"])[0] for p in wrong])
        add("A", e, "single", f"W którym roku (okresie): {event}? ({clip(details, 200)})", opts, corr,
            f"Poprawnie: {yr}. {full_entry(e)} Pozostałe daty: " +
            "; ".join(f"{year_of(p['title'])[0]} – {year_of(p['title'])[1]}" for p in wrong) + ".", wrong)
        continue
    if e["sec"] == SEC_FORMULAS:
        continue  # dział wzorów obsługuje szablon D
    d = mask(e["d"], e)
    if len(re.sub(r"[…\W]", "", d)) < 35 or d.count("…") > 6:
        continue
    wrong = similar(e, known(e, pool))
    if not wrong:
        continue
    opts, corr = shuffle_options(e["title"], [p["title"] for p in wrong])
    if e["sec"] == SEC_PERSONS:
        q = f"Kogo dotyczy opis: „{clip(d, 300)}”?"
    else:
        q = f"Które pojęcie opisuje definicja: „{clip(d, 300)}”?"
    expl = full_entry(e) + " Pozostałe odpowiedzi: " + "; ".join(
        f"{p['title']} – {first_sentence(p['d'], 140)}" for p in wrong)
    add("A", e, "single", q, opts, corr, expl, wrong)

# --- B: pojęcie → definicja ---
for e in entries:
    if e["sec"] in (SEC_DATES, SEC_FORMULAS):
        continue
    if not (40 <= len(e["d"]) <= 260):
        continue
    pool = [p for p in known(e, by_sec[e["sec"]]) if 40 <= len(p["d"]) <= 320]
    wrong = similar(e, pool)
    if not wrong:
        continue
    right = clip(mask(e["d"], e), 240)
    wr = [clip(mask(p["d"], p), 240) for p in wrong]
    if len(set([right] + wr)) < 4:
        continue
    opts, corr = shuffle_options(right, wr)
    who = "Który opis dotyczy osoby" if e["sec"] == SEC_PERSONS else "Która definicja opisuje pojęcie"
    expl = full_entry(e) + " Błędne odpowiedzi opisują: " + "; ".join(p["title"] for p in wrong) + "."
    add("B", e, "single", f"{who}: {e['title']}?", opts, corr, expl, wrong)

# --- D: pojęcie → wzór ---
with_w = [e for e in entries if e["x"].get("w") and len(e["x"]["w"]) <= 200]
for e in with_w:
    pool = [p for p in known(e, with_w) if p is not e and p["x"]["w"] != e["x"]["w"]]
    wrong = similar(e, pool)
    if not wrong:
        continue
    opts, corr = shuffle_options(e["x"]["w"], [p["x"]["w"] for p in wrong])
    expl = full_entry(e) + " Pozostałe wzory dotyczą: " + "; ".join(p["title"] for p in wrong) + "."
    add("D", e, "single", f"Który wzór (zależność) dotyczy hasła: {e['title']}?", opts, corr, expl, wrong)

# --- C: wielokrotny – prawdziwe pary pojęcie–definicja ---
by_sec_topic = {}
for e in entries:
    by_sec_topic.setdefault((e["sec"], ORDER.get(e["title"], (None,))[0]), []).append(e)
for rep in range(2):
    for (sec, _topic), pool0 in by_sec_topic.items():
        if sec in (SEC_DATES, SEC_FORMULAS):
            continue
        pool = [p for p in pool0 if 30 <= len(p["d"]) <= 300]
        rnd.shuffle(pool)
        for i in range(0, len(pool) - 3, 4):
            group = pool[i:i + 4]
            # para „pojęcie – cudzy opis”: opis tylko z hasła znanego najpóźniej w lekcji ostatniego hasła grupy
            last = max(group, key=lambda g: ORDER.get(g["title"], ("", 10 ** 9))[1])
            if ORDER and len({ORDER.get(g["title"], (None,))[0] for g in group}) > 1:
                continue
            n_true = rnd.choice([1, 2, 2, 3, 3, 4, 0])
            truth = [True] * n_true + [False] * (4 - n_true)
            rnd.shuffle(truth)
            opts, parts, correct, srcs = [], [], [], []
            for j, (e, ok) in enumerate(zip(group, truth)):
                if ok:
                    d_src = e
                else:
                    others = [p for p in known(last, pool) if p not in group and p["title"] != e["title"]]
                    if not others:
                        break
                    d_src = similar(e, others, 1)[0]
                opts.append(f"{e['title']} – {clip(mask(d_src['d'], d_src), 200)}")
                srcs += [e, d_src]
                if ok:
                    correct.append(j)
                    parts.append(f"{LETTERS[j]} – prawda.")
                else:
                    parts.append(f"{LETTERS[j]} – fałsz: podany opis dotyczy hasła „{d_src['title']}”; "
                                 f"{e['title']} to: {first_sentence(e['d'], 200)}")
            if len(opts) < 4:
                continue
            head = group[0]
            add("C", head, "multi", "Które zestawienia pojęcia z jego opisem są poprawne?", opts, correct,
                " ".join(parts), [g for g in group + srcs if g is not head])

os.makedirs(OUT, exist_ok=True)
json.dump(questions, open(os.path.join(OUT, "auto.json"), "w"), ensure_ascii=False, separators=(",", ":"))
json.dump([{"no": n, "title": s.TITLE} for n, s in enumerate(sections, 1)],
          open(os.path.join(OUT, "sections.json"), "w"), ensure_ascii=False, indent=1)
from collections import Counter
print(len(questions), Counter(q["id"].split("-")[1] for q in questions), Counter(q["type"] for q in questions))
print("duplikaty id:", len(questions) - len({q["id"] for q in questions}))
