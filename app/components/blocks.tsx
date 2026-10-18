import type { Block } from "@/lib/otwarte-core";

/** Treść zadań i rozwiązań: akapity, wzory (czcionka wzorów), tabele (przewijane na telefonie), listy. */
export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.t) {
          case "p": return <p key={i} className="ob-p">{b.x}</p>;
          case "f": return <pre key={i} className="formula">{b.x}</pre>;
          case "ul": return <ul key={i} className="ob-ul">{b.items.map((x, k) => <li key={k}>{x}</li>)}</ul>;
          case "table": return (
            <div key={i} className="table-wrap ob-table">
              <table>
                {b.head && <thead><tr>{b.head.map((h, k) => <th key={k}>{h}</th>)}</tr></thead>}
                <tbody>{b.rows.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
              </table>
            </div>
          );
        }
      })}
    </>
  );
}
