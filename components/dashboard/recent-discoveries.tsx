import { Bookmark, FlaskConical, Lightbulb, Brain } from "lucide-react";
import type { DashboardSummary } from "@/app/api/dashboard/summary/route";

// A small helper to select an icon based on domain if we don't have it explicitly
function getIconForDomain(domain: string) {
  if (domain.toLowerCase().includes("physic")) return FlaskConical;
  if (domain.toLowerCase().includes("ai") || domain.toLowerCase().includes("neural")) return Brain;
  return Lightbulb;
}

export function RecentDiscoveries({ discoveries }: { discoveries: DashboardSummary["recentDiscoveries"] }) {
  if (!discoveries || discoveries.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-6">Recent Discoveries</h3>
        <div className="glass p-6 rounded-xl text-center text-sm text-muted-foreground">
          No recent discoveries found. Keep exploring!
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-6">Recent Discoveries</h3>
      <div className="space-y-4">
        {discoveries.map((d, i) => {
          const Icon = getIconForDomain(d.domain);
          // Fallback simple time formatting if date is provided
          const timeLabel = new Date(d.discoveredAt).toLocaleDateString();

          return (
            <div key={`${d.concept}-${i}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group">
              <div className="p-2 rounded-lg bg-white/5 text-muted-foreground group-hover:text-foreground transition-colors">
                <Icon size={18} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-foreground">{d.concept}</h4>
                <p className="text-xs text-muted-foreground capitalize">{d.domain}</p>
              </div>
              <span className="text-xs text-muted-foreground/50">{timeLabel}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}