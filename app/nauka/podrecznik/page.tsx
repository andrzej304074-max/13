import { bookIndex } from "@/lib/podrecznik";
import { BookIndexView } from "./index-view";

export const metadata = { title: "Podręcznik – Testy OWE" };

export default function PodrecznikPage() {
  return <BookIndexView index={bookIndex()} />;
}
