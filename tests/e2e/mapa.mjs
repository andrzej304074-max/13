import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const hasla = [];
for (const [vp, scheme] of [[{ width: 1280, height: 900 }, "light"], [{ width: 430, height: 900 }, "dark"]]) {
  const tag = vp.width;
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 600, colorScheme: scheme });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errs.push(`${tag} ${page.url()} ${m.text()}`));
  page.on("pageerror", (e) => errs.push(`${tag} ${page.url()} ${e.message}`));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', "owner@example.com"); await page.fill('input[name="password"]', "haslo-wlasciciela");
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
  if (!hasla.length) hasla.push(...(await (await page.request.get(`${B}/api/dane/hasla`)).json()).rows);
  const T = (id) => hasla.find((h) => h.id === id)?.t;

  // 1. wejście – domyślne pojęcie i powiązane
  await page.goto(`${B}/pojecia/mapa`); await page.waitForSelector('[data-testid="mind-map"]');
  const n1 = await page.locator('[data-testid="mm-node-1"]').count();
  check(n1 >= 6, `${tag} mapa ma ≥ 6 powiązanych (${n1})`);
  // 2. wpisanie pojęcia – podpowiedź → środek mapy
  await page.fill('[data-testid="mm-search"]', "inflacja"); await page.waitForSelector(".mm-sug button");
  await page.press('[data-testid="mm-search"]', "Enter"); await page.waitForTimeout(700);
  const c0 = await page.locator('[data-testid="mm-node-0"]').getAttribute("data-id");
  check(/^Inflacja/.test(T(c0) ?? ""), `${tag} wpisanie „inflacja” ustawia ją w środku (${T(c0)})`);
  check(new URL(page.url()).searchParams.get("q") === c0, `${tag} adres ?q= z id pojęcia`);
  const labels = await page.locator('[data-testid="mm-node-1"] text').allTextContents();
  check(labels.some((l) => /stopa procentowa|deflat|hiperinflac|stagflac|ppi/i.test(l)), `${tag} wśród powiązanych inflacji są pojęcia pokrewne: ${labels.slice(0, 5).join(" | ")}`);
  check(await page.locator('[data-testid="mm-link"]').count() >= n1, `${tag} lista tekstowa powiązań pod mapą`);
  await page.screenshot({ path: `${OUT}/mapa-${tag}.png`, fullPage: true });
  // 3. kliknięcie węzła centruje, „wstecz” wraca
  const first = page.locator('[data-testid="mm-node-1"]').first();
  const fid = await first.getAttribute("data-id");
  await first.click(); await page.waitForTimeout(700);
  check(await page.locator('[data-testid="mm-node-0"]').getAttribute("data-id") === fid, `${tag} kliknięcie węzła przenosi go do środka`);
  check((await page.locator('[data-testid="mm-card"] h2').textContent()) === T(fid), `${tag} karta pokazuje pojęcie ze środka`);
  const prevs = await page.locator('.mm-node.prev').evaluateAll((els) => els.map((e) => e.getAttribute("data-id")));
  check(prevs.length === 1 && prevs[0] === c0, `${tag} poprzednie pojęcie ma pogrubioną obwódkę (${prevs})`);
  const sw = await page.locator('.mm-node.prev rect').evaluate((r) => parseFloat(getComputedStyle(r).strokeWidth));
  check(sw >= 4, `${tag} grubość obwódki ${sw}`);
  await page.click('[data-testid="mm-back"]'); await page.waitForTimeout(600);
  check(await page.locator('[data-testid="mm-node-0"]').getAttribute("data-id") === c0, `${tag} „Wstecz” wraca do poprzedniego pojęcia`);
  // 4. klawiatura: Tab na węzeł + Enter
  await page.locator('[data-testid="mm-node-1"]').nth(1).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(600);
  check(await page.locator('[data-testid="mm-node-0"]').getAttribute("data-id") !== c0, `${tag} Enter na węźle centruje mapę`);
  await page.click('[data-testid="mm-back"]'); await page.waitForTimeout(400);
  // 5. filtr tematu – węzły tylko z tego tematu
  if (tag === 430) check(await page.locator(".filters-card").getAttribute("open") === null, `${tag} filtry zwinięte na telefonie`);
  if ((await page.locator(".filters-card").getAttribute("open")) === null) await page.click(".filters-card summary");
  await page.selectOption('[data-testid="mm-topic"]', "makro"); await page.waitForTimeout(500);
  const ids = await page.locator('[data-testid="mm-node-1"]').evaluateAll((els) => els.map((e) => e.getAttribute("data-id")));
  check(ids.length > 0 && ids.every((id) => hasla.find((h) => h.id === id)?.topic === "makro"), `${tag} filtr tematu: tylko węzły z Makro (${ids.length})`);
  await page.selectOption('[data-testid="mm-topic"]', "");
  // 6. dwa poziomy
  await page.check('[data-testid="mm-deep"]'); await page.waitForTimeout(500);
  check(await page.locator('[data-testid="mm-node-2"]').count() > 0, `${tag} „2 poziomy” dodaje dalsze powiązania`);
  await page.screenshot({ path: `${OUT}/mapa-${tag}-2poziomy.png`, fullPage: true });
  await page.uncheck('[data-testid="mm-deep"]');
  // 7. wybór z listy
  await page.click('[data-testid="mm-list-toggle"]'); await page.waitForSelector('[data-testid="mm-list"] li button');
  const li = page.locator('[data-testid="mm-list"] li button').nth(3);
  const lt = (await li.locator("span").first().textContent()).trim();
  await li.click(); await page.waitForTimeout(700);
  check((await page.locator('[data-testid="mm-card"] h2').textContent()) === lt, `${tag} wybór z listy ustawia pojęcie (${lt})`);
  // 8. bezpośredni adres ?q=
  await page.goto(`${B}/pojecia/mapa?q=${c0}`); await page.waitForSelector('[data-testid="mind-map"]'); await page.waitForTimeout(700);
  check(await page.locator('[data-testid="mm-node-0"]').getAttribute("data-id") === c0, `${tag} adres ?q= otwiera to pojęcie`);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  check(!ov, `${tag} brak poziomego przewijania`);
  // 9. węzły mieszczą się w obszarze mapy
  const inside = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mind-map"] svg').getBoundingClientRect();
    return [...document.querySelectorAll('.mm-node rect')].every((r) => { const b = r.getBoundingClientRect(); return b.left >= svg.left - 1 && b.right <= svg.right + 1 && b.top >= svg.top - 1 && b.bottom <= svg.bottom + 1; });
  });
  check(inside, `${tag} wszystkie węzły w obszarze mapy`);
  for (const deep of [false, true]) {
    if (deep) {
      if ((await page.locator(".filters-card").getAttribute("open")) === null) await page.click(".filters-card summary");
      await page.check('[data-testid="mm-deep"]'); await page.waitForTimeout(700);
    }
    const overlaps = await page.evaluate(() => {
      const rs = [...document.querySelectorAll('.mm-node rect')].map((r) => r.getBoundingClientRect());
      let n = 0;
      for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
        const a = rs[i], b = rs[j];
        if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) n++;
      }
      return n;
    });
    check(overlaps === 0, `${tag} węzły nie nachodzą na siebie${deep ? " (2 poziomy)" : ""}: ${overlaps}`);
  }
  await ctx.close();
}
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
console.log("konsola:", JSON.stringify(errs, null, 1));
await browser.close();
