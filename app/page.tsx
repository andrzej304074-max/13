import { countByType } from "@/lib/questions";
import HomeClient from "./home-client";

export default function Home() {
  return <HomeClient counts={{ single: countByType("single"), multi: countByType("multi") }} />;
}
