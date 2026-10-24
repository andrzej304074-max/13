/**
 * Źródło pytania – jedno miejsce dla serwera i przeglądarki (bez danych pytań): Archiwum OWE, Pytania AI (od użytkownika,
 * sprawdzone), Słownik i Hasło XL (pytania o hasło przewodnie XL edycji pisane w aplikacji – ręcznie i skryptem).
 * Rozpoznawane po prefiksie id: `ai-…` – Pytania AI, `sl-…` – Słownik, `xl-…` – Hasło XL, pozostałe – Archiwum OWE.
 */
export type QSource = "owe" | "ai" | "slownik" | "xl";

export const SOURCES: { id: QSource; icon: string; label: string; hint: string }[] = [
  { id: "owe", icon: "📜", label: "Archiwum OWE", hint: "prawdziwe pytania z olimpiad XXI–XXXIX" },
  { id: "ai", icon: "🤖", label: "Pytania AI", hint: "przesłane przez Ciebie, sprawdzone i poprawione, z wyjaśnieniami" },
  { id: "slownik", icon: "📘", label: "Słownik", hint: "pytania z haseł słownika pojęć – ręcznie pisane i automatyczne" },
  { id: "xl", icon: "🎯", label: "Hasło XL (własne)", hint: "„Gospodarka wobec wyzwań demograficznych” – pytania pisane ręcznie i skryptem" },
];
export const SOURCE_IDS = SOURCES.map((s) => s.id);
export const isSource = (v: unknown): v is QSource => (SOURCE_IDS as unknown[]).includes(v);

export const sourceOf = (id: string): QSource =>
  id.startsWith("ai-") ? "ai" : id.startsWith("sl-") ? "slownik" : id.startsWith("xl-") ? "xl" : "owe";

/** To samo w SQL: wyrażenie ze źródłem pytania o id w kolumnie `col` i warunek „pytanie z tego źródła”. */
export const sourceCaseSql = (col: string) =>
  `CASE WHEN ${col} LIKE 'sl-%' THEN 'slownik' WHEN ${col} LIKE 'ai-%' THEN 'ai' WHEN ${col} LIKE 'xl-%' THEN 'xl' ELSE 'owe' END`;
export const sourceWhereSql = (col: string, src: QSource) =>
  src === "owe" ? `${col} NOT LIKE 'sl-%' AND ${col} NOT LIKE 'ai-%' AND ${col} NOT LIKE 'xl-%'` : `${col} LIKE '${src === "slownik" ? "sl" : src}-%'`;
