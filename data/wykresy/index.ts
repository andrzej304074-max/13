// Serie danych do wykresów (pobiera tools/wykresy/pobierz.py z API Eurostatu – adres źródła w polu `urls`).
import dzietnosc from "./dzietnosc.json";
import obciazenie from "./obciazenie.json";
import inflacja from "./inflacja.json";
import bezrobocie from "./bezrobocie.json";
import dlug from "./dlug.json";
import pkb from "./pkb.json";
import dlugoscZycia from "./dlugosc-zycia.json";
import piramida from "./piramida-pl.json";

export interface DataSeries {
  id: string; title: string; unit: string; kind: "linia" | "slupki"; source: string; urls: string[]; fetched: string;
  lines: { name: string; points: [number, number][] }[];
}
export interface DataPyramid {
  id: string; title: string; unit: string; source: string; urls: string[]; fetched: string; year: string;
  groups: string[]; men: number[]; women: number[];
}

export const SERIES: Record<string, DataSeries> = Object.fromEntries(
  [dzietnosc, obciazenie, inflacja, bezrobocie, dlug, pkb, dlugoscZycia].map((s) => [s.id, s as unknown as DataSeries]),
);
export const PYRAMID_PL = piramida as unknown as DataPyramid;
