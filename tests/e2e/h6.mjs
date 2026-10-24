// H6: „Więcej ▾” – fiszki (feed i klasyczne), własna talia, karta „Poznaj” w kursie, tabela pojęć, mapa myśli, link do Podręcznika
import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
p.on("console", (m) => { if (m.type() === "error" && /descendant|nested|validateDOMNesting/i.test(m.text())) errs.push(m.text()); });
await p.goto(`${B}/konto/logowanie`);
await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
const noScroll = async (m) => check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${m}: bez poziomego przewijania`);
/** Rozwija „Więcej” w obrębie `scope` i zwraca tekst rozwinięcia. */
async function expand(scope, m) {
  const btn = p.locator(`${scope} [data-testid="more-btn"]`).first();
  if (!(await btn.count())) { fails.push(`${m}: brak przycisku „Więcej”`); return ""; }
  await btn.click();
  const body = p.locator(`${scope} [data-testid="more-body"]`).first();
  const txt = await body.waitFor({ timeout: 10000 }).then(() => body.innerText()).catch(() => "");
  check(/Przykład:/.test(txt) && txt.length > 120, `${m}: wyjaśnienie z przykładem`);
  return txt;
}
// 1. dane: osobny plik, nie w /api/dane/hasla
const sizes = await p.evaluate(async () => {
  const h = await fetch("/api/dane/hasla"); const w = await fetch("/api/dane/wiecej");
  const wj = await w.json();
  return { hasla: (await h.text()).includes("Przykład"), n: Object.keys(wj).length, etag: !!w.headers.get("etag") };
});
check(sizes.n >= 1700 && sizes.etag, `plik „Więcej”: ${sizes.n} haseł, ETag ${sizes.etag}`);
// 2. fiszki – feed: rozwinięcie na odwróconej karcie nie odwraca jej z powrotem
await p.goto(`${B}/fiszki`); await p.waitForSelector('[data-testid="reel"]');
const reel = '[data-testid="reel"]:first-of-type';
await p.click(`${reel} .fc`);
check(await p.locator(`${reel} .fc.back`).count() === 1, "feed: odwrócenie karty");
await expand(reel, "feed");
check(await p.locator(`${reel} .fc.back`).count() === 1, "feed: „Więcej” nie odwraca karty");
await p.locator(`${reel} .fc`).first().screenshot({ path: `${OUT}/h6_feed_390.png` });
await noScroll("feed");
// 3. fiszki klasyczne + klawiatura (Enter na karcie odwraca)
await p.goto(`${B}/fiszki?tryb=klasyczne`); await p.waitForSelector('[data-testid="classic-card"]');
await p.focus('[data-testid="classic-card"]'); await p.keyboard.press("Enter");
check((await p.getAttribute('[data-testid="classic-card"]', "class")).includes("back"), "klasyczne: Enter odwraca kartę");
await expand('[data-testid="classic-card"]', "klasyczne");
const link = p.locator('[data-testid="classic-card"] .more-link');
if (await link.count()) {
  await link.click(); await p.waitForURL(/\/nauka\/podrecznik\//, { timeout: 10000 }).catch(() => {});
  check(/\/nauka\/podrecznik\/[^/]+\/[^/]+/.test(p.url()), `link do rozdziału Podręcznika (${p.url()})`);
} else fails.push("klasyczne: brak linku do Podręcznika");
// skróty po kliknięciu „Znam”: Spacja odwraca kartę, a nie ocenia ponownie
await p.goto(`${B}/fiszki?tryb=klasyczne`); await p.waitForSelector('[data-testid="classic-card"]');
const pos0 = await p.locator('[data-testid="classic-pos"]').innerText();
await p.click('[data-testid="btn-known"]');
const pos1 = await p.locator('[data-testid="classic-pos"]').innerText();
await p.keyboard.press(" "); await p.waitForTimeout(200);
check((await p.locator('[data-testid="classic-pos"]').innerText()) === pos1 && pos1 !== pos0, "Spacja po „Znam” nie przechodzi dalej");
check((await p.getAttribute('[data-testid="classic-card"]', "class")).includes("back"), "Spacja po „Znam” odwraca kartę");
await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(200);
check((await p.locator('[data-testid="classic-pos"]').innerText()) === pos0, "strzałka po kliknięciu przycisku działa");
// 4. własna talia z hasłem kursu
const hasla = await (await p.request.get(`${B}/api/dane/hasla`)).json();
const lf = hasla.rows.find((r) => r.t === "Krzywa Laffera");
const deck = await (await p.request.post(`${B}/api/talie`, { data: { name: "h6 więcej", items: [lf.id] } })).json();
await p.goto(`${B}/fiszki?talia=${deck.id}&tryb=klasyczne`); await p.waitForSelector('[data-testid="classic-card"]');
await p.click('[data-testid="classic-card"]');
const deckTxt = await expand('[data-testid="classic-card"]', "talia");
check(/Laffer|stawk|podatk/i.test(deckTxt), "talia: rozwinięcie właściwego hasła");
await p.request.delete(`${B}/api/talie/${deck.id}`);
// 5. kurs – karta „Poznaj”
await p.goto(`${B}/nauka/lekcja/mikro-podstawy-1?sub=1`); await p.waitForSelector(".learn-intro");
await expand(".learn-intro", "kurs");
await noScroll("kurs");
// 6. tabela pojęć i mapa myśli
await p.goto(`${B}/pojecia?q=Krzywa%20Laffera`); await p.waitForSelector(".concept-row:not(.head)");
await expand(".concept-row:not(.head)", "tabela pojęć");
await p.goto(`${B}/pojecia/mapa?q=${lf.id}`); await p.waitForSelector('[data-testid="mm-card"]');
await expand('[data-testid="mm-card"]', "mapa myśli");
check(errs.length === 0, `błędy strony: ${errs.join(" | ")}`);
console.log(`OK: ${ok} błędów: ${fails.length}`, fails);
await browser.close(); process.exit(fails.length ? 1 : 0);
