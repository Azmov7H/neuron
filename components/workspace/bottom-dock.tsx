"use client";

import React, { useEffect } from "react";
import Link from "next/link";
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

// ─── Status visuals ──────────────────────────────────────────

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

const STATUS_BAR: Record<DockItem["status"], string> = {
  running: "bg-blue-400",
  paused: "bg-amber-400",
  done: "bg-emerald-400",
  error: "bg-red-400",
};

const STATUS_TEXT: Record<DockItem["status"], string> = {
  running: "text-blue-400",
  paused: "text-amber-400",
  done: "text-emerald-400",
  error: "text-red-400",
};

// ─── Process chip (collapsed bar) ────────────────────────────

function DockChip({ item }: { item: DockItem }) {
  const inner = (
    <>
      <StatusIcon status={item.status} />
      <span className="truncate">{item.label}</span>
      {item.progress !== undefined && item.status === "running" && (
        <span className="text-[10px] text-muted-foreground/50 shrink-0">
          {item.progress}%
        </span>
      )}
    </>
  );

  const className =
    "flex items-center gap-1.5 px-2 h-6 rounded border border-white/6 bg-white/3 text-[11px] text-muted-foreground max-w-[180px] group hover:border-white/10 hover:bg-white/5 transition-colors";

  if (item.href) {
    return (
      <Link href={item.href} className={className} title={item.label}>
        {inner}
      </Link>
    );
  }
  return <div className={className}>{inner}</div>;
}

// ─── BottomDock ───────────────────────────────────────────────

export function BottomDock() {
  const { dockItems, addDockItem, dockExpanded, setDockExpanded } =
    useWorkspace();
  const running = dockItems.filter((d) => d.status === "running");
  const recent = dockItems.slice(0, 3);

  // Pull recent persisted runs from the API and layer them into the shared
  // dock state. The API is the source of truth for historical activity; any
  // live in-session run added via addDockItem is preserved.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/dock", { credentials: "include" })
      .then((res) => res.json())
      .then((payload) => {
        if (cancelled) return;
        if (payload?.success && Array.isArray(payload?.data?.items)) {
          (payload.data.items as DockItem[]).forEach((it) => addDockItem(it));
        }
      })
      .catch(() => {
        /* keep existing dock state */
      });
    return () => {
      cancelled = true;
    };
  }, [addDockItem]);

  return (
    <footer
      aria-label="Dock — recent processes"
      role="status"
      aria-live="polite"
      className={cn(
        "sci-dock col-span-2 flex flex-col z-40",
        "border-t border-white/8 bg-background/60 backdrop-blur-sm",
        "transition-[height] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        dockExpanded ? "h-44" : "h-[var(--bottom-dock-height)]"
      )}
    >
      {/* ── Collapsed dock bar ── */}
      <div className="flex items-center gap-2 px-3 h-[var(--bottom-dock-height)] shrink-0 w-full">
        {/* Left: label + recent items */}
        <div className="flex items-center gap-2 flex-1 overflow-hidden">
          <Terminal size={11} className="text-muted-foreground/40 shrink-0" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/40 shrink-0 select-none">
            Processes
          </span>

          {dockItems.length === 0 ? (
            <span className="text-[11px] text-muted-foreground/40">
              No recent activity
            </span>
          ) : (
            <>
              {recent.map((item) => (
                <DockChip key={item.id} item={item} />
              ))}
              {dockItems.length > 3 && (
                <span className="text-[11px] text-muted-foreground/50 shrink-0">
                  +{dockItems.length - 3} more
                </span>
              )}
            </>
          )}
        </div>

        {/* Right: running count + expand toggle */}
        <div className="flex items-center gap-2 ml-auto shrink-0">
          {running.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-blue-400">
              <Loader2 size={9} className="animate-spin" />
              {running.length} running
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
                No processes yet. Run a simulation to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {dockItems.map((item) => {
                const body = (
                  <>
                    <StatusIcon status={item.status} />
                    <span className="text-[12px] text-foreground flex-1 truncate">
                      {item.label}
                    </span>
                    {item.progress !== undefined && (
                      <div className="w-24 h-1 bg-white/8 rounded-full overflow-hidden shrink-0">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            STATUS_BAR[item.status]
                          )}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                    <span
                      className={cn(
                        "text-[10px] capitalize shrink-0 w-12 text-right",
                        STATUS_TEXT[item.status]
                      )}
                    >
                      {item.status}
                    </span>
                  </>
                );

                const rowClass =
                  "flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/3 transition-colors";

                return item.href ? (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={rowClass}
                  >
                    {body}
                  </Link>
                ) : (
                  <div key={item.id} className={rowClass}>
                    {body}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </footer>
  );
}
