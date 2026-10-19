// Własne fiszki: tworzenie, edycja, oznaczenie w Fiszkach, filtr „moje”, talia, gwiazdka, ocena bez wpływu na Naukę, izolacja kont
import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
async function login(email, pass, vp = { width: 430, height: 900 }) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: vp.width < 700, hasTouch: vp.width < 700 });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(`${p.url()} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errs.push(`${p.url()} ${m.text()}`));
  p.on("dialog", (d) => d.accept());
  await p.goto(`${B}/konto/logowanie`);
  await p.fill("input[name=email]", email); await p.fill("input[name=password]", pass);
  await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
  return { ctx, p };
}
const j = (p, url, init) => p.evaluate(async ([u, i]) => { const r = await fetch(u, i ? { ...i, headers: { "Content-Type": "application/json" } } : undefined); return { s: r.status, b: await r.json().catch(() => null) }; }, [url, init]);

const { ctx, p } = await login("owner@example.com", "haslo-wlasciciela");
// sprzątanie po poprzednich uruchomieniach
for (const c of (await j(p, "/api/fiszki/moje")).b ?? []) await j(p, `/api/fiszki/moje/${encodeURIComponent(c.id)}`, { method: "DELETE" });

// 1. tworzenie w Moich taliach
await p.goto(`${B}/fiszki/talie`); await p.waitForSelector('[data-testid="own-cards"]');
await p.click('[data-testid="own-new"]');
await p.fill('[data-testid="own-t"]', "Koszt utopiony testowy");
await p.fill('[data-testid="own-d"]', "Koszt poniesiony w przeszłości, którego nie da się odzyskać.");
await p.fill('[data-testid="own-w"]', "—");
await p.selectOption('[data-testid="own-topic"]', { index: 1 });
await p.selectOption('[data-testid="own-kind"]', "pojecie");
await p.click('[data-testid="own-save"]'); await p.waitForSelector('[data-testid="own-item"]');
check((await p.locator('[data-testid="own-item"]').count()) === 1, "nowa fiszka na liście");
await p.fill('[data-testid="own-t"]', "Druga moja");
await p.fill('[data-testid="own-d"]', "Definicja drugiej.");
await p.click('[data-testid="own-save"]'); await p.waitForTimeout(500);
check((await p.locator('[data-testid="own-item"]').count()) === 2, "formularz zostaje otwarty – druga fiszka od razu");
// edycja
await p.locator('[data-testid="own-item"]', { hasText: "Koszt utopiony testowy" }).locator('[data-testid="own-edit"]').click();
await p.fill('[data-testid="own-t"]', "Koszt utopiony (sunk cost)");
await p.click('[data-testid="own-save"]'); await p.waitForTimeout(500);
check(await p.locator('[data-testid="own-item"]', { hasText: "Koszt utopiony (sunk cost)" }).count() === 1, "edycja hasła");
// walidacja: pusta definicja
await p.click('[data-testid="own-new"]').catch(() => {});
const bad = await j(p, "/api/fiszki/moje", { method: "POST", body: JSON.stringify({ t: "x", d: "", topic: "mikro", kind: "pojecie" }) });
check(bad.s === 400, `pusta definicja → 400 (${bad.s})`);
const mine = (await j(p, "/api/fiszki/moje")).b;
const id1 = mine.find((c) => c.t.startsWith("Koszt utopiony")).id;
await p.screenshot({ path: `${OUT}/own-talie.png`, fullPage: true });

// 2. gwiazdka na liście własnych fiszek
await p.locator('[data-testid="own-item"]', { hasText: "Koszt utopiony" }).locator('[data-testid="star"]').click(); await p.waitForTimeout(400);
check(((await j(p, "/api/gwiazdki?rodzaj=fiszka")).b ?? []).includes(id1), "gwiazdka własnej fiszki zapisana");

// 3. Fiszki: filtr „moje”, oznaczenie, ocena tylko w karcie
await p.goto(`${B}/fiszki?zrodlo=moje`); await p.waitForSelector('[data-testid="reel"]');
check((await p.locator('[data-testid="reel"]').count()) === 2, `filtr „moje” – tylko własne (${await p.locator('[data-testid="reel"]').count()})`);
check((await p.locator('[data-testid="own-tag"]').count()) >= 1 && (await p.locator(".fc.own").count()) === 2, "oznaczenie ✍️ i przerywana obwódka");
const before = (await j(p, "/api/fiszki/opanowanie")).b;
await p.locator('[data-testid="reel"]').first().locator("button:has-text('Znam')").first().click(); await p.waitForTimeout(500);
const after = (await j(p, "/api/fiszki/opanowanie")).b;
check(JSON.stringify(before) === JSON.stringify(after) && !Object.keys(after).some((k) => k.startsWith("u:")), "ocena własnej fiszki nie zmienia opanowania/Nauki");
check(((await j(p, "/api/fiszki/moje")).b ?? []).some((c) => c.n === 1), "ocena zapisana w karcie");
await p.goto(`${B}/fiszki?zrodlo=kurs`); await p.waitForSelector('[data-testid="reel"]');
check((await p.locator(".fc.own").count()) === 0, "filtr „z kursu” – bez własnych");

// 4. talia z własną fiszką
const d = (await j(p, "/api/talie", { method: "POST", body: JSON.stringify({ name: "Talia z moimi" }) })).b;
await p.goto(`${B}/fiszki/talie/${d.id}`); await p.waitForSelector('[data-testid="deck-search"]');
await p.selectOption('[data-testid="filter-src"]', "moje"); await p.waitForTimeout(300);
check((await p.locator('[data-testid="deck-results"] .deck-result.own').count()) === 2, "edytor talii: filtr „moje”");
await p.locator('[data-testid="deck-results"] .deck-result.own').first().click(); await p.waitForTimeout(800);
check((await p.locator('[data-testid="deck-item"].own').count()) === 1, "własna fiszka w talii");
check((await p.locator('[data-testid="deck-item"] [data-testid="star"]').count()) === 1, "gwiazdka przy karcie w talii");
await p.goto(`${B}/fiszki?talia=${d.id}`); await p.waitForSelector('[data-testid="reel"]');
check((await p.locator(".fc.own").count()) === 1, "nauka talii z własną fiszką");

// 5. izolacja: drugie konto
const o = await login("drugi@example.com", "nowe-haslo-123");
const other = (await j(o.p, "/api/fiszki/moje")).b;
check(Array.isArray(other) && !other.some((c) => c.id === id1), "drugie konto nie widzi cudzych fiszek");
check((await j(o.p, `/api/fiszki/moje/${encodeURIComponent(id1)}`, { method: "PATCH", body: JSON.stringify({ t: "x", d: "y", topic: "mikro", kind: "pojecie" }) })).s === 404, "cudza fiszka – edycja 404");
const od = (await j(o.p, "/api/talie", { method: "POST", body: JSON.stringify({ name: "obca" }) })).b;
check((await j(o.p, `/api/talie/${od.id}/karty`, { method: "POST", body: JSON.stringify({ item: id1 }) })).s === 400, "cudzej fiszki nie da się dodać do talii");
check((await j(o.p, "/api/gwiazdki", { method: "POST", body: JSON.stringify({ kind: "fiszka", ref: id1, on: true }) })).s === 400, "cudzej fiszki nie da się oznaczyć gwiazdką");
await j(o.p, `/api/talie/${od.id}`, { method: "DELETE" });
await o.ctx.close();

// 6. usunięcie – znika też z talii
await j(p, `/api/fiszki/moje/${encodeURIComponent(id1)}`, { method: "DELETE" });
check(!((await j(p, `/api/talie/${d.id}`)).b.items ?? []).includes(id1), "usunięta fiszka znika z talii");
await j(p, `/api/talie/${d.id}`, { method: "DELETE" });
for (const c of (await j(p, "/api/fiszki/moje")).b ?? []) await j(p, `/api/fiszki/moje/${encodeURIComponent(c.id)}`, { method: "DELETE" });

await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails, null, 1), JSON.stringify(errs.slice(0, 5)));
