import { COURSE, OWE_STATS, SLOWNIK_STATS } from "@/data/nauka";
import { query } from "./db";
import { HttpError } from "./tests";
import { addXp } from "./xp";
import { FLASH_DAILY_CAP, FLASH_XP } from "./xp-core";
import { combineMastery, type Mastery } from "./mastery-core";
import { loadAnswers } from "./my-stats";

const REC_ITEMS = new Map<string, string[]>([...OWE_STATS, ...SLOWNIK_STATS].map((r) => [r.id, r.items]));

export async function getMastery(userId: string): Promise<Record<string, Mastery>> {
  const [learn, flash, tests] = await Promise.all([
    query<{ item: string; c: string; t: string; last: Date }>(
      `SELECT a.item_id AS item, SUM(a.correct::int) AS c, COUNT(*) AS t, MAX(a.answered_at) AS last
       FROM learn_answers a JOIN learn_sessions s ON s.id = a.session_id
       WHERE s.user_id = $1 AND a.item_kind <> 'zrozumienie' GROUP BY 1`, [userId]),
    query<{ item: string; c: string; t: string; last: Date }>(
      `SELECT item_id AS item, SUM(known::int) AS c, COUNT(*) AS t, MAX(at) AS last FROM flash_ratings WHERE user_id = $1 GROUP BY 1`, [userId]),
    loadAnswers(userId, null),
  ]);
  const conv = (r: { item: string; c: string; t: string; last: Date }) => ({ item: r.item, c: Number(r.c), t: Number(r.t), last: r.last.getTime() });
  return combineMastery(learn.rows.map(conv), tests, REC_ITEMS, flash.rows.map(conv));
}

export async function rateFlashcard(userId: string, itemId: unknown, known: unknown) {
  if (typeof itemId !== "string" || !COURSE.items[itemId] || COURSE.items[itemId].kind === "zrozumienie") throw new HttpError(400, "Nieznane hasło.");
  if (typeof known !== "boolean") throw new HttpError(400, "Brak oceny.");
  await query("INSERT INTO flash_ratings (user_id, item_id, known) VALUES ($1, $2, $3)", [userId, itemId, known]);
  await addXp(userId, "fiszki", FLASH_XP, FLASH_DAILY_CAP);
  return { ok: true };
}
