"use client";

import { useEffect, useState } from "react";
import { Flame, Zap, Clock, TrendingUp } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";
import { PageHeader } from "@/components/workspace/page-header";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function NeuralWelcome({
  user,
  activePath,
}: {
  user: DashboardSummary["user"];
  activePath: DashboardSummary["activePath"];
}) {
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGreeting(getGreeting());
  }, []);

  const stats = [
    { icon: Zap, label: "XP", value: user.totalXP.toLocaleString(), color: "text-blue-400" },
    { icon: TrendingUp, label: "Rank", value: user.rank, color: "text-purple-400" },
    { icon: Flame, label: "Streak", value: `${user.streak}d`, color: "text-amber-400" },
    { icon: Clock, label: "Status", value: "Active", color: "text-emerald-400" },
  ];

  const statStrip = (
    <div className="flex items-center gap-1 h-8 px-1.5 rounded-md bg-white/3 border border-white/5 text-[11px] flex-wrap backdrop-blur-sm">
      {stats.map((s, i) => (
        <span key={s.label} className="flex items-center gap-1.5 px-2">
          {i > 0 && <span className="w-px h-3 bg-white/8 -mx-1" />}
          <s.icon size={11} className={s.color} />
          <span className="text-muted-foreground">{s.label}</span>
          <span className="text-foreground font-semibold tabular-nums">{s.value}</span>
        </span>
      ))}
    </div>
  );

  const subtitle = activePath
    ? `${activePath.overallCompletion}% through ${activePath.title}`
    : "Welcome back to your workspace";

  const avatarEl = user.avatar ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={user.avatar}
      alt=""
      className="h-8 w-8 rounded-full object-cover bg-white/5 shrink-0"
    />
  ) : (
    <div
      aria-hidden="true"
      className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-[12px] font-bold text-background"
    >
      {(user.username?.[0] ?? "U").toUpperCase()}
    </div>
  );

  return (
    <PageHeader
      title={`${greeting}, ${user.username}`}
      subtitle={subtitle}
      actions={
        <div className="flex items-center gap-3">
          {avatarEl}
          {statStrip}
        </div>
      }
    />
  );
}
