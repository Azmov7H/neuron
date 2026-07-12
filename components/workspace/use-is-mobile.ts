"use client";

import { useEffect, useState } from "react";

/**
 * True below the `md` breakpoint (768px). The workspace shell uses this to
 * switch the sidebar from a static column to an overlay drawer and to keep
 * drawer labels expanded regardless of the desktop collapse state.
 */
export function useIsMobile(query = "(max-width: 767px)"): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return isMobile;
}
