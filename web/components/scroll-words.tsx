"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Replica el efecto de la referencia: un parrafo grande donde cada
 * palabra pasa de gris tenue a negro solido a medida que el bloque
 * scrollea por la pantalla. Se calcula con la posicion real de scroll
 * (no IntersectionObserver) para que ande igual de bien en cualquier
 * navegador.
 */
export function ScrollWords({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const words = text.split(" ");
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    function onScroll() {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.95; // el bloque recien asoma por abajo
      const end = vh * 0.35; // su parte superior llega a un tercio de la pantalla
      const progress = (start - rect.top) / (start - end);
      const clamped = Math.min(1, Math.max(0, progress));
      setRevealed(Math.round(clamped * words.length));
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [words.length]);

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => (
        <span key={i} className={`transition-colors duration-300 ${i < revealed ? "text-ink-0" : "text-ink-0/15"}`}>
          {w}{" "}
        </span>
      ))}
    </p>
  );
}
