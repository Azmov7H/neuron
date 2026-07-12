"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Search,
  ArrowRight,
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
  FlaskConical,
  Atom,
  Leaf,
  Pi,
  Brain,
  Cpu,
  Dna,
  Telescope,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// ─── Command item types ───────────────────────────────────────

type LucideIcon = React.ComponentType<{ size?: number; className?: string }>;

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: LucideIcon;
  href?: string;
  action?: () => void;
  category: string;
  keywords?: string[];
  color?: string;
}

// ─── Command registry ─────────────────────────────────────────

const ALL_COMMANDS: CommandItem[] = [
  // Navigation
  { id: "home",         label: "Home",               icon: Home,        href: "/dashboard",              category: "Navigate",   color: "text-foreground" },
  { id: "explore",      label: "Explore",             icon: Compass,     href: "/dashboard/explore",      category: "Navigate",   color: "text-foreground" },
  { id: "spark",        label: "Spark AI",            icon: Zap,         href: "/dashboard/spark",        category: "Navigate",   color: "text-amber-400",  keywords: ["chat", "ai", "assistant"] },
  { id: "matrix",       label: "Knowledge Matrix",    icon: LayoutGrid,  href: "/dashboard/matrix",       category: "Navigate",   color: "text-indigo-400" },
  { id: "simulations",  label: "Simulations",         icon: MonitorPlay, href: "/dashboard/simulations",  category: "Navigate",   color: "text-blue-400" },
  { id: "neural-paths", label: "Neural Paths",        icon: Route,       href: "/dashboard/neural-paths", category: "Navigate",   color: "text-purple-400", keywords: ["paths", "learning"] },
  { id: "evolution",    label: "Evolution",           icon: TrendingUp,  href: "/dashboard/evolution",    category: "Navigate",   color: "text-emerald-400" },
  { id: "achievements", label: "Achievements",        icon: Trophy,      href: "/dashboard/achievements", category: "Navigate",   color: "text-amber-400" },
  { id: "profile",      label: "Profile",             icon: User,        href: "/dashboard/profile",      category: "Navigate",   color: "text-foreground" },
  { id: "settings",     label: "Settings",            icon: Settings,    href: "/dashboard/settings",     category: "Navigate",   color: "text-foreground" },

  // Labs / Domains
  { id: "lab-physics",   label: "Physics Lab",        icon: Atom,        href: "/dashboard/simulations",  category: "Labs",       color: "text-blue-400",   keywords: ["physics", "quantum"] },
  { id: "lab-biology",   label: "Biology Lab",        icon: Leaf,        href: "/dashboard/simulations",  category: "Labs",       color: "text-green-400",  keywords: ["biology", "cells"] },
  { id: "lab-chemistry", label: "Chemistry Lab",      icon: FlaskConical,href: "/dashboard/simulations",  category: "Labs",       color: "text-yellow-400", keywords: ["chemistry", "molecules"] },
  { id: "lab-math",      label: "Mathematics",        icon: Pi,          href: "/dashboard/explore",      category: "Labs",       color: "text-purple-400", keywords: ["math", "calculus"] },
  { id: "lab-ai",        label: "AI & Neural",        icon: Brain,       href: "/dashboard/explore",      category: "Labs",       color: "text-indigo-400", keywords: ["ai", "neural", "machine learning"] },
  { id: "lab-anatomy",   label: "Human Anatomy",      icon: Dna,         href: "/dashboard/simulations/anatomy-3d", category: "Labs", color: "text-red-400", keywords: ["anatomy", "body", "3d"] },
  { id: "lab-astronomy", label: "Astronomy",          icon: Telescope,   href: "/dashboard/explore",      category: "Labs",       color: "text-cyan-400",  keywords: ["space", "stars", "astronomy"] },
  { id: "lab-tech",      label: "Technology",         icon: Cpu,         href: "/dashboard/explore",      category: "Labs",       color: "text-orange-400", keywords: ["technology", "engineering"] },
];

const RECENT_KEY = "sci-cmd-recent";
const MAX_RECENT = 5;

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch { return []; }
}

function saveRecent(ids: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(ids)); } catch { /* ignore */ }
}

// ─── CommandPalette ───────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [knowledgeItems, setKnowledgeItems] = useState<CommandItem[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load recent on open — lazy client-only read to avoid hydration mismatch
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRecent(loadRecent());
      setQuery("");
      setSelected(0);
      setKnowledgeItems([]);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Debounced knowledge search against the API
  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (!q) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setKnowledgeItems([]);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/knowledge/search?q=${encodeURIComponent(q)}&limit=6`,
          { credentials: "include" }
        );
        const payload = await res.json();
        const hits = payload?.success ? (payload?.data?.results ?? []) : [];
        setKnowledgeItems(
          hits.slice(0, 6).map((r: { id: string; title: string; kind: string; domain: string }) => ({
            id: `kb-${r.id}`,
            label: r.title,
            description: `${r.kind} · ${r.domain}`,
            icon: Search,
            href: `/dashboard/explore?q=${encodeURIComponent(q)}`,
            category: "Knowledge",
            color: "text-cyan-400",
            keywords: [r.kind, r.domain],
          }))
        );
      } catch {
        setKnowledgeItems([]);
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, open]);

  // Filtered + grouped results
  const results: CommandItem[] = React.useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) {
      // Show recent first, then all
      const recentItems = recent
        .map((id) => ALL_COMMANDS.find((c) => c.id === id))
        .filter((c): c is CommandItem => !!c);
      return recentItems.length > 0 ? recentItems : ALL_COMMANDS.slice(0, 8);
    }
    const filtered = ALL_COMMANDS.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        (c.description ?? "").toLowerCase().includes(q) ||
        (c.keywords ?? []).some((k) => k.includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
    return [...filtered, ...knowledgeItems];
  }, [query, recent, knowledgeItems]);

  const execute = useCallback(
    (item: CommandItem) => {
      // Update recent
      const updated = [item.id, ...recent.filter((r) => r !== item.id)].slice(
        0,
        MAX_RECENT
      );
      setRecent(updated);
      saveRecent(updated);

      if (item.href) router.push(item.href);
      item.action?.();
      onClose();
    },
    [recent, router, onClose]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(s + 1, results.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(s - 1, 0));
      }
      if (e.key === "Enter" && results[selected]) {
        e.preventDefault();
        execute(results[selected]);
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, selected, execute, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selected}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  if (!open) return null;

  // Group by category
  const grouped = results.reduce<Record<string, CommandItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        className={cn(
          "fixed left-1/2 top-[20%] -translate-x-1/2 z-[101]",
          "w-full max-w-xl rounded-xl overflow-hidden",
          "bg-card border border-white/10 shadow-2xl shadow-black/60",
          "animate-scale-in"
        )}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-12 border-b border-white/8">
          <Search size={14} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Search pages, labs, knowledge…"
            className="flex-1 bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground/50 outline-none"
            aria-label="Command search"
            autoComplete="off"
            spellCheck={false}
          />
          {searching && (
            <span className="text-[10px] text-muted-foreground/50 animate-pulse shrink-0">
              Searching…
            </span>
          )}
          <kbd className="text-[10px] text-muted-foreground/50 border border-white/8 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="overflow-y-auto max-h-80 scrollbar-none py-2">
          {results.length === 0 ? (
            <div className="text-center text-[12px] text-muted-foreground py-8">
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => {
              // Get cumulative index for selected tracking
              const categoryStart = results.indexOf(items[0]);

              return (
                <div key={category}>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold px-4 py-1.5">
                    {query ? category : category === "Navigate" && recent.length > 0 ? "Recent" : category}
                  </p>
                  {items.map((item, idx) => {
                    const globalIdx = categoryStart + idx;
                    const isSelected = globalIdx === selected;

                    return (
                      <button
                        type="button"
                        key={item.id}
                        data-index={globalIdx}
                        onClick={() => execute(item)}
                        onMouseEnter={() => setSelected(globalIdx)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2",
                          "text-[13px] transition-colors duration-100",
                          "focus-visible:outline-none",
                          isSelected
                            ? "bg-white/6 text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <item.icon
                          size={14}
                          className={cn("shrink-0", item.color ?? "text-muted-foreground")}
                        />
                        <span className="flex-1 text-left">{item.label}</span>
                        {item.description && (
                          <span className="text-[11px] text-muted-foreground/50 text-right">
                            {item.description}
                          </span>
                        )}
                        {isSelected && (
                          <ArrowRight size={12} className="text-muted-foreground/50 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-white/5 text-[10px] text-muted-foreground/40">
          <span><kbd className="border border-white/10 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="border border-white/10 rounded px-1">↵</kbd> open</span>
          <span><kbd className="border border-white/10 rounded px-1">ESC</kbd> close</span>
        </div>
      </div>
    </>
  );
}
