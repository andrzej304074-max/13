import { SLOWNIK_SECTIONS } from "@/data/slownik";
import { requirePageUser } from "@/lib/auth";
import { countByType } from "@/lib/questions";
import { KINDS, TOPICS } from "@/lib/question-meta";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

/** Testy → Pytania: jeden formularz dla wszystkich źródeł (dawne zakładki Olimpiada, Słownik i „Wszystkie pytania”). */
export default async function Home() {
  await requirePageUser();
  return <HomeClient counts={{ single: countByType("single", "mix"), multi: countByType("multi", "mix") }}
    options={{ topics: TOPICS(), kinds: KINDS(), sections: SLOWNIK_SECTIONS }} />;
}
