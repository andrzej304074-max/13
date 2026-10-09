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
    forced = getattr(C, "UNIT_OVERRIDES", {}).get(title)
    if forced:
        return forced
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
# Każde pytanie (OWE, ręczne i automatyczne ze słownika) trafia do dokładnie jednej lekcji: najpóźniejszej lekcji
# tematu swoich pojęć głównych, która zawiera któreś z nich. Pojęcia pytania (z treści i ze wszystkich odpowiedzi),
# których uczeń jeszcze nie poznał w tym temacie, lekcja omawia dodatkowo („extra”), a poznane wcześniej powtarza
# („review”). Gdy nowych pojęć jest za dużo, lekcja dostaje kolejne części (cz. 2, 3…).
PP = load(os.path.join(HERE, "pojecia_pytan.py"))
matcher = PP.Matcher(items)
MAX_NEW = 12  # hasła lekcji + extra w jednej części

bank = []
for f in sorted(glob.glob(os.path.join(ROOT, "data/questions/*.json"))):
    bank += [(q, "owe") for q in json.load(open(f))]
bank += [(q, "manual") for q in json.load(open(os.path.join(ROOT, "data/slownik/manual.json")))]
bank += [(q, "auto") for q in json.load(open(os.path.join(ROOT, "data/slownik/auto.json")))]


def concepts(q, origin):
    """(main, all) – id haseł; pytania automatyczne niosą listę swoich pojęć (tytuły haseł)."""
    if origin == "auto":
        ids = list(dict.fromkeys(item_id(t) for t in q["pojecia"] if item_id(t) in items))
        main = ids if q["id"].startswith("sl-C-") else ids[:1]
        return set(main), set(ids)
    a = matcher.analyze(q)
    return a["main"], a["all"]


# kolejność nauki w temacie: działy w kolejności UNITS, w dziale lekcje 1, 2, …
order, lesson_pos, item_lessons = defaultdict(list), {}, defaultdict(list)
for u in units:
    for lid in u["lessons"]:
        lesson_pos[lid] = len(order[u["topic"]])
        order[u["topic"]].append(lid)
        for iid in lessons[lid]["items"]:
            item_lessons[iid].append(lid)
first_pos = {}  # hasło → najwcześniejsza pozycja w swoim temacie
for iid, ls in item_lessons.items():
    first_pos[iid] = min(lesson_pos[l] for l in ls if lessons[l]["topic"] == items[iid]["topic"])

placed = defaultdict(list)  # lekcja → [(id pytania, origin, all)]
unplaced = []
for q, origin in bank:
    main, allc = concepts(q, origin)
    main = {i for i in main if i in item_lessons} or {i for i in allc if i in item_lessons}
    if not main:
        # bez rozpoznanych haseł (np. pytanie o fakt spoza słownika): lekcja tematu działu słownika (pytania
        # ręczne) o największej zbieżności słów z definicjami haseł; pytanie nie wymaga omówienia nowych pojęć
        words = set(re.findall(r"[a-ząćęłńóśźż]{5,}", low(q["question"] + " " + " ".join(q["options"]))))
        topics = [t for t, _ in Counter(items[i]["topic"] for i in items if items[i]["sec"] == q.get("section")).most_common(1)]
        pool = [l for l in lessons if not topics or lessons[l]["topic"] == topics[0]]
        score = lambda l: sum(len(words & set(re.findall(r"[a-ząćęłńóśźż]{5,}", low(items[i]["d"])))) for i in lessons[l]["items"])
        lid = max(pool, key=lambda l: (score(l), -lesson_pos[l]))
        placed[lid].append((q["id"], origin, set()))
        unplaced.append(q["id"])
        continue
    # pytanie dotyczy pojęć (osoby, instytucje, daty i przepisy w treści to zwykle kontekst) – o lekcji decydują pojęcia
    pref = {i for i in main if items[i]["kind"] == "pojecie"} or main
    tcount = Counter(items[i]["topic"] for i in pref)
    topic = max(tcount, key=lambda t: (tcount[t], max(first_pos[i] for i in pref if items[i]["topic"] == t)))
    # lekcja macierzysta hasła = pierwsze jego wystąpienie w temacie (nie powtórzenie w dziale „Wzory”)
    lid = order[topic][max(first_pos[i] for i in pref if items[i]["topic"] == topic)]
    placed[lid].append((q["id"], origin, allc))

ORIGIN_RANK = {"owe": 0, "manual": 1, "auto": 2}
moved = []  # (pytanie, lekcja docelowa) – raport
new_lessons = {}
for topic, seq in order.items():
    known = set()  # hasła poznane we wcześniejszych lekcjach tematu (łącznie z ich extra)
    for lid in seq:
        L = lessons[lid]
        own = set(L["items"])
        qs = sorted(placed.get(lid, []), key=lambda x: (ORIGIN_RANK[x[1]], x[0]))
        # pytania wymagające najmniej nowych pojęć najpierw – kolejne części dostają resztę
        qs.sort(key=lambda x: len(x[2] - own - known))
        parts = [{"items": L["items"], "extra": [], "qs": [], "taught": set(own)}]
        for qid_, origin, allc in qs:
            P = parts[-1]
            need = allc - P["taught"] - known
            if len(P["items"]) + len(P["extra"]) + len(need) > MAX_NEW and (P["qs"] or P["extra"]):
                prev = set().union(*(x["taught"] for x in parts))
                P = {"items": [], "extra": [], "qs": [], "taught": set(prev)}
                parts.append(P)
                need = allc - P["taught"] - known
            P["extra"] += sorted(need, key=lambda i: items[i]["s"])
            P["taught"] |= need
            P["qs"].append((qid_, allc))
        prev_taught = set(known)
        for k, P in enumerate(parts):
            if k == 0:
                pid, PL = lid, L
            else:
                pid = f"{lid}-cz{k + 1}"
                PL = dict(L, id=pid, items=[], part=k + 1,
                          title=f"{L['title']} (cz. {k + 1})")
                new_lessons[pid] = (lid, PL)
            allq = set().union(*(a for _, a in P["qs"])) if P["qs"] else set()
            PL["extra"] = P["extra"]
            PL["review"] = sorted(allq & prev_taught - set(PL["items"]) - set(P["extra"]), key=lambda i: items[i]["s"])
            PL["questions"] = [x for x, _ in P["qs"]]
            # kontrola: każde pojęcie pytania lekcja omawia (hasła, extra) albo powtarza (review)
            cover = set(PL["items"]) | set(PL["extra"]) | set(PL["review"])
            for x, a in P["qs"]:
                missing = a - cover
                assert not missing, (pid, x, [items[i]["t"] for i in missing])
            prev_taught |= P["taught"]
        known |= set().union(*(P["taught"] for P in parts))

# kolejne części wstawiane w dziale zaraz po swojej lekcji
for pid, (lid, PL) in new_lessons.items():
    lessons[pid] = PL
for u in units:
    out = []
    for lid in u["lessons"]:
        out.append(lid)
        k = 2
        while f"{lid}-cz{k}" in lessons:
            out.append(f"{lid}-cz{k}")
            k += 1
    u["lessons"] = out
QSTATS = {"placed": sum(len(v) for v in placed.values()), "unplaced": unplaced, "parts": len(new_lessons)}

os.makedirs(OUT, exist_ok=True)
course = {
    "topics": [{"id": t, "title": ti, "emoji": e, "color": c} for t, ti, e, c in C.TOPICS],
    "kinds": [{"id": k, "title": kt} for k, kt in C.KINDS],
    "units": units, "lessons": lessons, "items": items,
}
# lekcje „Zrozumienie” (ręczne treści z tools/nauka/zrozum) – dopisywane do działów, zawartość w zrozum.json
load(os.path.join(HERE, "build_zrozum.py")).build(course, ROOT, OUT)
json.dump(course, open(os.path.join(OUT, "course.json"), "w"), ensure_ascii=False, separators=(",", ":"))

# --- raport ---
print(f"hasła: {len(items)}, działy: {len(units)}, lekcje: {len(lessons)}, pod-lekcje: {4 * len(lessons)}")
for t in TOPIC_IDS:
    us = [u for u in units if u["topic"] == t]
    print(f"  {t}: działy {len(us)}, lekcje {sum(len(u['lessons']) for u in us)}, hasła {sum(1 for i in items.values() if i['topic'] == t and i['kind'] != 'zrozumienie')}, zrozumienie {sum(1 for u in us for l in u['lessons'] if lessons[l].get('type') == 'zrozum')}")
    for u in us:
        print(f"     {u['id']:<28} {u['count']:>3} haseł, {len(u['lessons'])} lekcji")
qn = [len(L["questions"]) for L in lessons.values() if L.get("type") != "zrozum"]
ex = sorted(len(L.get("extra", [])) for L in lessons.values() if L.get("type") != "zrozum")
print("pytania:", QSTATS["placed"], "przydzielone, w tym bez rozpoznanych haseł:", len(QSTATS["unplaced"]), QSTATS["unplaced"])
print("pytania na lekcję: min", min(qn), "mediana", sorted(qn)[len(qn) // 2], "max", max(qn), "lekcji z <6 pytaniami:", sum(1 for n in qn if n < 6))
print("extra na lekcję: mediana", ex[len(ex) // 2], "max", ex[-1], "· kolejnych części lekcji:", QSTATS["parts"])
print("rodzaje:", Counter(i["kind"] for i in items.values()))
