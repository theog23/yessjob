"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";

export function ShrinkingLogo() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function onScroll() {
      const threshold = window.innerHeight * 0.45;
      const p = Math.min(1, Math.max(0, window.scrollY / threshold));
      setProgress(p);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div
      className="pointer-events-none flex justify-center"
      style={{
        opacity: 1 - progress,
        transform: `scaleY(${1 - progress}) scaleX(${1 - progress * 0.5})`,
        transformOrigin: "50% 0%",
      }}
    >
      <Logo size="lg" />
    </div>
  );
}
