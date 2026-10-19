import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const errs = [];
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const page = await ctx.newPage();
page.on("pageerror", (e) => errs.push(`${page.url()} ${e.message}`));
await page.goto(`${B}/konto/logowanie`);
await page.fill('input[name="email"]', "drugi@example.com"); await page.fill('input[name="password"]', "nowe-haslo-123");
await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"));
await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith("owe:lesson:")) localStorage.removeItem(k); });
const pos = () => page.$eval(".learn-progress[role=progressbar]", (e) => Number(e.getAttribute("aria-valuenow"))).catch(() => -1);
/** Jedno ćwiczenie dalej (odpowiedź byle jaka). */
async function step(k) {
  const p0 = await pos();
  for (let t = 0; t < 12 && (await pos()) === p0; t++) {
    await page.waitForTimeout(120);
    if (await page.$(".learn-end")) return;
    const fb = await page.$(".learn-feedback button"); if (fb) { await fb.click(); continue; }
    const badge = (await page.$eval(".learn-badge", (e) => e.textContent).catch(() => "")) ?? "";
    if (await page.$(".learn-intro") || badge.startsWith("Nowe hasło")) { await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".buckets")) { for (const row of await page.$$(".bucket-row")) await (await row.$$(".seg button"))[0].click(); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".number-row")) { await page.fill("input.learn-input", "500"); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".pairs")) {
      for (const l of await page.$$(".pairs > div:first-child .pair:not([disabled])")) {
        for (let j = 0; ; j++) {
          const R = await page.$$(".pairs > div:last-child .pair:not([disabled])");
          if (!R.length || j >= R.length) break;
          await l.click(); await R[j].click(); await page.waitForTimeout(450);
          if (await l.isDisabled()) break;
        }
      }
      continue;
    }
    if (await page.$(".order-slots")) { while (await page.$(".chips .chip:not([disabled])")) await page.click(".chips .chip:not([disabled])"); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".flashcard")) { if (await page.$(".flashcard:not([disabled])")) await page.click(".flashcard"); await page.click(".tile.correct"); continue; }
    if (await page.$("input.learn-input")) { await page.fill("input.learn-input", "x"); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".chips .chip")) { await page.click(".chips .chip"); await page.click(".learn-actions .btn"); continue; }
    if (await page.$(".option")) { await page.click(".option"); await page.click(".learn-actions .btn"); continue; }
    const tiles = await page.$$(".tile:not([disabled])"); if (tiles.length) { await tiles[k % tiles.length].click(); const b = await page.$(".learn-actions .btn"); if (b) await b.click(); continue; }
  }
}

// ===== 1. test OWE: „Sprawdź” bez sieci nie zabija testu =====
const t = await (await page.request.post(`${B}/api/tests`, { data: { type: "single", count: 30 } })).json();
await page.goto(`${B}/test/${t.id}`); await page.waitForSelector(".option");
await page.locator(".option").first().click();
await ctx.setOffline(true);
await page.click('[data-testid="check"]');
await page.waitForSelector('[data-testid="test-error"]', { timeout: 30000 });
const msg = await page.locator('[data-testid="test-error"]').innerText();
check(/Brak połączenia/.test(msg), `polski komunikat: ${msg}`);
check(await page.locator(".option").count() === 4 && await page.locator(".question").count() === 1, "pytanie i odpowiedzi nadal na ekranie");
check(/Spróbuj ponownie/.test(await page.locator('[data-testid="check"]').innerText()), "przycisk „Spróbuj ponownie”");
await ctx.setOffline(false);
await page.click('[data-testid="check"]');
await page.waitForSelector(".feedback", { timeout: 30000 });
check(await page.locator('[data-testid="test-error"]').count() === 0, "po powrocie sieci odpowiedź zapisana");

// odpowiedź doszła do serwera, ale odpowiedź HTTP się zgubiła
await page.click("text=Dalej →"); await page.locator(".option").nth(1).click();
await page.route("**/api/tests/*/answer", async (route) => { await route.fetch(); await route.abort("failed"); });
await page.click('[data-testid="check"]');
await page.waitForSelector(".feedback", { timeout: 30000 }).catch(() => {});
await page.unroute("**/api/tests/*/answer");
check(await page.locator(".feedback").count() === 1 && await page.locator('[data-testid="test-error"]').count() === 0, "zgubiona odpowiedź HTTP – pokazany zapisany wynik, bez błędu");
const st = await (await page.request.get(`${B}/api/tests/${t.id}`)).json();
check(st.answers.length === 2, `na serwerze 2 odpowiedzi (${st.answers.length})`);

// wczytanie testu bez sieci → ekran z „Spróbuj ponownie” → po sieci test wraca
await page.route(`**/api/tests/${t.id}`, (r) => r.abort("failed"));
await page.reload(); await page.waitForSelector('[data-testid="test-load-error"]', { timeout: 40000 });
check(/Brak połączenia/.test(await page.locator('[data-testid="test-load-error"]').innerText()), "błąd wczytania po polsku");
await page.unroute(`**/api/tests/${t.id}`);
await page.click('[data-testid="test-load-error"] button.btn'); await page.waitForSelector(".option");
check(/Pytanie 3/.test(await page.locator(".bar").innerText()), "test wczytany od miejsca przerwania (pytanie 3)");
// zakończenie bez sieci – komunikat zamiast pustej strony; po sieci kończy
await ctx.setOffline(true);
page.once("dialog", (d) => d.accept());
await page.click("text=Zakończ test");
await page.waitForSelector('[data-testid="test-error"]', { timeout: 30000 });
check(await page.locator(".question").count() === 1, "nieudane zakończenie – test dalej na ekranie");
await ctx.setOffline(false);
page.once("dialog", (d) => d.accept());
await page.click("text=Zakończ test"); await page.waitForSelector("text=Wynik testu", { timeout: 30000 });
check(true, "");

// ===== 2. lekcja: koniec pod-lekcji bez sieci =====
const L = "mikro-rynek-1", SUB = 3;
await page.goto(`${B}/nauka/lekcja/${L}?sub=${SUB}`); await page.waitForSelector(".learn");
/** Do ostatniego ćwiczenia (kolejka rośnie przy błędach – liczona na bieżąco). */
async function toLast() {
  for (let k = 0; k < 80 && !(await page.$(".learn-end")); k++) {
    const [p, m] = await page.$eval(".learn-progress[role=progressbar]", (e) => [Number(e.getAttribute("aria-valuenow")), Number(e.getAttribute("aria-valuemax"))]);
    if (p >= m - 1) return;
    await step(k);
  }
}
const total = await page.$eval(".learn-progress[role=progressbar]", (e) => Number(e.getAttribute("aria-valuemax")));
await toLast();
await ctx.setOffline(true);
for (let k = 0; k < 8 && !(await page.$(".learn-end")); k++) await step(k);
if (!(await page.$(".learn-end"))) await page.screenshot({ path: `${process.argv[2] ?? "."}/off-lesson.png` });
await page.waitForSelector('[data-testid="lesson-save-error"]', { timeout: 40000 });
check(/nie został jeszcze zapisany/.test(await page.locator('[data-testid="lesson-save-error"]').innerText()), "lekcja: komunikat o niezapisanym wyniku");
const kept = await page.evaluate((k) => localStorage.getItem(k), `owe:lesson:${L}:${SUB}`);
check(!!kept, "lekcja: odpowiedzi zachowane w przeglądarce");
// zamknięcie i powrót z siecią – wynik zapisuje się sam (strona zamknięta jeszcze bez sieci, żeby nie zadziałało
// ponowienie zapisu po zdarzeniu „online” na otwartej stronie – wcześniej wyścig w teście)
await page.goto("about:blank");
await ctx.setOffline(false);
await page.goto(`${B}/nauka/lekcja/${L}?sub=${SUB}`);
await page.waitForSelector(".learn-end", { timeout: 40000 }).catch(async (e) => {
  await page.screenshot({ path: `${process.argv[2] ?? "."}/off-restore.png` });
  console.log("DEBUG", (await page.locator("main").innerText()).slice(0, 600), "\nLS", await page.evaluate((k) => localStorage.getItem(k)?.slice(0, 300), `owe:lesson:${L}:${SUB}`));
  throw e;
});
await page.waitForFunction(() => !document.querySelector('[data-testid="lesson-save-error"]') && !/Zapisywanie wyniku/.test(document.body.innerText), null, { timeout: 30000 }).catch(() => {});
check(await page.locator('[data-testid="lesson-save-error"]').count() === 0, "lekcja: po powrocie wynik zapisany");
check(!(await page.evaluate((k) => localStorage.getItem(k), `owe:lesson:${L}:${SUB}`)), "lekcja: zapis lokalny usunięty po sukcesie");
// online w trakcie ekranu końcowego – ponowienie bez przeładowania
await page.goto(`${B}/nauka/lekcja/${L}?sub=${SUB}`); await page.waitForSelector(".learn");
if (await page.$('[data-testid="resume-restart"]')) await page.click('[data-testid="resume-restart"]');
await toLast();
await ctx.setOffline(true);
for (let k = 0; k < 8 && !(await page.$(".learn-end")); k++) await step(k);
if (!(await page.$(".learn-end"))) await page.screenshot({ path: `${process.argv[2] ?? "."}/off-lesson.png` });
await page.waitForSelector('[data-testid="lesson-save-error"]', { timeout: 40000 });
await ctx.setOffline(false);
await page.waitForSelector('[data-testid="lesson-save-error"]', { state: "detached", timeout: 30000 }).catch(() => {});
check(await page.locator('[data-testid="lesson-save-error"]').count() === 0, "lekcja: zapis sam po powrocie sieci");

// start lekcji bez sieci: ćwiczenia działają, postęp zachowany po zamknięciu, wynik zapisany na końcu
await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (k.startsWith("owe:lesson:")) localStorage.removeItem(k); });
const L2 = "mikro-podstawy-1", S2 = 2;
await page.route("**/api/nauka/sessions", (r) => (r.request().method() === "POST" ? r.abort("failed") : r.continue()));
await page.goto(`${B}/nauka/lekcja/${L2}?sub=${S2}`); await page.waitForSelector(".learn");
check(/wynik zapisze się na końcu/.test(await page.locator(".learn").innerText()), "start bez sieci: łagodny komunikat");
for (let k = 0; k < 3; k++) await step(k);
check(!!(await page.evaluate((k) => localStorage.getItem(k), `owe:lesson:${L2}:${S2}`)), "start bez sieci: postęp w przeglądarce");
await page.unroute("**/api/nauka/sessions");
await page.reload(); await page.waitForSelector('[data-testid="resume-offer"]', { timeout: 40000 });
await page.click('[data-testid="resume-continue"]'); await page.waitForSelector(".learn");
for (let k = 0; k < 60 && !(await page.$(".learn-end")); k++) await step(k);
if (!(await page.$(".learn-end"))) await page.screenshot({ path: `${process.argv[2] ?? "."}/off-l2.png` });
await page.waitForSelector(".learn-end", { timeout: 40000 });
await page.waitForFunction(() => !/Zapisywanie wyniku/.test(document.body.innerText), null, { timeout: 30000 }).catch(() => {});
check(await page.locator('[data-testid="lesson-save-error"]').count() === 0 && /korona|Poziom|poziom/i.test(await page.locator(".learn-end").innerText()), "start bez sieci: wynik zapisany na końcu");

// ===== 3. strony z danymi: błąd wczytania z „Spróbuj ponownie” =====
await page.route("**/api/stats?*", (r) => r.abort("failed"));
await page.goto(`${B}/stats`); await page.waitForSelector('[data-testid="load-error"]', { timeout: 40000 });
check(/Brak połączenia/.test(await page.locator('[data-testid="load-error"]').innerText()), "statystyki: błąd po polsku z przyciskiem");
await page.unroute("**/api/stats?*");
await page.click('[data-testid="load-error"] button'); await page.waitForSelector("text=Postęp", { timeout: 40000 });
check(true, "");
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails, null, 1), JSON.stringify(errs.slice(0, 5)));
