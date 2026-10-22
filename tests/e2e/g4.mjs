// G3/G4: zakładka „Wszystkie pytania” – źródła, filtry, liczby pytań, test z pytaniami AI, filtry w Olimpiadzie i Słowniku
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
const num = async (t) => Number((await p.locator(`[data-testid="count-${t}"]`).innerText()).replace(/\D/g, "")) || 0;
const settle = () => p.waitForTimeout(700);

// 1. zakładka w menu i domyślnie wszystkie źródła
await p.goto(`${B}/testy/wszystkie`); await p.waitForSelector('[data-testid="sources"]'); await settle();
check(await p.locator('a[href="/testy/wszystkie"]').count() > 0, "zakładka „Wszystkie pytania” w menu");
const all = await num("single");
check(await p.locator('[data-testid="sources"] [aria-pressed="true"]').count() === 3, "3 źródła zaznaczone");
// 2. tylko Pytania AI
await p.click('[data-source="owe"]'); await p.click('[data-source="slownik"]'); await settle();
const ai = await num("single");
check(ai > 400 && ai < all, `tylko AI: ${ai} (wszystkie ${all})`);
check(await p.locator('[data-testid="ed-from"]').count() === 0, "bez Archiwum – brak zakresu edycji");
// 3. filtr hasła przewodniego (demografia)
await p.locator('details[data-testid="test-filters"] summary').click();
await p.selectOption('[data-testid="theme"]', "yes"); await settle();
const aiTh = await num("single");
check(aiTh > 80 && aiTh < ai, `AI z hasła: ${aiTh}`);
// 4. test z pytań AI: pytanie ma znacznik źródła, sprawdzenie pokazuje wyjaśnienie
await p.click('[data-testid="start"]'); await p.waitForURL(/\/test\//); await p.waitForSelector(".option");
check(/Pytania AI/.test(await p.locator(".card p.muted").first().innerText()), "znacznik źródła przy pytaniu");
await p.locator(".option").first().click(); await p.click('[data-testid="check"]'); await p.waitForSelector(".feedback");
check((await p.locator(".feedback").innerText()).length > 20, "wyjaśnienie po sprawdzeniu");
const tid = p.url().split("/").pop();
const st = await (await p.request.get(`${B}/api/tests/${tid}`)).json();
check(st.bank === "mix" && st.questions.every((q) => q.id.startsWith("ai-")), "test „mix” tylko z pytań AI");
await p.request.post(`${B}/api/tests/${tid}/finish`);
// 5. ustawienia zapamiętane po powrocie
await p.goto(`${B}/testy/wszystkie`); await p.waitForSelector('[data-testid="sources"]'); await settle();
check(await p.locator('[data-testid="sources"] [aria-pressed="true"]').count() === 1, "zapamiętane źródła");
check(await p.locator('[data-testid="theme"]').inputValue() === "yes", "zapamiętany filtr hasła");
// 6. Olimpiada: zakres edycji i etap
await p.goto(`${B}/`); await p.waitForSelector('[data-testid="test-filters"]'); await settle();
const oweAll = await num("single");
await p.locator('details[data-testid="test-filters"] summary').click();
await p.selectOption('[data-testid="ed-from"]', "39"); await p.click('[data-stage="s"]'); await settle();
const o39 = await num("single");
check(o39 === 30, `XXXIX, etap okręgowy: 30 pytań (${o39}, wszystkie ${oweAll})`);
const t2 = await (await p.request.post(`${B}/api/tests`, { data: { bank: "owe", type: "single", count: 30, edFrom: 39, edTo: 39, stages: ["o"] } })).json();
check(t2.questions.length === 30 && t2.questions.every((q) => q.id.startsWith("owe39-o-")), "API: test z XXXIX etapu okręgowego");
await p.request.post(`${B}/api/tests/${t2.id}/finish`);
// 7. Słownik: rodzaj haseł „wzory”
await p.goto(`${B}/slownik`); await p.waitForSelector('[data-testid="test-filters"]'); await settle();
const slAll = await num("single");
await p.locator('details[data-testid="test-filters"] summary').click();
await p.selectOption('[data-testid="kind"]', "wzor"); await settle();
const slWz = await num("single");
check(slWz > 100 && slWz < slAll, `Słownik – wzory: ${slWz} z ${slAll}`);
// 8. błędne filtry → 400
const bad = await p.request.post(`${B}/api/tests`, { data: { bank: "mix", type: "single", count: 30, sources: ["x"] } });
check(bad.status() === 400, `nieznane źródło → 400 (${bad.status()})`);
const ov = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check(ov <= 0, `bez poziomego przewijania (${ov})`);
await p.screenshot({ path: `${OUT}/g4-slownik.png`, fullPage: true });
check(errs.length === 0, `błędy JS: ${errs.join(" | ")}`);
await browser.close();
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
