// G1: sprawdzenie bez zaznaczenia (0 pkt + poprawna odpowiedź), przyciski ← i →, „do góry” na każdej stronie
import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(e.message));
await p.goto(`${B}/konto/logowanie`);
await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));

// 1. jednokrotny wybór bez zaznaczenia
for (const type of ["single", "multi"]) {
  const t = await (await p.request.post(`${B}/api/tests`, { data: { type, count: 30 } })).json();
  await p.goto(`${B}/test/${t.id}`); await p.waitForSelector(".option");
  const btn = p.locator('[data-testid="check"]');
  check(await btn.isEnabled() && /0 pkt/.test(await btn.innerText()), `${type}: „Sprawdź (0 pkt)” aktywne bez zaznaczenia`);
  await btn.click(); await p.waitForSelector(".feedback");
  check(await p.locator(".option.correct, .option.missed").count() >= 1, `${type}: pokazana poprawna odpowiedź`);
  const st = await (await p.request.get(`${B}/api/tests/${t.id}`)).json();
  check(st.answers.length === 1 && st.answers[0].points === 0 && !st.answers[0].skipped, `${type}: zapisane 0 pkt, nie „pominięte” (${JSON.stringify(st.answers[0])})`);
  check(st.score === 0, `${type}: wynik 0`);
  await p.request.post(`${B}/api/tests/${t.id}/finish`);
}
// API: dwie odpowiedzi w jednokrotnym nadal błędem
const t2 = await (await p.request.post(`${B}/api/tests`, { data: { type: "single", count: 30 } })).json();
const two = await p.request.post(`${B}/api/tests/${t2.id}/answer`, { data: { questionId: t2.questions[0].id, selected: [0, 1] } });
check(two.status() === 400, `dwie odpowiedzi w jednokrotnym → 400 (${two.status()})`);
// bez limitu: kolejność nadal pilnowana
const te = await (await p.request.post(`${B}/api/tests`, { data: { type: "single", count: "endless" } })).json();
const skipAhead = await p.request.post(`${B}/api/tests/${te.id}/answer`, { data: { questionId: te.questions[1]?.id ?? "x", selected: [0] } });
check(skipAhead.status() === 409 || skipAhead.status() === 400, `bez limitu: przeskoczenie pytania → błąd (${skipAhead.status()})`);
const first = await (await p.request.post(`${B}/api/tests/${te.id}/answer`, { data: { questionId: te.questions[0].id, selected: [] } })).json();
check(first.points === 0 && first.totalScore === 0, "bez limitu: puste zaznaczenie – 0 pkt");
const again = await p.request.post(`${B}/api/tests/${te.id}/answer`, { data: { questionId: te.questions[0].id, selected: [0] } });
check(again.status() === 409, `ponowna odpowiedź → 409 (${again.status()})`);
await p.request.post(`${B}/api/tests/${t2.id}/finish`); await p.request.post(`${B}/api/tests/${te.id}/finish`);

// 2. ← i →
await p.goto(`${B}/nauka`); await p.waitForLoadState("networkidle");
await p.goto(`${B}/pojecia`); await p.waitForLoadState("networkidle");
check(await p.locator('[data-testid="forward"]').count() === 0, "→ niewidoczne bez cofnięcia");
await p.click('[data-testid="back"]'); await p.waitForURL(/\/nauka$/);
await p.waitForSelector('[data-testid="forward"]');
await p.click('[data-testid="forward"]'); await p.waitForURL(/\/pojecia$/);
check(true, "← potem → wraca na /pojecia");
await p.waitForTimeout(300);
check(await p.locator('[data-testid="forward"]').count() === 0, "→ znika po przejściu dalej");
// zwykły link do poprzedniej strony (nie „wstecz”) – nowy krok, bez „→” prowadzącego donikąd
await p.goto(`${B}/nauka`); await p.waitForLoadState("networkidle");
await p.locator('a[href="/pojecia"]:visible').first().click(); await p.waitForURL(/\/pojecia$/);
await p.locator('a[href="/nauka"]:visible').first().click(); await p.waitForURL(/\/nauka$/); await p.waitForTimeout(300);
check(await p.locator('[data-testid="forward"]').count() === 0, "link do poprzedniej strony – bez →");
const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check(ov <= 0, `nagłówek z ← bez poziomego przewijania (${ov})`);

// 3. „do góry” na długiej stronie spoza Pojęć
await p.goto(`${B}/nauka/podrecznik`); await p.waitForLoadState("networkidle");
await p.evaluate(() => window.scrollTo(0, 2000)); await p.waitForTimeout(300);
const tt = p.locator(".to-top");
check(await tt.count() === 1, "„Do góry” w Podręczniku");
if (await tt.count()) { await tt.click(); await p.waitForTimeout(900); check(await p.evaluate(() => window.scrollY) < 50, "przewinięcie na górę"); }
await p.screenshot({ path: `${OUT}/g1-podrecznik.png` });
check(errs.length === 0, `błędy JS: ${errs.join(" | ")}`);
await browser.close();
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
