# -*- coding: utf-8 -*-
"""Sprawdzenie Prognozy XL (data/otwarte/sets/prognoza-xl-*.json) i raport tools/otwarte/PROGNOZA.md.

Niezależnie od build_prognoza.py:
- przelicza każdy wynik liczbowy z `vars` i `lets` zadania (własny, bezpieczny ewaluator) i porównuje z kluczem (`value`),
  sprawdza też, czy wynik mieści się w tolerancji, a tolerancja nie jest zbyt szeroka (≤ 2% wartości);
- sumy punktów: zadanie 15 pkt, esej 25 pkt (teoria 15 + praktyka 10), każdy podpunkt ma rozwiązanie;
- tematy esejów unikalne i różne od tematów z kluczy OWE (podobieństwo tekstu < 0,8);
- podział: etapy (17/17/16), co najmniej 25 esejów i 25 zadań dotyczących hasła przewodniego, każdy esej ma podpowiedzi (struktura, błędy, dane).

Użycie: python3 -I tools/otwarte/sprawdz_prognoze.py [--bez-raportu]
"""
import ast, difflib, glob, json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SETS = os.path.join(ROOT, "data", "otwarte", "sets")
FUN = {"sqrt": math.sqrt, "ln": math.log, "log10": math.log10, "exp": math.exp, "abs": abs, "min": min, "max": max}
OPS = {ast.Add: lambda a, b: a + b, ast.Sub: lambda a, b: a - b, ast.Mult: lambda a, b: a * b, ast.Div: lambda a, b: a / b, ast.Pow: lambda a, b: a ** b}
TOPIC = {"mikro": "Mikroekonomia", "makro": "Makroekonomia", "polityka": "Polityka gospodarcza", "finanse": "Podstawy finansów",
         "firma": "Finanse przedsiębiorstw", "zarzadzanie": "Zarządzanie", "demografia": "Demografia"}
STAGE = {"s": "szkolny", "o": "okręgowy", "c": "centralny"}


def calc(expr, env):
    def go(n):
        if isinstance(n, ast.Expression): return go(n.body)
        if isinstance(n, ast.Constant) and type(n.value) in (int, float): return float(n.value)
        if isinstance(n, ast.Name): return env[n.id]
        if isinstance(n, ast.BinOp) and type(n.op) in OPS: return OPS[type(n.op)](go(n.left), go(n.right))
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, (ast.USub, ast.UAdd)): return -go(n.operand) if isinstance(n.op, ast.USub) else go(n.operand)
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in FUN and not n.keywords:
            return float(FUN[n.func.id](*[go(a) for a in n.args]))
        raise ValueError("niedozwolony element wyrażenia")
    return go(ast.parse(expr, mode="eval"))


def norm(t):
    return re.sub(r"[^a-ząćęłńóśźż0-9 ]", "", t.lower())


def main():
    err, sets, owe_titles = [], [], []
    for f in sorted(glob.glob(os.path.join(SETS, "*.json"))):
        s = json.load(open(f, encoding="utf-8"))
        if s.get("src") == "prognoza": sets.append(s)
        else: owe_titles += [t["title"] for e in s["essays"] for t in e["topics"]]
    n_ans = 0
    for s in sets:
        sid = s["set"]
        if s["ed"] != 40 or not re.fullmatch(r"prognoza-xl-\d\d", sid): err.append(f"{sid}: edycja lub identyfikator")
        t = s["task"]
        if not t: err.append(f"{sid}: brak zadania"); continue
        if not t.get("own"): err.append(f"{sid}: zadanie bez own")
        if sum(p["pts"] for p in t["parts"]) != 15 or t["pts"] != 15: err.append(f"{sid}: zadanie ≠ 15 pkt")
        env = dict(t.get("vars", {}))
        try:
            for k, e in t.get("lets", []): env[k] = calc(e, env)
        except Exception as ex:  # noqa: BLE001
            err.append(f"{sid}: obliczenia: {ex}")
            continue
        for p in t["parts"]:
            if not p["solution"]: err.append(f"{sid} {p['label']}: brak rozwiązania")
            for a in p["answers"]:
                n_ans += 1
                if "calc" not in a: err.append(f"{sid} {p['label']}: wynik bez calc"); continue
                v = calc(a["calc"], env)
                tol = a.get("tol", max(0.01, abs(a["value"]) * 0.005))
                if abs(v - a["value"]) > 1e-3 * max(1, abs(v)): err.append(f"{sid} {p['label']} {a['label']}: klucz {a['value']} ≠ przeliczone {v:.4f}")
                if abs(v - a["value"]) > tol: err.append(f"{sid} {p['label']} {a['label']}: przeliczony wynik poza tolerancją")
                if tol > max(0.02 * abs(v), 0.05) and tol > 1: err.append(f"{sid} {p['label']} {a['label']}: zbyt szeroka tolerancja {tol}")
        for e in s["essays"]:
            if not e.get("own") or e["pts"] != 25: err.append(f"{sid}: esej bez own lub ≠ 25 pkt")
            want = 2 if s["stage"] == "s" else 1
            if len(e["topics"]) != want: err.append(f"{sid}: liczba tematów {len(e['topics'])} ≠ {want}")
            for tp in e["topics"]:
                if [x["pts"] for x in tp["schema"]] != [15, 10]: err.append(f"{sid}: schemat ≠ teoria 15 + praktyka 10")
                if any(len(x["points"]) < 3 for x in tp["schema"]): err.append(f"{sid}: część schematu ma mniej niż 3 punkty")
                h = tp.get("hints", {})
                if not (h.get("s") and h.get("b") and h.get("d")): err.append(f"{sid}: „{tp['title'][:40]}” – brak podpowiedzi")
                if any(not re.search(r"\([^()]{2,}\)", d) for d in h.get("d", [])): err.append(f"{sid}: dane bez źródła w nawiasie")
    titles = [(s["set"], tp["title"]) for s in sets for e in s["essays"] for tp in e["topics"]]
    seen = {}
    for sid, ti in titles:
        k = norm(ti)
        if k in seen: err.append(f"{sid}: temat powtarza {seen[k]}")
        seen[k] = sid
        best = max((difflib.SequenceMatcher(None, k, norm(o)).ratio(), o) for o in owe_titles)
        if best[0] >= 0.8: err.append(f"{sid}: temat zbyt podobny do OWE: „{best[1][:60]}”")
    by_stage = {st: sum(1 for s in sets if s["stage"] == st) for st in "soc"}
    if by_stage != {"s": 17, "o": 17, "c": 16}: err.append(f"podział etapów {by_stage}")
    th_e = sum(1 for s in sets for e in s["essays"] if e.get("th"))
    th_t = sum(1 for s in sets if s["task"] and s["task"].get("th"))
    if len(sets) != 50: err.append(f"zestawów: {len(sets)} ≠ 50")
    if th_e < 25 or th_t < 25: err.append(f"hasło przewodnie: eseje {th_e}, zadania {th_t} (min. 25)")
    for x in err: print("BŁĄD:", x, file=sys.stderr)
    print(f"zestawów: {len(sets)}, wyników liczbowych: {n_ans}, eseje z hasłem: {th_e}, zadania z hasłem: {th_t}, błędów: {len(err)}")
    if "--bez-raportu" not in sys.argv: report(sets, n_ans, th_e, th_t, len(owe_titles))
    sys.exit(1 if err else 0)


def report(sets, n_ans, th_e, th_t, n_owe):
    L = ["# Prognoza XL – własne eseje i zadania na XL OWE (2026/2027)", "",
         "Plik generuje `python3 -I tools/otwarte/sprawdz_prognoze.py` (sprawdzenie + raport). Źródła treści: `tools/otwarte/prognoza/*.txt`,",
         "zestawy JSON: `python3 -I tools/otwarte/build_prognoza.py`. W aplikacji – na listach Zadań i Esejów z etykietą „🔮 Prognoza XL (własne)”,",
         "z filtrem źródła i osobnymi wierszami w statystykach.", "",
         "## Co sprawdza skrypt", "",
         f"- każdy z {n_ans} wyników liczbowych przeliczony niezależnie z danych zadania (`vars`) i wartości pośrednich (`lets`), zgodność z kluczem i tolerancją;",
         "- sumy punktów (zadanie 15, esej 25 = teoria 15 + praktyka 10), rozwiązanie w każdym podpunkcie;",
         f"- tematy esejów: bez powtórzeń i różne od {n_owe} tematów z kluczy OWE (podobieństwo < 0,8);",
         "- podpowiedzi do każdego tematu (plan, typowe błędy, dane ze źródłem w nawiasie), podział etapów 17/17/16.", "",
         f"Hasło przewodnie XL („Gospodarka wobec wyzwań demograficznych”): **{th_e} esejów** i **{th_t} zadań** z 50.", "",
         "Dane oznaczone w zadaniach jako umowne służą ćwiczeniom; liczby w podpowiedziach do esejów są zaokrąglone – przed użyciem warto sprawdzić najnowsze wydanie źródła.", ""]
    for st in "soc":
        L += [f"## Etap {STAGE[st]}", "", "| Zestaw | Esej | Zadanie | Dział | Hasło |", "|---|---|---|---|---|"]
        for s in [x for x in sets if x["stage"] == st]:
            e = s["essays"][0]
            ti = " / ".join(t["title"] for t in e["topics"])
            task = s["task"]["title"].split(" – ", 1)[-1]
            th = "🎯" if e.get("th") or s["task"].get("th") else ""
            L.append(f"| {s['set'][-2:]} | {ti} | {task} | {TOPIC[e['topic']]} / {TOPIC[s['task']['topic']]} | {th} |")
        L.append("")
    open(os.path.join(HERE, "PROGNOZA.md"), "w", encoding="utf-8").write("\n".join(L))


if __name__ == "__main__":
    main()
