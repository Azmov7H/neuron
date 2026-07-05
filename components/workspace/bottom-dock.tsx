"use client";

import React, { useState } from "react";
import {
  ChevronUp,
  ChevronDown,
  MonitorPlay,
  Loader2,
  CheckCircle2,
  XCircle,
  PauseCircle,
  Terminal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./workspace-context";
import type { DockItem } from "./workspace-context";

// ─── Status icon map ──────────────────────────────────────────

function StatusIcon({ status }: { status: DockItem["status"] }) {
  switch (status) {
    case "running":
      return <Loader2 size={11} className="animate-spin text-blue-400" />;
    case "paused":
      return <PauseCircle size={11} className="text-amber-400" />;
    case "done":
      return <CheckCircle2 size={11} className="text-emerald-400" />;
    case "error":
      return <XCircle size={11} className="text-red-400" />;
  }
}

// ─── Running task chip ────────────────────────────────────────

function DockChip({ item }: { item: DockItem }) {
  return (
    <div className="flex items-center gap-1.5 px-2 h-6 rounded border border-white/6 bg-white/3 text-[11px] text-muted-foreground max-w-[160px] group">
      <StatusIcon status={item.status} />
      <span className="truncate">{item.label}</span>
      {item.progress !== undefined && item.status === "running" && (
        <span className="text-[10px] text-muted-foreground/50 shrink-0">
          {item.progress}%
        </span>
      )}
    </div>
  );
}

// ─── BottomDock ───────────────────────────────────────────────

export function BottomDock() {
  const { dockItems, dockExpanded, setDockExpanded } = useWorkspace();
  const running = dockItems.filter((d) => d.status === "running");

  return (
    <footer
      aria-label="Dock — running processes"
      role="status"
      aria-live="polite"
      className={cn(
        "sci-dock col-span-2 flex-col z-40 transition-[height] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        dockExpanded ? "h-44" : "h-[var(--bottom-dock-height)]"
      )}
    >
      {/* ── Collapsed dock bar ── */}
      <div className="flex items-center gap-2 px-3 h-[var(--bottom-dock-height)] shrink-0 w-full">

        {/* Left: status items */}
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          <Terminal size={11} className="text-muted-foreground/40 shrink-0" />

          {running.length === 0 ? (
            <span className="text-[11px] text-muted-foreground/40">
              No active processes
            </span>
          ) : (
            <>
              {running.slice(0, 3).map((item) => (
                <DockChip key={item.id} item={item} />
              ))}
              {running.length > 3 && (
                <span className="text-[11px] text-muted-foreground/50">
                  +{running.length - 3} more
                </span>
              )}
            </>
          )}
        </div>

        {/* Right: process count + expand toggle */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {dockItems.length > 0 && (
            <span className="text-[10px] text-muted-foreground/40">
              {dockItems.length} process{dockItems.length !== 1 ? "es" : ""}
            </span>
          )}
          <button
            type="button"
            onClick={() => setDockExpanded(!dockExpanded)}
            className="flex items-center gap-1 px-1.5 h-5 rounded text-[10px] text-muted-foreground/40 hover:text-muted-foreground hover:bg-white/4 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
            aria-label={dockExpanded ? "Collapse dock" : "Expand dock"}
            aria-expanded={dockExpanded}
          >
            {dockExpanded ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
          </button>
        </div>
      </div>

      {/* ── Expanded dock panel ── */}
      {dockExpanded && (
        <div className="flex-1 overflow-y-auto scrollbar-none border-t border-white/5 px-3 py-2">
          {dockItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MonitorPlay size={18} className="text-muted-foreground/20 mb-2" />
              <p className="text-[11px] text-muted-foreground/40">
                No processes running. Start a simulation to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {dockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/3 transition-colors"
                >
                  <StatusIcon status={item.status} />
                  <span className="text-[12px] text-foreground flex-1 truncate">
                    {item.label}
                  </span>
                  {item.progress !== undefined && (
                    <div className="w-24 h-1 bg-white/8 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          item.status === "done" ? "bg-emerald-400" : "bg-blue-400"
                        )}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  <span
                    className={cn(
                      "text-[10px] capitalize shrink-0",
                      item.status === "running" && "text-blue-400",
                      item.status === "done"    && "text-emerald-400",
                      item.status === "error"   && "text-red-400",
                      item.status === "paused"  && "text-amber-400"
                    )}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </footer>
  );
}
