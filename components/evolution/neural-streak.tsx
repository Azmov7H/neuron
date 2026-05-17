import { Flame } from "lucide-react";

export function NeuralStreak({ streak }: { streak: number }) {
  const streakDays = streak || 0;
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  return (
    <div className="glass rounded-2xl p-8 glow-border h-full flex flex-col animate-fade-up delay-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Neural Continuity</h3>
        <div className="flex items-center gap-2 text-amber-400">
          <Flame size={16} />
          <span className="text-sm font-bold">{streakDays} Days</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {/* Subtle Glowing Line Visualization */}
        <div className="flex items-end gap-1 h-16 mb-4">
          {days.map((day) => {
            const isActive = day <= streakDays;
            const isCurrent = day === streakDays;
            return (
              <div 
                key={day} 
                className={`flex-1 rounded-t-sm transition-all ${
                  isActive ? "bg-gradient-to-t from-amber-500/50 to-amber-400/20" : "bg-white/5"
                } ${isCurrent ? "shadow-[0_0_10px_rgba(245,158,11,0.5)] ring-1 ring-amber-400/50" : ""}`}
                style={{ height: isActive ? `${40 + Math.sin(day) * 30 + 30}%` : "20%" }}
              />
            );
          })}
        </div>
        
        <p className="text-xs text-muted-foreground text-center">
          Maintain your neural continuity to boost cognitive retention.
        </p>
      </div>
    </div>
  );
}