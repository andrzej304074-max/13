// I1: jeden formularz „Pytania” – źródło Hasło XL i jego podfiltr, filtry Słownika, przekierowania starych zakładek,
// test z samego Hasła XL, statystyki i „Działy i pojęcia” wg źródła, zapis ustawień na koncie (klucz „testy”)
import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const p = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
p.on("pageerror", (e) => errs.push(e.message));
p.on("response", (r) => { if (r.status() >= 500) errs.push(`${r.status()} ${r.url()}`); });
await p.goto(`${B}/konto/logowanie`);
await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));
const settle = () => p.waitForTimeout(700);
const num = async (t = "single") => Number((await p.locator(`[data-testid="count-${t}"]`).innerText()).replace(/\D/g, "")) || 0;
const srcNum = async (s) => Number((await p.locator(`[data-testid="src-count-${s}"]`).innerText()).replace(/\D/g, "")) || 0;
const pula = async (d) => (await p.request.post(`${B}/api/tests/pula`, { data: d })).json();

// 1. API: Hasło XL osobno – 400 ręcznych i 254 ze skryptu (oba typy), filtry innych źródeł go nie zawężają
const xlAll = await pula({ sources: ["xl"] });
const xlM = await pula({ sources: ["xl"], xlOrigin: "manual" });
const xlA = await pula({ sources: ["xl"], xlOrigin: "auto" });
check(xlM.single + xlM.multi === 400 && xlA.single + xlA.multi === 254 && xlAll.single + xlAll.multi === 654, `Hasło XL: ${xlM.single + xlM.multi} ręcznych + ${xlA.single + xlA.multi} skryptem`);
const xlSl = await pula({ sources: ["xl"], slOrigin: "auto", slSection: 1, edFrom: 30 });
check(xlSl.single === xlAll.single, "filtry Słownika i OWE nie zawężają Hasła XL");
const ai = await pula({ sources: ["ai"], xlOrigin: "manual" });
check(ai.single === 464, `Pytania AI (Twoje) osobno: ${ai.single}`);
check((await p.request.post(`${B}/api/tests/pula`, { data: { sources: ["xl"], xlOrigin: "zle" } })).status() === 400, "zły rodzaj → 400");
check((await p.request.post(`${B}/api/tests/pula`, { data: { sources: ["slownik"], slSection: 99 } })).status() === 400, "zły dział słownika → 400");

// 2. formularz: tylko Hasło XL, podfiltr „ze skryptu”, liczby w przyciskach źródeł
await p.goto(`${B}/?zrodlo=xl`); await p.waitForSelector('[data-testid="sources"]'); await settle();
check(await p.locator('[data-testid="sources"] [aria-pressed="true"]').count() === 1 && await p.locator('[data-source="xl"]').getAttribute("aria-pressed") === "true", "?zrodlo=xl – tylko Hasło XL");
check(await srcNum("xl") === xlAll.single, `liczba przy źródle XL: ${await srcNum("xl")}`);
check(await p.locator('[data-testid="filters-owe"]').count() === 0 && await p.locator('[data-testid="filters-slownik"]').count() === 0, "tylko filtry wybranego źródła");
await p.locator('details[data-testid="source-filters"] summary').click();
await p.click('[data-testid="xl-origin"] [data-origin="auto"]'); await settle();
check(await num() === xlA.single, `XL ze skryptu: ${await num()} (API ${xlA.single})`);
await p.screenshot({ path: `${OUT}/i1_xl_390.png`, fullPage: true });
check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "telefon: bez poziomego przewijania");
// test z samych pytań XL ze skryptu – znacznik źródła przy pytaniu
await p.click('[data-testid="start"]'); await p.waitForURL(/\/test\//); await p.waitForSelector(".option");
check(/Hasło XL/.test(await p.locator(".card p.muted").first().innerText()), "znacznik źródła „Hasło XL” przy pytaniu");
const tid = p.url().split("/").pop();
const t = await (await p.request.get(`${B}/api/tests/${tid}`)).json();
check(t.bank === "mix" && t.questions.every((q) => /^xl-TC?-/.test(q.id)), "test tylko z pytań XL ze skryptu");
for (const q of t.questions.slice(0, 3)) await p.request.post(`${B}/api/tests/${tid}/answer`, { data: { questionId: q.id, selected: [0] } });
await p.request.post(`${B}/api/tests/${tid}/finish`);

// 3. ustawienia na koncie (klucz „testy”), Słownik: ręcznie pisane i dział
await p.goto(`${B}/`); await p.waitForSelector('[data-testid="sources"]'); await settle();
check(await p.locator('[data-source="xl"]').getAttribute("aria-pressed") === "true" && await p.locator('[data-testid="sources"] [aria-pressed="true"]').count() === 1, "źródła z konta");
const prefs = await (await p.request.get(`${B}/api/ustawienia/filtry`)).json();
check(/"xlOrigin":"auto"/.test(prefs.prefs.testy ?? ""), "zapis pod kluczem „testy”");
await p.click('[data-source="slownik"]'); await p.click('[data-source="xl"]'); await settle();
const slAll = await num();
if ((await p.locator('details[data-testid="source-filters"]').getAttribute("open")) === null) await p.locator('details[data-testid="source-filters"] summary').click();
await p.click('[data-testid="sl-origin"] [data-origin="manual"]'); await p.selectOption('[data-testid="sl-section"]', "15"); await settle();
const sl15 = await num();
check(sl15 > 50 && sl15 < slAll, `Słownik: ręczne, dział 15: ${sl15} z ${slAll}`);
await p.click('[data-testid="sl-origin"] [data-origin="all"]'); await p.selectOption('[data-testid="sl-section"]', "");
for (const s of ["owe", "ai", "xl"]) await p.click(`[data-source="${s}"]`);
await p.locator('[data-testid="filters-xl"] [data-origin="all"]').click(); await settle();
check(await p.locator('[data-testid="sources"] [aria-pressed="true"]').count() === 4, "powrót do wszystkich źródeł");

// 4. przekierowania starych zakładek i menu
await p.goto(`${B}/testy/wszystkie?bledy=1`); await p.waitForURL(/\/\?bledy=1/); await p.waitForSelector('[data-testid="mistakes"]'); await settle();
check(await p.locator('[data-testid="mistakes"]').getAttribute("aria-pressed") === "true", "/testy/wszystkie?bledy=1 → / z „Tylko moje błędy”");
await p.goto(`${B}/slownik`); await p.waitForURL(/zrodlo=slownik/);
check(true, "/slownik → /?zrodlo=slownik");
const tabs = await p.locator("nav a").allInnerTexts();
check(!tabs.some((x) => /Olimpiada$|Słownik$|Wszystkie pytania/.test(x.trim())) || !tabs.some((x) => x.trim() === "Słownik"), `menu bez starych zakładek: ${tabs.filter((x) => /Pytania|Słownik|Olimpiada/.test(x)).join(", ")}`);

// 5. statystyki wg źródła: Hasło XL liczy tylko pytania XL
const sx = await (await p.request.get(`${B}/api/stats?zrodlo=xl`)).json();
check(sx.overall.tests >= 1 && sx.history.at(-1)?.total === t.questions.length, `statystyki XL: ostatni test ${sx.history.at(-1)?.total} pytań`);
const sall = await (await p.request.get(`${B}/api/stats`)).json();
check(sall.bySource.xl.answers >= 3, `karta wg źródła: XL ${sall.bySource.xl.answers} odpowiedzi`);
const legacy = await (await p.request.get(`${B}/api/stats?bank=mix`)).json();
check(legacy.overall.tests === sall.overall.tests, "stary parametr bank=mix = wszystkie");
await p.goto(`${B}/stats?zrodlo=xl`); await p.waitForSelector('[data-testid="source-stats"]');
check(await p.locator('[data-bank="xl"]').getAttribute("aria-pressed") === "true", "strona statystyk: źródło XL z adresu");
await p.locator('[data-bank="all"]').click(); await p.waitForTimeout(1200);
const dz = await (await p.request.get(`${B}/api/stats/dzialy?bank=xl`)).json();
check(dz.total.answers >= 3, `Działy i pojęcia – Hasło XL: ${dz.total.answers}`);
const sw = await p.request.get(`${B}/api/swiat?miara=xp&zrodlo=xl&okres=all`);
check(sw.status() === 200, `statystyki świata ze źródłem XL (${sw.status()})`);

check(errs.length === 0, `błędy: ${errs.join(" | ")}`);
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails));
process.exit(fails.length ? 1 : 0);
