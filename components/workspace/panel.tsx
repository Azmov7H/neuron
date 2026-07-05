import * as React from "react";
import { cn } from "@/lib/utils";

// ─── Panel ────────────────────────────────────────────────────

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  noPadding?: boolean;
}

export function Panel({
  title,
  subtitle,
  actions,
  noPadding,
  className,
  children,
  ...rest
}: PanelProps) {
  return (
    <div className={cn("sci-panel flex flex-col", className)} {...rest}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
          <div>
            {title && (
              <h3 className="text-[13px] font-semibold text-foreground leading-none">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-1">{actions}</div>
          )}
        </div>
      )}
      <div className={cn("flex-1", !noPadding && "p-4")}>{children}</div>
    </div>
  );
}

// ─── PanelSection ─────────────────────────────────────────────

interface PanelSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function PanelSection({
  label,
  className,
  children,
  ...rest
}: PanelSectionProps) {
  return (
    <div
      className={cn("sci-inspector py-3 px-4 first:pt-0", className)}
      {...rest}
    >
      {label && (
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/50 font-semibold mb-2">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

// ─── PanelRow ─────────────────────────────────────────────────

interface PanelRowProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  value?: React.ReactNode;
}

export function PanelRow({
  label,
  value,
  className,
  children,
  ...rest
}: PanelRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 py-1.5",
        className
      )}
      {...rest}
    >
      {label && (
        <span className="text-[12px] text-muted-foreground shrink-0">
          {label}
        </span>
      )}
      {value !== undefined ? (
        <span className="text-[12px] text-foreground font-medium text-right">
          {value}
        </span>
      ) : (
        children
      )}
    </div>
  );
}
