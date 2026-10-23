// G5: filtry zapamiętane na koncie – drugie urządzenie (nowy kontekst przeglądarki) widzi te same filtry
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
for (const k of ["pojecia-statystyki", "testy-mix", "zadania", "fiszki"]) await a.request.put(`${B}/api/ustawienia/filtry/${k}`, { data: { value: "" } });

// 1. Statystyki OWE: filtr ustawiony na telefonie
await a.goto(`${B}/pojecia/statystyki`); await a.waitForSelector('[data-testid="owe-total"]');
await a.selectOption('[data-testid="theme-filter"]', "yes"); await a.waitForTimeout(1500);
await b.goto(`${B}/pojecia/statystyki`); await b.waitForSelector('[data-testid="owe-total"]'); await b.waitForTimeout(800);
check(await b.locator('[data-testid="theme-filter"]').inputValue() === "yes", "komputer: filtr hasła z konta");
check(new URL(b.url()).searchParams.get("haslo") === "tak", "komputer: filtr w adresie");
// adres z jawnymi filtrami ma pierwszeństwo (link od kogoś)
await b.goto(`${B}/pojecia/statystyki?haslo=nie`); await b.waitForSelector('[data-testid="owe-total"]'); await b.waitForTimeout(800);
check(await b.locator('[data-testid="theme-filter"]').inputValue() === "no", "jawny filtr w adresie wygrywa");
// …ale samo otwarcie linku nie nadpisuje zapisanych filtrów; dopiero zmiana filtra
await b.waitForTimeout(1200);
let prefs = await (await b.request.get(`${B}/api/ustawienia/filtry`)).json();
check(prefs.prefs["pojecia-statystyki"] === "haslo=tak", `link nie nadpisuje: ${JSON.stringify(prefs.prefs)}`);
await b.selectOption('[data-testid="theme-filter"]', "all"); await b.waitForTimeout(1500);
prefs = await (await b.request.get(`${B}/api/ustawienia/filtry`)).json();
check(prefs.prefs["pojecia-statystyki"] === undefined || prefs.prefs["pojecia-statystyki"] === "", `zmiana zapisana (domyślne = pusta wartość): ${JSON.stringify(prefs.prefs)}`);

// 2. formularz „Wszystkie pytania”
await a.goto(`${B}/testy/wszystkie`); await a.waitForSelector('[data-testid="sources"]'); await a.waitForTimeout(500);
await a.click('[data-source="slownik"]'); await a.waitForTimeout(1500);
await b.goto(`${B}/testy/wszystkie`); await b.waitForSelector('[data-testid="sources"]'); await b.waitForTimeout(1000);
check(await b.locator('[data-source="slownik"]').getAttribute("aria-pressed") === "false"
  && await b.locator('[data-source="ai"]').getAttribute("aria-pressed") === "true", "źródła testu z konta");

// 3. Zadania: filtr etapu; wyjście ze strony przed upływem opóźnienia też zapisuje
await a.goto(`${B}/zadania`); await a.waitForSelector('[data-testid="open-item"]');
await a.locator("select").first().selectOption({ index: 1 });
const val = await a.locator("select").first().inputValue();
await a.goto(`${B}/`); await a.waitForTimeout(800);
await b.goto(`${B}/zadania`); await b.waitForSelector('[data-testid="open-item"]'); await b.waitForTimeout(1000);
check(await b.locator("select").first().inputValue() === val, `zadania: filtr „${val}” z konta`);

// 4. API: walidacja
const bad = await a.request.put(`${B}/api/ustawienia/filtry/nieznany`, { data: { value: "x" } });
check(bad.status() === 400, `nieznany klucz → 400 (${bad.status()})`);
const long = await a.request.put(`${B}/api/ustawienia/filtry/fiszki`, { data: { value: "x".repeat(3000) } });
check(long.status() === 400, `za długa wartość → 400 (${long.status()})`);
const anon = await (await browser.newContext()).request.get(`${B}/api/ustawienia/filtry`);
check(anon.status() === 401, `bez logowania → 401 (${anon.status()})`);
for (const k of ["pojecia-statystyki", "testy-mix", "zadania"]) await a.request.put(`${B}/api/ustawienia/filtry/${k}`, { data: { value: "" } });
check(errs.length === 0, `błędy JS: ${errs.join(" | ")}`);
await browser.close();
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
