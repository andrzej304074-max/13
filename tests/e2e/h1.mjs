// H1: wspólny cel dzienny i seria – XP z testu, fiszki i lekcji, cel na koncie, 🔥 w nagłówku
import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
async function device(w) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`${B}/konto/logowanie`);
  await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
  await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
  return p;
}
const a = await device(390), b = await device(1280);
const cel = async (p) => (await p.request.get(`${B}/api/cel`)).json();
await a.request.put(`${B}/api/cel`, { data: { goal: 80 } });
const s0 = await cel(a);

// 1. test: odpowiedź daje XP (2/1/0 – za pierwszą odpowiedź na pytanie danego dnia), puste zaznaczenie – 0
const t = await (await a.request.post(`${B}/api/tests`, { data: { bank: "owe", type: "single", count: 30 } })).json();
const st = await (await a.request.get(`${B}/api/tests/${t.id}`)).json();
await a.request.post(`${B}/api/tests/${t.id}/answer`, { data: { questionId: st.questions[0].id, selected: [0] } });
const s1 = await cel(a);
const dTest = (s1.today.by.testy ?? 0) - (s0.today.by.testy ?? 0);
check(dTest === 2 || dTest === 0, `XP za odpowiedź: +${dTest}`);
await a.request.post(`${B}/api/tests/${t.id}/answer`, { data: { questionId: st.questions[1].id, selected: [] } });
check((await cel(a)).today.by.testy === s1.today.by.testy, "puste zaznaczenie – 0 XP");
await a.request.post(`${B}/api/tests/${t.id}/finish`);

// 2. fiszka: +1 XP (do 20 dziennie)
const items = await (await a.request.get(`${B}/api/dane/hasla`)).json();
const itemId = items.rows[0].id;
const s2 = await cel(a);
const r = await a.request.post(`${B}/api/fiszki/ocena`, { data: { item: itemId, known: true } });
check(r.ok(), `ocena fiszki ${r.status()}`);
const dF = ((await cel(a)).today.by.fiszki ?? 0) - (s2.today.by.fiszki ?? 0);
check(dF === 1 || (dF === 0 && s2.today.by.fiszki === 20), `fiszka +1 XP (${dF}, dziś ${s2.today.by.fiszki ?? 0})`);

// 3. cel na koncie: zmiana na telefonie widoczna na komputerze
await a.goto(`${B}/nauka`); await a.waitForSelector('[data-testid="xp-panel"]');
await a.click('[data-testid="xp-panel"] [data-goal="50"]'); await a.waitForTimeout(800);
check((await cel(b)).goal === 50, "cel 50 zapisany na koncie");
await b.goto(`${B}/stats`); await b.waitForSelector('[data-testid="xp-badge"]');
await b.click('[data-testid="xp-badge"]'); await b.waitForSelector('[data-testid="xp-panel"]');
check(await b.locator('[data-testid="xp-panel"] [data-goal="50"]').getAttribute("aria-pressed") === "true", "komputer: cel 50 w panelu");
const today = (await cel(b)).today.xp;
check(/\d/.test(await b.locator('[data-testid="xp-today"]').innerText()) && (await b.locator('[data-testid="xp-today"]').innerText()).includes(String(today)), "XP dziś w panelu");
await b.screenshot({ path: `${OUT}/h1_panel_1280.png` });
// 4. seria: cel osiągnięty dziś → seria ≥ 1 (dociągamy XP odpowiedziami)
await a.request.put(`${B}/api/cel`, { data: { goal: 30 } });
let s = await cel(a);
if (!s.todayMet) {
  const t2 = await (await a.request.post(`${B}/api/tests`, { data: { bank: "owe", type: "single", count: "endless" } })).json();
  let cur = t2;
  for (let i = 0; i < 150 && !(await cel(a)).todayMet; i++) {
    const q = cur.questions[i];
    if (!q) break;
    const res = await (await a.request.post(`${B}/api/tests/${t2.id}/answer`, { data: { questionId: q.id, selected: [0] } })).json();
    if (res.nextQuestion) cur.questions[i + 1] = res.nextQuestion;
  }
  await a.request.post(`${B}/api/tests/${t2.id}/finish`);
  s = await cel(a);
}
check(s.todayMet && s.streak >= 1, `seria po osiągnięciu celu: ${s.streak} (${s.today.xp}/${s.goal})`);
await a.goto(`${B}/nauka`); await a.waitForSelector('[data-testid="xp-badge"]');
check(/🔥/.test(await a.locator('[data-testid="xp-badge"]').innerText()), "🔥 w nagłówku po osiągnięciu celu");
check(await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "telefon: bez poziomego przewijania");
await a.click('[data-testid="xp-badge"]'); await a.waitForSelector('.xp-pop');
await a.screenshot({ path: `${OUT}/h1_pop_390.png` });
await a.request.put(`${B}/api/cel`, { data: { goal: 50 } });
check((await a.request.put(`${B}/api/cel`, { data: { goal: 77 } })).status() === 400, "zły cel → 400");
check((await a.request.put(`${B}/api/cel`, { data: { goal: 100 } })).status() === 400, "stary cel 100 → 400");
check(errs.length === 0, `błędy strony: ${errs.join(" | ")}`);
console.log(`OK: ${ok} błędów: ${fails.length}`, fails);
await browser.close(); process.exit(fails.length ? 1 : 0);
