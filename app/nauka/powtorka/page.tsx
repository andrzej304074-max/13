import Link from "next/link";
import { requirePageUser } from "@/lib/auth";
import { weakItems } from "@/lib/nauka";
import { reviewPayload } from "@/lib/nauka-course";
import { LessonPlayer } from "../lekcja/player";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const me = await requirePageUser();
  let payload = null;
  let error: string | null = null;
  try {
    payload = reviewPayload(await weakItems(me.id, 8));
  } catch (e) {
    console.error(e);
    error = "Nie udało się pobrać historii odpowiedzi.";
  }
  if (!payload) {
    return (
      <div className="stack">
        <h1>Powtórka słabych haseł</h1>
        <p className={error ? "error" : "muted"}>
          {error ?? "Na razie nie ma haseł do powtórki – pojawią się tu hasła, przy których skuteczność jest poniżej 80% (co najmniej 2 odpowiedzi w ostatnich 60 dniach)."}
        </p>
        <Link className="btn" href="/nauka">Wróć do nauki</Link>
      </div>
    );
  }
  return <LessonPlayer payload={payload} next={null} />;
}
