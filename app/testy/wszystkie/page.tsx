import type { Metadata } from "next";
import { requirePageUser } from "@/lib/auth";
import { countByType } from "@/lib/questions";
import { KINDS, TOPICS } from "@/lib/question-meta";
import HomeClient from "../../home-client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Wszystkie pytania" };

/** Testy → Wszystkie pytania: Archiwum OWE, Pytania AI i Słownik w jednym teście, z filtrami. */
export default async function AllQuestions() {
  await requirePageUser();
  return <HomeClient bank="mix" counts={{ single: countByType("single", "mix"), multi: countByType("multi", "mix") }}
    options={{ topics: TOPICS(), kinds: KINDS() }} />;
}
