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
await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
const stats = async (q = "") => (await page.request.get(`${B}/api/stats?bank=owe${q}`)).json();
const s0 = await stats();
check(s0.byStage && "s" in s0.byStage && "o" in s0.byStage, "statystyki mają podział na etapy");

// 1. formularz: etapy w filtrach (szkolny / okręgowy / centralny)
await page.goto(`${B}/`); await page.waitForSelector('[data-testid="test-filters"]');
await page.evaluate(() => localStorage.removeItem("owe:testStart:owe")); await page.reload(); await page.waitForSelector('[data-testid="test-filters"]');
await page.locator('details[data-testid="test-filters"] summary').click();
check(await page.locator('[data-testid="stages"] button').count() === 3, "trzy etapy w filtrach");
await page.locator(".choice", { hasText: "Jednokrotny wybór" }).click();
await page.click('[data-testid="stages"] [data-stage="o"]'); await page.click('[data-testid="stages"] [data-stage="c"]');
check(await page.locator('[data-testid="stages"] [data-stage="s"]').getAttribute("aria-pressed") === "true"
  && await page.locator('[data-testid="stages"] [aria-pressed="true"]').count() === 1, "zaznaczony tylko etap szkolny");
await page.waitForTimeout(600);
await page.locator(".choice", { hasText: "30 pytań" }).click();
await page.click("text=Rozpocznij test"); await page.waitForURL(/\/test\//);
const tid = page.url().split("/").pop();
const t = await (await page.request.get(`${B}/api/tests/${tid}`)).json();
check(t.questions.length === 30 && t.questions.every((q) => /-s-/.test(q.id)), `test szkolny: tylko -s- (${t.questions.map((q) => q.id).filter((x) => !/-s-/.test(x)).join(",")})`);
for (const q of t.questions.slice(0, 3)) await page.request.post(`${B}/api/tests/${tid}/answer`, { data: { questionId: q.id, selected: [0] } });
await page.request.post(`${B}/api/tests/${tid}/finish`);
// wybór zapamiętany
await page.goto(`${B}/`); await page.waitForSelector('[data-testid="test-filters"]');
await page.waitForTimeout(300);
check(await page.locator('[data-testid="stages"] [data-stage="s"]').getAttribute("aria-pressed") === "true"
  && await page.locator('[data-testid="stages"] [aria-pressed="true"]').count() === 1, "wybór etapu zapamiętany");
await page.evaluate(() => localStorage.removeItem("owe:testStart:owe"));

// 2. bez limitu – okręgowy, przez API (dolosowanie też z etapu)
const e = await (await page.request.post(`${B}/api/tests`, { data: { type: "single", count: "endless", stage: "o" } })).json();
check(e.questions.every((q) => /-o-/.test(q.id)), "bez limitu: tylko -o-");
let cur = e.questions[0];
for (let i = 0; i < 2; i++) {
  const r = await (await page.request.post(`${B}/api/tests/${e.id}/answer`, { data: { questionId: cur.id, selected: [1] } })).json();
  check(!cur || /-o-/.test(cur.id), `kolejne pytanie z etapu okręgowego ${cur?.id}`);
  cur = r.nextQuestion;
}
await page.request.post(`${B}/api/tests/${e.id}/finish`);
const bad = await page.request.post(`${B}/api/tests`, { data: { type: "single", count: 30, stage: "c" } });
check(bad.status() === 400, "zły etap → 400");
const mixed = await (await page.request.post(`${B}/api/tests`, { data: { type: "multi", count: 30, stage: "s" } })).json();
check(mixed.questions.every((q) => /-c-/.test(q.id)), "etap ignorowany przy wielokrotnym");
await page.request.post(`${B}/api/tests/${mixed.id}/finish`);

// 3. statystyki
const s1 = await stats();
check(s1.byStage.s.total - s0.byStage.s.total === 30, `szkolny: +30 pytań (${s1.byStage.s.total - s0.byStage.s.total})`);
check(s1.byStage.o.total - s0.byStage.o.total === 2, `okręgowy: +2 pytania (${s1.byStage.o.total - s0.byStage.o.total})`);
const ss = await stats("&type=single&stage=s");
check(ss.stage === "s" && ss.history.at(-1)?.total === 30 && ss.history.at(-1)?.drawStage === "s", "historia zawężona do etapu szkolnego");
check(ss.history.every((h) => h.type === "single"), "historia etapu – tylko jednokrotny");
const so = await stats("&type=single&stage=o");
check(so.history.some((h) => h.id === e.id && h.total === 2) && !so.history.some((h) => h.id === tid), "historia okręgowa bez testu szkolnego");
check((await stats("&type=multi&stage=s")).stage === null, "etap ignorowany przy wielokrotnym (stats)");

await page.goto(`${B}/stats?bank=owe`); await page.waitForSelector("h1");
await page.locator('.seg[aria-label="Typ pytań"] button', { hasText: "Jednokrotny" }).click();
await page.waitForSelector('[data-testid="stats-stage"]');
check(await page.locator('[data-testid="stage-stats"] .stat').count() === 2, "karta wg etapu");
await page.click('[data-testid="stats-stage"] [data-stage="o"]'); await page.waitForTimeout(800);
check(/etap okręgowy/.test(await page.locator(".card .muted").first().innerText()), "główna karta: etap okręgowy");
const hh = await page.locator("h2", { hasText: "Postęp (%" }).innerText();
check(/etapu okręgowego/.test(hh), `nagłówek wykresu z etapem: ${hh}`);
check(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "brak poziomego przewijania");
await page.click('[data-testid="stats-stage"] [data-stage=""]');
await page.screenshot({ path: process.argv[2] ? `${process.argv[2]}/stage-stats.png` : "/dev/null", fullPage: true }).catch(() => {});
await browser.close();
console.log(`OK ${ok}`, fails.length ? `\nFAIL:\n${fails.join("\n")}` : "", errs.length ? `\nERR:\n${errs.slice(0, 5).join("\n")}` : "");
