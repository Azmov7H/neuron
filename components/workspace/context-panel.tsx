"use client";

import React from "react";
import { X, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./workspace-context";

interface ContextPanelProps {
  className?: string;
}

/**
 * Right context panel — dynamically displays content injected by the
 * current page via `useContextPanel()`. Collapses to hidden when empty
 * or closed.
 */
export function ContextPanel({ className }: ContextPanelProps) {
  const { contextPanelContent, contextPanelOpen, setContextPanelOpen } =
    useWorkspace();

  const visible = contextPanelOpen && !!contextPanelContent;

  return (
    <aside
      aria-label="Context panel"
      aria-hidden={!visible}
      className={cn(
        "sci-context-panel flex-shrink-0 overflow-hidden",
        "transition-[width,opacity] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        visible
          ? "w-[var(--context-panel-width)] opacity-100"
          : "w-0 opacity-0 pointer-events-none",
        className
      )}
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 h-9 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/60">
          <PanelRight size={12} aria-hidden="true" />
          <span className="font-semibold uppercase tracking-[0.1em] text-[10px]">
            Context
          </span>
        </div>
        <button
          type="button"
          onClick={() => setContextPanelOpen(false)}
          className="p-1 rounded hover:bg-white/5 text-muted-foreground/40 hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
          aria-label="Close context panel"
        >
          <X size={12} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none">
        {contextPanelContent}
      </div>
    </aside>
  );
}

// ─── Default empty state ─────────────────────────────────────

export function ContextPanelEmpty() {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-center px-4">
      <PanelRight size={20} className="text-muted-foreground/20 mb-2" />
      <p className="text-[11px] text-muted-foreground/40">
        Navigate to a page to see contextual information here.
      </p>
    </div>
  );
}
