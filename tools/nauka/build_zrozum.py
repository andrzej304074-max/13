# -*- coding: utf-8 -*-
"""Lekcje „Zrozumienie” – ręcznie pisane wyjaśnienia i ćwiczenia na rozumienie (mechanizmy, obliczenia, przypadki).

Treści: tools/nauka/zrozum/<id-działu>.py, każdy plik definiuje listę LESSONS z lekcjami L(...).
Funkcje opisu treści (K, W, M, PF, LU, LN, KT, LB, WY, PR, G, S, L) są wstrzykiwane do modułu przed jego wykonaniem.
Moduł wywołuje build_course.py: build(course, root, out_dir) – waliduje treści, dopisuje lekcje do kursu
i zapisuje ich zawartość do data/nauka/zrozum.json.

Zasady zapisu: w ćwiczeniach wyboru poprawna odpowiedź jest PIERWSZA (kolejność losuje aplikacja);
zadania liczbowe mają wyrażenie `calc`, które walidator przelicza i porównuje z odpowiedzią `a`.
"""
import difflib, glob, hashlib, importlib.util, json, math, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "zrozum")

# Wykresy: rodzaj → krzywe (nazwa, kształt) i domyślne osie. Ta sama konfiguracja jest w lib/nauka-graph.ts.
GRAPHS = {
    "sd": ({"D": "down", "S": "up"}, "Ilość (Q)", "Cena (P)"),
    "adas": ({"AD": "down", "SRAS": "up", "LRAS": "vertical"}, "Produkcja (Y)", "Poziom cen (P)"),
    "islm": ({"IS": "down", "LM": "up"}, "Dochód (Y)", "Stopa procentowa (r)"),
    "praca": ({"DL": "down", "SL": "up"}, "Zatrudnienie (L)", "Płaca realna (W/P)"),
    "pieniadz": ({"MD": "down", "MS": "vertical"}, "Ilość pieniądza (M)", "Stopa procentowa (i)"),
    "waluta": ({"D": "down", "S": "up"}, "Ilość euro", "Kurs PLN/EUR"),
    "fundusze": ({"D": "down", "S": "up"}, "Fundusze pożyczkowe", "Stopa procentowa (r)"),
}
STAT_BY_SUB = {0: "sprawdzenie", 1: "mechanizm", 2: "liczba", 3: "przypadek"}
MIN_EX = 6


class ContentError(Exception):
    pass


# ---------- opis treści (DSL) ----------

def K(title, text, w=None, p=None, g=None):
    """Karta wyjaśnienia (nieoceniana)."""
    return {"t": "karta", "title": title, "text": text, "w": w, "p": p, "g": g}


def W(q, ok, *bad, why):
    """Wybór jednokrotny: poprawna odpowiedź pierwsza, potem 2–3 błędne."""
    return {"t": "wybor", "q": q, "opts": [ok, *bad], "ok": 0, "why": why}


def M(q, opts, ok, why):
    """Wybór wielokrotny (4 opcje, `ok` – indeksy poprawnych)."""
    return {"t": "multi", "q": q, "opts": list(opts), "ok": sorted(ok), "why": why}


def PF(s, v, why):
    """Prawda czy fałsz."""
    return {"t": "pf", "s": s, "v": bool(v), "why": why}


def LU(text, ok, *bad, why):
    """Luka: `text` zawiera dokładnie jedno ___; poprawne słowo pierwsze."""
    return {"t": "luka", "text": text, "opts": [ok, *bad], "ok": 0, "why": why}


def LN(q, steps, why=""):
    """Łańcuch przyczyna → skutek (kroki w poprawnej kolejności)."""
    return {"t": "lancuch", "q": q, "steps": list(steps), "why": why}


def KT(q, cats, why=""):
    """Kategorie: {nazwa kategorii: [elementy]}."""
    names = list(cats)
    return {"t": "kategorie", "q": q, "cats": names, "items": [[x, i] for i, c in enumerate(names) for x in cats[c]], "why": why}


def LB(q, a, calc, steps, unit="", tol=None):
    """Zadanie liczbowe: odpowiedź `a`, wyrażenie `calc` do kontroli, rozwiązanie krok po kroku."""
    return {"t": "liczba", "q": q, "a": a, "calc": calc, "steps": list(steps), "unit": unit, "tol": tol}


def WY(q, g, ok, *bad, why):
    """Wykres: pokazany stan wyjściowy `g` bez przesunięć; po odpowiedzi – przesunięcie z `g`."""
    return {"t": "wykres", "q": q, "g": g, "opts": [ok, *bad], "ok": 0, "why": why}


def PR(ctx, *exercises):
    """Studium przypadku: tekst `ctx` wyświetlany nad każdym z pytań."""
    return {"t": "przypadek", "ctx": ctx, "ex": list(exercises)}


def G(kind, x=None, y=None, names=None, **shift):
    """Wykres rodzaju `kind` z przesunięciami krzywych (np. D=1 – w prawo, S=-1 – w lewo)."""
    return {"k": kind, "shift": shift, "x": x, "y": y, "names": names or {}}


def S(name, url, date):
    """Źródło: nazwa, adres, data dostępu (RRRR-MM-DD)."""
    return {"n": name, "u": url, "d": date}


def L(no, title, goal, refs, src, explain, mech, calc, case):
    return {"no": no, "title": title, "goal": goal, "refs": list(refs), "src": list(src),
            "subs": [list(explain), list(mech), list(calc), list(case)]}


DSL = dict(K=K, W=W, M=M, PF=PF, LU=LU, LN=LN, KT=KT, LB=LB, WY=WY, PR=PR, G=G, S=S, L=L)


# ---------- walidacja ----------

norm = lambda t: re.sub(r"\s+", " ", re.sub(r"[^0-9a-ząćęłńóśźż ]", " ", str(t).lower())).strip()


def check_graph(g, where):
    if not isinstance(g, dict) or g.get("k") not in GRAPHS:
        raise ContentError(f"{where}: nieznany rodzaj wykresu {g!r}")
    curves = GRAPHS[g["k"]][0]
    for c, v in g["shift"].items():
        if c not in curves:
            raise ContentError(f"{where}: wykres {g['k']} nie ma krzywej {c}")
        if not (isinstance(v, (int, float)) and -2 <= v <= 2 and v != 0):
            raise ContentError(f"{where}: przesunięcie {c}={v} poza zakresem")
    for c in g["names"]:
        if c not in curves:
            raise ContentError(f"{where}: nazwa dla nieznanej krzywej {c}")


def check_opts(opts, where, n=(3, 4)):
    if not (n[0] <= len(opts) <= n[1]):
        raise ContentError(f"{where}: {len(opts)} opcji (dozwolone {n[0]}–{n[1]})")
    if len({norm(o) for o in opts}) != len(opts) or any(not str(o).strip() for o in opts):
        raise ContentError(f"{where}: powtórzone lub puste opcje {opts}")


def need_why(e, where):
    if len(e.get("why", "").strip()) < 15:
        raise ContentError(f"{where}: brak wyjaśnienia (why)")


def check_ex(e, where, ctx=None):
    t = e["t"]
    if t == "karta":
        if len(e["text"]) < 40:
            raise ContentError(f"{where}: za krótka karta")
        if e.get("g"):
            check_graph(e["g"], where)
    elif t == "wybor":
        check_opts(e["opts"], where)
        need_why(e, where)
    elif t == "multi":
        check_opts(e["opts"], where, (4, 4))
        if not e["ok"] or any(i not in range(4) for i in e["ok"]) or len(set(e["ok"])) != len(e["ok"]):
            raise ContentError(f"{where}: zły klucz {e['ok']}")
        need_why(e, where)
    elif t == "pf":
        need_why(e, where)
    elif t == "luka":
        if e["text"].count("___") != 1:
            raise ContentError(f"{where}: luka musi mieć dokładnie jedno ___")
        check_opts(e["opts"], where)
        need_why(e, where)
    elif t == "lancuch":
        if len(e["steps"]) < 3 or len({norm(s) for s in e["steps"]}) != len(e["steps"]):
            raise ContentError(f"{where}: łańcuch musi mieć ≥ 3 różne kroki")
    elif t == "kategorie":
        if len(e["cats"]) < 2 or len(e["items"]) < 4 or {c for _, c in e["items"]} != set(range(len(e["cats"]))):
            raise ContentError(f"{where}: kategorie – ≥ 2 kategorie, ≥ 4 elementy, każda kategoria użyta")
        if len({norm(x) for x, _ in e["items"]}) != len(e["items"]):
            raise ContentError(f"{where}: powtórzone elementy kategorii")
    elif t == "liczba":
        a = e["a"]
        tol = e["tol"] if e["tol"] is not None else max(abs(a) * 0.005, 0.01)
        e["tol"] = tol
        try:
            v = eval(e["calc"], {"__builtins__": {}}, {"math": math, "round": round, "abs": abs, "min": min, "max": max, "sum": sum})
        except Exception as ex:  # noqa: BLE001
            raise ContentError(f"{where}: błąd w calc {e['calc']!r}: {ex}")
        if abs(v - a) > tol + 1e-9:
            raise ContentError(f"{where}: calc = {v} ≠ odpowiedź {a} (tolerancja {tol})")
        if not e["steps"]:
            raise ContentError(f"{where}: brak rozwiązania krok po kroku")
    elif t == "wykres":
        check_graph(e["g"], where)
        if not e["g"]["shift"]:
            raise ContentError(f"{where}: wykres bez przesunięcia")
        check_opts(e["opts"], where)
        need_why(e, where)
    elif t == "przypadek":
        if len(e["ctx"]) < 80 or len(e["ex"]) < 2:
            raise ContentError(f"{where}: przypadek – tekst ≥ 80 znaków i ≥ 2 pytania")
        for i, x in enumerate(e["ex"]):
            if x["t"] in ("karta", "przypadek"):
                raise ContentError(f"{where}.{i}: w przypadku tylko pytania")
            check_ex(x, f"{where}.{i}")
    else:
        raise ContentError(f"{where}: nieznany typ {t}")


def flatten(sub_no, exs):
    """Rozwija przypadki w listę ćwiczeń z kontekstem i nadaje typ do statystyk."""
    out = []
    for e in exs:
        if e["t"] == "przypadek":
            for x in e["ex"]:
                out.append({**x, "ctx": e["ctx"], "stat": "przypadek"})
            continue
        e = dict(e)
        if e["t"] in ("wybor", "multi", "pf"):
            e["stat"] = STAT_BY_SUB[sub_no]
        e.pop("calc", None)
        out.append(e)
    for e in out:
        e.pop("calc", None)
        for k in [k for k, v in e.items() if v is None]:
            del e[k]
    return out


def load_unit(path):
    spec = importlib.util.spec_from_file_location("zrozum_" + os.path.basename(path)[:-3].replace("-", "_"), path)
    m = importlib.util.module_from_spec(spec)
    m.__dict__.update(DSL)
    spec.loader.exec_module(m)
    return m.LESSONS


def build(course, root, out_dir, min_lessons=None):
    items = course["items"]
    by_title = {}
    for iid, it in items.items():
        by_title.setdefault(norm(it["t"]), iid)
        by_title.setdefault(norm(it["s"]), iid)
    units = {u["id"]: u for u in course["units"]}

    bank = []
    for f in glob.glob(os.path.join(root, "data/questions/*.json")) + [os.path.join(root, "data/slownik/manual.json")]:
        bank += json.load(open(f))
    bank_sig = [(set(w for w in norm(q["question"] + " " + " ".join(q["options"])).split() if len(w) > 3), q["question"]) for q in bank]

    content, errors, warnings, report = {}, [], [], []
    for path in sorted(glob.glob(os.path.join(SRC, "*.py"))):
        uid = os.path.basename(path)[:-3]
        if uid not in units:
            errors.append(f"{uid}: nie ma takiego działu")
            continue
        unit = units[uid]
        try:
            lessons = load_unit(path)
        except Exception as ex:  # noqa: BLE001
            errors.append(f"{uid}: {type(ex).__name__}: {ex}")
            continue
        zids = []
        for L_ in lessons:
            lid = f"{uid}-z{L_['no']}"
            where = lid
            try:
                if lid in course["lessons"] or lid in content:
                    raise ContentError(f"{where}: powtórzony numer lekcji")
                if not L_["src"] or any(not s["u"].startswith("https://") or not re.match(r"\d{4}-\d{2}-\d{2}$", s["d"]) for s in L_["src"]):
                    raise ContentError(f"{where}: źródła muszą mieć adres https i datę RRRR-MM-DD")
                refs = []
                for r in L_["refs"]:
                    iid = by_title.get(norm(r))
                    if not iid:
                        raise ContentError(f"{where}: brak hasła „{r}” w słowniku")
                    refs.append(iid)
                subs = []
                for s, exs in enumerate(L_["subs"]):
                    for i, e in enumerate(exs):
                        check_ex(e, f"{where}/{s + 1}.{i}")
                    flat = flatten(s, exs)
                    # powtórzone karty lub pytania w jednej pod-lekcji (np. przypadkowo zdublowany fragment)
                    keys = [norm(e.get("title") or e.get("q") or e.get("s") or e.get("text")) for e in flat]
                    dup = {k for k in keys if keys.count(k) > 1}
                    if dup:
                        raise ContentError(f"{where}/{s + 1}: powtórzone elementy: {sorted(dup)[:2]}")
                    graded = [e for e in flat if e["t"] != "karta"]
                    if s == 0 and (len(flat) - len(graded) < 4 or len(graded) < 2):
                        raise ContentError(f"{where}/1: wyjaśnienie wymaga ≥ 4 kart i ≥ 2 pytań sprawdzających")
                    if s > 0 and len(graded) < MIN_EX:
                        raise ContentError(f"{where}/{s + 1}: {len(graded)} ćwiczeń (min. {MIN_EX})")
                    subs.append(flat)
            except ContentError as ex:
                errors.append(str(ex))
                continue
            # podobieństwo do pytań z baz – tylko ostrzeżenie
            for e in (x for sub in subs for x in sub if x["t"] in ("wybor", "multi")):
                w = set(x for x in norm(e["q"] + " " + " ".join(e["opts"])).split() if len(x) > 3)
                for bw, bq in bank_sig:
                    if len(w & bw) >= 5 and len(w & bw) / max(1, len(w | bw)) >= 0.6:
                        warnings.append(f"{lid}: podobne do pytania z bazy: {bq[:90]}")
            pid = "z" + hashlib.md5(lid.encode()).hexdigest()[:9]
            items[pid] = {"id": pid, "t": L_["title"], "s": L_["title"], "d": L_["goal"], "w": None, "p": None, "u": None,
                          "kind": "zrozumienie", "topic": unit["topic"], "sec": 0, "al": [], "k": [], "m": L_["goal"]}
            course["lessons"][lid] = {"id": lid, "unit": uid, "topic": unit["topic"], "kind": "zrozumienie", "no": L_["no"],
                                      "title": L_["title"], "items": [pid], "questions": [], "type": "zrozum"}
            content[lid] = {"goal": L_["goal"], "refs": refs, "sources": L_["src"], "subs": subs}
            zids.append(lid)
        zids.sort(key=lambda x: int(x.rsplit("-z", 1)[1]))
        # lekcje „Zrozumienie” wplecione w ścieżkę działu: po każdej lekcji haseł jedna lekcja zrozumienia
        terms = [l for l in unit["lessons"] if l not in zids]
        merged = []
        for i in range(max(len(terms), len(zids))):
            merged += terms[i:i + 1] + zids[i:i + 1]
        unit["lessons"] = merged
        unit["zcount"] = len(zids)
        report.append((uid, len(zids), sum(len([e for e in content[z]["subs"][s] if e["t"] != "karta"]) for z in zids for s in range(4))))

    if errors:
        raise SystemExit("BŁĘDY w lekcjach Zrozumienie:\n  " + "\n  ".join(errors))
    if not any(k["id"] == "zrozumienie" for k in course["kinds"]):
        course["kinds"].append({"id": "zrozumienie", "title": "Zrozumienie"})
    json.dump(content, open(os.path.join(out_dir, "zrozum.json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"Zrozumienie: {len(content)} lekcji w {len(report)} działach, "
          f"{sum(r[2] for r in report)} ćwiczeń ocenianych, "
          f"{sum(1 for c in content.values() for s in c['subs'] for e in s if e['t'] == 'karta')} kart")
    for w in warnings[:30]:
        print("  uwaga:", w)
    missing = [u["id"] for u in course["units"] if not u.get("zcount")]
    if missing:
        print(f"  działy bez lekcji Zrozumienie ({len(missing)}): {', '.join(missing[:12])}{' …' if len(missing) > 12 else ''}")
    return content
