"use client";

import { useEffect, useRef, useState } from "react";
import { formatNumber } from "@/lib/format";

interface CountUpProps {
  value: number;
  /** Durée totale du décompte, en millisecondes. */
  duration?: number;
  className?: string;
}

/**
 * Compteur qui monte jusqu'à sa valeur au montage.
 *
 * Court et décéléré : l'animation doit se terminer avant que l'œil n'ait
 * fini de parcourir l'écran, sinon elle retarde la lecture au lieu de
 * l'accompagner. Respecte « réduire les animations » en affichant
 * directement la valeur finale.
 */
export function CountUp({ value, duration = 800, className }: CountUpProps) {
  const [display, setDisplay] = useState(value);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // L'état part déjà de `value` : si le mouvement est réduit, il n'y a
    // rien à faire, la valeur finale est déjà affichée.
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReduced) return;

    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      // Décélération cubique : rapide au départ, posée à l'arrivée.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(value * eased));

      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [value, duration]);

  return <span className={className}>{formatNumber(display)}</span>;
}
