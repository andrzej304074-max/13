import { NoteView } from "./view";

export const metadata = { title: "Notatka – Testy OWE" };

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <NoteView id={id} />;
}
