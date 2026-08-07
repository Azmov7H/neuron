"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Atom, Clock, FlaskConical } from "lucide-react";
import { DOMAIN_STYLES } from "./constants";
import { fetchSimulationConfig } from "./simulation-config-client";

interface SimMeta {
  name: string;
  domain: string;
}

interface HistoryRun {
  simulationId: string;
  domain: string;
  timestamp: string;
  parameters: Record<string, number>;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString();
}

export function ContinueExperimenting() {
  const [loading, setLoading] = useState(true);
  const [run, setRun] = useState<HistoryRun | null>(null);
  const [nameMap, setNameMap] = useState<Record<string, SimMeta>>({});

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [histRes, config] = await Promise.all([
          fetch("/api/simulations/history?limit=1", { credentials: "include" }),
          fetchSimulationConfig(),
        ]);
        if (!active) return;

        if (config) {
          const map: Record<string, SimMeta> = {};
          Object.entries(config).forEach(([domainKey, domainConfig]) => {
            domainConfig.simulations.forEach((sim) => {
              map[sim.id] = { name: sim.name, domain: domainKey };
            });
          });
          setNameMap(map);
        }

        if (histRes.ok) {
          const hist = await histRes.json();
          const runs: HistoryRun[] = hist.data || [];
          if (runs.length > 0) setRun(runs[0]);
        }
      } catch {
        // Fall back to the generic call-to-action below.
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="animate-fade-up delay-200">
        <div className="sci-panel rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6 w-full">
            <div className="h-14 w-14 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-3 w-32 rounded bg-white/5 animate-pulse" />
              <div className="h-6 w-56 rounded bg-white/10 animate-pulse" />
              <div className="h-3 w-24 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
          <div className="h-11 w-32 rounded-lg bg-white/5 animate-pulse" />
        </div>
      </section>
    );
  }

  // New users (or fetch failure) get a generic call-to-action instead of a stale lab.
  if (!run) {
    return (
      <section className="animate-fade-up delay-200">
        <div className="sci-panel rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="p-4 rounded-xl bg-sci-ai/10 border border-sci-ai/20 hidden md:block">
              <FlaskConical size={24} className="text-sci-ai" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-sci-ai/80 mb-1">Begin Experiment</p>
              <h3 className="text-2xl font-bold text-foreground mb-1">Start your first simulation</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FlaskConical size={12} /> 48 laboratories across 6 scientific domains
              </div>
            </div>
          </div>
          <Link
            href="/dashboard/simulations/physics"
            className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-sci-ai/30 text-foreground px-6 py-3 rounded-lg font-medium transition-all group"
          >
            Browse Labs <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    );
  }

  const meta = nameMap[run.simulationId];
  const name = meta?.name ?? run.simulationId;
  const accent = (meta && DOMAIN_STYLES[meta.domain]?.text) || "text-primary";

  return (
    <section className="animate-fade-up delay-200">
      <div className="sci-panel rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 hidden md:block">
            <Atom size={24} className={accent} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary/80 mb-1">Resume Experiment</p>
            <h3 className="text-2xl font-bold text-foreground mb-1">{name}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock size={12} /> Last run: {timeAgo(run.timestamp)}
            </div>
          </div>
        </div>
        <Link
          href={`/dashboard/simulations/${run.simulationId}`}
          className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-primary/30 text-foreground px-6 py-3 rounded-lg font-medium transition-all group"
        >
          Continue <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </section>
  );
}
