// G11: notatki – linia prosta, krzywa Béziera z punktami kontrolnymi, cofnij/ponów kształtów, pełny ekran.
import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const errs = [];

for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
  const tag = vp.width < 500 ? "telefon" : "komputer";
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 500 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(e.message));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', "drugi@example.com"); await page.fill('input[name="password"]', "nowe-haslo-123");
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"));
  await page.goto(`${B}/notatki`);
  await page.click('[data-testid="note-new"]');
  await page.waitForURL(/\/notatki\/[0-9a-f-]{36}/);
  await page.waitForSelector('[data-testid="notes-editor"]');
  const id = page.url().split("/").pop();
  const canvas = page.locator('[data-testid="ink-canvas"]').first();
  await canvas.scrollIntoViewIfNeeded();
  const c = await canvas.boundingBox();
  const L = (x) => (x / 1000) * c.width; // jednostki logiczne → piksele
  const drag = async (x0, y0, x1, y1, shift = false) => {
    if (shift) await page.keyboard.down("Shift");
    await page.mouse.move(c.x + x0, c.y + y0); await page.mouse.down();
    for (let i = 1; i <= 8; i++) await page.mouse.move(c.x + x0 + ((x1 - x0) * i) / 8, c.y + y0 + ((y1 - y0) * i) / 8);
    await page.mouse.up();
    if (shift) await page.keyboard.up("Shift");
  };
  const saved = async () => {
    await page.waitForFunction(() => /Zapisano/.test(document.querySelector('[data-testid="save-status"]')?.textContent ?? ""), null, { timeout: 8000 }).catch(() => {});
    return (await (await page.request.get(`${B}/api/notatki/${id}`)).json()).ink.s;
  };

  // 1. linia prosta; z Shiftem kąt przyciąga do poziomu
  await page.click('[data-testid="tool-line"]');
  await drag(L(100), L(100), L(500), L(112), true);
  let s = await saved();
  check(s.length === 1 && s[0].t === "l" && s[0].p.length === 6, `${tag}: linia zapisana jako odcinek (${JSON.stringify(s[0])})`);
  check(s[0] && Math.abs(s[0].p[1] - s[0].p[4]) <= 2, `${tag}: Shift – linia pozioma`);

  // 2. krzywa: przeciągnij, wygnij punktem kontrolnym, zatwierdź
  await page.click('[data-testid="tool-curve"]');
  await drag(L(100), L(300), L(700), L(300));
  check(await page.locator('[data-testid="curve-ok"]').isVisible(), `${tag}: krzywa w edycji – przycisk zatwierdzenia`);
  await drag(L(300), L(300), L(300), L(120)); // punkt kontrolny w 1/3
  await page.click('[data-testid="curve-ok"]');
  s = await saved();
  const b = s.find((x) => x.t === "b");
  check(b && b.p.length === 12, `${tag}: krzywa zapisana (4 punkty)`);
  check(b && b.p[4] < 200 && b.p[1] >= 290, `${tag}: punkt kontrolny przesunięty, koniec w miejscu (${b && b.p.slice(0, 6)})`);
  check(await page.locator('[data-testid="curve-ok"]').count() === 0, `${tag}: po zatwierdzeniu bez uchwytów`);

  // 3. cofnij / ponów kształtów
  await page.click('[data-testid="ink-undo"]');
  s = await saved();
  check(s.length === 1 && s[0].t === "l", `${tag}: cofnij usuwa krzywą`);
  await page.click('[data-testid="ink-redo"]');
  s = await saved();
  check(s.length === 2 && s[1].t === "b", `${tag}: ponów przywraca krzywą`);
  // krzywa odrzucona przed zatwierdzeniem nie trafia do rysunku
  await page.click('[data-testid="tool-curve"]');
  await drag(L(100), L(450), L(600), L(450));
  await page.click('[data-testid="curve-cancel"]');
  s = await saved();
  check(s.length === 2, `${tag}: odrzucona krzywa nie zapisana`);

  // 4. gumka trafia w linię
  await page.click('button[title^="Gumka"]');
  await drag(L(300), L(95), L(300), L(110));
  s = await saved();
  check(s.length === 1 && s[0].t === "b", `${tag}: gumka ściera linię`);

  // 5. pełny ekran
  await page.click('[data-testid="ink-full"]');
  await page.waitForTimeout(400);
  const box = await page.locator('[data-testid="notes-editor"]').boundingBox();
  check(box && box.width >= vp.width - 2 && Math.round(box.y) <= 1, `${tag}: pełny ekran zakrywa okno (${box && [box.x, box.y, box.width]})`);
  check(await page.locator(".notes-editor.ne-full").count() === 1, `${tag}: klasa pełnego ekranu`);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  if (await page.locator(".notes-editor.ne-full").count()) await page.click('[data-testid="ink-full"]');
  check(await page.locator(".notes-editor.ne-full").count() === 0, `${tag}: wyjście z pełnego ekranu`);

  await page.request.delete(`${B}/api/notatki/${id}`);
  await ctx.close();
}
await browser.close();
console.log(fails.length ? "BŁĘDY:" : "OK:", ok, "błędów:", fails.length, fails, errs.length ? `pageerror: ${errs}` : "");
process.exit(fails.length ? 1 : 0);
