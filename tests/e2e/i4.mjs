// I4: tryb recenzenta – rola nadawana w panelu admina, /recenzja (pytania z flagami / zgłoszeniami, zgłoszenia merytoryczne,
// Prognoza XL), ocena OK / do poprawy z komentarzem, status w statystykach pytań admina, „Zgłoś nieaktualne” przy wykresie
import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const stamp = Date.now().toString(36);
async function session(email, password, width = 1280) {
  const c = await browser.newContext({ viewport: { width, height: 900 } });
  const p = await c.newPage();
  p.on("pageerror", (e) => errs.push(e.message));
  p.on("response", (r) => { if (r.status() >= 500) errs.push(`${r.status()} ${r.url()}`); });
  p.on("dialog", (d) => d.accept());
  await p.goto(`${B}/konto/logowanie`);
  await p.fill('input[name="email"]', email); await p.fill('input[name="password"]', password);
  await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
  return p;
}
const api = async (p, url, method = "GET", data) => {
  const r = await p.request.fetch(`${B}${url}`, { method, data, headers: { origin: B } });
  return { status: r.status(), data: await r.json().catch(() => null) };
};
const O = await session("owner@example.com", "haslo-wlasciciela");
const D = await session("drugi@example.com", "nowe-haslo-123", 390);

// 1. bez roli – brak dostępu
check((await api(D, "/api/recenzja")).status === 403, "zwykłe konto: /api/recenzja → 403");
await D.goto(`${B}/recenzja`);
check(!D.url().includes("/recenzja"), "zwykłe konto: /recenzja → przekierowanie");
check((await api(D, "/api/recenzja/ocena", "POST", { kind: "prognoza", ref: "x", status: "ok" })).status === 403, "ocena bez roli → 403");
// zgłoszenie merytoryczne od użytkownika (pojawi się w kolejce)
const bug = await api(D, "/api/zgloszenia", "POST", { kind: "merytoryczny", text: `I4 test zgłoszenia ${stamp} – zła definicja`, page: "/pojecia" });
check(bug.status === 201, "zgłoszenie merytoryczne zapisane");

// 2. admin nadaje rolę recenzenta w panelu
await O.goto(`${B}/admin`); await O.waitForSelector('[data-testid="users"]');
const row = O.locator('[data-testid="users"] [data-testid="user-row"]', { hasText: "drugi@example.com" });
await row.locator('[data-testid="reviewer-toggle"]').click(); await O.waitForTimeout(900);
check(await row.locator('[data-testid="reviewer-tag"]').count() === 1, "panel admina: tag „recenzent”");
const log = (await api(O, "/api/admin/dziennik")).data.log;
check(log.some((a) => a.action === "konto-nadaj-recenzenta" && a.target === "drugi@example.com"), "dziennik: nadanie roli recenzenta");

// 3. recenzent: menu, lista, oceny
await D.goto(`${B}/`);
check(await D.locator('[data-testid="review-link"]').count() === 1, "menu konta: „Recenzja treści”");
await D.goto(`${B}/recenzja`); await D.waitForSelector('[data-testid="review-panel"]');
const q = (await api(D, "/api/recenzja")).data;
check(q.prognoza.length === 100 && Array.isArray(q.questions) && q.bugs.some((b) => b.ref === bug.data.id), `kolejka: Prognoza ${q.prognoza.length}, pytania ${q.questions.length}, zgłoszenia ${q.bugs.length}`);
await D.click('[data-kind="prognoza"]');
const first = D.locator('[data-testid="review-list"] > li').first();
const pref = await first.getAttribute("data-ref");
await first.locator(".review-head").click();
await first.locator('[data-testid="review-fix"]').click(); await first.locator(".error").waitFor();
check(/opisz/i.test(await first.locator(".error").innerText()), "„do poprawy” bez komentarza → błąd");
await first.locator("textarea").fill("Wynik w części b nie zgadza się z danymi.");
await first.locator('[data-testid="review-fix"]').click(); await D.waitForTimeout(700);
check((await api(D, "/api/recenzja")).data.prognoza.find((p) => p.ref === pref)?.review?.status === "poprawa", "ocena „do poprawy” zapisana");
check(await D.locator(`[data-testid="review-list"] > li[data-ref="${pref}"]`).count() === 1, "oceniona pozycja zostaje do odświeżenia");
await D.reload(); await D.waitForSelector('[data-testid="review-panel"]'); await D.click('[data-kind="prognoza"]');
check(await D.locator(`[data-testid="review-list"] > li[data-ref="${pref}"]`).count() === 0, "„tylko bez oceny” ukrywa ocenione");
await D.uncheck('[data-testid="review-only"]');
check(await D.locator(`li[data-ref="${pref}"] [data-review="poprawa"]`).count() === 1, "po odznaczeniu – widoczna z oceną");
await D.screenshot({ path: `${OUT}/i4_recenzja_390.png`, fullPage: false });
check(await D.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "telefon: bez poziomego przewijania");
// zgłoszenie
check((await api(D, "/api/recenzja/ocena", "POST", { kind: "zgloszenie", ref: bug.data.id, status: "ok" })).status === 200, "ocena zgłoszenia");
check((await api(D, "/api/recenzja/ocena", "POST", { kind: "zgloszenie", ref: "00000000-0000-0000-0000-000000000000", status: "ok" })).status === 404, "nieistniejące zgłoszenie → 404");
// pytanie z odpowiedziami – status widoczny w statystykach pytań admina
const stats = (await api(O, "/api/admin/pytania")).data;
const qid = stats.rows.sort((a, b) => b.n - a.n)[0]?.id;
check(!!qid, `pytanie z odpowiedziami: ${qid}`);
const full = await api(D, `/api/recenzja/pytanie?id=${encodeURIComponent(qid)}`);
check(full.status === 200 && Array.isArray(full.data.correct), "recenzent widzi pytanie z kluczem");
check((await api(D, "/api/recenzja/ocena", "POST", { kind: "pytanie", ref: qid, status: "ok", comment: "Sprawdzone z kluczem." })).status === 200, "ocena pytania");
check((await api(D, "/api/recenzja/ocena", "POST", { kind: "pytanie", ref: "nie-ma-takiego", status: "ok" })).status === 404, "nieznane pytanie → 404");
const st2 = (await api(O, "/api/admin/pytania")).data.rows.find((r) => r.id === qid);
check(st2?.review?.status === "ok" && st2.review.by === "drugi@example.com", "statystyki pytań admina: ocena recenzenta");
check((await api(D, "/api/admin/pytania")).status === 403, "recenzent nie ma panelu admina");
await O.goto(`${B}/admin`); await O.click('[data-testid="qa-load"]'); await O.waitForSelector('[data-testid="questions-admin"]');
await O.selectOption('[data-testid="qa-flag"]', "").catch(() => {});
check(await O.locator(`[data-testid="qa-row"][data-id="${qid}"] [data-testid="qa-review"]`).innerText().then((t) => /OK/.test(t)).catch(() => false), "tabela pytań: kolumna Recenzja = OK");

// 4. „Zgłoś nieaktualne” przy wykresie z danych
await D.goto(`${B}/nauka/podrecznik/demo-emerytury`);
const btn = D.locator('[data-testid="chart-outdated"]').first();
await btn.waitFor({ timeout: 15000 }); await btn.click();
await D.waitForSelector('[data-testid="bug-popup"]');
check(/Nieaktualne dane na wykresie/.test(await D.locator('[data-testid="bug-text"]').inputValue()), "okienko zgłoszenia z opisem wykresu");
check(await D.locator('[data-testid="bug-kind-merytoryczny"]').getAttribute("aria-checked") === "true", "rodzaj: merytoryczny");

// 5. odebranie roli
await O.goto(`${B}/admin`); await O.waitForSelector('[data-testid="users"]');
await O.locator('[data-testid="users"] [data-testid="user-row"]', { hasText: "drugi@example.com" }).locator('[data-testid="reviewer-toggle"]').click();
await O.waitForTimeout(900);
check((await api(D, "/api/recenzja")).status === 403, "po odebraniu roli → 403");

check(errs.length === 0, `błędy: ${errs.join(" | ")}`);
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails));
process.exit(fails.length ? 1 : 0);
