"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { Role } from "@/types";
import { WorkspaceProvider } from "./workspace-context";
import { CommandBar } from "./command-bar";
import { WorkspaceNav } from "./workspace-nav";
import { ContextPanel } from "./context-panel";
import { BottomDock } from "./bottom-dock";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  className?: string;
  /** Role resolved server-side and injected into the shell */
  role?: Role | null;
}

/**
 * Root layout for the SciOS workspace shell.
 *
 * Renders:
 *   ┌──────────────────────────────────┐
 *   │         COMMAND BAR (row 1)      │
 *   ├────────┬─────────────┬───────────┤
 *   │  NAV   │  WORKSPACE  │  CONTEXT  │
 *   │  (col1)│  (col2)     │  PANEL    │
 *   ├────────┴─────────────┴───────────┤
 *   │         BOTTOM DOCK (row 3)      │
 *   └──────────────────────────────────┘
 */
function WorkspaceShell({ children, className }: WorkspaceLayoutProps) {
  return (
    <div
      className={cn(
        "flex flex-col h-dvh overflow-hidden bg-background",
        className
      )}
    >
      {/* Skip link — keyboard / screen-reader users jump to main content */}
      <a
        href="#main-content"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3",
          "focus:z-[2000] focus:rounded-md focus:bg-card focus:px-3 focus:py-2",
          "focus:text-sm focus:text-foreground focus:shadow-lg focus:outline-none",
          "focus:ring-1 focus:ring-primary/50"
        )}
      >
        Skip to content
      </a>

      {/* Row 1: Command Bar */}
      <CommandBar />

      {/* Row 2: Nav + Workspace + Context Panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Nav */}
        <WorkspaceNav />

        {/* Center workspace — scrollable */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
          tabIndex={-1}
          aria-label="Main workspace"
        >
          {/* Subtle ambient depth glows — purely decorative */}
          <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-secondary/5 blur-[100px]" />
          </div>

          {/* Page content */}
          <div className="relative z-10">
            {children}
          </div>
        </main>

        {/* Right Context Panel */}
        <ContextPanel />
      </div>

      {/* Row 3: Bottom Dock */}
      <BottomDock />
    </div>
  );
}

/**
 * WorkspaceLayout — wraps WorkspaceShell with the context provider.
 * Use this as the outermost wrapper in the dashboard layout.tsx.
 */
export function WorkspaceLayout({ children, className, role }: WorkspaceLayoutProps) {
  return (
    <WorkspaceProvider role={role}>
      <WorkspaceShell className={className}>{children}</WorkspaceShell>
    </WorkspaceProvider>
  );
}
