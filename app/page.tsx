import { requirePageUser } from "@/lib/auth";
import { countByType } from "@/lib/questions";
import { KINDS, TOPICS } from "@/lib/question-meta";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requirePageUser();
  return <HomeClient counts={{ single: countByType("single"), multi: countByType("multi") }} options={{ topics: TOPICS(), kinds: KINDS() }} />;
}
