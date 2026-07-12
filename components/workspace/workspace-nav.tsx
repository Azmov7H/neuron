"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Zap,
  LayoutGrid,
  MonitorPlay,
  Route,
  TrendingUp,
  Trophy,
  User,
  Settings,
  Atom,
  Leaf,
  FlaskConical,
  Pi,
  Brain,
  Cpu,
  Dna,
  Telescope,
  ChevronLeft,
  ChevronRight,
  Pin,
  Shield,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_HIERARCHY, type Role } from "@/types";
import { useWorkspace } from "./workspace-context";
import { useIsMobile } from "./use-is-mobile";
import type { NavItemDTO, NavSectionDTO } from "@/app/api/navigation/route";

// ─── Nav item types ───────────────────────────────────────────

type LucideIcon = React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

type NavItem = NavItemDTO;

/**
 * Registry mapping nav-config icon names to lucide components.
 * The config is served as plain data, so icons resolve client-side.
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Home,
  Compass,
  Zap,
  LayoutGrid,
  MonitorPlay,
  Route,
  TrendingUp,
  Trophy,
  User,
  Settings,
  Shield,
  Atom,
  Leaf,
  FlaskConical,
  Pi,
  Brain,
  Cpu,
  Dna,
  Telescope,
};

/**
 * Permission gate for a nav item. A null role (role not yet resolved) is
 * treated permissively — every item shows until the server provides a role.
 */
function hasRoleAccess(item: NavItem, role: Role | null): boolean {
  if (!item.roles || item.roles.length === 0) return true;
  if (!role) return true;
  const required = Math.min(...item.roles.map((r) => ROLE_HIERARCHY[r]));
  return ROLE_HIERARCHY[role] >= required;
}

// ─── Fallback config (used until /api/navigation resolves) ────

const FALLBACK_SECTIONS: NavSectionDTO[] = [
  {
    id: "home",
    title: "HOME",
    items: [{ id: "home", label: "Home", icon: "Home", href: "/dashboard" }],
  },
  {
    id: "learning",
    title: "LEARNING",
    items: [
      { id: "neural-paths", label: "Neural Paths", icon: "Route", href: "/dashboard/neural-paths", color: "text-purple-400" },
      { id: "explore", label: "Explore", icon: "Compass", href: "/dashboard/explore", color: "text-cyan-400" },
    ],
  },
  {
    id: "labs",
    title: "LABS",
    items: [
      { id: "physics", label: "Physics", icon: "Atom", href: "/dashboard/simulations", color: "text-blue-400" },
      { id: "biology", label: "Biology", icon: "Leaf", href: "/dashboard/simulations", color: "text-green-400" },
      { id: "chemistry", label: "Chemistry", icon: "FlaskConical", href: "/dashboard/simulations", color: "text-yellow-400" },
      { id: "mathematics", label: "Mathematics", icon: "Pi", href: "/dashboard/explore", color: "text-purple-400" },
      { id: "ai", label: "AI", icon: "Brain", href: "/dashboard/explore", color: "text-indigo-400" },
      { id: "anatomy", label: "Human Anatomy", icon: "Dna", href: "/dashboard/simulations/anatomy-3d", color: "text-red-400" },
      { id: "astronomy", label: "Astronomy", icon: "Telescope", href: "/dashboard/explore", color: "text-cyan-400" },
      { id: "technology", label: "Technology", icon: "Cpu", href: "/dashboard/explore", color: "text-orange-400" },
    ],
  },
  {
    id: "spark",
    title: "SPARK",
    items: [
      { id: "spark", label: "Conversations", icon: "Zap", href: "/dashboard/spark", color: "text-amber-400" },
      { id: "matrix", label: "Knowledge Matrix", icon: "LayoutGrid", href: "/dashboard/matrix", color: "text-indigo-400" },
      { id: "simulations", label: "Simulations", icon: "MonitorPlay", href: "/dashboard/simulations", color: "text-blue-400" },
    ],
  },
  {
    id: "analytics",
    title: "ANALYTICS",
    items: [
      { id: "evolution", label: "Evolution", icon: "TrendingUp", href: "/dashboard/evolution", color: "text-emerald-400" },
      { id: "achievements", label: "Achievements", icon: "Trophy", href: "/dashboard/achievements", color: "text-amber-400" },
    ],
  },
  {
    id: "system",
    title: "SYSTEM",
    items: [
      { id: "profile", label: "Profile", icon: "User", href: "/dashboard/profile" },
      { id: "settings", label: "Settings", icon: "Settings", href: "/dashboard/settings" },
      { id: "admin", label: "Admin", icon: "Shield", href: "/dashboard/admin", roles: ["admin"] },
    ],
  },
];

// ─── Single nav item ──────────────────────────────────────────

const PINS_KEY = "sci-nav-pinned";

function loadPins(): string[] {
  try { return JSON.parse(localStorage.getItem(PINS_KEY) ?? "[]") as string[]; }
  catch { return []; }
}
function savePins(ids: string[]) {
  try { localStorage.setItem(PINS_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

interface NavItemRowProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  showLabels: boolean;
  isPinned: boolean;
  onTogglePin: (id: string) => void;
}

function NavItemRow({ item, isActive, collapsed, showLabels, isPinned, onTogglePin }: NavItemRowProps) {
  const [hovered, setHovered] = useState(false);
  const Icon = ICON_MAP[item.icon] ?? Circle;

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={item.href}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex items-center gap-2.5 rounded-md transition-all duration-150 relative",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          collapsed ? "w-9 h-9 justify-center mx-auto" : "px-2.5 py-1.5 w-full",
          isActive
            ? "bg-white/6 text-foreground"
            : "text-muted-foreground/70 hover:text-foreground hover:bg-white/4"
        )}
      >
        {/* Left accent indicator for the active item (expanded only) */}
        {showLabels && isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[2px] rounded-r bg-primary"
            aria-hidden="true"
          />
        )}

        <Icon
          size={15}
          className={cn(
            "shrink-0 transition-colors",
            isActive ? (item.color ?? "text-primary") : "text-current"
          )}
          aria-hidden="true"
        />
        {showLabels && (
          <span className="text-[12px] font-medium truncate flex-1">
            {item.label}
          </span>
        )}
      </Link>

      {/* Tooltip in collapsed mode */}
      {collapsed && hovered && (
        <div
          role="tooltip"
          className={cn(
            "absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50",
            "px-2.5 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap",
            "bg-card border border-white/10 shadow-xl shadow-black/50",
            "animate-slide-right pointer-events-none"
          )}
        >
          {item.label}
        </div>
      )}

      {/* Pin button in expanded mode */}
      {!collapsed && hovered && (
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); onTogglePin(item.id); }}
          className={cn(
            "absolute right-1 top-1/2 -translate-y-1/2",
            "p-1 rounded transition-colors",
            isPinned
              ? "text-primary opacity-100"
              : "text-muted-foreground/30 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
          )}
          aria-label={isPinned ? `Unpin ${item.label}` : `Pin ${item.label}`}
          title={isPinned ? "Unpin" : "Pin to top"}
        >
          <Pin size={10} />
        </button>
      )}
    </div>
  );
}

// ─── WorkspaceNav ─────────────────────────────────────────────

export function WorkspaceNav() {
  const {
    navCollapsed,
    toggleNav,
    mobileNavOpen,
    setMobileNavOpen,
    role,
  } = useWorkspace();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const showLabels = !navCollapsed || isMobile;
  const [pinned, setPinned] = useState<string[]>([]);
  const [sections, setSections] = useState<NavSectionDTO[]>(FALLBACK_SECTIONS);

  // Load pins — lazy client-only read to avoid hydration mismatch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPinned(loadPins()); }, []);

  // Fetch nav config from the API; fall back to the static config on failure.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/navigation", { credentials: "include" })
      .then((res) => res.json())
      .then((payload) => {
        if (cancelled) return;
        if (payload?.success && Array.isArray(payload?.data?.sections)) {
          setSections(payload.data.sections);
        }
      })
      .catch(() => {
        /* keep fallback config */
      });
    return () => { cancelled = true; };
  }, []);

  // Keyboard shortcut [ to toggle
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "[" && !e.metaKey && !e.ctrlKey) {
        toggleNav();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleNav]);

  const handleTogglePin = useCallback((id: string) => {
    setPinned((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      savePins(next);
      return next;
    });
  }, []);

  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);

  // Build permission-filtered section + pinned lists
  const accessibleSections = sections.map((s) => ({
    ...s,
    items: s.items.filter((i) => hasRoleAccess(i, role)),
  })).filter((s) => s.items.length > 0);

  const allItems = sections.flatMap((s) => s.items);
  const pinnedItems = pinned
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is NavItem => !!i && hasRoleAccess(i, role));

  // Tooltip/icon-rail state: only on desktop when the column is collapsed.
  const drawerCollapsed = !isMobile && navCollapsed;

  return (
    <>
      {/* Mobile backdrop — taps close the overlay drawer */}
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-[1400] bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      <nav
        id="primary-navigation"
        aria-label="Primary navigation"
        className={cn(
          "sci-nav flex-shrink-0 select-none z-[1500]",
          // Mobile: fixed overlay drawer, always expanded width
          "fixed inset-y-0 left-0",
          mobileNavOpen ? "translate-x-0" : "-translate-x-full",
          "w-[var(--nav-expanded-width)]",
          // Desktop: static flex column, width follows collapse state
          "md:static md:z-auto md:translate-x-0",
          navCollapsed
            ? "md:w-[var(--nav-collapsed-width)]"
            : "md:w-[var(--nav-expanded-width)]",
          "transition-[width,transform] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
        )}
      >
        {/* ── Logo row (collapsed = icon only) ── */}
        <div
          className={cn(
            "flex items-center h-10 border-b border-white/5 shrink-0 overflow-hidden",
            showLabels ? "px-3 gap-2" : "justify-center px-0"
          )}
        >
          {showLabels && (
            <span className="text-[11px] font-bold text-foreground/80 tracking-wider truncate">
              NEURON
            </span>
          )}
        </div>

        {/* ── Scrollable nav body ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-none py-2 px-1.5 space-y-4">

          {/* Pinned section */}
          {pinnedItems.length > 0 && (
            <div>
              {showLabels && (
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/30 font-semibold px-2 mb-1">
                  PINNED
                </p>
              )}
              <div className="space-y-0.5">
                {pinnedItems.map((item) => (
                  <NavItemRow
                    key={item.id}
                    item={item}
                    isActive={isActive(item.href)}
                    collapsed={drawerCollapsed}
                    showLabels={showLabels}
                    isPinned={true}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All sections */}
          {accessibleSections.map((section) => (
            <div key={section.id}>
              {showLabels && (
                <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/30 font-semibold px-2 mb-1">
                  {section.title}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavItemRow
                    key={item.id}
                    item={item}
                    isActive={isActive(item.href)}
                    collapsed={drawerCollapsed}
                    showLabels={showLabels}
                    isPinned={pinned.includes(item.id)}
                    onTogglePin={handleTogglePin}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ── Collapse toggle ── */}
        <div className="border-t border-white/5 p-1.5 shrink-0">
          <button
            type="button"
            onClick={toggleNav}
            className={cn(
              "flex items-center gap-2 w-full rounded-md px-2 py-2",
              "text-muted-foreground/40 hover:text-muted-foreground",
              "hover:bg-white/4 transition-colors duration-150",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
              !showLabels && "justify-center"
            )}
            title={navCollapsed ? "Expand navigation ([)" : "Collapse navigation ([)"}
            aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
            aria-keyshortcuts="["
          >
            {!showLabels ? (
              <ChevronRight size={13} />
            ) : (
              <>
                <ChevronLeft size={13} />
                <span className="text-[11px]">Collapse</span>
                <kbd className="ml-auto text-[9px] border border-white/8 rounded px-1">[</kbd>
              </>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}
