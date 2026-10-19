import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [], errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const U = "mikro-podstawy", L = "mikro-podstawy-2";
for (const vp of [{ width: 1280, height: 900 }, { width: 430, height: 900 }]) {
  const tag = vp.width;
  const ctx = await browser.newContext({ viewport: vp });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errs.push(`${tag} ${page.url()} ${m.text()}`));
  page.on("pageerror", (e) => errs.push(`${tag} ${page.url()} ${e.message}`));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', "owner@example.com"); await page.fill('input[name="password"]', "haslo-wlasciciela");
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
  const ov = async (n) => check(!(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)), `${tag} ${n}: poziome przewijanie`);
  // czyszczenie: podkreślenia i gwiazdki z poprzednich przebiegów
  for (const h of await (await page.request.get(`${B}/api/podkreslenia?artykul=${U}`)).json()) await page.request.delete(`${B}/api/podkreslenia?id=${h.id}`);
  for (const r of await (await page.request.get(`${B}/api/gwiazdki?rodzaj=artykul`)).json()) await page.request.post(`${B}/api/gwiazdki`, { data: { kind: "artykul", ref: r, on: false } });

  // 1. spis
  await page.goto(`${B}/nauka/podrecznik`); await page.waitForSelector('[data-testid="book-unit"]');
  check(await page.locator(".subtabs a.active").textContent() === "Podręcznik", `${tag} zakładka Podręcznik aktywna`);
  check(/Napisane rozdziały: \d+/.test(await page.textContent('[data-testid="book-stats"]')), `${tag} licznik rozdziałów`);
  await ov("spis"); await page.screenshot({ path: `${OUT}/book-${tag}-spis.png` });

  // 2. ścieżka tematu → „Czytaj artykuł zamiast Poznaj”
  await page.goto(`${B}/nauka/mikro#${L}`); await page.waitForSelector('[data-testid="article-link"]', { timeout: 15000 }).catch(() => {});
  check(await page.locator('[data-testid="article-link"]').count() === 1, `${tag} link do artykułu w panelu lekcji`);
  await page.click('[data-testid="article-link"]'); await page.waitForURL(new RegExp(`/podrecznik/${U}/${L}`));
  await page.waitForSelector('[data-testid="reader-body"]');
  await ov("artykuł"); await page.screenshot({ path: `${OUT}/book-${tag}-artykul.png` });

  // 3. podkreślenie zaznaczonego tekstu
  const select = async () => {
    await page.evaluate(() => {
      const p = document.querySelector('[data-testid="reader-body"] p [data-o]');
      const t = p.firstChild; const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, Math.min(25, t.length));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    });
    await page.waitForSelector('[data-testid="sel-pop"]', { timeout: 5000 }).catch(() => {});
  };
  await select();
  check(await page.locator('[data-testid="sel-pop"]').isVisible(), `${tag} dymek po zaznaczeniu`);
  await page.click('[data-testid="hl-g"]'); await page.waitForTimeout(800);
  check(await page.locator("mark.hl.hl-g").count() >= 1, `${tag} podkreślenie widoczne`);
  await page.reload(); await page.waitForSelector("mark.hl", { timeout: 8000 }).catch(() => {});
  check(await page.locator("mark.hl.hl-g").count() >= 1, `${tag} podkreślenie po odświeżeniu`);
  await page.click("mark.hl >> nth=0"); await page.click('[data-testid="hl-del"]'); await page.waitForTimeout(800);
  check(await page.locator("mark.hl").count() === 0, `${tag} usunięcie podkreślenia`);
  // 4. do notatki → szybki panel z cytatem
  await select(); await page.click('[data-testid="to-note"]');
  await page.waitForSelector('[data-testid="qn-panel"] .ne-text', { timeout: 8000 }).catch(() => {});
  const body = await page.locator('[data-testid="qn-panel"] .ne-text').inputValue().catch(() => "");
  check(body.startsWith("„"), `${tag} notatka z cytatem w szybkim panelu (${body.slice(0, 30)})`);
  await page.click('[data-testid="qn-close"]').catch(() => {});
  // 5. dymek hasła
  await page.locator(".reader-body a.term").first().click();
  await page.waitForSelector(".term-pop strong", { timeout: 8000 }).catch(() => {});
  check(await page.locator(".term-pop strong").count() === 1, `${tag} definicja hasła po kliknięciu`);
  await page.keyboard.press("Escape"); await page.mouse.wheel(0, 10);
  // 6. A+
  const fs0 = await page.evaluate(() => getComputedStyle(document.querySelector(".reader-body")).fontSize);
  await page.click('button[aria-label="Większy tekst"]');
  const fs1 = await page.evaluate(() => getComputedStyle(document.querySelector(".reader-body")).fontSize);
  check(parseFloat(fs1) > parseFloat(fs0), `${tag} A+ powiększa tekst ${fs0}→${fs1}`);
  await page.click('button[aria-label="Mniejszy tekst"]');
  // 7. gwiazdka artykułu + filtr w spisie
  await page.click('.reader-head [data-testid="star"]'); await page.waitForTimeout(600);
  // 8. przeczytanie do końca → Poznaj zaliczone
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(2500);
  const prog = await (await page.request.get(`${B}/api/nauka/progress?topic=mikro`)).json();
  check(prog.lessons?.[L]?.subs?.[1]?.best === 100, `${tag} przeczytanie zalicza Poznaj (${JSON.stringify(prog.lessons?.[L]?.subs?.[1])})`);
  const reads = await (await page.request.get(`${B}/api/podrecznik/przeczytane`)).json();
  check(Boolean(reads[L]), `${tag} artykuł oznaczony jako przeczytany`);
  await page.goto(`${B}/nauka/podrecznik`); await page.waitForSelector('[data-testid="book-unit"]');
  await page.click('.seg button:has-text("Z gwiazdką")'); await page.waitForTimeout(400);
  check(await page.locator(".book-chapters a", { hasText: "Mapa tego, na co nas stać" }).count() === 1, `${tag} rozdział z gwiazdką w filtrze ★`);
  // 9. baner w Poznaj + artykuł działu ze spisem treści
  await page.goto(`${B}/nauka/lekcja/${L}?sub=1`); await page.waitForSelector(".learn");
  check(await page.locator('[data-testid="article-banner"]').count() === 1, `${tag} baner artykułu w „Poznaj”`);
  await page.goto(`${B}/nauka/podrecznik/${U}`); await page.waitForSelector('[data-testid="reader-body"]');
  check(await page.locator(".reader-section").count() >= 10, `${tag} artykuł działu z rozdziałami`);
  check(await page.locator(".reader-toc li").count() >= 10, `${tag} spis treści działu`);
  await ov("dział"); await page.screenshot({ path: `${OUT}/book-${tag}-dzial.png` });
  // historia w statystykach nauki
  await page.goto(`${B}/nauka/statystyki`); await page.waitForSelector("table", { timeout: 15000 }).catch(() => {});
  check(await page.locator("td", { hasText: "przeczytany artykuł" }).count() >= 1, `${tag} historia pokazuje przeczytany artykuł`);
  await ctx.close();
}
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
console.log("konsola:", JSON.stringify(errs.slice(0, 10), null, 1));
await browser.close();
