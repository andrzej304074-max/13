# -*- coding: utf-8 -*-
"""Buduje program kursu „Nauka” (data/nauka/course.json) z haseł słownika i banków pytań.

Użycie: python3 -I tools/nauka/build_course.py tools/slownik/glossary . data/nauka
"""
import glob, hashlib, importlib.util, json, math, os, re, sys
from collections import Counter, defaultdict

G, ROOT, OUT = (os.path.abspath(a) for a in sys.argv[1:4])
HERE = os.path.dirname(os.path.abspath(__file__))


def load(p):
    s = importlib.util.spec_from_file_location(os.path.basename(p)[:-3], p)
    m = importlib.util.module_from_spec(s)
    s.loader.exec_module(m)
    return m


C = load(os.path.join(HERE, "curriculum.py"))
sections = [load(p) for p in sorted(glob.glob(os.path.join(G, "s[0-9]*_*.py")))]
SEC_KIND = {9: "wzor", 10: "osoba", 11: "instytucja", 12: "data", 13: "przepis"}
TOPIC_IDS = [t[0] for t in C.TOPICS]
KIND_TITLE = dict(C.KIND_UNITS)


def low(s):
    return s.lower()


def unit_patterns(topic, include_rest=False):
    for uid, title, pats in C.UNITS[topic]:
        for p in pats:
            if p == r".*" and not include_rest:
                continue
            yield uid, re.compile(p)


def matches_topic_units(topic, title, only=None):
    for uid, rx in unit_patterns(topic):
        if only and uid not in only:
            continue
        if rx.search(low(title)):
            return uid
    return None


def topic_by_rules(text):
    for topic, pat in C.TOPIC_RULES:
        if re.search(pat, low(text)):
            return topic
    return "mikro"


def assign_topic(sec, title, d, kind):
    if title in C.OVERRIDES:
        return C.OVERRIDES[title]
    if kind != "pojecie" or sec in (9, 10, 11, 12, 13):
        for pat, topic in C.KIND_TOPIC_FORCE:
            if re.search(pat, low(title)):
                return topic
        return topic_by_rules(title + " " + d)
    if sec == 1:
        return "mikro"
    if sec == 2:
        return "polityka" if matches_topic_units("polityka", title) else "makro"
    if sec == 3:
        return "polityka" if matches_topic_units("polityka", title, {"pol-pieniezna"}) else "finanse"
    if sec == 4:
        return "finanse"
    if sec == 5:
        pol = matches_topic_units("polityka", title, {"pol-podstawy", "pol-fiskalna", "pol-spoleczna", "pol-sektorowa", "pol-pieniezna"})
        return "polityka" if pol else "finanse"
    if sec == 6:
        return "polityka" if matches_topic_units("polityka", title, {"pol-ue", "pol-sektorowa"}) else "makro"
    if sec == 7:
        return "firma"
    if sec == 8:
        return "zarzadzanie"
    if sec == 14:
        for t in ("mikro", "polityka", "zarzadzanie", "makro"):
            if matches_topic_units(t, title):
                return t
        return "makro"
    if sec == 15:
        return "demografia"
    return topic_by_rules(title + " " + d)


def assign_unit(topic, title):
    for uid, rx in unit_patterns(topic, include_rest=True):
        if rx.search(low(title)):
            return uid
    raise AssertionError((topic, title))


def item_id(title):
    return "i" + hashlib.md5(title.encode()).hexdigest()[:9]


def short_title(t):
    return re.sub(r"\s*\(.*?\)", "", t).strip()


def default_keys(term):
    base = re.sub(r"\(.*?\)", "", term).split(" i ")[0].split(" a ")[0].split("/")[0].strip().lower()
    words = [w for w in re.split(r"[\s\-–]+", base) if w]
    stem = " ".join(w if len(w) <= 4 else w[: max(4, len(w) - 2)] for w in words)
    return [stem] if stem else []


# maskowanie nazwy hasła w definicji – jak mask() w tools/slownik/gen_questions.py
STOP = {"teoria", "model", "wskaźnik", "wskaźniki", "zasada", "zasady", "prawo", "metoda", "metody", "rodzaje",
        "funkcje", "polityka", "efekt", "krzywa", "koszt", "koszty", "wzory", "wzór", "obliczanie", "pojęcie"}
LET = "\\wąćęłńóśźżĄĆĘŁŃÓŚŹŻ"


def mask_terms(t, keys):
    terms = {short_title(t)}
    for par in re.findall(r"\((.*?)\)", t):
        terms.update(p.strip() for p in re.split(r"[,;]", par) if len(p.strip()) >= 2)
    for w in re.split(r"[\s/–\-,]+", short_title(t)):
        w = w.strip("„”\"'.")
        if len(w) >= 5 and w.lower() not in STOP:
            terms.add(w[: max(4, len(w) - 2)])
        elif w.isupper() and len(w) >= 2:
            terms.add(w)
    terms.update(k for k in keys if len(k) >= 4 or k.isupper())
    return sorted(terms, key=len, reverse=True)


def mask(text, t, keys):
    for term in mask_terms(t, keys):
        text = re.sub(f"(?<![{LET}])" + re.escape(term) + f"[{LET}’'-]*", "…", text, flags=re.I)
    return re.sub(r"…(\s*…)+", "…", text)


# --- hasła ---
items, unit_items = {}, defaultdict(list)
for n, s in enumerate(sections, 1):
    for t, d, x in s.E:
        kind = SEC_KIND.get(n) or ("instytucja" if re.search(C.INSTITUTION_TITLES, low(t)) else "pojecie")
        topic = assign_topic(n, t, d, kind)
        unit = f"{topic}-{kind}" if kind != "pojecie" else assign_unit(topic, t)
        iid = item_id(t)
        aliases = [a.strip() for par in re.findall(r"\((.*?)\)", t) for a in re.split(r"[,;]", par)
                   if len(a.strip()) >= 2 and re.search(r"[^\d\s.–-]", a)]
        keys = x.get("k") or default_keys(t)
        items[iid] = {
            "id": iid, "t": t, "s": short_title(t), "d": d, "w": x.get("w"), "p": x.get("p"), "u": x.get("u"),
            "kind": kind, "topic": topic, "sec": n, "al": aliases,
            "k": keys, "m": mask(d, t, keys),
        }
        unit_items[unit].append(iid)
        # pojęcia ze wzorem trafiają dodatkowo do działu „Wzory” swojego tematu
        if kind == "pojecie" and x.get("w"):
            unit_items[f"{topic}-wzor"].append(iid)

# --- działy i lekcje ---
units, lessons = [], {}
for topic, title, emoji, color in C.TOPICS:
    unit_defs = [(uid, ut, "pojecie") for uid, ut, _ in C.UNITS[topic]] + \
                [(f"{topic}-{k}", kt, k) for k, kt in C.KIND_UNITS]
    for uid, ut, kind in unit_defs:
        ids = unit_items.get(uid, [])
        if not ids:
            continue
        n_lessons = max(1, math.ceil(len(ids) / 6))
        size = math.ceil(len(ids) / n_lessons)
        lesson_ids = []
        for k in range(n_lessons):
            chunk = ids[k * size:(k + 1) * size]
            if not chunk:
                continue
            lid = f"{uid}-{k + 1}"
            names = [items[i]["s"] for i in chunk[:2]]
            lessons[lid] = {"id": lid, "unit": uid, "topic": topic, "kind": kind, "no": k + 1,
                            "title": " · ".join(names) + (" …" if len(chunk) > 2 else ""), "items": chunk, "questions": []}
            lesson_ids.append(lid)
        units.append({"id": uid, "topic": topic, "kind": kind, "title": ut, "lessons": lesson_ids, "count": len(ids)})

# --- pytania do sprawdzianów ---
bank = []
for f in sorted(glob.glob(os.path.join(ROOT, "data/questions/*.json"))):
    bank += [(q, 1) for q in json.load(open(f))]
bank += [(q, 0) for q in json.load(open(os.path.join(ROOT, "data/slownik/manual.json")))]
bank += [(q, 2) for q in json.load(open(os.path.join(ROOT, "data/slownik/auto.json")))]
texts = [(low(q["question"] + " " + " ".join(q["options"])), low(q["explanation"])) for q, _ in bank]

WB = r"(?<![\wąćęłńóśźż])"
item_rx = {}
for iid, it in items.items():
    keys = [k.lower() for k in it["k"] if len(k) >= 3 or k.isupper()]
    item_rx[iid] = re.compile(WB + "(?:" + "|".join(re.escape(k) for k in keys) + ")") if keys else None

# dla każdego hasła – zbiór pytań, w których występuje (w treści/opcjach i osobno w wyjaśnieniu)
hit_main, hit_expl = {}, {}
for iid, rx in item_rx.items():
    if not rx:
        hit_main[iid], hit_expl[iid] = set(), set()
        continue
    keys = [k.lower() for k in items[iid]["k"] if len(k) >= 3 or k.isupper()]
    pre = lambda t: any(k in t for k in keys)  # szybkie wstępne sprawdzenie podciągu przed wyrażeniem regularnym
    hit_main[iid] = {qi for qi, (m, _) in enumerate(texts) if pre(m) and rx.search(m)}
    hit_expl[iid] = {qi for qi, (_, e) in enumerate(texts) if pre(e) and rx.search(e)}

for lid, L in lessons.items():
    score = Counter()
    for iid in L["items"]:
        for qi in hit_main[iid]:
            score[qi] += 2
        for qi in hit_expl[iid]:
            score[qi] += 1
    scored = sorted((-sc, bank[qi][1], qi) for qi, sc in score.items() if sc >= 2)
    L["questions"] = [bank[qi][0]["id"] for _, _, qi in scored[:24]]

os.makedirs(OUT, exist_ok=True)
course = {
    "topics": [{"id": t, "title": ti, "emoji": e, "color": c} for t, ti, e, c in C.TOPICS],
    "kinds": [{"id": k, "title": kt} for k, kt in C.KINDS],
    "units": units, "lessons": lessons, "items": items,
}
json.dump(course, open(os.path.join(OUT, "course.json"), "w"), ensure_ascii=False, separators=(",", ":"))

# --- raport ---
print(f"hasła: {len(items)}, działy: {len(units)}, lekcje: {len(lessons)}, pod-lekcje: {4 * len(lessons)}")
for t in TOPIC_IDS:
    us = [u for u in units if u["topic"] == t]
    print(f"  {t}: działy {len(us)}, lekcje {sum(len(u['lessons']) for u in us)}, hasła {sum(1 for i in items.values() if i['topic'] == t)}")
    for u in us:
        print(f"     {u['id']:<28} {u['count']:>3} haseł, {len(u['lessons'])} lekcji")
qn = [len(L["questions"]) for L in lessons.values()]
print("pytania na lekcję: min", min(qn), "mediana", sorted(qn)[len(qn) // 2], "lekcji z <6 pytaniami:", sum(1 for n in qn if n < 6))
print("rodzaje:", Counter(i["kind"] for i in items.values()))
