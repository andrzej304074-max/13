import { chromium } from "playwright-core";
import fs from "node:fs";
const OUT = process.argv[2];
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
let ok = 0, bad = 0;
const check = (c, msg) => { if (c) ok++; else { bad++; console.log("FAIL", msg); } };
const shot = (n, full = false) => page.screenshot({ path: `${OUT}/${n}.png`, fullPage: full });
const S = JSON.parse(fs.readFileSync("./data/nauka/owe-stats.json", "utf8"));
const Q = {};
for (const f of fs.readdirSync("./data/questions").filter((f) => f.endsWith(".json"))) for (const q of JSON.parse(fs.readFileSync("./data/questions/" + f))) Q[q.id] = q;
for (const f of ["auto", "manual"]) for (const q of JSON.parse(fs.readFileSync(`./data/slownik/${f}.json`))) Q[q.id] = q;

await page.goto(`${B}/konto/logowanie`);
await page.fill('input[name="email"]', "owner@example.com");
await page.fill('input[name="password"]', "haslo-wlasciciela");
await page.click("form button.btn");
await page.waitForTimeout(1500);

// 1. Pokrycie: XXXIX – powtórki liczone niezależnie z JSON
const its = (ed) => new Set(S.filter((r) => r.ed === ed).flatMap((r) => r.items));
const prev = new Set(S.filter((r) => r.ed < 39).flatMap((r) => r.items));
const e39 = its(39), rep39 = [...e39].filter((i) => prev.has(i)).length;
await page.goto(`${B}/pojecia/pokrycie?od=39`);
await page.waitForSelector('[data-testid="cov-repeat"]');
check(Number(await page.textContent('[data-testid="cov-repeat"]')) === rep39, `XXXIX powtórki UI vs ${rep39}`);
check(Number(await page.textContent('[data-testid="cov-fresh"]')) === e39.size - rep39, "XXXIX nowe");
const rows = await page.$$eval('[data-testid="cov-table"] tbody tr', (t) => t.length);
check(rows === 19, "tabela 19 edycji " + rows);
await page.hover('[data-testid="cov-chart"] svg g:nth-of-type(8) rect:last-child').catch(() => {});
await shot("cov-430", true);
// okno 3 edycji – zmiana wyniku
await page.goto(`${B}/pojecia/pokrycie?od=39&okno=3`); await page.waitForSelector('[data-testid="cov-repeat"]');
await page.waitForTimeout(400);
const prev3 = new Set(S.filter((r) => r.ed >= 36 && r.ed < 39).flatMap((r) => r.items));
check(Number(await page.textContent('[data-testid="cov-repeat"]')) === [...e39].filter((i) => prev3.has(i)).length, "okno 3 edycji");

// 2. Moje statystyki: test OWE bez limitu – 3 dobre, 3 złe odpowiedzi
const api = async (url, body) => (await page.request.post(B + url, { data: body })).json();
const myBefore = async (bank) => (await (await page.request.get(`${B}/api/stats/dzialy?bank=${bank}`)).json()).total.answers;
for (const bank of ["owe", "slownik"]) {
  const before = await myBefore(bank);
  let t = await api("/api/tests", { type: "single", count: "endless", bank });
  const tid = t.id;
  for (let i = 0; i < 6; i++) {
    const q = t.questions[i];
    const good = Q[q.id].correct[0];
    await api(`/api/tests/${tid}/answer`, { questionId: q.id, selected: [i < 3 ? good : (good + 1) % 4] });
    t = await (await page.request.get(`${B}/api/tests/${tid}`)).json();
  }
  const after = await myBefore(bank);
  check(after - before === 6, `${bank}: odpowiedzi +6 (${before} → ${after})`);
  await page.goto(`${B}/stats/dzialy?bank=${bank}`);
  await page.waitForSelector('[data-testid="my-total"]');
  check((await page.textContent('[data-testid="my-total"]')).includes(String(after)), `${bank}: suma w UI`);
  check(await page.$$eval('[data-testid="my-item"]', (e) => e.length) > 0, `${bank}: pojęcia`);
  await page.click('[data-testid="my-item"]');
  await page.waitForSelector(".q-list li");
  await shot(`my-${bank}`, false);
  await page.locator('[data-testid="my-breakdown"]').screenshot({ path: `${OUT}/my-${bank}-full.png` });
  // filtr: tylko 7 dni
  await page.selectOption('select:near(:text("Okres"))', "7d").catch(() => {});
  await page.waitForTimeout(800);
  check(page.url().includes("okres=7d"), `${bank}: filtr w adresie`);
}

// 3. Fiszki
await page.goto(`${B}/fiszki`);
await page.waitForSelector('[data-testid="reel"]');
check(await page.$$eval('[data-testid="reel"]', (e) => e.length) === 30, "feed: pierwsza porcja 30");
await page.click('[data-testid="reel"] .fc');
check(await page.$('[data-testid="reel"] .fc.back') !== null, "feed: odwrócenie");
await shot("feed-1");
await page.$eval('[data-testid="feed"]', (e) => e.scrollTo({ top: e.clientHeight * 29 }));
await page.waitForTimeout(800);
check(await page.$$eval('[data-testid="reel"]', (e) => e.length) > 30, "feed: doładowanie");
// klasyczne: pierwsza karta 2× „Nie znam” → czerwona obwódka
await page.goto(`${B}/fiszki?tryb=klasyczne`);
await page.waitForSelector('[data-testid="classic-card"]');
const first = await page.getAttribute('[data-testid="classic-card"]', "aria-label");
await page.click('[data-testid="classic-card"]');
await shot("classic-back");
await page.click('[data-testid="btn-unknown"]');
await page.click('button[aria-label="Poprzednia"]');
await page.click('[data-testid="btn-unknown"]');
await page.click('button[aria-label="Poprzednia"]');
check((await page.getAttribute('[data-testid="classic-card"]', "aria-label")) === first, "classic: powrót do karty");
const cls = await page.getAttribute('[data-testid="classic-card"]', "class");
await shot("classic-red");
const m = await (await page.request.get(`${B}/api/fiszki/opanowanie`)).json();
const C = JSON.parse(fs.readFileSync("./data/nauka/course.json", "utf8"));
const id = Object.keys(C.items).find((k) => "Fiszka: " + C.items[k].t === first);
const mm = m[id];
const exp = mm.t < 2 ? "none" : mm.c / mm.t >= 0.8 ? "good" : mm.c / mm.t >= 0.5 ? "mid" : "weak";
check(cls.includes(`fc-${exp}`), `classic: kolor ${cls} vs ${exp} (${mm.c}/${mm.t})`);
// filtr koloru
await page.goto(`${B}/fiszki?kolor=weak&tryb=klasyczne`);
await page.waitForSelector('[data-testid="classic-card"]');
check((await page.getAttribute('[data-testid="classic-card"]', "class")).includes("fc-weak"), "filtr: słabe");
// desktop
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(`${B}/fiszki`); await page.waitForSelector('[data-testid="reel"]'); await shot("feed-1280");
await page.goto(`${B}/pojecia/pokrycie`); await page.waitForSelector('[data-testid="cov-chart"]'); await shot("cov-1280", true);
check(errors.length === 0, "konsola: " + errors.slice(0, 3).join(" | "));
console.log("OK:", ok, "błędów:", bad);
await browser.close();
