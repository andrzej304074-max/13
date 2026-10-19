import { chromium } from "playwright-core";
const B = "http://localhost:3100";
const b = await chromium.launch({ executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const p = await b.newPage();
await p.goto(B + "/konto/logowanie"); await p.fill('input[name="email"]', "owner@example.com"); await p.fill('input[name="password"]', "haslo-wlasciciela"); await p.click("form button.btn"); await p.waitForTimeout(1500);
let ok = 0; const fails = []; const check = (c, m) => (c ? ok++ : fails.push(m));
for (const [bank, section] of [["owe", null], ["slownik", 6]]) {
  const t = await (await p.request.post(B + "/api/tests", { data: { type: "multi", count: "endless", bank, section } })).json();
  let q = t.questions[0]; const seen = new Set();
  let n = 0, dup = 0, outOfSection = 0;
  for (; n < 130 && q; n++) {
    if (seen.has(q.id)) dup++; seen.add(q.id);
    if (section && !/dz\. 6\./.test(q.edition)) outOfSection++;
    const r = await (await p.request.post(`${B}/api/tests/${t.id}/answer`, { data: { questionId: q.id, selected: [0], skip: n % 7 === 0 } })).json();
    if (r.error) { fails.push(`${bank} odpowiedź ${n}: ${r.error}`); break; }
    q = r.nextQuestion;
  }
  const full = bank === "owe";
  check(full ? n === 130 : n > 0 && n < 130 && q === null, `${bank}: ${full ? "130 pytań bez przerwy (porcje po 100)" : "cała pula działu, potem koniec"}: ${n}`);
  check(dup === 0, `${bank}: brak powtórzeń pytań (${dup})`);
  if (section) check(outOfSection === 0, `${bank}: dolosowane pytania z wybranego działu (${outOfSection})`);
  const st = await (await p.request.get(`${B}/api/tests/${t.id}`)).json();
  check(st.answers.length === n && (full ? !st.finishedAt : !!st.finishedAt), `${bank}: stan testu – ${n} odpowiedzi, ${full ? "test trwa" : "test zakończony po wyczerpaniu puli"}`);
}
console.log("OK:", ok, "błędów:", fails.length, JSON.stringify(fails, null, 1));
await b.close();
