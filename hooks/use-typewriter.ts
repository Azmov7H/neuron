"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Streams `text` character by character at `speed` ms per character.
 * Returns the current partial string and a `done` boolean.
 *
 * Respects `prefers-reduced-motion` — returns the full string immediately.
 */
export function useTypewriter(
  text: string,
  speed = 28,
  delay = 0
): { displayed: string; done: boolean } {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      setDisplayed(text);
      setDone(true);
      return;
    }

    setDisplayed("");
    setDone(false);

    let idx = 0;

    const start = () => {
      function step() {
        idx += 1;
        setDisplayed(text.slice(0, idx));
        if (idx < text.length) {
          timerRef.current = setTimeout(step, speed);
        } else {
          setDone(true);
        }
      }
      timerRef.current = setTimeout(step, speed);
    };

    const delayTimer = setTimeout(start, delay);

    return () => {
      clearTimeout(delayTimer);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [text, speed, delay]);

  return { displayed, done };
}
