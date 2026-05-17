import { Unlock, Lightbulb, TrendingUp, CheckCircle, Flame, Star } from "lucide-react";

const getEventIcon = (type: string) => {
  switch (type) {
    case "XP_GAIN":
      return CheckCircle;
    case "STREAK_UPDATE":
      return Flame;
    case "RANK_UP":
      return TrendingUp;
    default:
      return Star;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case "XP_GAIN":
      return "text-emerald-400";
    case "STREAK_UPDATE":
      return "text-amber-400";
    case "RANK_UP":
      return "text-purple-400";
    default:
      return "text-blue-400";
  }
};

export function EvolutionTimeline({ logs }: { logs: any[] }) {
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="glass rounded-2xl p-8 glow-border animate-fade-up delay-200">
      <h3 className="text-lg font-semibold text-foreground mb-8">Evolution Timeline</h3>
      
      <div className="relative pl-8">
        <div className="absolute left-3 top-2 bottom-2 w-px bg-gradient-to-b from-primary/50 via-white/10 to-transparent" />

        <div className="space-y-8">
          {logs && logs.length > 0 ? (
            logs.map((event, idx) => {
              const Icon = getEventIcon(event.type);
              const colorClass = getEventColor(event.type);
              
              return (
                <div key={event._id || idx} className="relative flex items-start gap-6 group">
                  <div className={`absolute -left-8 mt-1 p-1 rounded-full bg-background z-10 ${colorClass}`}>
                    <Icon size={16} />
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <p className="text-sm font-medium text-foreground">{event.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {event.type.toLowerCase().replace('_', ' ')} {event.xp > 0 ? `• +${event.xp} XP` : ''}
                    </p>
                  </div>
                  
                  <span className="text-xs text-muted-foreground/50 whitespace-nowrap">
                    {getRelativeTime(event.createdAt)}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">No recent evolutionary steps recorded yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}