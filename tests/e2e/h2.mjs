// H2: Na tle innych – percentyl i rozkład (od 5 osób), filtr źródła, ranking opt-in pod pseudonimem (bez e-maili)
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const sql = (q) => execSync(`psql -h localhost -U postgres -d owe -At -c "${q.replace(/"/g, '\\"')}"`, { env: { ...process.env, PGPASSWORD: "dev" } }).toString().trim();
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
const a = await device(390); // logowanie uruchamia też migrację schematu serwera
// 6 kont pomocniczych z XP (0–250 w tym tygodniu) i odpowiedziami w testach Słownika
sql("DELETE FROM users WHERE email LIKE 'h2-%@example.com'");
for (let i = 0; i < 6; i++) {
  const id = sql(`INSERT INTO users (email, pass_hash, activated_at) VALUES ('h2-${i}@example.com', 'x', now()) RETURNING id`).split("\n")[0];
  sql(`INSERT INTO xp_days (user_id, day, xp, by, goal) VALUES ('${id}', (now() AT TIME ZONE 'Europe/Warsaw')::date, ${i * 50}, '{"fiszki": ${i * 50}}', 100)`);
  if (i === 5) sql(`UPDATE users SET rank_opt = true, rank_name = 'Pomocnik H2' WHERE id = '${id}'`);
}
await a.request.put(`${B}/api/ranking`, { data: { on: false } });
// 1. API: rozkład i percentyl (XP z fiszek – w tym tygodniu)
const w = await (await a.request.get(`${B}/api/swiat?miara=xp&zrodlo=fiszki&okres=7d`)).json();
check(w.n >= 6 && w.dist && w.dist.bins.length > 0, `rozkład XP fiszek: n=${w.n}`);
check(typeof w.better === "number" || w.me === null, `percentyl: ${w.better}`);
check(!JSON.stringify(w).includes("@") && !JSON.stringify(w).match(/[0-9a-f]{8}-[0-9a-f]{4}-/), "bez e-maili i identyfikatorów");
const w2 = await (await a.request.get(`${B}/api/swiat?miara=xp&zrodlo=zadania&okres=7d`)).json();
check(w2.n !== w.n || JSON.stringify(w2) !== JSON.stringify(w), "inne źródło – inny wynik");
const se = await (await a.request.get(`${B}/api/swiat?miara=seria`)).json();
check(typeof se.n === "number", `seria: n=${se.n}`);
// 2. strona
await a.goto(`${B}/stats/swiat?miara=xp&zrodlo=fiszki&okres=7d`); await a.waitForSelector('[data-testid="world-card"]');
check(await a.locator('[data-testid="world-hist"] .world-bin').count() > 0, "histogram na stronie");
await a.selectOption('[data-testid="world-source"]', "lacznie"); await a.waitForSelector('[data-testid="world-card"]');
await a.click('[data-metric="skutecznosc"]'); await a.waitForSelector('[data-testid="world-card"]');
check(await a.locator('[data-testid="world-better"]').count() === 1, "skuteczność – karta");
check(await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "telefon: bez poziomego przewijania");
await a.screenshot({ path: `${OUT}/h2_world_390.png`, fullPage: true });
// 3. ranking: zapis pod pseudonimem, zajęty pseudonim, wypis
check((await a.request.put(`${B}/api/ranking`, { data: { on: true, name: "pomocnik h2" } })).status() === 409, "zajęty pseudonim → 409");
check((await a.request.put(`${B}/api/ranking`, { data: { on: true, name: "a@b.pl" } })).status() === 400, "e-mail jako pseudonim → 400");
await a.goto(`${B}/stats/swiat`); await a.waitForSelector('[data-testid="ranking"]');
await a.fill('[data-testid="rank-name"]', "Drugi Tester"); await a.click('[data-testid="rank-join"]');
await a.waitForSelector('.rank-list li.me');
const r = await (await a.request.get(`${B}/api/ranking`)).json();
check(r.me.on && r.me.place >= 1 && r.top.some((x) => x.name === "Drugi Tester" && x.me), `ranking: miejsce ${r.me.place}`);
check(r.top.some((x) => x.name === "Pomocnik H2") && !JSON.stringify(r).includes("@"), "ranking bez e-maili, z innymi zapisanymi");
await a.click('[data-testid="rank-leave"]'); await a.waitForTimeout(500);
check(!(await (await a.request.get(`${B}/api/ranking`)).json()).top.some((x) => x.name === "Drugi Tester"), "po wypisaniu – poza rankingiem");
sql("DELETE FROM users WHERE email LIKE 'h2-%@example.com'");
check(errs.length === 0, `błędy strony: ${errs.join(" | ")}`);
console.log(`OK: ${ok} błędów: ${fails.length}`, fails);
await browser.close(); process.exit(fails.length ? 1 : 0);
