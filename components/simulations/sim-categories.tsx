"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DOMAIN_ORDER, DOMAIN_STYLES } from "./constants";
import { fetchSimulationConfig } from "./simulation-config-client";

export function SimCategories() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const config = await fetchSimulationConfig();
        if (!active || !config) return;
        const next: Record<string, number> = {};
        Object.entries(config).forEach(([domainKey, domainConfig]) => {
          next[domainKey] = domainConfig.simulations.length;
        });
        if (active) setCounts(next);
      } catch {
        // Keep null → render skeletons.
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="animate-fade-up delay-100">
      <h2 className="text-2xl font-bold text-foreground mb-8">Simulation Domains</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DOMAIN_ORDER.map((slug) => {
          const style = DOMAIN_STYLES[slug];
          const Icon = style.icon;
          const count = counts?.[slug];
          const loaded = count !== undefined;

          return (
            <Link
              key={slug}
              href={`/dashboard/simulations/${slug}`}
              className={`sci-panel rounded-xl p-6 border transition-all cursor-pointer group ${style.border} hover:border-white/20`}
            >
              <div className="flex items-center justify-between mb-4">
                <Icon size={24} className={`transition-transform group-hover:scale-110 ${style.text}`} />
                {loaded ? (
                  <span className="text-[9px] uppercase tracking-widest font-black text-muted-foreground px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                    {count} Labs
                  </span>
                ) : (
                  <span className="h-5 w-12 rounded-full bg-white/5 animate-pulse" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-white transition-colors">{style.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {loaded ? `${count} active laboratories ready to explore.` : "Loading domain configurations…"}
              </p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
