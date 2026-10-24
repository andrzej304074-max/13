// H8: każda opcja i filtr po kolei – bez błędów strony, zmiana danych, zapis na koncie, powrót do domyślnych;
// cel dzienny, ranking, czytanie na głos, motyw ciemny (wg systemu), telefon bez poziomego przewijania
import { chromium } from "playwright-core";
import { readFileSync } from "node:fs";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
p.on("pageerror", (e) => errs.push(`${p.url()}: ${e.message}`));
p.on("response", (r) => { if (r.status() >= 500 && r.url().includes("/api/")) errs.push(`${r.status()} ${r.url()}`); });
await p.goto(`${B}/konto/logowanie`);
await p.fill('input[name="email"]', "drugi@example.com"); await p.fill('input[name="password"]', "nowe-haslo-123");
await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"));

const settle = () => p.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
const mainText = () => p.evaluate(() => (document.querySelector("main") ?? document.body).innerText);
const broken = () => p.evaluate(() => !!document.querySelector('[data-testid="load-error"], .error[role="alert"]'));
const noScroll = async (m) => check(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${m}: bez poziomego przewijania`);

/** Wszystkie kontrolki filtrów na stronie: selecty i przyciski grup (.seg) w <main>, bez celu dziennego. */
async function controls() {
  return p.evaluate(() => {
    const main = document.querySelector("main") ?? document.body;
    const out = [];
    main.querySelectorAll("select").forEach((s, i) => { if (s.offsetParent && !s.disabled) out.push({ kind: "select", i, n: s.options.length }); });
    main.querySelectorAll(".seg").forEach((g, i) => {
      if (!g.offsetParent || g.closest(".xp-panel")) return;
      out.push({ kind: "seg", i, n: g.querySelectorAll("button").length });
    });
    return out;
  });
}
async function setControl(c, k) {
  if (c.kind === "select") {
    const v = await p.evaluate(([i, k]) => { const s = [...(document.querySelector("main") ?? document.body).querySelectorAll("select")][i]; return s?.options[k]?.value ?? null; }, [c.i, k]);
    const sel = p.locator("main select").nth(c.i);
    // kontrolka mogła zniknąć po wcześniejszej opcji (np. pola zależne od trybu)
    if (v === null || !(await sel.isVisible()) || !(await sel.isEnabled())) return false;
    await sel.selectOption(v, { timeout: 5000 });
  } else {
    const b = p.locator("main .seg").nth(c.i).locator("button").nth(k);
    if (!(await b.isVisible()) || !(await b.isEnabled())) return false;
    await b.click();
  }
  await settle();
  return true;
}
/** Stan kontrolek (do sprawdzenia zapisu na koncie i powrotu do domyślnych). */
const snapshot = () => p.evaluate(() => {
  const main = document.querySelector("main") ?? document.body;
  return JSON.stringify([[...main.querySelectorAll("select")].map((s) => s.value),
    [...main.querySelectorAll(".seg")].filter((g) => !g.closest(".xp-panel")).map((g) => [...g.querySelectorAll("button")].findIndex((b) => b.getAttribute("aria-pressed") === "true" || b.classList.contains("active")))]);
});

/** Rozwija zwinięte sekcje opcji (<details>), żeby kontrolki były widoczne. */
const openAll = () => p.evaluate(() => document.querySelectorAll("main details").forEach((d) => { d.open = true; }));
/** Bieżąca (domyślna przy wejściu) opcja kontrolki. */
const curIdx = (c) => p.evaluate(([kind, i]) => {
  const main = document.querySelector("main") ?? document.body;
  if (kind === "select") return [...main.querySelectorAll("select")][i]?.selectedIndex ?? 0;
  const g = [...main.querySelectorAll(".seg")][i];
  return Math.max(0, [...(g?.querySelectorAll("button") ?? [])].findIndex((b) => b.getAttribute("aria-pressed") === "true" || b.classList.contains("active")));
}, [c.kind, c.i]);
const visit = async (path) => { await p.goto(`${B}${path}`); await settle(); await p.waitForTimeout(800); await openAll(); };

// tabela pojęć: zapamiętywane są dział i rodzaj (sprawdza g5.mjs), filtr gwiazdki – celowo nie
const NOT_SAVED = new Set(["/pojecia"]);
const PAGES = ["/", "/zadania", "/eseje", "/fiszki", "/stats", "/stats/dzialy", "/stats/swiat", "/pojecia",
  "/pojecia/statystyki", "/pojecia/pokrycie", "/nauka/statystyki"];
for (const path of PAGES) {
  await visit(path);
  const def = await snapshot();
  const cs = await controls();
  check(cs.length > 0, `${path}: są opcje do sprawdzenia`);
  let tried = 0, changed = 0;
  for (const c of cs) {
    const d0 = await curIdx(c);
    // przy długich listach (edycje, działy): pierwsze 3 i ostatnie 2 opcje
    const ks = [...new Set([...Array(Math.min(c.n, 3)).keys(), c.n - 2, c.n - 1].filter((k) => k >= 0 && k < c.n && k !== d0))];
    for (const k of ks) {
      const before = await mainText();
      if (!(await setControl(c, k))) continue;
      tried++;
      if ((await mainText()) !== before) changed++;
      if (await broken()) fails.push(`${path}: błąd po opcji ${c.kind} #${c.i} → ${k}`);
    }
    await setControl(c, d0); // powrót do opcji domyślnej przed następną kontrolką
  }
  check(tried > 0 && changed > 0, `${path}: ${tried} opcji, zmiana treści po ${changed}`);
  // zapis na koncie: wybór zostaje po ponownym wejściu bez parametrów w adresie (najpierw listy wyboru – gwiazdka w tabeli pojęć
  // celowo nie jest zapamiętywana)
  const pc = NOT_SAVED.has(path) ? null : cs.find((c) => c.kind === "select" && c.n > 1) ?? cs.find((c) => c.n > 1);
  if (pc) {
    const d0 = await curIdx(pc);
    await setControl(pc, (d0 + 1) % pc.n); await p.waitForTimeout(1500);
    const chosen = await snapshot();
    await visit(path);
    const back = await snapshot();
    check(back === chosen, `${path}: opcja zapamiętana (${chosen} → ${back})`);
    // powrót do domyślnych
    await setControl(pc, d0); await p.waitForTimeout(1500);
    await visit(path);
    check((await snapshot()) === def, `${path}: powrót do domyślnych (${def} → ${await snapshot()})`);
  }
  await noScroll(path);
}

// cel dzienny – zapis na koncie i powrót
await p.goto(`${B}/nauka`); await p.waitForSelector('[data-testid="xp-panel"]');
const goal0 = await p.locator('[data-testid="xp-panel"] [data-goal][aria-pressed="true"]').getAttribute("data-goal");
await p.click('[data-testid="xp-panel"] [data-goal="200"]'); await p.waitForTimeout(800);
const cel = await (await p.request.get(`${B}/api/cel`)).json();
check(cel.goal === 200, `cel dzienny zapisany (${cel.goal})`);
await p.reload(); await p.waitForSelector('[data-testid="xp-panel"]');
check(await p.locator('[data-testid="xp-panel"] [data-goal="200"]').getAttribute("aria-pressed") === "true", "cel dzienny po odświeżeniu");
await p.click(`[data-testid="xp-panel"] [data-goal="${goal0}"]`); await p.waitForTimeout(800);
check((await (await p.request.get(`${B}/api/cel`)).json()).goal === Number(goal0), "cel dzienny przywrócony");

// ranking: zapis i wypis
await p.goto(`${B}/stats/swiat`); await p.waitForSelector('[data-testid="ranking"]');
if (await p.locator('[data-testid="rank-leave"]').count()) { await p.click('[data-testid="rank-leave"]'); await settle(); }
await p.fill('[data-testid="rank-name"]', "Opcje Test"); await p.click('[data-testid="rank-join"]'); await settle();
check(/Opcje Test/.test(await p.locator('[data-testid="ranking"]').innerText()), "ranking: zapis pod pseudonimem");
await p.click('[data-testid="rank-leave"]'); await settle();
check(await p.locator('[data-testid="rank-join"]').count() === 1, "ranking: wypis");

// czytanie na głos: start i stop na rozdziale Podręcznika
const book = JSON.parse(readFileSync("data/nauka/podrecznik.json", "utf8"));
const [unit, u] = Object.entries(book.units)[0];
{
  await p.goto(`${B}/nauka/podrecznik/${unit}/${u.chapters[0].lesson}`); await settle();
  const sb = p.locator('[data-testid="read-aloud"]').first();
  if (await sb.count()) {
    await sb.click(); await p.waitForTimeout(800);
    check(await p.locator('[data-testid="speech-bar"]').count() === 1, "czytanie na głos: pasek odtwarzania");
    if (await p.locator('[data-testid="speech-stop"]').count()) { await p.click('[data-testid="speech-stop"]'); await p.waitForTimeout(300); }
    check(await p.locator('[data-testid="speech-bar"]').count() === 0, "czytanie na głos: zatrzymanie");
  } else fails.push("czytanie na głos: brak przycisku w rozdziale");
}

// motyw ciemny (wg systemu): inne tło, strony bez błędów i przewijania
const dark = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: "dark", storageState: await ctx.storageState() });
const d = await dark.newPage();
d.on("pageerror", (e) => errs.push(`ciemny ${d.url()}: ${e.message}`));
const bg = async (pg) => pg.evaluate(() => getComputedStyle(document.body).backgroundColor);
await d.goto(`${B}/stats`); await d.waitForLoadState("networkidle").catch(() => {});
check((await bg(d)) !== (await bg(p)), `motyw ciemny: tło ${await bg(d)}`);
for (const path of ["/", "/zadania/prognoza-xl-01-zadanie", "/fiszki", "/stats/swiat", "/nauka"]) {
  await d.goto(`${B}${path}`); await d.waitForLoadState("networkidle").catch(() => {});
  check(await d.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `ciemny ${path}: bez poziomego przewijania`);
}
await d.screenshot({ path: `${OUT}/options_dark_nauka.png` });
await dark.close();

check(errs.length === 0, `błędy: ${errs.slice(0, 8).join(" | ")}`);
await browser.close();
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails));
process.exit(fails.length ? 1 : 0);
