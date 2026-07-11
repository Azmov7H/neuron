"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Role } from "@/types";

// ─── Types ────────────────────────────────────────────────────

export interface DockItem {
  id: string;
  label: string;
  status: "running" | "paused" | "done" | "error";
  progress?: number; // 0-100
  icon?: React.ReactNode;
}

interface WorkspaceContextValue {
  /** Content injected into the right context panel by the current page */
  contextPanelContent: React.ReactNode;
  setContextPanelContent: (node: React.ReactNode) => void;

  /** Items shown in the bottom dock */
  dockItems: DockItem[];
  addDockItem: (item: DockItem) => void;
  removeDockItem: (id: string) => void;
  updateDockItem: (id: string, patch: Partial<DockItem>) => void;

  /** Navigation collapse state (desktop expanded / icon-rail) */
  navCollapsed: boolean;
  toggleNav: () => void;
  setNavCollapsed: (v: boolean) => void;

  /** Mobile navigation drawer (overlay) state */
  mobileNavOpen: boolean;
  setMobileNavOpen: (v: boolean) => void;
  toggleMobileNav: () => void;

  /** Context panel visibility */
  contextPanelOpen: boolean;
  setContextPanelOpen: (v: boolean) => void;

  /** Bottom dock expanded state */
  dockExpanded: boolean;
  setDockExpanded: (v: boolean) => void;

  /** Resolved role for the current session (null = unknown / permissive) */
  role: Role | null;
}

interface WorkspaceProviderProps {
  children: React.ReactNode;
  /** Role resolved server-side and injected into the shell */
  role?: Role | null;
}

// ─── Context ──────────────────────────────────────────────────

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────

const NAV_COLLAPSED_KEY = "sci-nav-collapsed";

export function WorkspaceProvider({
  children,
  role = null,
}: WorkspaceProviderProps) {
  const [contextPanelContent, setContextPanelContent] =
    useState<React.ReactNode>(null);
  const [dockItems, setDockItems] = useState<DockItem[]>([]);
  const [navCollapsed, setNavCollapsed] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [contextPanelOpen, setContextPanelOpen] = useState<boolean>(false);
  const [dockExpanded, setDockExpanded] = useState<boolean>(false);

  // Persist nav collapse state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(NAV_COLLAPSED_KEY);
      // Lazy client-only read: avoids hydration mismatch by deferring to post-mount
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored !== null) setNavCollapsed(stored === "true");
    } catch {
      /* localStorage unavailable in SSR */
    }
  }, []);

  const handleSetNavCollapsed = useCallback((v: boolean) => {
    setNavCollapsed(v);
    try {
      localStorage.setItem(NAV_COLLAPSED_KEY, String(v));
    } catch {
      /* ignore */
    }
  }, []);

  const toggleNav = useCallback(() => {
    handleSetNavCollapsed(!navCollapsed);
  }, [navCollapsed, handleSetNavCollapsed]);

  const toggleMobileNav = useCallback(() => {
    setMobileNavOpen((o) => !o);
  }, []);

  const addDockItem = useCallback((item: DockItem) => {
    setDockItems((prev) => {
      const exists = prev.find((d) => d.id === item.id);
      return exists ? prev : [...prev, item];
    });
  }, []);

  const removeDockItem = useCallback((id: string) => {
    setDockItems((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDockItem = useCallback(
    (id: string, patch: Partial<DockItem>) => {
      setDockItems((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...patch } : d))
      );
    },
    []
  );

  return (
    <WorkspaceContext.Provider
      value={{
        contextPanelContent,
        setContextPanelContent,
        dockItems,
        addDockItem,
        removeDockItem,
        updateDockItem,
        navCollapsed,
        toggleNav,
        setNavCollapsed: handleSetNavCollapsed,
        mobileNavOpen,
        setMobileNavOpen,
        toggleMobileNav,
        contextPanelOpen,
        setContextPanelOpen,
        dockExpanded,
        setDockExpanded,
        role,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  }
  return ctx;
}
