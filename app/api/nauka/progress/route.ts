import { handle } from "@/lib/api";
import { requireUser, viewedUserId } from "@/lib/auth";
import { getProgress } from "@/lib/nauka";
import { getTopic } from "@/lib/nauka-course";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const topic = new URL(req.url).searchParams.get("topic");
  return handle(async () => getProgress(await viewedUserId(req, await requireUser()), topic && getTopic(topic) ? topic : null));
}
