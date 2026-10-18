import { EssayView } from "./view";

export const metadata = { title: "Esej – Testy OWE" };

export default async function EsejPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EssayView id={id} />;
}
