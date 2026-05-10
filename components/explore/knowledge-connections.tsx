// components/explore/knowledge-connections.tsx
import { Network } from "lucide-react";

export function KnowledgeConnections() {
  return (
    <section className="glass rounded-2xl p-8 glow-border animate-fade-up delay-500">
      <div className="flex items-center gap-3 mb-8">
        <Network className="text-primary" size={20} />
        <h2 className="text-2xl font-bold text-foreground">Knowledge Connections</h2>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 py-8">
        <div className="glass px-6 py-4 rounded-xl border border-primary/20 text-center shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <p className="text-sm font-semibold text-foreground">Quantum Mechanics</p>
        </div>

        {/* Connecting Line SVG */}
        <div className="hidden md:block relative w-24 h-px">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/50 to-secondary/50" />
          <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-primary -translate-y-1/2 animate-pulse" />
          <div className="absolute top-1/2 right-0 w-2 h-2 rounded-full bg-secondary -translate-y-1/2 animate-pulse delay-500" />
        </div>
        <div className="md:hidden relative w-px h-12">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/50 to-secondary/50" />
          <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-primary -translate-x-1/2 animate-pulse" />
          <div className="absolute bottom-0 left-1/2 w-2 h-2 rounded-full bg-secondary -translate-x-1/2 animate-pulse delay-500" />
        </div>

        <div className="glass px-6 py-4 rounded-xl border border-secondary/20 text-center shadow-[0_0_15px_rgba(139,92,246,0.1)]">
          <p className="text-sm font-semibold text-foreground">Information Theory</p>
        </div>

        <div className="hidden md:block relative w-24 h-px">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/50 to-accent/50" />
          <div className="absolute top-1/2 left-0 w-2 h-2 rounded-full bg-secondary -translate-y-1/2 animate-pulse delay-200" />
          <div className="absolute top-1/2 right-0 w-2 h-2 rounded-full bg-accent -translate-y-1/2 animate-pulse delay-700" />
        </div>
        <div className="md:hidden relative w-px h-12">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/50 to-accent/50" />
          <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-secondary -translate-x-1/2 animate-pulse delay-200" />
          <div className="absolute bottom-0 left-1/2 w-2 h-2 rounded-full bg-accent -translate-x-1/2 animate-pulse delay-700" />
        </div>

        <div className="glass px-6 py-4 rounded-xl border border-accent/20 text-center shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <p className="text-sm font-semibold text-foreground">Artificial Intelligence</p>
        </div>
      </div>
    </section>
  );
}