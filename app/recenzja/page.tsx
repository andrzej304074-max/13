import { requirePageUser } from "@/lib/auth";
import { ReviewPanel } from "./review-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recenzja treści – Testy OWE" };

export default async function ReviewPage() {
  await requirePageUser({ reviewer: true });
  return (
    <div className="stack">
      <h1>Recenzja treści</h1>
      <p className="muted" style={{ margin: 0 }}>
        Pytania z flagami statystyk albo zgłoszeniami, zgłoszenia merytoryczne bez rozstrzygnięcia i własne zadania i eseje Prognozy XL.
        Oceń każdą pozycję: OK albo do poprawy z komentarzem – administrator widzi oceny w statystykach pytań.
      </p>
      <ReviewPanel />
    </div>
  );
}
