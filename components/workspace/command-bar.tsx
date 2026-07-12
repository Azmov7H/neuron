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
  Activity,
  Sparkles,
  Circle,
  Menu,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import Logo from "@/components/logo";
import { CommandPalette } from "./command-palette";
import { useWorkspace } from "./workspace-context";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/app/api/notifications/route";

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

// ─── Current user (from /api/users/profile) ─────────────────

interface CurrentUser {
  username: string;
  email?: string;
  avatar?: string;
  rank?: string;
}

function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users/profile", { credentials: "include" })
      .then((res) => res.json())
      .then((payload) => {
        if (cancelled) return;
        if (payload?.success && payload?.data?.user) {
          setUser(payload.data.user as CurrentUser);
        }
      })
      .catch(() => {
        /* leave null; menu falls back to initials */
      });
    return () => { cancelled = true; };
  }, []);

  return user;
}

function initials(name: string): string {
  return (name.trim()[0] ?? "U").toUpperCase();
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

// ─── User avatar (shared by menu trigger + header) ──────────

function UserAvatar({ user, size = 20 }: { user: CurrentUser | null; size?: number }) {
  const dimension = { width: size, height: size };
  if (user?.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatar}
        alt=""
        className="rounded-full object-cover bg-white/5 shrink-0"
        style={dimension}
      />
    );
  }
  return (
    <div
      className="rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-[9px] font-bold text-background shrink-0"
      style={{ ...dimension, fontSize: Math.max(8, size * 0.42) }}
      aria-hidden="true"
    >
      {user ? initials(user.username) : "U"}
    </div>
  );
}

// ─── User menu ───────────────────────────────────────────────

interface UserMenuProps {
  user: CurrentUser | null;
  onLogout: () => void;
}

function UserMenu({ user, onLogout }: UserMenuProps) {
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
        <UserAvatar user={user} />
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
            "absolute right-0 top-full mt-1.5 w-56 rounded-lg overflow-hidden",
            "bg-card border border-white/8 shadow-2xl shadow-black/50",
            "animate-scale-in origin-top-right z-50"
          )}
        >
          {/* Identity header */}
          <div className="flex items-center gap-2.5 px-3 py-3 border-b border-white/5">
            <UserAvatar user={user} size={32} />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-foreground truncate">
                {user?.username ?? "Guest"}
              </p>
              {user?.rank && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {user.rank}
                </p>
              )}
            </div>
          </div>

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

// ─── Notifications center ────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationsButton() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      const payload = await res.json();
      if (payload?.success && payload?.data) {
        setItems(payload.data.items ?? []);
        setUnread(payload.data.unread ?? 0);
      }
    } catch {
      /* leave previous state */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

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
        onClick={() => { setOpen((o) => !o); if (!open) load(); }}
        className="relative p-1.5 rounded hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Bell size={14} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 flex items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground"
            aria-hidden="true"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          className={cn(
            "absolute right-0 top-full mt-1.5 w-72 rounded-lg overflow-hidden",
            "bg-card border border-white/8 shadow-2xl shadow-black/50",
            "animate-scale-in origin-top-right z-50"
          )}
        >
          <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
            <span className="text-[12px] font-semibold text-foreground">Notifications</span>
            {unread > 0 && (
              <span className="text-[10px] text-primary font-medium">{unread} new</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-none py-1">
            {items.length === 0 ? (
              <p className="text-center text-[12px] text-muted-foreground py-8">
                You&rsquo;re all caught up.
              </p>
            ) : (
              items.map((n) => {
                const Icon = n.type === "recommendation" ? Sparkles : Activity;
                const inner = (
                  <>
                    <Icon
                      size={14}
                      className={cn(
                        "shrink-0 mt-0.5",
                        n.type === "recommendation" ? "text-amber-400" : "text-emerald-400"
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] text-foreground font-medium truncate">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {n.body}
                      </p>
                      <p className="text-[10px] text-muted-foreground/50 mt-0.5">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </>
                );
                return n.href ? (
                  <Link
                    key={n.id}
                    href={n.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2.5 px-3 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div
                    key={n.id}
                    role="menuitem"
                    className="flex items-start gap-2.5 px-3 py-2.5"
                  >
                    {inner}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
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
  const { mobileNavOpen, toggleMobileNav } = useWorkspace();
  const user = useCurrentUser();

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

  // Build breadcrumb from current pathname (SSR-safe)
  const pathname = usePathname() ?? "";
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.slice(1); // drop "dashboard"

  return (
    <>
      <header
        className="sci-command-bar"
        role="banner"
        aria-label="Command bar"
      >
        {/* ── Left: Mobile hamburger + Logo + breadcrumb ── */}
        <div className="flex items-center gap-2 sm:gap-3 mr-4 shrink-0">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={toggleMobileNav}
            className="relative p-1.5 rounded hover:bg-white/5 transition-colors text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 md:hidden"
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            aria-controls="primary-navigation"
          >
            <Menu size={14} />
          </button>

          <Link href="/dashboard" aria-label="Go to dashboard home">
            <Logo />
          </Link>

          {/* Breadcrumb trail */}
          <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground/50">
            <Circle size={4} fill="currentColor" className="text-primary/50 shrink-0" />
            <span className="text-muted-foreground/50">Workspace</span>
            {breadcrumbs.map((seg, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-muted-foreground/25">›</span>
                <span className={i === breadcrumbs.length - 1 ? "text-foreground/70 font-medium capitalize" : "capitalize"}>
                  {seg.replace(/-/g, " ")}
                </span>
              </span>
            ))}
          </nav>
        </div>

        {/* ── Center: Search (wider) ── */}
        <div className="flex-1 flex justify-center">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className={cn(
              "flex items-center gap-2 h-7 w-full max-w-sm px-3 rounded",
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
          <UserMenu user={user} onLogout={handleLogout} />
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
