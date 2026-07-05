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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "./workspace-context";
import Logo from "@/components/logo";

// ─── Nav item types ───────────────────────────────────────────

type LucideIcon = React.ComponentType<{ size?: number; className?: string; "aria-hidden"?: boolean | "true" | "false" }>;

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
  href: string;
  color?: string;
  shortcut?: string;
  adminOnly?: boolean;
}

interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

// ─── Navigation config ────────────────────────────────────────

const NAV_SECTIONS: NavSection[] = [
  {
    id: "home",
    title: "HOME",
    items: [
      { id: "home", icon: Home, label: "Home", href: "/dashboard" },
    ],
  },
  {
    id: "learning",
    title: "LEARNING",
    items: [
      { id: "neural-paths", icon: Route,    label: "Neural Paths", href: "/dashboard/neural-paths", color: "text-purple-400" },
      { id: "explore",      icon: Compass,  label: "Explore",      href: "/dashboard/explore",      color: "text-cyan-400" },
    ],
  },
  {
    id: "labs",
    title: "LABS",
    items: [
      { id: "physics",     icon: Atom,        label: "Physics",       href: "/dashboard/simulations", color: "text-blue-400" },
      { id: "biology",     icon: Leaf,        label: "Biology",       href: "/dashboard/simulations", color: "text-green-400" },
      { id: "chemistry",   icon: FlaskConical,label: "Chemistry",     href: "/dashboard/simulations", color: "text-yellow-400" },
      { id: "mathematics", icon: Pi,          label: "Mathematics",   href: "/dashboard/explore",     color: "text-purple-400" },
      { id: "ai",          icon: Brain,       label: "AI",            href: "/dashboard/explore",     color: "text-indigo-400" },
      { id: "anatomy",     icon: Dna,         label: "Human Anatomy", href: "/dashboard/simulations/anatomy-3d", color: "text-red-400" },
      { id: "astronomy",   icon: Telescope,   label: "Astronomy",     href: "/dashboard/explore",     color: "text-cyan-400" },
      { id: "technology",  icon: Cpu,         label: "Technology",    href: "/dashboard/explore",     color: "text-orange-400" },
    ],
  },
  {
    id: "spark",
    title: "SPARK",
    items: [
      { id: "spark",       icon: Zap,          label: "Conversations", href: "/dashboard/spark",         color: "text-amber-400" },
      { id: "matrix",      icon: LayoutGrid,   label: "Knowledge Matrix", href: "/dashboard/matrix",    color: "text-indigo-400" },
      { id: "simulations", icon: MonitorPlay,  label: "Simulations",   href: "/dashboard/simulations",  color: "text-blue-400" },
    ],
  },
  {
    id: "analytics",
    title: "ANALYTICS",
    items: [
      { id: "evolution",    icon: TrendingUp, label: "Evolution",    href: "/dashboard/evolution",    color: "text-emerald-400" },
      { id: "achievements", icon: Trophy,     label: "Achievements", href: "/dashboard/achievements", color: "text-amber-400" },
    ],
  },
  {
    id: "system",
    title: "SYSTEM",
    items: [
      { id: "profile",  icon: User,    label: "Profile",  href: "/dashboard/profile" },
      { id: "settings", icon: Settings,label: "Settings", href: "/dashboard/settings" },
      { id: "admin",    icon: Shield,  label: "Admin",    href: "/dashboard/admin",   adminOnly: true },
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
  isPinned: boolean;
  onTogglePin: (id: string) => void;
}

function NavItemRow({ item, isActive, collapsed, isPinned, onTogglePin }: NavItemRowProps) {
  const [hovered, setHovered] = useState(false);

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
          "flex items-center gap-2.5 rounded-md transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
          collapsed ? "w-9 h-9 justify-center mx-auto" : "px-2.5 py-1.5 w-full",
          isActive
            ? "bg-white/6 text-foreground"
            : "text-muted-foreground/70 hover:text-foreground hover:bg-white/4"
        )}
      >
        <item.icon
          size={15}
          className={cn(
            "shrink-0 transition-colors",
            isActive ? (item.color ?? "text-primary") : "text-current"
          )}
          aria-hidden="true"
        />
        {!collapsed && (
          <span className="text-[12px] font-medium truncate flex-1">
            {item.label}
          </span>
        )}
        {!collapsed && isActive && (
          <span
            className="w-1 h-1 rounded-full bg-primary shrink-0"
            aria-hidden="true"
          />
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
  const { navCollapsed, toggleNav, setNavCollapsed } = useWorkspace();
  const pathname = usePathname();
  const [pinned, setPinned] = useState<string[]>([]);

  // Load pins
  useEffect(() => { setPinned(loadPins()); }, []);

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

  // Build pinned items list (order preserved)
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const pinnedItems = pinned
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is NavItem => !!i);

  return (
    <nav
      aria-label="Primary navigation"
      className={cn(
        "sci-nav flex-shrink-0 select-none",
        "transition-[width] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]",
        navCollapsed
          ? "w-[var(--nav-collapsed-width)]"
          : "w-[var(--nav-expanded-width)]"
      )}
    >
      {/* ── Logo row (collapsed = icon only) ── */}
      <div
        className={cn(
          "flex items-center h-10 border-b border-white/5 shrink-0 overflow-hidden",
          navCollapsed ? "justify-center px-0" : "px-3 gap-2"
        )}
      >
        {!navCollapsed && (
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
            {!navCollapsed && (
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
                  collapsed={navCollapsed}
                  isPinned={true}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </div>
          </div>
        )}

        {/* All sections */}
        {NAV_SECTIONS.map((section) => (
          <div key={section.id}>
            {!navCollapsed && (
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
                  collapsed={navCollapsed}
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
            navCollapsed && "justify-center"
          )}
          title={navCollapsed ? "Expand navigation ([)" : "Collapse navigation ([)"}
          aria-label={navCollapsed ? "Expand navigation" : "Collapse navigation"}
          aria-keyshortcuts="["
        >
          {navCollapsed ? (
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
  );
}
