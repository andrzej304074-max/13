"use client";

import { BUG_EVENT, type BugPreset } from "./bug-popup";

/** „Zgłoś nieaktualne” pod wykresem z danych – okienko zgłoszenia z rodzajem „merytoryczny” i opisem wykresu. */
export function ChartOutdated({ title, source, fetched }: { title: string; source: string; fetched: string }) {
  return (
    <button type="button" className="linkbtn small" data-testid="chart-outdated"
      onClick={() => window.dispatchEvent(new CustomEvent<BugPreset>(BUG_EVENT, { detail: {
        kind: "merytoryczny", text: `Nieaktualne dane na wykresie „${title}” (${source}, pobrano ${fetched}): `,
      } }))}>
      Zgłoś nieaktualne
    </button>
  );
}
