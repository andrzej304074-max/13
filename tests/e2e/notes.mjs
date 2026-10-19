import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const errs = [];
for (const vp of [{ width: 1280, height: 900 }, { width: 430, height: 900 }]) {
  const tag = vp.width;
  const ctx = await browser.newContext({ viewport: vp, hasTouch: vp.width < 600 });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && errs.push(`${tag} ${page.url()} ${m.text()}`));
  page.on("pageerror", (e) => errs.push(`${tag} ${page.url()} ${e.message}`));
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', "owner@example.com"); await page.fill('input[name="password"]', "haslo-wlasciciela");
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
  if (tag === 1280) for (const k of ["note", "scratch"]) for (const x of await (await page.request.get(`${B}/api/notatki?rodzaj=${k}`)).json()) await page.request.delete(`${B}/api/notatki/${x.id}`);
  const saved = async () => { await page.waitForFunction(() => /Zapisano/.test(document.querySelector('[data-testid="save-status"]')?.textContent ?? ""), null, { timeout: 8000 }).catch(() => {}); };
  const draw = async (x0, y0, x1, y1) => {
    const c = await page.locator('[data-testid="ink-canvas"]').first().boundingBox();
    await page.mouse.move(c.x + x0, c.y + y0); await page.mouse.down();
    for (let i = 1; i <= 12; i++) await page.mouse.move(c.x + x0 + ((x1 - x0) * i) / 12, c.y + y0 + ((y1 - y0) * i) / 12);
    await page.mouse.up();
  };

  // 1. nowa notatka: tekst + rysunek, autozapis, po odświeżeniu zostaje
  await page.goto(`${B}/notatki`);
  await page.click('[data-testid="note-new"]');
  await page.waitForURL(/\/notatki\/[0-9a-f-]{36}/);
  await page.waitForSelector('[data-testid="notes-editor"]');
  const id = page.url().split("/").pop();
  await page.fill(".ne-title", `Test ${tag}`);
  await page.fill(".ne-text", "Elastyczność = %ΔQ / %ΔP\ndruga linia");
  // jedna kartka: tekst i płótno zajmują ten sam obszar
  const tb = await page.locator(".ne-text").first().boundingBox(), cb = await page.locator('[data-testid="ink-canvas"]').first().boundingBox();
  check(Math.abs(tb.y - cb.y) < 3 && Math.abs(tb.x - cb.x) < 3 && Math.abs(tb.width - cb.width) < 3, `${tag} tekst i rysunek na tej samej kartce`);
  // linia tekstu to stały ułamek szerokości kartki (tekst łamie się tak samo na telefonie i komputerze)
  const ratio = await page.evaluate(() => { const t = document.querySelector(".ne-text"); return parseFloat(getComputedStyle(t).lineHeight) / t.clientWidth; });
  check(Math.abs(ratio - 0.056) < 0.002, `${tag} interlinia = 5,6% szerokości kartki (${ratio.toFixed(4)})`);
  await page.click('.ne-tools button[title^="Pióro"]');
  await draw(40, 60, 220, 120);
  await draw(60, 160, 260, 160);
  await saved();
  let n = await (await page.request.get(`${B}/api/notatki/${id}`)).json();
  check(n.title === `Test ${tag}` && n.body.startsWith("Elastyczność") && n.ink.s.length === 2, `${tag} notatka zapisana (tytuł, tekst, 2 kreski): ${JSON.stringify({ t: n.title, s: n.ink?.s?.length })}`);
  await page.screenshot({ path: `${OUT}/notes-${tag}-edytor.png` });
  // gumka + cofnij
  await page.click('.ne-tools button[title^="Gumka"]');
  await draw(130, 40, 130, 140);
  await saved(); await page.waitForTimeout(900);
  n = await (await page.request.get(`${B}/api/notatki/${id}`)).json();
  check(n.ink.s.length === 1, `${tag} gumka usunęła kreskę (${n.ink.s.length})`);
  await page.click('.ne-tools button[title^="Cofnij"]');
  await page.waitForTimeout(1200); await saved();
  n = await (await page.request.get(`${B}/api/notatki/${id}`)).json();
  check(n.ink.s.length === 2, `${tag} cofnij przywróciło kreskę (${n.ink.s.length})`);
  // w trybie pióra zwykły klawisz przełącza na tekst i dopisuje znak na końcu
  await page.click('.ne-tools button[title^="Pióro"]');
  await draw(250, 120, 280, 130);
  await page.keyboard.type("XY");
  check(await page.locator('.ne-tools button[title^="Tekst"]').getAttribute("aria-pressed") === "true", `${tag} pisanie w trybie pióra przełącza na tekst`);
  check((await page.inputValue(".ne-text")).endsWith("XY"), `${tag} znaki z klawiatury dopisane na kartce`);
  // tryb tekstu: kliknięcie w kartkę daje kursor w tekście (płótno nie rysuje)
  await saved(); await page.waitForTimeout(900);
  const before = (await (await page.request.get(`${B}/api/notatki/${id}`)).json()).ink.s.length;
  await draw(100, 300, 200, 320);
  check(await page.evaluate(() => document.activeElement?.classList.contains("ne-text")), `${tag} w trybie tekstu kartka przyjmuje tekst`);
  await saved(); await page.waitForTimeout(900);
  check((await (await page.request.get(`${B}/api/notatki/${id}`)).json()).ink.s.length === before && before === 3, `${tag} kreska pióra zapisana, w trybie tekstu brak nowej (${before})`);
  await page.reload(); await page.waitForSelector(".ne-text");
  check((await page.inputValue(".ne-text")).includes("druga linia"), `${tag} tekst po odświeżeniu`);
  // gwiazdka + filtry
  await page.click('.note-page-head [data-testid="star"]'); await page.waitForTimeout(500);
  const starred = await (await page.request.get(`${B}/api/notatki?rodzaj=note&gw=1`)).json();
  check(starred.some((x) => x.id === id), `${tag} notatka z gwiazdką w filtrze ★`);
  const unst = await (await page.request.get(`${B}/api/notatki?rodzaj=note&gw=0`)).json();
  check(!unst.some((x) => x.id === id), `${tag} notatka z gwiazdką nie ma jej w filtrze ☆`);
  await page.goto(`${B}/notatki?gw=1`); await page.waitForSelector('[data-testid="note-card"]');
  check(await page.locator('[data-testid="note-card"]', { hasText: `Test ${tag}` }).count() === 1, `${tag} lista ★ pokazuje notatkę`);
  await page.screenshot({ path: `${OUT}/notes-${tag}-lista.png` });

  // 2. brudnopis w teście: pisanie nie wybiera odpowiedzi, autozapis, widać w Brudnopisach
  await page.goto(`${B}/`); await page.click('button.btn:has-text("Rozpocznij test")'); await page.waitForSelector("button.option");
  const toggle = page.locator('[data-testid="scratch-toggle"]');
  if ((await toggle.getAttribute("aria-expanded")) !== "true") await toggle.click();
  await page.waitForSelector(".q-scratch .ne-text");
  await page.fill(".q-scratch .ne-text", "");
  await page.click('.q-scratch .ne-tools button[title^="Tekst"]');
  await page.click(".q-scratch .ne-text");
  await page.keyboard.type("2+2=4\n1 3");
  await page.keyboard.press("Enter");
  check(await page.locator("button.option.selected").count() === 0, `${tag} pisanie w brudnopisie nie zaznacza odpowiedzi`);
  check(await page.locator("button.option.correct, button.option.wrong").count() === 0, `${tag} Enter w brudnopisie nie sprawdza pytania`);
  await page.click('.q-scratch .ne-tools button[title^="Pióro"]');
  await draw(30, 40, 200, 90);
  await saved();
  await page.screenshot({ path: `${OUT}/notes-${tag}-test.png`, fullPage: true });
  await page.goto(`${B}/notatki/brudnopisy`); await page.waitForSelector('[data-testid="note-card"]');
  check(await page.locator('[data-testid="note-card"]', { hasText: "OWE" }).count() >= 1, `${tag} brudnopis testu w Brudnopisach z treścią pytania`);

  // 3. brudnopis w lekcji (zostaje otwarty), klawisze 1–4 nie wybierają kafelków
  await page.goto(`${B}/nauka/lekcja/mikro-rynek-1?sub=2`); await page.waitForSelector(".learn");
  for (let i = 0; i < 6 && !(await page.locator(".q-scratch").count()); i++) {
    const nx = page.locator('.learn .btn:has-text("Dalej"), .learn .btn:has-text("Rozumiem")').first();
    if (await nx.count()) await nx.click(); else break;
    await page.waitForTimeout(300);
  }
  if (await page.locator(".q-scratch").count()) {
    await page.waitForSelector(".q-scratch .ne-text", { timeout: 8000 }).catch(() => {});
    check(await page.locator(".q-scratch .ne-text").count() === 1, `${tag} brudnopis lekcji otwarty (pamięta stan)`);
    await page.click('.q-scratch .ne-tools button[title^="Tekst"]');
    await page.click(".q-scratch .ne-text"); await page.keyboard.type("1 2 3 4");
    check(await page.locator(".tile.selected, .chip.selected").count() === 0, `${tag} klawisze 1–4 w brudnopisie lekcji nie wybierają`);
    await saved();
    await page.screenshot({ path: `${OUT}/notes-${tag}-lekcja.png`, fullPage: true });
  } else fails.push(`${tag} brak brudnopisu w lekcji`);

  // 4. szybki panel: otwórz, nowa notatka, przejdź na inną stronę, zminimalizuj, przywróć
  await page.goto(`${B}/pojecia`);
  await page.click('[data-testid="qn-btn"]'); await page.waitForSelector('[data-testid="qn-panel"]');
  await page.click('[data-testid="qn-new"]'); await page.waitForSelector('[data-testid="qn-panel"] .ne-text');
  await page.fill('[data-testid="qn-panel"] .ne-title', `Szybka ${tag}`);
  await page.fill('[data-testid="qn-panel"] .ne-text', "Myśl w trakcie nauki");
  await saved();
  await page.click(vp.width < 600 ? 'nav.bottom-bar a:has-text("Statystyki")' : 'nav.sections a:has-text("Statystyki")');
  await page.waitForURL(/\/stats/);
  check(await page.locator('[data-testid="qn-panel"] .ne-text').inputValue() === "Myśl w trakcie nauki", `${tag} panel zostaje otwarty po przejściu na inną stronę`);
  await page.screenshot({ path: `${OUT}/notes-${tag}-panel.png` });
  await page.click('[data-testid="qn-min"]');
  check(!(await page.locator('[data-testid="qn-panel"]').isVisible()), `${tag} minimalizacja chowa panel`);
  await page.click('[data-testid="qn-btn"]');
  check(await page.locator('[data-testid="qn-panel"] .ne-text').inputValue() === "Myśl w trakcie nauki", `${tag} przywrócony panel ma treść`);
  await page.click('[data-testid="qn-close"]');
  const all = await (await page.request.get(`${B}/api/notatki?rodzaj=note`)).json();
  check(all.filter((x) => x.title === `Szybka ${tag}`).length === 1, `${tag} szybka notatka zapisana raz`);

  // 5. gwiazdka fiszki + filtr
  await page.goto(`${B}/fiszki`); await page.waitForSelector('[data-testid="reel"]');
  const first = await page.locator('[data-testid="reel"] .fc-title').first().textContent();
  const st = page.locator('[data-testid="reel"] [data-testid="star"]').first();
  const was = (await st.getAttribute("aria-pressed")) === "true";
  if (!was) { await st.click(); await page.waitForTimeout(600); }
  await page.goto(`${B}/fiszki?gw=1`); await page.waitForSelector('[data-testid="reel"], .empty-state');
  check(await page.locator('[data-testid="reel"] .fc-title', { hasText: first }).count() >= 1, `${tag} fiszka z gwiazdką w filtrze ★`);
  await page.goto(`${B}/fiszki?gw=0`); await page.waitForSelector('[data-testid="reel"]');
  check(await page.locator('[data-testid="reel"] .fc-title').first().textContent() !== first, `${tag} filtr ☆ pomija fiszkę z gwiazdką`);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  check(!ov, `${tag} fiszki bez poziomego przewijania`);
  if (tag === 1280) {
    // podgląd admina: właściciel (admin) czyta notatki innego użytkownika, zapis cudzej notatki niemożliwy
    const users = await (await page.request.get(`${B}/api/admin/uzytkownicy`)).json();
    const other = (users.users ?? users).find?.((u) => u.email !== "owner@example.com");
    if (other) {
      const r = await page.request.get(`${B}/api/notatki?rodzaj=note&user=${other.id}`);
      check(r.ok() && Array.isArray(await r.json()), `podgląd admina: lista notatek użytkownika (${r.status()})`);
      const mine = (await (await page.request.get(`${B}/api/notatki?rodzaj=note`)).json())[0];
      await page.goto(`${B}/notatki?user=${other.id}`); await page.waitForSelector(".preview-banner, .empty-state, [data-testid='note-card']");
      check(await page.locator('[data-testid="note-new"]').count() === 0, "podgląd admina: bez przycisku nowej notatki");
      if (mine) check((await page.request.get(`${B}/api/notatki/${mine.id}?user=${other.id}`)).status() === 404, "podgląd admina: nie widać własnej notatki jako cudzej");
    } else fails.push("brak drugiego użytkownika do podglądu admina");
  }
  await ctx.close();
}
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
console.log("konsola:", JSON.stringify(errs.slice(0, 10), null, 1));
await browser.close();
