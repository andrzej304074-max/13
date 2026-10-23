// H5: wykresy – Podręcznik (krzywe i dane z Eurostatu), karta „Zrozumienie”, nowe hasło w kursie, tabela pojęć, mapa myśli
import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark" });
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`${B}/konto/logowanie`);
await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
const noScroll = async (m) => check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${m}: bez poziomego przewijania`);
// 1. Podręcznik: rozdział z kilkoma rysunkami i wykres z danych ze źródłem
await p.goto(`${B}/nauka/podrecznik/mikro-rynek`); await p.waitForSelector(".book-fig svg");
check(await p.locator(".book-fig svg").count() >= 3, `mikro-rynek: rysunki ${await p.locator(".book-fig svg").count()}`);
await noScroll("Podręcznik mikro-rynek");
await p.goto(`${B}/nauka/podrecznik/demo-miary`); await p.waitForSelector(".book-fig svg");
const cap = await p.locator(".book-fig figcaption").allInnerTexts();
check(cap.some((c) => /Źródło: Eurostat/.test(c)), "wykres z danych ze źródłem Eurostat");
await p.locator(".book-fig").filter({ hasText: "Eurostat" }).first().screenshot({ path: `${OUT}/h5_seria_dark.png` });
// 2. „Zrozumienie”: karta z rysunkiem powiązanego hasła
await p.goto(`${B}/nauka/lekcja/demo-miary-z2?sub=1`); await p.waitForSelector(".learn-intro");
check(await p.waitForSelector('.learn-intro [data-testid="item-fig"] svg', { timeout: 8000 }).then(() => true).catch(() => false), "Zrozumienie: rysunek na karcie");
await noScroll("Zrozumienie");
// 3. kurs: nowe hasło z rysunkiem (KMP)
await p.goto(`${B}/nauka/lekcja/mikro-podstawy-2?sub=1`); await p.waitForSelector(".learn-intro");
let found = false;
for (let i = 0; i < 6 && !found; i++) {
  if (await p.waitForSelector('.learn-intro [data-testid="item-fig"] svg', { timeout: 2500 }).then(() => true).catch(() => false)) found = true;
  else if (await p.locator(".learn-actions .btn").count()) await p.locator(".learn-actions .btn").first().click().catch(() => {});
  await p.waitForTimeout(300);
}
check(found, "kurs: rysunek przy nowym haśle");
await p.screenshot({ path: `${OUT}/h5_kurs_390.png` });
// 4. tabela pojęć i mapa myśli
await p.goto(`${B}/pojecia?q=Krzywa%20Laffera`); await p.waitForSelector('[data-testid="item-fig"] svg', { timeout: 15000 }).catch(() => {});
check(await p.locator('[data-testid="item-fig"] svg').count() >= 1, "tabela pojęć: rysunek przy haśle");
const id = await p.evaluate(async () => (await (await fetch("/api/dane/hasla")).json()).rows.find((r) => r.t === "Krzywa Laffera")?.id);
await p.goto(`${B}/pojecia/mapa?q=${id}`); await p.waitForSelector('[data-testid="mm-card"]');
check(await p.locator('[data-testid="mm-card"] [data-testid="item-fig"]').count() === 1, "mapa myśli: rysunek przy haśle");
check(errs.length === 0, `błędy strony: ${errs.join(" | ")}`);
console.log(`OK: ${ok} błędów: ${fails.length}`, fails);
await browser.close(); process.exit(fails.length ? 1 : 0);
