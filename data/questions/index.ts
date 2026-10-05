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
import owe27o from "./owe-27-okregowe.json";
import owe27s from "./owe-27-szkolne.json";
import owe28o from "./owe-28-okregowe.json";
import owe28s from "./owe-28-szkolne.json";
import owe29o from "./owe-29-okregowe.json";
import owe29s from "./owe-29-szkolne.json";
import owe30o from "./owe-30-okregowe.json";
import owe30s from "./owe-30-szkolne.json";
import owe31o from "./owe-31-okregowe.json";
import owe31s from "./owe-31-szkolne.json";
import owe32o from "./owe-32-okregowe.json";
import owe32s from "./owe-32-szkolne.json";
import owe33o from "./owe-33-okregowe.json";
import owe33s from "./owe-33-szkolne.json";
import owe34o from "./owe-34-okregowe.json";
import owe34s from "./owe-34-szkolne.json";
import owe35o from "./owe-35-okregowe.json";
import owe35s from "./owe-35-szkolne.json";
import owe36o from "./owe-36-okregowe.json";
import owe36s from "./owe-36-szkolne.json";
import owe37o from "./owe-37-okregowe.json";
import owe37s from "./owe-37-szkolne.json";
import owe38o from "./owe-38-okregowe.json";
import owe38s from "./owe-38-szkolne.json";
import owe39o from "./owe-39-okregowe.json";
import owe39s from "./owe-39-szkolne.json";

// Każdy plik to część testowa jednego zestawu OWE. Nowy plik dopisz tutaj.
export const QUESTIONS = [
  owe21o, owe21s, owe22o, owe22s, owe23o, owe23s, owe24o, owe24s, owe25o, owe25s,
  owe26o, owe26s, owe27o, owe27s, owe28o, owe28s, owe29o, owe29s, owe30o, owe30s,
  owe31o, owe31s, owe32o, owe32s, owe33o, owe33s,
  owe34o, owe34s, owe35o, owe35s, owe36o, owe36s, owe37o, owe37s,
  owe38o, owe38s, owe39o, owe39s,
].flat() as Question[];
