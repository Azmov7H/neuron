"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Animates a numeric value from 0 (or a start value) up to `target`
 * over `duration` ms using a smooth easing curve.
 *
 * Respects `prefers-reduced-motion` — returns the final value immediately.
 */
export function useCountUp(
  target: number,
  duration = 1200,
  start = 0
): number {
  const [value, setValue] = useState(start);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setValue(target);
      return;
    }

    let startTime: number | null = null;
    const delta = target - start;

    function tick(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(start + delta * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, start]);

  return value;
}
