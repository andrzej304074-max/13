"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo } from "react";
import { firstAllowed, isBlocked, keyLabel, pathKey, type BlockMode } from "@/lib/access-core";

/** Blokady sekcji konta (łączne: globalne i konta) przekazane z układu strony – menu i strażnik przejść. */
interface Access { blocks: string[]; mode: BlockMode }
const Ctx = createContext<Access>({ blocks: [], mode: "hide" });

export function AccessProvider({ blocks, mode, children }: Access & { children: React.ReactNode }) {
  const v = useMemo(() => ({ blocks, mode }), [blocks, mode]);
  return <Ctx.Provider value={v}>{children}</Ctx.Provider>;
}

export function useAccess() {
  const a = useContext(Ctx);
  return { ...a, blocked: (key: string) => isBlocked(key, a.blocks) };
}

/** Komunikat o zablokowanej sekcji (także dla przejść bez przeładowania strony). */
export function BlockedScreen({ sectionKey }: { sectionKey: string | null }) {
  const { blocks } = useAccess();
  const home = firstAllowed(blocks);
  return (
    <div className="empty-state blocked-screen" data-testid="blocked">
      <span aria-hidden>🔒</span>
      <h1>Sekcja wyłączona</h1>
      <p>{sectionKey ? `„${keyLabel(sectionKey)}” jest` : "Ta sekcja jest"} wyłączona przez administratora. Jeśli jej potrzebujesz, poproś administratora o odblokowanie.</p>
      {home && <Link className="btn" href={home}>Przejdź dalej</Link>}
    </div>
  );
}

/** Strażnik treści: zablokowana sekcja pokazuje komunikat zamiast strony. */
export function AccessGuard({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { blocks } = useAccess();
  const key = pathKey(path);
  return isBlocked(key, blocks) ? <BlockedScreen sectionKey={key} /> : <>{children}</>;
}
