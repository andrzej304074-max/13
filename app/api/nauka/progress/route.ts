import { handle } from "@/lib/api";
import { getProgress } from "@/lib/nauka";
import { getTopic } from "@/lib/nauka-course";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const topic = new URL(req.url).searchParams.get("topic");
  return handle(() => getProgress(topic && getTopic(topic) ? topic : null));
}
