// G14: Statystyki wg źródła pytań (Archiwum OWE / Pytania AI / Słownik), filtr zapamiętany na koncie, opisy „skąd te liczby”
import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
async function device(w) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  await p.goto(`${B}/konto/logowanie`);
  await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
  await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
  return p;
}
const a = await device(390), b = await device(1280);
await a.request.put(`${B}/api/ustawienia/filtry/stats`, { data: { value: "" } });

// 1. test „Wszystkie pytania” z AI i Słownika: odpowiedzi trafiają do właściwych źródeł
const before = await (await a.request.get(`${B}/api/stats?bank=owe&block=30`)).json();
const t = await (await a.request.post(`${B}/api/tests`, { data: { bank: "mix", type: "single", count: 30, sources: ["ai", "slownik"] } })).json();
const full = await (await a.request.get(`${B}/api/tests/${t.id}`)).json();
const qs = full.questions.slice(0, 6);
for (const q of qs) await a.request.post(`${B}/api/tests/${t.id}/answer`, { data: { questionId: q.id, selected: [0] } });
await a.request.post(`${B}/api/tests/${t.id}/finish`);
const after = await (await a.request.get(`${B}/api/stats?bank=mix&block=30`)).json();
const nAi = qs.filter((q) => q.id.startsWith("ai-")).length, nSl = qs.filter((q) => q.id.startsWith("sl-")).length;
check(after.bySource.ai.answers - before.bySource.ai.answers === nAi, `AI: +${after.bySource.ai.answers - before.bySource.ai.answers}, oczekiwano ${nAi}`);
check(after.bySource.slownik.answers - before.bySource.slownik.answers === nSl, `Słownik: +${after.bySource.slownik.answers - before.bySource.slownik.answers}, oczekiwano ${nSl}`);
check(after.bySource.owe.answers === before.bySource.owe.answers, "Archiwum bez zmian");
check(after.bySource.ai.percent >= 0 && after.bySource.ai.percent <= 100, `procent w [0,100]: ${after.bySource.ai.percent}`);

const ta = await (await a.request.post(`${B}/api/tests`, { data: { bank: "mix", type: "single", count: 30, sources: ["ai"] } })).json();
const qa = (await (await a.request.get(`${B}/api/tests/${ta.id}`)).json()).questions[0];
await a.request.post(`${B}/api/tests/${ta.id}/answer`, { data: { questionId: qa.id, selected: [0] } });
await a.request.post(`${B}/api/tests/${ta.id}/finish`);
const nAi2 = 1;

// 2. strona: 4 źródła, karta wg źródła, opisy „Skąd te liczby?”
await a.goto(`${B}/stats`); await a.waitForSelector('[data-testid="source-stats"]');
check(await a.locator('[data-testid="stats-bank"] [data-bank]').count() === 4, "4 źródła w przełączniku");
check(await a.locator('[data-testid="source-stats"] [data-source]').count() === 3, "karta: 3 źródła");
check(await a.locator("details.why").count() >= 2, "opisy „Skąd te liczby?”");
await a.locator("details.why summary").first().click();
check(/Sprawdzenie bez zaznaczenia/.test(await a.locator("details.why").first().innerText()), "opis treści");
check(await a.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "telefon: bez poziomego przewijania");
await a.screenshot({ path: `${OUT}/g14_stats_390.png`, fullPage: true });

// 3. wybór źródła i typu zapisany na koncie – drugie urządzenie widzi „Wszystkie pytania” i „Wielokrotny”
await a.click('[data-bank="mix"]'); await a.click('[data-type="multi"]'); await a.waitForTimeout(1500);
check(!new URL(a.url()).searchParams.has("bank"), "źródło nie w adresie (pamięta konto)");
await b.goto(`${B}/stats`); await b.waitForSelector('[data-testid="source-stats"]'); await b.waitForTimeout(1200);
check(await b.locator('[data-bank="mix"]').getAttribute("aria-pressed") === "true", "komputer: źródło z konta");
check(await b.locator('[data-type="multi"]').getAttribute("aria-pressed") === "true", "komputer: typ z konta");
// link z podsumowania testu (?bank=slownik): źródło z adresu, pozostałe filtry nadal z konta
await b.goto(`${B}/stats?bank=slownik`); await b.waitForSelector('[data-testid="source-stats"]'); await b.waitForTimeout(1500);
check(await b.locator('[data-bank="slownik"]').getAttribute("aria-pressed") === "true", "źródło z adresu wygrywa");
check(await b.locator('[data-type="multi"]').getAttribute("aria-pressed") === "true", "typ z konta mimo ?bank=");
// zakładka „Pytania AI” – testy z samych pytań AI (zapisane jako mix)
const sa = await (await a.request.get(`${B}/api/stats?bank=ai&block=30`)).json();
check(sa.history.length >= 1 && sa.overall.tests >= 1, `Pytania AI: testy z samych pytań AI (${sa.history.length})`);
await b.screenshot({ path: `${OUT}/g14_stats_1280.png`, fullPage: true });

// 4. Działy i pojęcia: źródło „Pytania AI” z filtrem hasła; odpowiedzi z testu mieszanego się liczą
const dz = await (await a.request.get(`${B}/api/stats/dzialy?bank=ai`)).json();
check(dz.total.answers >= nAi + nAi2, `działy AI: ${dz.total.answers} ≥ ${nAi + nAi2}`);
await a.goto(`${B}/stats/dzialy?bank=ai`); await a.waitForSelector('[data-testid="my-total"]');
check(await a.locator('[data-testid="dzialy-bank"] [data-bank]').count() === 3, "działy: 3 źródła");
check(await a.locator('[data-testid="theme-filter"]').count() === 1, "działy AI: filtr hasła");
check(await a.locator("details.why").count() === 1, "działy: „Skąd te liczby?”");
await a.goto(`${B}/stats/dzialy?bank=slownik`); await a.waitForSelector('[data-testid="my-total"]');
check(await a.locator('[data-testid="theme-filter"]').count() === 0, "działy Słownik: bez filtra hasła (osobny dział słownika)");

check(errs.length === 0, `błędy strony: ${errs.join(" | ")}`);
console.log(`OK: ${ok} błędów: ${fails.length}`, fails);
await browser.close(); process.exit(fails.length ? 1 : 0);
