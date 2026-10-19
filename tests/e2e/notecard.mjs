import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const errs = [];
for (const vp of [{ width: 1280, height: 900 }, { width: 430, height: 900 }]) {
  const tag = vp.width;
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 600 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(`${tag} ${page.url()} ${e.message}`));
  page.on("console", (m) => m.type() === "error" && errs.push(`${tag} ${m.text()}`));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', "owner@example.com"); await page.fill('input[name="password"]', "haslo-wlasciciela");
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
  const saved = async () => { await page.waitForTimeout(300); await page.waitForFunction(() => /Zapisano/.test(document.querySelector('[data-testid="save-status"]')?.textContent ?? ""), null, { timeout: 8000 }).catch(() => {}); };
  await page.goto(`${B}/notatki`);
  await page.click('[data-testid="note-new"]');
  await page.waitForURL(/\/notatki\/[0-9a-f-]{36}/);
  await page.waitForSelector('[data-testid="notes-editor"]');
  const id = page.url().split("/").pop();
  await page.fill(".ne-text", "Tekst pod fiszką");
  await page.click('[data-testid="note-card-add"]');
  await page.waitForSelector('[data-testid="note-card-results"] button');
  await page.fill('[data-testid="note-card-search"]', "popyt");
  await page.waitForTimeout(200);
  const first = await page.locator('[data-testid="note-card-results"] button').first().innerText();
  await page.locator('[data-testid="note-card-results"] button').first().click();
  await page.waitForSelector('[data-testid="note-card"]');
  check((await page.locator('[data-testid="note-card"]').count()) === 1, `${tag} fiszka na kartce`);
  check((await page.locator('[data-testid="note-card"]').innerText()).includes(first.split("\n")[0].replace("✍️ ", "")), `${tag} tytuł fiszki`);
  // odwrócenie
  await page.locator(".note-card-body").click();
  check(await page.locator(".note-card.back").count() === 1, `${tag} dotknięcie odwraca na definicję`);
  // przesuwanie uchwytem
  const before = await page.locator('[data-testid="note-card"]').boundingBox();
  const h = await page.locator('[data-testid="note-card-handle"]').boundingBox();
  await page.mouse.move(h.x + h.width / 2, h.y + h.height / 2); await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(h.x + h.width / 2 - 8 * i, h.y + h.height / 2 + 15 * i);
  await page.mouse.up();
  const after = await page.locator('[data-testid="note-card"]').boundingBox();
  check(after.y - before.y > 100, `${tag} przesunięcie w dół (${(after.y - before.y).toFixed(0)})`);
  // przeciąganie samej karty (nie uchwytu) nie przesuwa
  const b = await page.locator(".note-card-body").boundingBox();
  await page.mouse.move(b.x + 20, b.y + 20); await page.mouse.down(); await page.mouse.move(b.x + 120, b.y + 120, { steps: 5 }); await page.mouse.up();
  const after2 = await page.locator('[data-testid="note-card"]').boundingBox();
  check(Math.abs(after2.y - after.y) < 2, `${tag} bez uchwytu karta stoi`);
  await saved();
  const n = await (await page.request.get(`${B}/api/notatki/${id}`)).json();
  const nn = n.note ?? n;
  check(nn.cards?.length === 1 && nn.cards[0].y > 0, `${tag} zapis pozycji ${JSON.stringify(nn.cards)}`);
  // po odświeżeniu na tym samym miejscu (względem kartki)
  const sheet0 = await page.locator(".ne-canvas-wrap").boundingBox();
  await page.reload(); await page.waitForSelector('[data-testid="note-card"]');
  const sheet1 = await page.locator(".ne-canvas-wrap").boundingBox();
  const re = await page.locator('[data-testid="note-card"]').boundingBox();
  check(Math.abs((re.y - sheet1.y) - (after2.y - sheet0.y)) < 3, `${tag} pozycja po odświeżeniu`);
  check((await page.inputValue(".ne-text")).includes("Tekst pod fiszką"), `${tag} tekst zachowany`);
  // ✕ usuwa
  await page.click('[data-testid="note-card-remove"]');
  check(await page.locator('[data-testid="note-card"]').count() === 0, `${tag} ✕ usuwa`);
  await saved();
  const n2 = await (await page.request.get(`${B}/api/notatki/${id}`)).json();
  check(((n2.note ?? n2).cards ?? []).length === 0, `${tag} usunięcie zapisane`);
  // poziomy scroll strony brak
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${tag} brak poziomego przewijania`);
  await page.request.delete(`${B}/api/notatki/${id}`);
  await ctx.close();
}
await browser.close();
console.log(`OK ${ok}`, fails.length ? `\nFAIL:\n${fails.join("\n")}` : "", errs.length ? `\nERR:\n${errs.slice(0, 5).join("\n")}` : "");
