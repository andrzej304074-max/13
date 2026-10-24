import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const login = async (email, password, vp = { width: 1280, height: 900 }) => {
  const ctx = await browser.newContext({ viewport: vp });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(`${email} ${p.url()} ${e.message}`));
  await p.goto(`${B}/konto/logowanie`);
  await p.fill('input[name="email"]', email); await p.fill('input[name="password"]', password);
  await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
  return { ctx, p };
};
const A = await login("owner@example.com", "haslo-wlasciciela");
const U = await login("drugi@example.com", "nowe-haslo-123", { width: 430, height: 900 });
const users = await (await A.p.request.get(`${B}/api/admin/uzytkownicy`)).json();
const uid = users.find((u) => u.email === "drugi@example.com").id;
const put = (url, data) => A.p.request.put(B + url, { data });
await put("/api/admin/dostep", { all: [], nonAdmins: [], mode: "hide" });
await put(`/api/admin/uzytkownicy/${uid}/dostep`, { blocked: [], mode: null });
const navTexts = async (p) => (await p.locator("nav.bottom-bar a, nav.sections a").allTextContents()).join(" | ");

// 1. admin blokuje użytkownikowi Notatki w panelu
await A.p.goto(`${B}/admin`); await A.p.waitForSelector('[data-testid="access-global"]');
const row = A.p.locator('tr[data-testid="user-row"]', { hasText: "drugi@example.com" });
await row.locator('[data-testid="access-btn"]').click();
await A.p.waitForSelector('[data-testid="access-user"]');
await A.p.locator('[data-testid="access-tree-user"] input[data-key="notatki"]').check();
await A.p.waitForFunction(() => /Zapisano/.test(document.querySelector('[data-testid="access-user"] .ne-status')?.textContent ?? ""));
await A.p.screenshot({ path: `${OUT}/access-admin.png`, fullPage: true });
let us = (await (await A.p.request.get(`${B}/api/admin/uzytkownicy`)).json()).find((u) => u.id === uid);
check(us.blocked.includes("notatki"), "panel: blokada Notatek zapisana dla konta");

// 2. użytkownik: brak w menu, brak szybkich notatek, strona i API zablokowane
await U.p.goto(`${B}/`); await U.p.waitForLoadState("networkidle");
check(!/Notatki/.test(await navTexts(U.p)), `ukryj: Notatki znikają z menu (${await navTexts(U.p)})`);
check(await U.p.locator('[data-testid="qn-btn"]').count() === 0, "szybkie notatki znikają");
await U.p.goto(`${B}/notatki`);
await U.p.waitForSelector('[data-testid="blocked"]', { timeout: 8000 }).catch(() => {});
check(await U.p.locator('[data-testid="blocked"]').count() === 1 && await U.p.locator('[data-testid="note-new"]').count() === 0, `strona /notatki → ekran blokady (${U.p.url()})`);
check((await U.p.request.get(`${B}/api/notatki?rodzaj=note`)).status() === 403, "API notatek → 403");
check((await U.p.request.get(`${B}/api/notatki?rodzaj=scratch`)).status() === 403, "API brudnopisów → 403");
await U.p.goto(`${B}/`); await U.p.click('button.btn:has-text("Rozpocznij test")'); await U.p.waitForSelector("button.option");
check(await U.p.locator('[data-testid="scratch-toggle"]').count() === 0, "brudnopis pod pytaniem znika");

// 3. tryb kłódki dla konta
await A.p.locator('[data-testid="access-user"] [data-mode="lock"]').click();
await A.p.waitForTimeout(800);
await U.p.goto(`${B}/fiszki`); await U.p.waitForLoadState("networkidle");
check(await U.p.locator("nav.bottom-bar a.locked", { hasText: "Notatki" }).count() === 1, "kłódka: Notatki w menu z 🔒");
await U.p.screenshot({ path: `${OUT}/access-lock-430.png` });

// 4. blokada podzakładki: Podręcznik – Kurs działa; przejście bez przeładowania pokazuje blokadę
await A.p.locator('[data-testid="access-tree-user"] input[data-key="/nauka/podrecznik"]').check(); await A.p.waitForTimeout(800);
await U.p.goto(`${B}/nauka`); await U.p.waitForSelector(".subtabs");
check(await U.p.locator('[data-testid="blocked"]').count() === 0, "Kurs dostępny przy zablokowanym Podręczniku");
check(await U.p.locator(".subtabs a.locked", { hasText: "Podręcznik" }).count() === 1, "podzakładka Podręcznik z kłódką");
await U.p.click('.subtabs a:has-text("Podręcznik")'); await U.p.waitForSelector('[data-testid="blocked"]');
check(true, "przejście bez przeładowania do Podręcznika → ekran blokady");
check((await U.p.request.get(`${B}/api/podkreslenia?artykul=makro-pkb`)).status() === 403, "API podkreśleń → 403");
await U.p.screenshot({ path: `${OUT}/access-blocked-430.png` });

// 5. dla wszystkich oprócz adminów: Mapa myśli
await put("/api/admin/dostep", { all: [], nonAdmins: ["/pojecia/mapa"], mode: "hide" });
await U.p.goto(`${B}/pojecia/mapa`);
await U.p.waitForSelector('[data-testid="blocked"]', { timeout: 8000 }).catch(() => {});
check(await U.p.locator('[data-testid="blocked"]').count() === 1 && await U.p.locator('[data-testid="mind-map"]').count() === 0, "„oprócz adminów”: użytkownik nie wejdzie na mapę");
await A.p.goto(`${B}/pojecia/mapa`); await A.p.waitForSelector('[data-testid="mind-map"]');
check(true, "„oprócz adminów”: admin widzi mapę");

// 6. dla wszystkich: Działy i pojęcia – także admin
await put("/api/admin/dostep", { all: ["/stats/dzialy"], nonAdmins: [], mode: "hide" });
await A.p.goto(`${B}/stats/dzialy`);
await A.p.waitForSelector('[data-testid="blocked"]', { timeout: 8000 }).catch(() => {});
check(await A.p.locator('[data-testid="blocked"]').count() === 1, "„wszyscy”: admin też zablokowany");
check((await A.p.request.get(`${B}/api/stats/dzialy?bank=owe`)).status() === 403, "„wszyscy”: API → 403 dla admina");
await A.p.goto(`${B}/admin`); await A.p.waitForSelector('[data-testid="access-global"]');
check(true, "panel admina zawsze dostępny");
await A.p.screenshot({ path: `${OUT}/access-global.png`, fullPage: true });

// 7. zdjęcie blokad
await put("/api/admin/dostep", { all: [], nonAdmins: [], mode: "hide" });
await put(`/api/admin/uzytkownicy/${uid}/dostep`, { blocked: [], mode: null });
await U.p.goto(`${B}/notatki`); await U.p.waitForSelector('[data-testid="note-new"]');
check(!U.p.url().includes("/zablokowane") && /Notatki/.test(await navTexts(U.p)), "po zdjęciu blokad Notatki wracają");
check((await U.p.request.get(`${B}/api/notatki?rodzaj=note`)).status() === 200, "API notatek znowu 200");
// nowy test przy zablokowanym formularzu „Pytania” (Zadania działają dalej)
await put(`/api/admin/uzytkownicy/${uid}/dostep`, { blocked: ["/"], mode: null });
check((await U.p.request.post(`${B}/api/tests`, { data: { type: "single", count: 30, sources: ["slownik"] } })).status() === 403, "zablokowane „Pytania”: nowy test → 403");
check((await U.p.request.get(`${B}/api/otwarte?rodzaj=zadanie`)).status() === 200, "Zadania działają dalej");
await put(`/api/admin/uzytkownicy/${uid}/dostep`, { blocked: [], mode: null });
check((await U.p.request.post(`${B}/api/tests`, { data: { type: "single", count: 30, sources: ["owe"] } })).status() === 201, "po zdjęciu blokady test działa");
await put(`/api/admin/uzytkownicy/${uid}/dostep`, { blocked: [], mode: null });
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
console.log("konsola:", JSON.stringify(errs, null, 1));
await browser.close();
