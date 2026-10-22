import { SLOWNIK_SECTIONS } from "@/data/slownik";
import { countByType } from "@/lib/questions";
import { KINDS, TOPICS } from "@/lib/question-meta";
import HomeClient from "../home-client";

export default function SlownikHome() {
  return (
    <HomeClient
      bank="slownik"
      counts={{ single: countByType("single", "slownik"), multi: countByType("multi", "slownik") }}
      options={{ topics: TOPICS(), kinds: KINDS(), sections: SLOWNIK_SECTIONS }}
    />
  );
}
