import { TaskView } from "./view";

export const metadata = { title: "Zadanie – Testy OWE" };

export default async function ZadaniePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TaskView id={id} />;
}
