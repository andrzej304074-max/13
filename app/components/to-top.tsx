"use client";

import { useEffect, useState } from "react";

/** Pływający przycisk „↑ Do góry” – pojawia się po przewinięciu strony. */
export function ToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 600);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  if (!show) return null;
  return (
    <button className="to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Przewiń do góry">
      ↑ Do góry
    </button>
  );
}
