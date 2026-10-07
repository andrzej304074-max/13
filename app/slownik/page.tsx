import { SLOWNIK_SECTIONS } from "@/data/slownik";
import { countByType, slownikCounts } from "@/lib/questions";
import HomeClient from "../home-client";

export default function SlownikHome() {
  return (
    <HomeClient
      bank="slownik"
      counts={{ single: countByType("single", "slownik"), multi: countByType("multi", "slownik") }}
      slownik={{ counts: slownikCounts(), sections: SLOWNIK_SECTIONS }}
    />
  );
}
