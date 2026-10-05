import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const dir = path.join(__dirname, "..", "data", "questions");
const files = readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
const index = readFileSync(path.join(dir, "index.ts"), "utf8");
const errors: string[] = [];
const ids = new Set<string>();
const data: Record<string, unknown>[] = [];

for (const file of files) {
  if (!index.includes(`./${file}`)) errors.push(`${file}: brak importu w data/questions/index.ts`);
  const items = JSON.parse(readFileSync(path.join(dir, file), "utf8")) as Record<string, unknown>[];
  items.forEach((q) => data.push({ ...q, _file: file }));
}

data.forEach((q) => {
  const where = `${String(q._file)} (${String(q.id)})`;
  if (typeof q.id !== "string" || !q.id) errors.push(`${where}: brak id`);
  else if (ids.has(q.id)) errors.push(`${where}: zduplikowane id`);
  else ids.add(q.id);
  if (q.type !== "single" && q.type !== "multi") errors.push(`${where}: type musi być "single" lub "multi"`);
  if (typeof q.question !== "string" || !q.question.trim()) errors.push(`${where}: puste pytanie`);
  if (typeof q.edition !== "string") errors.push(`${where}: brak edition`);
  if (!Array.isArray(q.options) || q.options.length !== 4 || q.options.some((o) => typeof o !== "string" || !o.trim())) {
    errors.push(`${where}: wymagane 4 niepuste opcje`);
  }
  const correct = q.correct;
  if (!Array.isArray(correct) || correct.some((c) => !Number.isInteger(c) || c < 0 || c > 3) || new Set(correct).size !== correct.length) {
    errors.push(`${where}: correct musi być listą różnych indeksów 0–3`);
  } else if (q.type === "single" && correct.length !== 1) {
    errors.push(`${where}: pytanie jednokrotnego wyboru musi mieć dokładnie 1 poprawną odpowiedź`);
  }
  if (typeof q.explanation !== "string" || !q.explanation.trim()) errors.push(`${where}: brak wyjaśnienia`);
});

const single = data.filter((q) => q.type === "single").length;
const multi = data.filter((q) => q.type === "multi").length;
console.log(`Plików: ${files.length}, pytań: ${data.length} (jednokrotnego wyboru: ${single}, wielokrotnego: ${multi})`);
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log("OK");
