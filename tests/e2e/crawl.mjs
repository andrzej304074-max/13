import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const issues = [];
let pages = 0;
const login = async (page, email, pass) => {
  await page.goto(`${B}/konto/logowanie`);
  await page.fill('input[name="email"]', email); await page.fill('input[name="password"]', pass);
  await page.click("form button.btn"); await page.waitForURL((u) => !u.pathname.startsWith("/konto"), { timeout: 20000 });
};
for (const scheme of ["light", "dark"]) for (const vp of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
  const tag = `${scheme}/${vp.width}`;
  const ctx = await browser.newContext({ viewport: vp, colorScheme: scheme, hasTouch: vp.width < 600 });
  const page = await ctx.newPage();
  let cur = "";
  page.on("console", (m) => { if (m.type() === "error" && !/ERR_ABORTED/.test(m.text())) issues.push(`${tag} ${cur} console: ${m.text().slice(0, 200)}`); });
  page.on("pageerror", (e) => issues.push(`${tag} ${cur} pageerror: ${e.message.slice(0, 200)}`));
  page.on("response", (r) => { const u = r.url(); if (r.status() >= 400 && u.startsWith(B) && !u.includes("/_next/")) issues.push(`${tag} ${cur} HTTP ${r.status()} ${u.replace(B, "")}`); });
  await login(page, "owner@example.com", "haslo-wlasciciela");
  const t = await (await page.request.post(`${B}/api/tests`, { data: { type: "multi", count: 30 } })).json();
  const note = await (await page.request.post(`${B}/api/notatki`, { data: { kind: "note", title: "crawl" } })).json();
  const deck = await (await page.request.post(`${B}/api/talie`, { data: { name: "crawl" } })).json();
  const routes = ["/", "/?zrodlo=xl", "/stats", "/stats/dzialy", `/test/${t.id}`, "/nauka", "/nauka/mikro", "/nauka/lekcja/mikro-rynek-1?sub=1",
    "/nauka/powtorka", "/nauka/statystyki", "/nauka/podrecznik", "/nauka/podrecznik/mikro-podstawy", "/nauka/podrecznik/mikro-podstawy/mikro-podstawy-1", "/fiszki", "/fiszki?tryb=klasyczne", "/fiszki/talie",
    `/fiszki/talie/${deck.id}`, "/pojecia", "/pojecia/mapa", "/pojecia/mapa?q=i31c22b37a", "/pojecia/pokrycie", "/pojecia/statystyki", "/notatki",
    `/notatki/${note.id}`, "/notatki/brudnopisy", "/konto/ustawienia", "/admin",
    "/zadania", "/zadania/owe-39-okregowe-zadanie", "/eseje", "/eseje/owe-39-okregowe-esej", "/nauka/olimpiada", "/nauka/literatura",
    "/ogloszenia", "/zgloszenia"];
  for (const r of routes) {
    cur = r; pages++;
    try {
      const res = await page.goto(`${B}${r}`, { waitUntil: "networkidle", timeout: 30000 });
      if (res && res.status() >= 400) issues.push(`${tag} ${r} status ${res.status()}`);
      await page.waitForTimeout(400);
      const o = await page.evaluate(() => {
        const out = { hscroll: document.documentElement.scrollWidth > window.innerWidth + 1, wide: [] };
        if (out.hscroll) for (const el of document.querySelectorAll("body *")) { const b = el.getBoundingClientRect(); if (b.right > window.innerWidth + 1 && b.width > 0 && getComputedStyle(el).position !== "fixed") { out.wide.push(`${el.tagName.toLowerCase()}.${String(el.className).split(" ")[0]}`); if (out.wide.length > 3) break; } }
        // czytelność: tekst prawie tego samego koloru co tło
        const bg = getComputedStyle(document.body).backgroundColor;
        out.bg = bg;
        out.err = [...document.querySelectorAll(".error")].map((e) => e.textContent.trim()).filter(Boolean).slice(0, 2);
        return out;
      });
      if (o.hscroll) issues.push(`${tag} ${r} poziome przewijanie: ${o.wide.join(", ")}`);
      if (o.err.length) issues.push(`${tag} ${r} komunikat błędu na stronie: ${o.err.join(" | ")}`);
    } catch (e) { issues.push(`${tag} ${r} wyjątek: ${e.message.split("\n")[0]}`); }
  }
  await page.request.delete(`${B}/api/notatki/${note.id}`); await page.request.delete(`${B}/api/talie/${deck.id}`);
  await page.request.post(`${B}/api/tests/${t.id}/finish`);
  await ctx.close();
}
await browser.close();
console.log(`stron: ${pages}, problemów: ${issues.length}`);
console.log([...new Set(issues)].join("\n"));
