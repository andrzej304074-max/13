import glob, importlib.util, re, difflib, itertools
def load(p):
    s = importlib.util.spec_from_file_location("m", p); m = importlib.util.module_from_spec(s); s.loader.exec_module(m); return m
items = [(f, t) for f in sorted(glob.glob("s[0-9]*.py")) if not getattr(load(f), "NO_INDEX", False) for t, d, x in load(f).E]
norm = lambda t: re.sub(r"\s+", " ", re.sub(r"[^a-ząćęłńóśźż ]", " ", re.sub(r"\(.*?\)", "", t.lower()))).strip()
stem = lambda t: " ".join(w[:6] for w in norm(t).split() if len(w) > 2)
pairs = []
for (f1, a), (f2, b) in itertools.combinations(items, 2):
    na, nb = stem(a), stem(b)
    r = difflib.SequenceMatcher(None, na, nb).ratio()
    if na == nb or r >= 0.86: pairs.append((round(r, 2), f1, a, f2, b))
for p in sorted(pairs, reverse=True): print(p)
print(len(items), "haseł,", len(pairs), "podejrzanych par")
