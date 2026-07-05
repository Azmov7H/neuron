"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  Command,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  User,
  Zap,
  Activity,
  Circle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "@/components/logo";
import { CommandPalette } from "./command-palette";
import { useWorkspace } from "./workspace-context";
import { cn } from "@/lib/utils";

// ─── CSRF helpers (mirrored from side-nav) ───────────────────

async function fetchCsrfToken() {
  const res = await fetch("/api/auth/csrf");
  if (!res.ok) throw new Error("Unable to obtain CSRF token");
  const payload = await res.json();
  return payload?.data?.csrfToken as string | undefined;
}

function getCsrfHeader(token: string | undefined): Record<string, string> {
  return token ? { "x-csrf-token": token } : {};
}

// ─── AI Status indicator ─────────────────────────────────────

function AiStatus() {
  return (
    <div
      className="flex items-center gap-1.5 px-2 h-6 rounded text-[11px] text-muted-foreground border border-white/5 bg-white/3 select-none"
      title="Spark AI is ready"
      aria-label="Spark AI status: ready"
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
      </span>
      <span className="hidden sm:inline">Spark</span>
    </div>
  );
}

// ─── User menu ───────────────────────────────────────────────

interface UserMenuProps {
  onLogout: () => void;
}

function UserMenu({ onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-1.5 h-7 rounded hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="User menu"
      >
        <div className="h-5 w-5 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-[9px] font-bold text-background shrink-0">
          U
        </div>
        <ChevronDown
          size={10}
          className={cn(
            "text-muted-foreground transition-transform duration-150",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute right-0 top-full mt-1.5 w-44 rounded-lg overflow-hidden",
            "bg-card border border-white/8 shadow-2xl shadow-black/50",
            "animate-scale-in origin-top-right z-50"
          )}
        >
          <div className="p-1">
            <Link
              href="/dashboard/profile"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 rounded text-[12px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              <User size={13} />
              Profile
            </Link>
            <Link
              href="/dashboard/settings"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 rounded text-[12px] text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              onClick={() => setOpen(false)}
            >
              <Settings size={13} />
              Settings
            </Link>
          </div>
          <div className="border-t border-white/5 p-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded text-[12px] text-muted-foreground hover:text-red-400 hover:bg-red-400/5 transition-colors"
            >
              <LogOut size={13} />
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Notifications button ─────────────────────────────────────

function NotificationsButton() {
  return (
    <button
      type="button"
      className="relative p-1.5 rounded hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
      aria-label="Notifications"
    >
      <Bell size={14} />
      <span
        className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full"
        aria-hidden="true"
      />
    </button>
  );
}

// ─── Running tasks badge ─────────────────────────────────────

function RunningTasksBadge() {
  const { dockItems } = useWorkspace();
  const running = dockItems.filter((d) => d.status === "running");

  if (running.length === 0) return null;

  return (
    <div
      className="flex items-center gap-1 px-2 h-6 rounded text-[11px] border border-white/5 bg-white/3 text-amber-400"
      aria-label={`${running.length} running tasks`}
    >
      <Activity size={10} className="animate-pulse" />
      <span className="hidden sm:inline">{running.length}</span>
    </div>
  );
}

// ─── CommandBar ──────────────────────────────────────────────

export function CommandBar() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const router = useRouter();

  // ⌘K / Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      const token = await fetchCsrfToken();
      await fetch("/api/auth/session", {
        method: "DELETE",
        headers: getCsrfHeader(token),
      });
      router.push("/auth/login");
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  }, [router]);

  return (
    <>
      <header
        className="sci-command-bar"
        role="banner"
        aria-label="Command bar"
      >
        {/* ── Left: Logo + workspace ── */}
        <div className="flex items-center gap-3 mr-4 shrink-0">
          <Link href="/dashboard" aria-label="Go to dashboard home">
            <Logo />
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground/60">
            <Circle size={4} fill="currentColor" className="text-primary/60" />
            <span>Workspace</span>
          </div>
        </div>

        {/* ── Center: Search ── */}
        <div className="flex-1 flex justify-center">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className={cn(
              "flex items-center gap-2 h-7 w-full max-w-xs px-3 rounded",
              "bg-white/4 border border-white/6 text-muted-foreground/60",
              "hover:bg-white/6 hover:border-white/10 hover:text-muted-foreground",
              "transition-all duration-150 text-[12px]",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
            )}
            aria-label="Open command palette"
            aria-keyshortcuts="Meta+k"
          >
            <Search size={12} aria-hidden="true" />
            <span className="flex-1 text-left">Search or run a command…</span>
            <span className="flex items-center gap-0.5 border border-white/10 rounded px-1 py-0.5 text-[10px] shrink-0">
              <Command size={9} />K
            </span>
          </button>
        </div>

        {/* ── Right: Status + actions ── */}
        <div className="flex items-center gap-1.5 ml-4 shrink-0">
          <AiStatus />
          <RunningTasksBadge />
          <div className="w-px h-4 bg-white/8 mx-1" />
          <NotificationsButton />
          <UserMenu onLogout={handleLogout} />
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
