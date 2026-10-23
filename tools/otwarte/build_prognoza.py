# -*- coding: utf-8 -*-
"""Prognoza XL – własne eseje i zadania na XL OWE (2026/2027): tools/otwarte/prognoza/*.txt → data/otwarte/sets/prognoza-xl-NN.json.

Każdy zestaw prognoza-xl-NN to jeden esej i jedno zadanie tego samego etapu (NN 01–17 – szkolny, 18–34 – okręgowy, 35–50 – centralny),
`ed: 40`, `src: "prognoza"`, `own: true`.

Format esejów (eseje.txt):
    === 01 | demografia | th            (numer zestawu, dział, „th” – dotyczy hasła przewodniego)
    T: Temat eseju                      (w etapie szkolnym dwa tematy do wyboru – dwa bloki T:)
    ## Część teoretyczna | 15
    - punkt schematu
    ## Część praktyczna | 10
    - punkt schematu
    > struktura: wstęp …; rozwinięcie …; zakończenie …   (podpowiedzi do tematu: struktura, błędy, dane ze źródłami)
    > błędy: …; …
    > dane: …; …

Format zadań (zadania.txt):
    === 01 | demografia | th | Tytuł robocze (tytuł zadania wynika z etapu)
    vars: a=1; b=2,5                    (dane – liczby z przecinkiem lub kropką)
    let: c = a*b                        (pośrednie wartości)
    P: akapit wstępu, w tekście {{a}} lub {{c:1}} (liczba miejsc po przecinku)
    H: Kolumna | Kolumna                (nagłówek tabeli), R: komórka | komórka (wiersz)
    F: wzór w czcionce wzorów
    L: element listy
    --- a | 4                           (podpunkt, punkty)
    Q: polecenie
    A: Etykieta wyniku | nazwa = wyrażenie | jednostka | tol=0,1     (wynik sprawdzany automatycznie; jednostka i tol opcjonalne)
    let:, S: (akapit rozwiązania), SF: (wzór w rozwiązaniu), SL: (lista w rozwiązaniu)
Wyrażenia: liczby, nazwy, + − * / **, nawiasy, sqrt, ln, log10, exp, abs, min, max, round. Każdy wynik ma zapisane `calc`
(wyrażenie) i `vars` zadania – tools/otwarte/sprawdz_prognoze.py przelicza je niezależnie.

Użycie: python3 -I tools/otwarte/build_prognoza.py
"""
import ast, json, math, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
SRC = os.path.join(HERE, "prognoza")
OUT = os.path.join(ROOT, "data", "otwarte", "sets")
TOPICS = {"mikro", "makro", "polityka", "finanse", "firma", "zarzadzanie", "demografia"}
TASK_TITLE = {"s": "Zadanie z podstaw ekonomii", "o": "Zadanie z analizy finansowej", "c": "Zadanie analityczne"}
errors = []

FUN = {"sqrt": math.sqrt, "ln": math.log, "log10": math.log10, "exp": math.exp, "abs": abs, "min": min, "max": max, "round": round}


def ev(expr, env):
    """Bezpieczne wyliczenie wyrażenia arytmetycznego."""
    def go(n):
        if isinstance(n, ast.Expression): return go(n.body)
        if isinstance(n, ast.Constant) and isinstance(n.value, (int, float)): return float(n.value)
        if isinstance(n, ast.Name):
            if n.id not in env: raise ValueError(f"nieznana nazwa {n.id}")
            return env[n.id]
        if isinstance(n, ast.BinOp):
            a, b = go(n.left), go(n.right)
            if isinstance(n.op, ast.Add): return a + b
            if isinstance(n.op, ast.Sub): return a - b
            if isinstance(n.op, ast.Mult): return a * b
            if isinstance(n.op, ast.Div): return a / b
            if isinstance(n.op, ast.Pow): return a ** b
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.USub): return -go(n.operand)
        if isinstance(n, ast.UnaryOp) and isinstance(n.op, ast.UAdd): return go(n.operand)
        if isinstance(n, ast.Call) and isinstance(n.func, ast.Name) and n.func.id in FUN:
            args = [go(a) for a in n.args]
            return float(FUN[n.func.id](*args)) if n.func.id != "round" else float(round(args[0], int(args[1]) if len(args) > 1 else 0))
        raise ValueError(f"niedozwolone wyrażenie: {ast.dump(n)[:60]}")
    return go(ast.parse(expr.replace("−", "-").replace(",", "."), mode="eval"))


def num(s):
    return float(s.strip().replace(" ", "").replace(",", ".").replace("−", "-"))


def fmt(v, d=None):
    """Liczba po polsku: przecinek dziesiętny, spacja niełamliwa co trzy cyfry."""
    if d is None:
        d = 0 if abs(v - round(v)) < 1e-9 else (2 if abs(v) < 1000 else 1)
    s = f"{v:,.{d}f}".replace(",", " ").replace(".", ",")
    return s.replace("-", "−")


def fill(text, env, where):
    def rep(m):
        name, d = m.group(1), m.group(2)
        if name not in env:
            errors.append(f"{where}: {{{{{name}}}}} – brak wartości"); return "?"
        return fmt(env[name], int(d) if d else None)
    out = re.sub(r"\{\{(\w+)(?::(\d))?\}\}", rep, text)
    if "{{" in out or "}}" in out: errors.append(f"{where}: niepoprawny znacznik w „{text[:40]}”")
    return out


def blocks_add(blocks, kind, text, env, where):
    if kind in ("P", "S"): blocks.append({"t": "p", "x": fill(text, env, where)})
    elif kind in ("F", "SF"): blocks.append({"t": "f", "x": fill(text, env, where)})
    elif kind in ("L", "SL"):
        if blocks and blocks[-1]["t"] == "ul": blocks[-1]["items"].append(fill(text, env, where))
        else: blocks.append({"t": "ul", "items": [fill(text, env, where)]})
    elif kind == "H": blocks.append({"t": "table", "head": [fill(c.strip(), env, where) for c in text.split("|")], "rows": []})
    elif kind == "R":
        if not blocks or blocks[-1]["t"] != "table": blocks.append({"t": "table", "rows": []})
        blocks[-1]["rows"].append([fill(c.strip(), env, where) for c in text.split("|")])


def head(line, where):
    parts = [p.strip() for p in line[3:].split("|")]
    n = int(parts[0])
    if not 1 <= n <= 50: errors.append(f"{where}: numer zestawu {n} poza 1–50")
    if parts[1] not in TOPICS: errors.append(f"{where}: nieznany dział {parts[1]}")
    return n, parts[1], "th" in parts[2:3], parts


def stage_of(n):
    return "s" if n <= 17 else "o" if n <= 34 else "c"


def parse_essays(path):
    out = {}
    cur = topic = sec = None
    for i, raw in enumerate(open(path, encoding="utf-8"), 1):
        line = raw.rstrip("\n"); where = f"{os.path.basename(path)}:{i}"
        if not line.strip() or line.startswith("#!"): continue
        if line.startswith("=== "):
            n, t, th, _ = head(line, where)
            cur = {"id": f"prognoza-xl-{n:02d}-esej", "kind": "ogolne", "own": True, "pts": 25, "topic": t, "th": th, "topics": []}
            if n in out: errors.append(f"{where}: esej {n} drugi raz")
            out[n] = cur; topic = sec = None
        elif line.startswith("T: "):
            topic = {"title": line[3:].strip(), "schema": [], "hints": {}}; cur["topics"].append(topic); sec = None
        elif line.startswith("## "):
            title, pts = [p.strip() for p in line[3:].split("|")]
            sec = {"title": title, "pts": int(pts), "points": []}; topic["schema"].append(sec)
        elif line.startswith("- "):
            sec["points"].append(line[2:].strip())
        elif line.startswith("> "):
            key, _, val = line[2:].partition(":")
            k = {"struktura": "s", "błędy": "b", "dane": "d"}.get(key.strip())
            if not k: errors.append(f"{where}: nieznana podpowiedź {key}"); continue
            topic["hints"][k] = [v.strip() for v in val.split(";") if v.strip()]
        else:
            errors.append(f"{where}: nierozpoznana linia: {line[:50]}")
    return out


def parse_tasks(path):
    out = {}
    cur = part = None
    env = {}
    for i, raw in enumerate(open(path, encoding="utf-8"), 1):
        line = raw.rstrip("\n"); where = f"{os.path.basename(path)}:{i}"
        if not line.strip() or line.startswith("#!"): continue
        try:
            if line.startswith("=== "):
                n, t, th, parts = head(line, where)
                env = {}
                cur = {"id": f"prognoza-xl-{n:02d}-zadanie", "title": TASK_TITLE[stage_of(n)], "pts": 0, "topic": t, "own": True, "th": th,
                       "name": parts[3] if len(parts) > 3 else "", "vars": {}, "lets": [], "intro": [], "parts": []}
                if n in out: errors.append(f"{where}: zadanie {n} drugi raz")
                out[n] = cur; part = None
            elif line.startswith("vars: "):
                for kv in line[6:].split(";"):
                    if not kv.strip(): continue
                    k, v = kv.split("="); k = k.strip(); env[k] = num(v); cur["vars"][k] = env[k]
            elif line.startswith("let: "):
                k, e = line[5:].split("=", 1); k = k.strip(); env[k] = ev(e.strip(), env); cur["lets"].append([k, e.strip()])
            elif line.startswith("--- "):
                lab, pts = [p.strip() for p in line[4:].split("|")]
                part = {"label": lab, "pts": int(pts), "prompt": "", "answers": [], "solution": []}; cur["parts"].append(part)
            elif line.startswith("Q: "):
                part["prompt"] = (part["prompt"] + " " + fill(line[3:].strip(), env, where)).strip()
            elif line.startswith("A: "):
                f = [p.strip() for p in line[3:].split("|")]
                k, e = f[1].split("=", 1); k = k.strip(); env[k] = ev(e.strip(), env); cur["lets"].append([k, e.strip()])
                a = {"label": f[0], "value": round(env[k], 4), "calc": e.strip()}
                for extra in f[2:]:
                    if extra.startswith("tol="): a["tol"] = num(extra[4:])
                    elif extra: a["unit"] = extra
                part["answers"].append(a)
            else:
                kind, _, text = line.partition(": ")
                if kind in ("P", "F", "L", "H", "R") and part is None: blocks_add(cur["intro"], kind, text, env, where)
                elif kind in ("S", "SF", "SL") and part is not None: blocks_add(part["solution"], kind, text, env, where)
                else: errors.append(f"{where}: nierozpoznana linia: {line[:50]}")
        except Exception as ex:  # noqa: BLE001 – komunikat z numerem linii
            errors.append(f"{where}: {ex}")
    for t in out.values():
        t["pts"] = sum(p["pts"] for p in t["parts"])
    return out


def main():
    essays, tasks = {}, {}
    for f in sorted(os.listdir(SRC)):
        p = os.path.join(SRC, f)
        if f.startswith("eseje"): essays.update(parse_essays(p))
        elif f.startswith("zadania"): tasks.update(parse_tasks(p))
    for name in os.listdir(OUT):
        if name.startswith("prognoza-xl-"): os.remove(os.path.join(OUT, name))
    n_sets = 0
    for n in sorted(set(essays) | set(tasks)):
        st = stage_of(n)
        e, t = essays.get(n), tasks.get(n)
        if e and st == "s" and len(e["topics"]) != 2: errors.append(f"esej {n}: etap szkolny – dwa tematy do wyboru")
        if e and st != "s" and len(e["topics"]) != 1: errors.append(f"esej {n}: etap {st} – jeden temat")
        if t:
            name = t.pop("name")
            if name: t["title"] += " – " + name
            if t["pts"] != 15: errors.append(f"zadanie {n}: suma punktów {t['pts']} ≠ 15")
        s = {"set": f"prognoza-xl-{n:02d}", "ed": 40, "stage": st, "src": "prognoza", "essays": [e] if e else [], "task": t}
        json.dump(s, open(os.path.join(OUT, f"prognoza-xl-{n:02d}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        n_sets += 1
    for x in errors: print("BŁĄD:", x, file=sys.stderr)
    print(f"zestawów: {n_sets}, esejów: {len(essays)}, zadań: {len(tasks)}")
    if errors: sys.exit(1)


if __name__ == "__main__":
    main()
