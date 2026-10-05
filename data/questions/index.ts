import type { Question } from "@/lib/types";
import owe21 from "./owe-21-okregowe.json";
import owe22 from "./owe-22-okregowe.json";
import owe23 from "./owe-23-okregowe.json";
import owe24 from "./owe-24-okregowe.json";
import owe25 from "./owe-25-okregowe.json";

// Każdy plik to część testowa jednego zestawu OWE. Nowy plik dopisz tutaj.
export const QUESTIONS = [owe21, owe22, owe23, owe24, owe25].flat() as Question[];
