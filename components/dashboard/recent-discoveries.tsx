// components/dashboard/recent-discoveries.tsx
import { Bookmark, FlaskConical, Lightbulb } from "lucide-react";

const discoveries = [
  { icon: Lightbulb, title: "Fermi Paradox", desc: "Saved from Cosmology Path", time: "2h ago" },
  { icon: FlaskConical, title: "Mitochondria Sim", desc: "Completed simulation run", time: "5h ago" },
  { icon: Bookmark, title: "Gödel's Incompleteness", desc: "Bookmarked for later", time: "1d ago" },
];

export function RecentDiscoveries() {
  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-6">Recent Discoveries</h3>
      <div className="space-y-4">
        {discoveries.map((d) => (
          <div key={d.title} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
            <div className="p-2 rounded-lg bg-white/5 text-muted-foreground group-hover:text-foreground transition-colors">
              <d.icon size={18} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground">{d.title}</h4>
              <p className="text-xs text-muted-foreground">{d.desc}</p>
            </div>
            <span className="text-xs text-muted-foreground/50">{d.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}