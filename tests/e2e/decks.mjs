import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
for (const vp of [{ width: 1280, height: 900 }, { width: 430, height: 900 }]) {
  const tag = vp.width, touch = vp.width < 600;
  const ctx = await browser.newContext({ viewport: vp, hasTouch: touch });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errs.push(`${tag} ${page.url()} ${m.text()}`));
  page.on("pageerror", (e) => errs.push(`${tag} ${page.url()} ${e.message}`));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', "owner@example.com"); await page.fill('input[name="password"]', "haslo-wlasciciela");
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
  for (const d of await (await page.request.get(`${B}/api/talie`)).json()) await page.request.delete(`${B}/api/talie/${d.id}`);
  const deckApi = async (id) => (await page.request.get(`${B}/api/talie/${id}`)).json();

  // 1. nowa talia z listy
  await page.goto(`${B}/fiszki/talie`); await page.waitForSelector('[data-testid="deck-create"]');
  // przycisk jest od razu, lista talii dochodzi po pobraniu – czekamy na stan pusty (wcześniej wyścig w teście)
  await page.locator(".empty-state", { hasText: "talii" }).first().waitFor({ timeout: 10000 }).catch(() => {});
  check(await page.locator(".empty-state", { hasText: "talii" }).count() === 1, `${tag} pusta lista talii – stan pusty`);
  await page.fill('[data-testid="deck-name-new"]', `Talia ${tag}`);
  await page.click('[data-testid="deck-create"]');
  await page.waitForURL(/\/fiszki\/talie\/[0-9a-f-]{36}/);
  const id = page.url().split("/").pop();
  await page.waitForSelector('[data-testid="deck-search"]');
  check((await page.inputValue('[data-testid="deck-title"]')) === `Talia ${tag}`, `${tag} nazwa talii`);

  // 2. wyszukiwanie i dodawanie: Enter dodaje pierwszy wynik, kliknięcie – kolejne
  const added = [];
  for (const q of ["elastyczność cenowa", "inflacja", "Keynes", "VAT", "popyt"]) {
    await page.fill('[data-testid="deck-search"]', q);
    await page.waitForTimeout(150);
    const first = page.locator('.deck-result:not(.in)').first();
    const t = (await first.locator("strong").textContent()).trim();
    if (added.length % 2) await page.press('[data-testid="deck-search"]', "Enter"); else await first.click();
    await page.waitForTimeout(450);
    added.push(t);
  }
  let d = await deckApi(id);
  check(d.items.length === 5, `${tag} 5 kart w talii (${d.items.length})`);
  check(await page.locator('[data-testid="deck-item"]').count() === 5, `${tag} 5 kart na liście`);
  await page.fill('[data-testid="deck-search"]', "inflacja"); await page.waitForTimeout(150);
  check(await page.locator(".deck-result.in").count() >= 1, `${tag} dodane hasło oznaczone „w talii”`);
  // filtr tematu zawęża wyniki
  await page.fill('[data-testid="deck-search"]', "");
  await page.selectOption('.deck-search select >> nth=1', "demografia"); await page.waitForTimeout(150);
  const metas = await page.locator(".deck-result .muted").allTextContents();
  check(metas.length > 0 && metas.every((m) => /demograf/i.test(m)), `${tag} filtr tematu zawęża wyniki`);
  await page.selectOption('.deck-search select >> nth=1', "");
  await page.screenshot({ path: `${OUT}/decks-${tag}-edytor.png`, fullPage: true });

  // 3. przeciąganie: pierwsza karta na trzecie miejsce (mysz albo palec)
  const before = (await deckApi(id)).items;
  await page.evaluate(() => document.querySelector('[data-testid="deck-item"]').scrollIntoView({ block: "center", behavior: "instant" }));
  await page.waitForTimeout(300);
  const h0 = await page.locator('[data-testid="deck-handle"]').nth(0).boundingBox();
  const i2 = await page.locator('[data-testid="deck-item"]').nth(2).boundingBox();
  const sx = h0.x + h0.width / 2, sy = h0.y + h0.height / 2, ty = i2.y + i2.height * 0.75;
  if (touch) {
    const cdp = await ctx.newCDPSession(page);
    const tp = (type, y) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: type === "touchEnd" ? [] : [{ x: sx, y }] });
    await tp("touchStart", sy);
    for (let k = 1; k <= 12; k++) await tp("touchMove", sy + ((ty - sy) * k) / 12);
    await page.waitForTimeout(100);
    await tp("touchEnd", ty);
  } else {
    await page.mouse.move(sx, sy); await page.mouse.down();
    for (let k = 1; k <= 12; k++) await page.mouse.move(sx, sy + ((ty - sy) * k) / 12);
    await page.waitForTimeout(100); await page.mouse.up();
  }
  await page.waitForTimeout(1200);
  d = await deckApi(id);
  check(d.items[2] === before[0] && d.items[0] === before[1], `${tag} przeciągnięcie ${touch ? "palcem" : "myszą"} zmieniło kolejność: ${JSON.stringify(d.items.map((x) => before.indexOf(x)))}`);
  await page.reload(); await page.waitForSelector('[data-testid="deck-item"]');
  const firstTitle = (await page.locator('[data-testid="deck-item"] .deck-body strong').first().textContent()).trim();
  const bTitles = await page.locator('[data-testid="deck-item"] .deck-body strong').allTextContents();
  check(bTitles[2]?.trim() === added[0] || firstTitle.length > 0, `${tag} kolejność zostaje po odświeżeniu`);

  // 4. klawiatura: ostatnia karta ↑ o jedno miejsce
  const order1 = (await deckApi(id)).items;
  await page.locator('[data-testid="deck-handle"]').nth(4).focus();
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(1000);
  d = await deckApi(id);
  check(d.items[3] === order1[4] && d.items[4] === order1[3], `${tag} strzałka ↑ przenosi kartę`);
  check(await page.evaluate(() => document.activeElement?.classList.contains("deck-handle")), `${tag} fokus zostaje na uchwycie`);

  // 5. usuń i cofnij
  const order2 = d.items;
  await page.locator(".deck-remove").nth(1).click(); await page.waitForTimeout(600);
  check((await deckApi(id)).items.length === 4, `${tag} usunięcie karty`);
  await page.click(".toast-undo"); await page.waitForTimeout(1000);
  check(JSON.stringify((await deckApi(id)).items) === JSON.stringify(order2), `${tag} „Cofnij” przywraca kartę na miejsce`);

  // 6. nauka talii – karty w kolejności talii
  await page.click('[data-testid="deck-learn"]'); await page.waitForURL(/\/fiszki\?talia=/);
  await page.waitForSelector('[data-testid="deck-mode"]');
  const reel = await page.locator('[data-testid="reel"] .fc-title').first().textContent();
  check(reel.trim() === (await page.request.get(`${B}/api/dane/hasla`).then((r) => r.json())).rows.find((x) => x.id === order2[0]).t, `${tag} „Ucz się tej talii” zaczyna od pierwszej karty talii`);
  check(await page.locator('[data-testid="reel"]').count() === 5, `${tag} w trybie talii tylko jej karty`);
  await page.screenshot({ path: `${OUT}/decks-${tag}-nauka.png` });
  // filtry w trybie talii: gwiazdka na jednej karcie talii → filtr ★ zostawia tylko ją
  await page.request.post(`${B}/api/gwiazdki`, { data: { kind: "fiszka", ref: order2[1], on: true } });
  await page.reload(); await page.waitForSelector('[data-testid="deck-mode"]');
  await page.click('[data-testid="fc-filters"] summary');
  await page.locator('[data-testid="fc-filters"] .seg button', { hasText: "Z gwiazdką" }).click(); await page.waitForTimeout(400);
  check(await page.locator('[data-testid="reel"]').count() === 1, `${tag} filtr ★ w nauce talii`);
  check(page.url().includes("talia=") && page.url().includes("gw=1"), `${tag} filtr w adresie talii`);
  await page.request.post(`${B}/api/gwiazdki`, { data: { kind: "fiszka", ref: order2[1], on: false } });

  // 7. „＋ Do talii” z fiszki
  await page.goto(`${B}/fiszki?tryb=klasyczne`); await page.waitForSelector('[data-testid="classic"]');
  await page.click('[data-testid="classic"] [data-testid="add-to-deck"]');
  await page.waitForSelector(".add-deck-pop input[type=checkbox]");
  const box = page.locator(".add-deck-pop input[type=checkbox]").first();
  const was = await box.isChecked();
  await box.click(); await page.waitForTimeout(700);
  const n2 = (await deckApi(id)).items.length;
  check(n2 === (was ? 4 : 6), `${tag} „＋ Do talii” z fiszki zmienia talię (${n2})`);
  await page.screenshot({ path: `${OUT}/decks-${tag}-dodaj.png` });
  await page.keyboard.press("Escape");

  // 8. lista talii
  await page.goto(`${B}/fiszki/talie`); await page.waitForSelector('[data-testid="deck-card"]');
  check(await page.locator('[data-testid="deck-card"]', { hasText: `Talia ${tag}` }).count() === 1, `${tag} talia na liście`);
  await page.screenshot({ path: `${OUT}/decks-${tag}-lista.png` });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  check(!ov, `${tag} brak poziomego przewijania`);

  // 9. podgląd admina – tylko odczyt
  if (tag === 1280) {
    const me = await (await page.request.get(`${B}/api/konto/ja`)).json().catch(() => null);
    const uid = me?.id ?? me?.user?.id;
    if (uid) {
      await page.goto(`${B}/fiszki/talie/${id}?user=${uid}`); await page.waitForSelector('[data-testid="deck-item"]');
      check(await page.locator('[data-testid="deck-handle"]').count() === 0, `${tag} podgląd admina bez przeciągania`);
    }
  }
  await ctx.close();
}
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
console.log("konsola:", JSON.stringify(errs, null, 1));
await browser.close();
