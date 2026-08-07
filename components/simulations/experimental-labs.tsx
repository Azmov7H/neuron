"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FlaskConical } from "lucide-react";
import { DOMAIN_STYLES, isInteractiveSim } from "./constants";
import { fetchSimulationConfig } from "./simulation-config-client";

interface ConceptualLab {
  id: string;
  name: string;
  desc: string;
  domain: string;
}

export function ExperimentalLabs() {
  const [labs, setLabs] = useState<ConceptualLab[] | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const config = await fetchSimulationConfig();
        if (!active || !config) return;
        const collected: ConceptualLab[] = [];
        Object.entries(config).forEach(([domainKey, domainConfig]) => {
          domainConfig.simulations.forEach((s) => {
            if (!isInteractiveSim(s.id)) {
              collected.push({ id: s.id, name: s.name, desc: s.desc ?? "", domain: domainKey });
            }
          });
        });
        if (active) setLabs(collected);
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
    <section className="animate-fade-up delay-300">
      <div className="flex items-center gap-3 mb-6">
        <FlaskConical className="text-secondary" size={20} />
        <h2 className="text-2xl font-bold text-foreground">Conceptual Laboratories</h2>
        {labs && (
          <span className="text-[10px] uppercase tracking-widest font-black text-muted-foreground px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
            {labs.length} Telemetry Modes
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {labs === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sci-panel rounded-xl p-6 border border-white/5 h-32 animate-pulse" />
            ))
          : labs.map((lab) => {
              const style = DOMAIN_STYLES[lab.domain];
              return (
                <Link
                  key={lab.id}
                  href={`/dashboard/simulations/${lab.id}`}
                  className={`sci-panel rounded-xl p-6 border transition-all cursor-pointer group hover:border-white/20 ${style?.border || "border-white/5"}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${style?.text || "text-muted-foreground"} ${style?.bg || "bg-white/5"} ${style?.border || "border-white/10"}`}>
                      <FlaskConical size={8} /> Conceptual
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-white transition-colors">{lab.name}</h3>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{lab.desc}</p>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
