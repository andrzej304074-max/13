import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { getNaukaStats, type Range } from "@/lib/nauka";
import { COURSE, getLesson, getTopic, getUnit } from "@/lib/nauka-course";
import { EXERCISE_LABELS, type ExerciseType, type ItemKind } from "@/lib/nauka-types";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const topic = p.get("topic"), unit = p.get("unit"), lesson = p.get("lesson");
  const kind = p.get("kind"), exercise = p.get("exercise"), range = p.get("range"), sub = Number(p.get("sub"));
  return handle(async () =>
    getNaukaStats(await viewedUserId(req, await requireUser()), {
      topic: topic && (getTopic(topic) || topic === "powtorka") ? topic : null,
      unit: unit && getUnit(unit) ? unit : null,
      lesson: lesson && getLesson(lesson) ? lesson : null,
      sub: [1, 2, 3, 4].includes(sub) ? sub : null,
      kind: kind && COURSE.kinds.some((k) => k.id === kind) ? (kind as ItemKind) : null,
      exercise: exercise && Object.hasOwn(EXERCISE_LABELS, exercise) ? (exercise as ExerciseType) : null,
      range: range === "7d" || range === "30d" ? (range as Range) : "all",
    }),
  );
}
