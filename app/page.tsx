import { requirePageUser } from "@/lib/auth";
import { countByType } from "@/lib/questions";
import HomeClient from "./home-client";

export const dynamic = "force-dynamic";

export default async function Home() {
  await requirePageUser();
  return <HomeClient counts={{ single: countByType("single"), multi: countByType("multi") }} />;
}
