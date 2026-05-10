// components/matrix/matrix-hud.tsx
"use client";

import { useMatrixStore } from "./matrix-store";
import { nodes, domainColors } from "@/lib/matrix-data";
import { X, Sparkles, ExternalLink } from "lucide-react";

export function MatrixHUD() {
  const { selectedNodeId, setSelectedNode } = useMatrixStore();
  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 p-6 flex flex-col justify-between">
      {/* Top HUD */}
      <div className="pointer-events-auto flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight drop-shadow-lg">Knowledge Matrix</h1>
          <p className="text-xs text-muted-foreground mt-1">Navigate the interconnected web of knowledge</p>
        </div>
        
        {/* Legend */}
        <div className="glass rounded-xl p-4 border border-white/10 hidden md:block">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Domains</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(domainColors).map(([domain, color]) => (
              <div key={domain} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-foreground">{domain}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Info Panel (Right) */}
      {selectedNode && (
        <div className="pointer-events-auto absolute top-1/2 right-6 -translate-y-1/2 w-80 glass rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)] border-primary/20 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest font-semibold px-2 py-0.5 rounded-full border" style={{ color: domainColors[selectedNode.domain], borderColor: domainColors[selectedNode.domain] + "50", backgroundColor: domainColors[selectedNode.domain] + "10" }}>
              {selectedNode.domain}
            </span>
            <button onClick={() => setSelectedNode(null)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-2">{selectedNode.title}</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{selectedNode.description}</p>

          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Connected Concepts</p>
            <div className="flex flex-wrap gap-2">
              {selectedNode.connections.map(connId => {
                const connNode = nodes.find(n => n.id === connId);
                if (!connNode) return null;
                return (
                  <button 
                    key={connId} 
                    onClick={() => setSelectedNode(connId)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all"
                  >
                    {connNode.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Spark Insight */}
          <div className="bg-secondary/5 border border-secondary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-secondary" />
              <span className="text-[10px] uppercase tracking-widest text-secondary font-semibold">Spark Insight</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">
              {selectedNode.title} forms a critical bridge between {selectedNode.domain} and {nodes.find(n => n.id === selectedNode.connections[0])?.domain || 'other domains'}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}