import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const errs = [];
for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 800 }]) {
  const tag = vp.width;
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 600 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errs.push(`${tag} ${page.url()} ${e.message}`));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', "owner@example.com"); await page.fill('input[name="password"]', "haslo-wlasciciela");
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
  const stars = async () => new Set(await (await page.request.get(`${B}/api/gwiazdki?rodzaj=fiszka`)).json());
  for (const r of await stars()) await page.request.post(`${B}/api/gwiazdki`, { data: { kind: "fiszka", ref: r, on: false } });

  // 1. feed: gwiazdka na karcie, nie odwraca jej; brak gwiazdki w pasku
  await page.goto(`${B}/fiszki`); await page.waitForSelector('[data-testid="reel"]');
  const reel = page.locator('[data-testid="reel"]').first();
  check(await reel.locator(".fc-wrap .fc-star").count() === 1, `${tag} gwiazdka na karcie (feed)`);
  check(await reel.locator(".reel-bar [data-testid=star]").count() === 0, `${tag} bez gwiazdki w pasku`);
  const sb = await reel.locator(".fc-star").boundingBox(), cb = await reel.locator(".fc").boundingBox();
  check(sb.x + sb.width <= cb.x + cb.width && sb.x + sb.width > cb.x + cb.width - 24 && sb.y >= cb.y && sb.y < cb.y + 24, `${tag} gwiazdka w prawym górnym rogu karty`);
  const wb = await reel.locator(".fc-wrap").boundingBox(); check(Math.abs(wb.width - cb.width) < 2, `${tag} karta na całą szerokość (${cb.width}/${wb.width})`);
  await reel.locator(".fc-star").click(); await page.waitForTimeout(400);
  check(await reel.locator(".fc.back").count() === 0, `${tag} gwiazdka nie odwraca karty`);
  const name = (await reel.locator(".fc-title").innerText()).trim();
  const s1 = await stars();
  check(s1.size === 1, `${tag} gwiazdka zapisana`);
  const id = [...s1][0];
  // tytuł nie wchodzi pod gwiazdkę
  const tb = await reel.locator(".concept-tags").boundingBox();
  check(tb.x + tb.width <= sb.x + 2 || tb.y > sb.y + sb.height, `${tag} tagi nie pod gwiazdką`);
  // 2. link do mapy: zwykłe stuknięcie nie przenosi
  check(await reel.locator(".fc-map").count() === 0, `${tag} brak linku mapy na karcie`);
  await reel.locator(".fc").click(); await page.waitForTimeout(300);
  check(await reel.locator(".fc a").count() === 0, `${tag} na odwrocie brak linku`);
  await reel.locator('[data-testid="map-link"]').click(); await page.waitForTimeout(300);
  check(page.url().includes("/fiszki"), `${tag} 🧠 nie przenosi od razu`);
  const pop = await reel.locator('[data-testid="map-pop"]').boundingBox();
  const fb = await page.locator('[data-testid="feed"]').boundingBox();
  check(pop && pop.x >= fb.x && pop.x + pop.width <= fb.x + fb.width, `${tag} dymek mieści się na ekranie ${JSON.stringify(pop)} ${JSON.stringify(await reel.locator('[data-testid="map-link"]').boundingBox())}`);
  await page.mouse.click(5, vp.height / 2); await page.waitForTimeout(200);
  check(await page.locator('[data-testid="map-pop"]').count() === 0, `${tag} dymek zamyka się po kliknięciu obok`);
  await reel.locator('[data-testid="map-link"]').click();
  await page.click('[data-testid="map-open"]'); await page.waitForURL(/\/pojecia\/mapa/);
  check(true, "");
  // 3. mapa: karta pojęcia pokazuje gwiazdkę jako włączoną
  await page.goto(`${B}/pojecia/mapa?q=${id}`); await page.waitForSelector('[data-testid="mm-card"]');
  const ms = page.locator('[data-testid="mm-card"] [data-testid="star"]');
  check(await ms.getAttribute("aria-pressed") === "true", `${tag} mapa: gwiazdka włączona`);
  await ms.click(); await page.waitForTimeout(400);
  check(!(await stars()).has(id), `${tag} mapa: zdjęcie gwiazdki`);
  // 4. tabela: gwiazdka w wierszu i filtr
  await page.goto(`${B}/pojecia?q=${encodeURIComponent(name)}`); await page.waitForSelector(`#h-${CSS_ESC(id)}`).catch(() => {});
  const row = page.locator(`[id="h-${id}"]`);
  await row.locator('[data-testid="star"]').click(); await page.waitForTimeout(400);
  check((await stars()).has(id), `${tag} tabela: gwiazdka zapisana`);
  await page.fill('input[type="search"]', "");
  await page.locator(".seg button", { hasText: "Z gwiazdką" }).click(); await page.waitForTimeout(300);
  check(await page.locator(".concept-row:not(.head)").count() === 1, `${tag} tabela: filtr ★`);
  const mp = await row.locator(".concept-map").boundingBox(), sp = await row.locator(".concept-tags > *:not(.concept-map)").last().boundingBox();
  check(mp.y > sp.y + 2 || mp.x - (sp.x + sp.width) >= 12, `${tag} tabela: 🧠 mapa odsunięta`);
  // 5. klasyczne: gwiazdka na karcie i klawisz G
  if (tag === 1280) {
    await page.goto(`${B}/fiszki?tryb=klasyczne`); await page.waitForSelector('[data-testid="classic-card"]').catch(() => {});
    if (await page.locator('[data-testid="classic-card"]').count()) {
      check(await page.locator(".classic .fc-wrap .fc-star").count() === 1, `${tag} klasyczne: gwiazdka na karcie`);
      check(await page.locator(".classic > .row [data-testid=star]").count() === 0, `${tag} klasyczne: bez dubla`);
    } else fails.push("brak trybu klasycznego pod ?tryb=klasyczne");
  }
  check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${tag} brak poziomego przewijania`);
  await page.request.post(`${B}/api/gwiazdki`, { data: { kind: "fiszka", ref: id, on: false } });
  await ctx.close();
}
function CSS_ESC(s) { return s.replace(/[^\w-]/g, "\\$&"); }
await browser.close();
console.log(`OK ${ok}`, fails.length ? `\nFAIL:\n${fails.join("\n")}` : "", errs.length ? `\nERR:\n${errs.slice(0, 5).join("\n")}` : "");
