import { query } from "./db";
import { COURSE } from "./nauka-course";
import { getQuestion } from "./questions";
import { questionMeta } from "./question-meta";
import { sourceOf } from "./question-source";
import { analyse, type QStatRow } from "./question-stats-core";

/** Wszystkie pytania z co najmniej jedną odpowiedzią – jedno zapytanie po `answers` plus zgłoszenia błędów. */
export async function questionStats(): Promise<{ rows: QStatRow[]; course: { item: string; title: string; exercise: string; n: number; pct: number }[] }> {
  const [{ rows }, { rows: bugs }, { rows: course }] = await Promise.all([
    query<{ q: string; n: string; acc: number; o0: string; o1: string; o2: string; o3: string }>(
      `SELECT a.question_id AS q, COUNT(*) AS n,
         AVG(CASE WHEN a.skipped THEN 0 WHEN t.type = 'single' THEN (a.points = 2)::int ELSE a.points / 2 END) AS acc,
         COUNT(*) FILTER (WHERE NOT a.skipped AND 0 = ANY(a.selected)) AS o0, COUNT(*) FILTER (WHERE NOT a.skipped AND 1 = ANY(a.selected)) AS o1,
         COUNT(*) FILTER (WHERE NOT a.skipped AND 2 = ANY(a.selected)) AS o2, COUNT(*) FILTER (WHERE NOT a.skipped AND 3 = ANY(a.selected)) AS o3
       FROM answers a JOIN tests t ON t.id = a.test_id GROUP BY 1`),
    query<{ text: string; page: string }>("SELECT text, page FROM bug_reports ORDER BY created_at DESC LIMIT 5000"),
    query<{ item: string; exercise: string; n: string; acc: number }>(
      `SELECT item_id AS item, exercise, COUNT(*) AS n, AVG(correct::int) AS acc FROM learn_answers GROUP BY 1, 2 HAVING COUNT(*) >= 5`),
  ]);
  const bugText = bugs.map((b) => `${b.text} ${b.page}`);
  const out: QStatRow[] = [];
  for (const r of rows) {
    const q = getQuestion(r.q);
    if (!q) continue;
    out.push(analyse({
      id: q.id, src: sourceOf(q.id), topic: questionMeta(q.id)?.topic ?? null, type: q.type, question: q.question.length > 160 ? `${q.question.slice(0, 157)}…` : q.question,
      n: Number(r.n), pct: Math.round(Number(r.acc) * 1000) / 10,
      picks: [r.o0, r.o1, r.o2, r.o3].map(Number), correct: q.correct,
      reports: bugText.filter((t) => t.includes(q.id)).length,
    }));
  }
  return {
    rows: out,
    course: course.map((c) => ({ item: c.item, title: COURSE.items[c.item]?.t ?? c.item, exercise: c.exercise, n: Number(c.n), pct: Math.round(Number(c.acc) * 1000) / 10 })),
  };
}
