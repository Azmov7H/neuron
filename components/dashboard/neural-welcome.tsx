"use client";

import { useEffect, useState } from "react";
import { Flame, Zap, Clock, TrendingUp } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

export function NeuralWelcome({ 
  user,
  activePath 
}: { 
  user: DashboardSummary["user"];
  activePath: DashboardSummary["activePath"];
}) {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const stats = [
    { icon: Zap, label: "XP", value: user.totalXP.toLocaleString(), color: "text-blue-400" },
    { icon: TrendingUp, label: "Rank", value: user.rank, color: "text-purple-400" },
    { icon: Flame, label: "Streak", value: `${user.streak} Days`, color: "text-amber-400" },
    { icon: Clock, label: "This Week", value: "Active", color: "text-emerald-400" },
  ];

  return (
    <section className="animate-fade-up">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight mb-2">
          {greeting}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent capitalize">{user.username}</span>
        </h1>
        {activePath ? (
          <p className="text-muted-foreground text-lg">
            You are <span className="text-foreground font-semibold">{activePath.overallCompletion}%</span> through "{activePath.title}"
          </p>
        ) : (
          <p className="text-muted-foreground text-lg">
            Ready to start a new neural path?
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass rounded-xl p-4 flex items-center gap-4 glow-border">
            <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
              <stat.icon size={18} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className="text-sm font-semibold text-foreground">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}