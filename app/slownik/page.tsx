import { redirect } from "next/navigation";

/** Dawna zakładka Słownik – formularz „Pytania” z samym źródłem Słownik. */
export default function SlownikHome() {
  redirect("/?zrodlo=slownik");
}
