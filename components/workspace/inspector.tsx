"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface InspectorProps {
  title: string;
  defaultOpen?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * A collapsible inspector section — the building block of the right
 * context panel and simulation parameter panels.
 */
export function Inspector({
  title,
  defaultOpen = true,
  className,
  children,
}: InspectorProps) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <div className={cn("sci-inspector", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-2.5",
          "text-[11px] font-semibold uppercase tracking-[0.12em]",
          "text-muted-foreground hover:text-foreground",
          "transition-colors duration-150 focus-visible:outline-none",
          "focus-visible:ring-1 focus-visible:ring-primary/40"
        )}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown
          size={12}
          className={cn(
            "transition-transform duration-150",
            open ? "rotate-0" : "-rotate-90"
          )}
          aria-hidden="true"
        />
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          open ? "opacity-100" : "opacity-0 max-h-0 pointer-events-none"
        )}
        style={open ? { maxHeight: "9999px" } : {}}
      >
        <div className="px-4 pb-3">{children}</div>
      </div>
    </div>
  );
}
