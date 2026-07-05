"use client";

import { useEffect, useState } from "react";
import { Loader2, Play, ArrowRight, Sparkles, MonitorPlay, Route, Flame, Zap, TrendingUp, Clock, CheckCircle, Circle, Dot, Bookmark, FlaskConical, Lightbulb, Brain } from "lucide-react";
import Link from "next/link";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import { useContextPanel } from "@/components/workspace/use-context-panel";
import { Inspector } from "@/components/workspace/inspector";
import { PanelRow, PanelSection } from "@/components/workspace/panel";

// ─── Context panel content for the home page ─────────────────

function HomeContextPanel({ summary }: { summary: DashboardSummary }) {
  const { activePath, user } = summary;
  return (
    <div className="py-1">
      <Inspector title="Current Path" defaultOpen>
        {activePath ? (
          <div className="space-y-2">
            <p className="text-[12px] text-foreground font-medium leading-snug">
              {activePath.title}
            </p>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
                style={{ width: `${activePath.overallCompletion}%` }}
              />
            </div>
            <PanelRow label="Progress" value={`${activePath.overallCompletion}%`} />
            <PanelRow label="Domain" value={activePath.domain} />
            <PanelRow label="Chapter" value={activePath.currentChapterTitle ?? "—"} />
          </div>
        ) : (
          <p className="text-[12px] text-muted-foreground">No active path. Choose one from Neural Paths.</p>
        )}
      </Inspector>

      <Inspector title="Your Stats" defaultOpen={false}>
        <PanelRow label="Total XP" value={user.totalXP.toLocaleString()} />
        <PanelRow label="Rank" value={user.rank} />
        <PanelRow label="Streak" value={`${user.streak} days`} />
      </Inspector>

      <Inspector title="Spark Suggestion" defaultOpen>
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">Today's concept:</p>
          <p className="text-[12px] text-foreground font-medium leading-snug">
            "How does entropy shape the arrow of time?"
          </p>
          <Link
            href="/dashboard/spark"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors mt-1"
          >
            Ask Spark <ArrowRight size={10} />
          </Link>
        </div>
      </Inspector>

      <Inspector title="Quick Access" defaultOpen={false}>
        <div className="space-y-1">
          {[
            { label: "Simulations", href: "/dashboard/simulations", icon: MonitorPlay },
            { label: "Neural Paths", href: "/dashboard/neural-paths", icon: Route },
          ].map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="flex items-center gap-2 py-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon size={12} /> {label}
            </Link>
          ))}
        </div>
      </Inspector>
    </div>
  );
}

// ─── Helper: domain icon for discoveries ─────────────────────

function getDiscoveryIcon(domain: string) {
  if (domain.toLowerCase().includes("physic")) return FlaskConical;
  if (domain.toLowerCase().includes("ai") || domain.toLowerCase().includes("neural")) return Brain;
  return Lightbulb;
}

// ─── Dashboard Home Page ──────────────────────────────────────

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/dashboard/summary");
        const payload = await res.json();
        if (!res.ok) {
          setError(payload?.error?.message || payload?.message || "Failed to load dashboard.");
          return;
        }
        setSummary(payload.data);
      } catch {
        setError("Network error while loading dashboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  // Populate context panel when summary is ready
  useContextPanel(
    summary ? <HomeContextPanel summary={summary} /> : null,
    [summary]
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary w-6 h-6" />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="flex h-full items-center justify-center min-h-[60vh] text-red-400 font-mono text-sm">
        {error ?? "Unknown error"}
      </div>
    );
  }

  const { user, activePath, weeklyStats, recentDiscoveries } = summary;

  // Greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-full p-6 space-y-6 animate-fade-in">

      {/* ── Header strip ──────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-[0.15em] mb-1">
            {greeting}
          </p>
          <h1 className="text-2xl font-bold text-foreground capitalize">
            {user.username}
          </h1>
          {activePath && (
            <p className="text-[13px] text-muted-foreground mt-1">
              <span className="text-foreground font-medium">{activePath.overallCompletion}%</span> through{" "}
              <span className="text-primary">{activePath.title}</span>
            </p>
          )}
        </div>

        {/* Inline stat strip */}
        <div className="flex items-center gap-1 h-8 px-1.5 rounded-md bg-white/3 border border-white/5 text-[11px] flex-wrap">
          {[
            { icon: Zap,        label: "XP",     value: user.totalXP.toLocaleString(), color: "text-blue-400" },
            { icon: TrendingUp, label: "Rank",   value: user.rank,                     color: "text-purple-400" },
            { icon: Flame,      label: "Streak", value: `${user.streak}d`,             color: "text-amber-400" },
            { icon: Clock,      label: "Status", value: "Active",                      color: "text-emerald-400" },
          ].map((s, i) => (
            <span key={s.label} className="flex items-center gap-1.5 px-2">
              {i > 0 && <span className="w-px h-3 bg-white/8 -mx-1" />}
              <s.icon size={11} className={s.color} />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="text-foreground font-semibold">{s.value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Main 2-column workspace ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* ── LEFT: Active learning surface (col-span 3) ─────── */}
        <div className="xl:col-span-3 space-y-5">

          {/* Continue learning hero */}
          {activePath ? (
            <div className="relative rounded-lg overflow-hidden border border-white/6 bg-card min-h-[200px] animate-fade-up">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background/80 to-secondary/10" />
              <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.15em] text-primary/70 font-semibold mb-1">
                    Continue Exploring
                  </p>
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {activePath.title}
                  </h2>
                  {activePath.currentChapterTitle && (
                    <p className="text-[13px] text-muted-foreground">
                      {activePath.currentChapterTitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-6">
                  <Link
                    href="/dashboard/neural-paths"
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2 rounded-md text-[13px] font-semibold transition-all hover:opacity-90 active:scale-95"
                  >
                    <Play size={13} fill="currentColor" /> Resume
                  </Link>
                  <div className="flex-1 max-w-xs">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                        style={{ width: `${activePath.overallCompletion}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground/60 mt-1 text-right">
                      {activePath.overallCompletion}% complete
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-white/6 bg-card p-6 flex flex-col items-center justify-center min-h-[180px] text-center gap-4 animate-fade-up">
              <p className="text-muted-foreground text-sm">No active learning path.</p>
              <Link
                href="/dashboard/neural-paths"
                className="flex items-center gap-2 border border-primary/30 text-primary px-4 py-1.5 rounded text-[13px] hover:bg-primary/5 transition-colors"
              >
                Explore Paths <ArrowRight size={13} />
              </Link>
            </div>
          )}

          {/* Active path milestones */}
          {activePath && (
            <div className="rounded-lg border border-white/6 bg-card p-5 animate-fade-up delay-100">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[13px] font-semibold text-foreground">Path Milestones</h3>
                <span className="text-[11px] text-muted-foreground bg-white/5 px-2 py-0.5 rounded capitalize">
                  {activePath.domain}
                </span>
              </div>
              <div className="relative flex justify-between items-center">
                <div className="absolute top-1/2 left-0 w-full h-px bg-white/8 -translate-y-1/2" />
                <div
                  className="absolute top-1/2 left-0 h-px bg-gradient-to-r from-primary to-secondary -translate-y-1/2 transition-all"
                  style={{ width: `${activePath.overallCompletion}%` }}
                />
                {activePath.milestones.map((m, i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center gap-2">
                    <div className={`p-0.5 rounded-full bg-background ${m.current ? "shadow-[0_0_12px_rgba(59,130,246,0.4)]" : ""}`}>
                      {m.completed ? (
                        <CheckCircle className="text-primary" size={18} />
                      ) : m.current ? (
                        <div className="w-[18px] h-[18px] rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
                          <Dot className="text-primary" size={12} fill="currentColor" />
                        </div>
                      ) : (
                        <Circle className="text-muted-foreground/30" size={18} />
                      )}
                    </div>
                    <span className={`text-[10px] text-center max-w-[64px] truncate ${m.current ? "text-foreground font-medium" : "text-muted-foreground/50"}`} title={m.label}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evolution progress */}
          <div className="rounded-lg border border-white/6 bg-card p-5 animate-fade-up delay-150">
            <h3 className="text-[13px] font-semibold text-foreground mb-4">Evolution Progress</h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Cognitive Velocity", value: weeklyStats.cognitiveVelocityLabel, color: "text-blue-400" },
                { label: "Weekly XP",          value: weeklyStats.weeklyXP.toLocaleString(), color: "text-emerald-400" },
                { label: "Concepts Mastered",  value: String(weeklyStats.conceptsMastered),  color: "text-purple-400" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider mb-1">{s.label}</p>
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  {/* Mini sparkline bars */}
                  <div className="h-6 flex items-end gap-0.5 mt-2 opacity-30">
                    {[40, 70, 50, 90, 60, 85, 95].map((h, i) => (
                      <div key={i} className="flex-1 bg-current rounded-t-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Activity feed (col-span 2) ──────────────── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Spark recommendation */}
          <div className="rounded-lg border border-white/6 bg-card p-5 relative overflow-hidden animate-fade-up delay-50">
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={14} className="text-secondary" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary">Spark Suggests</span>
              </div>
              <p className="text-muted-foreground text-[12px] mb-2">Concept worth exploring today:</p>
              <h3 className="text-[14px] font-semibold text-foreground leading-snug mb-4">
                "How does entropy shape the arrow of time?"
              </h3>
              <Link
                href="/dashboard/spark"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-secondary hover:text-secondary/80 transition-colors"
              >
                Explore with Spark <ArrowRight size={12} />
              </Link>
            </div>
          </div>

          {/* Explore domains */}
          <div className="rounded-lg border border-white/6 bg-card p-5 animate-fade-up delay-100">
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Explore Domains</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Physics",     color: "text-blue-400",   bg: "bg-blue-400/8",  href: "/dashboard/simulations" },
                { label: "Biology",     color: "text-green-400",  bg: "bg-green-400/8", href: "/dashboard/simulations" },
                { label: "AI",          color: "text-indigo-400", bg: "bg-indigo-400/8",href: "/dashboard/explore" },
                { label: "Mathematics", color: "text-purple-400", bg: "bg-purple-400/8",href: "/dashboard/explore" },
                { label: "Quantum",     color: "text-violet-400", bg: "bg-violet-400/8",href: "/dashboard/simulations" },
                { label: "Astronomy",   color: "text-cyan-400",   bg: "bg-cyan-400/8",  href: "/dashboard/explore" },
              ].map((d) => (
                <Link
                  key={d.label}
                  href={d.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded border border-white/5 ${d.bg} hover:border-white/10 transition-all text-[12px] font-medium ${d.color}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                  {d.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent discoveries */}
          <div className="rounded-lg border border-white/6 bg-card p-5 animate-fade-up delay-150">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-semibold text-foreground">Recent Discoveries</h3>
              <Link href="/dashboard/evolution" className="text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                View all
              </Link>
            </div>
            {!recentDiscoveries || recentDiscoveries.length === 0 ? (
              <p className="text-[12px] text-muted-foreground/50 text-center py-4">No recent discoveries. Keep exploring!</p>
            ) : (
              <div className="space-y-1">
                {recentDiscoveries.slice(0, 5).map((d, i) => {
                  const Icon = getDiscoveryIcon(d.domain);
                  return (
                    <div key={`${d.concept}-${i}`} className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white/3 transition-colors cursor-pointer group">
                      <div className="p-1.5 rounded bg-white/4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0">
                        <Icon size={12} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-medium text-foreground truncate">{d.concept}</p>
                        <p className="text-[10px] text-muted-foreground/50 capitalize">{d.domain}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground/40 shrink-0">
                        {new Date(d.discoveredAt).toLocaleDateString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Simulations quick access */}
          <div className="rounded-lg border border-white/6 bg-card p-5 animate-fade-up delay-200">
            <h3 className="text-[13px] font-semibold text-foreground mb-3">Simulations Lab</h3>
            <div className="space-y-2">
              {[
                { title: "Quantum States", status: "Live",  color: "text-blue-400",   bg: "bg-blue-500/8",   href: "/dashboard/simulations" },
                { title: "Gravity Wells",  status: "Beta",  color: "text-amber-400",  bg: "bg-amber-500/8",  href: "/dashboard/simulations" },
                { title: "Neural Nets",    status: "Live",  color: "text-emerald-400",bg: "bg-emerald-500/8",href: "/dashboard/simulations" },
              ].map((sim) => (
                <Link
                  key={sim.title}
                  href={sim.href}
                  className="flex items-center gap-3 px-3 py-2 rounded border border-white/5 hover:border-white/10 hover:bg-white/3 transition-all"
                >
                  <MonitorPlay size={13} className={sim.color} />
                  <span className="flex-1 text-[12px] text-foreground">{sim.title}</span>
                  <span className={`text-[10px] font-semibold ${sim.color} ${sim.bg} px-2 py-0.5 rounded-full`}>
                    {sim.status}
                  </span>
                </Link>
              ))}
              <Link
                href="/dashboard/simulations"
                className="flex items-center justify-center gap-1 pt-1 text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                All simulations <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}