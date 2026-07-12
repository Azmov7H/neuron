import { Rocket, BookOpen, FlaskConical, Star, LucideIcon } from "lucide-react";

export interface DiscoveryItem {
  icon: LucideIcon;
  title: string;
  desc: string;
  time: string;
  color: string;
}

const streamItems: DiscoveryItem[] = [
  { icon: Rocket, title: "New Path Released", desc: "The Mathematics of Consciousness is now available.", time: "2h ago", color: "text-blue-400" },
  { icon: BookOpen, title: "Concept Unlocked", desc: "Non-locality has been added to the knowledge base.", time: "5h ago", color: "text-emerald-400" },
  { icon: FlaskConical, title: "Simulation Update", desc: "Quantum State Visualizer v2.0 is live.", time: "1d ago", color: "text-purple-400" },
  { icon: Star, title: "Research Highlight", desc: "New paper on neural correlates of consciousness.", time: "2d ago", color: "text-amber-400" },
];

export function DiscoveryStream({ items = streamItems }: { items?: DiscoveryItem[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-foreground mb-6">Discovery Stream</h2>
      <div className="glass rounded-2xl p-6 glow-border h-full">
        <div className="space-y-6">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="flex items-start gap-4 group cursor-pointer">
                <div className={`mt-1 ${item.color}`}><Icon size={18} /></div>
                <div className="flex-1 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                  <h4 className="text-sm font-semibold text-foreground mb-1">{item.title}</h4>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <span className="text-[10px] text-muted-foreground/50 whitespace-nowrap">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
