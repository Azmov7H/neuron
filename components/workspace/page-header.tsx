"use client";

import React from "react";
import { cn } from "@/lib/utils";

// ─── Breadcrumb ───────────────────────────────────────────────

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-2", className)}>
      <ol className="flex items-center gap-1 text-[11px] text-muted-foreground font-caption">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1">
              {idx > 0 && (
                <span aria-hidden="true" className="text-white/10">
                  /
                </span>
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-foreground font-medium"
                >
                  {item.label}
                </span>
              ) : item.href ? (
                <a
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </a>
              ) : (
                <span>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ─── Page Header ──────────────────────────────────────────────

export interface PageHeaderProps {
  /** Breadcrumb crumbs; max 4 rendered */
  breadcrumbs?: BreadcrumbItem[];
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Page Header — consistent intro block at the top of every content view.
 * Responsive: stacks vertically below `md` breakpoint.
 */
export function PageHeader({
  breadcrumbs = [],
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  const crumbs = breadcrumbs.slice(0, 4);

  return (
    <header
      className={cn(
        "flex items-start justify-between gap-4 mb-4",
        "flex-col md:flex-row md:items-center",
        className
      )}
    >
      <div>
        {crumbs.length > 0 && <BreadcrumbNav items={crumbs} />}
        <h1 className="font-heading-xl text-3xl text-foreground">{title}</h1>
        {subtitle && (
          <p className="font-subtitle text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 flex-wrap md:flex-nowrap md:ml-auto">
          {actions}
        </div>
      )}
    </header>
  );
}