# -*- coding: utf-8 -*-
"""Wstawia do słownika przykłady i uzupełnienia definicji (jednorazowo, idempotentnie):
- przyklady_s15.py (P: tytuł → przykład) – pole p w s15_demografia.py;
- przyklady_ogolne.py (D: tytuł → (zdanie do definicji, przykład)) – działy s01–s08.
Użycie: python3 -I tools/slownik/glossary/apply_examples.py"""
import ast, glob, importlib.util, json, os

HERE = os.path.dirname(os.path.abspath(__file__))


def load(name):
    spec = importlib.util.spec_from_file_location(name, os.path.join(HERE, name + ".py"))
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


P = load("przyklady_s15").P
D = load("przyklady_ogolne").D
todo = {**{t: (None, p) for t, p in P.items()}, **D}
done = set()
for path in sorted(glob.glob(os.path.join(HERE, "s[0-9][0-9]_*.py"))):
    lines = open(path, encoding="utf-8").read().split("\n")
    changed = False
    for n, line in enumerate(lines):
        if not line.startswith((' ("', " ('")) or not line.rstrip().endswith("),"):
            continue
        t, d, x = ast.literal_eval(line.strip()[:-1])
        if t not in todo:
            continue
        add, ex = todo[t]
        if add and add not in d:
            d = d.rstrip() + " " + add
        if ex and not x.get("p"):
            x = {"p": ex, **x}
        new = " (" + ", ".join(json.dumps(v, ensure_ascii=False) for v in (t, d, x)) + "),"
        if new != line:
            lines[n], changed = new, True
        done.add(t)
    if changed:
        open(path, "w", encoding="utf-8").write("\n".join(lines))
print("hasła:", len(done), "nieznalezione:", sorted(set(todo) - done))
