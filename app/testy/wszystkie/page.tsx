import { redirect } from "next/navigation";

/** Dawna zakładka „Wszystkie pytania” – teraz formularz „Pytania” pod `/` (parametry adresu, np. `?bledy=1`, przechodzą dalej). */
export default async function AllQuestions({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) if (typeof v === "string") q.set(k, v);
  redirect(q.size ? `/?${q}` : "/");
}
