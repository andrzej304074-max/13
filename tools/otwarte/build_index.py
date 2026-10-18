# -*- coding: utf-8 -*-
"""Generuje data/otwarte/index.ts z plików data/otwarte/sets/*.json (zadania i eseje z kluczy OWE).

Użycie: python3 -I tools/otwarte/build_index.py
"""
import glob, os
root = os.path.join(os.path.dirname(__file__), "..", "..", "data", "otwarte")
files = sorted(os.path.basename(f)[:-5] for f in glob.glob(os.path.join(root, "sets", "*.json")))
ident = lambda n: "s_" + n.replace("-", "_")
lines = ["// Wygenerowane przez tools/otwarte/build_index.py – nie edytować ręcznie.", 'import type { OpenSet } from "@/lib/otwarte-core";']
lines += [f'import {ident(n)} from "./sets/{n}.json";' for n in files]
lines += ["", "export const SETS = [" + ", ".join(ident(n) for n in files) + "] as unknown as OpenSet[];", ""]
open(os.path.join(root, "index.ts"), "w").write("\n".join(lines))
print(f"zestawów: {len(files)}")
