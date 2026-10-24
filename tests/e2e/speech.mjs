import { chromium } from "playwright-core";
const B = "http://localhost:3100", OUT = process.argv[2] ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
let ok = 0; const fails = []; const errs = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
/** Atrapa syntezatora: zapisuje wypowiedzi, „mówi” 40 ms, obsługuje pauzę. */
const mock = (voices) => `(() => {
  window.__spoken = [];
  class U { constructor(t) { this.text = t; this.onend = null; this.onerror = null; } }
  Object.defineProperty(window, "SpeechSynthesisUtterance", { value: U, configurable: true, writable: true });
  const vs = ${JSON.stringify(voices)};
  const s = { speaking: false, paused: false, q: null, getVoices: () => vs, addEventListener() {},
    speak(u) { window.__spoken.push(u.text); (window.__voicesUsed ||= []).push(u.voice ? u.voice.voiceURI : null); if (!window.__noStart) setTimeout(() => u.onstart && u.onstart(), 5); this.speaking = true; this.q = u; const tick = () => { if (this.q !== u) return; if (this.paused) return setTimeout(tick, 20); this.speaking = false; this.q = null; u.onend && u.onend(); }; setTimeout(tick, 40); },
    cancel() { this.speaking = false; this.q = null; }, pause() { this.paused = true; }, resume() { this.paused = false; } };
  Object.defineProperty(window, "speechSynthesis", { value: s, configurable: true, writable: true });
  Object.defineProperty(navigator, "audioSession", { value: { type: "auto" }, configurable: true });
})();`;
const PL = [{ voiceURI: "pl-google", name: "Google polski", lang: "pl-PL", localService: false }];
const spoken = (p) => p.evaluate(() => window.__spoken.slice());

for (const vp of [{ width: 1280, height: 900 }, { width: 430, height: 900 }]) {
  const tag = vp.width;
  const ctx = await browser.newContext({ viewport: vp });
  await ctx.addInitScript(mock(PL));
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errs.push(`${tag} ${p.url()} ${e.message}`));
  p.on("console", (m) => m.type() === "error" && errs.push(`${tag} ${p.url()} ${m.text()}`));
  await p.goto(`${B}/konto/logowanie`);
  await p.fill('input[name="email"]', "owner@example.com"); await p.fill('input[name="password"]', "haslo-wlasciciela");
  await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });

  // 1. Podręcznik – cały rozdział, podświetlenie, pauza, następny, stop
  await p.goto(`${B}/nauka/podrecznik/makro-pkb/makro-pkb-1`); await p.waitForSelector('[data-testid="read-aloud"]');
  await p.click('[data-testid="read-aloud"]'); await p.waitForSelector('[data-testid="speech-bar"]');
  await p.waitForTimeout(1200);
  let sp = await spoken(p);
  check(sp.length >= 2, `${tag} Podręcznik: czyta kolejne fragmenty (${sp.length})`);
  check(await p.locator(".reader-body .speaking").count() === 1, `${tag} Podręcznik: czytany akapit podświetlony`);
  await p.screenshot({ path: `${OUT}/speech-${tag}-podrecznik.png` });
  await p.click('[data-testid="speech-pause"]'); const n1 = (await spoken(p)).length; await p.waitForTimeout(400);
  check((await spoken(p)).length === n1, `${tag} pauza wstrzymuje czytanie`);
  await p.click('[data-testid="speech-resume"]'); await p.waitForTimeout(400);
  check((await spoken(p)).length > n1, `${tag} wznowienie czyta dalej`);
  const pos1 = await p.textContent(".speech-pos");
  await p.click('[data-testid="speech-next"]'); await p.waitForTimeout(100);
  check((await p.textContent(".speech-pos")) !== pos1, `${tag} „następny” przechodzi dalej (${pos1} → ${await p.textContent(".speech-pos")})`);
  await p.click('[data-testid="speech-stop"]'); await p.waitForTimeout(200);
  check(await p.locator('[data-testid="speech-bar"]').count() === 0, `${tag} stop chowa odtwarzacz`);
  // czytaj od zaznaczenia
  if (tag === 1280) {
    const para = p.locator(".reader-body p").nth(2);
    const txt = (await para.textContent()).trim();
    await para.scrollIntoViewIfNeeded();
    await para.evaluate((el) => {
      const t = el.querySelector("[data-o]").firstChild; const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, Math.min(20, t.length));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    });
    await p.waitForSelector('[data-testid="read-from"]', { timeout: 4000 }).catch(() => {});
    if (await p.locator('[data-testid="read-from"]').count()) {
      await p.evaluate(() => { window.__spoken = []; });
      await p.click('[data-testid="read-from"]'); await p.waitForTimeout(200);
      sp = await spoken(p);
      check(sp.length > 0 && txt.replace(/\s+/g, " ").slice(0, 12).split(" ")[0] && sp[0].includes(txt.split(/\s+/)[0]), `${tag} „Czytaj stąd” zaczyna od zaznaczonego akapitu: ${sp[0]?.slice(0, 50)}`);
      await p.click('[data-testid="speech-stop"]');
    } else fails.push(`${tag} brak „Czytaj stąd” w dymku zaznaczenia`);
  }

  // 2. Tabela pojęć – wszystkie wg filtra, pojedyncze hasło
  await p.goto(`${B}/pojecia?q=elastyczność`); await p.waitForSelector('[data-testid="speak-all"]');
  // wyszukiwanie działa z opóźnieniem (useDeferredValue) – czekamy, aż liczba w przycisku przestanie się zmieniać
  for (let prev = "", i = 0; i < 20; i++) { const t = await p.locator('[data-testid="speak-all"]').innerText(); if (t === prev) break; prev = t; await p.waitForTimeout(250); }
  // tytuł z pierwszej linii wiersza (wiersze rodzaju „źródła” nie mają pogrubienia)
  const firstTitle = (await p.locator(".concept-row:not(.head)").first().innerText()).split(/[\n\t]/)[0].trim();
  await p.evaluate(() => { window.__spoken = []; });
  await p.click('[data-testid="speak-all"]'); await p.waitForTimeout(300);
  sp = await spoken(p);
  check(sp[0]?.startsWith(firstTitle.slice(0, 8)), `${tag} Tabela: „Czytaj wszystkie” zaczyna od pierwszego hasła z filtra (${sp[0]?.slice(0, 40)})`);
  check(/\d+ \/ \d+/.test(await p.textContent(".speech-pos")), `${tag} Tabela: postęp „n / N” w odtwarzaczu`);
  await p.click('[data-testid="speech-stop"]');

  // 3. Test – pytanie z odpowiedziami
  await p.goto(`${B}/`); await p.click('button.btn:has-text("Rozpocznij test")'); await p.waitForSelector('[data-testid="speak-question"]');
  await p.evaluate(() => { window.__spoken = []; });
  await p.click('[data-testid="speak-question"]'); await p.waitForTimeout(600);
  sp = (await spoken(p)).join(" ");
  check(/Odpowiedź A/.test(sp) && /Odpowiedź D/.test(sp), `${tag} Test: pytanie z odpowiedziami A–D`);
  await p.locator("main .option").first().click(); await p.click('button.btn:has-text("Sprawdź")'); await p.waitForSelector(".feedback");
  await p.evaluate(() => { window.__spoken = []; });
  await p.click('[data-testid="speak-question"]'); await p.waitForTimeout(800);
  check(/Poprawna odpowiedź/.test((await spoken(p)).join(" ")), `${tag} Test: po sprawdzeniu czyta też poprawną odpowiedź i wyjaśnienie`);

  // 4. Fiszki – po kolei, karta podąża za czytaniem
  await p.goto(`${B}/fiszki?tryb=klasyczne`); await p.waitForSelector('[data-testid="speak-seq"]');
  await p.click('[data-testid="speak-seq"]'); await p.waitForTimeout(1500);
  const pos = await p.textContent('[data-testid="classic-pos"]');
  check(!/^1 \//.test(pos), `${tag} Fiszki: karta przesuwa się razem z czytaniem (${pos})`);
  await p.click('[data-testid="speech-stop"]');

  // 5. Lekcja – ćwiczenie
  await p.goto(`${B}/nauka/lekcja/mikro-rynek-1?sub=2`); await p.waitForSelector('[data-testid="speak-exercise"]');
  await p.evaluate(() => { window.__spoken = []; });
  await p.click('[data-testid="speak-exercise"]'); await p.waitForTimeout(500);
  sp = (await spoken(p)).join(" ");
  check(sp.length > 20 && !/Sprawdź/.test(sp), `${tag} Lekcja: czyta ćwiczenie bez przycisków (${sp.slice(0, 60)})`);
  await ctx.close();
}

// 6. brak polskiego głosu – komunikat
const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
await ctx.addInitScript(mock([{ voiceURI: "en", name: "English", lang: "en-US", localService: true }]));
const p = await ctx.newPage();
await p.goto(`${B}/konto/logowanie`);
await p.fill('input[name="email"]', "owner@example.com"); await p.fill('input[name="password"]', "haslo-wlasciciela");
await p.click("form button.btn"); await p.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
await p.goto(`${B}/nauka/podrecznik/makro-pkb/makro-pkb-1`); await p.waitForSelector('[data-testid="read-aloud"]');
await p.click('[data-testid="read-aloud"]');
check(await p.locator(".speak-warn").count() === 1 && /polskiego głosu/.test(await p.textContent(".speak-warn")), "brak polskiego głosu → komunikat z instrukcją");
await p.screenshot({ path: `${OUT}/speech-430-brak-glosu.png` });
await ctx.close();

// iOS: sesja audio „playback” i strażnik – wypowiedź bez startu → powtórka bez wybranego głosu → podpowiedź
{
  const c2 = await browser.newContext({ viewport: { width: 430, height: 900 } });
  await c2.addInitScript(mock(PL));
  await c2.addInitScript(() => { window.__noStart = true; });
  const q = await c2.newPage();
  await q.goto(`${B}/konto/logowanie`);
  await q.fill('input[name="email"]', "owner@example.com"); await q.fill('input[name="password"]', "haslo-wlasciciela");
  await q.click("form button.btn"); await q.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 15000 });
  await q.goto(`${B}/nauka/podrecznik/makro-pkb/makro-pkb-1`); await q.waitForSelector('[data-testid="read-aloud"]');
  await q.click('[data-testid="read-aloud"]');
  check(await q.evaluate(() => navigator.audioSession.type) === "playback", "iOS: sesja audio ustawiona na „playback” (dźwięk mimo trybu cichego)");
  await q.waitForSelector('[data-testid="speech-hint"]', { timeout: 9000 }).catch(() => {});
  const used = await q.evaluate(() => window.__voicesUsed.slice());
  check(used[0] === "pl-google" && used.includes(null), `strażnik: powtórka bez wybranego głosu (${JSON.stringify(used.slice(0, 3))})`);
  check(/Nic nie słychać/.test(await q.textContent('[data-testid="speech-hint"]').catch(() => "")), "strażnik: podpowiedź „Nic nie słychać?” w pasku");
  await q.screenshot({ path: `${OUT}/speech-hint.png` });
  await q.click('[data-testid="speech-hint"] button'); await q.waitForTimeout(150);
  check(await q.locator('[data-testid="speech-hint"]').count() === 0, "podpowiedź da się zamknąć");
  await c2.close();
}
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
console.log("konsola:", JSON.stringify(errs, null, 1));
await browser.close();
