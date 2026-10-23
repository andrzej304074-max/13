/**
 * Źródło pytania – jedno miejsce dla serwera i przeglądarki (bez danych pytań): Archiwum OWE, Pytania AI (sprawdzone),
 * Słownik. Rozpoznawane po prefiksie id: `ai-…` – Pytania AI, `sl-…` – Słownik, pozostałe – Archiwum OWE.
 */
export type QSource = "owe" | "ai" | "slownik";

export const SOURCES: { id: QSource; icon: string; label: string; hint: string }[] = [
  { id: "owe", icon: "📜", label: "Archiwum OWE", hint: "prawdziwe pytania z olimpiad XXI–XXXIX" },
  { id: "ai", icon: "🤖", label: "Pytania AI", hint: "sprawdzone i poprawione, z wyjaśnieniami" },
  { id: "slownik", icon: "📘", label: "Słownik", hint: "pytania z haseł słownika pojęć" },
];
export const isSource = (v: unknown): v is QSource => v === "owe" || v === "ai" || v === "slownik";

export const sourceOf = (id: string): QSource => (id.startsWith("ai-") ? "ai" : id.startsWith("sl-") ? "slownik" : "owe");

/** To samo w SQL: wyrażenie ze źródłem pytania o id w kolumnie `col` i warunek „pytanie z tego źródła”. */
export const sourceCaseSql = (col: string) => `CASE WHEN ${col} LIKE 'sl-%' THEN 'slownik' WHEN ${col} LIKE 'ai-%' THEN 'ai' ELSE 'owe' END`;
export const sourceWhereSql = (col: string, src: QSource) =>
  src === "owe" ? `${col} NOT LIKE 'sl-%' AND ${col} NOT LIKE 'ai-%'` : `${col} LIKE '${src === "ai" ? "ai" : "sl"}-%'`;
