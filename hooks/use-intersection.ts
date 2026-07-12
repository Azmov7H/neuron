"use client";

import { useEffect, useRef, useState } from "react";

interface UseIntersectionOptions extends IntersectionObserverInit {
  /** Once true, stays true (default: true). Set to false for repeating animations. */
  once?: boolean;
}

/**
 * Returns a ref and a boolean indicating whether the element is (or was)
 * intersecting the viewport. Useful for scroll-triggered animations.
 */
export function useIntersection<T extends Element>(
  options: UseIntersectionOptions = {}
): [React.RefObject<T>, boolean] {
  const { once = true, ...observerOptions } = options;
  const ref = useRef<T>(null);
  const [intersecting, setIntersecting] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIntersecting(true);
        if (once) observer.disconnect();
      } else if (!once) {
        setIntersecting(false);
      }
    }, observerOptions);

    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [once]);

  return [ref as React.RefObject<T>, intersecting];
}
