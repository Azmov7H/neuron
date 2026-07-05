import * as React from "react";
import { cn } from "@/lib/utils";

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Slot for right-aligned actions */
  trailing?: React.ReactNode;
}

/**
 * A horizontal toolbar row. Place icon buttons, toggles, or label groups
 * as children. Use `trailing` for right-aligned items.
 */
export function Toolbar({
  trailing,
  className,
  children,
  ...rest
}: ToolbarProps) {
  return (
    <div
      role="toolbar"
      className={cn("sci-toolbar gap-1", className)}
      {...rest}
    >
      <div className="flex items-center gap-1 flex-1">{children}</div>
      {trailing && (
        <div className="flex items-center gap-1 ml-auto">{trailing}</div>
      )}
    </div>
  );
}

// ─── ToolbarButton ────────────────────────────────────────────

interface ToolbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  icon?: React.ReactNode;
  label?: string;
}

export function ToolbarButton({
  active,
  icon,
  label,
  className,
  children,
  ...rest
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center gap-1.5 px-2 h-6 rounded text-[11px] font-medium",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
        active
          ? "bg-white/8 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
      )}
      aria-pressed={active}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {label ?? children}
    </button>
  );
}

// ─── ToolbarSeparator ─────────────────────────────────────────

export function ToolbarSeparator({ className }: { className?: string }) {
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      className={cn("w-px h-4 bg-white/8 mx-1 shrink-0", className)}
    />
  );
}
