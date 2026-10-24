// I2: skala XP – test 2/1/0 i raz dziennie za to samo pytanie, kurs 2 za poprawną + premia raz dziennie za pod-lekcję,
// rozdział Podręcznika dopiero po 2 min, zadanie dopiero przy ≥ 30%, cele 30/50/80/120
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const p = await (await browser.newContext()).newPage();
await p.goto(`${B}/konto/logowanie`);
await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
const cel = async () => (await p.request.get(`${B}/api/cel`)).json();
const by = async (k) => (await cel()).today.by[k] ?? 0;
const post = async (u, d) => (await p.request.post(`${B}${u}`, { data: d })).json();

// 1. test: pierwsza odpowiedź na nowe pytanie – 0 lub 2 XP; to samo pytanie w drugim teście tego dnia – 0
const t1 = await post("/api/tests", { sources: ["owe"], type: "single", count: "endless" });
const q = t1.questions[0];
const x0 = await by("testy");
const r1 = await post(`/api/tests/${t1.id}/answer`, { questionId: q.id, selected: [0] });
await p.waitForTimeout(300);
const x1 = await by("testy");
check(x1 - x0 === (r1.points >= 2 ? 2 : 0) || x1 - x0 === 0, `pierwsza odpowiedź: +${x1 - x0} (punkty ${r1.points})`);
await post(`/api/tests/${t1.id}/finish`, {});
// drugi test tego dnia z tym samym pytaniem (podstawione w bazie testowej na pierwsze miejsce)
const t2 = await post("/api/tests", { sources: ["owe"], type: "single", count: 30 });
execSync(`psql -h localhost -U postgres -d owe -q -c "UPDATE tests SET question_ids = ARRAY['${q.id}'] || array_remove(question_ids, '${q.id}') WHERE id = '${t2.id}'"`, { env: { ...process.env, PGPASSWORD: "dev" } });
const before = await by("testy");
await post(`/api/tests/${t2.id}/answer`, { questionId: q.id, selected: r1.correct ?? [0] });
await p.waitForTimeout(300);
check(await by("testy") === before, "to samo pytanie drugi raz tego dnia – 0 XP");
const q2 = (await (await p.request.get(`${B}/api/tests/${t2.id}`)).json()).questions[1];
const r2 = await post(`/api/tests/${t2.id}/answer`, { questionId: q2.id, selected: [0] });
await p.waitForTimeout(300);
const d2 = await by("testy") - before;
check(d2 === (r2.points >= 2 ? 2 : 0) || d2 === 0, `nowe pytanie w tym samym teście: +${d2}`);
await post(`/api/tests/${t2.id}/finish`, {});

// 2. kurs: 3 poprawne → 6 + 5 + 3 = 14; ta sama pod-lekcja drugi raz dziś → tylko 6
const hasla = await (await p.request.get(`${B}/api/dane/hasla`)).json();
const item = hasla.rows[0].id;
const ans = Array.from({ length: 3 }, () => ({ item, exercise: "wybor", correct: true, ms: 1000 }));
const lesson = "mikro-podstawy-2";
const k0 = await by("kurs");
const s1 = await post("/api/nauka/sessions", { lesson, sub: 2 });
const f1 = await post(`/api/nauka/sessions/${s1.id}/finish`, { answers: ans });
const s2 = await post("/api/nauka/sessions", { lesson, sub: 2 });
const f2 = await post(`/api/nauka/sessions/${s2.id}/finish`, { answers: ans });
check(f2.xp === 6 && (f1.xp === 14 || f1.xp === 6), `kurs: pierwsza ${f1.xp}, powtórzona ${f2.xp} XP`);
await p.waitForTimeout(300);
check(await by("kurs") - k0 === f1.xp + f2.xp, `kurs w celu dnia: +${await by("kurs") - k0}`);

// 3. Podręcznik: rozdział krócej niż 2 min – zaliczony, ale bez XP
const c0 = await by("czytanie");
const rd = await post("/api/podrecznik/przeczytane", { ref: "mikro-podstawy-3", ms: 30_000 });
await p.waitForTimeout(300);
check(await by("czytanie") === c0, `rozdział po 30 s – bez XP (zaliczony: ${rd.credited})`);

// 4. zadanie z wynikiem 0 – bez XP
const z0 = await by("zadania");
await post("/api/otwarte/owe-36-okregowe-zadanie/sprawdz", { answers: {} });
await p.waitForTimeout(300);
check(await by("zadania") === z0, "zadanie z wynikiem 0% – bez XP");

// 5. cele: 30/50/80/120 w panelu, stare 100 i 200 odrzucone
await p.goto(`${B}/nauka`); await p.waitForSelector('[data-testid="xp-panel"]');
const goals = await p.locator('[data-testid="xp-panel"] [data-goal]').evaluateAll((els) => els.map((e) => e.getAttribute("data-goal")));
check(goals.join(",") === "30,50,80,120", `cele w panelu: ${goals}`);
check((await p.request.put(`${B}/api/cel`, { data: { goal: 200 } })).status() === 400, "stary cel 200 → 400");
check(/2 za poprawną/.test(await p.locator('[data-testid="xp-panel"] details.why').textContent()), "opis zasad XP");

await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails));
process.exit(fails.length ? 1 : 0);
