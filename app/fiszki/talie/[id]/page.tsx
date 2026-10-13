import { DeckEditor } from "./editor";

export const metadata = { title: "Talia – Testy OWE" };

export default async function TaliaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DeckEditor id={id} />;
}
