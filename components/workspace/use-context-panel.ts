"use client";

import { useEffect, useLayoutEffect } from "react";
import { useWorkspace } from "./workspace-context";

/**
 * Declaratively populate the right context panel for the current page.
 *
 * Call this hook at the top level of any page component to push content
 * into the context panel. The content is cleared when the component unmounts.
 *
 * @example
 * ```tsx
 * useContextPanel(
 *   <Inspector title="Current Path">…</Inspector>
 * );
 * ```
 */
export function useContextPanel(
  content: React.ReactNode,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps?: any[]
): void {
  const { setContextPanelContent, setContextPanelOpen } = useWorkspace();

  // Use useLayoutEffect on the client, useEffect as fallback
  const useIsomorphicEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useIsomorphicEffect(() => {
    if (content) {
      setContextPanelContent(content);
      setContextPanelOpen(true);
    } else {
      setContextPanelContent(null);
      setContextPanelOpen(false);
    }

    return () => {
      setContextPanelContent(null);
    };
    // deps intentionally spread — callers control the dependency list
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps ?? []);
}
