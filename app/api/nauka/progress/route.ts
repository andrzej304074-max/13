import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { getProgress } from "@/lib/nauka";
import { getTopic } from "@/lib/nauka-course";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const topic = p.get("topic");
  return handle(async () => {
    const res = await getProgress(await viewedUserId(req, await requireUser()), topic && getTopic(topic) ? topic : null);
    // ?lekcje=0 – sama suma i tematy (strona główna Nauki nie potrzebuje postępu 900 lekcji)
    return p.get("lekcje") === "0" ? { ...res, lessons: {} } : res;
  });
}
