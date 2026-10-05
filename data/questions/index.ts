import type { Question } from "@/lib/types";
import owe21o from "./owe-21-okregowe.json";
import owe21s from "./owe-21-szkolne.json";
import owe22o from "./owe-22-okregowe.json";
import owe22s from "./owe-22-szkolne.json";
import owe23o from "./owe-23-okregowe.json";
import owe23s from "./owe-23-szkolne.json";
import owe24o from "./owe-24-okregowe.json";
import owe24s from "./owe-24-szkolne.json";
import owe25o from "./owe-25-okregowe.json";
import owe25s from "./owe-25-szkolne.json";
import owe26o from "./owe-26-okregowe.json";
import owe26s from "./owe-26-szkolne.json";
import owe29o from "./owe-29-okregowe.json";
import owe29s from "./owe-29-szkolne.json";
import owe30s from "./owe-30-szkolne.json";

// Każdy plik to część testowa jednego zestawu OWE. Nowy plik dopisz tutaj.
export const QUESTIONS = [
  owe21o, owe21s, owe22o, owe22s, owe23o, owe23s, owe24o, owe24s, owe25o, owe25s,
  owe26o, owe26s, owe29o, owe29s, owe30s,
].flat() as Question[];
