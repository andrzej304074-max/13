import { request } from "playwright-core";
const B = "http://localhost:3100";
let ok = 0; const fails = [];
const check = (c, m) => (c ? ok++ : fails.push(m));
async function login(email, password) {
  const r = await request.newContext({ baseURL: B });
  const res = await r.post("/api/konto/logowanie", { data: { email, password } });
  if (!res.ok()) throw new Error(`login ${email} ${res.status()} ${await res.text()}`);
  return r;
}
const A = await login("owner@example.com", "haslo-wlasciciela");
const U = await login("drugi@example.com", "nowe-haslo-123");
const st = async (p) => (await p).status();
const j = async (p) => (await p).json();

// --- własne fiszki: walidacja
check(await st(A.post("/api/fiszki/moje", { data: { t: "", d: "x", topic: "mikro", kind: "pojecie" } })) === 400, "własna: puste hasło → 400");
check(await st(A.post("/api/fiszki/moje", { data: { t: "x", d: "y", topic: "zly", kind: "pojecie" } })) === 400, "własna: zły dział → 400");
check(await st(A.post("/api/fiszki/moje", { data: { t: "x", d: "y", topic: "mikro", kind: "zrozumienie" } })) === 400, "własna: kategoria zrozumienie → 400");
check(await st(A.post("/api/fiszki/moje", { data: { t: "x".repeat(121), d: "y", topic: "mikro", kind: "pojecie" } })) === 400, "własna: za długie hasło → 400");
check(await st(A.post("/api/fiszki/moje", { data: "nie-json" })) === 400, "własna: zły JSON → 400");
const own = await j(A.post("/api/fiszki/moje", { data: { t: "Sonda <b>html</b>", d: "def", w: "", topic: "mikro", kind: "pojecie" } }));
check(own.id?.startsWith("u:"), `własna: id u: (${own.id})`);
check(own.w === null || own.w === "", `własna: pusty wzór → null (${JSON.stringify(own.w)})`);
// --- drugie konto nie ma dostępu
const e = encodeURIComponent(own.id);
check(!(await j(U.get("/api/fiszki/moje"))).some((c) => c.id === own.id), "drugi nie widzi cudzej fiszki");
check([403, 404].includes(await st(U.patch(`/api/fiszki/moje/${e}`, { data: { t: "hak", d: "hak", topic: "mikro", kind: "pojecie" } }))), "drugi: PATCH cudzej → 403/404");
check((await j(A.get("/api/fiszki/moje"))).find((c) => c.id === own.id)?.t === own.t, "cudza fiszka niezmieniona");
check([403, 404].includes(await st(U.delete(`/api/fiszki/moje/${e}`))), "drugi: DELETE cudzej → 403/404");
check((await st(U.post("/api/fiszki/ocena", { data: { item: own.id, known: true } }))) >= 400, "drugi: ocena cudzej → błąd");
check((await st(U.post("/api/gwiazdki", { data: { kind: "fiszka", ref: own.id, on: true } }))) >= 400, "drugi: gwiazdka na cudzej → błąd");
const ud = await j(U.post("/api/talie", { data: { name: "sonda" } }));
check((await st(U.post(`/api/talie/${ud.id}/karty`, { data: { item: own.id } }))) >= 400, "drugi: cudza fiszka do talii → błąd");
check((await st(U.post(`/api/talie/${ud.id}/karty`, { data: { item: "nie-ma-takiego" } }))) >= 400, "talia: nieistniejące hasło → błąd");
check((await st(A.post(`/api/talie/${ud.id}/karty`, { data: { item: own.id } }))) >= 400, "właściciel: do cudzej talii → błąd");
check((await st(A.get(`/api/talie/${ud.id}`))) === 404, "cudza talia → 404");
await U.delete(`/api/talie/${ud.id}`);
// usunięcie własnej znika z talii i gwiazdek
const ad = await j(A.post("/api/talie", { data: { name: "sonda2", items: [own.id] } }));
await A.post("/api/gwiazdki", { data: { kind: "fiszka", ref: own.id, on: true } });
check((await st(A.delete(`/api/fiszki/moje/${e}`))) === 200, "usunięcie własnej");
check(!(await j(A.get(`/api/talie/${ad.id}`))).items.includes(own.id), "po usunięciu – brak w talii");
check(!(await j(A.get("/api/gwiazdki?rodzaj=fiszka"))).includes(own.id), "po usunięciu – brak gwiazdki");
await A.delete(`/api/talie/${ad.id}`);

// --- notatki: cudze, karty
const n = await j(A.post("/api/notatki", { data: { kind: "note", title: "sonda", cards: [{ id: "abc", x: 1, y: 1 }] } }));
check(n.cards?.length === 1, "notatka z kartą przy tworzeniu");
check([403, 404].includes(await st(U.get(`/api/notatki/${n.id}`))), "drugi: cudza notatka → 403/404");
check([403, 404].includes(await st(U.patch(`/api/notatki/${n.id}`, { data: { title: "hak" } }))), "drugi: PATCH cudzej notatki");
check((await st(A.patch(`/api/notatki/${n.id}`, { data: { cards: "zle" } }))) === 400, "notatka: złe karty → 400");
check((await st(A.patch(`/api/notatki/${n.id}`, { data: { cards: Array.from({ length: 31 }, (_, i) => ({ id: `h${i}`, x: 0, y: 0 })) } }))) === 400, "notatka: 31 kart → 400");
const n2 = await j(A.patch(`/api/notatki/${n.id}`, { data: { cards: [] } }));
check(n2.cards?.length === 0, "notatka: same karty bez body/ink");
const list = await j(A.get("/api/notatki?rodzaj=note"));
check(list.every((x) => !("cards" in x) && !("ink" in x)), "lista notatek bez kart i rysunku");
await A.delete(`/api/notatki/${n.id}`);

// --- testy: etap i zła liczba
check((await st(A.post("/api/tests", { data: { type: "single", count: 31 } }))) === 400, "test: zła liczba → 400");
check((await st(A.post("/api/tests", { data: { type: "single", count: 30, stage: "x" } }))) === 400, "test: zły etap → 400");
const sl = await j(A.post("/api/tests", { data: { type: "single", count: 30, bank: "slownik", stage: "s" } }));
check(sl.questions?.length === 30, "słownik: etap ignorowany");
await A.post(`/api/tests/${sl.id}/finish`);
const tt = await j(A.post("/api/tests", { data: { type: "single", count: 30 } }));
check([403, 404].includes(await st(U.get(`/api/tests/${tt.id}`))), "drugi: cudzy test → 404");
check([403, 404].includes(await st(U.post(`/api/tests/${tt.id}/answer`, { data: { questionId: tt.questions[0].id, selected: [0] } }))), "drugi: odpowiedź w cudzym teście");
check((await st(A.post(`/api/tests/${tt.id}/answer`, { data: { questionId: tt.questions[0].id, selected: [0, 1] } }))) === 400, "jednokrotny: 2 zaznaczenia → 400");
check((await st(A.post(`/api/tests/${tt.id}/answer`, { data: { questionId: "zle", selected: [0] } }))) === 400, "obce pytanie → 400");
await A.post(`/api/tests/${tt.id}/answer`, { data: { questionId: tt.questions[0].id, selected: [0] } });
check((await st(A.post(`/api/tests/${tt.id}/answer`, { data: { questionId: tt.questions[0].id, selected: [1] } }))) === 409, "druga odpowiedź → 409");
await A.post(`/api/tests/${tt.id}/finish`);
check((await st(A.post(`/api/tests/${tt.id}/finish`))) < 500, "drugie zakończenie bez 500");
check((await st(A.get("/api/stats?bank=owe&type=single&stage=zle"))) === 200, "statystyki: zły etap ignorowany");

// --- nauka: cudza sesja
const s = await j(A.post("/api/nauka/sessions", { data: { lesson: "mikro-podstawy-1", sub: 1 } }));
await U.patch(`/api/nauka/sessions/${s.id}`, { data: { pos: 3, total: 5 } });
const prog = await j(A.get("/api/nauka/progress?lekcje=1"));
check(!JSON.stringify(prog).includes('"pos":3'), "drugi: postęp cudzej sesji bez zmian");
check((await st(U.post(`/api/nauka/sessions/${s.id}/finish`, { data: { answers: [] } }))) >= 400, "drugi: zakończenie cudzej sesji → błąd");
check((await st(A.patch(`/api/nauka/sessions/${s.id}`, { data: { pos: -1, total: "x" } }))) === 400, "postęp: złe dane → 400");
check((await st(A.post("/api/nauka/sessions", { data: { lesson: "nie-ma", sub: 1 } }))) >= 400, "sesja: zła lekcja → błąd");

// --- ponowienia po zgubionej odpowiedzi: ta sama sesja / notatka zamiast kopii
const cid = crypto.randomUUID();
const s1 = await j(A.post("/api/nauka/sessions", { data: { lesson: "mikro-rynek-1", sub: 1, cid } }));
const s2 = await j(A.post("/api/nauka/sessions", { data: { lesson: "mikro-rynek-1", sub: 1, cid } }));
check(s1.id && s1.id === s2.id, "sesja: ten sam cid → ta sama sesja");
const s3 = await j(U.post("/api/nauka/sessions", { data: { lesson: "mikro-rynek-1", sub: 1, cid } }));
check(s3.id && s3.id !== s1.id, "sesja: ten sam cid innego konta → osobna sesja");
const itemId = Object.keys(JSON.parse((await import("node:fs")).readFileSync("./data/nauka/course.json", "utf8")).items)[0];
const ans = [{ item: itemId, exercise: "fiszka", correct: true, ms: 1000 }];
check((await st(U.post(`/api/nauka/sessions/${s1.id}/finish`, { data: { answers: ans } }))) === 404, "zakończenie cudzej sesji → 404");
check((await st(A.post(`/api/nauka/sessions/${s1.id}/finish`, { data: { answers: ans } }))) === 200, "zakończenie własnej sesji → 200");
check((await st(A.post(`/api/nauka/sessions/${s1.id}/finish`, { data: { answers: ans } }))) === 409, "ponowne zakończenie własnej → 409");
const ncid = crypto.randomUUID();
const before = (await j(A.get("/api/notatki"))).length;
const nc1 = await j(A.post("/api/notatki", { data: { kind: "note", title: "cid", body: "a", cid: ncid } }));
const nc2 = await j(A.post("/api/notatki", { data: { kind: "note", title: "cid", body: "b", cid: ncid } }));
check(nc1.id === nc2.id && nc2.body === "b", "notatka: ten sam cid → ta sama notatka, nowa treść");
check((await j(A.get("/api/notatki"))).length === before + 1, "notatka: bez kopii");
await A.delete(`/api/notatki/${nc1.id}`);

// --- podgląd admina tylko do odczytu
const me = await j(U.get("/api/konto/ja").catch(() => null)).catch(() => null);
console.log(`OK: ${ok} błędów: ${fails.length}`, JSON.stringify(fails, null, 1));
