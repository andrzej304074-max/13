"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, viewedUser } from "@/lib/client";

/** Pasek podglądu: admin ogląda statystyki lub postęp innego użytkownika (`?user=<id>`). */
export function PreviewBanner() {
  const [user, setUser] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("…");

  useEffect(() => {
    const u = viewedUser();
    setUser(u);
    if (u) api<{ email: string }>(`/api/admin/uzytkownicy/${u}`).then((r) => setEmail(r.email)).catch((e) => setEmail(e.message));
  }, []);

  if (!user) return null;
  return (
    <div className="preview-banner">
      <strong>Podgląd konta: {email}</strong>
      <span>
        <Link href={`/stats?user=${user}`}>Testy</Link> · <Link href={`/nauka?user=${user}`}>Postęp nauki</Link> ·{" "}
        <Link href={`/nauka/statystyki?user=${user}`}>Statystyki nauki</Link> · <Link href="/admin">← Panel admina</Link>
      </span>
    </div>
  );
}
